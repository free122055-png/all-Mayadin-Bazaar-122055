import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Trash2, AlertTriangle, Eye, EyeOff, Lock, X, Check, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user, profile, deleteUserAccount } = useAuth();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmedCheckbox, setConfirmedCheckbox] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const resetForm = () => {
    setPassword("");
    setShowPassword(false);
    setConfirmedCheckbox(false);
    setIsDeleting(false);
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleClose = () => {
    if (isDeleting) return;
    resetForm();
    onClose();
  };

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmedCheckbox) {
      setErrorMsg("অনুগ্রহ করে নিশ্চিতকরণ বক্সে টিক দিন।");
      return;
    }

    setIsDeleting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await deleteUserAccount(password);
      if (res.success) {
        setSuccessMsg("আপনার অ্যাকাউন্ট সফলভাবে স্থায়ীভাবে মুছে ফেলা হয়েছে।");
        setTimeout(() => {
          resetForm();
          onClose();
          if (onSuccess) {
            onSuccess();
          } else {
            navigate("/");
          }
        }, 700);
      } else {
        setErrorMsg(res.error || "অ্যাকাউন্ট মুছে ফেলা সম্ভব হয়নি। আবার চেষ্টা করুন।");
        setIsDeleting(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "একটি ত্রুটি ঘটেছে। দয়া করে আবার চেষ্টা করুন।");
      setIsDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 15 }}
            transition={{ type: "spring", damping: 25, stiffness: 280 }}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-red-100 overflow-hidden z-10 my-8"
          >
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-red-600 to-rose-700 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight">অ্যাকাউন্ট স্থায়ীভাবে মুছে ফেলুন</h3>
                  <p className="text-[11px] text-red-100 font-medium">Permanent Account Deletion</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                disabled={isDeleting}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all active:scale-90 disabled:opacity-50"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              {/* Status Messages */}
              {successMsg ? (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-center space-y-2">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6 stroke-[3]" />
                  </div>
                  <h4 className="font-black text-sm">{successMsg}</h4>
                  <p className="text-xs text-emerald-600">আপনাকে হোমপেজে নিয়ে যাওয়া হচ্ছে...</p>
                </div>
              ) : (
                <form onSubmit={handleDelete} className="space-y-4">
                  {/* Warning Notice Box */}
                  <div className="bg-red-50 border border-red-200/80 rounded-2xl p-4 text-xs text-red-800 space-y-2.5">
                    <div className="flex items-center gap-2 font-black text-red-700">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                      <span>সতর্কবার্তা: এই কাজটি অপরিবর্তনীয়!</span>
                    </div>
                    <p className="leading-relaxed text-[11.5px] text-red-900/80">
                      আপনার অ্যাকাউন্ট স্থায়ীভাবে মুছে ফেলার পর নিম্নলিখিত পরিবর্তনগুলো অবিলম্বে ঘটবে:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-[11px] text-red-700 font-medium pl-1">
                      <li>আপনার প্রোফাইল, নাম ও মোবাইল নম্বর স্থায়ীভাবে মুছে যাবে।</li>
                      <li>আপনার পূর্ববর্তী অর্ডার হিস্ট্রি আর দেখতে পারবেন না।</li>
                      <li>সংরক্ষিত ডেলিভারি ঠিকানা ও পছন্দের তালিকা রিমুভ হবে।</li>
                      <li>এই ডেটা পরবর্তীতে কোনোভাবেই উদ্ধার করা সম্ভব হবে না।</li>
                    </ul>
                  </div>

                  {errorMsg && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {/* Optional Password Verification */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-700">
                      পাসওয়ার্ড যাচাইকরণ <span className="text-gray-400 font-normal">(প্রযোজ্য হলে লিখুন)</span>
                    </label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="আপনার পাসওয়ার্ড লিখুন"
                        disabled={isDeleting}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-10 text-xs font-semibold text-gray-900 focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all disabled:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Checkbox Confirmation */}
                  <label className="flex items-start gap-3 p-3 bg-gray-50 hover:bg-gray-100/80 rounded-2xl border border-gray-200 cursor-pointer select-none transition-colors">
                    <input
                      type="checkbox"
                      checked={confirmedCheckbox}
                      onChange={(e) => setConfirmedCheckbox(e.target.checked)}
                      disabled={isDeleting}
                      className="mt-0.5 w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500 accent-red-600 shrink-0 cursor-pointer"
                    />
                    <span className="text-[11.5px] font-bold text-gray-800 leading-snug">
                      আমি বুঝেছি এবং নিশ্চিত করছি যে আমি আমার অ্যাকাউন্ট স্থায়ীভাবে মুছে ফেলতে চাই।
                    </span>
                  </label>

                  {/* Actions */}
                  <div className="pt-2 flex flex-col gap-2.5">
                    <button
                      type="submit"
                      disabled={!confirmedCheckbox || isDeleting}
                      className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-black py-3.5 px-4 rounded-xl text-xs shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isDeleting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>মুছে ফেলা হচ্ছে...</span>
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          <span>হ্যাঁ, স্থায়ীভাবে মুছে ফেলুন (Delete Permanently)</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={isDeleting}
                      className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-xl text-xs transition-colors disabled:opacity-50"
                    >
                      না, ফিরে যান (Cancel)
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
