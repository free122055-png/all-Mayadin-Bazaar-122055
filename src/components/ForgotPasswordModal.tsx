import React, { useState, useEffect } from "react";
import { 
  X, 
  Phone, 
  KeyRound, 
  ShieldCheck, 
  MessageSquare, 
  Copy, 
  Check, 
  ExternalLink,
  ArrowRight,
  Headphones
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
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
  initialPhone = ""
}) => {
  const [phoneNumber, setPhoneNumber] = useState(initialPhone);
  const [copied, setCopied] = useState(false);

  const WHATSAPP_NUMBER = "01618599077";
  const WHATSAPP_INTL = "8801618599077";

  useEffect(() => {
    if (isOpen && initialPhone) {
      setPhoneNumber(initialPhone);
    }
  }, [isOpen, initialPhone]);

  if (!isOpen) return null;

  // Build customized WhatsApp link
  const getWhatsAppLink = () => {
    const parsed = parseBangladeshiPhone(phoneNumber);
    const targetPhone = parsed.isValid ? parsed.formatted : (phoneNumber.trim() || "আমার নম্বর");
    const message = `আসসালামু আলাইকুম, আমি আল মায়াদীন বাজার (AL MAYADIN BAZAAR) অ্যাপে আমার অ্যাকাউন্টের পাসওয়ার্ড ভুলে গেছি।\n\nআমার রেজিস্টার্ড মোবাইল নম্বর: ${targetPhone}\n\nঅনুগ্রহ করে আমার অ্যাকাউন্ট ভেরিফাই করে পাসওয়ার্ড পুনরুদ্ধার করতে সহায়তা করুন। ধন্যবাদ!`;
    return `https://wa.me/${WHATSAPP_INTL}?text=${encodeURIComponent(message)}`;
  };

  const handleCopyNumber = () => {
    navigator.clipboard?.writeText(WHATSAPP_NUMBER);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 relative text-gray-800"
        >
          {/* Header Banner */}
          <div className="bg-gradient-to-br from-[#003820] to-[#005a36] text-white p-6 relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
            
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors z-10"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative z-10 flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#25D366] text-white flex items-center justify-center shadow-lg shadow-[#25D366]/30 shrink-0">
                <MessageSquare className="w-6 h-6 fill-current" />
              </div>
              <div>
                <span className="inline-flex items-center gap-1 text-[11px] font-black tracking-wider uppercase bg-white/15 px-2.5 py-0.5 rounded-full text-[#7effa8] mb-1">
                  <ShieldCheck className="w-3 h-3" /> সরাসরি সাপোর্ট
                </span>
                <h3 className="text-xl font-black text-white tracking-tight">পাসওয়ার্ড ভুলে গেছেন?</h3>
              </div>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-5">
            {/* Informational Message */}
            <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-4">
              <p className="text-[13px] text-emerald-950 font-medium leading-relaxed">
                পাসওয়ার্ড পুনরুদ্ধারের জন্য এখন আর <strong className="font-bold text-emerald-900">কোনো ওটিপির প্রয়োজন নেই</strong>। সরাসরি আমাদের অফিসিয়াল হোয়াটসঅ্যাপে যোগাযোগ করলেই অ্যাডমিন প্যানেল থেকে আপনার অ্যাকাউন্ট যাচাই করে তাৎক্ষণিকভাবে পাসওয়ার্ড প্রদান বা রিসেট করে দেওয়া হবে।
              </p>
            </div>

            {/* Registered Phone Input (Optional prefill for convenience) */}
            <div>
              <label className="block text-xs font-black text-gray-700 mb-1.5 px-1">
                আপনার একাউন্ট মোবাইল নম্বর (ঐচ্ছিক)
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="যেমন: 017XXXXXXXX"
                  className="w-full bg-gray-50 border border-gray-200 focus:border-[#007f3e] focus:bg-white text-gray-900 rounded-2xl py-3 pl-10 pr-4 text-sm font-bold focus:outline-none transition-all placeholder:text-gray-400 placeholder:font-normal"
                />
              </div>
              <p className="text-[11px] text-gray-500 mt-1 px-1">
                নম্বরটি দিলে হোয়াটসঅ্যাপ মেসেজে স্বয়ংক্রিয়ভাবে যুক্ত হয়ে যাবে।
              </p>
            </div>

            {/* Primary Action: Direct WhatsApp Chat */}
            <a
              href={getWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 bg-[#25D366] hover:bg-[#20bd5a] text-white font-black text-sm rounded-2xl shadow-lg shadow-[#25D366]/25 flex items-center justify-center gap-2.5 active:scale-98 transition-all group cursor-pointer"
            >
              <MessageSquare className="w-5 h-5 fill-current" />
              <span>হোয়াটসঅ্যাপে যোগাযোগ করুন</span>
              <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 transition-transform opacity-80" />
            </a>

            {/* Official Support Number Box with Quick Copy & Call */}
            <div className="bg-gray-50 rounded-2xl p-3.5 border border-gray-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-700 shrink-0">
                  <Headphones className="w-4 h-4 text-[#007f3e]" />
                </div>
                <div className="min-w-0">
                  <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">অফিসিয়াল হোয়াটসঅ্যাপ নম্বর</span>
                  <span className="font-mono font-black text-gray-900 text-sm">{WHATSAPP_NUMBER}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyNumber}
                  className="px-2.5 py-1.5 bg-white border border-gray-200 hover:border-gray-300 rounded-xl text-xs font-bold text-gray-700 flex items-center gap-1 hover:bg-gray-50 active:scale-95 transition-all"
                  title="নম্বর কপি করুন"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 text-[11px]">কপি হয়েছে</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-gray-500" />
                      <span className="text-[11px]">কপি</span>
                    </>
                  )}
                </button>

                <a
                  href={`tel:${WHATSAPP_NUMBER}`}
                  className="px-2.5 py-1.5 bg-[#007f3e]/10 hover:bg-[#007f3e]/20 text-[#007f3e] rounded-xl text-xs font-bold flex items-center gap-1 active:scale-95 transition-all"
                  title="সরাসরি ফোন কল করুন"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span className="text-[11px]">কল</span>
                </a>
              </div>
            </div>

            {/* Back to login button */}
            <button
              type="button"
              onClick={onClose}
              className="w-full text-center py-2 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors"
            >
              লগইন স্ক্রিনে ফিরে যান
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
