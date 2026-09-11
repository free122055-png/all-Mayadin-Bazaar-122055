import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  ArrowLeft, ShoppingCart, ShoppingBag, Sparkles, CheckCircle2, 
  Clock, ShieldCheck, Truck, Phone, Star, Tag, ChevronRight,
  Plus, Minus, Check, MapPin, User, MessageCircle, AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { SEO } from "../components/SEO";
import { db } from "../lib/firebase";
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { CategoryBanners, CategoryBannerItem, INITIAL_CATEGORY_BANNERS } from "../components/admin/BannerManagement";

export const BannerOfferPage: React.FC = () => {
  const { bannerId } = useParams<{ bannerId: string }>();
  const navigate = useNavigate();
  const { addItem, totalItems } = useCart();
  const { profile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<CategoryBannerItem | null>(null);
  const [categoryName, setCategoryName] = useState("স্পেশাল অফার");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Form State for Fast Order
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [deliveryArea, setDeliveryArea] = useState<"dhaka" | "outside">("dhaka");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "bkash" | "nagad" | "rocket">("cod");
  const [quantity, setQuantity] = useState(1);
  const [orderNote, setOrderNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccessData, setOrderSuccessData] = useState<any | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Countdown timer for urgency
  const [timeLeft, setTimeLeft] = useState({ hours: 14, minutes: 32, seconds: 45 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 12, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-fill logged in user info
  useEffect(() => {
    if (profile) {
      if (profile.name) setCustomerName(profile.name);
      if (profile.phone) setCustomerPhone(profile.phone);
      if (profile.address) setCustomerAddress(profile.address);
    }
  }, [profile]);

  // Fetch Banner data from Firestore or Fallback Initial Banners
  useEffect(() => {
    const loadBanner = async () => {
      setLoading(true);
      try {
        let matchedBanner: CategoryBannerItem | null = null;
        let matchedCategoryName = "স্পেশাল অফার";

        // Try local storage first for quick response
        const cached = localStorage.getItem("almayadin_category_banners");
        let allCategories: CategoryBanners[] = cached ? JSON.parse(cached) : INITIAL_CATEGORY_BANNERS;

        // Try Firestore
        try {
          const docRef = doc(db, "app_settings", "category_banners");
          const snap = await getDoc(docRef);
          if (snap.exists() && snap.data().categories) {
            allCategories = snap.data().categories as CategoryBanners[];
            localStorage.setItem("almayadin_category_banners", JSON.stringify(allCategories));
          }
        } catch (e) {
          console.warn("Firestore banner fetch notice:", e);
        }

        // Find banner by ID or partial match
        for (const cat of allCategories) {
          const found = cat.banners.find(b => b.id === bannerId || b.id.includes(bannerId || ""));
          if (found) {
            matchedBanner = found;
            matchedCategoryName = cat.categoryNameBn;
            break;
          }
        }

        // If not found, use first banner as default template
        if (!matchedBanner && allCategories.length > 0 && allCategories[0].banners.length > 0) {
          matchedBanner = allCategories[0].banners[0];
          matchedCategoryName = allCategories[0].categoryNameBn;
        }

        if (matchedBanner) {
          setBanner(matchedBanner);
          setCategoryName(matchedCategoryName);
        }
      } catch (err) {
        console.error("Error loading banner details:", err);
      } finally {
        setLoading(false);
      }
    };

    loadBanner();
  }, [bannerId]);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-3 px-4">
        <div className="w-12 h-12 border-4 border-[#004b23] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-black text-gray-700">স্পেশাল অফার পেজ লোড হচ্ছে...</p>
      </div>
    );
  }

  if (!banner) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4 px-4 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500" />
        <h2 className="text-lg font-black text-gray-900">অফারটি পাওয়া যায়নি</h2>
        <p className="text-xs text-gray-500 max-w-xs">এই অফার ব্যানারটি বর্তমানে উপলব্ধ নেই অথবা মেয়াদ শেষ হয়েছে।</p>
        <Link 
          to="/" 
          className="bg-[#004b23] text-white text-xs font-black px-5 py-2.5 rounded-xl shadow-md active:scale-95 transition-transform"
        >
          হোমে ফিরে যান
        </Link>
      </div>
    );
  }

  // Derive linked product details with smart fallbacks
  const offer = banner.offerProduct;
  const productName = offer?.productName || banner.title;
  const regularPrice = Number(offer?.regularPrice || 950);
  const offerPrice = Number(offer?.offerPrice || 690);
  const discountText = offer?.discountText || banner.discountText || `${Math.round(((regularPrice - offerPrice) / regularPrice) * 100)}% ছাড়`;
  const savings = Math.max(0, regularPrice - offerPrice);
  const unitWeight = offer?.unitWeight || "১ সেট / কম্বো প্যাক";
  const description = offer?.description || banner.subtitle || "প্রিমিয়াম কোয়ালিটির ১০০% খাঁটি ও সেরা মানের নিশ্চয়তা। সীমিত সময়ের বিশেষ অফারে লুফে নিন!";
  const features = offer?.features && offer.features.length > 0 ? offer.features : [
    "১০০% অরিজিনাল ও অথেনটিক পণ্যের নিশ্চয়তা",
    "সীমিত সময়ের স্পেশাল ডিসকাউন্ট ডিল",
    "দ্রুততম সময়ে সারা দেশে নিরাপদ হোম ডেলিভারি",
    "পণ্য হাতে পেয়ে দেখে মূল্য পরিশোধের সুবিধা (Cash on Delivery)"
  ];

  const galleryImages = [
    banner.image,
    ...(offer?.images || [])
  ].filter(Boolean);

  const deliveryFee = offer?.deliveryNote?.includes("ফ্রি") ? 0 : (deliveryArea === "dhaka" ? 60 : 120);
  const subtotal = offerPrice * quantity;
  const grandTotal = subtotal + deliveryFee;

  const handleAddToCart = () => {
    addItem({
      productId: banner.id,
      name: productName,
      price: offerPrice,
      quantity: quantity,
      image: banner.image,
      weight: unitWeight
    });
    setToastMessage(`"${productName}" কার্টে যোগ হয়েছে!`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDirectOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!customerName.trim()) {
      setErrorMsg("অনুগ্রহ করে আপনার পুরো নাম লিখুন");
      return;
    }

    const cleanPhone = customerPhone.replace(/\D/g, "");
    if (cleanPhone.length < 11) {
      setErrorMsg("সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)");
      return;
    }

    if (!customerAddress.trim() || customerAddress.trim().length < 5) {
      setErrorMsg("সম্পূর্ণ ডেলিভারি ঠিকানা বিস্তারিত লিখুন (বাসা/রোড, থানা, জেলা)");
      return;
    }

    setIsSubmitting(true);
    try {
      const orderId = `MB-${Date.now().toString().slice(-6)}`;
      const orderPayload = {
        orderId,
        orderType: "banner_special_offer",
        bannerId: banner.id,
        bannerTitle: banner.title,
        categoryName,
        customerName: customerName.trim(),
        customerPhone: cleanPhone,
        customerAddress: customerAddress.trim(),
        deliveryArea: deliveryArea === "dhaka" ? "ঢাকার ভেতরে" : "ঢাকার বাইরে",
        deliveryFee,
        paymentMethod: paymentMethod.toUpperCase(),
        paymentStatus: "Pending",
        orderStatus: "Processing",
        status: "Processing",
        items: [
          {
            productId: banner.id,
            name: productName,
            price: offerPrice,
            regularPrice,
            quantity,
            image: banner.image,
            unitWeight
          }
        ],
        subtotal,
        total: grandTotal,
        grandTotal,
        orderNote: orderNote.trim(),
        createdAt: Date.now(),
        serverTimestamp: serverTimestamp()
      };

      // Save order to Firestore
      try {
        await addDoc(collection(db, "orders"), orderPayload);
      } catch (dbErr) {
        console.warn("Firestore order write fallback:", dbErr);
      }

      setOrderSuccessData(orderPayload);
    } catch (err: any) {
      console.error("Order submission error:", err);
      setErrorMsg("অর্ডার সম্পন্ন করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#f8f9fa] min-h-screen -mx-4 -mt-4 pb-24 overflow-x-hidden font-sans">
      <SEO title={`${productName} - স্পেশাল ব্যানার অফার`} description={description} />

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-4 right-4 z-[999] max-w-md mx-auto bg-[#004b23] text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center justify-between gap-3 border border-white/20"
          >
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-[#ffb703]" />
              <span className="text-xs font-bold">{toastMessage}</span>
            </div>
            <Link 
              to="/cart" 
              className="bg-[#ffb703] text-black text-[11px] font-black px-3 py-1 rounded-lg shrink-0"
            >
              কার্ট দেখুন
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Bar */}
      <header className="px-4 py-3.5 sticky top-0 bg-[#004b23] text-white z-40 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)} 
            className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center border border-white/20 active:scale-90 transition-transform shrink-0"
            title="ফিরে যান"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <span className="text-[10px] font-bold text-[#ffb703] uppercase tracking-wider block">
              {categoryName}
            </span>
            <h1 className="text-sm font-black text-white leading-none truncate max-w-[200px] sm:max-w-xs">
              ব্যানার স্পেশাল ডিল
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link 
            to="/cart" 
            className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center relative hover:bg-white/20 transition-colors"
          >
            <ShoppingCart className="w-4.5 h-4.5 text-white" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#ffb703] text-black text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-[#004b23]">
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </header>

      {/* Urgency Countdown Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 text-white px-4 py-2 flex items-center justify-between text-xs font-black shadow-inner">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 animate-spin text-yellow-200" />
          <span>সীমিত সময়ের স্পেশাল অফার!</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] bg-black/30 px-2 py-1 rounded-lg">
          <Clock className="w-3.5 h-3.5" />
          <span>
            {String(timeLeft.hours).padStart(2, "0")}:{String(timeLeft.minutes).padStart(2, "0")}:{String(timeLeft.seconds).padStart(2, "0")}
          </span>
        </div>
      </div>

      {orderSuccessData ? (
        /* Order Success View */
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-emerald-200 text-center shadow-lg space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-[#004b23] rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            
            <div>
              <span className="bg-emerald-100 text-[#004b23] text-[10px] font-black px-3 py-1 rounded-full uppercase">
                অর্ডার নিশ্চিত হয়েছে
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 mt-2">
                অভিনন্দন! আপনার অর্ডারটি গ্রহণ করা হয়েছে
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 font-bold mt-1">
                অর্ডার ট্র্যাকিং আইডি: <span className="text-[#004b23] font-black">{orderSuccessData.orderId}</span>
              </p>
            </div>

            <div className="bg-[#f8f9fa] rounded-2xl p-4 text-left text-xs space-y-2 border border-gray-100">
              <div className="flex justify-between font-bold border-b pb-2 text-gray-700">
                <span>পণ্য:</span>
                <span className="text-gray-900 font-black">{orderSuccessData.items[0]?.name} ({orderSuccessData.items[0]?.quantity}টি)</span>
              </div>
              <div className="flex justify-between font-bold border-b pb-2 text-gray-700">
                <span>গ্রাহক:</span>
                <span className="text-gray-900">{orderSuccessData.customerName} ({orderSuccessData.customerPhone})</span>
              </div>
              <div className="flex justify-between font-bold border-b pb-2 text-gray-700">
                <span>ঠিকানা:</span>
                <span className="text-gray-900 text-right max-w-[200px]">{orderSuccessData.customerAddress}</span>
              </div>
              <div className="flex justify-between font-bold border-b pb-2 text-gray-700">
                <span>পেমেন্ট মেথড:</span>
                <span className="text-gray-900 font-black">{orderSuccessData.paymentMethod}</span>
              </div>
              <div className="flex justify-between font-black text-sm pt-1 text-[#004b23]">
                <span>সর্বমোট প্রদেয়:</span>
                <span>৳ {(orderSuccessData.grandTotal || 0).toLocaleString("bn-BD")}</span>
              </div>
            </div>

            <p className="text-[11px] text-gray-500 font-medium">
              খুব শীঘ্রই আমাদের প্রতিনিধি আপনার সাথে ফোনে যোগাযোগ করে অর্ডার কনফার্ম করবেন।
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => navigate("/")}
                className="bg-gray-100 text-gray-800 text-xs font-black py-3 rounded-2xl hover:bg-gray-200 active:scale-95 transition-all"
              >
                আরো কেনাকাটা করুন
              </button>
              <a
                href="https://wa.me/8801878044733"
                target="_blank"
                rel="noreferrer"
                className="bg-[#25D366] text-white text-xs font-black py-3 rounded-2xl flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                হোয়াটসঅ্যাপ সাপোর্ট
              </a>
            </div>
          </div>
        </div>
      ) : (
        /* Main Product Offer & Direct Buy Form View */
        <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 space-y-6">
          
          {/* Top Hero Banner & Image Gallery Card */}
          <div className="bg-white rounded-3xl p-4 sm:p-6 border border-gray-200/80 shadow-sm space-y-4">
            
            {/* Discount Badge & Stock Status */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="bg-rose-500 text-white text-xs font-black px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" />
                {discountText}
              </span>
              <span className="bg-emerald-50 text-[#004b23] border border-emerald-200 text-[11px] font-black px-3 py-1 rounded-xl flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#004b23]" />
                ইন স্টক ({offer?.stock || 45}টি অবশিষ্ট)
              </span>
            </div>

            {/* Product Images Showcase */}
            <div className="space-y-3">
              <div className="w-full aspect-[16/9] sm:aspect-[2/1] rounded-2xl overflow-hidden bg-gray-100 relative shadow-inner">
                <img 
                  src={galleryImages[selectedImageIndex] || banner.image} 
                  alt={productName} 
                  className="w-full h-full object-cover object-center transform hover:scale-105 transition-transform duration-500" 
                />
              </div>

              {galleryImages.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {galleryImages.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                        selectedImageIndex === idx ? "border-[#004b23] scale-105 shadow-md" : "border-gray-200 opacity-70"
                      }`}
                    >
                      <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Title & Pricing */}
            <div className="space-y-2 border-b border-gray-100 pb-4">
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight leading-snug">
                {productName}
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 font-medium">
                {description}
              </p>

              <div className="flex items-baseline flex-wrap gap-x-3 gap-y-1 pt-2">
                <span className="text-2xl sm:text-3xl font-black text-[#004b23]">
                  ৳ {(offerPrice || 0).toLocaleString("bn-BD")}
                </span>
                {regularPrice > offerPrice && (
                  <span className="text-sm sm:text-base font-bold text-gray-400 line-through">
                    ৳ {(regularPrice || 0).toLocaleString("bn-BD")}
                  </span>
                )}
                {savings > 0 && (
                  <span className="bg-emerald-100 text-[#004b23] text-xs font-black px-2.5 py-0.5 rounded-md">
                    সাশ্রয় ৳ {(savings || 0).toLocaleString("bn-BD")}
                  </span>
                )}
                <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                  {unitWeight}
                </span>
              </div>
            </div>

            {/* Key Features & Bullet Points */}
            <div className="space-y-2 pt-1">
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#ffb703]" />
                পণ্যের বিশেষ সুবিধাসমূহ
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {features.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs font-bold text-gray-700 bg-gray-50/80 p-2.5 rounded-xl border border-gray-100">
                    <CheckCircle2 className="w-4 h-4 text-[#004b23] shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Fast Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              {/* Quantity Selector */}
              <div className="flex items-center border-2 border-gray-200 rounded-2xl bg-gray-50 p-1">
                <button
                  type="button"
                  onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                  className="w-8 h-8 rounded-xl bg-white text-gray-700 font-black flex items-center justify-center shadow-xs active:scale-90 transition-transform"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-9 text-center font-black text-sm text-gray-900">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(prev => prev + 1)}
                  className="w-8 h-8 rounded-xl bg-white text-gray-700 font-black flex items-center justify-center shadow-xs active:scale-90 transition-transform"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Add to Cart */}
              <button
                type="button"
                onClick={handleAddToCart}
                className="flex-1 bg-amber-100 hover:bg-amber-200 text-amber-950 font-black py-3 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xs"
              >
                <ShoppingCart className="w-4 h-4" />
                কার্ট-এ যোগ করুন
              </button>
            </div>
          </div>

          {/* Direct Buy & Fast Order Form */}
          <div className="bg-white rounded-3xl p-4 sm:p-6 border-2 border-[#004b23]/30 shadow-md space-y-5">
            <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black bg-[#ffb703] text-black px-2 py-0.5 rounded-md uppercase">
                  সরাসরি অর্ডার ফর্ম
                </span>
                <h2 className="text-lg font-black text-gray-900 mt-1">
                  এই অফার পণ্যটি ক্রয় করতে নিচের ফর্মটি পূরণ করুন
                </h2>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-gray-400 block">মোট প্রদেয়</span>
                <span className="text-lg font-black text-[#004b23]">৳ {(grandTotal || 0).toLocaleString("bn-BD")}</span>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleDirectOrder} className="space-y-4">
              
              {/* Name */}
              <div className="space-y-1">
                <label className="text-xs font-black text-gray-800 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#004b23]" />
                  আপনার পুরো নাম *
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: মোঃ কামরুল হাসান"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-3.5 text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#004b23]/20 focus:border-[#004b23]"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="text-xs font-black text-gray-800 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#004b23]" />
                  মোবাইল নম্বর (১১ ডিজিট) *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="যেমন: 017XXXXXXXX"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-3.5 text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#004b23]/20 focus:border-[#004b23]"
                />
              </div>

              {/* Full Address */}
              <div className="space-y-1">
                <label className="text-xs font-black text-gray-800 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#004b23]" />
                  সম্পূর্ণ ডেলিভারি ঠিকানা (বাসা/রোড, থানা, জেলা) *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="যেমন: বাড়ি নং ১২, রোড নং ৫, ব্লক-বি, মিরপুর-১০, ঢাকা"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3.5 text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#004b23]/20 focus:border-[#004b23]"
                />
              </div>

              {/* Delivery Area Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-gray-800 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-[#004b23]" />
                  ডেলিভারি এলাকা নির্বাচন করুন *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDeliveryArea("dhaka")}
                    className={`p-3 rounded-2xl border-2 text-left transition-all ${
                      deliveryArea === "dhaka"
                        ? "border-[#004b23] bg-emerald-50/50 shadow-xs"
                        : "border-gray-200 bg-gray-50 text-gray-600"
                    }`}
                  >
                    <span className="text-xs font-black block text-gray-900">ঢাকার ভেতরে</span>
                    <span className="text-[11px] font-bold text-[#004b23]">
                      {offer?.deliveryNote?.includes("ফ্রি") ? "ফ্রি ডেলিভারি" : "৳ ৬০ চার্জ"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryArea("outside")}
                    className={`p-3 rounded-2xl border-2 text-left transition-all ${
                      deliveryArea === "outside"
                        ? "border-[#004b23] bg-emerald-50/50 shadow-xs"
                        : "border-gray-200 bg-gray-50 text-gray-600"
                    }`}
                  >
                    <span className="text-xs font-black block text-gray-900">ঢাকার বাইরে</span>
                    <span className="text-[11px] font-bold text-[#004b23]">
                      {offer?.deliveryNote?.includes("ফ্রি") ? "ফ্রি ডেলিভারি" : "৳ ১২০ চার্জ"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-gray-800">
                  পেমেন্ট পদ্ধতি নির্বাচন করুন
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "cod", label: "ক্যাশ অন ডেলিভারি", desc: "হাতে পেয়ে টাকা দিন" },
                    { id: "bkash", label: "বিকাশ (bKash)", desc: "অনলাইন পেমেন্ট" },
                    { id: "nagad", label: "নগদ (Nagad)", desc: "সহজ পেমেন্ট" },
                    { id: "rocket", label: "রকেট (Rocket)", desc: "ডাচ-বাংলা" }
                  ].map((pm) => (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => setPaymentMethod(pm.id as any)}
                      className={`p-2.5 rounded-xl border-2 text-center transition-all ${
                        paymentMethod === pm.id
                          ? "border-[#004b23] bg-emerald-50 text-[#004b23] font-black"
                          : "border-gray-200 bg-gray-50 text-gray-700 font-bold"
                      }`}
                    >
                      <span className="text-[11px] block">{pm.label}</span>
                      <span className="text-[9px] text-gray-400 block">{pm.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Order Note */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-600">
                  স্পেশাল নোট বা সাইজ/কালার পছন্দ (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  placeholder="যেমন: লাল কালার পাঠাবেন / দ্রুত ডেলিভারি চাই"
                  value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#004b23]"
                />
              </div>

              {/* Cost Summary Breakdown */}
              <div className="bg-gray-50 rounded-2xl p-3.5 space-y-1.5 text-xs font-bold text-gray-700 border border-gray-100">
                <div className="flex justify-between">
                  <span>পণ্যের মূল্য ({quantity}টি):</span>
                  <span>৳ {(subtotal || 0).toLocaleString("bn-BD")}</span>
                </div>
                <div className="flex justify-between">
                  <span>ডেলিভারি চার্জ:</span>
                  <span>{deliveryFee === 0 ? "ফ্রি" : `৳ ${deliveryFee}`}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-2 text-sm font-black text-gray-900">
                  <span>সর্বমোট প্রদেয়:</span>
                  <span className="text-[#004b23]">৳ {(grandTotal || 0).toLocaleString("bn-BD")}</span>
                </div>
              </div>

              {/* Big Confirm Order Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#004b23] hover:bg-[#00381a] text-white font-black py-4 px-6 rounded-2xl text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg hover:shadow-xl active:scale-95 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <ShoppingBag className="w-5 h-5 text-[#ffb703]" />
                    <span>অর্ডারটি নিশ্চিত করুন (৳ {(grandTotal || 0).toLocaleString("bn-BD")})</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Guarantee Badges */}
          <div className="grid grid-cols-3 gap-2 text-center pt-2">
            <div className="bg-white p-3 rounded-2xl border border-gray-100 space-y-1">
              <ShieldCheck className="w-5 h-5 text-[#004b23] mx-auto" />
              <p className="text-[11px] font-black text-gray-900">১০০% খাঁটি পণ্য</p>
              <p className="text-[9px] text-gray-400">কোয়ালিটি গ্যারান্টি</p>
            </div>
            <div className="bg-white p-3 rounded-2xl border border-gray-100 space-y-1">
              <Truck className="w-5 h-5 text-[#004b23] mx-auto" />
              <p className="text-[11px] font-black text-gray-900">দ্রুত ডেলিভারি</p>
              <p className="text-[9px] text-gray-400">সারা বাংলাদেশে</p>
            </div>
            <div className="bg-white p-3 rounded-2xl border border-gray-100 space-y-1">
              <Phone className="w-5 h-5 text-[#004b23] mx-auto" />
              <p className="text-[11px] font-black text-gray-900">২৪/৭ সাপোর্ট</p>
              <p className="text-[9px] text-gray-400">কাস্টমার হেল্পলাইন</p>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
