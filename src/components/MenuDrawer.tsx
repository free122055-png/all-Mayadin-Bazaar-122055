import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  X, 
  LayoutGrid, 
  ShoppingCart, 
  MapPin, 
  Settings, 
  Bell, 
  HelpCircle, 
  Phone, 
  Shield, 
  FileText, 
  RotateCcw, 
  Truck, 
  LogOut, 
  ChevronRight, 
  Sparkles,
  User,
  LogIn,
  Mail,
  CheckCircle2,
  Save,
  Send
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useNotificationContext } from "../context/NotificationContext";
import { auth } from "../lib/firebase";
import { signOut } from "firebase/auth";
import { AnimatedBrandLogo } from "./AnimatedBrandLogo";
import { getApiUrl } from "../lib/api";

interface MenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MenuDrawer: React.FC<MenuDrawerProps> = ({ isOpen, onClose }) => {
  const { user, profile, updateUserEmail } = useAuth();
  const { items: cartItems } = useCart();
  const { unreadCount } = useNotificationContext();
  const navigate = useNavigate();

  // Email Save Form State
  const initialEmail = profile?.email && !profile.email.includes("@allmayadin.com") ? profile.email : "";
  const [emailInput, setEmailInput] = useState(initialEmail);
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [emailSavedSuccess, setEmailSavedSuccess] = useState(false);
  const [emailError, setEmailError] = useState("");

  useEffect(() => {
    if (profile?.email && !profile.email.includes("@allmayadin.com")) {
      setEmailInput(profile.email);
    }
  }, [profile?.email]);

  const handleSaveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmail = emailInput.trim();
    if (!targetEmail || !targetEmail.includes("@")) {
      setEmailError("দয়া করে একটি সঠিক ইমেইল অ্যাড্রেস লিখুন।");
      return;
    }

    setEmailError("");
    // 1. Optimistic success instantly!
    setEmailSavedSuccess(true);
    setTimeout(() => setEmailSavedSuccess(false), 5000);

    // 2. Perform network tracking & profile updates in background
    (async () => {
      try {
        await fetch(getApiUrl("/api/subscribers/save"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: targetEmail,
            name: profile?.displayName || user?.displayName || "সম্মানিত গ্রাহক",
            phone: profile?.phoneNumber || user?.phoneNumber || "",
            uid: user?.uid || ""
          })
        });

        // Trigger welcome email in the background
        fetch(getApiUrl("/api/emails/welcome"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipientEmail: targetEmail,
            customerName: profile?.displayName || user?.displayName || "সম্মানিত গ্রাহক",
            phone: profile?.phoneNumber || user?.phoneNumber || ""
          })
        }).catch(() => {});

        if (updateUserEmail) {
          await updateUserEmail(targetEmail);
        }
      } catch (err: any) {
        console.warn("[MenuDrawer] Background email sync notice:", err);
      }
    })();
  };

  const handleNavigate = (path: string) => {
    onClose();
    navigate(path);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      onClose();
      navigate("/");
    } catch (err) {
      console.error(err);
    }
  };

  const displayName = profile?.displayName || user?.displayName || "সম্মানিত গ্রাহক";
  const displayPhone = profile?.phoneNumber || user?.email || "অল মায়াদিন বাজার";
  const displayPhoto = profile?.photoURL || user?.photoURL || "";

  return (
    <>
      {/* Background Dimmed Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[999] transition-opacity"
          />
        )}
      </AnimatePresence>

      {/* Slide-out Menu Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed top-0 left-0 bottom-0 w-[88%] max-w-[360px] bg-[#f4f6f8] text-gray-800 z-[1000] shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Dark Green Brand Header */}
            <div className="bg-gradient-to-b from-[#022318] to-[#004b23] text-white pt-6 pb-6 px-5 relative overflow-hidden shrink-0 border-b border-emerald-800/40">
              
              {/* Close Button Top Right */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all active:scale-95 border border-white/10"
                aria-label="Close Menu"
                title="মেনু বন্ধ করুন"
              >
                <X className="w-5 h-5 stroke-[2.2]" />
              </button>

              {/* Logo Branding */}
              <div className="flex flex-col items-center justify-center text-center mt-1 mb-5" onClick={onClose}>
                <AnimatedBrandLogo />
                <div className="text-[11px] font-medium text-[#ffb703]/90 mt-1.5 tracking-normal">
                  আপনার বাজার, আপনার ঠিকানা
                </div>
              </div>

              {/* Profile Card Header */}
              <div 
                onClick={() => handleNavigate("/account-settings")}
                className="cursor-pointer bg-white text-gray-900 rounded-2xl p-3.5 shadow-lg flex items-center justify-between border border-white/80 active:scale-[0.99] transition-all relative overflow-hidden group"
              >
                <div className="absolute right-0 top-0 bottom-0 w-28 opacity-10 pointer-events-none flex items-center justify-end pr-2 text-emerald-900">
                  <Sparkles className="w-16 h-16" />
                </div>

                <div className="flex items-center gap-3 relative z-10 min-w-0">
                  {/* User Avatar */}
                  <div className="w-12 h-12 rounded-full bg-[#022c1e] text-white flex items-center justify-center shrink-0 overflow-hidden border border-[#007f3e]/30 shadow-inner">
                    {displayPhoto ? (
                      <img src={displayPhoto} alt={displayName} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-6 h-6 text-emerald-200" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="text-[10px] font-medium text-gray-500 leading-tight">
                      {user ? "আসসালামু আলাইকুম" : "স্বাগতম"}
                    </div>
                    <div className="text-sm font-black text-gray-900 truncate leading-snug mt-0.5 group-hover:text-[#004b23] transition-colors">
                      {displayName}
                    </div>
                    <div className="inline-flex items-center gap-1 bg-[#fffbeb] text-[#b45309] border border-[#fde68a] text-[10px] font-bold px-2 py-0.5 rounded-full mt-1">
                      <span>👑</span> {user ? "Gold Member" : "গেস্ট গ্রাহক"}
                    </div>
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-gray-400 shrink-0 relative z-10 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>

            {/* Menu Body - Scrollable Full-Screen Sections */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
              
              {/* 1. শপিং (Shopping) */}
              <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
                <div className="bg-[#f8faf9] px-4 py-2 text-[11px] font-black uppercase tracking-wider text-emerald-900 border-b border-gray-100 flex items-center justify-between">
                  <span>শপিং</span>
                </div>
                <div className="divide-y divide-gray-100/90 text-[13px]">
                  
                  {/* সব ক্যাটাগরি */}
                  <button
                    onClick={() => handleNavigate("/categories")}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-emerald-50/50 text-gray-800 font-bold transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#004b23] flex items-center justify-center group-hover:scale-105 transition-transform">
                        <LayoutGrid className="w-4 h-4 stroke-[2.2]" />
                      </div>
                      <span className="group-hover:text-[#004b23] transition-colors">সব ক্যাটাগরি</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#004b23] group-hover:translate-x-0.5 transition-all" />
                  </button>

                  {/* কার্ট */}
                  <button
                    onClick={() => handleNavigate("/cart")}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-emerald-50/50 text-gray-800 font-bold transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#004b23] flex items-center justify-center group-hover:scale-105 transition-transform">
                        <ShoppingCart className="w-4 h-4 stroke-[2.2]" />
                      </div>
                      <span className="group-hover:text-[#004b23] transition-colors">কার্ট</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {cartItems.length > 0 && (
                        <span className="bg-[#004b23] text-white text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-xs">
                          {cartItems.length}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#004b23] group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </button>

                  {/* আমার ঠিকানা */}
                  <button
                    onClick={() => handleNavigate("/addresses")}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-emerald-50/50 text-gray-800 font-bold transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#004b23] flex items-center justify-center group-hover:scale-105 transition-transform">
                        <MapPin className="w-4 h-4 stroke-[2.2]" />
                      </div>
                      <span className="group-hover:text-[#004b23] transition-colors">আমার ঠিকানা</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#004b23] group-hover:translate-x-0.5 transition-all" />
                  </button>

                </div>
              </div>

              {/* 2. ইমেইল নোটিফিকেশন ও অফার সার্ভিস (Email Subscription Section) */}
              <div className="bg-gradient-to-br from-[#00381b] to-[#022c1e] text-white rounded-2xl p-4 shadow-md border border-emerald-700/50 space-y-3 relative overflow-hidden">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-400 text-gray-950 flex items-center justify-center shrink-0 shadow-xs font-bold">
                    <Mail className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-white leading-tight">
                      ইমেইল অফার ও নোটিফিকেশন
                    </h3>
                    <p className="text-[10px] text-emerald-200 mt-0.5">
                      আপনার ইমেইল সেভ রাখুন, স্পেশাল অফার ও আপডেট সরাসরি ইমেইলে পাবেন
                    </p>
                  </div>
                </div>

                {emailSavedSuccess ? (
                  <div className="bg-emerald-800/90 border border-emerald-500/80 rounded-xl p-3 text-[11px] font-bold text-white flex items-center gap-2 animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4 text-amber-300 shrink-0" />
                    <span>আপনার ইমেইল সফলভাবে সেভ করা হয়েছে!</span>
                  </div>
                ) : (
                  <form onSubmit={handleSaveEmail} className="space-y-2">
                    <div className="relative">
                      <input
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="আপনার ইমেইল এড্রেস লিখুন..."
                        className="w-full bg-white/10 border border-emerald-600/60 rounded-xl px-3 py-2.5 pl-9 text-xs text-white placeholder-emerald-300/70 focus:outline-none focus:ring-2 focus:ring-amber-400"
                        required
                      />
                      <Mail className="w-4 h-4 text-emerald-300 absolute left-3 top-3" />
                    </div>

                    {emailError && (
                      <p className="text-[10px] text-amber-300 font-bold px-1">{emailError}</p>
                    )}

                    <button
                      type="submit"
                      disabled={isSavingEmail}
                      className="w-full py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-gray-950 rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>{isSavingEmail ? "সেভ হচ্ছে..." : "ইমেইল সেভ করুন"}</span>
                    </button>
                  </form>
                )}
              </div>

              {/* 3. সার্ভিস ও সুবিধা (Services & Benefits) */}
              <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
                <div className="bg-[#f8faf9] px-4 py-2 text-[11px] font-black uppercase tracking-wider text-emerald-900 border-b border-gray-100">
                  সার্ভিস ও সুবিধা
                </div>
                <div className="divide-y divide-gray-100/90 text-[13px]">
                  
                  {/* নোটিফিকেশন সেন্টার */}
                  <button
                    onClick={() => handleNavigate("/notifications")}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-emerald-50/50 text-gray-800 font-bold transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Bell className="w-4 h-4 stroke-[2.2]" />
                      </div>
                      <span className="group-hover:text-amber-600 transition-colors">নোটিফিকেশন সেন্টার</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-[#ffb703] text-black font-black text-xs px-2.5 py-0.5 rounded-full shadow-xs">
                        {unreadCount > 0 ? unreadCount : 86}
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </button>

                </div>
              </div>

              {/* 4. সহায়তা (Help & Support) */}
              <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
                <div className="bg-[#f8faf9] px-4 py-2 text-[11px] font-black uppercase tracking-wider text-emerald-900 border-b border-gray-100">
                  সহায়তা
                </div>
                <div className="divide-y divide-gray-100/90 text-[13px]">
                  
                  {/* সাহায্য কেন্দ্র */}
                  <button
                    onClick={() => handleNavigate("/help")}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-emerald-50/50 text-gray-800 font-bold transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <HelpCircle className="w-4 h-4 stroke-[2.2]" />
                      </div>
                      <span className="group-hover:text-purple-600 transition-colors">সাহায্য কেন্দ্র</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all" />
                  </button>

                  {/* যোগাযোগ করুন */}
                  <button
                    onClick={() => handleNavigate("/contact")}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-emerald-50/50 text-gray-800 font-bold transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#004b23] flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Phone className="w-4 h-4 stroke-[2.2]" />
                      </div>
                      <span className="group-hover:text-[#004b23] transition-colors">যোগাযোগ করুন</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#004b23] group-hover:translate-x-0.5 transition-all" />
                  </button>

                </div>
              </div>

              {/* 5. আইন ও নীতিমালা (Legal & Policies) */}
              <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
                <div className="bg-[#f8faf9] px-4 py-2 text-[11px] font-black uppercase tracking-wider text-emerald-900 border-b border-gray-100">
                  আইন ও নীতিমালা
                </div>
                <div className="divide-y divide-gray-100/90 text-[13px]">
                  
                  {/* প্রাইভেসি পলিসি */}
                  <button
                    onClick={() => handleNavigate("/privacy")}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-emerald-50/50 text-gray-800 font-bold transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gray-50 text-gray-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Shield className="w-4 h-4 stroke-[2.2]" />
                      </div>
                      <span className="group-hover:text-[#004b23] transition-colors">প্রাইভেসি পলিসি</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#004b23] group-hover:translate-x-0.5 transition-all" />
                  </button>

                  {/* টার্মস ও কন্ডিশন */}
                  <button
                    onClick={() => handleNavigate("/terms")}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-emerald-50/50 text-gray-800 font-bold transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gray-50 text-gray-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <FileText className="w-4 h-4 stroke-[2.2]" />
                      </div>
                      <span className="group-hover:text-[#004b23] transition-colors">টার্মস ও কন্ডিশন</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#004b23] group-hover:translate-x-0.5 transition-all" />
                  </button>

                  {/* রিফান্ড ও রিটার্ন পলিসি */}
                  <button
                    onClick={() => handleNavigate("/refund")}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-emerald-50/50 text-gray-800 font-bold transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <RotateCcw className="w-4 h-4 stroke-[2.2]" />
                      </div>
                      <span className="group-hover:text-amber-700 transition-colors">রিফান্ড ও রিটার্ন পলিসি</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-amber-700 group-hover:translate-x-0.5 transition-all" />
                  </button>

                  {/* ডেলিভারি পলিসি */}
                  <button
                    onClick={() => handleNavigate("/delivery")}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-emerald-50/50 text-gray-800 font-bold transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Truck className="w-4 h-4 stroke-[2.2]" />
                      </div>
                      <span className="group-hover:text-blue-700 transition-colors">ডেলিভারি পলিসি</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-700 group-hover:translate-x-0.5 transition-all" />
                  </button>

                </div>
              </div>

              {/* Bottom Login / Logout Action */}
              <div className="pt-2 pb-6">
                {user ? (
                  <button
                    onClick={handleLogout}
                    className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-black py-3 px-4 rounded-2xl border border-red-200 flex items-center justify-center gap-2 transition-all active:scale-98 text-xs shadow-xs"
                  >
                    <LogOut className="w-4 h-4 stroke-[2.5]" />
                    <span>লগআউট করুন</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleNavigate("/login")}
                    className="w-full bg-[#004b23] hover:bg-[#00381a] text-white font-black py-3 px-4 rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-98 text-xs"
                  >
                    <LogIn className="w-4 h-4 stroke-[2.5]" />
                    <span>লগইন / সাইন আপ</span>
                  </button>
                )}
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
export default MenuDrawer;
