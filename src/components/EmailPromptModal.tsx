import React, { useState } from "react";
import { Mail, CheckCircle2, Sparkles, ShieldCheck } from "lucide-react";
import { getApiUrl } from "../lib/api";

interface EmailPromptModalProps {
  isOpen: boolean;
  currentUser: { uid?: string; phoneNumber?: string; email?: string } | null;
  onSuccess: (newEmail: string) => void;
}

export const EmailPromptModal: React.FC<EmailPromptModalProps> = ({ isOpen, currentUser, onSuccess }) => {
  const [emailInput, setEmailInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = emailInput.trim();
    if (!trimmed || !trimmed.includes("@")) {
      setError("দয়া করে একটি সঠিক ইমেল অ্যাড্রেস দিন।");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Send Welcome Email via Resend backend API
      try {
        await fetch(getApiUrl("/api/emails/welcome"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipientEmail: trimmed,
            customerName: currentUser?.phoneNumber || "সম্মানিত গ্রাহক"
          })
        });
      } catch (mailErr) {
        // Non-blocking error handling as per requirement 4
        console.warn("Welcome email trigger warning:", mailErr);
      }

      // 2. Success callback to update user profile
      onSuccess(trimmed);
    } catch (err: any) {
      setError(err.message || "ইমেল সেভ করতে সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-6 relative overflow-hidden">
        {/* Top Decorative Banner */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#004b23] to-[#ffb703]" />

        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-emerald-50 text-[#004b23] rounded-2xl mx-auto flex items-center justify-center shadow-sm border border-emerald-100">
            <Mail className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-black text-gray-950">দয়া করে আপনার ইমেইলটি দিন</h3>
          <p className="text-xs text-gray-600 leading-relaxed">
            অর্ডারের আপডেট, ইনভয়েস এবং বিশেষ অফার পেতে আপনার সচল ইমেল অ্যাড্রেসটি প্রদান করুন।
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">আপনার ইমেল অ্যাড্রেস</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Sparkles className="w-4 h-4 text-[#ffb703]" />
              </span>
              <input
                type="email"
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                placeholder="example@gmail.com"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#004b23]/30 focus:border-[#004b23]"
                autoFocus
                required
              />
            </div>
            {error && <p className="text-[11px] text-red-500 font-bold mt-1">{error}</p>}
          </div>

          <div className="bg-emerald-50/60 p-3 rounded-2xl border border-emerald-100 flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#004b23] shrink-0" />
            <p className="text-[11px] text-emerald-900 font-medium">
              Resend সুরক্ষিত সার্ভার থেকে তাৎক্ষণিকভাবে একটি ওয়েলকাম ইমেল পাঠানো হবে।
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#004b23] hover:bg-[#00381b] text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4 text-[#ffb703]" />
            <span>{loading ? "প্রক্রিয়াজাত হচ্ছে..." : "ইমেল সাবমিট করুন ও এগিয়ে যান"}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
