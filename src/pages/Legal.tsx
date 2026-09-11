import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  ArrowLeft, Shield, FileText, RefreshCcw, Truck, Lock, 
  CheckCircle2, Sparkles, Download, Phone, Mail, Award 
} from "lucide-react";
import { SEO } from "../components/SEO";

export const Legal: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const getInitialTab = () => {
    const path = location.pathname.toLowerCase();
    if (path.includes("terms")) return "terms";
    if (path.includes("refund") || path.includes("return")) return "refund";
    if (path.includes("shipping") || path.includes("delivery")) return "shipping";
    if (path.includes("security")) return "security";
    return "privacy";
  };

  const [activeTab, setActiveTab] = useState<"privacy" | "terms" | "refund" | "shipping" | "security">(getInitialTab());

  useEffect(() => {
    setActiveTab(getInitialTab());
  }, [location.pathname]);

  const tabs = [
    { id: "privacy", label: "প্রাইভেসি পলিসি", icon: Shield },
    { id: "terms", label: "টার্মস ও কন্ডিশন", icon: FileText },
    { id: "refund", label: "রিফান্ড ও রিটার্ন পলিসি", icon: RefreshCcw },
    { id: "shipping", label: "ডেলিভারি পলিসি", icon: Truck },
    { id: "security", label: "নিরাপত্তা ও ডেটা পলিসি", icon: Lock },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-24 text-gray-800">
      <SEO 
        title="আইন ও নীতিমালা (Legal & Policies)" 
        description="অল মায়াদিন বাজার প্রাইভেসি পলিসি, টার্মস, রিটার্ন এবং ডেলিভারি নীতিমালা" 
      />

      {/* Header */}
      <div className="bg-gradient-to-b from-[#031d14] to-[#004b23] text-white px-5 pt-8 pb-10 rounded-b-[40px] shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between relative z-10 mb-6">
          <button 
            onClick={() => navigate(-1)} 
            className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md active:scale-95 transition-all text-white border border-white/10"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="inline-flex items-center gap-1.5 bg-[#ffb703]/20 border border-[#ffb703]/40 text-[#ffb703] text-xs font-black px-3.5 py-1 rounded-full backdrop-blur-md">
            <Award className="w-3.5 h-3.5" /> সরকার নিবন্ধিত ও অনুমোদিত
          </div>
        </div>

        <div className="relative z-10 max-w-xl mx-auto text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            আইন ও নীতিমালা
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100 font-medium">
            অল মায়াদিন বাজার (All Mayadin Bazar) স্বচ্ছতা ও গ্রাহক আস্থায় অঙ্গীকারবদ্ধ
          </p>
        </div>

        {/* Background Decor */}
        <div className="absolute -right-16 -top-16 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-4 relative z-20 space-y-6">

        {/* Legal Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar scrollbar-hide bg-white p-1.5 rounded-2xl border border-gray-200 shadow-xs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 shrink-0 ${
                  active 
                    ? "bg-[#004b23] text-white shadow-sm" 
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? "text-[#ffb703]" : "text-gray-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Main Document Content Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-xs space-y-6 leading-relaxed text-gray-700">
          
          {/* TAB 1: PRIVACY POLICY */}
          {activeTab === "privacy" && (
            <div className="space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <span className="text-[10px] font-black uppercase text-[#004b23] bg-emerald-50 px-2.5 py-1 rounded-full">
                  সর্বশেষ আপডেট: ২০২৬
                </span>
                <h2 className="text-lg sm:text-xl font-black text-gray-900 mt-2">
                  গোপনীয়তা নীতি (Privacy Policy)
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  অল মায়াদিন বাজার আপনার ব্যক্তিগত তথ্যের সর্বোচ্চ নিরাপত্তা এবং গোপনীয়তা বজায় রাখতে দায়বদ্ধ।
                </p>
              </div>

              <div className="space-y-4 text-xs sm:text-sm">
                <section className="space-y-1.5 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <h3 className="font-black text-gray-900 text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#004b23]" />
                    ১. সংগৃহীত তথ্যের বিবরণ
                  </h3>
                  <p className="text-gray-600 pl-6">
                    অর্ডার প্রক্রিয়াকরণ, পণ্য ডেলিভারি এবং কাস্টমার সেবা নিশ্চিত করতে গ্রাহকের নাম, মোবাইল নম্বর, পূর্ণ ডেলিভারি ঠিকানা ও ইমেইল এড্রেস সংগ্রহ করা হয়।
                  </p>
                </section>

                <section className="space-y-1.5 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <h3 className="font-black text-gray-900 text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#004b23]" />
                    ২. তথ্যের শতভাগ গোপনীয়তা ও সুরক্ষা
                  </h3>
                  <p className="text-gray-600 pl-6">
                    আপনার কোনো তথ্য কোনো অবস্থাতেই তৃতীয় কোনো পক্ষের কাছে বাণিজ্যিকভাবে বিক্রি, ভাড়া বা প্রকাশ করা হয় না। সকল ডেটা ব্যাংকিং গ্রেড এনক্রিপশনে সুরক্ষিত।
                  </p>
                </section>

                <section className="space-y-1.5 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <h3 className="font-black text-gray-900 text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#004b23]" />
                    ৩. কুকিজ ও ব্রাউজিং নিরাপত্তা
                  </h3>
                  <p className="text-gray-600 pl-6">
                    ব্যবহারকারীর শপিং অভিজ্ঞতা সহজ করতে এবং কার্টের পণ্য মনে রাখতে নিরাপদ লোকাল সেশন কুকিজ ব্যবহার করা হয়।
                  </p>
                </section>
              </div>
            </div>
          )}

          {/* TAB 2: TERMS AND CONDITIONS */}
          {activeTab === "terms" && (
            <div className="space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <span className="text-[10px] font-black uppercase text-[#004b23] bg-emerald-50 px-2.5 py-1 rounded-full">
                  গ্রাহক চুক্তি
                </span>
                <h2 className="text-lg sm:text-xl font-black text-gray-900 mt-2">
                  ব্যবহারের শর্তাবলী (Terms & Conditions)
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  অল মায়াদিন বাজার প্ল্যাটফর্ম ব্যবহার এবং অর্ডার সম্পন্ন করার ক্ষেত্রে নিম্নের শর্তাবলি প্রযোজ্য।
                </p>
              </div>

              <div className="space-y-4 text-xs sm:text-sm">
                <section className="space-y-1.5 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <h3 className="font-black text-gray-900 text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#004b23]" />
                    ১. অর্ডার ও সঠিক তথ্য প্রদান
                  </h3>
                  <p className="text-gray-600 pl-6">
                    গ্রাহককে অবশ্যই সঠিক প্রাপকের নাম, সক্রিয় মোবাইল নম্বর এবং সঠিক ডেলিভারি ঠিকানা প্রদান করতে হবে। ভুল তথ্যের কারণে ডেলিভারি বিলম্ব হলে অল মায়াদিন বাজার দায়ী থাকবে না।
                  </p>
                </section>

                <section className="space-y-1.5 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <h3 className="font-black text-gray-900 text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#004b23]" />
                    ২. পণ্যের মূল্য ও প্রাপ্যতা
                  </h3>
                  <p className="text-gray-600 pl-6">
                    ওয়েবসাইট ও অ্যাপে প্রদর্শিত সকল মূল্য বাংলাদেশি টাকায় (BDT)। কোনো পণ্যের স্টক অপ্রাপ্য থাকলে গ্রাহককে অবহিত করে বিকল্প পণ্য অথবা সম্পূর্ণ অর্থ ফেরত দেওয়া হয়।
                  </p>
                </section>

                <section className="space-y-1.5 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <h3 className="font-black text-gray-900 text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#004b23]" />
                    ৩. পেমেন্ট ও ইনভয়েস
                  </h3>
                  <p className="text-gray-600 pl-6">
                    ক্যাশ অন ডেলিভারিতে পণ্য পৌঁছানোর পর ডেলিভারিম্যানের কাছে সম্পূর্ণ মূল্য পরিশোধ করতে হবে। প্রতিটি সফল অর্ডারের সাথে ডিজিটাল ইনভয়েস প্রদান করা হয়।
                  </p>
                </section>
              </div>
            </div>
          )}

          {/* TAB 3: REFUND AND RETURN POLICY */}
          {activeTab === "refund" && (
            <div className="space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                  ১০০% গ্যারান্টি
                </span>
                <h2 className="text-lg sm:text-xl font-black text-gray-900 mt-2">
                  রিফান্ড ও রিটার্ন পলিসি (Refund & Return Policy)
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  গ্রাহক সন্তুষ্টি আমাদের মূল লক্ষ্য। কোনো ত্রুটিপূর্ণ পণ্যে সম্পূর্ণ মূল্য ফেরত অথবা রিপ্লেসমেন্ট নিশ্চিত।
                </p>
              </div>

              <div className="space-y-4 text-xs sm:text-sm">
                <section className="space-y-1.5 bg-amber-50/50 p-4 rounded-2xl border border-amber-200/60">
                  <h3 className="font-black text-gray-900 text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#004b23]" />
                    ১. রিটার্ন করার সময়সীমা ও শর্ত
                  </h3>
                  <p className="text-gray-600 pl-6">
                    পণ্য গ্রহণের ৪৮ ঘণ্টার মধ্যে আমাদের হেল্পলাইন (+৮৮০ ১৭০০-০০০০০০) বা সহায়তায় অবহিত করতে হবে। পণ্যটি অব্যবহৃত এবং আসল প্যাকেজিংসহ থাকা আবশ্যক।
                  </p>
                </section>

                <section className="space-y-1.5 bg-amber-50/50 p-4 rounded-2xl border border-amber-200/60">
                  <h3 className="font-black text-gray-900 text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#004b23]" />
                    ২. অর্থ ফেরতের মাধ্যম ও সময়সূচি
                  </h3>
                  <p className="text-gray-600 pl-6">
                    অনলাইন পেমেন্ট বা ক্যাশ অন ডেলিভারির পণ্য ফেরত পাওয়ার পর ৩ থেকে ৫ কার্যদিবসের মধ্যে গ্রাহকের বিকাশ, নগদ বা ব্যাংক অ্যাকাউন্টে রিফান্ড ট্রান্সফার সম্পন্ন করা হয়।
                  </p>
                </section>
              </div>
            </div>
          )}

          {/* TAB 4: SHIPPING & DELIVERY POLICY */}
          {activeTab === "shipping" && (
            <div className="space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <span className="text-[10px] font-black uppercase text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">
                  সারাদেশে হোম ডেলিভারি
                </span>
                <h2 className="text-lg sm:text-xl font-black text-gray-900 mt-2">
                  ডেলিভারি পলিসি (Shipping & Delivery Policy)
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  দ্রুততম সময়ে গ্রাহকের কাছে পণ্য পৌঁছাতে আমাদের রয়েছে দক্ষ লজিস্টিকস পার্টনার নেটওয়ার্ক।
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200">
                  <h4 className="text-sm font-black text-[#004b23] mb-1">ঢাকা মেট্রো এলাকা</h4>
                  <p className="text-xs text-gray-700 font-bold">সময়: ২৪ থেকে ৪৮ ঘণ্টা</p>
                  <p className="text-xs text-gray-600 mt-0.5">চার্জ: মাত্র ৬০ টাকা</p>
                </div>

                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200">
                  <h4 className="text-sm font-black text-blue-700 mb-1">ঢাকার বাইরে সমগ্র বাংলাদেশ</h4>
                  <p className="text-xs text-gray-700 font-bold">সময়: ২ থেকে ৩ কার্যদিবস</p>
                  <p className="text-xs text-gray-600 mt-0.5">চার্জ: মাত্র ১২০ টাকা</p>
                </div>
              </div>

              <section className="space-y-1.5 bg-gray-50 p-4 rounded-2xl border border-gray-100 text-xs sm:text-sm">
                <h3 className="font-black text-gray-900 text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#004b23]" />
                  প্যাকেজিং ও ডেলিভারি হ্যান্ডলিং
                </h3>
                <p className="text-gray-600 pl-6">
                  সকল পণ্য বিশেষ ওয়াটারপ্রুফ এবং শক্ত কার্ডবোর্ড প্যাকেটে সুরক্ষিত রাখা হয় যাতে পরিবহনে কোনো ক্ষতি না ঘটে। ডেলিভারির সময় গ্রাহককে পণ্য দেখে নেওয়ার পূর্ণ সুযোগ দেওয়া হয়।
                </p>
              </section>
            </div>
          )}

          {/* TAB 5: SECURITY POLICY */}
          {activeTab === "security" && (
            <div className="space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <span className="text-[10px] font-black uppercase text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full">
                  এনক্রিপশন ও সাইবার সিকিউরিটি
                </span>
                <h2 className="text-lg sm:text-xl font-black text-gray-900 mt-2">
                  নিরাপত্তা ও ডেটা পলিসি (Security Policy)
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  সর্বাধুনিক ক্লাউড ফায়ারওয়াল ও এনক্রিপশন প্রোটোকলে প্ল্যাটফর্মের প্রতিটি লেনদেন পরিচালিত।
                </p>
              </div>

              <div className="space-y-4 text-xs sm:text-sm">
                <section className="space-y-1.5 bg-purple-50/50 p-4 rounded-2xl border border-purple-200/60">
                  <h3 className="font-black text-gray-900 text-sm flex items-center gap-2">
                    <Lock className="w-4 h-4 text-purple-600" />
                    ২৫৬-বিট এসএসএল (SSL) এনক্রিপশন
                  </h3>
                  <p className="text-gray-600 pl-6">
                    সার্ভার এবং ব্রাউজারের মধ্যকার সকল ডেটা আন্তর্জাতিক মানের এনক্রিপশনের মাধ্যমে আদান-প্রদান করা হয়।
                  </p>
                </section>

                <section className="space-y-1.5 bg-purple-50/50 p-4 rounded-2xl border border-purple-200/60">
                  <h3 className="font-black text-gray-900 text-sm flex items-center gap-2">
                    <Lock className="w-4 h-4 text-purple-600" />
                    পাসওয়ার্ড হ্যাশিং ও ওটিপি অথেনটিকেশন
                  </h3>
                  <p className="text-gray-600 pl-6">
                    গ্রাহকের পাসওয়ার্ড ডাটাবেজে ওয়ান-ওয়ে ক্রিপ্টোগ্রাফিক সল্টেড হ্যাশ আকারে সংরক্ষিত থাকে।
                  </p>
                </section>
              </div>
            </div>
          )}

        </div>

        {/* Support Hotline Footer Card */}
        <div className="bg-[#031d14] text-white p-5 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ffb703] text-black flex items-center justify-center font-bold">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-white">কোনো প্রশ্ন বা পলিসি সহায়তার প্রয়োজন?</h4>
              <p className="text-[11px] text-emerald-200">আমাদের কাস্টমার কেয়ার টিম সর্বদাই প্রস্তুত</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/contact")}
            className="w-full sm:w-auto bg-[#007f3e] hover:bg-[#006e36] text-white text-xs font-black px-5 py-2.5 rounded-xl shadow-md active:scale-95 transition-all whitespace-nowrap"
          >
            যোগাযোগ করুন
          </button>
        </div>

      </div>
    </div>
  );
};
export default Legal;
