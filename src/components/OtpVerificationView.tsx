import React, { useState, useEffect, useRef } from "react";
import { ShieldCheck, ArrowLeft, RefreshCw, AlertCircle, CheckCircle2, Lock } from "lucide-react";
import { otpService } from "../lib/otpService";

interface OtpVerificationViewProps {
  phoneNumber: string;
  onVerified: (verificationToken: string) => void;
  onBack: () => void;
  initialCooldown?: number;
}

export const OtpVerificationView: React.FC<OtpVerificationViewProps> = ({
  phoneNumber,
  onVerified,
  onBack,
  initialCooldown = 60
}) => {
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState<number>(initialCooldown);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 60-second cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleDigitChange = (index: number, value: string) => {
    setError(null);
    setSuccessMsg(null);

    // Filter non-digits
    const cleanVal = value.replace(/\D/g, "");

    // Handle full paste
    if (cleanVal.length > 1) {
      const pasteDigits = cleanVal.slice(0, 6).split("");
      const newDigits = [...digits];
      pasteDigits.forEach((d, idx) => {
        newDigits[idx] = d;
      });
      setDigits(newDigits);
      const nextFocus = Math.min(pasteDigits.length, 5);
      inputRefs.current[nextFocus]?.focus();

      // Auto submit if 6 digits pasted
      if (pasteDigits.length === 6) {
        verifyOtpCode(newDigits.join(""));
      }
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = cleanVal;
    setDigits(newDigits);

    // Auto advance
    if (cleanVal && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto submit if 6th digit entered
    if (cleanVal && index === 5) {
      const fullCode = newDigits.join("");
      if (fullCode.length === 6) {
        verifyOtpCode(fullCode);
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

  const verifyOtpCode = async (codeToVerify: string) => {
    if (codeToVerify.length !== 6) {
      setError("অনুগ্রহ করে ৬ সংখ্যার সম্পূর্ণ OTP কোডটি লিখুন।");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await otpService.verifyOtp(phoneNumber, codeToVerify);
      if (result.success && result.verificationToken) {
        setSuccessMsg(result.message || "মোবাইল নম্বর সফলভাবে যাচাই হয়েছে!");
        setTimeout(() => {
          onVerified(result.verificationToken!);
        }, 500);
      } else {
        setError(result.error || "ভুল OTP কোড। দয়া করে সঠিক কোড দিন।");
        if (result.remainingAttempts !== undefined) {
          setRemainingAttempts(result.remainingAttempts);
        }
        if (result.code === "MAX_ATTEMPTS_EXCEEDED" || result.code === "OTP_EXPIRED") {
          setDigits(["", "", "", "", "", ""]);
          inputRefs.current[0]?.focus();
        }
      }
    } catch {
      setError("যাচাই করতে সমস্যা হয়েছে। দয়া করে পুনরায় চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;

    setResending(true);
    setError(null);
    setSuccessMsg(null);
    setDigits(["", "", "", "", "", ""]);

    try {
      const res = await otpService.sendOtp(phoneNumber);
      if (res.success) {
        setCooldown(res.cooldown || 60);
        setSuccessMsg(res.message || "নতুন OTP কোড আপনার মোবাইলে পাঠানো হয়েছে।");
        setRemainingAttempts(null);
        inputRefs.current[0]?.focus();
      } else {
        setError(res.error || "পুনরায় OTP পাঠাতে ব্যর্থ হয়েছে।");
        if (res.remainingSeconds) {
          setCooldown(res.remainingSeconds);
        }
      }
    } catch {
      setError("সার্ভারে যোগাযোগ সম্ভব হয়নি।");
    } finally {
      setResending(false);
    }
  };

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins < 10 ? "0" + mins : mins}:${s < 10 ? "0" + s : s}`;
  };

  const isComplete = digits.join("").length === 6;

  return (
    <div className="w-full space-y-5 animate-in fade-in duration-200">
      {/* Header Bar with Back Button */}
      <div className="flex items-center justify-between pb-1 border-b border-gray-100">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-emerald-700 py-1 px-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>নম্বর পরিবর্তন</span>
        </button>
        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
          নিরাপদ যাচাইকরণ
        </span>
      </div>

      {/* Hero Icon & Title */}
      <div className="text-center space-y-2">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-black text-gray-900 tracking-tight">
          মোবাইল নম্বর যাচাই করুন
        </h3>
        <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
          আমরা আপনার মোবাইল নম্বর <span className="font-bold text-gray-800">{phoneNumber}</span>-এ একটি ৬ সংখ্যার OTP পাঠিয়েছি।
        </p>
      </div>

      {/* Error & Success Messages */}
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200/80 rounded-xl flex items-start gap-2.5 text-rose-700 text-xs font-medium">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-500" />
          <div className="flex-1">
            <span>{error}</span>
            {remainingAttempts !== null && remainingAttempts > 0 && (
              <span className="block mt-0.5 font-bold">
                অবশিষ্ট চেষ্টা: {remainingAttempts} বার
              </span>
            )}
          </div>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200/80 rounded-xl flex items-center gap-2.5 text-emerald-800 text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 6 Digit Input Boxes */}
      <div className="space-y-2">
        <label className="block text-center text-xs font-semibold text-gray-600">
          ৬ সংখ্যার OTP কোড লিখুন
        </label>
        <div className="flex justify-center items-center gap-2 sm:gap-3">
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              disabled={loading}
              className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-2xl font-black rounded-xl border-2 transition-all outline-none shadow-sm ${
                digit
                  ? "border-emerald-500 bg-emerald-50/30 text-emerald-900 ring-2 ring-emerald-500/20"
                  : "border-gray-200 bg-white text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Verify Button */}
      <button
        type="button"
        onClick={() => verifyOtpCode(digits.join(""))}
        disabled={!isComplete || loading}
        className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all shadow-md ${
          isComplete && !loading
            ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25 active:scale-[0.99] cursor-pointer"
            : "bg-gray-300 text-gray-500 shadow-none cursor-not-allowed"
        }`}
      >
        {loading ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>যাচাই করা হচ্ছে...</span>
          </>
        ) : (
          <>
            <Lock className="w-4 h-4" />
            <span>OTP যাচাই করুন (Verify OTP)</span>
          </>
        )}
      </button>

      {/* Resend OTP Section */}
      <div className="pt-2 text-center border-t border-gray-100">
        {cooldown > 0 ? (
          <div className="text-xs text-gray-500 font-medium">
            পুনরায় কোড পাঠাতে অপেক্ষা করুন:{" "}
            <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/50">
              {formatTimer(cooldown)}
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 text-xs">
            <span className="text-gray-500">কোড পাননি?</span>
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              {resending ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>পাঠানো হচ্ছে...</span>
                </>
              ) : (
                <span>পুনরায় OTP পাঠান (Resend OTP)</span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
