import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Phone, MessageSquare, Mail, MapPin, Clock, 
  Send, CheckCircle2, ShieldCheck, Sparkles, ExternalLink, Headphones 
} from "lucide-react";
import { motion } from "motion/react";
import { SEO } from "../components/SEO";

export const Contact: React.FC = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !message) return;
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      setTimeout(() => {
        setName("");
        setPhone("");
        setEmail("");
        setSubject("");
        setMessage("");
        setSubmitted(false);
      }, 4000);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-24 text-gray-800">
      <SEO title="যোগাযোগ করুন (Contact Us)" description="অল মায়াদিন বাজার সাপোর্ট ও কাস্টমার কেয়ার" />

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
            <Headphones className="w-3.5 h-3.5" /> ২৪/৭ কাস্টমার সাপোর্ট
          </div>
        </div>

        <div className="relative z-10 max-w-xl mx-auto text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            যোগাযোগ করুন
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100 font-medium">
            আমরা সর্বদাই আপনার সেবায় নিয়োজিত। যেকোনো প্রয়োজনে সরাসরি কথা বলুন বা বার্তা পাঠান।
          </p>
        </div>

        {/* Decorative Background Accents */}
        <div className="absolute -right-16 -top-16 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-4 relative z-20 space-y-6">

        {/* Channels Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          {/* Hotline Call */}
          <a
            href="tel:+8801700000000"
            className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs hover:border-[#004b23] hover:shadow-md transition-all flex flex-col justify-between group active:scale-98"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#004b23] flex items-center justify-center group-hover:scale-110 transition-transform">
                <Phone className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                সরাসরি হটলাইন
              </span>
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900">ফোন কল</h3>
              <p className="text-xs font-bold text-[#004b23] mt-0.5">+৮৮০ ১৭০০-০০০০০০</p>
              <p className="text-[10px] text-gray-400 font-medium mt-1">সকাল ৯টা থেকে রাত ১০টা পর্যন্ত</p>
            </div>
          </a>

          {/* WhatsApp Chat */}
          <a
            href="https://wa.me/8801700000000"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs hover:border-green-600 hover:shadow-md transition-all flex flex-col justify-between group active:scale-98"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <MessageSquare className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black uppercase text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                দ্রুত চ্যাট
              </span>
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900">হোয়াটসঅ্যাপ সাপোর্ট</h3>
              <p className="text-xs font-bold text-green-700 mt-0.5">+৮৮০ ১৭০০-০০০০০০</p>
              <p className="text-[10px] text-gray-400 font-medium mt-1">তাৎক্ষণিক মেসেজ ও অর্ডার সহায়তা</p>
            </div>
          </a>

          {/* Email Support */}
          <a
            href="mailto:support@allmayadin.com"
            className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs hover:border-blue-600 hover:shadow-md transition-all flex flex-col justify-between group active:scale-98"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Mail className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black uppercase text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                ইমেইল সেবা
              </span>
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900">অফিসিয়াল ইমেইল</h3>
              <p className="text-xs font-bold text-blue-700 mt-0.5">support@allmayadin.com</p>
              <p className="text-[10px] text-gray-400 font-medium mt-1">২৪ ঘণ্টার মধ্যে নিশ্চিত রিপ্লাই</p>
            </div>
          </a>

        </div>

        {/* Main Content Grid: Form + Address Info */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Contact Message Form (3 cols) */}
          <div className="lg:col-span-3 bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs">
            <div className="flex items-center gap-2 pb-4 border-b border-gray-100 mb-5">
              <Sparkles className="w-4 h-4 text-[#004b23]" />
              <h2 className="text-sm sm:text-base font-black text-gray-900">
                আমাদের বার্তা পাঠান (Send Message)
              </h2>
            </div>

            {submitted ? (
              <div className="py-10 text-center space-y-3 bg-emerald-50 rounded-2xl border border-emerald-200 p-6">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h3 className="text-base font-black text-emerald-900">বার্তা সফলভাবে পাঠানো হয়েছে!</h3>
                <p className="text-xs text-emerald-700 max-w-sm mx-auto leading-relaxed">
                  আমাদের কাস্টমার রিলেশন টিম আপনার বার্তাটি পর্যালোচনা করে দ্রুততম সময়ে আপনার ফোন বা ইমেইলে যোগাযোগ করবে।
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-bold mb-1.5">আপনার নাম <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="মোঃ আরিফুল ইসলাম"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl p-3 font-semibold focus:border-[#004b23] focus:ring-1 focus:ring-[#004b23] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold mb-1.5">মোবাইল নাম্বার <span className="text-red-500">*</span></label>
                    <input
                      type="tel"
                      required
                      placeholder="01XXXXXXXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl p-3 font-semibold focus:border-[#004b23] focus:ring-1 focus:ring-[#004b23] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-bold mb-1.5">ইমেইল এড্রেস (ঐচ্ছিক)</label>
                    <input
                      type="email"
                      placeholder="example@mail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl p-3 font-semibold focus:border-[#004b23] focus:ring-1 focus:ring-[#004b23] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold mb-1.5">বিষয়</label>
                    <input
                      type="text"
                      placeholder="যেমন: পণ্য সংক্রান্ত তথ্য"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl p-3 font-semibold focus:border-[#004b23] focus:ring-1 focus:ring-[#004b23] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1.5">আপনার বার্তা বা মন্তব্য <span className="text-red-500">*</span></label>
                  <textarea
                    rows={4}
                    required
                    placeholder="আপনার প্রশ্ন বা মতামত বিস্তারিত লিখুন..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl p-3 font-semibold focus:border-[#004b23] focus:ring-1 focus:ring-[#004b23] outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#004b23] hover:bg-[#00381a] text-white font-black py-3.5 rounded-xl shadow-md text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <span>পাঠানো হচ্ছে...</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4 stroke-[2.5]" />
                      <span>বার্তা পাঠান</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Office Address & Business Hours (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Address Card */}
            <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900">হেড অফিস ও করপোরেট ঠিকানা</h3>
                  <p className="text-[10px] text-gray-400 font-medium">অল মায়াদিন বাজার লিমিটেড</p>
                </div>
              </div>

              <div className="text-xs text-gray-600 space-y-1.5 bg-gray-50 p-4 rounded-2xl border border-gray-100 font-medium leading-relaxed">
                <p className="font-bold text-gray-900">অল মায়াদিন বাজার টাওয়ার</p>
                <p>বাড়ি নং- ১২, রোড নং- ৪, সেক্টর- ৩, উত্তরা</p>
                <p>ঢাকা- ১২৩০, বাংলাদেশ</p>
              </div>
            </div>

            {/* Business Hours */}
            <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#004b23] flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900">সেবা ও কার্যক্রমের সময়সূচি</h3>
                  <p className="text-[10px] text-gray-400 font-medium">কাস্টমার কেয়ার ও ডেলিভারি</p>
                </div>
              </div>

              <div className="divide-y divide-gray-100 text-xs text-gray-700">
                <div className="py-2 flex justify-between items-center font-medium">
                  <span>শনিবার - বৃহস্পতিবার:</span>
                  <span className="font-bold text-[#004b23]">সকাল ৯:০০ - রাত ১০:০০</span>
                </div>
                <div className="py-2 flex justify-between items-center font-medium">
                  <span>শুক্রবার:</span>
                  <span className="font-bold text-[#004b23]">বিকাল ৩:০০ - রাত ১০:০০</span>
                </div>
                <div className="py-2 flex justify-between items-center font-medium">
                  <span>অনলাইন অর্ডার:</span>
                  <span className="font-bold text-amber-600">২৪ ঘণ্টা সচল</span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
export default Contact;
