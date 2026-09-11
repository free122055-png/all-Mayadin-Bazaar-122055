import React, { useState, useEffect } from "react";
import { Mail, Send, CheckCircle2, User, Users, Image as ImageIcon, Search, RefreshCw, Sparkles, ExternalLink, ShieldCheck, Settings, AlertCircle, Key, Check } from "lucide-react";
import { getApiUrl } from "../../lib/api";

interface Subscriber {
  id: string;
  email: string;
  name: string;
  phone: string;
  savedAt: number;
  source: string;
}

export const EmailAutomationSection: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [subscribersLoading, setSubscribersLoading] = useState(false);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form State
  const [sendType, setSendType] = useState<"specific" | "all">("all");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [title, setTitle] = useState("আল মায়াদিন বাজার বিশেষ অফার ও আপডেট");
  const [messageBody, setMessageBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  // SMTP Settings State
  const [showSmtpConfig, setShowSmtpConfig] = useState(false);
  const [smtpUser, setSmtpUser] = useState("rajibul8610@gmail.com");
  const [smtpPass, setSmtpPass] = useState("xgjgojyuksfsvoxp");
  const [smtpHost, setSmtpHost] = useState("smtp.gmail.com");
  const [smtpPort, setSmtpPort] = useState("587");
  const [isSmtpConfigured, setIsSmtpConfigured] = useState(true);
  const [isSavingSmtp, setIsSavingSmtp] = useState(false);
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);

  const handleTestEmail = async () => {
    const target = smtpUser || "rajibul8610@gmail.com";
    setIsTestingSmtp(true);
    try {
      const res = await fetch(getApiUrl("/api/admin/email-automation/test-send"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientEmail: target,
          subject: "আল মায়াদিন বাজার - SMTP ও ইমেইল সংযোগ টেস্ট",
          body: `<div style="padding:24px;font-family:sans-serif;color:#333;background:#fdfdfd;border-radius:16px;border:1px solid #e0e0e0;max-width:550px;margin:0 auto;"><h2 style="color:#004b23;margin-top:0;">আল মায়াদিন বাজার ইমেইল সার্ভিস</h2><p style="font-size:14px;line-height:1.6;">অভিনন্দন! আপনার জিমেইল SMTP সেটিংস এবং ইমেইল সার্ভার সফলভাবে সংযুক্ত রয়েছে।</p><div style="background:#e8f5e9;padding:12px 16px;border-radius:8px;color:#1b5e20;font-weight:bold;font-size:13px;">✅ টেস্ট ইমেইল সফলভাবে ইনবক্সে পৌঁছেছে!</div></div>`
        })
      });
      const data = await res.json();
      if (data.success) {
        showToastMsg(`✅ টেস্ট ইমেইল সফলভাবে ${target} এ পাঠানো হয়েছে!`, "success");
      } else {
        showToastMsg(`❌ ইমেইল পাঠাতে ব্যর্থ: ${data.error || "SMTP সমস্যা"}`, "error");
      }
    } catch (err: any) {
      showToastMsg("ত্রুটি: " + err.message, "error");
    } finally {
      setIsTestingSmtp(false);
    }
  };

  // Preset Image Banner suggestions
  const presetBanners = [
    { label: "স্পেশাল ডিসকাউন্ট ব্যানার", url: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80" },
    { label: "তাজা গ্রোসারি ও ফলমূল", url: "https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=1200&q=80" },
    { label: "অরগানিক মধু ও তেল", url: "https://images.unsplash.com/photo-1587049352847-4a222e784d38?auto=format&fit=crop&w=1200&q=80" }
  ];

  const showToastMsg = (text: string, type: "success" | "error" = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 5000);
  };

  const fetchEmailConfig = async () => {
    try {
      const res = await fetch(getApiUrl("/api/admin/email-config"));
      const data = await res.json();
      if (data.success && data.config) {
        setSmtpUser(data.config.smtpUser || "");
        setSmtpHost(data.config.smtpHost || "smtp.gmail.com");
        setSmtpPort(data.config.smtpPort || "587");
        setIsSmtpConfigured(Boolean(data.config.isSmtpConfigured));
        if (data.config.smtpPassMasked) {
          setSmtpPass(data.config.smtpPassMasked);
        }
      }
    } catch (e) {
      console.error("Error fetching email config:", e);
    }
  };

  const fetchSubscribers = async () => {
    setSubscribersLoading(true);
    try {
      const res = await fetch(getApiUrl("/api/admin/email-subscribers"));
      const data = await res.json();
      if (data.success && Array.isArray(data.subscribers)) {
        setSubscribers(data.subscribers);
      }
    } catch (err) {
      console.error("Error fetching subscribers:", err);
    } finally {
      setSubscribersLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
    fetchEmailConfig();
  }, []);

  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSmtp(true);
    try {
      const res = await fetch(getApiUrl("/api/admin/email-config"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          smtpHost,
          smtpPort,
          smtpUser,
          smtpPass,
          fromName: "আল মায়াদিন বাজার"
        })
      });
      const data = await res.json();
      if (data.success) {
        showToastMsg("ইমেইল ও SMTP সেটিংস সফলভাবে সংরক্ষণ করা হয়েছে!", "success");
        fetchEmailConfig();
        setShowSmtpConfig(false);
      } else {
        showToastMsg(data.error || "সেটিংস সংরক্ষণে ব্যর্থ হয়েছে", "error");
      }
    } catch (err: any) {
      showToastMsg("ত্রুটি: " + err.message, "error");
    } finally {
      setIsSavingSmtp(false);
    }
  };

  const filteredSubscribers = subscribers.filter(sub => 
    sub.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sub.phone.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectSubscriber = (email: string) => {
    setSendType("specific");
    setRecipientEmail(email);
    const formElem = document.getElementById("email-compose-form");
    if (formElem) {
      formElem.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    if (sendType === "specific" && !recipientEmail.trim()) {
      showToastMsg("দয়া করে প্রাপকের ইমেইল অ্যাড্রেস দিন।", "error");
      return;
    }

    if (!subject.trim() || !messageBody.trim()) {
      showToastMsg("দয়া করে ইমেইল সাবজেক্ট এবং কন্টেন্ট লিখুন।", "error");
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        title: title.trim() || "আল মায়াদিন বাজার আপডেট",
        subject: subject.trim(),
        customBody: messageBody.trim(),
        imageUrl: imageUrl.trim(),
        sendMode: sendType,
      };

      if (sendType === "specific") {
        payload.recipientEmail = recipientEmail.trim();
      }

      const res = await fetch(getApiUrl("/api/admin/email-campaigns/send"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        showToastMsg(`সফলভাবে ইমেইল পাঠানো হয়েছে! (${data.count || 1} জন প্রাপক)`, "success");
        if (sendType === "specific") setRecipientEmail("");
        setSubject("");
        setMessageBody("");
      } else {
        showToastMsg(data.error || "ইমেইল পাঠাতে ব্যর্থ হয়েছে।", "error");
      }
    } catch (err: any) {
      showToastMsg("সার্ভার ত্রুটি: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-16 max-w-4xl mx-auto">
      {toast && (
        <div className={`fixed top-20 right-4 z-50 text-white px-5 py-3.5 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2.5 animate-bounce border ${
          toast.type === "success" ? "bg-[#004b23] border-emerald-400" : "bg-red-700 border-red-400"
        }`}>
          {toast.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-[#ffb703] shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-300 shrink-0" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-[#022318] to-[#004b23] text-white p-6 sm:p-8 rounded-3xl shadow-lg border border-emerald-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 bg-amber-400/20 text-amber-300 text-[11px] font-black px-3 py-1 rounded-full mb-2 border border-amber-400/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ইমেইল মার্কেটিং ও সার্ভিস প্যানেল</span>
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            <Mail className="w-6 h-6 text-amber-400" />
            <span>ইমেইল সাবস্ক্রাইবার ও মেসেজ সার্ভিস</span>
          </h2>
          <p className="text-xs text-emerald-200 mt-1 max-w-xl">
            ইউজারদের সেভকৃত ইমেইল তালিকা দেখুন এবং ছবিসহ যেকোনো অফার বা নোটিফিকেশন সরাসরি পাঠান।
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowSmtpConfig(!showSmtpConfig)}
            className="bg-amber-400 hover:bg-amber-500 text-gray-950 px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 active:scale-95 transition-all cursor-pointer shadow-md"
          >
            <Settings className="w-4 h-4" />
            <span>SMTP / ইমেইল সেটিংস</span>
          </button>

          <button
            onClick={fetchSubscribers}
            disabled={subscribersLoading}
            className="bg-white/10 hover:bg-white/20 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border border-white/20 active:scale-95 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${subscribersLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* SERVER STATUS BADGE */}
      <div className={`p-4 rounded-2xl border text-xs font-medium flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
        isSmtpConfigured 
          ? "bg-emerald-50 border-emerald-300 text-emerald-950" 
          : "bg-amber-50 border-amber-300 text-amber-950"
      }`}>
        <div className="flex items-start sm:items-center gap-2.5">
          <ShieldCheck className={`w-5 h-5 shrink-0 ${isSmtpConfigured ? "text-[#004b23]" : "text-amber-600"}`} />
          <div>
            <h4 className="font-black text-xs">
              {isSmtpConfigured ? "🟢 কাস্টম SMTP সার্ভিস সক্রিয় (Gmail / Custom Email)" : "🟡 Resend ফ্রি এপিআই মোড সক্রিয়"}
            </h4>
            <p className="text-[11px] opacity-80 mt-0.5">
              {isSmtpConfigured 
                ? `বর্তমানে (${smtpUser})-এর মাধ্যমে যেকোনো কাস্টমারের ইমেইলে আনলিমিটেড অফার পাঠানো যাবে।` 
                : "Resend ফ্রি এপিআই টেস্ট মোডে কাজ করছে। যেকোনো ইউজারের ইমেইলে ১০০% ডেলিভারির জন্য আপনার Gmail App Password যোগ করুন।"}
            </p>
          </div>
        </div>

        {!isSmtpConfigured && (
          <button
            onClick={() => setShowSmtpConfig(true)}
            className="bg-amber-500 hover:bg-amber-600 text-gray-950 text-[11px] font-black px-3.5 py-2 rounded-xl shrink-0 transition-all cursor-pointer shadow-xs"
          >
            Gmail App Password যুক্ত করুন
          </button>
        )}
      </div>

      {/* COLLAPSIBLE SMTP SETTINGS CARD */}
      {showSmtpConfig && (
        <div className="bg-white p-6 rounded-3xl shadow-md border-2 border-amber-400 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-600" />
              <span>ইমেইল ডেলিভারি ও Gmail App Password সেটআপ</span>
            </h3>
            <button
              onClick={() => setShowSmtpConfig(false)}
              className="text-xs font-bold text-gray-500 hover:text-gray-900"
            >
              বন্ধ করুন ✕
            </button>
          </div>

          <p className="text-xs text-gray-600 leading-relaxed">
            💡 <strong>কীভাবে Gmail দিয়ে সব কাস্টমারকে ইমেইল পাঠাবেন?</strong><br />
            ১. আপনার জিমেইল একাউন্টের <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="text-blue-600 underline font-bold">App Passwords (এপ পাসওয়ার্ড)</a> পেজে যান।<br />
            ২. সেখানে একটি ১৬ অক্ষরের <strong>App Password</strong> তৈরি করুন।<br />
            ৩. নিচে আপনার জিমেইল আইডি ও ১৬ অক্ষরের পাসওয়ার্ডটি বসিয়ে সেভ দিন।
          </p>

          <form onSubmit={handleSaveSmtp} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-800">জিমেইল বা ইমেইল অ্যাড্রেস (SMTP User):</label>
                <input
                  type="email"
                  value={smtpUser}
                  onChange={e => setSmtpUser(e.target.value)}
                  placeholder="উদাহরণ: mybusiness@gmail.com"
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#004b23]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-800">১৬ অক্ষরের Gmail App Password (SMTP Password):</label>
                <input
                  type="password"
                  value={smtpPass}
                  onChange={e => setSmtpPass(e.target.value)}
                  placeholder="উদাহরণ: abcd efgh ijkl mnop"
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#004b23]"
                  required
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleTestEmail}
                disabled={isTestingSmtp}
                className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black px-5 py-3 rounded-xl flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                <Send className="w-4 h-4 text-amber-600" />
                <span>{isTestingSmtp ? "টেস্ট মেসেজ যাচ্ছে..." : "🧪 ইমেইল সংযোগ টেস্ট করুন"}</span>
              </button>

              <button
                type="submit"
                disabled={isSavingSmtp}
                className="bg-[#004b23] hover:bg-[#00381b] text-white text-xs font-black px-6 py-3 rounded-xl flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
              >
                <Check className="w-4 h-4 text-[#ffb703]" />
                <span>{isSavingSmtp ? "সংরক্ষণ হচ্ছে..." : "কনফিগারেশন সেভ করুন"}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SECTION 1: Saved Subscriber List */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#004b23]" />
              <span>সেভকৃত ইউজার ইমেইল তালিকা ({subscribers.length} জন)</span>
            </h3>
            <p className="text-[11px] text-gray-500 mt-0.5">
              মেনু সেকশন বা প্রোফাইল থেকে যেসব ইউজার তাদের ইমেইল সেভ করেছেন
            </p>
          </div>

          <div className="relative min-w-[240px]">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="ইমেইল বা নাম দিয়ে খুঁজুন..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#004b23]"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          </div>
        </div>

        {subscribersLoading ? (
          <div className="py-12 text-center text-xs text-gray-500 font-bold flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-[#004b23]" />
            <span>ইমেইল সাবস্ক্রাইবার লোড হচ্ছে...</span>
          </div>
        ) : filteredSubscribers.length === 0 ? (
          <div className="py-10 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <p className="text-xs font-bold text-gray-600">কোনো সেভকৃত ইমেইল পাওয়া যায়নি</p>
            <p className="text-[11px] text-gray-400 mt-1">ইউজাররা অ্যাপের মেনু থেকে ইমেইল সেভ করলে এখানে দেখা যাবে</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-emerald-50/60 text-emerald-950 font-black border-b border-emerald-100">
                  <th className="p-3.5 rounded-l-xl">গ্রাহকের নাম</th>
                  <th className="p-3.5">ইমেইল অ্যাড্রেস</th>
                  <th className="p-3.5">মোবাইল নম্বর</th>
                  <th className="p-3.5">উৎস (Source)</th>
                  <th className="p-3.5 text-right rounded-r-xl">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                {filteredSubscribers.map((sub) => (
                  <tr key={sub.id} className="hover:bg-emerald-50/30 transition-colors">
                    <td className="p-3.5 font-bold text-gray-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-emerald-100 text-[#004b23] font-black flex items-center justify-center text-xs shrink-0">
                        {sub.name ? sub.name.charAt(0).toUpperCase() : "U"}
                      </div>
                      <span>{sub.name}</span>
                    </td>
                    <td className="p-3.5 font-mono text-emerald-900 font-bold">{sub.email}</td>
                    <td className="p-3.5 text-gray-600">{sub.phone || "N/A"}</td>
                    <td className="p-3.5">
                      <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-gray-200">
                        {sub.source === "menu_newsletter" ? "মেনু সেকশন" : "প্রোফাইল অ্যাকাউন্ট"}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => handleSelectSubscriber(sub.email)}
                        className="bg-[#004b23] hover:bg-[#00381b] text-white text-[11px] font-black px-3 py-1.5 rounded-xl flex items-center gap-1.5 ml-auto cursor-pointer transition-all active:scale-95 shadow-xs"
                      >
                        <Send className="w-3 h-3 text-[#ffb703]" />
                        <span>ইমেইল পাঠান</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 2: Compose & Send Email Form */}
      <div id="email-compose-form" className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-200/80 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
            <Send className="w-5 h-5 text-[#004b23]" />
            <span>নতুন ইমেইল বা অফার কম্পোজ করুন (ছবি সহ)</span>
          </h3>
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="text-xs font-bold text-[#004b23] bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 transition-colors"
          >
            {showPreview ? "ফর্ম দেখুন" : "লাইভ ইমেইল প্রিভিউ দেখুন"}
          </button>
        </div>

        <form onSubmit={handleSendEmail} className="space-y-6">
          
          {/* STEP 1: Recipient Type Selection */}
          <div className="space-y-3">
            <label className="block text-xs font-black text-gray-900 uppercase tracking-wide">
              ১. প্রাপক নির্বাচন করুন
            </label>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSendType("all")}
                className={`p-4 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                  sendType === "all"
                    ? "border-[#004b23] bg-emerald-50/70 shadow-sm ring-1 ring-[#004b23]"
                    : "border-gray-200 bg-gray-50 hover:bg-gray-100"
                }`}
              >
                <div className={`p-2.5 rounded-xl ${sendType === "all" ? "bg-[#004b23] text-white" : "bg-gray-200 text-gray-700"}`}>
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-xs text-gray-900">সকল সেভকৃত ইমেইল গ্রাহক ({subscribers.length})</h4>
                  <p className="text-[11px] text-gray-500">সকল সাবস্ক্রাইবড ইউজারের কাছে এক ক্লিকে ব্রডকাস্ট করুন</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSendType("specific")}
                className={`p-4 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                  sendType === "specific"
                    ? "border-[#004b23] bg-emerald-50/70 shadow-sm ring-1 ring-[#004b23]"
                    : "border-gray-200 bg-gray-50 hover:bg-gray-100"
                }`}
              >
                <div className={`p-2.5 rounded-xl ${sendType === "specific" ? "bg-[#004b23] text-white" : "bg-gray-200 text-gray-700"}`}>
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-xs text-gray-900">নির্দিষ্ট একজন ইউজারের ইমেইল</h4>
                  <p className="text-[11px] text-gray-500">নির্দিষ্ট ইমেইল ঠিকানায় সরাসরি পাঠান</p>
                </div>
              </button>
            </div>
          </div>

          {/* Specific Email Input */}
          {sendType === "specific" && (
            <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-2 animate-fadeIn">
              <label className="block text-xs font-bold text-emerald-900">
                প্রাপকের ইমেইল অ্যাড্রেস (Recipient Email):
              </label>
              <input
                type="email"
                value={recipientEmail}
                onChange={e => setRecipientEmail(e.target.value)}
                placeholder="উদাহরণ: customer@gmail.com"
                className="w-full bg-white border border-emerald-300 rounded-xl px-4 py-3 text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#004b23]"
                required={sendType === "specific"}
              />
            </div>
          )}

          {/* STEP 2: Subject & Header Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-gray-900 uppercase tracking-wide">
                ২. ইমেইল সাবজেক্ট (Subject Line)
              </label>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="উদাহরণ: 🌙 আপনার জন্য আল মায়াদিন বাজারের বিশেষ অফার!"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#004b23]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-black text-gray-900 uppercase tracking-wide">
                ৩. ইমেইল হেডার টাইটেল (Header Title)
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="উদাহরণ: আল মায়াদিন বাজার বিশেষ অফার ও আপডেট"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#004b23]"
              />
            </div>
          </div>

          {/* STEP 3: Offer Image Attachment Section (ছবি সহ) */}
          <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-2xl space-y-3">
            <label className="block text-xs font-black text-amber-950 uppercase tracking-wide flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-amber-600" />
              <span>৪. অফার বা নোটিফিকেশনের ছবি যুক্ত করুন (Image Attachment / Banner)</span>
            </label>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {presetBanners.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setImageUrl(preset.url)}
                  className={`p-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer text-left truncate ${
                    imageUrl === preset.url
                      ? "bg-amber-100 border-amber-500 text-amber-950 font-black shadow-xs"
                      : "bg-white border-amber-200 hover:bg-amber-100/50 text-gray-700"
                  }`}
                >
                  📸 {preset.label}
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="url"
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                placeholder="অথবা সরাসরি ছবির URL লিঙ্ক দিন (https://...)"
                className="flex-1 bg-white border border-amber-300 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#004b23]"
              />

              <label className="bg-amber-500 hover:bg-amber-600 text-gray-950 text-xs font-black px-4 py-2.5 rounded-xl cursor-pointer shrink-0 transition-colors shadow-xs">
                <span>কম্পিউটার থেকে ছবি দিন</span>
                <input type="file" accept="image/*" onChange={handleImageFileChange} className="hidden" />
              </label>
            </div>

            {imageUrl && (
              <div className="mt-2 relative rounded-xl overflow-hidden border border-amber-300 max-h-48 bg-white flex items-center justify-center p-2">
                <img src={imageUrl} alt="Offer Preview" className="max-h-44 object-contain rounded-lg" />
                <button
                  type="button"
                  onClick={() => setImageUrl("")}
                  className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-md shadow-md hover:bg-red-700"
                >
                  ছবি রিমুভ করুন
                </button>
              </div>
            )}
          </div>

          {/* STEP 4: Message Body */}
          <div className="space-y-1.5">
            <label className="block text-xs font-black text-gray-900 uppercase tracking-wide">
              ৫. ইমেইল মেসেজ বা কন্টেন্ট (Message Content)
            </label>
            <textarea
              rows={6}
              value={messageBody}
              onChange={e => setMessageBody(e.target.value)}
              placeholder="প্রিয় গ্রাহক, আল মায়াদিন বাজারে এসেছে ১০০% তাজা অরগানিক মধু ও প্রিমিয়াম খেজুর। বিশেষ ১৫% ছাড় পেতে আজই ভিজিট করুন..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#004b23]"
              required
            />
          </div>

          {/* Live Preview Box if Toggled */}
          {showPreview && (
            <div className="p-6 bg-gray-100 rounded-2xl border border-gray-300 space-y-3">
              <h4 className="text-xs font-black text-gray-700 uppercase tracking-wider">ইমেইল লেআউট প্রিভিউ (গ্রাহক ইমেইলে যেভাবে দেখবেন)</h4>
              <div className="max-w-md mx-auto bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden text-left">
                <div className="bg-gradient-to-r from-[#022318] to-[#004b23] p-4 text-center text-white">
                  <h1 className="text-base font-black">আল মায়াদিন বাজার</h1>
                  <p className="text-[10px] text-amber-300">আপনার বাজার, আপনার ঠিকানা</p>
                </div>
                {imageUrl && (
                  <div className="p-3 bg-white text-center">
                    <img src={imageUrl} alt="Banner" className="max-h-48 rounded-xl mx-auto object-cover border" />
                  </div>
                )}
                <div className="p-5 text-gray-800 space-y-3">
                  <h2 className="text-sm font-black text-[#004b23] border-b pb-2">{title || "আল মায়াদিন বাজার অফার"}</h2>
                  <p className="text-xs leading-relaxed whitespace-pre-wrap">{messageBody || "এখানে আপনার ইমেইলের মূল মেসেজ দেখা যাবে..."}</p>
                  <div className="pt-2 text-center">
                    <span className="inline-block bg-[#004b23] text-white text-xs font-black px-5 py-2.5 rounded-xl shadow-xs">
                      অফারটি দেখুন ও কেনাকাটা করুন
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#004b23] hover:bg-[#00381b] text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all disabled:opacity-50 active:scale-98"
            >
              <Send className="w-4 h-4 text-[#ffb703]" />
              <span>{loading ? "ইমেইল পাঠানো হচ্ছে..." : "ছবি সহ এখনই ইমেইল পাঠান"}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default EmailAutomationSection;

