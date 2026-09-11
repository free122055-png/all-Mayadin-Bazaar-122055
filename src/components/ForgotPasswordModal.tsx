import React, { useState, useEffect, useRef } from "react";
import { 
  X, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ArrowLeft, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  KeyRound, 
  ShieldCheck, 
  Clock 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { passwordResetService } from "../lib/passwordResetService";
import { parseBangladeshiPhone } from "../lib/phoneUtils";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessLogin?: (phone: string) => void;
  initialPhone?: string;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccessLogin,
  initialPhone = ""
}) => {
  const [step, setStep] = useState<'phone' | 'otp' | 'new-password' | 'success'>('phone');
  
  // Phone Step States
  const [phoneNumber, setPhoneNumber] = useState(initialPhone);
  const [userName, setUserName] = useState("");
  
  // OTP Step States
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [cooldown, setCooldown] = useState<number>(0);
  const [expiresIn, setExpiresIn] = useState<number>(300); // 5 minutes
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [resetToken, setResetToken] = useState("");
  
  // New Password Step States
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Common States
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Reset states on open/close
  useEffect(() => {
    if (isOpen) {
      if (initialPhone) {
        setPhoneNumber(initialPhone);
      }
      setStep('phone');
      setError(null);
      setSuccessNotice(null);
      setDigits(["", "", "", "", "", ""]);
      setNewPassword("");
      setConfirmPassword("");
    }
  }, [isOpen, initialPhone]);

  // 60-second Resend Cooldown Timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // 5-Minute OTP Expiration Countdown Timer
  useEffect(() => {
    if (step !== 'otp') return;
    const timer = setInterval(() => {
      setExpiresIn((prev) => {
        if (prev <= 1) {
          setError("OTP কোডের ৫ মিনিট মেয়াদ শেষ হয়ে গেছে। অনুগ্রহ করে আবার নতুন কোড পাঠান।");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [step]);

  if (!isOpen) return null;

  // Format seconds into mm:ss
  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // -------------------------------------------------------------------------
  // STEP 1: Send OTP to Phone
  // -------------------------------------------------------------------------
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessNotice(null);

    const parsed = parseBangladeshiPhone(phoneNumber);
    if (!parsed.isValid) {
      setError("সঠিক ১১ সংখ্যার বাংলাদেশি মোবাইল নম্বর লিখুন (যেমন: 017XXXXXXXX)।");
      return;
    }

    setLoading(true);
    try {
      // 1. Check if account exists
      const check = await passwordResetService.checkAccount(parsed.formatted);
      if (!check.exists) {
        setError(check.error || `এই মোবাইল নম্বরে (${parsed.formatted}) কোনো অ্যাকাউন্ট পাওয়া যায়নি।`);
        setLoading(false);
        return;
      }

      setUserName(check.name || "সম্মানিত গ্রাহক");

      // 2. Send 6-digit OTP
      const res = await passwordResetService.sendResetOtp(parsed.formatted);
      if (res.success) {
        setCooldown(res.cooldown || 60);
        setExpiresIn(300); // 5 minutes
        setStep('otp');
        setSuccessNotice(res.message || "আপনার মোবাইলে একটি ৬ সংখ্যার ওটিপি পাঠানো হয়েছে।");
        setTimeout(() => inputRefs.current[0]?.focus(), 150);
      } else {
        setError(res.error || "OTP পাঠাতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
        if (res.remainingSeconds) {
          setCooldown(res.remainingSeconds);
        }
      }
    } catch (err: any) {
      setError("নেটওয়ার্কে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // STEP 2: Resend OTP
  // -------------------------------------------------------------------------
  const handleResendOtp = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setError(null);
    setSuccessNotice(null);

    try {
      const res = await passwordResetService.sendResetOtp(phoneNumber);
      if (res.success) {
        setCooldown(res.cooldown || 60);
        setExpiresIn(300);
        setDigits(["", "", "", "", "", ""]);
        setSuccessNotice("নতুন OTP কোড সফলভাবে পাঠানো হয়েছে!");
        inputRefs.current[0]?.focus();
      } else {
        setError(res.error || "OTP পাঠাতে সমস্যা হয়েছে।");
        if (res.remainingSeconds) setCooldown(res.remainingSeconds);
      }
    } catch (e) {
      setError("OTP পুনরায় পাঠাতে সমস্যা হয়েছে।");
    } finally {
      setResending(false);
    }
  };

  // -------------------------------------------------------------------------
  // STEP 2: OTP Input Handling
  // -------------------------------------------------------------------------
  const handleDigitChange = (index: number, val: string) => {
    setError(null);
    setSuccessNotice(null);

    const clean = val.replace(/\D/g, "");

    // Paste handling
    if (clean.length > 1) {
      const pasteDigits = clean.slice(0, 6).split("");
      const newDigits = [...digits];
      pasteDigits.forEach((d, idx) => {
        newDigits[idx] = d;
      });
      setDigits(newDigits);
      const nextFocus = Math.min(pasteDigits.length, 5);
      inputRefs.current[nextFocus]?.focus();
      if (pasteDigits.length === 6) {
        verifyOtpCode(newDigits.join(""));
      }
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = clean;
    setDigits(newDigits);

    if (clean && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (clean && index === 5) {
      const full = newDigits.join("");
      if (full.length === 6) {
        verifyOtpCode(full);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const verifyOtpCode = async (code: string) => {
    if (code.length !== 6) {
      setError("অনুগ্রহ করে ৬ সংখ্যার সম্পূর্ণ OTP কোড লিখুন।");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await passwordResetService.verifyResetOtp(phoneNumber, code);
      if (res.success && res.resetToken) {
        setResetToken(res.resetToken);
        setSuccessNotice(res.message || "OTP যাচাই হয়েছে! নতুন পাসওয়ার্ড দিন।");
        setTimeout(() => {
          setStep('new-password');
          setError(null);
          setSuccessNotice(null);
        }, 400);
      } else {
        setError(res.error || "ভুল OTP কোড। দয়া করে সঠিক কোড লিখুন।");
        if (res.remainingAttempts !== undefined) {
          setRemainingAttempts(res.remainingAttempts);
        }
        if (res.code === "MAX_ATTEMPTS_EXCEEDED" || res.code === "OTP_EXPIRED") {
          setDigits(["", "", "", "", "", ""]);
          inputRefs.current[0]?.focus();
        }
      }
    } catch (e) {
      setError("OTP যাচাই করতে সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // STEP 3: Reset Password
  // -------------------------------------------------------------------------
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError("পাসওয়ার্ড নূন্যতম ৬ অক্ষরের হতে হবে।");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("উভয় পাসওয়ার্ড একই হতে হবে। মিলিয়ে লিখুন।");
      return;
    }

    setLoading(true);
    try {
      const res = await passwordResetService.resetPassword(
        phoneNumber,
        resetToken,
        newPassword,
        confirmPassword
      );

      if (res.success) {
        setStep('success');
      } else {
        setError(res.error || "পাসওয়ার্ড আপডেট করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
      }
    } catch (err: any) {
      setError("পাসওয়ার্ড রিসেট করতে সমস্যা হয়েছে। ইন্টারনেট সংযোগ চেক করুন।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-[36px] p-6 sm:p-8 max-w-md w-full shadow-2xl relative border border-gray-100 my-auto"
      >
        {/* Top Decorative Bar */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1 bg-[#F4A300] rounded-full opacity-60" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* ========================================================================= */}
        {/* STEP 1: PHONE NUMBER INPUT */}
        {/* ========================================================================= */}
        {step === 'phone' && (
          <div className="pt-2">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200/60 text-[#002A1A] flex items-center justify-center mx-auto mb-3 shadow-inner">
                <KeyRound className="w-7 h-7 text-[#002A1A]" />
              </div>
              <h3 className="text-xl font-black text-[#002A1A]">পাসওয়ার্ড ভুলে গেছেন?</h3>
              <p className="text-[13px] text-gray-500 font-medium mt-1">
                আপনার অ্যাকাউন্টের রেজিস্টার করা মোবাইল নম্বরটি লিখুন। আমরা একটি ৬ সংখ্যার ভেরিফিকেশন কোড (OTP) পাঠাব।
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            <form onSubmit={handleSendOtp} className="space-y-5">
              <div>
                <label className="block text-[13px] font-bold text-gray-600 mb-2 px-1">
                  মোবাইল নম্বর
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100">
                    <Phone className="w-5 h-5 text-gray-700" />
                  </div>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full bg-white border border-gray-200 focus:border-[#002A1A] focus:ring-4 focus:ring-green-500/10 rounded-[18px] py-4 pl-16 pr-5 text-[15px] font-bold text-gray-900 outline-none transition-all placeholder:text-gray-300"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#002A1A] to-[#014028] text-white py-4.5 rounded-[18px] font-black text-[15px] flex items-center justify-center gap-2.5 shadow-lg shadow-green-950/20 active:scale-98 transition-all disabled:opacity-70 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>যাচাই করা হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <span>OTP কোড পাঠান</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-gray-100 text-center">
              <button
                type="button"
                onClick={onClose}
                className="text-[13px] font-bold text-gray-500 hover:text-[#002A1A] transition-colors cursor-pointer"
              >
                লগইন পেজে ফিরে যান
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: 6-DIGIT OTP VERIFICATION */}
        {/* ========================================================================= */}
        {step === 'otp' && (
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setStep('phone');
                setError(null);
                setSuccessNotice(null);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[#002A1A] mb-3 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>নম্বর পরিবর্তন করুন</span>
            </button>

            <div className="text-center mb-5">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200/60 text-[#002A1A] flex items-center justify-center mx-auto mb-2.5 shadow-inner">
                <ShieldCheck className="w-7 h-7 text-[#002A1A]" />
              </div>
              <h3 className="text-xl font-black text-[#002A1A]">ভেরিফিকেশন কোড দিন</h3>
              <p className="text-[13px] text-gray-600 font-medium mt-1">
                <span className="font-bold text-[#002A1A]">{phoneNumber}</span> নম্বরে পাঠানো ৬ সংখ্যার OTP কোডটি লিখুন
              </p>
            </div>

            {/* Expiry and Remaining Notice */}
            <div className="flex items-center justify-between bg-amber-50/70 border border-amber-200/70 rounded-xl px-3.5 py-2 mb-4 text-xs font-bold text-amber-900">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-700" />
                <span>মেয়াদ: {formatTimer(expiresIn)} মিনিট</span>
              </div>
              {remainingAttempts !== null && (
                <span className="text-amber-800">সুযোগ: {remainingAttempts} বার</span>
              )}
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {successNotice && (
              <div className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                <span>{successNotice}</span>
              </div>
            )}

            {/* 6-box OTP Input */}
            <div className="flex items-center justify-between gap-2 sm:gap-3 my-5">
              {digits.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="tel"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-11 h-14 sm:w-13 sm:h-16 text-center text-xl sm:text-2xl font-black rounded-2xl bg-gray-50 border-2 border-gray-200 focus:border-[#002A1A] focus:bg-white focus:ring-4 focus:ring-green-500/10 outline-none transition-all text-[#002A1A]"
                />
              ))}
            </div>

            <button
              type="button"
              disabled={loading || digits.join("").length !== 6}
              onClick={() => verifyOtpCode(digits.join(""))}
              className="w-full bg-gradient-to-r from-[#002A1A] to-[#014028] text-white py-4 rounded-[18px] font-black text-[15px] flex items-center justify-center gap-2 shadow-lg shadow-green-950/20 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>যাচাই হচ্ছে...</span>
                </>
              ) : (
                <>
                  <span>যাচাই করুন</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Resend OTP Button */}
            <div className="mt-5 text-center">
              {cooldown > 0 ? (
                <p className="text-xs font-bold text-gray-400">
                  আবার কোড পাঠানো যাবে <span className="text-[#002A1A] font-black">{cooldown}</span> সেকেন্ড পর
                </p>
              ) : (
                <button
                  type="button"
                  disabled={resending}
                  onClick={handleResendOtp}
                  className="inline-flex items-center gap-1.5 text-xs font-black text-[#002A1A] hover:underline cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                  <span>কোড পাননি? পুনরায় OTP পাঠান</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: NEW PASSWORD & CONFIRM PASSWORD */}
        {/* ========================================================================= */}
        {step === 'new-password' && (
          <div className="pt-2">
            <div className="text-center mb-5">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#002A1A] flex items-center justify-center mx-auto mb-2.5 shadow-inner">
                <Lock className="w-7 h-7 text-[#002A1A]" />
              </div>
              <h3 className="text-xl font-black text-[#002A1A]">নতুন পাসওয়ার্ড তৈরি করুন</h3>
              <p className="text-[13px] text-gray-500 font-medium mt-1">
                আপনার অ্যাকাউন্টের জন্য নূন্যতম ৬ অক্ষরের একটি শক্তিশালী পাসওয়ার্ড দিন।
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
              {/* New Password */}
              <div>
                <label className="block text-[13px] font-bold text-gray-600 mb-1.5 px-1">
                  নতুন পাসওয়ার্ড
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100">
                    <Lock className="w-4 h-4 text-gray-600" />
                  </div>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড"
                    className="w-full bg-white border border-gray-200 focus:border-[#002A1A] focus:ring-4 focus:ring-green-500/10 rounded-[16px] py-3.5 pl-15 pr-12 text-[14px] font-bold text-gray-900 outline-none transition-all placeholder:text-gray-300"
                    required
                    minLength={6}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 p-1"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-[13px] font-bold text-gray-600 mb-1.5 px-1">
                  পাসওয়ার্ড নিশ্চিত করুন
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100">
                    <Lock className="w-4 h-4 text-gray-600" />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="একই পাসওয়ার্ড পুনরায় লিখুন"
                    className="w-full bg-white border border-gray-200 focus:border-[#002A1A] focus:ring-4 focus:ring-green-500/10 rounded-[16px] py-3.5 pl-15 pr-12 text-[14px] font-bold text-gray-900 outline-none transition-all placeholder:text-gray-300"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 p-1"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Password Match Indicator */}
              {newPassword && confirmPassword && (
                <div className={`text-xs font-bold px-1 flex items-center gap-1.5 ${
                  newPassword === confirmPassword ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  {newPassword === confirmPassword ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>পাসওয়ার্ড মিলে গেছে</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>উভয় পাসওয়ার্ড একই হতে হবে</span>
                    </>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || newPassword.length < 6 || newPassword !== confirmPassword}
                className="w-full mt-3 bg-gradient-to-r from-[#002A1A] to-[#014028] text-white py-4 rounded-[18px] font-black text-[15px] flex items-center justify-center gap-2.5 shadow-lg shadow-green-950/20 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>সংরক্ষণ করা হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <span>পাসওয়ার্ড সংরক্ষণ করুন</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 4: SUCCESS CONFIRMATION */}
        {/* ========================================================================= */}
        {step === 'success' && (
          <div className="pt-4 text-center">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4"
            >
              <CheckCircle2 className="w-9 h-9" />
            </motion.div>

            <h3 className="text-xl font-black text-[#002A1A] mb-2">
              পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে!
            </h3>
            <p className="text-[13px] text-gray-600 font-medium mb-6 leading-relaxed">
              আপনার অ্যাকাউন্টের নতুন পাসওয়ার্ড সক্রিয় হয়েছে। এখন নতুন পাসওয়ার্ড ব্যবহার করে লগইন করতে পারবেন।
            </p>

            <button
              type="button"
              onClick={() => {
                onClose();
                if (onSuccessLogin) {
                  onSuccessLogin(phoneNumber);
                }
              }}
              className="w-full bg-[#002A1A] hover:bg-[#00381A] text-white py-4.5 rounded-[18px] font-black text-[15px] flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-all cursor-pointer"
            >
              <span>এখনই লগইন করুন</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
