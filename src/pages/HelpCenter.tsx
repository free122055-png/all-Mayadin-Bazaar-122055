import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Search, HelpCircle, ChevronDown, ChevronRight, 
  MessageCircle, Phone, Truck, RotateCcw, CreditCard, ShieldCheck, 
  Package, Sparkles, Send, CheckCircle2, FileText, AlertCircle 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { SEO } from "../components/SEO";

interface FAQItem {
  id: string;
  category: "order" | "delivery" | "payment" | "return" | "account";
  question: string;
  answer: string;
  popular?: boolean;
}

export const HelpCenter: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [openFaqId, setOpenFaqId] = useState<string | null>("faq-1");

  // Ticket Submission State
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [ticketPhone, setTicketPhone] = useState("");
  const [ticketSubmitted, setTicketSubmitted] = useState(false);

  const categories = [
    { id: "all", label: "সকল বিষয়", icon: Sparkles },
    { id: "order", label: "অর্ডার ও কেনাকাটা", icon: Package },
    { id: "delivery", label: "ডেলিভারি ও ট্র্যাকিং", icon: Truck },
    { id: "payment", label: "পেমেন্ট ও রিফান্ড", icon: CreditCard },
    { id: "return", label: "রিটার্ন ও এক্সচেঞ্জ", icon: RotateCcw },
    { id: "account", label: "অ্যাকাউন্ট ও নিরাপত্তা", icon: ShieldCheck },
  ];

  const faqs: FAQItem[] = [
    {
      id: "faq-1",
      category: "order",
      popular: true,
      question: "কীভাবে অল মায়াদিন বাজার থেকে অর্ডার করবেন?",
      answer: "পছন্দের পণ্যটি নির্বাচন করে 'কার্ট'-এ যোগ করুন অথবা 'এখনই কিনুন' বাটনে চাপুন। এরপর আপনার সঠিক ডেলিভারি ঠিকানা ও মোবাইল নম্বর প্রদান করে পেমেন্ট মাধ্যম (ক্যাশ অন ডেলিভারি, বিকাশ বা কার্ড) নির্বাচন করে 'অর্ডার নিশ্চিত করুন' বাটনে ক্লিক করলেই আপনার অর্ডার সম্পন্ন হয়ে যাবে।"
    },
    {
      id: "faq-2",
      category: "delivery",
      popular: true,
      question: "ডেলিভারি পেতে কতদিন সময় লাগে?",
      answer: "ঢাকা মেট্রোপলিটন সিটির ভেতরে ২৪ থেকে ৪৮ ঘণ্টার মধ্যে এবং ঢাকা জেলার বাইরে সমগ্র বাংলাদেশের সকল জেলা ও উপজেলায় ২ থেকে ৩ কার্যদিবসের মধ্যে আপনার দোরগোড়ায় পণ্য পৌঁছে দেওয়া হয়।"
    },
    {
      id: "faq-3",
      category: "delivery",
      popular: true,
      question: "ডেলিভারি চার্জ কত?",
      answer: "ঢাকা সিটির ভেতরে স্ট্যান্ডার্ড হোম ডেলিভারি চার্জ মাত্র ৬০ টাকা এবং ঢাকা সিটির বাইরে সমগ্র বাংলাদেশে ১২০ টাকা। বিশেষ ক্যাম্পেইন বা অফারে নির্দিষ্ট পরিমাণ অর্ডারে ফ্রি ডেলিভারি সুবিধা প্রদান করা হয়।"
    },
    {
      id: "faq-4",
      category: "payment",
      popular: true,
      question: "কী কী মাধ্যমে মূল্য পরিশোধ করা যায়?",
      answer: "আমরা ক্যাশ অন ডেলিভারি (পণ্য হাতে পেয়ে মূল্য পরিশোধ), বিকাশ (bKash), নগদ (Nagad), রকেট (Rocket) এবং ভিসা/মাস্টারকার্ডসহ সকল প্রধান ডেবিট ও ক্রেডিট কার্ডের মাধ্যমে ১০০% সুরক্ষিত অনলাইন পেমেন্ট গ্রহণ করি।"
    },
    {
      id: "faq-5",
      category: "return",
      popular: true,
      question: "পণ্য পছন্দ না হলে বা ক্ষতিগ্রস্ত হলে রিটার্ন করার নিয়ম কি?",
      answer: "পণ্য গ্রহণের ৪৮ ঘণ্টার মধ্যে আমাদের হেল্পলাইন (+৮৮০ ১৭০০-০০০০০০) বা কাস্টমার সাপোর্টে যোগাযোগ করুন। পণ্যটি অক্ষত অবস্থায় আসল প্যাকেজিংসহ আমাদের ডেলিভারি প্রতিনিধির কাছে হস্তান্তর করলে পরবর্তী ৩ থেকে ৫ কার্যদিবসের মধ্যে সম্পূর্ণ মূল্য রিফান্ড অথবা নতুন পণ্য রিপ্লেসমেন্ট করে দেওয়া হবে।"
    },
    {
      id: "faq-6",
      category: "order",
      question: "অর্ডার ট্র্যাক বা অবস্থান জানব কীভাবে?",
      answer: "মেনু থেকে 'অর্ডার ট্র্যাকিং' অথবা আপনার একাউন্টের 'আমার অর্ডারসমূহ' অপশনে গিয়ে সংশ্লিষ্ট অর্ডারের বর্তমান অবস্থা (যেমন: প্রস্তুত হচ্ছে, কুরিয়ারে পাঠানো হয়েছে, ডেলিভারির পথে) রিয়েল-টাইম দেখতে পাবেন।"
    },
    {
      id: "faq-7",
      category: "account",
      question: "পাসওয়ার্ড ভুলে গেলে কীভাবে রিসেট করব?",
      answer: "লগইন স্ক্রিনের 'পাসওয়ার্ড ভুলে গেছেন?' অপশনে ক্লিক করে আপনার নিবন্ধিত মোবাইল নম্বর দিন। আপনার ফোনে একটি ওটিপি ভেরিফিকেশন কোড পাঠানো হবে যা দিয়ে মাত্র ৩০ সেকেন্ডে নতুন পাসওয়ার্ড সেট করে নিতে পারবেন।"
    },
    {
      id: "faq-8",
      category: "payment",
      question: "অনলাইন পেমেন্ট কি নিরাপদ?",
      answer: "হ্যাঁ, অল মায়াদিন বাজারের সকল লেনদেন ২৫৬-বিট এসএসএল (SSL) এনক্রিপশন এবং বাংলাদেশ ব্যাংক অনুমোদিত আন্তর্জাতিক মানের সুরক্ষিত পেমেন্ট গেটওয়ের মাধ্যমে সম্পন্ন হয়। আপনার কার্ড বা পিনের কোনো তথ্য আমরা সংরক্ষণ করি না।"
    },
  ];

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject || !ticketMessage || !ticketPhone) return;
    setTicketSubmitted(true);
    setTimeout(() => {
      setTicketSubject("");
      setTicketMessage("");
      setTicketPhone("");
      setTicketSubmitted(false);
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-24 text-gray-800">
      <SEO title="সাহায্য কেন্দ্র (Help Center)" description="অল মায়াদিন বাজার কাস্টমার সাপোর্ট ও সাহায্য কেন্দ্র" />

      {/* Hero Header */}
      <div className="bg-gradient-to-b from-[#031d14] to-[#004b23] text-white px-5 pt-8 pb-10 rounded-b-[40px] shadow-xl relative overflow-hidden">
        {/* Top Back Navigation */}
        <div className="flex items-center justify-between relative z-10 mb-6">
          <button 
            onClick={() => navigate(-1)} 
            className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md active:scale-95 transition-all text-white border border-white/10"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="inline-flex items-center gap-1.5 bg-[#ffb703]/20 border border-[#ffb703]/40 text-[#ffb703] text-xs font-black px-3.5 py-1 rounded-full backdrop-blur-md">
            <span>✨</span> ২৪/৭ গ্রাহক সেবা
          </div>
        </div>

        {/* Title and Search */}
        <div className="relative z-10 max-w-xl mx-auto text-center space-y-3">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            কীভাবে আপনাকে সাহায্য করতে পারি?
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 font-medium">
            আপনার সকল প্রশ্নের সহজ সমাধান ও তথ্য এক জায়গায়
          </p>

          {/* Instant Search Bar */}
          <div className="relative mt-5">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="প্রশ্ন বা বিষয় লিখে অনুসন্ধান করুন (যেমন: ডেলিভারি, রিফান্ড)..."
              className="w-full bg-white text-gray-900 placeholder:text-gray-400 pl-12 pr-4 py-3.5 rounded-2xl text-xs sm:text-sm font-bold shadow-lg focus:outline-none focus:ring-2 focus:ring-[#ffb703]"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")} 
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-lg"
              >
                মুছুন
              </button>
            )}
          </div>
        </div>

        {/* Decorative Background Accents */}
        <div className="absolute -right-16 -top-16 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-4 relative z-20 space-y-6">

        {/* Quick Action Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => navigate("/notifications")}
            className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs hover:shadow-md hover:border-[#004b23] transition-all flex flex-col items-center text-center group active:scale-98"
          >
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-[#004b23] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Package className="w-5 h-5" />
            </div>
            <span className="text-xs font-black text-gray-900">অর্ডার ট্র্যাকিং</span>
            <span className="text-[10px] text-gray-400 font-semibold mt-0.5">লাইভ অবস্থান জানুন</span>
          </button>

          <button
            onClick={() => navigate("/refund")}
            className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs hover:shadow-md hover:border-[#004b23] transition-all flex flex-col items-center text-center group active:scale-98"
          >
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <RotateCcw className="w-5 h-5" />
            </div>
            <span className="text-xs font-black text-gray-900">রিটার্ন ও রিফান্ড</span>
            <span className="text-[10px] text-gray-400 font-semibold mt-0.5">সহজ পলিসি</span>
          </button>

          <button
            onClick={() => navigate("/shipping")}
            className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs hover:shadow-md hover:border-[#004b23] transition-all flex flex-col items-center text-center group active:scale-98"
          >
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Truck className="w-5 h-5" />
            </div>
            <span className="text-xs font-black text-gray-900">ডেলিভারি তথ্য</span>
            <span className="text-[10px] text-gray-400 font-semibold mt-0.5">চার্জ ও সময়সূচি</span>
          </button>

          <button
            onClick={() => navigate("/contact")}
            className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs hover:shadow-md hover:border-[#004b23] transition-all flex flex-col items-center text-center group active:scale-98"
          >
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Phone className="w-5 h-5" />
            </div>
            <span className="text-xs font-black text-gray-900">যোগাযোগ করুন</span>
            <span className="text-[10px] text-gray-400 font-semibold mt-0.5">সরাসরি হটলাইন</span>
          </button>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar scrollbar-hide">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                  active 
                    ? "bg-[#004b23] text-white shadow-sm" 
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? "text-[#ffb703]" : "text-gray-400"}`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* FAQ Accordion Section */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h2 className="text-sm sm:text-base font-black text-gray-900 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#004b23]" />
              <span>সচরাচর জিজ্ঞাসিত প্রশ্নাবলি (FAQ)</span>
            </h2>
            <span className="text-[11px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {filteredFaqs.length}টি উত্তর
            </span>
          </div>

          <div className="divide-y divide-gray-100">
            {filteredFaqs.map((faq) => {
              const isOpen = openFaqId === faq.id;
              return (
                <div key={faq.id} className="py-3">
                  <button
                    onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                    className="w-full flex items-center justify-between gap-4 text-left group"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-[#004b23]/40 group-hover:bg-[#004b23] transition-colors shrink-0" />
                      <span className={`text-xs sm:text-sm font-bold transition-colors ${isOpen ? "text-[#004b23]" : "text-gray-800 hover:text-gray-900"}`}>
                        {faq.question}
                      </span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180 text-[#004b23]" : ""}`} />
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-2.5 ml-4 pl-3.5 border-l-2 border-[#004b23]/30 text-xs sm:text-sm text-gray-600 leading-relaxed font-normal bg-emerald-50/40 p-3 rounded-r-2xl">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}

            {filteredFaqs.length === 0 && (
              <div className="py-12 text-center space-y-2">
                <AlertCircle className="w-8 h-8 text-gray-300 mx-auto" />
                <p className="text-xs font-bold text-gray-500">আপনার অনুসন্ধানের সাথে মিল পাওয়া যায়নি।</p>
                <button
                  onClick={() => { setSearchQuery(""); setSelectedCategory("all"); }}
                  className="text-xs font-black text-[#004b23] hover:underline"
                >
                  সকল প্রশ্ন দেখুন
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Direct Ticket / Support Submission Card */}
        <div className="bg-gradient-to-br from-[#022c1e] to-[#004b23] text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-xl">
            <div className="inline-flex items-center gap-1 bg-[#ffb703]/20 text-[#ffb703] border border-[#ffb703]/30 text-[10px] font-black px-2.5 py-0.5 rounded-full mb-2">
              <MessageCircle className="w-3 h-3" /> অভিযোগ বা সাহায্য বার্তা
            </div>
            <h3 className="text-lg font-black text-white">এখনও সমাধান পাননি? সরাসরি বার্তা পাঠান</h3>
            <p className="text-xs text-emerald-100 font-medium mt-1 mb-4">
              আপনার প্রশ্ন বা অভিযোগ লিখে পাঠান, আমাদের বিশেষজ্ঞ প্রতিনিধি দ্রুত আপনার সাথে যোগাযোগ করবেন।
            </p>

            {ticketSubmitted ? (
              <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-[#ffb703] mx-auto" />
                <h4 className="text-sm font-black text-white">ধন্যবাদ! আপনার বার্তা সফলভাবে পাঠানো হয়েছে।</h4>
                <p className="text-xs text-emerald-100">আমাদের কাস্টমার কেয়ার টিম দ্রুত আপনার নম্বরে যোগাযোগ করবে।</p>
              </div>
            ) : (
              <form onSubmit={handleTicketSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-emerald-100 block mb-1">মোবাইল নাম্বার</label>
                    <input
                      type="tel"
                      required
                      placeholder="01XXXXXXXXX"
                      value={ticketPhone}
                      onChange={(e) => setTicketPhone(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 text-xs font-bold p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ffb703]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-emerald-100 block mb-1">বিষয় বা সমস্যা</label>
                    <input
                      type="text"
                      required
                      placeholder="যেমন: অর্ডার ডেলিভারি সংক্রান্ত"
                      value={ticketSubject}
                      onChange={(e) => setTicketSubject(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 text-xs font-bold p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ffb703]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-emerald-100 block mb-1">বিস্তারিত বার্তা</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="আপনার সমস্যাটি বিস্তারিত লিখুন..."
                    value={ticketMessage}
                    onChange={(e) => setTicketMessage(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 text-xs font-bold p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ffb703] resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#ffb703] hover:bg-[#e0a200] text-black font-black py-3.5 rounded-xl text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 active:scale-98 transition-all"
                >
                  <Send className="w-4 h-4 stroke-[2.5]" />
                  <span>সাহায্যের বার্তা পাঠান</span>
                </button>
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
export default HelpCenter;
