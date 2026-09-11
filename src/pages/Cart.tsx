import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Trash2, Plus, Minus, ArrowLeft, ShoppingBag, ChevronRight, Ticket, CheckCircle2, Tag } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "motion/react";

export const Cart: React.FC = () => {
  const { items, updateQuantity, removeItem, subtotal, totalItems } = useCart();
  const { requireAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isFood = location.pathname.startsWith("/food/");
  const deliveryCharge = 60; // Base delivery charge

  // Promo Code State
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [promoError, setPromoError] = useState("");
  const [promoSuccess, setPromoSuccess] = useState("");

  const handleApplyPromo = () => {
    setPromoError("");
    setPromoSuccess("");
    const code = promoCode.trim().toUpperCase();

    if (!code) {
      setPromoError("অনুগ্রহ করে একটি প্রোমো কোড লিখুন।");
      return;
    }

    if (code === "MAYADIN" || code === "OFF100" || code === "WELCOME") {
      const calcDiscount = Math.min(100, Math.round(subtotal * 0.1));
      setDiscount(calcDiscount > 0 ? calcDiscount : 50);
      setPromoSuccess(`'${code}' প্রোমো কোড সফলভাবে প্রয়োগ করা হয়েছে! (৳${calcDiscount > 0 ? calcDiscount : 50} ছাড়)`);
    } else if (code === "SAVE10") {
      const calcDiscount = Math.round(subtotal * 0.1);
      setDiscount(calcDiscount);
      setPromoSuccess(`'SAVE10' ১০% ছাড় প্রয়োগ করা হয়েছে! (৳${calcDiscount} ছাড়)`);
    } else {
      setPromoError("দুঃখিত, এটি একটি অবৈধ বা মেয়ারোত্তীর্ণ প্রোমো কোড।");
    }
  };

  const handleProceedToCheckout = () => {
    requireAuth(() => {
      navigate(isFood ? "/food/checkout" : "/checkout");
    }, "অর্ডার সম্পন্ন করতে প্রথমে আপনার অ্যাকাউন্টে লগইন করুন।");
  };

  const finalTotal = Math.max(0, subtotal + deliveryCharge - discount);

  if (items.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center py-20 px-4 text-center space-y-6 ${isFood ? "-mx-4 -mt-4 bg-[#fcfdfc] min-h-screen" : ""}`}>
        {isFood && (
          <header className="bg-[#004b23] px-5 pt-8 pb-4 rounded-b-[40px] shadow-lg fixed top-0 left-0 right-0 z-50">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(-1)} className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
                <ArrowLeft className="w-4 h-4 text-white" />
              </button>
              <h1 className="text-white text-lg font-black tracking-tight">Shopping Cart</h1>
            </div>
          </header>
        )}
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
          <ShoppingBag className="w-12 h-12 text-gray-300" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-800">আপনার কার্ট খালি রয়েছে</h2>
          <p className="text-gray-500 max-w-xs mx-auto">এখনো কোনো পণ্য কার্টে যোগ করা হয়নি। বাজার করতে পছন্দের ক্যাটাগরি ব্রাউজ করুন!</p>
        </div>
        <Link 
          to={isFood ? "/category/cat1" : "/"} 
          className="bg-[#004b23] text-white font-bold py-4 px-10 rounded-2xl shadow-lg shadow-[#004b23]/20 flex items-center gap-2 transition-transform active:scale-95"
        >
          কেনাকাটা শুরু করুন <ChevronRight className="w-5 h-5" />
        </Link>
      </div>
    );
  }

  return (
    <div className={`space-y-6 pb-36 ${isFood ? "-mx-4 -mt-4 bg-[#fcfdfc] min-h-screen" : ""}`}>
      {/* Header */}
      <div className={isFood ? "bg-[#004b23] px-5 pt-8 pb-4 rounded-b-[40px] shadow-lg sticky top-0 z-50 mb-4 flex items-center justify-between" : "flex items-center justify-between pt-2"}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className={isFood ? "w-9 h-9 bg-white/10 rounded-full flex items-center justify-center border border-white/20" : "p-2.5 bg-white rounded-2xl shadow-sm border border-gray-100 text-gray-700 active:scale-95"}>
            <ArrowLeft className={`w-5 h-5 ${isFood ? "text-white" : "text-gray-700"}`} />
          </button>
          <h1 className={`text-lg font-black ${isFood ? "text-white" : "text-gray-900"}`}>
            {isFood ? "Shopping Cart" : `আমার কার্ট (${totalItems}টি আইটেম)`}
          </h1>
        </div>
      </div>

      <div className={isFood ? "px-4 space-y-6" : "space-y-6"}>
        {/* Item List */}
        <div className="space-y-3.5">
          <AnimatePresence initial={false}>
            {items.map((item) => (
              <motion.div 
                key={`${item.productId}-${item.variantId}`}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white p-3.5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4"
              >
                <div className="w-20 h-20 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="text-sm font-bold text-gray-900 line-clamp-1">{item.name}</h3>
                  <p className="text-sm font-black text-[#004b23]">৳{item.price}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-3.5 bg-gray-100/80 px-3 py-1 rounded-xl">
                      <button 
                        onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variantId)}
                        className="text-gray-600 hover:text-red-600 active:scale-90"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-sm font-extrabold text-gray-900 min-w-[16px] text-center">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variantId)}
                        className="text-gray-600 hover:text-emerald-700 active:scale-90"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <button 
                      onClick={() => removeItem(item.productId, item.variantId)}
                      className="p-2 text-gray-400 hover:text-red-500 active:scale-90"
                      title="মুছে ফেলুন"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Coupon / Promo Code */}
        <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm space-y-2">
          <div className="flex items-center gap-3">
            <Ticket className="w-5 h-5 text-[#ffb703] flex-shrink-0" />
            <input 
              type="text" 
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              placeholder="প্রোমো কোড লিখুন (যেমন: MAYADIN)" 
              className="flex-1 text-sm font-semibold focus:outline-none bg-transparent text-gray-800 placeholder:text-gray-400 uppercase"
            />
            <button 
              onClick={handleApplyPromo}
              className="bg-[#004b23] text-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-[#00381a] active:scale-95 transition-all"
            >
              প্রয়োগ করুন
            </button>
          </div>
          {promoSuccess && (
            <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-bold bg-emerald-50 p-2 rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{promoSuccess}</span>
            </div>
          )}
          {promoError && (
            <p className="text-red-500 text-xs font-semibold px-1">{promoError}</p>
          )}
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-4">
          <h3 className="text-base font-extrabold text-gray-900 border-b border-gray-100 pb-3 flex items-center justify-between">
            <span>অর্ডারের হিসাব (Order Summary)</span>
            <Tag className="w-4 h-4 text-[#004b23]" />
          </h3>
          <div className="space-y-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 font-medium">পণ্যের মোট মূল্য (Subtotal)</span>
              <span className="font-bold text-gray-900">৳{subtotal}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 font-medium">ডেলিভারি চার্জ (Delivery Charge)</span>
              <span className="font-bold text-gray-900">৳{deliveryCharge}</span>
            </div>

            {/* ONLY show Special Discount row if discount is strictly greater than 0 */}
            {discount > 0 && (
              <div className="flex justify-between text-sm text-[#004b23] font-bold bg-[#004b23]/10 px-3 py-2 rounded-xl">
                <span>বিশেষ ছাড় (Special Discount)</span>
                <span>- ৳{discount}</span>
              </div>
            )}

            <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
              <span className="text-base font-extrabold text-gray-900">সর্বমোট মূল্য (Total Amount)</span>
              <span className="text-2xl font-black text-[#004b23]">৳{finalTotal}</span>
            </div>
          </div>
        </div>

        {/* Single Clean Sticky Order Bar above bottom nav */}
        <div className="fixed bottom-[66px] left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 p-3.5 shadow-[0_-8px_25px_rgba(0,0,0,0.12)] z-40 flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">সর্বমোট মূল্য</p>
            <p className="text-xl font-black text-[#004b23]">৳{finalTotal}</p>
          </div>
          <button 
            onClick={handleProceedToCheckout}
            className="flex-1 bg-[#004b23] hover:bg-[#00381a] text-white font-black py-3.5 px-5 rounded-2xl shadow-md shadow-[#004b23]/20 flex items-center justify-center gap-2 active:scale-95 text-base transition-all"
          >
            অর্ডার করতে এগিয়ে যান <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
