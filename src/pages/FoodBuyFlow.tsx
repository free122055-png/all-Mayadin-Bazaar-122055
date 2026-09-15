import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link, useParams } from "react-router-dom";
import { 
  ArrowLeft, Plus, Minus, Trash2, MapPin, Truck, Store, 
  Wallet, CreditCard, Building2, Check, CheckCircle2, ChevronRight, 
  Clock, Phone, Star, ShieldCheck, Navigation, ShoppingBag, ShoppingCart, 
  Sparkles, CheckSquare, RotateCcw, AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { SEO } from "../components/SEO";
import { defaultFoodCatalog, FoodProduct } from "../data/foodProducts";
import { bangladeshDivisions, getDistricts, getUpazilas, getUnions } from "../data/bangladeshGeo";
import { db } from "../lib/firebase";
import { collection, addDoc, doc, getDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { User, Compass } from "lucide-react";
import { ensureMultiImages } from "../lib/imageUtils";

interface OrderItem {
  id: string;
  nameBn: string;
  brand: string;
  category?: string;
  unit: string;
  unitWeightKg: number;
  pricePerUnit: number;
  image: string;
  images?: string[];
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
}

export const FoodBuyFlow: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { orderId: paramOrderId } = useParams<{ orderId?: string }>();
  const { items: globalCartItems } = useCart();
  const { requireAuth, user, profile } = useAuth();

  const categoryName = (location.state as any)?.categoryName || "All MAYADIN FASHION";
  const [isFoodCategoryDisabled, setIsFoodCategoryDisabled] = useState(false);

  useEffect(() => {
    const unsubVis = onSnapshot(doc(db, "settings", "category_visibility"), (snap) => {
      if (snap.exists() && snap.data().cat1 === false) {
        setIsFoodCategoryDisabled(true);
      } else {
        setIsFoodCategoryDisabled(false);
      }
    });
    return () => unsubVis();
  }, []);

  // Step 1: Cart & Order Review
  // Step 2: Delivery Address
  // Step 3: Delivery Method
  // Step 4: Payment Method
  // Step 5: Order Confirmation (No PIN)
  // Step 6: Order Placed Success
  // Step 7: Live Order Tracking
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Initialize order items from location state (direct buy on product), global cart, or default basket
  const [orderItems, setOrderItems] = useState<OrderItem[]>(() => {
    const passedProduct = (location.state as any)?.selectedProduct;
    if (passedProduct) {
      const matched = defaultFoodCatalog.find(p => p.id === passedProduct.id || p.nameBn === passedProduct.nameBn) as any;
      const imagesList = ensureMultiImages(passedProduct);
      return [{
        id: matched?.id || passedProduct.id || "food-1",
        nameBn: matched?.nameBn || passedProduct.nameBn || passedProduct.name || "পণ্য",
        brand: matched?.brand || passedProduct.brand || "তাজা বাজার",
        unit: matched?.unit || passedProduct.unit || "পিস",
        unitWeightKg: matched?.unitWeightKg || 1,
        pricePerUnit: passedProduct.discountPrice || passedProduct.price || matched?.pricePerUnit || 100,
        image: imagesList[0],
        images: imagesList,
        quantity: (location.state as any)?.quantity || 1,
        selectedSize: (location.state as any)?.selectedSize || passedProduct.selectedSize,
        selectedColor: (location.state as any)?.selectedColor || passedProduct.selectedColor,
      }];
    }

    if (globalCartItems && globalCartItems.length > 0) {
      return globalCartItems.map((cItem) => {
        const matched = defaultFoodCatalog.find(p => p.id === cItem.productId) as any;
        const imagesList = ensureMultiImages(cItem);
        return {
          id: cItem.productId,
          nameBn: cItem.name,
          brand: matched?.brand || "বাজার",
          unit: matched?.unit || cItem.weight || "পিস",
          unitWeightKg: matched?.unitWeightKg || 1,
          pricePerUnit: cItem.price,
          image: imagesList[0] || cItem.image || "",
          images: imagesList,
          quantity: cItem.quantity,
          selectedSize: cItem.selectedSize,
          selectedColor: cItem.selectedColor,
        };
      });
    }

    // Default pre-populated initial basket
    return [
      {
        id: "food-1",
        nameBn: "মিনিকেট চাল (প্রিমিয়াম)",
        brand: "প্রাণ / এসিআই",
        unit: "কেজি",
        unitWeightKg: 1,
        pricePerUnit: 78,
        image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80",
        quantity: 2,
      },
      {
        id: "food-2",
        nameBn: "মসুর ডাল (দেশি চিকন)",
        brand: "দেশি ফ্রেশ",
        unit: "কেজি",
        unitWeightKg: 1,
        pricePerUnit: 140,
        image: "https://images.unsplash.com/photo-1515942400420-2b98fed1f515?w=400&q=80",
        quantity: 1,
      }
    ];
  });

  // Customer Delivery Information State (Hierarchical Form Entry)
  const [addressForm, setAddressForm] = useState(() => {
    const saved = localStorage.getItem("food_user_address");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          name: parsed.name || "",
          phone: parsed.phone || "",
          division: parsed.division || "ঢাকা",
          district: parsed.district || "ঢাকা",
          upazila: parsed.upazila || "মিরপুর",
          union: parsed.union || "মিরপুর-১০",
          customUnion: parsed.customUnion || "",
          fullAddress: parsed.fullAddress || "",
          extraInstructions: parsed.extraInstructions || ""
        };
      } catch (e) {
        // ignore
      }
    }
    return {
      name: "",
      phone: "",
      division: "ঢাকা",
      district: "ঢাকা",
      upazila: "মিরপুর",
      union: "মিরপুর-১০",
      customUnion: "",
      fullAddress: "",
      extraInstructions: ""
    };
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Auto-fill customer profile details if logged in
  useEffect(() => {
    if (profile) {
      setAddressForm(prev => ({
        ...prev,
        name: prev.name || profile.name || "",
        phone: prev.phone || profile.phone || "",
        fullAddress: prev.fullAddress || profile.address || ""
      }));
    }
  }, [profile]);

  // Delivery Method: "home" | "pickup"
  const [deliveryMethod, setDeliveryMethod] = useState<"home" | "pickup">("home");

  // Payment Method: "bkash" | "nagad" | "rocket" | "upay" | "cellfin" | "cod"
  const [paymentMethod, setPaymentMethod] = useState<"bkash" | "nagad" | "rocket" | "upay" | "cellfin" | "cod">("cod");
  const [senderNumber, setSenderNumber] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [walletBalance, setWalletBalance] = useState<number>(() => {
    const saved = localStorage.getItem("bnb_wallet_balance");
    return saved ? Number(saved) : 2500;
  });

  // Confirmation state
  const [isAgreed, setIsAgreed] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generated Order Details
  const [placedOrder, setPlacedOrder] = useState<any>(null);

  // Order Tracking state (1: Placed, 2: Confirmed, 3: Preparing, 4: Ready, 5: Out for delivery, 6: Delivered)
  const [trackingStatusIndex, setTrackingStatusIndex] = useState<number>(3);
  const [userRating, setUserRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>("");
  const [reviewSubmitted, setReviewSubmitted] = useState<boolean>(false);
  const [geoLocating, setGeoLocating] = useState<boolean>(false);
  const [deliveryConfig, setDeliveryConfig] = useState<{ insideDhaka: number; subDhaka: number; outsideDhaka: number; freeDeliveryThreshold?: number }>({
    insideDhaka: 60,
    subDhaka: 100,
    outsideDhaka: 120,
    freeDeliveryThreshold: 2000
  });

  // Fetch delivery configuration
  useEffect(() => {
    const fetchDeliveryConfig = async () => {
      try {
        const docSnap = await getDoc(doc(db, "app_settings", "delivery_config"));
        if (docSnap.exists()) {
          setDeliveryConfig(docSnap.data() as any);
        }
      } catch (err) {
        console.error("Error fetching delivery config:", err);
      }
    };
    fetchDeliveryConfig();
  }, []);

  // If orderId is provided in URL params, switch directly to tracking
  useEffect(() => {
    if (paramOrderId) {
      setCurrentStep(7);
      const fetchOrder = async () => {
        try {
          const docSnap = await getDoc(doc(db, "food_orders", paramOrderId));
          if (docSnap.exists()) {
            setPlacedOrder({ id: docSnap.id, ...docSnap.data() });
          } else {
            const localOrder = localStorage.getItem(`order_${paramOrderId}`);
            if (localOrder) setPlacedOrder(JSON.parse(localOrder));
          }
        } catch (err) {
          const localOrder = localStorage.getItem(`order_${paramOrderId}`);
          if (localOrder) setPlacedOrder(JSON.parse(localOrder));
        }
      };
      fetchOrder();
    }
  }, [paramOrderId]);

  // Derived Calculations
  const totalItemCount = orderItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalItemPrice = orderItems.reduce((sum, item) => sum + (item.pricePerUnit * item.quantity), 0);
  const totalWeightKg = orderItems.reduce((sum, item) => sum + (item.unitWeightKg * item.quantity), 0);

  // Delivery charge calculation
  const getDeliveryCharge = () => {
    if (deliveryMethod === "pickup") return 0;
    
    // Check for free delivery threshold
    if (deliveryConfig.freeDeliveryThreshold && totalItemPrice >= deliveryConfig.freeDeliveryThreshold) {
      return 0;
    }

    const dist = addressForm.district || "";
    const upazila = addressForm.upazila || "";

    // 1. Inside Dhaka (Dhaka City)
    if (dist === "ঢাকা") {
      // These are considered suburban even if under Dhaka district
      if (upazila === "সাভার" || upazila === "কেরানীগঞ্জ" || upazila === "ধামরাই" || upazila === "নবাবগঞ্জ" || upazila === "দোহার") {
        return deliveryConfig.subDhaka;
      }
      return deliveryConfig.insideDhaka;
    }

    // 2. Suburban / Around Dhaka
    if (dist === "গাজীপুর" || dist === "নারায়ণগঞ্জ" || dist === "মুন্সীগঞ্জ" || dist === "নরসিংদী" || dist === "মানিকগঞ্জ") {
      return deliveryConfig.subDhaka;
    }

    // 3. Default outside Dhaka (Other districts)
    return deliveryConfig.outsideDhaka;
  };

  const deliveryCharge = getDeliveryCharge();
  const grandTotal = totalItemPrice + deliveryCharge;

  // Quantity handlers
  const handleQuantityChange = (itemId: string, delta: number) => {
    setOrderItems(prev => 
      prev
        .map(item => {
          if (item.id === itemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as OrderItem[]
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setOrderItems(prev => prev.filter(item => item.id !== itemId));
  };

  // Location Autodetect
  const handleGetCurrentLocation = () => {
    setGeoLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGeoLocating(false);
          setAddressForm(prev => ({
            ...prev,
            division: prev.division || "ঢাকা",
            district: prev.district || "ঢাকা",
            upazila: prev.upazila || "মিরপুর",
            union: prev.union || "মিরপুর-১০",
            fullAddress: prev.fullAddress || `GPS অবস্থান: [${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}]`,
            extraInstructions: prev.extraInstructions || "বর্তমান GPS লোকেশন অনুযায়ী ডেলিভারি করবেন"
          }));
        },
        (err) => {
          setGeoLocating(false);
          setAddressForm(prev => ({
            ...prev,
            division: prev.division || "ঢাকা",
            district: prev.district || "ঢাকা",
            upazila: prev.upazila || "মিরপুর",
            union: prev.union || "মিরপুর-১০",
            fullAddress: prev.fullAddress || "রোড #৩, সেক্টর-১০, মিরপুর",
            extraInstructions: prev.extraInstructions || "বর্তমান লোকেশন পয়েন্টের কাছাকাছি পৌঁছালে কল করবেন"
          }));
        },
        { timeout: 5000 }
      );
    } else {
      setGeoLocating(false);
      alert("আপনার ডিভাইসে জিওলোকেশন সাপোর্ট নেই।");
    }
  };

  // Form Validation & Step Progression
  const handleProceedToDelivery = () => {
    const errors: { [key: string]: string } = {};
    if (!addressForm.name.trim()) {
      errors.name = "অনুগ্রহ করে প্রাপকের পূর্ণ নাম লিখুন";
    }
    if (!addressForm.phone.trim()) {
      errors.phone = "অনুগ্রহ করে সচল মোবাইল নম্বর লিখুন";
    } else if (addressForm.phone.replace(/[^0-9]/g, "").length < 11) {
      errors.phone = "১১ ডিজিটের সঠিক মোবাইল নম্বর দিন (যেমন: 01712345678)";
    }
    if (!addressForm.division) {
      errors.division = "বিভাগ নির্বাচন করুন";
    }
    if (!addressForm.district) {
      errors.district = "জেলা নির্বাচন করুন";
    }
    if (!addressForm.upazila) {
      errors.upazila = "থানা / উপজেলা নির্বাচন করুন";
    }
    if (!addressForm.union) {
      errors.union = "ইউনিয়ন / ওয়ার্ড নির্বাচন করুন";
    }
    if ((addressForm.union === "custom" || addressForm.union === "অন্যান্য / নতুন ইউনিয়ন") && !addressForm.customUnion.trim()) {
      errors.customUnion = "আপনার ইউনিয়ন বা ওয়ার্ডের নাম লিখুন";
    }
    if (!addressForm.fullAddress.trim()) {
      errors.fullAddress = "অনুগ্রহ করে বিস্তারিত ঠিকানা (বাড়ি/রোড/গ্রাম/পাড়া) লিখুন যেখানে পণ্য গ্রহণ করবেন";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    try {
      localStorage.setItem("food_user_address", JSON.stringify(addressForm));
    } catch (e) {
      // ignore
    }
    setCurrentStep(3);
  };

  // Active address
  const chosenUnionName = (addressForm.union === "custom" || addressForm.union === "অন্যান্য / নতুন ইউনিয়ন")
    ? (addressForm.customUnion.trim() || "ইউনিয়ন")
    : (addressForm.union.trim() || "");

  const activeAddress = {
    name: addressForm.name.trim() || "সম্মানিত গ্রাহক",
    phone: addressForm.phone.trim() || "প্রযোজ্য নয়",
    division: addressForm.division,
    district: addressForm.district,
    upazila: addressForm.upazila,
    union: chosenUnionName,
    fullAddress: [
      addressForm.fullAddress.trim(),
      chosenUnionName,
      addressForm.upazila,
      addressForm.district,
      addressForm.division
    ].filter(Boolean).join(", "),
    detailedAddress: addressForm.fullAddress.trim(),
    extra: addressForm.extraInstructions.trim()
  };

  // Order Submission (No PIN needed)
  const handleConfirmOrder = async () => {
    if (!user) {
      requireAuth(() => {
        handleConfirmOrder();
      }, "অর্ডার চূড়ান্তভাবে নিশ্চিত করতে প্রথমে আপনার অ্যাকাউন্টে লগইন করুন।");
      return;
    }

    if (!isAgreed) {
      alert("অনুগ্রহ করে তথ্য যাচাইয়ের চেকবক্সে টিক দিন।");
      return;
    }
    if (orderItems.length === 0) {
      alert("আপনার অর্ডারে কোনো পণ্য নেই!");
      setCurrentStep(1);
      return;
    }

    if (paymentMethod !== "cod") {
      if (!senderNumber.trim() || !transactionId.trim()) {
        alert("অনুগ্রহ করে যে নাম্বার থেকে টাকা পাঠিয়েছেন এবং ট্রানজেকশন আইডি (TrxID) দিন।");
        return;
      }
    }

    setIsSubmitting(true);

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const uniqueOrderId = `BNB-${dateStr}-${randomCode}`;

    const orderPayload = {
      orderId: uniqueOrderId,
      items: orderItems.map(item => ({
        id: item.id,
        nameBn: item.nameBn,
        brand: item.brand,
        unit: item.unit,
        pricePerUnit: item.pricePerUnit,
        quantity: item.quantity,
        total: item.pricePerUnit * item.quantity,
        image: item.image,
        selectedSize: item.selectedSize || null,
        selectedColor: item.selectedColor || null,
      })),
      totalItems: totalItemCount,
      subtotal: totalItemPrice,
      totalWeightKg: totalWeightKg,
      deliveryMethod: deliveryMethod === "home" ? "হোম ডেলিভারি" : "দোকান / পিকআপ",
      deliveryCharge: deliveryCharge,
      grandTotal: grandTotal,
      paymentMethod: paymentMethod === "cod" ? "Cash on Delivery" : paymentMethod.toUpperCase(),
      paymentStatus: paymentMethod === "cod" ? "unpaid" : (transactionId ? "pending_verification" : "unpaid"),
      paymentDetails: (paymentMethod !== "cod") ? {
        senderNumber,
        transactionId
      } : null,
      shippingAddress: activeAddress,
      status: "অর্ডার গ্রহণ করা হয়েছে",
      statusIndex: 3,
      createdAt: serverTimestamp(),
      createdAtText: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      estimatedArrival: "আজ 7:00 PM – 8:00 PM",
      rider: {
        name: "মোঃ রাকিবুল হাসান",
        phone: "01823456789"
      }
    };

    try {
      try {
        await addDoc(collection(db, "food_orders"), orderPayload);
      } catch (e) {
        console.warn("Firestore sync log:", e);
      }

      localStorage.setItem(`order_${uniqueOrderId}`, JSON.stringify(orderPayload));
      localStorage.setItem("latest_food_order", JSON.stringify(orderPayload));

      setPlacedOrder(orderPayload);
      setIsSubmitting(false);
      setCurrentStep(6); // Step 6: Order Success
    } catch (err) {
      console.error("Order submission error:", err);
      setIsSubmitting(false);
      alert("অর্ডার সম্পূর্ণ করতে কিছুটা সমস্যা হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।");
    }
  };

  // Submit Review
  const handleSubmitReview = async () => {
    if (!placedOrder) return;
    setReviewSubmitted(true);
    try {
      await addDoc(collection(db, "food_reviews"), {
        orderId: placedOrder.orderId,
        rating: userRating,
        comment: reviewComment,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.warn("Review submission:", e);
    }
  };

  // Tracking Timeline steps configuration
  const trackingTimeline = [
    { id: 1, title: "অর্ডার গ্রহণ করা হয়েছে", time: placedOrder?.createdAtText ? `আজ • ${placedOrder.createdAtText}` : "আজ • 05:42 PM", done: trackingStatusIndex >= 1 },
    { id: 2, title: "অর্ডার নিশ্চিত হয়েছে", time: "আজ • 05:43 PM", done: trackingStatusIndex >= 2 },
    { id: 3, title: "পণ্য প্রস্তুত করা হচ্ছে", time: "বর্তমানে", isCurrent: trackingStatusIndex === 3, done: trackingStatusIndex >= 3 },
    { id: 4, title: "ডেলিভারির জন্য প্রস্তুত", time: "অপেক্ষমাণ", isCurrent: trackingStatusIndex === 4, done: trackingStatusIndex >= 4 },
    { id: 5, title: "ডেলিভারিতে বের হয়েছে", time: "অপেক্ষমাণ", isCurrent: trackingStatusIndex === 5, done: trackingStatusIndex >= 5 },
    { id: 6, title: "ডেলিভারি সম্পন্ন", time: "অপেক্ষমাণ", isCurrent: trackingStatusIndex === 6, done: trackingStatusIndex >= 6 },
  ];

  // Stepper steps for header progress bar
  const stepTitles = [
    "১. কার্ট ও বিবরণ",
    "২. ঠিকানা",
    "৩. ডেলিভারি",
    "৪. পেমেন্ট",
    "৫. নিশ্চিতকরণ",
    "৬. সফল",
    "৭. ট্র্যাকিং"
  ];

  if (isFoodCategoryDisabled) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <SEO title="খাদ্য বাজার বন্ধ - All MAYADIN FASHION" description="Food Market currently offline" />
        <div className="w-20 h-20 bg-rose-100 text-rose-700 rounded-3xl flex items-center justify-center mb-4 shadow-sm">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-black text-gray-900 mb-2">খাদ্য বাজার সেকশনটি বর্তমানে বন্ধ আছে</h2>
        <p className="text-xs text-gray-500 max-w-sm font-medium mb-6 leading-relaxed">
          সম্মানিত গ্রাহক, খাদ্য বাজার সেকশনটি বর্তমানে এডমিন কর্তৃক সাময়িকভাবে বন্ধ রাখা হয়েছে। শীঘ্রই পুনরায় চালু করা হবে।
        </p>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-3 bg-[#004b23] text-white font-bold text-xs rounded-2xl shadow-md hover:bg-[#00381a] active:scale-95 transition-transform flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>হোম পেইজে ফিরে যান</span>
        </button>
      </div>
    );
  }

  return (
    <div className="-mx-4 -mt-4 bg-[#f4f7f4] min-h-screen pb-28 font-sans text-gray-900">
      <SEO 
        title="খাদ্য অর্ডার কার্যক্রম - All Mayadin Bazar" 
        description="সহজ ও দ্রুত খাদ্য সামগ্রী অর্ডার করুন - কার্ট, ঠিকানা ও পেমেন্ট" 
      />

      {/* Global Order Flow Top Header */}
      {currentStep <= 5 && (
        <header className="sticky top-0 z-40 bg-[#004b23] text-white px-4 pt-5 pb-4 shadow-lg rounded-b-[28px]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                  if (currentStep === 1) navigate(-1);
                  else setCurrentStep(prev => prev - 1);
                }} 
                className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center border border-white/20 active:scale-95 transition-all"
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <div>
                <span className="text-[10px] font-bold text-[#ffb703] uppercase tracking-wider block">{categoryName}</span>
                <h1 className="text-lg font-black tracking-tight flex items-center gap-1.5 leading-none mt-0.5">
                  🛒 অর্ডার কার্যক্রম
                </h1>
              </div>
            </div>

            <div className="bg-white/15 px-3 py-1.5 rounded-full border border-white/20 flex items-center gap-1 text-xs font-bold text-[#ffb703]">
              <span>ধাপ {currentStep}/৫</span>
            </div>
          </div>

          {/* Stepper Progress Dots / Bar */}
          <div className="flex items-center justify-between gap-1 pt-1">
            {[1, 2, 3, 4, 5].map((stepNum) => (
              <div key={stepNum} className="flex-1 flex flex-col items-center gap-1">
                <div 
                  className={`h-1.5 w-full rounded-full transition-all duration-300 ${
                    stepNum <= currentStep ? "bg-[#ffb703]" : "bg-white/20"
                  }`} 
                />
                <span className={`text-[9px] font-bold truncate ${
                  stepNum === currentStep ? "text-[#ffb703]" : "text-white/60"
                }`}>
                  {stepNum === 1 && "কার্ট"}
                  {stepNum === 2 && "ঠিকানা"}
                  {stepNum === 3 && "ডেলিভারি"}
                  {stepNum === 4 && "পেমেন্ট"}
                  {stepNum === 5 && "কনফার্ম"}
                </span>
              </div>
            ))}
          </div>
        </header>
      )}

      {/* ========================================================================= */}
      {/* 1. STEP 1: কার্ট ও অর্ডারের সারসংক্ষেপ (CART & ORDER ITEMS) */}
      {/* ========================================================================= */}
      {currentStep === 1 && (
        <div className="space-y-4 px-4 pt-4">
          <div className="flex items-center justify-between pb-1">
            <div>
              <h2 className="text-base font-black text-gray-900">আপনার অর্ডারের পণ্যসমূহ</h2>
              <p className="text-xs text-gray-500 font-medium">নির্বাচিত {totalItemCount}টি খাদ্য সামগ্রী</p>
            </div>

            {orderItems.length > 0 && (
              <button 
                onClick={() => setOrderItems([])}
                className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 bg-red-50 px-2.5 py-1 rounded-lg"
              >
                <Trash2 className="w-3.5 h-3.5" /> কার্ট খালি করুন
              </button>
            )}
          </div>

          {/* Order Items List */}
          {orderItems.length === 0 ? (
            <div className="bg-white rounded-[28px] p-8 text-center border border-gray-100 shadow-sm space-y-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-black text-gray-800">অর্ডারে কোনো পণ্য নেই</h3>
                <p className="text-xs text-gray-500 mt-1">খাদ্য বাজার থেকে পছন্দের পণ্য যোগ করুন।</p>
              </div>
              <button
                onClick={() => navigate(-1)}
                className="bg-[#004b23] text-white px-6 py-3 rounded-xl text-xs font-black shadow-md inline-flex items-center gap-2 active:scale-95"
              >
                পণ্য দেখুন <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {orderItems.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, x: -50 }}
                    className="bg-white rounded-[24px] p-4 border border-gray-100 shadow-sm space-y-3"
                  >
                    <div className="flex gap-3.5 items-start">
                      <img 
                        src={item.image} 
                        alt={item.nameBn} 
                        className="w-24 h-24 object-cover rounded-2xl border border-gray-100 shadow-sm shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-bold text-gray-400 block">{item.brand}</span>
                        <h3 className="text-sm font-black text-gray-900 leading-snug line-clamp-2">{item.nameBn}</h3>
                        {(categoryName === "কাপড় ও পরিধান" || categoryName.includes("কাপড়") || categoryName.includes("ফ্যাশন") || item.category === "cat3") && (item.selectedSize || item.selectedColor) && (
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            {item.selectedSize && (
                              <span className="text-[10px] sm:text-xs font-black text-[#004b23] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 uppercase tracking-wide">
                                সাইজ: {item.selectedSize}
                              </span>
                            )}
                            {item.selectedColor && (
                              <span className="text-[10px] sm:text-xs font-black text-gray-600 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100 uppercase tracking-wide">
                                রঙ: {item.selectedColor}
                              </span>
                            )}
                          </div>
                        )}
                        <p className="text-xs font-bold text-gray-500 mt-1.5">
                          ৳{item.pricePerUnit} / {item.unit}
                        </p>
                        <p className="text-sm font-black text-[#004b23] mt-1">
                          মোট: ৳{(item.pricePerUnit * item.quantity || 0).toLocaleString('bn-BD')}
                        </p>
                      </div>

                      <button 
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-2.5 text-gray-400 hover:text-red-500 rounded-xl hover:bg-red-50 transition-colors"
                        title="বাদ দিন"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    {item.images && item.images.length > 1 && (
                      <div className="flex gap-2.5 overflow-x-auto py-1">
                        {item.images.map((imgUrl, imgIdx) => (
                          <button
                            key={imgIdx}
                            type="button"
                            onClick={() => {
                              const updated = orderItems.map(oi => oi.id === item.id ? { ...oi, image: imgUrl } : oi);
                              setOrderItems(updated);
                            }}
                            className={`w-14 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${item.image === imgUrl ? 'border-[#004b23] shadow-md scale-105' : 'border-gray-100 opacity-70 hover:opacity-100'}`}
                          >
                            <img src={imgUrl} alt="thumb" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Quantity bar */}
                    <div className="flex items-center justify-between bg-[#f8faf8] p-2.5 rounded-2xl border border-gray-100">
                      <span className="text-xs font-bold text-gray-700">পরিমাণ পরিবর্তন:</span>
                      <div className="flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-xl border border-gray-200 shadow-sm">
                        <button 
                          onClick={() => handleQuantityChange(item.id, -1)}
                          className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-lg active:scale-90 transition-transform"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-4 h-4 stroke-[3]" />
                        </button>
                        <span className="text-xs font-black px-2 min-w-[50px] text-center text-[#004b23]">
                          {item.quantity} {item.unit}
                        </span>
                        <button 
                          onClick={() => handleQuantityChange(item.id, 1)}
                          className="w-7 h-7 bg-[#004b23] text-white flex items-center justify-center hover:bg-[#00381a] rounded-lg active:scale-90 transition-transform shadow"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-4 h-4 stroke-[3]" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Add More Products Button */}
              <button
                onClick={() => navigate(-1)}
                className="w-full bg-white text-[#004b23] border-2 border-dashed border-[#004b23]/30 hover:border-[#004b23] font-black py-3 rounded-2xl text-xs flex items-center justify-center gap-2 active:scale-98 transition-all"
              >
                <Plus className="w-4 h-4 stroke-[3]" /> আরও পণ্য যোগ করুন
              </button>
            </div>
          )}

          {/* Order Summary Calculation Box */}
          {orderItems.length > 0 && (
            <div className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm space-y-3">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider pb-1 border-b border-gray-100">
                অর্ডারের হিসাব বিবরণী
              </h3>
              
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">মোট আইটেম:</span>
                <span className="font-bold text-gray-900">{totalItemCount} টি ({totalWeightKg.toFixed(1)} কেজি)</span>
              </div>

              <div className="flex justify-between text-xs">
                <span className="text-gray-600">পণ্যের মোট মূল্য:</span>
                <span className="font-bold text-gray-900">৳{(totalItemPrice || 0).toLocaleString('bn-BD')}</span>
              </div>

              <div className="flex justify-between text-xs">
                <span className="text-gray-600">আনুমানিক ডেলিভারি চার্জ:</span>
                <span className="font-bold text-[#004b23] bg-emerald-50 px-2 py-0.5 rounded">
                  ৳{(deliveryCharge || 0).toLocaleString('bn-BD')}
                </span>
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                <div>
                  <span className="text-sm font-black text-gray-900 block leading-tight">সর্বমোট মূল্য:</span>
                  <span className="text-[10px] text-gray-400 font-medium">ভ্যাট সহ</span>
                </div>
                <span className="text-xl font-black text-[#004b23]">
                  ৳{(grandTotal || 0).toLocaleString('bn-BD')}
                </span>
              </div>
            </div>
          )}

          {/* Bottom Action */}
          {orderItems.length > 0 && (
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-gray-200 z-50">
              <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                <div className="flex flex-col pl-1">
                  <span className="text-[11px] font-bold text-gray-500">মোট পরিশোধযোগ্য:</span>
                  <span className="text-lg font-black text-[#004b23] leading-none">
                    ৳{(grandTotal || 0).toLocaleString('bn-BD')}
                  </span>
                </div>

                <button
                  onClick={() => {
                    requireAuth(() => {
                      setCurrentStep(2);
                    }, "পণ্য অর্ডার করতে এবং ডেলিভারি ঠিকানা দিতে আগে লগইন অথবা নতুন একাউন্ট খুলুন।");
                  }}
                  className="bg-[#004b23] hover:bg-[#00381a] text-white font-black px-6 py-3.5 rounded-2xl shadow-lg shadow-[#004b23]/30 flex items-center gap-2 active:scale-95 transition-all text-sm"
                >
                  ঠিকানা দিতে এগিয়ে যান <ChevronRight className="w-4 h-4 stroke-[3]" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. STEP 2: ডেলিভারি ও ঠিকানার ফর্ম (DELIVERY ADDRESS & CUSTOMER INFO) */}
      {/* ========================================================================= */}
      {currentStep === 2 && (
        <div className="space-y-4 px-4 pt-4 pb-24">
          <div className="flex items-center justify-between pb-1">
            <div>
              <h2 className="text-base font-black text-gray-900 flex items-center gap-1.5">
                <MapPin className="w-5 h-5 text-[#004b23]" /> ডেলিভারি ঠিকানা ও গ্রাহকের তথ্য
              </h2>
              <p className="text-xs text-gray-500 font-medium">জেলা, থানা ও ইউনিয়ন নির্বাচন করে সম্পূর্ণ ঠিকানা দিন</p>
            </div>

            <button
              type="button"
              onClick={handleGetCurrentLocation}
              disabled={geoLocating}
              className="py-2 px-3 rounded-xl border border-[#004b23]/30 bg-emerald-50 hover:bg-emerald-100 text-xs font-bold text-[#004b23] flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
            >
              <Navigation className={`w-3.5 h-3.5 text-[#004b23] ${geoLocating ? "animate-spin" : ""}`} />
              {geoLocating ? "খুঁজছি..." : "📍 GPS লোকেশন"}
            </button>
          </div>

          {/* Stepper Hierarchy Indicator */}
          <div className="bg-[#f0f9f4] border border-[#004b23]/20 rounded-2xl p-3 flex items-center justify-between overflow-x-auto text-[11px] font-bold text-gray-700">
            <span className="flex items-center gap-1 text-[#004b23] whitespace-nowrap font-black">
              <span className="w-4 h-4 rounded-full bg-[#004b23] text-white flex items-center justify-center text-[10px]">১</span> বিভাগ
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="flex items-center gap-1 text-[#004b23] whitespace-nowrap font-black">
              <span className="w-4 h-4 rounded-full bg-[#004b23] text-white flex items-center justify-center text-[10px]">২</span> জেলা
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="flex items-center gap-1 text-[#004b23] whitespace-nowrap font-black">
              <span className="w-4 h-4 rounded-full bg-[#004b23] text-white flex items-center justify-center text-[10px]">৩</span> থানা
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="flex items-center gap-1 text-[#004b23] whitespace-nowrap font-black">
              <span className="w-4 h-4 rounded-full bg-[#004b23] text-white flex items-center justify-center text-[10px]">৪</span> ইউনিয়ন
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="flex items-center gap-1 text-[#004b23] whitespace-nowrap font-black">
              <span className="w-4 h-4 rounded-full bg-[#004b23] text-white flex items-center justify-center text-[10px]">৫</span> ঠিকানা
            </span>
          </div>

          {/* Customer Address Form */}
          <div className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm space-y-4">
            {/* 1. Recipient Name */}
            <div>
              <label className="text-xs font-black text-gray-700 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#004b23]" /> প্রাপকের পূর্ণ নাম *
                </span>
                {formErrors.name && (
                  <span className="text-[10px] font-bold text-red-500 flex items-center gap-0.5">
                    <AlertCircle className="w-3 h-3" /> {formErrors.name}
                  </span>
                )}
              </label>
              <input
                type="text"
                value={addressForm.name}
                onChange={(e) => {
                  setAddressForm({ ...addressForm, name: e.target.value });
                  if (formErrors.name) setFormErrors({ ...formErrors, name: "" });
                }}
                placeholder="আপনার নাম লিখুন (যেমন: মোঃ আব্দুল্লাহ)"
                className={`w-full text-xs font-bold p-3.5 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004b23]/30 ${
                  formErrors.name ? "border-red-400 bg-red-50/30" : "border-gray-200"
                }`}
              />
            </div>

            {/* 2. Phone Number */}
            <div>
              <label className="text-xs font-black text-gray-700 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#004b23]" /> সচল মোবাইল নম্বর *
                </span>
                {formErrors.phone && (
                  <span className="text-[10px] font-bold text-red-500 flex items-center gap-0.5">
                    <AlertCircle className="w-3 h-3" /> {formErrors.phone}
                  </span>
                )}
              </label>
              <input
                type="tel"
                value={addressForm.phone}
                onChange={(e) => {
                  setAddressForm({ ...addressForm, phone: e.target.value });
                  if (formErrors.phone) setFormErrors({ ...formErrors, phone: "" });
                }}
                placeholder="01XXXXXXXXX"
                className={`w-full text-xs font-bold p-3.5 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004b23]/30 ${
                  formErrors.phone ? "border-red-400 bg-red-50/30" : "border-gray-200"
                }`}
              />
              <p className="text-[10px] text-gray-400 mt-1">ডেলিভারির সময় এই নম্বরে কল দিয়ে যোগাযোগ করা হবে।</p>
            </div>

            {/* 3. Division and District Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Division */}
              <div>
                <label className="text-xs font-black text-gray-700 mb-1.5 flex items-center justify-between">
                  <span>বিভাগ নির্বাচন করুন *</span>
                  {formErrors.division && (
                    <span className="text-[10px] font-bold text-red-500">{formErrors.division}</span>
                  )}
                </label>
                <select
                  value={addressForm.division}
                  onChange={(e) => {
                    const divName = e.target.value;
                    const dists = getDistricts(divName);
                    const firstDist = dists[0]?.nameBn || "";
                    const ups = getUpazilas(divName, firstDist);
                    const firstUp = ups[0]?.nameBn || "";
                    const unns = getUnions(divName, firstDist, firstUp);
                    const firstUn = unns[0] || "";
                    setAddressForm({
                      ...addressForm,
                      division: divName,
                      district: firstDist,
                      upazila: firstUp,
                      union: firstUn,
                      customUnion: ""
                    });
                    if (formErrors.division) setFormErrors({ ...formErrors, division: "" });
                  }}
                  className="w-full text-xs font-bold p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004b23]/30"
                >
                  {bangladeshDivisions.map(d => (
                    <option key={d.name} value={d.nameBn}>{d.nameBn} বিভাগ</option>
                  ))}
                </select>
              </div>

              {/* District */}
              <div>
                <label className="text-xs font-black text-gray-700 mb-1.5 flex items-center justify-between">
                  <span>জেলা নির্বাচন করুন *</span>
                  {formErrors.district && (
                    <span className="text-[10px] font-bold text-red-500">{formErrors.district}</span>
                  )}
                </label>
                <select
                  value={addressForm.district}
                  onChange={(e) => {
                    const distName = e.target.value;
                    const ups = getUpazilas(addressForm.division, distName);
                    const firstUp = ups[0]?.nameBn || "";
                    const unns = getUnions(addressForm.division, distName, firstUp);
                    const firstUn = unns[0] || "";
                    setAddressForm({
                      ...addressForm,
                      district: distName,
                      upazila: firstUp,
                      union: firstUn,
                      customUnion: ""
                    });
                    if (formErrors.district) setFormErrors({ ...formErrors, district: "" });
                  }}
                  className={`w-full text-xs font-bold p-3 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004b23]/30 ${
                    formErrors.district ? "border-red-400 bg-red-50/30" : "border-gray-200"
                  }`}
                >
                  <option value="">-- জেলা নির্বাচন করুন --</option>
                  {getDistricts(addressForm.division).map(dist => (
                    <option key={dist.name} value={dist.nameBn}>{dist.nameBn}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 4. Thana and Union Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Thana / Upazila */}
              <div>
                <label className="text-xs font-black text-gray-700 mb-1.5 flex items-center justify-between">
                  <span>থানা / উপজেলা নির্বাচন করুন *</span>
                  {formErrors.upazila && (
                    <span className="text-[10px] font-bold text-red-500">{formErrors.upazila}</span>
                  )}
                </label>
                <select
                  value={addressForm.upazila}
                  disabled={!addressForm.district}
                  onChange={(e) => {
                    const upName = e.target.value;
                    const unns = getUnions(addressForm.division, addressForm.district, upName);
                    const firstUn = unns[0] || "";
                    setAddressForm({
                      ...addressForm,
                      upazila: upName,
                      union: firstUn,
                      customUnion: ""
                    });
                    if (formErrors.upazila) setFormErrors({ ...formErrors, upazila: "" });
                  }}
                  className={`w-full text-xs font-bold p-3 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004b23]/30 ${
                    !addressForm.district ? "opacity-60 cursor-not-allowed" : ""
                  } ${formErrors.upazila ? "border-red-400 bg-red-50/30" : "border-gray-200"}`}
                >
                  {!addressForm.district ? (
                    <option value="">আগে জেলা সিলেক্ট করুন</option>
                  ) : (
                    <>
                      <option value="">-- থানা / উপজেলা নির্বাচন করুন --</option>
                      {getUpazilas(addressForm.division, addressForm.district).map(up => (
                        <option key={up.nameBn} value={up.nameBn}>{up.nameBn}</option>
                      ))}
                    </>
                  )}
                </select>
              </div>

              {/* Union / Ward */}
              <div>
                <label className="text-xs font-black text-gray-700 mb-1.5 flex items-center justify-between">
                  <span>ইউনিয়ন / ওয়ার্ড নির্বাচন করুন *</span>
                  {formErrors.union && (
                    <span className="text-[10px] font-bold text-red-500">{formErrors.union}</span>
                  )}
                </label>
                <select
                  value={addressForm.union}
                  disabled={!addressForm.upazila}
                  onChange={(e) => {
                    setAddressForm({
                      ...addressForm,
                      union: e.target.value
                    });
                    if (formErrors.union) setFormErrors({ ...formErrors, union: "" });
                  }}
                  className={`w-full text-xs font-bold p-3 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004b23]/30 ${
                    !addressForm.upazila ? "opacity-60 cursor-not-allowed" : ""
                  } ${formErrors.union ? "border-red-400 bg-red-50/30" : "border-gray-200"}`}
                >
                  {!addressForm.upazila ? (
                    <option value="">আগে থানা সিলেক্ট করুন</option>
                  ) : (
                    <>
                      <option value="">-- ইউনিয়ন / ওয়ার্ড নির্বাচন করুন --</option>
                      {getUnions(addressForm.division, addressForm.district, addressForm.upazila).map(un => (
                        <option key={un} value={un}>{un}</option>
                      ))}
                      <option value="অন্যান্য / নতুন ইউনিয়ন">+ অন্যান্য / নতুন ইউনিয়ন লিখুন</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            {/* Custom Union input if chosen */}
            {(addressForm.union === "অন্যান্য / নতুন ইউনিয়ন" || addressForm.union === "custom") && (
              <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1">
                <label className="text-xs font-black text-[#004b23] flex items-center justify-between">
                  <span>আপনার ইউনিয়ন / ওয়ার্ড বা এলাকার নাম লিখুন *</span>
                  {formErrors.customUnion && (
                    <span className="text-[10px] font-bold text-red-500">{formErrors.customUnion}</span>
                  )}
                </label>
                <input
                  type="text"
                  value={addressForm.customUnion}
                  onChange={(e) => {
                    setAddressForm({ ...addressForm, customUnion: e.target.value });
                    if (formErrors.customUnion) setFormErrors({ ...formErrors, customUnion: "" });
                  }}
                  placeholder="যেমন: ৩নং ওয়ার্ড / উত্তরপাড়া ইউনিয়ন / বিশেষ ব্লক"
                  className="w-full text-xs font-bold p-3 bg-white border border-emerald-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004b23]/30"
                />
              </div>
            )}

            {/* 5. Detailed Delivery Address (বাড়ি নং / রোড নং / ফ্ল্যাট / পাড়া / গ্রাম) */}
            <div>
              <label className="text-xs font-black text-gray-700 mb-1.5 flex items-center justify-between">
                <span>বিস্তারিত ঠিকানা (বাড়ি নং, রোড নং, ফ্ল্যাট, পাড়া / গ্রাম) *</span>
                {formErrors.fullAddress && (
                  <span className="text-[10px] font-bold text-red-500 flex items-center gap-0.5">
                    <AlertCircle className="w-3 h-3" /> {formErrors.fullAddress}
                  </span>
                )}
              </label>
              <textarea
                rows={2}
                value={addressForm.fullAddress}
                onChange={(e) => {
                  setAddressForm({ ...addressForm, fullAddress: e.target.value });
                  if (formErrors.fullAddress) setFormErrors({ ...formErrors, fullAddress: "" });
                }}
                placeholder="যেখানে পণ্য গ্রহণ করবেন তার বিস্তারিত ঠিকানা লিখুন (যেমন: বাড়ি #১২, রোড #৪, ব্লক-ডি / উত্তরপাড়া, মসজিদ সংলগ্ন...)"
                className={`w-full text-xs font-bold p-3 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004b23]/30 ${
                  formErrors.fullAddress ? "border-red-400 bg-red-50/30" : "border-gray-200"
                }`}
              />
              <p className="text-[10px] text-gray-400 mt-1">পণ্য ডেলিভারিম্যান সহজে খুঁজে পেতে সুনির্দিষ্ট স্থান বা ল্যান্ডমার্ক উল্লেখ করুন।</p>
            </div>

            {/* 6. Special Delivery Instructions (Optional) */}
            <div>
              <label className="text-xs font-black text-gray-700 mb-1.5 block">ডেলিভারি সংক্রান্ত বিশেষ নির্দেশনা (ঐচ্ছিক)</label>
              <input
                type="text"
                value={addressForm.extraInstructions}
                onChange={(e) => {
                  setAddressForm({ ...addressForm, extraInstructions: e.target.value });
                }}
                placeholder="যেমন: গেটে পৌঁছে কল করবেন / সিকিউরিটির কাছে রাখবেন"
                className="w-full text-xs font-medium p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004b23]/30"
              />
            </div>

            {/* Real-time Address Preview */}
            <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200/80 space-y-1">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider block">
                📍 নির্বাচিত ডেলিভারি পয়েন্ট:
              </span>
              <p className="text-xs font-bold text-gray-800 leading-snug">
                {activeAddress.fullAddress || "ঠিকানা পূরণ করুন..."}
              </p>
            </div>
          </div>

          {/* Bottom Action */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-gray-200 z-50">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-4 py-3.5 rounded-2xl border border-gray-300 hover:bg-gray-50 text-xs font-black text-gray-700 active:scale-95 transition-all"
              >
                আগের ধাপ
              </button>

              <button
                type="button"
                onClick={handleProceedToDelivery}
                className="flex-1 bg-[#004b23] hover:bg-[#00381a] text-white font-black py-3.5 rounded-2xl shadow-lg shadow-[#004b23]/30 flex items-center justify-center gap-2 active:scale-95 transition-all text-sm"
              >
                ডেলিভারি পদ্ধতিতে যান <ChevronRight className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. STEP 3: ডেলিভারি পদ্ধতি নির্বাচন (DELIVERY METHOD) */}
      {/* ========================================================================= */}
      {currentStep === 3 && (
        <div className="space-y-3 px-3 sm:px-4 pt-3 pb-32">
          <div className="pb-0.5">
            <h2 className="text-sm sm:text-base font-black text-gray-900 flex items-center gap-1.5">
              <Truck className="w-4 sm:w-5 h-4 sm:h-5 text-[#004b23]" /> ডেলিভারি পদ্ধতি
            </h2>
            <p className="text-[10px] sm:text-xs text-gray-500 font-medium">পছন্দের ডেলিভারি মাধ্যম বেছে নিন</p>
          </div>

          {/* Options */}
          <div className="space-y-2.5">
            {/* 1. Home Delivery */}
            <div
              onClick={() => setDeliveryMethod("home")}
              className={`p-3 sm:p-4 rounded-[20px] sm:rounded-[24px] border-2 transition-all cursor-pointer bg-white relative ${
                deliveryMethod === "home" 
                  ? "border-[#004b23] ring-1 ring-[#004b23]/10 bg-[#f8fdf9] shadow-sm" 
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-start justify-between gap-2 sm:gap-3">
                <div className="flex gap-2.5 sm:gap-3 items-start">
                  <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-xl sm:rounded-2xl bg-[#004b23]/10 flex items-center justify-center text-[#004b23] shrink-0">
                    <Truck className="w-5 sm:w-6 h-5 sm:h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-gray-900">🏠 হোম ডেলিভারি</h3>
                    <p className="text-[10px] sm:text-xs text-gray-600 mt-0.5 leading-tight">
                      “আপনার দেওয়া ঠিকানায় পণ্য দ্রুত পৌঁছে দেওয়া হবে।”
                    </p>
                    <span className="inline-block mt-1.5 text-[9px] sm:text-[11px] font-black text-[#004b23] bg-[#004b23]/10 px-2 py-0.5 sm:py-1 rounded-lg">
                      ডেলিভারি চার্জ: ৳{deliveryCharge}
                    </span>
                  </div>
                </div>

                <div className={`w-5 sm:w-6 h-5 sm:h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 sm:mt-1 ${
                  deliveryMethod === "home" ? "border-[#004b23] bg-[#004b23]" : "border-gray-300"
                }`}>
                  {deliveryMethod === "home" && <Check className="w-3 sm:w-4 h-3 sm:h-4 text-white stroke-[3]" />}
                </div>
              </div>
            </div>

            {/* 2. Store / Pickup */}
            <div
              onClick={() => setDeliveryMethod("pickup")}
              className={`p-4 rounded-[24px] border-2 transition-all cursor-pointer bg-white relative ${
                deliveryMethod === "pickup" 
                  ? "border-[#004b23] ring-2 ring-[#004b23]/20 bg-[#f8fdf9] shadow-sm" 
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3 items-start">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-700 shrink-0">
                    <Store className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-gray-900">🏪 দোকান / পিকআপ</h3>
                    <p className="text-xs text-gray-600 mt-0.5">
                      “নির্ধারিত আউটলেট থেকে নিজে গিয়ে পণ্য সংগ্রহ করুন।”
                    </p>
                    <span className="inline-block mt-2 text-[11px] font-black text-green-700 bg-green-50 px-2.5 py-1 rounded-lg">
                      ডেলিভারি চার্জ: সম্পূর্ণ বিনামূল্যে (৳০)
                    </span>
                  </div>
                </div>

                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 ${
                  deliveryMethod === "pickup" ? "border-[#004b23] bg-[#004b23]" : "border-gray-300"
                }`}>
                  {deliveryMethod === "pickup" && <Check className="w-4 h-4 text-white stroke-[3]" />}
                </div>
              </div>
            </div>
          </div>

          {/* Weight & Delivery Charge Breakdown */}
          <div className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm space-y-3">
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider">ডেলিভারি চার্জের বিবরণ:</h4>
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">মোট পণ্যের ওজন:</span>
              <span className="font-black text-gray-900">{totalWeightKg.toFixed(1)} কেজি</span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">ডেলিভারি চার্জ:</span>
              <span className="font-black text-[#004b23] text-base">
                ৳{(deliveryCharge || 0).toLocaleString('bn-BD')}
              </span>
            </div>

            <div className="p-2.5 bg-gray-50 rounded-xl text-xs text-gray-500">
              {deliveryMethod === "home" 
                ? "💡 প্রথম ৩ কেজির জন্য ৳২০, অতিরিক্ত প্রতি কেজিতে ৳১০ ধার্য।" 
                : "💡 পিকআপের জন্য কোনো ডেলিভারি চার্জ নেওয়া হয় না।"}
            </div>
          </div>

          {/* Bottom Action */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-gray-200 z-50">
            <button
              onClick={() => setCurrentStep(4)}
              className="w-full bg-[#004b23] text-white font-black py-4 rounded-2xl shadow-lg shadow-[#004b23]/30 flex items-center justify-center gap-2 active:scale-95 transition-all text-base"
            >
              পেমেন্ট পদ্ধতিতে যান <ChevronRight className="w-5 h-5 stroke-[3]" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. STEP 4: পেমেন্ট পদ্ধতি নির্বাচন (PAYMENT METHOD) */}
      {/* ========================================================================= */}
      {currentStep === 4 && (
        <div className="space-y-3 px-3 sm:px-4 pt-3 pb-32">
          <div className="pb-0.5">
            <h2 className="text-sm sm:text-base font-black text-gray-900 flex items-center gap-1.5">
              <CreditCard className="w-4 sm:w-5 h-4 sm:h-5 text-[#004b23]" /> পেমেন্ট পদ্ধতি
            </h2>
            <p className="text-[10px] sm:text-xs text-gray-500 font-medium">মূল্য পরিশোধের মাধ্যম বেছে নিন</p>
          </div>

          {/* Methods */}
          <div className="space-y-2">
            {/* 2. bKash */}
            <div
              onClick={() => setPaymentMethod("bkash")}
              className={`p-3 sm:p-4 rounded-[18px] sm:rounded-[22px] border-2 transition-all cursor-pointer bg-white relative overflow-hidden ${
                paymentMethod === "bkash" 
                  ? "border-[#e2136e] shadow-sm bg-[#e2136e]/5" 
                  : "border-gray-100 hover:border-[#e2136e]/30"
              }`}
            >
              {paymentMethod === "bkash" && <div className="absolute top-0 right-0 w-16 h-16 bg-[#e2136e]/10 rounded-bl-[100px] -z-10" />}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 sm:gap-4">
                  <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-xl sm:rounded-2xl bg-[#e2136e] flex items-center justify-center text-white shrink-0 font-black text-sm sm:text-base shadow-md">
                    বিকাশ
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-gray-900 leading-none">bKash (বিকাশ)</h3>
                    <p className="text-[11px] sm:text-xs font-black text-[#e2136e] mt-1.5 tracking-wide font-mono bg-[#e2136e]/10 inline-block px-2 py-0.5 rounded-md">01618599077</p>
                  </div>
                </div>
                <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                  paymentMethod === "bkash" ? "border-[#e2136e] bg-[#e2136e]" : "border-gray-200 bg-gray-50"
                }`}>
                  {paymentMethod === "bkash" && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                </div>
              </div>
            </div>

            {/* 3. Nagad */}
            <div
              onClick={() => setPaymentMethod("nagad")}
              className={`p-3 sm:p-4 rounded-[18px] sm:rounded-[22px] border-2 transition-all cursor-pointer bg-white relative overflow-hidden ${
                paymentMethod === "nagad" 
                  ? "border-[#ed1c24] shadow-sm bg-[#ed1c24]/5" 
                  : "border-gray-100 hover:border-[#ed1c24]/30"
              }`}
            >
              {paymentMethod === "nagad" && <div className="absolute top-0 right-0 w-16 h-16 bg-[#ed1c24]/10 rounded-bl-[100px] -z-10" />}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 sm:gap-4">
                  <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#ed1c24] to-[#f7941d] flex items-center justify-center text-white shrink-0 font-black text-sm sm:text-base shadow-md">
                    নগদ
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-gray-900 leading-none">Nagad (নগদ)</h3>
                    <p className="text-[11px] sm:text-xs font-black text-[#ed1c24] mt-1.5 tracking-wide font-mono bg-[#ed1c24]/10 inline-block px-2 py-0.5 rounded-md">01624228476</p>
                  </div>
                </div>
                <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                  paymentMethod === "nagad" ? "border-[#ed1c24] bg-[#ed1c24]" : "border-gray-200 bg-gray-50"
                }`}>
                  {paymentMethod === "nagad" && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                </div>
              </div>
            </div>

            {/* 4. Rocket */}
            <div
              onClick={() => setPaymentMethod("rocket")}
              className={`p-3 sm:p-4 rounded-[18px] sm:rounded-[22px] border-2 transition-all cursor-pointer bg-white relative overflow-hidden ${
                paymentMethod === "rocket" 
                  ? "border-[#8c3494] shadow-sm bg-[#8c3494]/5" 
                  : "border-gray-100 hover:border-[#8c3494]/30"
              }`}
            >
              {paymentMethod === "rocket" && <div className="absolute top-0 right-0 w-16 h-16 bg-[#8c3494]/10 rounded-bl-[100px] -z-10" />}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 sm:gap-4">
                  <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-xl sm:rounded-2xl bg-[#8c3494] flex items-center justify-center text-white shrink-0 font-black text-sm sm:text-base shadow-md">
                    রকেট
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-gray-900 leading-none">Rocket (রকেট)</h3>
                    <p className="text-[11px] sm:text-xs font-black text-[#8c3494] mt-1.5 tracking-wide font-mono bg-[#8c3494]/10 inline-block px-2 py-0.5 rounded-md">01624228476</p>
                  </div>
                </div>
                <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                  paymentMethod === "rocket" ? "border-[#8c3494] bg-[#8c3494]" : "border-gray-200 bg-gray-50"
                }`}>
                  {paymentMethod === "rocket" && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                </div>
              </div>
            </div>

            {/* 5. Upay */}
            <div
              onClick={() => setPaymentMethod("upay")}
              className={`p-3 sm:p-4 rounded-[18px] sm:rounded-[22px] border-2 transition-all cursor-pointer bg-white relative overflow-hidden ${
                paymentMethod === "upay" 
                  ? "border-[#1372b6] shadow-sm bg-[#1372b6]/5" 
                  : "border-gray-100 hover:border-[#1372b6]/30"
              }`}
            >
              {paymentMethod === "upay" && <div className="absolute top-0 right-0 w-16 h-16 bg-[#1372b6]/10 rounded-bl-[100px] -z-10" />}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 sm:gap-4">
                  <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#1372b6] to-[#fdb913] flex items-center justify-center text-white shrink-0 font-black text-sm sm:text-base shadow-md">
                    উপায়
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-gray-900 leading-none">Upay (উপায়)</h3>
                    <p className="text-[11px] sm:text-xs font-black text-[#1372b6] mt-1.5 tracking-wide font-mono bg-[#1372b6]/10 inline-block px-2 py-0.5 rounded-md">01618599077</p>
                  </div>
                </div>
                <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                  paymentMethod === "upay" ? "border-[#1372b6] bg-[#1372b6]" : "border-gray-200 bg-gray-50"
                }`}>
                  {paymentMethod === "upay" && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                </div>
              </div>
            </div>

            {/* 6. CellFin */}
            <div
              onClick={() => setPaymentMethod("cellfin")}
              className={`p-3 sm:p-4 rounded-[18px] sm:rounded-[22px] border-2 transition-all cursor-pointer bg-white relative overflow-hidden ${
                paymentMethod === "cellfin" 
                  ? "border-[#007f4f] shadow-sm bg-[#007f4f]/5" 
                  : "border-gray-100 hover:border-[#007f4f]/30"
              }`}
            >
              {paymentMethod === "cellfin" && <div className="absolute top-0 right-0 w-16 h-16 bg-[#007f4f]/10 rounded-bl-[100px] -z-10" />}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 sm:gap-4">
                  <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-xl sm:rounded-2xl bg-[#007f4f] flex items-center justify-center text-white shrink-0 font-black text-[11px] sm:text-[13px] shadow-md tracking-tighter">
                    CellFin
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-gray-900 leading-none">CellFin (সেলফিন)</h3>
                    <p className="text-[11px] sm:text-xs font-black text-[#007f4f] mt-1.5 tracking-wide font-mono bg-[#007f4f]/10 inline-block px-2 py-0.5 rounded-md">01624228476</p>
                  </div>
                </div>
                <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                  paymentMethod === "cellfin" ? "border-[#007f4f] bg-[#007f4f]" : "border-gray-200 bg-gray-50"
                }`}>
                  {paymentMethod === "cellfin" && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                </div>
              </div>
            </div>

            {/* 7. Cash on Delivery (COD) */}
            <div
              onClick={() => setPaymentMethod("cod")}
              className={`p-3 sm:p-4 rounded-[18px] sm:rounded-[22px] border-2 transition-all cursor-pointer bg-white relative overflow-hidden ${
                paymentMethod === "cod" 
                  ? "border-emerald-500 shadow-sm bg-emerald-50" 
                  : "border-gray-100 hover:border-emerald-500/30"
              }`}
            >
              {paymentMethod === "cod" && <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-bl-[100px] -z-10" />}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 sm:gap-4">
                  <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-md">
                    <Truck className="w-5 sm:w-6 h-5 sm:h-6" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-gray-900 leading-none">ক্যাশ অন ডেলিভারি</h3>
                    <p className="text-[10px] sm:text-[11px] font-bold text-gray-500 mt-1.5 tracking-wide">হাতে পেয়ে টাকা পরিশোধ করুন</p>
                  </div>
                </div>
                <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                  paymentMethod === "cod" ? "border-emerald-500 bg-emerald-500" : "border-gray-200 bg-gray-50"
                }`}>
                  {paymentMethod === "cod" && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Action */}
          <div className="fixed bottom-0 left-0 right-0 p-3 sm:p-4 bg-white/95 backdrop-blur-md border-t border-gray-100 z-50">
            <button
              onClick={() => setCurrentStep(5)}
              className="w-full bg-[#004b23] text-white font-black py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-lg shadow-[#004b23]/20 flex items-center justify-center gap-2 active:scale-95 transition-all text-sm sm:text-base"
            >
              অর্ডার চূড়ান্ত পর্যালোচনা করুন <ChevronRight className="w-5 h-5 stroke-[3]" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. STEP 5: অর্ডার নিশ্চিত করুন (FINAL ORDER REVIEW - NO PIN) */}
      {/* ========================================================================= */}
      {currentStep === 5 && (
        <div className="space-y-3 px-3 sm:px-4 pt-3 pb-32">
          <div className="pb-0.5">
            <h2 className="text-sm sm:text-base font-black text-gray-900 flex items-center gap-1.5">
              <CheckSquare className="w-4 sm:w-5 h-4 sm:h-5 text-[#004b23]" /> অর্ডারের চূড়ান্ত পর্যালোচনা
            </h2>
            <p className="text-[10px] sm:text-xs text-gray-500 font-medium">সব তথ্য দেখে এক ক্লিকে অর্ডার নিশ্চিত করুন</p>
          </div>

          {/* Product Items Breakdown */}
          <div className="bg-white rounded-[20px] sm:rounded-[24px] p-3 sm:p-4 border border-gray-100 shadow-xs space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-gray-50">
              <h3 className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-wider">পণ্য বিবরণী:</h3>
              <button 
                onClick={() => setCurrentStep(1)} 
                className="text-[10px] sm:text-xs font-black text-[#004b23] bg-emerald-50 px-2 py-0.5 rounded-lg"
              >
                পণ্য পরিবর্তন
              </button>
            </div>

            <div className="divide-y divide-gray-50">
              {orderItems.map(item => (
                <div key={item.id} className="py-2 flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <span className="font-black text-gray-900 block text-xs sm:text-[13px] leading-tight truncate">{item.nameBn}</span>
                    
                    {(categoryName === "কাপড় ও পরিধান" || categoryName.includes("কাপড়") || categoryName.includes("ফ্যাশন") || item.category === "cat3") && (item.selectedSize || item.selectedColor) && (
                      <div className="flex items-center gap-1.5 mt-0.5 mb-0.5">
                        {item.selectedSize && <span className="text-[9px] font-black text-white bg-gray-800 px-1.5 py-[1px] rounded uppercase">{item.selectedSize}</span>}
                        {item.selectedColor && <span className="text-[9px] font-black text-gray-600 bg-gray-100 px-1.5 py-[1px] rounded uppercase">{item.selectedColor}</span>}
                      </div>
                    )}

                    <span className="text-[10px] sm:text-xs text-gray-500 font-bold">
                      {item.quantity} {item.unit} × ৳{item.pricePerUnit}
                    </span>
                  </div>
                  <span className="font-black text-gray-900 text-xs sm:text-sm shrink-0">
                    = ৳{(item.quantity * item.pricePerUnit || 0).toLocaleString('bn-BD')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Address Summary */}
          <div className="bg-white rounded-[20px] sm:rounded-[24px] p-3 sm:p-4 border border-gray-100 shadow-xs space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-gray-50">
              <h3 className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-[#004b23]" /> ডেলিভারি ঠিকানা
              </h3>
              <button 
                onClick={() => setCurrentStep(2)} 
                className="text-[10px] sm:text-xs font-black text-[#004b23] bg-emerald-50 px-2 py-0.5 rounded-lg"
              >
                ঠিকানা পরিবর্তন
              </button>
            </div>
            
            <div className="text-xs space-y-1.5">
              <div className="flex items-start gap-2">
                <span className="font-black text-gray-400 shrink-0">নাম:</span>
                <span className="font-bold text-gray-900">{activeAddress.name}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-black text-gray-400 shrink-0">মোবাইল:</span>
                <span className="font-bold text-gray-900">{activeAddress.phone}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-black text-gray-400 shrink-0">ঠিকানা:</span>
                <span className="font-medium text-gray-600 leading-tight">{activeAddress.fullAddress}</span>
              </div>
              {activeAddress.extra && (
                <div className="flex items-start gap-2 pt-1 border-t border-gray-50 mt-1">
                  <span className="font-black text-gray-400 shrink-0 italic">নির্দেশনা:</span>
                  <span className="font-medium text-gray-500 italic leading-tight">{activeAddress.extra}</span>
                </div>
              )}
            </div>
          </div>

          {/* Delivery & Payment Method Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-[20px] p-3 border border-gray-100 shadow-xs space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-gray-400 uppercase">ডেলিভারি</span>
                <button onClick={() => setCurrentStep(3)} className="text-[10px] font-bold text-[#004b23]">পরিবর্তন</button>
              </div>
              <p className="text-xs font-black text-gray-900 truncate">
                {deliveryMethod === "home" ? "হোম ডেলিভারি" : "দোকান / পিকআপ"}
              </p>
              <p className="text-[10px] text-gray-500">চার্জ: ৳{deliveryCharge}</p>
            </div>

            <div className="bg-white rounded-[20px] p-3 border border-gray-100 shadow-xs space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-gray-400 uppercase">পেমেন্ট</span>
                <button onClick={() => setCurrentStep(4)} className="text-[10px] font-bold text-[#004b23]">পরিবর্তন</button>
              </div>
              <p className="text-xs font-black text-gray-900 truncate">
                {paymentMethod === "cod" ? "Cash on Delivery" : paymentMethod.toUpperCase()}
              </p>
              <p className="text-[10px] text-green-700 font-bold">{paymentMethod === "cod" ? "ক্যাশ" : "অনলাইন / অটো"}</p>
            </div>
          </div>

          {/* Total Calculation */}
          <div className="bg-white rounded-[24px] p-4 border border-gray-100 shadow-sm space-y-2.5">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-wider">মোট হিসাব:</h3>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">পণ্যের মূল্য:</span>
              <span className="font-bold text-gray-900">৳{(totalItemPrice || 0).toLocaleString('bn-BD')}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">ডেলিভারি চার্জ:</span>
              <span className="font-bold text-gray-900">৳{(deliveryCharge || 0).toLocaleString('bn-BD')}</span>
            </div>
            <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
              <span className="text-sm font-black text-gray-900">সর্বমোট প্রদেয়:</span>
              <span className="text-xl font-black text-[#004b23]">৳{(grandTotal || 0).toLocaleString('bn-BD')}</span>
            </div>
          </div>

          {/* Payment Verification Form (If Not COD) */}
          {(paymentMethod !== "cod") && (
            <div className="bg-[#fff9e6] rounded-[24px] p-5 border-2 border-[#ffb703]/30 shadow-sm space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#ffb703]/20 flex items-center justify-center text-[#d97706] shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900">পেমেন্ট ভেরিফিকেশন</h3>
                  <p className="text-[11px] font-bold text-gray-600 mt-0.5 leading-snug">
                    অনুগ্রহ করে উপরে দেওয়া নাম্বারে <span className="font-black text-[#d97706]">৳{(grandTotal || 0).toLocaleString('bn-BD')}</span> সেন্ট মানি (Send Money) করে নিচের তথ্যগুলো পূরণ করুন।
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">যে নাম্বার থেকে টাকা পাঠিয়েছেন:</label>
                  <input
                    type="tel"
                    value={senderNumber}
                    onChange={(e) => setSenderNumber(e.target.value)}
                    placeholder="যেমন: 017XXXXXXX"
                    className="w-full px-4 py-3 bg-white border border-[#ffb703]/50 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#ffb703] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">ট্রানজেকশন আইডি (TrxID):</label>
                  <input
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="যেমন: 8HG9J4KM"
                    className="w-full px-4 py-3 bg-white border border-[#ffb703]/50 rounded-xl text-sm font-bold text-gray-900 uppercase focus:outline-none focus:ring-2 focus:ring-[#ffb703] transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Verification Checkbox */}
          <label className="flex items-start gap-3 p-3.5 bg-white rounded-2xl border border-gray-200 cursor-pointer shadow-sm">
            <input
              type="checkbox"
              checked={isAgreed}
              onChange={(e) => setIsAgreed(e.target.checked)}
              className="w-5 h-5 mt-0.5 accent-[#004b23] rounded"
            />
            <span className="text-xs font-bold text-gray-800 leading-snug">
              ☑️ আমি পণ্যের তথ্য, ঠিকানা ও মোট মূল্য যাচাই করেছি।
            </span>
          </label>

          {/* Important Security Notice: No PIN requested */}
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-xs font-bold text-emerald-900 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>অর্ডার করার সময় কোনো Security PIN প্রয়োজন হবে না।</span>
          </div>

          {/* Bottom Action Confirm */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-gray-200 z-50">
            <button
              onClick={handleConfirmOrder}
              disabled={isSubmitting}
              className="w-full bg-[#004b23] hover:bg-[#00381a] text-white font-black py-4 rounded-2xl shadow-xl shadow-[#004b23]/30 flex items-center justify-center gap-2 active:scale-95 transition-all text-base"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  অর্ডার প্রসেস হচ্ছে...
                </span>
              ) : (
                <span>৳{(grandTotal || 0).toLocaleString('bn-BD')} দিয়ে অর্ডার নিশ্চিত করুন</span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. STEP 6: অর্ডার সফল (ORDER SUCCESS SCREEN) */}
      {/* ========================================================================= */}
      {currentStep === 6 && placedOrder && (
        <div className="px-4 pt-10 pb-16 space-y-6 text-center">
          {/* Animated Celebration Icon */}
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto shadow-xl ring-8 ring-green-50"
          >
            <CheckCircle2 className="w-14 h-14 text-[#004b23]" />
          </motion.div>

          <div>
            <h1 className="text-2xl font-black text-gray-900">✅ অর্ডার সফল হয়েছে</h1>
            <p className="text-xs font-bold text-gray-500 mt-1 max-w-xs mx-auto">
              “আপনার অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে। দ্রুততম সময়ে খাদ্য সামগ্রী আপনার কাছে পৌঁছে দেওয়া হবে।”
            </p>
          </div>

          {/* Order Info Card */}
          <div className="bg-white rounded-[28px] p-5 border border-gray-100 shadow-md text-left space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <span className="text-xs font-bold text-gray-400 uppercase">Order ID:</span>
              <span className="text-sm font-black text-[#004b23] bg-[#004b23]/10 px-3 py-1 rounded-full font-mono">
                #{placedOrder.orderId}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">মোট অর্ডার মূল্য:</span>
                <span className="font-black text-gray-900 text-sm">৳{(placedOrder.grandTotal || 0).toLocaleString('bn-BD')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">পেমেন্ট পদ্ধতি:</span>
                <span className="font-bold text-gray-900">{placedOrder.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">ডেলিভারি পদ্ধতি:</span>
                <span className="font-bold text-gray-900">{placedOrder.deliveryMethod}</span>
              </div>
              <div className="pt-2 border-t border-gray-50">
                <span className="text-gray-500 block mb-0.5">ডেলিভারি ঠিকানা:</span>
                <span className="font-semibold text-gray-800 leading-tight block">
                  {placedOrder.shippingAddress?.fullAddress}
                </span>
              </div>
            </div>
          </div>

          {/* Two Action Buttons */}
          <div className="space-y-3 pt-2">
            <button
              onClick={() => setCurrentStep(7)}
              className="w-full bg-[#004b23] text-white font-black py-4 rounded-2xl shadow-lg shadow-[#004b23]/30 flex items-center justify-center gap-2 active:scale-95 transition-all text-sm"
            >
              <Clock className="w-4 h-4" /> অর্ডার ট্র্যাক করুন
            </button>

            <button
              onClick={() => navigate("/")}
              className="w-full bg-white text-[#004b23] border-2 border-[#004b23] font-black py-3.5 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all text-sm"
            >
              হোম পেইজে ফিরে যান
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. STEP 7: অর্ডার ট্র্যাকিং (LIVE ORDER TRACKING) */}
      {/* ========================================================================= */}
      {currentStep === 7 && (
        <div className="space-y-4 px-4 pt-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-gray-200">
            <button 
              onClick={() => {
                if (paramOrderId) navigate("/");
                else setCurrentStep(6);
              }} 
              className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-gray-200 shadow-sm active:scale-95"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div className="text-center">
              <h1 className="text-base font-black text-gray-900 font-mono">
                📦 #{placedOrder?.orderId || "BNB-20260831-7892"}
              </h1>
              <span className="text-xs font-bold text-gray-500">লাইভ ট্র্যাকিং টাইমলাইন</span>
            </div>
            <button 
              onClick={() => navigate("/")}
              className="text-xs font-black text-[#004b23]"
            >
              বাজার
            </button>
          </div>

          {/* Current Status Banner */}
          <div className="bg-white rounded-[24px] p-4 border border-gray-100 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-800">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase">বর্তমান অবস্থা:</span>
                <h3 className="text-sm font-black text-gray-900">
                  {trackingStatusIndex === 1 && "🟢 অর্ডার গ্রহণ করা হয়েছে"}
                  {trackingStatusIndex === 2 && "🟢 অর্ডার নিশ্চিত হয়েছে"}
                  {trackingStatusIndex === 3 && "🟡 পণ্য প্রস্তুত করা হচ্ছে"}
                  {trackingStatusIndex === 4 && "🔵 ডেলিভারির জন্য প্রস্তুত"}
                  {trackingStatusIndex === 5 && "🚚 ডেলিভারিতে বের হয়েছে"}
                  {trackingStatusIndex === 6 && "✅ ডেলিভারি সম্পন্ন"}
                </h3>
              </div>
            </div>

            {/* Test Simulator */}
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-bold text-gray-400 mb-1">স্ট্যাটাস টেস্ট:</span>
              <select
                value={trackingStatusIndex}
                onChange={(e) => setTrackingStatusIndex(Number(e.target.value))}
                className="text-[10px] font-black bg-gray-100 text-gray-800 p-1.5 rounded-lg border border-gray-200"
              >
                <option value={1}>১. অর্ডার গ্রহণ</option>
                <option value={2}>২. নিশ্চিত</option>
                <option value={3}>৩. প্রস্তুত হচ্ছে</option>
                <option value={4}>৪. প্রস্তুত</option>
                <option value={5}>৫. ডেলিভারিতে বের হয়েছে</option>
                <option value={6}>৬. সম্পন্ন</option>
              </select>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-[28px] p-5 border border-gray-100 shadow-sm space-y-6">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider">ডেলিভারি অগ্রগতি:</h3>
            
            <div className="space-y-0 relative pl-2">
              {trackingTimeline.map((step, idx) => {
                const isPassed = step.done;
                const isCurrent = step.isCurrent;

                return (
                  <div key={step.id} className="flex gap-4 relative pb-6 last:pb-0">
                    {idx !== trackingTimeline.length - 1 && (
                      <div className={`absolute left-[11px] top-6 bottom-0 w-0.5 ${
                        trackingTimeline[idx + 1].done ? "bg-[#004b23]" : "bg-gray-200"
                      }`} />
                    )}

                    <div className="z-10 bg-white py-0.5">
                      {isPassed && !isCurrent ? (
                        <div className="w-6 h-6 rounded-full bg-[#004b23] text-white flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      ) : isCurrent ? (
                        <div className="w-6 h-6 rounded-full border-4 border-[#ffb703] bg-white flex items-center justify-center animate-pulse">
                          <div className="w-2 h-2 rounded-full bg-[#ffb703]"></div>
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                        </div>
                      )}
                    </div>

                    <div>
                      <h4 className={`text-sm font-black ${
                        isCurrent ? "text-[#004b23]" : isPassed ? "text-gray-900" : "text-gray-400"
                      }`}>
                        {step.title} {isCurrent && <span className="text-[10px] text-[#ffb703] bg-amber-50 px-2 py-0.5 rounded-full font-bold ml-1">বর্তমানে</span>}
                      </h4>
                      <p className="text-[11px] text-gray-500 font-medium">{step.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Conditional Sub-View: Out for Delivery (Step 5) */}
          {trackingStatusIndex === 5 && (
            <div className="bg-gradient-to-br from-[#004b23] to-[#006e33] text-white rounded-[28px] p-5 shadow-lg space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white shrink-0">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black">🚚 আপনার অর্ডার পথে আছে</h3>
                  <p className="text-xs text-white/80 mt-0.5">
                    আনুমানিক পৌঁছানোর সময়: {placedOrder?.estimatedArrival || "আজ 7:00 PM – 8:00 PM"}
                  </p>
                </div>
              </div>

              {/* Rider Info */}
              <div className="bg-white/10 rounded-2xl p-3.5 border border-white/20 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[#ffb703] block uppercase">ডেলিভারি প্রতিনিধি:</span>
                  <h4 className="text-sm font-black text-white">
                    {placedOrder?.rider?.name || "মোঃ রাকিবুল হাসান"}
                  </h4>
                </div>

                <a
                  href={`tel:${placedOrder?.rider?.phone || "01823456789"}`}
                  className="bg-[#ffb703] text-black px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 active:scale-95 shadow"
                >
                  <Phone className="w-3.5 h-3.5" /> কল করুন
                </a>
              </div>
            </div>
          )}

          {/* Conditional Sub-View: Delivery Completed (Step 6) + Review Card */}
          {trackingStatusIndex === 6 && (
            <div className="bg-white rounded-[28px] p-5 border border-gray-100 shadow-md space-y-4">
              <div className="text-center pb-2 border-b border-gray-100">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2 text-[#004b23]">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-base font-black text-gray-900">✅ অর্ডার ডেলিভারি সম্পন্ন</h3>
                <p className="text-xs font-bold text-gray-500">পণ্য পেয়েছেন?</p>
              </div>

              {reviewSubmitted ? (
                <div className="p-4 bg-emerald-50 rounded-2xl text-center text-xs font-bold text-emerald-900">
                  🎉 আপনার মূল্যবান মতামতের জন্য ধন্যবাদ! আমরা সবসময় আপনার সেবায় প্রস্তুত।
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-center">
                    <p className="text-xs font-bold text-gray-700 mb-2">আপনার অভিজ্ঞতা কেমন ছিল?</p>
                    <div className="flex items-center justify-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setUserRating(star)}
                          className="p-1 hover:scale-125 transition-transform"
                        >
                          <Star 
                            className={`w-7 h-7 ${
                              star <= userRating 
                                ? "fill-[#ffb703] text-[#ffb703]" 
                                : "text-gray-300"
                            }`} 
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <textarea
                      rows={2}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="মন্তব্য লিখুন (ঐচ্ছিক)"
                      className="w-full text-xs p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#004b23]"
                    />
                  </div>

                  <button
                    onClick={handleSubmitReview}
                    className="w-full bg-[#004b23] text-white font-black py-3 rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 shadow-md"
                  >
                    রিভিউ দিন
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Ordered Products summary box */}
          {placedOrder && (
            <div className="bg-white rounded-[24px] p-4 border border-gray-100 shadow-sm space-y-2">
              <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider">অর্ডারের পণ্যসমূহ:</h4>
              <div className="space-y-2">
                {placedOrder.items?.map((it: any, i: number) => (
                  <div key={i} className="flex justify-between items-center text-xs">
                    <span className="font-bold text-gray-800">{it.nameBn} ({it.quantity} {it.unit})</span>
                    <span className="font-black text-gray-900">৳{it.total}</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-gray-100 flex justify-between font-black text-sm text-[#004b23]">
                  <span>সর্বমোট পরিশোধিত:</span>
                  <span>৳{placedOrder.grandTotal}</span>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
