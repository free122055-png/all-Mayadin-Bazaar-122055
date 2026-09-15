import React, { useState } from "react";
import { 
  X, 
  Lock, 
  Mail, 
  User, 
  Phone, 
  MapPin, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight,
  UserPlus,
  LogIn,
  KeyRound,
  ShoppingBag,
  MessageSquare,
  ExternalLink,
  Copy,
  Check,
  Headphones
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../context/AuthContext";
import { parseBangladeshiPhone } from "../lib/phoneUtils";
import { ForgotPasswordModal } from "./ForgotPasswordModal";

const AVATAR_PRESETS = [
  { id: "av1", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80", label: "Avatar 1" },
  { id: "av2", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80", label: "Avatar 2" },
  { id: "av3", url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80", label: "Avatar 3" },
  { id: "av4", url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80", label: "Avatar 4" },
  { id: "av5", url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&q=80", label: "Avatar 5" },
  { id: "av6", url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&q=80", label: "Avatar 6" },
];

export const AuthModal: React.FC = () => {
  const { 
    isAuthModalOpen, 
    authModalMode, 
    authModalMessage, 
    closeAuthModal, 
    loginWithEmail, 
    registerWithEmail, 
    resetPassword,
    quickDemoLogin 
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot' | 'otp'>((authModalMode as any) || 'login');
  
  // Sync tab when modal opens with a specific mode
  React.useEffect(() => {
    if (authModalMode) {
      setActiveTab(authModalMode);
    }
  }, [authModalMode, isAuthModalOpen]);

  // Login Form States
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register Form States
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regAddress, setRegAddress] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_PRESETS[0].url);
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Forgot Password State
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);
  const [showForgotResetModal, setShowForgotResetModal] = useState(false);

  // Common States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleFirebaseError = (err: any) => {
    const code = err?.code || "";
    if (code.includes("user-not-found") || code.includes("invalid-credential") || code.includes("wrong-password")) {
      return "ইমেইল অথবা পাসওয়ার্ডটি সঠিক নয়। অনুগ্রহ করে পুনরায় চেষ্টা করুন।";
    } else if (code.includes("email-already-in-use")) {
      return "এই ইমেইলটি দিয়ে ইতিমধ্যে অ্যাকাউন্ট খোলা আছে। অনুগ্রহ করে লগইন করুন।";
    } else if (code.includes("weak-password")) {
      return "পাসওয়ার্ডটি নূন্যতম ৬ অক্ষরের হতে হবে।";
    } else if (code.includes("invalid-email")) {
      return "দয়া করে একটি সঠিক ও কার্যকর ইমেইল এড্রেস লিখুন।";
    } else if (code.includes("network-request-failed")) {
      return "ইন্টারনেট সংযোগ চেক করুন এবং পুনরায় চেষ্টা করুন।";
    }
    return err?.message || "একটি সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।";
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    let emailToUse = loginEmail.trim();
    if (!emailToUse.includes("@")) {
      const parsed = parseBangladeshiPhone(emailToUse);
      if (parsed.isValid) {
        emailToUse = parsed.email;
      } else {
        setErrorMsg("সঠিক ১১ সংখ্যার বাংলাদেশি মোবাইল নম্বর অথবা ইমেইল লিখুন।");
        return;
      }
    }

    if (!emailToUse || !loginPassword) {
      setErrorMsg("দয়া করে ইমেইল/ফোন নম্বর এবং পাসওয়ার্ড পূরণ করুন।");
      return;
    }

    setIsLoading(true);
    try {
      await loginWithEmail(emailToUse, loginPassword);
      setSuccessMsg("স্বাগতম! আপনি সফলভাবে লগইন করেছেন।");
    } catch (err: any) {
      setErrorMsg(handleFirebaseError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!regName.trim()) {
      setErrorMsg("আপনার পূর্ণ নাম প্রদান করুন।");
      return;
    }
    if (!regPhone.trim()) {
      setErrorMsg("আপনার মোবাইল নম্বর প্রদান করুন।");
      return;
    }
    if (regPassword.length < 6) {
      setErrorMsg("পাসওয়ার্ড নূন্যতম ৬ অক্ষরের হতে হবে।");
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMsg("উভয় পাসওয়ার্ড একই হতে হবে।");
      return;
    }
    if (!agreeTerms) {
      setErrorMsg("শর্তাবলী ও নীতিমালা গ্রহণ করুন।");
      return;
    }

    setIsLoading(true);
    try {
      const normalizedDigits = regPhone.trim().replace(/[^0-9]/g, "").slice(-10);
      const dummyEmail = `${normalizedDigits}@allmayadin.com`;

      await registerWithEmail({
        name: regName,
        email: dummyEmail,
        phone: regPhone,
        password: regPassword,
        address: regAddress,
        photoURL: selectedAvatar,
        isPhoneVerified: true,
        otpState: "OTP_VERIFIED"
      });
      setSuccessMsg("আপনার অ্যাকাউন্টটি সফলভাবে তৈরি হয়েছে!");
    } catch (err: any) {
      setErrorMsg(handleFirebaseError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!forgotEmail.trim()) {
      setErrorMsg("আপনার রেজিস্টার্ড ইমেইল প্রদান করুন।");
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(forgotEmail.trim());
      setResetSuccess(true);
      setSuccessMsg("পাসওয়ার্ড রিসেট লিংক আপনার ইমেইলে পাঠানো হয়েছে।");
    } catch (err: any) {
      setErrorMsg(handleFirebaseError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemo = async (role: 'customer' | 'admin') => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await quickDemoLogin(role);
    } catch (err: any) {
      setErrorMsg(handleFirebaseError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Dark Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={closeAuthModal}
        className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity"
      />

      {/* Modal Card */}
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="relative w-full max-w-lg bg-[#ffffff] rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden z-10 max-h-[92vh] flex flex-col border border-gray-100"
      >
        {/* Top Header Banner */}
        <div className="bg-gradient-to-br from-[#021a12] via-[#00381a] to-[#01261a] text-white p-5 sm:p-6 relative overflow-hidden shrink-0 border-b border-[#007f3e]/40 shadow-lg">
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-[#ffb703]/10 rounded-full blur-2xl pointer-events-none"></div>
          <button
            onClick={closeAuthModal}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-all active:scale-95 border border-white/20 shadow-sm"
            aria-label="Close"
            title="বন্ধ করুন"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>

          {/* Logo & Brand Badge */}
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#ffb703] to-[#e69e00] text-black flex items-center justify-center shadow-md">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
                <path d="M3 6h18"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
            </div>
            <div>
              <span className="text-xs font-black tracking-widest text-[#ffb703] block uppercase">All MAYADIN FASHION</span>
              <span className="text-base font-black tracking-tight text-white block">নিরাপদ ও প্রিমিয়াম ই-কমার্স</span>
            </div>
          </div>

          {/* Reason Alert (Why Login is Required) */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/20 flex items-start gap-3 shadow-inner">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#ffb703] to-[#f59e0b] text-black flex items-center justify-center shrink-0 mt-0.5 font-bold shadow-md">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black text-[#ffb703] leading-tight">
                {authModalMessage || "অর্ডার সম্পন্ন করতে লগইন করুন"}
              </h3>
              <p className="text-[11px] text-gray-200 mt-1 leading-snug font-medium">
                আপনার পছন্দের পণ্যটি অর্ডার ও নিরাপদে ডেলিভারি পেতে আপনার একাউন্টে লগইন করুন অথবা নতুন একাউন্ট খুলুন।
              </p>
            </div>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-gray-200 bg-gray-50/90 p-1.5 gap-1 shrink-0">
          <button
            onClick={() => { setActiveTab('login'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'login'
                ? "bg-white text-[#004b23] shadow-sm border border-gray-200"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>লগইন (Sign In)</span>
          </button>

          <button
            onClick={() => { setActiveTab('register'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'register' || activeTab === 'otp'
                ? "bg-white text-[#004b23] shadow-sm border border-gray-200"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>নতুন একাউন্ট (Sign Up)</span>
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1">
          {/* Notifications */}
          {errorMsg && (
            <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-2xl text-xs font-bold flex items-start gap-2 border border-red-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 bg-emerald-50 text-emerald-700 p-3 rounded-2xl text-xs font-bold flex items-start gap-2 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: LOGIN */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-700 mb-1.5">
                  মোবাইল নম্বর (অ্যাকাউন্ট নম্বর)
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="017XXXXXXXX"
                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#007f3e] focus:bg-white text-gray-900 rounded-2xl py-3 pl-10 pr-4 text-xs font-bold focus:outline-none transition-all placeholder:text-gray-400 placeholder:font-normal"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-black text-gray-700">
                    পাসওয়ার্ড
                  </label>
                  <button
                    type="button"
                    onClick={() => { setShowForgotResetModal(true); setErrorMsg(null); }}
                    className="text-[11px] font-bold text-[#007f3e] hover:underline cursor-pointer"
                  >
                    পাসওয়ার্ড ভুলে গেছেন?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="আপনার পাসওয়ার্ড লিখুন"
                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#007f3e] focus:bg-white text-gray-900 rounded-2xl py-3 pl-10 pr-11 text-xs font-bold focus:outline-none transition-all placeholder:text-gray-400 placeholder:font-normal"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded text-[#007f3e] focus:ring-[#007f3e] w-4 h-4 accent-[#007f3e]"
                  />
                  <span className="text-xs text-gray-600 font-semibold">লগইন মনে রাখুন</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotResetModal(true)}
                  className="text-xs font-bold text-[#007f3e] hover:underline cursor-pointer"
                >
                  পাসওয়ার্ড ভুলে গেছেন?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-[#007f3e] hover:bg-[#006e36] text-white font-black text-sm rounded-2xl shadow-lg shadow-[#007f3e]/20 flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <span>যাচাই করা হচ্ছে...</span>
                ) : (
                  <>
                    <span>লগইন করুন</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Demo Fast Logins for Convenience */}
              <div className="pt-3 border-t border-gray-100">
                <div className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">
                  অথবা দ্রুত টেস্ট করতে ১-ক্লিক ডেমো লগইন
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleDemo('customer')}
                    disabled={isLoading}
                    className="py-2.5 px-3 bg-[#e6f4ea] hover:bg-[#d0ebd7] text-[#007f3e] border border-[#007f3e]/30 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>কাস্টমার ডেমো</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDemo('admin')}
                    disabled={isLoading}
                    className="py-2.5 px-3 bg-[#fffbeb] hover:bg-[#fef3c7] text-[#b45309] border border-[#fde68a] rounded-xl text-xs font-black flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>অ্যাডমিন ডেমো</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 2: REGISTER / CREATE ACCOUNT */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              {/* Avatar Selector */}
              <div>
                <label className="block text-xs font-black text-gray-700 mb-1.5">
                  প্রোফাইল ছবি নির্বাচন করুন
                </label>
                <div className="flex items-center gap-2 overflow-x-auto pb-1.5">
                  {AVATAR_PRESETS.map((av) => (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => setSelectedAvatar(av.url)}
                      className={`relative w-11 h-11 rounded-full overflow-hidden border-2 shrink-0 transition-all ${
                        selectedAvatar === av.url 
                          ? "border-[#007f3e] ring-2 ring-[#007f3e]/30 scale-105" 
                          : "border-gray-200 opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img src={av.url} alt={av.label} className="w-full h-full object-cover" />
                      {selectedAvatar === av.url && (
                        <div className="absolute inset-0 bg-[#007f3e]/30 flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-black text-gray-700 mb-1">
                  আপনার পূর্ণ নাম <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="যেমন: মোঃ আরিফুল ইসলাম"
                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#007f3e] focus:bg-white text-gray-900 rounded-2xl py-2.5 pl-10 pr-4 text-xs font-bold focus:outline-none transition-all placeholder:text-gray-400 placeholder:font-normal"
                    required
                  />
                </div>
              </div>

              {/* Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-black text-gray-700 mb-1">
                    মোবাইল নম্বর <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="017XXXXXXXX"
                      className="w-full bg-gray-50 border border-gray-200 focus:border-[#007f3e] focus:bg-white text-gray-900 rounded-2xl py-2.5 pl-10 pr-4 text-xs font-bold focus:outline-none transition-all placeholder:text-gray-400 placeholder:font-normal"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-700 mb-1">
                    ইমেইল এড্রেস (ঐচ্ছিক - অফার ও আপডেটের জন্য)
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="example@mail.com"
                      className="w-full bg-gray-50 border border-gray-200 focus:border-[#007f3e] focus:bg-white text-gray-900 rounded-2xl py-2.5 pl-10 pr-4 text-xs font-bold focus:outline-none transition-all placeholder:text-gray-400 placeholder:font-normal"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Area / Address */}
              <div>
                <label className="block text-xs font-black text-gray-700 mb-1">
                  ডেলিভারির ঠিকানা / এলাকা (ঐচ্ছিক)
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={regAddress}
                    onChange={(e) => setRegAddress(e.target.value)}
                    placeholder="রোড নং, বাড়ি নং, এলাকা, শহর"
                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#007f3e] focus:bg-white text-gray-900 rounded-2xl py-2.5 pl-10 pr-4 text-xs font-bold focus:outline-none transition-all placeholder:text-gray-400 placeholder:font-normal"
                  />
                </div>
              </div>

              {/* Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-black text-gray-700 mb-1">
                    পাসওয়ার্ড (নূন্যতম ৬ অক্ষর) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showRegPassword ? "text" : "password"}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="পাসওয়ার্ড লিখুন"
                      className="w-full bg-gray-50 border border-gray-200 focus:border-[#007f3e] focus:bg-white text-gray-900 rounded-2xl py-2.5 pl-10 pr-10 text-xs font-bold focus:outline-none transition-all placeholder:text-gray-400 placeholder:font-normal"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-700 mb-1">
                    পাসওয়ার্ড নিশ্চিত করুন <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showRegPassword ? "text" : "password"}
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="পুনরায় পাসওয়ার্ড"
                      className="w-full bg-gray-50 border border-gray-200 focus:border-[#007f3e] focus:bg-white text-gray-900 rounded-2xl py-2.5 pl-10 pr-4 text-xs font-bold focus:outline-none transition-all placeholder:text-gray-400 placeholder:font-normal"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Terms Checkbox */}
              <label className="flex items-start gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="rounded text-[#007f3e] focus:ring-[#007f3e] w-4 h-4 mt-0.5 accent-[#007f3e]"
                  required
                />
                <span className="text-[11px] text-gray-600 leading-tight">
                  আমি অল মায়াদিন বাজারের <span className="text-[#007f3e] font-bold">শর্তাবলী</span> ও <span className="text-[#007f3e] font-bold">গোপনীয়তা নীতিমালা</span> মেনে নিচ্ছি।
                </span>
              </label>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-[#007f3e] hover:bg-[#006e36] text-white font-black text-sm rounded-2xl shadow-lg shadow-[#007f3e]/20 flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <span>অ্যাকাউন্ট তৈরি হচ্ছে...</span>
                ) : (
                  <>
                    <span>অ্যাকাউন্ট তৈরি করুন</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 3: FORGOT PASSWORD */}
          {activeTab === 'forgot' && (
            <div className="space-y-4 py-2">
              <div className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-[#25D366]/15 text-[#25D366] flex items-center justify-center mx-auto mb-2.5">
                  <MessageSquare className="w-6 h-6 fill-current" />
                </div>
                <h3 className="text-base font-black text-gray-900">পাসওয়ার্ড পুনরুদ্ধার সহায়তা</h3>
                <p className="text-xs text-gray-600 mt-1 max-w-xs mx-auto leading-relaxed">
                  পাসওয়ার্ডের জন্য কোনো ওটিপির প্রয়োজন নেই। সরাসরি আমাদের অফিসিয়াল হোয়াটসঅ্যাপে যোগাযোগ করুন।
                </p>
              </div>

              <div className="bg-emerald-50 rounded-2xl p-3.5 border border-emerald-200">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="block text-[10px] font-bold text-emerald-800 uppercase tracking-wider">অফিসিয়াল হোয়াটসঅ্যাপ</span>
                    <span className="font-mono font-black text-gray-900 text-sm">01618599077</span>
                  </div>
                  <a
                    href="tel:01618599077"
                    className="px-2.5 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 active:scale-95 transition-all shadow-sm"
                  >
                    <Phone className="w-3.5 h-3.5" /> কল করুন
                  </a>
                </div>
              </div>

              <a
                href={`https://wa.me/8801618599077?text=${encodeURIComponent("আসসালামু আলাইকুম, আমি আল মায়াদীন বাজার অ্যাপে আমার অ্যাকাউন্টের পাসওয়ার্ড ভুলে গেছি। অনুগ্রহ করে আমার অ্যাকাউন্ট পাসওয়ার্ড পুনরুদ্ধার করতে সাহায্য করুন।")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 bg-[#25D366] hover:bg-[#20bd5a] text-white font-black text-sm rounded-2xl shadow-lg shadow-[#25D366]/20 flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 fill-current" />
                <span>হোয়াটসঅ্যাপে মেসেজ পাঠান</span>
                <ExternalLink className="w-4 h-4 opacity-80" />
              </a>

              <button
                type="button"
                onClick={() => setActiveTab('login')}
                className="w-full text-center text-xs font-bold text-gray-500 hover:text-gray-800 pt-1"
              >
                লগইন পেজে ফিরে যান
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Forgot Password OTP Verification & Reset Modal */}
      <ForgotPasswordModal
        isOpen={showForgotResetModal}
        onClose={() => setShowForgotResetModal(false)}
        initialPhone={loginEmail.includes("@") ? "" : loginEmail}
        onSuccessLogin={(phone) => {
          setLoginEmail(phone);
          setLoginPassword("");
          setSuccessMsg("আপনার পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে। নতুন পাসওয়ার্ড দিয়ে লগইন করুন।");
          setActiveTab('login');
        }}
      />
    </div>
  );
};
