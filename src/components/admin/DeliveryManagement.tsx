import React, { useState, useEffect } from "react";
import { Save, Truck, MapPin, Globe, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { db } from "../../lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

interface DeliveryConfig {
  insideDhaka: number;
  subDhaka: number;
  outsideDhaka: number;
  freeDeliveryThreshold?: number;
}

export const DeliveryManagement: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<DeliveryConfig>({
    insideDhaka: 60,
    subDhaka: 100,
    outsideDhaka: 120,
    freeDeliveryThreshold: 2000
  });
  const [toast, setToast] = useState<{ text: string; isError?: boolean } | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const docRef = doc(db, "app_settings", "delivery_config");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setConfig(docSnap.data() as DeliveryConfig);
      }
    } catch (error) {
      console.error("Error fetching delivery config:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const docRef = doc(db, "app_settings", "delivery_config");
      await setDoc(docRef, config);
      showToast("ডেলিভারি চার্জ সফলভাবে আপডেট হয়েছে!");
    } catch (error) {
      console.error("Error saving delivery config:", error);
      showToast("আপডেট করতে সমস্যা হয়েছে", true);
    } finally {
      setSaving(false);
    }
  };

  const showToast = (text: string, isError = false) => {
    setToast({ text, isError });
    setTimeout(() => setToast(null), 3000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-8 h-8 text-[#5842dc] animate-spin" />
        <p className="text-sm font-bold text-gray-500">লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 pb-20">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#5842dc] px-6 py-8 text-white relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-2xl font-black flex items-center gap-2.5">
              <Truck className="w-7 h-7" /> ডেলিভারি চার্জ সেটিংস
            </h2>
            <p className="text-indigo-100 text-sm mt-1 font-medium">
              এলাকা ভিত্তিক ডেলিভারি খরচ নির্ধারণ করুন
            </p>
          </div>
          <Truck className="absolute -right-6 -bottom-6 w-32 h-32 text-white/10 rotate-12" />
        </div>

        {/* Toast */}
        {toast && (
          <div className={`m-4 p-3 rounded-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 ${
            toast.isError ? "bg-rose-50 text-rose-700 border border-rose-100" : "bg-emerald-50 text-emerald-700 border border-emerald-100"
          }`}>
            {toast.isError ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            <span className="text-xs font-bold">{toast.text}</span>
          </div>
        )}

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Inside Dhaka */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-black text-gray-700">
                <MapPin className="w-4 h-4 text-[#5842dc]" /> ঢাকার ভেতরে (৳)
              </label>
              <input
                type="number"
                value={config.insideDhaka}
                onChange={(e) => setConfig({ ...config, insideDhaka: Number(e.target.value) })}
                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#5842dc]/20 focus:border-[#5842dc] font-bold transition-all"
              />
            </div>

            {/* Sub-Dhaka / Suburban */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-black text-gray-700">
                <Globe className="w-4 h-4 text-[#5842dc]" /> ঢাকার আশেপাশে (৳)
              </label>
              <input
                type="number"
                value={config.subDhaka}
                onChange={(e) => setConfig({ ...config, subDhaka: Number(e.target.value) })}
                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#5842dc]/20 focus:border-[#5842dc] font-bold transition-all"
              />
            </div>

            {/* Outside Dhaka */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-black text-gray-700">
                <Globe className="w-4 h-4 text-[#5842dc]" /> ঢাকার বাইরে / জেলা (৳)
              </label>
              <input
                type="number"
                value={config.outsideDhaka}
                onChange={(e) => setConfig({ ...config, outsideDhaka: Number(e.target.value) })}
                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#5842dc]/20 focus:border-[#5842dc] font-bold transition-all"
              />
            </div>

            {/* Free Delivery Threshold */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-black text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> ফ্রি ডেলিভারি (কত টাকার উপরে)
              </label>
              <input
                type="number"
                value={config.freeDeliveryThreshold}
                onChange={(e) => setConfig({ ...config, freeDeliveryThreshold: Number(e.target.value) })}
                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#5842dc]/20 focus:border-[#5842dc] font-bold transition-all"
                placeholder="যেমন: ২০০০"
              />
            </div>
          </div>

          <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50">
            <h4 className="text-[11px] font-black text-indigo-900 uppercase tracking-wider mb-2">💡 চার্জের নিয়ম:</h4>
            <ul className="space-y-1.5">
              <li className="text-xs text-indigo-800 font-medium flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1 shrink-0" />
                ঢাকার ভেতরের ঠিকানার জন্য ৳{config.insideDhaka} চার্জ প্রযোজ্য হবে।
              </li>
              <li className="text-xs text-indigo-800 font-medium flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1 shrink-0" />
                গাজীপুর, সাভার বা ঢাকার পার্শ্ববর্তী এলাকার জন্য ৳{config.subDhaka} চার্জ।
              </li>
              <li className="text-xs text-indigo-800 font-medium flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1 shrink-0" />
                বাকি সকল জেলার জন্য ৳{config.outsideDhaka} চার্জ কার্যকর হবে।
              </li>
            </ul>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-[#5842dc] hover:bg-[#4b35cf] text-white py-4 rounded-2xl font-black shadow-lg shadow-[#5842dc]/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {saving ? "আপডেট হচ্ছে..." : "পরিবর্তনগুলো সংরক্ষণ করুন"}
          </button>
        </div>
      </div>
    </div>
  );
};
