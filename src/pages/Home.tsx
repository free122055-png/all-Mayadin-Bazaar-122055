import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { 
  ChevronRight, ShoppingBasket, Sparkles, Shirt, Gift, ShoppingBag, 
  Moon, Headphones, BookOpen, Timer, Truck, Package, ShoppingBag as BagIcon,
  CheckCircle2, Utensils
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { SEO } from "../components/SEO";
import { StorefrontFacade } from "../components/StorefrontFacade";
import heroBannerImg from "../assets/images/mayadin_hero_banner_1788164624823.jpg";

import { db } from "../lib/firebase";
import { getApiUrl } from "../lib/api";
import { collection, onSnapshot, query, orderBy, where, limit, doc, updateDoc } from "firebase/firestore";

import { useAuth } from "../context/AuthContext";

const ActiveOrderWidget: React.FC = React.memo(() => {
  const { user } = useAuth();
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState("");

  const syncStatus = useCallback(async (orderData: any) => {
    try {
      const response = await fetch(getApiUrl(`/api/delivery/steadfast/track/${orderData.deliveryInfo?.trackingId}`));
      if (!response.ok) return;
      
      const result = await response.json();
      if (result.status === 200) {
        const orderRef = doc(db, "food_orders", orderData.id);
        
        const mapSteadfastStatus = (steadfastStatus: string) => {
          const s = steadfastStatus.toLowerCase();
          if (s.includes('pending')) return 'pickup_pending';
          if (s.includes('picked')) return 'picked_up';
          if (s.includes('transit')) return 'in_transit';
          if (s.includes('delivered')) return 'delivered';
          if (s.includes('return')) return 'returned';
          if (s.includes('cancel')) return 'cancelled';
          if (s.includes('fail')) return 'failed';
          return 'created';
        };

        const newStatus = mapSteadfastStatus(result.delivery_status);
        if (newStatus !== orderData.deliveryInfo?.status) {
          await updateDoc(orderRef, {
            "deliveryInfo.status": newStatus,
            "deliveryInfo.lastUpdated": Date.now(),
            "internalStatus": newStatus === 'delivered' ? 'completed' : 
                             (newStatus === 'cancelled' || newStatus === 'failed' || newStatus === 'returned' ? 'cancelled' : orderData.internalStatus),
            "updatedAt": Date.now()
          });
        }
      }
    } catch (error) {
      console.error("Status Sync Error:", error);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setActiveOrder(null);
      return;
    }

    const q = query(
      collection(db, "food_orders"),
      where("userId", "==", user.uid),
      where("internalStatus", "in", ["placed", "confirmed", "processing", "shipped"]),
      orderBy("createdAt", "desc"),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        if (!snapshot.empty) {
          const data = snapshot.docs[0].data();
          const orderData = { id: snapshot.docs[0].id, ...data } as any;
          setActiveOrder(orderData);
          
          if (orderData.deliveryInfo?.trackingId && orderData.deliveryInfo.status !== 'delivered' && orderData.deliveryInfo.status !== 'cancelled') {
            syncStatus(orderData);
          }
        } else {
          setActiveOrder(null);
        }
      },
      (error) => {
        console.warn("ActiveOrderWidget listener error:", error);
        setActiveOrder(null);
      }
    );

    return () => unsubscribe();
  }, [user, syncStatus]);

  useEffect(() => {
    if (!activeOrder) return;

    const calculateTime = () => {
      const now = Date.now();
      const createdTime = activeOrder.createdAt?.seconds 
        ? activeOrder.createdAt.seconds * 1000 
        : (typeof activeOrder.createdAt === 'number' ? activeOrder.createdAt : now);
      
      const totalTime = 40 * 60 * 1000;
      const elapsed = now - createdTime;
      const remaining = totalTime - elapsed;

      if (remaining <= 0) {
        setTimeLeft("শীঘ্রই আসছে");
      } else {
        const mins = Math.floor(remaining / (1000 * 60));
        const secs = Math.floor((remaining % (1000 * 60)) / 1000);
        setTimeLeft(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
      }
    };

    const timer = setInterval(calculateTime, 1000);
    calculateTime();
    return () => clearInterval(timer);
  }, [activeOrder]);

  if (!activeOrder) return null;

  const steps = [
    { key: 'placed', icon: BagIcon },
    { key: 'confirmed', icon: Utensils },
    { key: 'processing', icon: Package },
    { key: 'shipped', icon: Truck },
    { key: 'completed', icon: CheckCircle2 }
  ];

  const currentIndex = steps.findIndex(s => s.key === activeOrder.internalStatus);

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-4 sm:px-6 mb-4"
    >
      <Link 
        to={`/order/${activeOrder.id}`}
        className="block bg-white rounded-[24px] p-4 border border-emerald-100 shadow-[0_8px_20px_rgba(16,185,129,0.08)] relative overflow-hidden group active:scale-[0.98] transition-all"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/30 via-transparent to-emerald-50/30 animate-pulse"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center">
                <Timer className="w-5 h-5 text-emerald-600 animate-pulse" />
              </div>
              <div>
                <p className="text-[9px] font-black text-emerald-600/60 uppercase tracking-widest leading-none mb-1">আপনার অর্ডারটি আসছে</p>
                <h4 className="text-sm font-black text-gray-900 flex items-center gap-2">
                  পৌঁছাতে বাকি: <span className="text-emerald-600 font-mono text-base">{timeLeft}</span>
                </h4>
              </div>
            </div>
            <div className="bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100/50">
               <span className="text-[10px] font-black text-emerald-700">অর্ডার #{activeOrder.orderNumber}</span>
            </div>
          </div>
          <div className="relative h-1.5 bg-gray-100 rounded-full overflow-hidden mb-1">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
              className="absolute top-0 left-0 h-full bg-emerald-500"
            ></motion.div>
          </div>
          <div className="flex justify-between mt-2">
            {steps.map((step, idx) => {
              const isActive = idx === currentIndex;
              const isCompleted = idx < currentIndex;
              const Icon = step.icon;
              return (
                <div key={step.key} className="flex flex-col items-center gap-1">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                    isActive ? 'bg-emerald-500 text-white shadow-md' : 
                    isCompleted ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-50 text-gray-300'
                  }`}>
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'animate-bounce' : ''}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Link>
    </motion.div>
  );
});

interface CategoryCard {
  id: string;
  title: string;
  count: string;
  image: string;
  iconBg: string;
  icon: React.ComponentType<{ className?: string }>;
  link: string;
}

const bannerSlides = [
  {
    id: "slide1",
    tagline: "বিশুদ্ধ পণ্যের নতুন ঠিকানা",
    brandTitlePart1: "ALL MAYADIN",
    brandTitlePart2: "BAZAR",
    subtitle: "সেরা পণ্য • সেরা দাম • সেরা সেবা",
    buttonText: "এখনই কেনাকাটা করুন",
    image: heroBannerImg,
    link: "/categories",
  },
  {
    id: "slide2",
    tagline: "তাজা ও স্বাস্থ্যকর খাবার",
    brandTitlePart1: "FRESH & ORGANIC",
    brandTitlePart2: "FOOD",
    subtitle: "ন্যায্য মূল্যে খাঁটি খাদ্য ও মুদি পণ্য",
    buttonText: "খাদ্য বাজার দেখুন",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=900&q=80",
    link: "/category/cat1",
  },
  {
    id: "slide3",
    tagline: "এক্সক্লুসিভ ফ্যাশন ও কালেকশন",
    brandTitlePart1: "FASHION &",
    brandTitlePart2: "LIFESTYLE",
    subtitle: "সেরা ব্র্যান্ডের আধুনিক পোশাক ও ব্যাগ",
    buttonText: "কালেকশন দেখুন",
    image: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=900&q=80",
    link: "/category/cat3",
  },
  {
    id: "slide4",
    tagline: "স্মার্ট ডিভাইস ও গ্যাজেট",
    brandTitlePart1: "SMART TECH &",
    brandTitlePart2: "ELECTRONICS",
    subtitle: "১০০% অরিজিনাল ইলেকট্রনিক্স ও এক্সেসরিজ",
    buttonText: "এক্সপ্লোর করুন",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=900&q=80",
    link: "/category/cat7",
  }
];

const mainCategories: CategoryCard[] = [
  {
    id: "cat1",
    title: "খাদ্য বাজার",
    count: "1200+ পণ্য",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80",
    iconBg: "bg-[#00a86b]",
    icon: ShoppingBasket,
    link: "/category/cat1"
  },
  {
    id: "cat2",
    title: "রুপসজ্জা বাজার",
    count: "850+ পণ্য",
    image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&q=80",
    iconBg: "bg-[#ec4899]",
    icon: Sparkles,
    link: "/category/cat2"
  },
  {
    id: "cat3",
    title: "কাপড় ও পরিধান",
    count: "3200+ পণ্য",
    image: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=600&q=80",
    iconBg: "bg-[#0284c7]",
    icon: Shirt,
    link: "/category/cat3"
  },
  {
    id: "cat4",
    title: "উপহার বাজার",
    count: "650+ পণ্য",
    image: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&q=80",
    iconBg: "bg-[#f97316]",
    icon: Gift,
    link: "/category/cat4"
  },
  {
    id: "cat5",
    title: "ব্যাগ ও ফ্যাশন",
    count: "950+ পণ্য",
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&q=80",
    iconBg: "bg-[#a855f7]",
    icon: ShoppingBag,
    link: "/category/cat5"
  },
  {
    id: "cat6",
    title: "ইসলামিক বাজার",
    count: "780+ পণ্য",
    image: "https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=600&q=80",
    iconBg: "bg-[#059669]",
    icon: Moon,
    link: "/category/cat6"
  },
  {
    id: "cat7",
    title: "ইলেকট্রনিক্স...",
    count: "1450+ পণ্য",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80",
    iconBg: "bg-[#0d9488]",
    icon: Headphones,
    link: "/category/cat7"
  },
  {
    id: "cat8",
    title: "বই ও শিক্ষা বাজার",
    count: "1100+ পণ্য",
    image: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&q=80",
    iconBg: "bg-[#2563eb]",
    icon: BookOpen,
    link: "/category/cat8"
  }
];

export const Home: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [customIcons, setCustomIcons] = useState<Record<string, string>>({});
  const [activeBanners, setActiveBanners] = useState<any[]>(bannerSlides);
  const [categoryVisibility, setCategoryVisibility] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const unsubIcons = onSnapshot(collection(db, "category_icons"), 
      (snapshot) => {
        const data: Record<string, string> = {};
        snapshot.docs.forEach(doc => {
          data[doc.id] = doc.data().image;
        });
        setCustomIcons(data);
      },
      (error) => console.warn("Icons listener error:", error)
    );

    const unsubVisibility = onSnapshot(doc(db, "settings", "category_visibility"),
      (snap) => {
        if (snap.exists()) {
          setCategoryVisibility(snap.data() as Record<string, boolean>);
        }
      },
      (error) => console.warn("Visibility listener error:", error)
    );

    const unsubBanners = onSnapshot(
      query(collection(db, "main_banners"), orderBy("order", "asc")), 
      (snapshot) => {
        if (!snapshot.empty) {
          setActiveBanners(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } else {
          setActiveBanners(bannerSlides);
        }
      },
      (error) => {
        console.warn("Banners listener error:", error);
        setActiveBanners(bannerSlides);
      }
    );

    return () => {
      unsubIcons();
      unsubVisibility();
      unsubBanners();
    };
  }, []);

  const visibleCategories = useMemo(() => {
    return mainCategories.filter(cat => categoryVisibility[cat.id] !== false);
  }, [categoryVisibility]);

  useEffect(() => {
    if (activeBanners.length === 0) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % activeBanners.length);
    }, 3000);
    
    return () => clearInterval(timer);
  }, [activeBanners.length]);

  const slide = activeBanners[currentSlide];

  return (
    <div className="flex flex-col space-y-3 sm:space-y-4 select-none">
      <SEO 
        title="All Mayadin Bazar - বিশুদ্ধ পণ্যের নতুন ঠিকানা" 
        description="All Mayadin Bazar - সেরা পণ্য, সেরা দাম, সেরা সেবা।" 
      />

      <ActiveOrderWidget />

      {/* 1. Super Shop Storefront Facade */}
      <section className="relative shrink-0">
        <StorefrontFacade />
      </section>

      {/* 2. Promotional Banner Slider (Auto changing every 3 seconds) */}
      <section className="relative px-3.5 sm:px-6 shrink-0">
        <div className="relative w-full aspect-[21/8.5] sm:aspect-[4/1] rounded-[20px] sm:rounded-[24px] overflow-hidden shadow-md bg-gray-100 border border-white/80 group">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="absolute inset-0 w-full h-full"
            >
              <Link 
                to={slide.link} 
                className="block w-full h-full relative cursor-pointer"
                title={slide.brandTitlePart1 || "অফার দেখুন"}
              >
                <img 
                  src={slide.image} 
                  alt="Banner" 
                  className="w-full h-full object-cover object-center group-hover:scale-[1.02] transition-transform duration-500"
                />
              </Link>

              {/* Bottom Center Pagination Dots */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-black/25 px-2.5 py-1 rounded-full backdrop-blur-xs">
                {activeBanners.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setCurrentSlide(idx);
                    }}
                    className={`transition-all duration-300 rounded-full ${
                      currentSlide === idx 
                        ? "w-4 h-1.5 bg-[#ffb703] shadow-xs" 
                        : "w-1.5 h-1.5 bg-white/60 hover:bg-white"
                    }`}
                    aria-label={`Slide ${idx + 1}`}
                  />
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* 3. Main Marketplace Categories Section (আমাদের প্রধান বাজার সমূহ - ঠিক স্ক্রিনশটের মতো) */}
      <section className="flex flex-col space-y-2 px-3.5 sm:px-6">
        {/* Section Title with Emerald Underline Bar */}
        <div className="space-y-1 shrink-0">
          <h2 className="text-sm sm:text-base md:text-lg font-black text-[#0f172a] tracking-tight">
            আমাদের প্রধান বাজার সমূহ
          </h2>
          <div className="w-12 h-1 bg-[#008a5c] rounded-full"></div>
        </div>

        {/* 4 in a line, 2 rows (Total 8 categories) - Matches Screenshot */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {visibleCategories.map((cat) => {
            const IconComp = cat.icon;
            const displayImage = customIcons[cat.id] || cat.image;

            return (
              <Link
                key={cat.id}
                to={cat.link}
                style={{ touchAction: "manipulation" }}
                className="bg-white rounded-[20px] sm:rounded-[24px] border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-1.5 sm:p-2 flex flex-col items-center text-center group active:scale-90 hover:shadow-md transition-transform duration-75 relative select-none cursor-pointer"
              >
                {/* Product/Category Photo */}
                <div className="w-full aspect-square rounded-[16px] sm:rounded-[18px] overflow-hidden bg-gray-50 relative">
                  <img
                    src={displayImage}
                    alt={cat.title}
                    loading="eager"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                </div>

                {/* Floating Colorful Circular Icon Badge */}
                <div className="relative -mt-3.5 sm:-mt-4 z-10">
                  <div className={`w-7 h-7 sm:w-8 sm:h-8 ${cat.iconBg} text-white rounded-full flex items-center justify-center shadow-md border-2 border-white`}>
                    <IconComp className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2]" />
                  </div>
                </div>

                {/* Title & Product Count */}
                <div className="mt-1 mb-0.5 px-0.5 flex flex-col items-center w-full">
                  <h3 className="text-[10.5px] sm:text-[12px] font-black text-gray-900 leading-tight truncate w-full text-center">
                    {cat.title}
                  </h3>
                  <span className="text-[8.5px] sm:text-[10px] font-medium text-gray-400 leading-none truncate w-full text-center mt-0.5">
                    {cat.count}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
};
