import React, { useState, useEffect } from "react";
import { 
  X, Check, ShoppingCart, Truck, ShieldCheck, MapPin, 
  Phone, User, Banknote, CreditCard, ChevronRight, CheckCircle2, 
  Sparkles, AlertCircle, Clock, Copy
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { db } from "../lib/firebase";
import { collection, addDoc, doc, updateDoc, increment } from "firebase/firestore";
import { ResolvedProduct, getProductShareUrl } from "../lib/productLink";
import { useAuth } from "../context/AuthContext";
import { sendSms } from "../lib/smsService";

interface QuickOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ResolvedProduct;
  initialQuantity?: number;
  initialColor?: string;
  initialSize?: string;
  onOrderSuccess?: (orderId: string, orderNumber: string) => void;
}

export const QuickOrderModal: React.FC<QuickOrderModalProps> = ({
  isOpen,
  onClose,
  product,
  initialQuantity = 1,
  initialColor,
  initialSize,
  onOrderSuccess
}) => {
  const { user, profile } = useAuth();

  // Selection states
  const [quantity, setQuantity] = useState<number>(initialQuantity);
  const [selectedColor, setSelectedColor] = useState<string>(initialColor || (product.colors && product.colors[0]) || "");
  const [selectedSize, setSelectedSize] = useState<string>(initialSize || (product.sizes && product.sizes[0]) || product.weight || product.unit || "");
  
  // Delivery & Customer states
  const [customerName, setCustomerName] = useState<string>(profile?.displayName || user?.displayName || "");
  const [customerPhone, setCustomerPhone] = useState<string>(profile?.phoneNumber || "");
  const [customerAddress, setCustomerAddress] = useState<string>(profile?.address || "");
  const [deliveryZone, setDeliveryZone] = useState<"inside_dhaka" | "outside_dhaka">("inside_dhaka");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "bkash" | "nagad">("cod");

  // UI status states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<{
    orderNumber: string;
    totalAmount: number;
    phone: string;
  } | null>(null);
  const [copiedOrderNumber, setCopiedOrderNumber] = useState(false);

  const availableSizes = (product.sizes && product.sizes.length > 0)
    ? product.sizes
    : ((product.categoryId === "cat3" || (product.nameBn && /শার্ট|পাঞ্জাবি|টি-শার্ট|পোশাক|বোরকা|শাড়ি|কাপড়|জিন্স|প্যান্ট|জামা/i.test(product.nameBn)))
        ? ["M", "L", "XL", "XXL"]
        : (product.weight ? [product.weight] : []));

  useEffect(() => {
    if (isOpen) {
      setQuantity(initialQuantity || 1);
      if (initialColor) setSelectedColor(initialColor);
      else if (product.colors && product.colors.length > 0) setSelectedColor(product.colors[0]);

      if (initialSize) setSelectedSize(initialSize);
      else if (availableSizes.length > 0) setSelectedSize(availableSizes[0]);
      else if (product.weight) setSelectedSize(product.weight);

      if (profile?.displayName && !customerName) setCustomerName(profile.displayName);
      if (profile?.phoneNumber && !customerPhone) setCustomerPhone(profile.phoneNumber);
      if (profile?.address && !customerAddress) setCustomerAddress(profile.address);
      
      setErrorMessage(null);
      setCompletedOrder(null);
    }
  }, [isOpen, product, availableSizes]);

  if (!isOpen) return null;

  // Calculation
  const unitPrice = Number(product.discountPrice || product.price || 0);
  const subtotal = unitPrice * quantity;
  const deliveryCharge = deliveryZone === "inside_dhaka" ? 60 : 120;
  const grandTotal = subtotal + deliveryCharge;

  // Phone Validation
  const cleanPhone = customerPhone.replace(/\D/g, "");
  const isPhoneValid = /^01[3-9]\d{8}$/.test(cleanPhone) || /^(?:\+?88)?01[3-9]\d{8}$/.test(cleanPhone);

  const handlePlaceQuickOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!customerName.trim()) {
      setErrorMessage("দয়া করে আপনার নাম লিখুন।");
      return;
    }

    if (!isPhoneValid) {
      setErrorMessage("সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017xxxxxxxx)।");
      return;
    }

    if (!customerAddress.trim() || customerAddress.trim().length < 5) {
      setErrorMessage("দয়া করে বিস্তারিত ডেলিভারি ঠিকানা প্রদান করুন (বাসা/রোড/এলাকা/থানা)।");
      return;
    }

    setIsSubmitting(true);

    try {
      const orderNumber = `AMB-${Math.floor(100000 + Math.random() * 900000)}`;
      const now = Date.now();

      const orderItem = {
        productId: product.id,
        numericId: product.numericId,
        name: product.nameBn || product.name,
        image: product.image || (product.images && product.images[0]) || "",
        price: unitPrice,
        regularPrice: product.price,
        quantity: quantity,
        selectedColor: selectedColor || undefined,
        selectedSize: selectedSize || undefined,
        total: subtotal
      };

      const orderPayload = {
        orderNumber,
        userId: user?.uid || "guest_order",
        customerName: customerName.trim(),
        customerPhone: cleanPhone.startsWith("88") ? cleanPhone : (cleanPhone.startsWith("01") ? `+88${cleanPhone}` : cleanPhone),
        rawPhone: cleanPhone,
        customerAddress: customerAddress.trim(),
        deliveryZone: deliveryZone,
        deliveryZoneLabel: deliveryZone === "inside_dhaka" ? "ঢাকা সিটির ভেতরে" : "ঢাকা সিটির বাইরে",
        items: [orderItem],
        subtotal: subtotal,
        deliveryCharge: deliveryCharge,
        discount: 0,
        total: grandTotal,
        grandTotal: grandTotal,
        codAmount: paymentMethod === "cod" ? grandTotal : 0,
        paymentMethod: paymentMethod,
        paymentStatus: "pending",
        orderSource: "direct_product_link",
        status: "pending",
        internalStatus: "placed",
        deliveryInfo: {
          provider: "steadfast",
          status: "not_created",
          zone: deliveryZone === "inside_dhaka" ? "Inside Dhaka" : "Outside Dhaka"
        },
        statusHistory: [
          { status: "pending", updatedAt: now, note: "সরাসরি প্রোডাক্ট লিংক থেকে অর্ডার সম্পন্ন হয়েছে।" }
        ],
        createdAt: now,
        updatedAt: now
      };

      // Save to Firestore collections for unified tracking
      const docRef = await addDoc(collection(db, "orders"), orderPayload);
      try {
        await addDoc(collection(db, "food_orders"), { ...orderPayload, orderId: docRef.id });
      } catch (fErr) {
        // secondary backup collection optional
      }

      // Decrement stock if trackable
      try {
        const prodDoc = doc(db, "products", product.id);
        await updateDoc(prodDoc, {
          stockQuantity: increment(-quantity),
          updatedAt: now
        });
      } catch (stockErr) {
        console.warn("[QuickOrder] Stock decrement notice:", stockErr);
      }

      // Try automated SMS notification to customer
      try {
        const smsText = `আল মায়াদিন বাজার: আপনার অর্ডার #${orderNumber} সফল হয়েছে! মোট: ৳${grandTotal} (${paymentMethod === 'cod' ? 'ক্যাশ অন ডেলিভারি' : paymentMethod.toUpperCase()})। ধন্যবাদ!`;
        await sendSms(cleanPhone, smsText, "Direct Order Confirmation", "Direct Link System");
      } catch (smsErr) {
        console.warn("[QuickOrder] SMS trigger notice:", smsErr);
      }

      setCompletedOrder({
        orderNumber,
        totalAmount: grandTotal,
        phone: cleanPhone
      });

      if (onOrderSuccess) {
        onOrderSuccess(docRef.id, orderNumber);
      }
    } catch (err: any) {
      console.error("[QuickOrder] Order placement error:", err);
      setErrorMessage(err.message || "অর্ডার সম্পন্ন করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyOrderNumber = () => {
    if (completedOrder) {
      navigator.clipboard?.writeText(completedOrder.orderNumber);
      setCopiedOrderNumber(true);
      setTimeout(() => setCopiedOrderNumber(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-100 my-auto flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="bg-[#004b23] px-5 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-[#ffb703]" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight leading-tight">দ্রুত অর্ডার করুন (Fast Order)</h3>
              <p className="text-[11px] text-emerald-200">ক্যাশ অন ডেলিভারিতে হোম ডেলিভারি</p>
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

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-gray-800">
          {completedOrder ? (
            /* ============= ORDER SUCCESS VIEW ============= */
            <div className="py-6 text-center space-y-4">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-[#004b23] shadow-inner animate-bounce">
                <CheckCircle2 className="w-12 h-12" />
              </div>

              <div className="space-y-1">
                <h4 className="text-xl font-black text-gray-900">অভিনন্দন! আপনার অর্ডারটি নিশ্চিত হয়েছে</h4>
                <p className="text-xs text-gray-500">আমাদের প্রতিনিধি শীঘ্রই আপনার সাথে যোগাযোগ করবেন।</p>
              </div>

              <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 text-left space-y-2.5 max-w-sm mx-auto">
                <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                  <span className="text-xs font-bold text-gray-600">অর্ডার নম্বর:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-black text-[#004b23] tracking-wide">{completedOrder.orderNumber}</span>
                    <button 
                      onClick={handleCopyOrderNumber} 
                      className="p-1 text-emerald-700 hover:text-emerald-900 transition-colors"
                      title="কপি করুন"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-gray-600">পণ্য:</span>
                  <span className="text-gray-900 line-clamp-1">{product.nameBn || product.name}</span>
                </div>

                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-gray-600">পরিমাণ:</span>
                  <span className="text-gray-900">{quantity} পিস {selectedSize ? `(${selectedSize})` : ""}</span>
                </div>

                <div className="flex items-center justify-between border-t border-emerald-200/80 pt-2 text-sm font-black text-[#004b23]">
                  <span>সর্বমোট বিল:</span>
                  <span>৳{completedOrder.totalAmount} (COD)</span>
                </div>
              </div>

              <p className="text-[11px] text-gray-400">
                আপনার নম্বর {completedOrder.phone}-এ অর্ডার নিশ্চিতকরণ মেসেজ পাঠানো হয়েছে।
              </p>

              <button
                type="button"
                onClick={onClose}
                className="w-full bg-[#004b23] hover:bg-[#00381a] text-white font-black py-3.5 rounded-2xl shadow-lg transition-transform active:scale-95 text-sm"
              >
                ঠিক আছে, ধন্যবাদ
              </button>
            </div>
          ) : (
            /* ============= ORDER FORM ============= */
            <form onSubmit={handlePlaceQuickOrder} className="space-y-4">
              
              {/* Product Preview Card */}
              <div className="flex gap-3 bg-gray-50/90 p-3 rounded-2xl border border-gray-200/80">
                <div className="w-16 h-16 rounded-xl bg-white p-1 border shrink-0 overflow-hidden">
                  <img 
                    src={product.image || (product.images && product.images[0]) || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&q=80"} 
                    alt={product.nameBn} 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-black text-gray-900 line-clamp-1">{product.nameBn || product.name}</h4>
                    <p className="text-[11px] text-[#004b23] font-bold">
                      একক মূল্য: ৳{unitPrice}
                      {product.price > unitPrice && (
                        <span className="text-[10px] text-gray-400 line-through ml-1.5">৳{product.price}</span>
                      )}
                    </p>
                  </div>
                  
                  {/* Quantity adjustment */}
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[11px] font-bold text-gray-500">পরিমাণ:</span>
                    <div className="flex items-center gap-2 bg-white px-2 py-0.5 rounded-xl border border-gray-200">
                      <button 
                        type="button"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="text-gray-600 hover:text-black font-black px-1"
                      >
                        -
                      </button>
                      <span className="text-xs font-black w-5 text-center text-gray-900">{quantity}</span>
                      <button 
                        type="button"
                        onClick={() => setQuantity(quantity + 1)}
                        className="text-gray-600 hover:text-black font-black px-1"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Color & Size Selectors (if available) */}
              {(product.colors && product.colors.length > 0) && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">রং (Color) নির্বাচন করুন:</label>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map((clr, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedColor(clr)}
                        className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all ${
                          selectedColor === clr
                            ? "bg-[#004b23] text-white shadow-sm ring-2 ring-[#004b23]/30"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200 border"
                        }`}
                      >
                        {clr}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {availableSizes && availableSizes.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-700">সাইজ / ভ্যারিয়েন্ট (Size):</label>
                    {selectedSize && (
                      <span className="text-[10px] font-bold text-[#004b23] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                        {selectedSize}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {availableSizes.map((sz, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedSize(sz)}
                        className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                          selectedSize === sz
                            ? "bg-[#004b23] text-white shadow-sm ring-2 ring-[#004b23]/30"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200 border"
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Delivery Zone selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-[#004b23]" />
                  <span>ডেলিভারি এলাকা নির্বাচন করুন:</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDeliveryZone("inside_dhaka")}
                    className={`p-2.5 rounded-2xl border text-left transition-all ${
                      deliveryZone === "inside_dhaka"
                        ? "border-[#004b23] bg-emerald-50/70 text-[#004b23] ring-1 ring-[#004b23]"
                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <div className="text-xs font-black">ঢাকা সিটির ভেতরে</div>
                    <div className="text-[11px] font-bold text-gray-500">চার্জ: ৳৬০ (১-২ দিন)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryZone("outside_dhaka")}
                    className={`p-2.5 rounded-2xl border text-left transition-all ${
                      deliveryZone === "outside_dhaka"
                        ? "border-[#004b23] bg-emerald-50/70 text-[#004b23] ring-1 ring-[#004b23]"
                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <div className="text-xs font-black">ঢাকা সিটির বাইরে</div>
                    <div className="text-[11px] font-bold text-gray-500">চার্জ: ৳১২০ (২-৩ দিন)</div>
                  </button>
                </div>
              </div>

              {/* Customer Info Form */}
              <div className="space-y-3 pt-1">
                {/* Name */}
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    আপনার নাম <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="যেমন: মোঃ সাব্বির আহমেদ"
                      className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#004b23]/30"
                    />
                  </div>
                </div>

                {/* Mobile Phone */}
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    মোবাইল নম্বর <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="017XXXXXXXX"
                      maxLength={15}
                      className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#004b23]/30"
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">অর্ডার স্ট্যাটাস ও ডেলিভারি আপডেটের জন্য এই নম্বরে SMS পাঠানো হবে।</p>
                </div>

                {/* Address */}
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    সম্পূর্ণ ঠিকানা <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <textarea
                      required
                      rows={2}
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      placeholder="বাসা নম্বর, রোড নম্বর, এলাকা, থানা এবং জেলা"
                      className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#004b23]/30 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method Option */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-bold text-gray-700 block">পেমেন্ট মেথড:</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cod")}
                    className={`flex-1 p-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition-all text-xs font-bold ${
                      paymentMethod === "cod"
                        ? "border-[#004b23] bg-emerald-50 text-[#004b23] ring-1 ring-[#004b23]"
                        : "border-gray-200 bg-white text-gray-600"
                    }`}
                  >
                    <Banknote className="w-4 h-4" />
                    <span>ক্যাশ অন ডেলিভারি</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("bkash")}
                    className={`flex-1 p-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition-all text-xs font-bold ${
                      paymentMethod === "bkash"
                        ? "border-[#e2136e] bg-pink-50 text-[#e2136e] ring-1 ring-[#e2136e]"
                        : "border-gray-200 bg-white text-gray-600"
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>বিকাশ (bKash)</span>
                  </button>
                </div>
              </div>

              {/* Price Calculation Bill */}
              <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200/80 space-y-1.5 text-xs font-bold">
                <div className="flex items-center justify-between text-gray-600">
                  <span>পণ্যের মূল্য ({quantity} টি):</span>
                  <span className="text-gray-900">৳{subtotal}</span>
                </div>
                <div className="flex items-center justify-between text-gray-600">
                  <span>ডেলিভারি চার্জ:</span>
                  <span className="text-gray-900">৳{deliveryCharge}</span>
                </div>
                <div className="flex items-center justify-between border-t border-gray-200 pt-1.5 text-sm font-black text-[#004b23]">
                  <span>সর্বমোট প্রদেয় বিল:</span>
                  <span>৳{grandTotal}</span>
                </div>
              </div>

              {/* Error Message if any */}
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Submit CTA Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#004b23] hover:bg-[#00381a] disabled:opacity-60 text-white font-black py-3.5 rounded-2xl shadow-lg shadow-[#004b23]/25 flex items-center justify-center gap-2 text-sm transition-transform active:scale-98 cursor-pointer"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>অর্ডার প্রসেস হচ্ছে...</span>
                  </div>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-[#ffb703]" />
                    <span>অর্ডার কনফার্ম করুন (৳{grandTotal})</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-4 text-[10px] text-gray-400 font-bold text-center">
                <span>🛡️ ১০০% আসল পণ্য</span>
                <span>•</span>
                <span>📦 চেক করে মূল্য পরিশোধ</span>
                <span>•</span>
                <span>⚡ দ্রুত ডেলিভারি</span>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};
