import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { SEO } from "../components/SEO";
import { AnimatedSearchInput } from "../components/AnimatedSearchInput";
import { db } from "../lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

const mainMarketCategories = [
  { id: "cat1", name: "Food Market", nameBn: "খাদ্য বাজার", subtitle: "তাজা খাবার ও নিত্যপ্রয়োজনীয় পণ্য", image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80", count: "১০০+ পণ্য", color: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  { id: "cat2", name: "Beauty & Grooming", nameBn: "রূপসজ্জা বাজার", subtitle: "সৌন্দর্য ও প্রিমিয়াম গ্রুমিং", image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&q=80", count: "৫০+ পণ্য", color: "bg-rose-50 text-rose-800 border-rose-200" },
  { id: "cat3", name: "Clothing & Apparel", nameBn: "কাপড় ও পরিধান বাজার", subtitle: "পুরুষ, নারী ও শিশুদের পোশাক", image: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=400&q=80", count: "৭০+ পণ্য", color: "bg-sky-50 text-sky-800 border-sky-200" },
  { id: "cat4", name: "Gifts & Hampers", nameBn: "উপহার বাজার", subtitle: "প্রিয়জনের জন্য বিশেষ উপহার", image: "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=400&q=80", count: "৪০+ পণ্য", color: "bg-amber-50 text-amber-800 border-amber-200" },
  { id: "cat5", name: "Bags & Fashion", nameBn: "ব্যাগ ও ফ্যাশন অ্যাক্সেসরিজ বাজার", subtitle: "স্টাইলিশ ব্যাগ ও এক্সেসরিজ", image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&q=80", count: "৩৫+ পণ্য", color: "bg-purple-50 text-purple-800 border-purple-200" },
  { id: "cat6", name: "Islamic Market", nameBn: "ইসলামিক বাজার", subtitle: "জায়নামাজ, আতর ও ধর্মীয় পণ্য", image: "https://images.unsplash.com/photo-1585036156171-384164a8c675?w=400&q=80", count: "৬০+ পণ্য", color: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  { id: "cat7", name: "Electronics & Gadgets", nameBn: "ইলেকট্রনিক্স বাজার", subtitle: "স্মার্ট গ্যাজেট ও ইলেকট্রনিক্স", image: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=400&q=80", count: "৮০+ পণ্য", color: "bg-teal-50 text-teal-800 border-teal-200" },
  { id: "cat8", name: "Books & Education", nameBn: "বই ও শিক্ষা বাজার", subtitle: "বই, স্টেশনারি ও শিক্ষা সামগ্রী", image: "https://images.unsplash.com/photo-1491841573634-28140fc7ced7?w=400&q=80", count: "১২০+ পণ্য", color: "bg-blue-50 text-blue-800 border-blue-200" },
];

export const Categories: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [categoryVisibility, setCategoryVisibility] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const unsubVis = onSnapshot(doc(db, "settings", "category_visibility"), (snap) => {
      if (snap.exists()) {
        setCategoryVisibility(snap.data() as Record<string, boolean>);
      }
    });
    return () => unsubVis();
  }, []);

  const visibleCategories = mainMarketCategories.filter(cat => categoryVisibility[cat.id] !== false);

  const filteredCategories = visibleCategories.filter(
    (cat) =>
      cat.nameBn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="px-4 pt-10 sm:pt-8 pb-24 space-y-4 max-w-lg mx-auto md:max-w-none w-full overflow-x-hidden">
      <SEO title="সকল ক্যাটাগরি - All MAYADIN FASHION" description="All Mayadin Bazar Categories" />

      {/* Mobile-Friendly Header with Safe Area Space */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)} 
            className="w-10 h-10 bg-white hover:bg-gray-100 rounded-full flex items-center justify-center border border-gray-200 shadow-sm active:scale-90 transition-transform"
            aria-label="Back"
            title="পেছনে ফিরে যান"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div>
            <h1 className="text-lg font-black text-gray-900 leading-tight">সকল বাজার ক্যাটাগরি</h1>
            <span className="text-xs font-bold text-gray-500">All Main Categories ({mainMarketCategories.length})</span>
          </div>
        </div>
      </div>

      {/* Universal Search Bar with Dynamic Placeholder Animation */}
      <div className="relative">
        <AnimatedSearchInput
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          category="general"
          placeholderOverride={[
            "খাদ্য বা রূপসজ্জা বাজার খুঁজুন...",
            "ইলেকট্রনিক্স বা পোশাক বাজার...",
            "বই বা উপহার বাজার খুঁজুন...",
            "সকল ক্যাটাগরি থেকে খুঁজুন..."
          ]}
          onClear={() => setSearchQuery("")}
        />
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {filteredCategories.map((cat) => (
          <Link 
            key={cat.id} 
            to={`/category/${cat.id}`}
            style={{ touchAction: "manipulation" }}
            className="group bg-white rounded-3xl p-4 shadow-sm border-2 border-gray-100/80 flex items-center gap-3.5 transition-transform duration-75 hover:shadow-md hover:border-[#004b23]/30 active:scale-90 cursor-pointer"
          >
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 shrink-0 group-hover:scale-105 transition-transform duration-150">
              <img src={cat.image} alt={cat.nameBn} loading="eager" decoding="async" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${cat.color}`}>
                {cat.count}
              </span>
              <h3 className="text-sm font-black text-gray-900 leading-snug mt-1 group-hover:text-[#004b23] transition-colors truncate">
                {cat.nameBn}
              </h3>
              <p className="text-[10px] text-gray-500 font-medium line-clamp-1 mt-0.5">
                {cat.subtitle}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {filteredCategories.length === 0 && (
        <div className="text-center py-10 bg-white rounded-3xl border border-gray-100 p-6">
          <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <h3 className="text-xs font-black text-gray-800">কোনো ক্যাটাগরি পাওয়া যায়নি</h3>
          <p className="text-[11px] text-gray-400 mt-1">"{searchQuery}" এর সাথে মিলে এমন কোনো ক্যাটাগরি নেই।</p>
          <button
            onClick={() => setSearchQuery("")}
            className="mt-3 text-xs font-bold text-[#004b23] bg-[#004b23]/10 px-3.5 py-1.5 rounded-xl"
          >
            সব ক্যাটাগরি দেখুন
          </button>
        </div>
      )}
    </div>
  );
};
