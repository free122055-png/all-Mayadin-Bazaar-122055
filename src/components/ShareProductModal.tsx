import React, { useState } from "react";
import { 
  X, Copy, Check, Share2, Send, MessageCircle, 
  Facebook, Smartphone, QrCode, Sparkles, ExternalLink, Link2,
  SmartphoneNfc
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ResolvedProduct, generateShareDetails, getProductDeepLink } from "../lib/productLink";

interface ShareProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ResolvedProduct;
}

export const ShareProductModal: React.FC<ShareProductModalProps> = ({
  isOpen,
  onClose,
  product
}) => {
  const [copied, setCopied] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);

  if (!isOpen) return null;

  const shareDetails = generateShareDetails(product);
  const deepLink = getProductDeepLink(product);

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(deepLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleOpenInApp = () => {
    window.location.href = deepLink;
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareDetails.title,
          text: shareDetails.messageText,
          url: deepLink
        });
      } catch (err) {
        // user cancelled or share failed
      }
    } else {
      handleCopyLink();
    }
  };

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(deepLink)}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-gray-100 my-auto flex flex-col"
      >
        {/* Header */}
        <div className="bg-[#004b23] px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
              <Share2 className="w-4 h-4 text-[#ffb703]" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight leading-tight">নেটিভ অ্যাপ ডিপ লিংক</h3>
              <p className="text-[11px] text-emerald-200">Domain ছাড়া সরাসরি অ্যাপ ওপেন লিংক</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-gray-800">
          
          {/* Mini Product Header */}
          <div className="flex items-center gap-3 bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200/70">
            <div className="w-14 h-14 rounded-xl bg-white p-1 border shrink-0 overflow-hidden">
              <img
                src={product.image || (product.images && product.images[0]) || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&q=80"}
                alt={product.nameBn}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-black text-gray-900 line-clamp-1">{product.nameBn || product.name}</h4>
              <p className="text-xs font-black text-[#004b23] mt-0.5">
                ৳{product.discountPrice || product.price}
                {product.price > (product.discountPrice || product.price) && (
                  <span className="text-[10px] text-gray-400 line-through ml-1.5">৳{product.price}</span>
                )}
              </p>
              <p className="text-[10px] text-gray-500 font-mono font-bold line-clamp-1 mt-0.5">ID: {product.numericId || product.code || product.id}</p>
            </div>
          </div>

          {/* Copy Native Deep Link Box */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 flex items-center justify-between">
              <span>Android App Deep Link:</span>
              <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-bold">Domain-Free Native Link</span>
            </label>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-2xl p-1.5">
              <input
                type="text"
                readOnly
                value={deepLink}
                className="w-full bg-transparent border-none text-xs font-mono font-bold text-[#004b23] px-2 outline-none select-all truncate"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shrink-0 active:scale-95 ${
                  copied
                    ? "bg-emerald-600 text-white"
                    : "bg-[#004b23] hover:bg-[#00381a] text-white"
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "কপি হয়েছে!" : "কপি"}</span>
              </button>
            </div>
          </div>

          {/* Direct Open in App Button */}
          <button
            type="button"
            onClick={handleOpenInApp}
            className="w-full py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-[#004b23] border border-emerald-200 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all active:scale-98"
          >
            <SmartphoneNfc className="w-4 h-4 text-emerald-600" />
            <span>📱 অ্যাপে সরাসরি টেস্ট করুন ({deepLink})</span>
          </button>

          {/* Social Share Grid */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700">মেসেজিং অ্যাপে ডিপ লিংক শেয়ার করুন:</label>
            <div className="grid grid-cols-4 gap-2.5">
              
              {/* WhatsApp */}
              <a
                href={shareDetails.whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 transition-all active:scale-95 group"
              >
                <div className="w-9 h-9 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <MessageCircle className="w-5 h-5 fill-white" />
                </div>
                <span className="text-[11px] font-bold mt-1.5">হোয়াটসঅ্যাপ</span>
              </a>

              {/* Facebook */}
              <a
                href={shareDetails.facebookUrl}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 transition-all active:scale-95 group"
              >
                <div className="w-9 h-9 rounded-full bg-[#1877F2] text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <Facebook className="w-5 h-5 fill-white" />
                </div>
                <span className="text-[11px] font-bold mt-1.5">ফেসবুক</span>
              </a>

              {/* Telegram */}
              <a
                href={shareDetails.telegramUrl}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 transition-all active:scale-95 group"
              >
                <div className="w-9 h-9 rounded-full bg-[#229ED9] text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <Send className="w-4 h-4 text-white" />
                </div>
                <span className="text-[11px] font-bold mt-1.5">টেলিগ্রাম</span>
              </a>

              {/* SMS */}
              <a
                href={shareDetails.smsUrl}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 transition-all active:scale-95 group"
              >
                <div className="w-9 h-9 rounded-full bg-[#ffb703] text-gray-900 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <Smartphone className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-[11px] font-bold mt-1.5">এসএমএস</span>
              </a>
            </div>
          </div>

          {/* QR Code Toggle */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowQrCode(!showQrCode)}
              className="w-full py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <QrCode className="w-4 h-4" />
              <span>{showQrCode ? "কিউআর কোড লুকান" : "ডিপ লিংক কিউআর কোড (QR Code) দেখুন"}</span>
            </button>

            {showQrCode && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-3 p-4 bg-gray-50 border border-gray-200 rounded-2xl flex flex-col items-center justify-center space-y-2"
              >
                <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-200">
                  <img src={qrImageUrl} alt="Product QR Code" className="w-40 h-40 object-contain" />
                </div>
                <p className="text-[11px] font-mono text-emerald-800 font-bold">{deepLink}</p>
                <p className="text-[11px] text-gray-500 font-bold">স্ক্যান করলে সরাসরি আল মায়াদিন বাজার অ্যাপ ওপেন হবে</p>
              </motion.div>
            )}
          </div>

          {/* Native System Share */}
          {typeof navigator !== "undefined" && "share" in navigator && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="w-full py-3 bg-gray-900 hover:bg-black text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-md transition-transform active:scale-98"
            >
              <Share2 className="w-4 h-4 text-[#ffb703]" />
              <span>মোবাইলের সব অ্যাপে ডিপ লিংক শেয়ার করুন</span>
            </button>
          )}

        </div>
      </motion.div>
    </div>
  );
};
