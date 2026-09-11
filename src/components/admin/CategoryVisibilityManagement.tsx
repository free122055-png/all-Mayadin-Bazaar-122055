import React, { useState, useEffect } from "react";
import { 
  Eye, EyeOff, ToggleLeft, ToggleRight, CheckCircle2, 
  AlertCircle, Loader2, Sparkles, ShoppingBasket, Shirt, 
  Gift, ShoppingBag, Moon, Headphones, BookOpen, LayoutGrid, RotateCcw
} from "lucide-react";
import { motion } from "motion/react";
import { db } from "../../lib/firebase";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";

interface CategoryMeta {
  id: string;
  title: string;
  subtitle: string;
  defaultIcon: React.ComponentType<{ className?: string }>;
  colorBg: string;
  badgeText: string;
}

const CATEGORY_LIST: CategoryMeta[] = [
  {
    id: "cat1",
    title: "খাদ্য বাজার",
    subtitle: "চাল, ডাল, তেল, মসলা ও সকল মুদি সামগ্রী",
    defaultIcon: ShoppingBasket,
    colorBg: "bg-emerald-500",
    badgeText: "খাদ্য ও নিত্যপণ্য"
  },
  {
    id: "cat2",
    title: "রুপসজ্জা বাজার",
    subtitle: "কসমেটিক্স, স্কিন কেয়ার ও পার্সোনাল কেয়ার",
    defaultIcon: Sparkles,
    colorBg: "bg-pink-500",
    badgeText: "বিউটি ও কেয়ার"
  },
  {
    id: "cat3",
    title: "কাপড় ও পরিধান",
    subtitle: "ছেলে, মেয়ে ও শিশুদের আধুনিক ফ্যাশন ড্রেস",
    defaultIcon: Shirt,
    colorBg: "bg-sky-500",
    badgeText: "ফ্যাশন ওয়্যার"
  },
  {
    id: "cat4",
    title: "উপহার বাজার",
    subtitle: "স্পেশাল গিফট সেট, হ্যাম্পার ও মেমেন্টো",
    defaultIcon: Gift,
    colorBg: "bg-orange-500",
    badgeText: "গিফট কালেকশন"
  },
  {
    id: "cat5",
    title: "ব্যাগ ও ফ্যাশন",
    subtitle: "লেদার ব্যাগ, ট্রাভেল ব্যাগ ও স্টাইলিশ এক্সেসরিজ",
    defaultIcon: ShoppingBag,
    colorBg: "bg-purple-500",
    badgeText: "ব্যাগ আইটেম"
  },
  {
    id: "cat6",
    title: "ইসলামিক বাজার",
    subtitle: "জায়নামাজ, আতর, তসবিহ ও ধর্মীয় পোশাক",
    defaultIcon: Moon,
    colorBg: "bg-emerald-600",
    badgeText: "ইসলামিক প্যাক"
  },
  {
    id: "cat7",
    title: "ইলেকট্রনিক্স বাজার",
    subtitle: "স্মার্ট গ্যাজেট, ইয়ারফোন ও ইলেকট্রনিক ডিভাইস",
    defaultIcon: Headphones,
    colorBg: "bg-teal-500",
    badgeText: "স্মার্ট গ্যাজেট"
  },
  {
    id: "cat8",
    title: "বই ও শিক্ষা বাজার",
    subtitle: "ইসলামিক বই, একাডেমিক বই ও শিক্ষা সরঞ্জাম",
    defaultIcon: BookOpen,
    colorBg: "bg-blue-600",
    badgeText: "বই ও স্টেশনারি"
  }
];

export const CategoryVisibilityManagement: React.FC = () => {
  // visibilityState maps categoryId -> boolean (true = visible/ON, false = hidden/OFF)
  const [visibility, setVisibility] = useState<Record<string, boolean>>({
    cat1: true,
    cat2: true,
    cat3: true,
    cat4: true,
    cat5: true,
    cat6: true,
    cat7: true,
    cat8: true,
  });

  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [toast, setToast] = useState<{ text: string; isError?: boolean } | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "category_visibility"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        // Merge with defaults
        setVisibility(prev => ({
          ...prev,
          ...data
        }));
      }
      setLoading(false);
    }, (error) => {
      console.warn("Category visibility listener error:", error);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const showToast = (text: string, isError = false) => {
    setToast({ text, isError });
    setTimeout(() => setToast(null), 3000);
  };

  const handleToggle = async (catId: string, currentVal: boolean) => {
    const newVal = !currentVal;
    setSavingId(catId);

    try {
      const updatedVisibility = {
        ...visibility,
        [catId]: newVal,
        updatedAt: Date.now()
      };

      await setDoc(doc(db, "settings", "category_visibility"), updatedVisibility, { merge: true });
      
      const catMeta = CATEGORY_LIST.find(c => c.id === catId);
      const catTitle = catMeta ? catMeta.title : catId;
      
      if (newVal) {
        showToast(`'${catTitle}' সেকশন চালু করা হয়েছে (ON)`);
      } else {
        showToast(`'${catTitle}' সেকশন বন্ধ রাখা হয়েছে (OFF)`);
      }
    } catch (error: any) {
      console.error("Toggle error:", error);
      showToast("পরিবর্তন সেভ করা সম্ভব হয়নি!", true);
    } finally {
      setSavingId(null);
    }
  };

  const handleBulkToggle = async (turnOn: boolean) => {
    setBulkSaving(true);
    try {
      const updatedVisibility: Record<string, any> = {
        updatedAt: Date.now()
      };

      CATEGORY_LIST.forEach(cat => {
        updatedVisibility[cat.id] = turnOn;
      });

      await setDoc(doc(db, "settings", "category_visibility"), updatedVisibility, { merge: true });
      showToast(turnOn ? "সকল ক্যাটাগরি সেকশন চালু করা হয়েছে" : "সকল ক্যাটাগরি সেকশন বন্ধ করা হয়েছে");
    } catch (error: any) {
      console.error("Bulk toggle error:", error);
      showToast("বাল্ক আপডেট ব্যর্থ হয়েছে!", true);
    } finally {
      setBulkSaving(false);
    }
  };

  const activeCount = CATEGORY_LIST.filter(c => visibility[c.id] !== false).length;
  const inactiveCount = CATEGORY_LIST.length - activeCount;

  return (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-6 pb-24 space-y-6">
      {/* Toast Banner */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 text-white font-bold text-xs ${toast.isError ? "bg-red-600" : "bg-[#004b23]"}`}>
          {toast.isError ? <AlertCircle className="w-5 h-5 text-white" /> : <CheckCircle2 className="w-5 h-5 text-emerald-300" />}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 bg-[#004b23]/10 text-[#004b23] rounded-xl">
              <Eye className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-black text-gray-900">ক্যাটাগরি দৃশ্যমানতা (On/Off Control)</h2>
          </div>
          <p className="text-xs text-gray-500 font-medium">
            যেকোনো ক্যাটাগরি বন্ধ (OFF) রাখলে কাস্টমারদের ড্যাশবোর্ড ও অ্যাপে ওই সেকশন সম্পূর্ণ অদৃশ্য থাকবে।
          </p>
        </div>

        {/* Quick Bulk Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => handleBulkToggle(true)}
            disabled={bulkSaving || loading}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <Eye className="w-4 h-4" />
            <span>সব চালু করুন</span>
          </button>
          <button
            onClick={() => handleBulkToggle(false)}
            disabled={bulkSaving || loading}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <EyeOff className="w-4 h-4" />
            <span>সব বন্ধ করুন</span>
          </button>
        </div>
      </div>

      {/* Status Bar Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">চালু আছে (ON)</p>
            <p className="text-2xl font-black text-emerald-900">{activeCount} টি সেকশন</p>
          </div>
          <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center font-bold">
            <Eye className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">বন্ধ রাখা হয়েছে (OFF)</p>
            <p className="text-2xl font-black text-rose-900">{inactiveCount} টি সেকশন</p>
          </div>
          <div className="w-10 h-10 bg-rose-500 text-white rounded-xl flex items-center justify-center font-bold">
            <EyeOff className="w-5 h-5" />
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-gray-50 border border-gray-100 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">মোট ক্যাটাগরি</p>
            <p className="text-2xl font-black text-gray-800">{CATEGORY_LIST.length} টি সেকশন</p>
          </div>
          <div className="w-10 h-10 bg-gray-800 text-white rounded-xl flex items-center justify-center font-bold">
            <LayoutGrid className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Category List Cards */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-3xl border border-gray-100">
          <Loader2 className="w-8 h-8 text-[#004b23] animate-spin mb-2" />
          <p className="text-xs font-bold text-gray-500">ক্যাটাগরি ডাটা লোড হচ্ছে...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CATEGORY_LIST.map((cat) => {
            const isVisible = visibility[cat.id] !== false; // default true if undefined
            const IconComp = cat.defaultIcon;
            const isSaving = savingId === cat.id;

            return (
              <motion.div
                key={cat.id}
                layout
                className={`bg-white rounded-3xl p-5 border-2 transition-all shadow-sm flex items-center justify-between gap-4 ${
                  isVisible 
                    ? "border-emerald-100 hover:border-emerald-200" 
                    : "border-gray-200 bg-gray-50/60 opacity-80"
                }`}
              >
                {/* Left side: Icon & Title */}
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`w-12 h-12 rounded-2xl ${cat.colorBg} text-white flex items-center justify-center shrink-0 shadow-md`}>
                    <IconComp className="w-6 h-6 stroke-[2]" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={`text-base font-black truncate ${isVisible ? "text-gray-900" : "text-gray-500 line-through"}`}>
                        {cat.title}
                      </h3>
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                        isVisible ? "bg-emerald-100 text-emerald-800" : "bg-gray-200 text-gray-600"
                      }`}>
                        {cat.badgeText}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 font-medium truncate mt-0.5">
                      {cat.subtitle}
                    </p>
                  </div>
                </div>

                {/* Right side: ON/OFF Toggle Switch */}
                <div className="shrink-0 flex items-center gap-2">
                  <button
                    onClick={() => handleToggle(cat.id, isVisible)}
                    disabled={isSaving || bulkSaving}
                    className={`relative inline-flex items-center h-8 w-16 rounded-full transition-colors duration-200 ease-in-out focus:outline-none p-1 cursor-pointer ${
                      isVisible ? "bg-emerald-600" : "bg-gray-300"
                    }`}
                  >
                    <span className="sr-only">Toggle category</span>
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 text-white animate-spin mx-auto" />
                    ) : (
                      <span
                        className={`inline-block w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out flex items-center justify-center text-[10px] font-black ${
                          isVisible ? "translate-x-8 text-emerald-700" : "translate-x-0 text-gray-400"
                        }`}
                      >
                        {isVisible ? "ON" : "OFF"}
                      </span>
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
