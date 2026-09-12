import React, { useState, useEffect } from "react";
import { Mail, CheckCircle2, Sparkles, ShieldCheck, X, ArrowRight } from "lucide-react";
import { getApiUrl } from "../lib/api";
import { db } from "../lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

interface EmailPromptModalProps {
  isOpen: boolean;
  currentUser: { uid?: string; phoneNumber?: string; email?: string } | null;
  onSuccess: (newEmail: string) => void | Promise<void>;
  onClose?: () => void;
  onSkip?: () => void | Promise<void>;
}

export const EmailPromptModal: React.FC<EmailPromptModalProps> = ({
  isOpen,
  currentUser,
  onSuccess,
  onClose,
  onSkip
}) => {
  const [emailInput, setEmailInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Allow closing with the Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleDismiss();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDismiss = async () => {
    try {
      localStorage.setItem("email_prompt_dismissed", "true");
      sessionStorage.setItem("email_prompt_dismissed", "true");
    } catch {}

    if (currentUser?.uid) {
      try {
        await setDoc(doc(db, "users", currentUser.uid), {
          emailSkipped: true,
          emailPromptDismissedAt: Date.now()
        }, { merge: true });
      } catch (err) {
        console.warn("[EmailPrompt] Skip sync notice:", err);
      }
    }

    if (onSkip) {
      await Promise.resolve(onSkip());
    } else if (onClose) {
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = emailInput.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@") || trimmed.length < 5) {
      setError("দয়া করে একটি সঠিক ইমেল অ্যাড্রেস দিন।");
      return;
    }

    // 1. Instant optimistic UI success!
    setIsSuccess(true);
    setError(null);

    // Dismiss key setting
    try {
      localStorage.setItem("email_prompt_dismissed", "true");
      sessionStorage.setItem("email_prompt_dismissed", "true");
    } catch {}

    // Call success handler instantly to close modal and update UI state
    try {
      onSuccess(trimmed);
    } catch {}

    // 2. Perform database and backend notifications asynchronously in the background
    (async () => {
      try {
        const cleanDocId = trimmed.replace(/[^a-zA-Z0-9]/g, "_");
        await setDoc(doc(db, "email_subscribers", cleanDocId), {
          email: trimmed,
          name: currentUser?.phoneNumber || "সম্মানিত গ্রাহক",
          phone: currentUser?.phoneNumber || "",
          uid: currentUser?.uid || "",
          savedAt: Date.now(),
          status: "active",
          createdAt: serverTimestamp()
        }, { merge: true });

        // Dispatch background API updates
        await Promise.allSettled([
          fetch(getApiUrl("/api/emails/welcome"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              recipientEmail: trimmed,
              customerName: currentUser?.phoneNumber || "সম্মানিত গ্রাহক"
            })
          }),
          fetch(getApiUrl("/api/subscribers/save"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: trimmed,
              name: currentUser?.phoneNumber || "সম্মানিত গ্রাহক",
              phone: currentUser?.phoneNumber || "",
              uid: currentUser?.uid || ""
            })
          })
        ]);
      } catch (err) {
        console.warn("[EmailPrompt] Background save error:", err);
      }
    })();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
      onClick={(e) => {
        // If clicking on the backdrop outside the card, dismiss
        if (e.target === e.currentTarget) {
          handleDismiss();
        }
      }}
    >
      <div
        className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-6 relative overflow-hidden animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Decorative Banner */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#004b23] to-[#ffb703]" />

        {/* Top Right Close / Skip Button */}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="এড়িয়ে যান (Close)"
          title="এড়িয়ে যান"
          className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-1 group"
        >
          <span className="text-[11px] font-medium text-gray-400 group-hover:text-gray-600 hidden sm:inline">
            এড়িয়ে যান
          </span>
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2 pt-2">
          <div className="w-14 h-14 bg-emerald-50 text-[#004b23] rounded-2xl mx-auto flex items-center justify-center shadow-sm border border-emerald-100">
            <Mail className="w-7 h-7" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200/60 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-[11px] font-bold text-amber-800">অফার ও আপডেট (ঐচ্ছিক)</span>
          </div>

          <h3 className="text-lg font-black text-gray-950">অফার ও আপডেট পেতে চান?</h3>
          <p className="text-xs text-gray-600 leading-relaxed max-w-xs mx-auto">
            আপনার অ্যাকাউন্ট মোবাইল নম্বর দিয়ে সুরক্ষিত। আপনি চাইলে ডিজিটাল ইনভয়েস ও স্পেশাল অফার পাওয়ার জন্য ইমেইল যোগ করতে পারেন। না চাইলে এড়িয়ে যান।
          </p>
        </div>

        {isSuccess ? (
          <div className="text-center py-6 space-y-3 animate-fadeIn">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-gray-900">ইমেইল সফলভাবে সংরক্ষিত হয়েছে!</h4>
            <p className="text-xs text-gray-500">আপনার অ্যাকাউন্টে ইমেইল সফলভাবে যুক্ত করা হয়েছে।</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">আপনার ইমেল অ্যাড্রেস (ঐচ্ছিক)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Mail className="w-4 h-4 text-gray-400" />
                </span>
                <input
                  type="email"
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  placeholder="example@gmail.com"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#004b23]/30 focus:border-[#004b23]"
                  autoFocus
                />
              </div>
              {error && <p className="text-[11px] text-red-500 font-bold mt-1">{error}</p>}
            </div>

            <div className="bg-emerald-50/60 p-3 rounded-2xl border border-emerald-100 flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#004b23] shrink-0" />
              <p className="text-[11px] text-emerald-900 font-medium leading-tight">
                ইমেইল দিলে সাথে সাথে নিশ্চিতকরণ ও অফার আপডেট পাঠানো হবে। না দিলে কোনো ইমেইল যাবে না।
              </p>
            </div>

            <div className="space-y-2 pt-1">
              {/* Primary Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#004b23] hover:bg-[#00381b] text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all disabled:opacity-50 active:scale-98"
              >
                <CheckCircle2 className="w-4 h-4 text-[#ffb703]" />
                <span>{loading ? "প্রক্রিয়াজাত হচ্ছে..." : "ইমেইল সেভ করুন ও এগিয়ে যান"}</span>
              </button>

              {/* Secondary Explicit Skip Button */}
              <button
                type="button"
                onClick={handleDismiss}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-98"
              >
                <span>এখন না, এড়িয়ে যান</span>
                <ArrowRight className="w-3.5 h-3.5 text-gray-500" />
              </button>
            </div>

            <p className="text-[11px] text-center text-gray-400 font-medium">
              আপনি পরবর্তীতে অ্যাকাউন্ট সেটিংস থেকেও ইমেইল যোগ করতে পারবেন।
            </p>
          </form>
        )}
      </div>
    </div>
  );
};
