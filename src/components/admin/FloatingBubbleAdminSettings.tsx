import React, { useState, useEffect, useMemo } from "react";
import { 
  Radio, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Vibrate, 
  Clock, 
  Truck, 
  Package, 
  CheckCircle2, 
  Save, 
  Play, 
  RefreshCw, 
  Info,
  ShieldCheck,
  Smartphone,
  Send,
  User,
  Phone,
  PhoneCall,
  MessageCircle,
  MapPin,
  Search,
  Target,
  Sliders,
  ChevronRight,
  AlertCircle
} from "lucide-react";
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  updateDoc 
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { 
  DEFAULT_BUBBLE_CONFIG, 
  FloatingBubbleConfig, 
  playInAppBubbleChime, 
  triggerInAppVibration,
  getOrderStatusInfo 
} from "../../lib/floatingBubbleService";

interface TargetRecipient {
  id: string;
  type: "order" | "user";
  orderNumber?: string;
  customerName: string;
  customerPhone: string;
  shippingAddress?: any;
  items?: any[];
  userId?: string;
  status: string;
  trackingMessage?: string;
  currentLocation?: string;
  total?: number;
  grandTotal?: number;
  createdAt?: any;
  email?: string;
}

export const FloatingBubbleAdminSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"targeted-messenger" | "global-settings">("targeted-messenger");
  
  // Config state
  const [config, setConfig] = useState<FloatingBubbleConfig>(DEFAULT_BUBBLE_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Targeted Recipients (Orders only) state
  const [orders, setOrders] = useState<TargetRecipient[]>([]);
  const [recipientsLoading, setRecipientsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [directPhoneInput, setDirectPhoneInput] = useState("");
  const [selectedRecipient, setSelectedRecipient] = useState<TargetRecipient | null>(null);
  const [newStatus, setNewStatus] = useState<string>("processing");
  const [trackingMessageInput, setTrackingMessageInput] = useState<string>("");
  const [sendingUpdate, setSendingUpdate] = useState(false);
  const [sendSuccessMessage, setSendSuccessMessage] = useState<string | null>(null);

  // Test bubble custom status selector
  const [testStatus, setTestStatus] = useState<string>("shipped");

  // Fetch settings from Firestore
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const docRef = doc(db, "settings", "floating_bubble");
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setConfig({ ...DEFAULT_BUBBLE_CONFIG, ...snap.data() });
        }
      } catch (err) {
        console.error("Error loading floating bubble config:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  // Helper timestamp parser
  const getTs = (val: any) => {
    if (!val) return 0;
    if (typeof val === "number") return val;
    if (val.seconds) return val.seconds * 1000;
    if (val.toDate) return val.toDate().getTime();
    return new Date(val).getTime() || 0;
  };

  // 1. Realtime Active Orders listener for targeted messaging
  useEffect(() => {
    const qOrders = query(
      collection(db, "food_orders"),
      limit(60)
    );

    const unsubOrders = onSnapshot(qOrders, (snapshot) => {
      const list: TargetRecipient[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          type: "order",
          orderNumber: data.orderNumber || data.orderId || docSnap.id.slice(0, 8).toUpperCase(),
          customerName: data.customerName || data.name || data.shippingAddress?.name || data.shippingAddress?.fullName || "গ্রাহক",
          customerPhone: data.customerPhone || data.phone || data.rawPhone || data.shippingAddress?.phone || "ফোন নম্বর নেই",
          shippingAddress: data.shippingAddress || null,
          items: data.items || [],
          userId: data.userId || "anonymous",
          status: data.status || data.internalStatus || "pending",
          trackingMessage: data.trackingMessage || data.currentLocation || "",
          currentLocation: data.currentLocation || data.trackingMessage || "",
          total: data.total || data.grandTotal || 0,
          grandTotal: data.grandTotal || data.total || 0,
          createdAt: data.createdAt
        };
      });

      list.sort((a, b) => getTs(b.createdAt) - getTs(a.createdAt));
      setOrders(list);
      setRecipientsLoading(false);
    }, (err) => {
      console.warn("Orders snapshot error:", err);
      setRecipientsLoading(false);
    });

    return () => {
      unsubOrders();
    };
  }, []);

  // Filtered orders list (only customers who have placed orders)
  const combinedRecipients = useMemo(() => {
    if (!searchTerm.trim()) return orders;
    const term = searchTerm.toLowerCase().trim();
    return orders.filter((r) => 
      r.customerPhone?.toLowerCase().includes(term) ||
      r.customerName?.toLowerCase().includes(term) ||
      r.orderNumber?.toLowerCase().includes(term) ||
      r.userId?.toLowerCase().includes(term) ||
      r.shippingAddress?.district?.toLowerCase().includes(term) ||
      r.shippingAddress?.upazila?.toLowerCase().includes(term)
    );
  }, [orders, searchTerm]);

  // Auto-select first recipient if none selected
  useEffect(() => {
    if (!selectedRecipient && combinedRecipients.length > 0) {
      const first = combinedRecipients[0];
      if (first) {
        setSelectedRecipient(first);
        setNewStatus(first.status === "সক্রিয় একাউন্ট" ? "processing" : (first.status || "processing"));
        setTrackingMessageInput(first.trackingMessage || first.currentLocation || "");
      }
    }
  }, [combinedRecipients, selectedRecipient]);

  // Save global settings to Firestore
  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const docRef = doc(db, "settings", "floating_bubble");
      await setDoc(docRef, { ...config, updatedAt: Date.now() }, { merge: true });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err) {
      console.error("Error saving floating bubble settings:", err);
      alert("সেটিংস সংরক্ষণ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setSaving(false);
    }
  };

  // Helper to build direct WhatsApp URL for sending live location
  const getWhatsAppUrl = (phone: string, rec: TargetRecipient, message: string) => {
    let cleanPhone = phone.replace(/[^\d+]/g, "");
    if (cleanPhone.startsWith("0")) {
      cleanPhone = "88" + cleanPhone;
    } else if (!cleanPhone.startsWith("+") && !cleanPhone.startsWith("88")) {
      cleanPhone = "88" + cleanPhone;
    }
    const targetDesc = rec.type === "order" ? `অর্ডার #${rec.orderNumber}` : `আপনার একাউন্ট`;
    const text = encodeURIComponent(
      `আসসালামু আলাইকুম ${rec.customerName || "সম্মানিত গ্রাহক"}, অল মায়াদিন বাজার থেকে ${targetDesc}-এর লাইভ লোকেশন আপডেট:\n\n` +
      `📍 বর্তমান অবস্থান: ${message || "অর্ডার প্রক্রিয়াকরণ চলছে"}\n` +
      `📦 স্ট্যাটাস: ${newStatus || rec.status}\n\n` +
      `যেকোনো প্রয়োজনে আমাদের সাথে যোগাযোগ করুন। ধন্যবাদ!`
    );
    return `https://wa.me/${cleanPhone.replace("+", "")}?text=${text}`;
  };

  // Select recipient for targeted update
  const handleSelectRecipient = (rec: TargetRecipient) => {
    if (!rec) return;
    setSelectedRecipient(rec);
    setNewStatus(rec.status === "সক্রিয় একাউন্ট" ? "processing" : (rec.status || "processing"));
    setTrackingMessageInput(rec.trackingMessage || rec.currentLocation || "");
    setSendSuccessMessage(null);

    // Smooth scroll on mobile to make form immediately visible
    setTimeout(() => {
      document.getElementById("target-message-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  // Handle direct custom phone number selection
  const handleDirectPhoneSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const phone = directPhoneInput.trim();
    if (!phone) return;

    // Check if phone matches an existing order
    const match = orders.find(
      (r) => r.customerPhone.replace(/[^\d]/g, "") === phone.replace(/[^\d]/g, "")
    );

    if (match) {
      handleSelectRecipient(match);
    } else {
      const customRecipient: TargetRecipient = {
        id: "custom_" + phone,
        type: "user",
        orderNumber: "সরাসরি নম্বর",
        customerName: "মোবাইল গ্রাহক",
        customerPhone: phone,
        userId: "custom_" + phone,
        status: "processing",
        trackingMessage: "",
        currentLocation: "",
        createdAt: Date.now()
      };
      handleSelectRecipient(customRecipient);
    }
    setDirectPhoneInput("");
  };

  // Send Targeted Live Location / Status to Specific Recipient (Order or User)
  const handleSendTargetedUpdate = async () => {
    if (!selectedRecipient) return;
    setSendingUpdate(true);
    setSendSuccessMessage(null);

    try {
      const updatePayload: any = {
        status: newStatus || selectedRecipient.status,
        trackingMessage: trackingMessageInput.trim(),
        currentLocation: trackingMessageInput.trim(),
        updatedAt: Date.now()
      };

      // 1. If it's an order, update food_orders document
      if (selectedRecipient.type === "order") {
        await updateDoc(doc(db, "food_orders", selectedRecipient.id), updatePayload);
      }

      // 2. Also save to user_bubbles so ANY user (even newly registered with no orders) receives the bubble!
      const bubblePayload = {
        recipientId: selectedRecipient.id,
        type: selectedRecipient.type,
        userId: selectedRecipient.userId || selectedRecipient.id,
        phoneNumber: selectedRecipient.customerPhone,
        customerName: selectedRecipient.customerName,
        status: newStatus || selectedRecipient.status || "processing",
        trackingMessage: trackingMessageInput.trim(),
        currentLocation: trackingMessageInput.trim(),
        orderNumber: selectedRecipient.orderNumber || (selectedRecipient.type === "user" ? "একাউন্ট বাবল" : "লাইভ নোটিফিকেশন"),
        updatedAt: Date.now(),
        createdAt: Date.now(),
        active: true
      };

      // Target by userId
      if (selectedRecipient.userId && selectedRecipient.userId !== "anonymous") {
        await setDoc(doc(db, "user_bubbles", selectedRecipient.userId), bubblePayload, { merge: true });
      }

      // Target by phone number
      if (selectedRecipient.customerPhone && selectedRecipient.customerPhone !== "ফোন নম্বর নেই") {
        const cleanP = selectedRecipient.customerPhone.replace(/[^\d]/g, "");
        if (cleanP) {
          await setDoc(doc(db, "user_bubbles", cleanP), bubblePayload, { merge: true });
        }
      }

      setSendSuccessMessage(
        `${selectedRecipient.customerName} (${selectedRecipient.customerPhone})-এর ডিভাইসে লাইভ বাবল বার্তা সফলভাবে পৌঁছে দেওয়া হয়েছে!`
      );

      // Trigger chime test
      if (config.soundEnabled) playInAppBubbleChime();

      setTimeout(() => setSendSuccessMessage(null), 6000);
    } catch (err) {
      console.error("Error sending targeted bubble message:", err);
      alert("মেসেজ পাঠাতে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।");
    } finally {
      setSendingUpdate(false);
    }
  };

  // Launch live demo bubble right on Admin screen
  const handleTriggerDemo = () => {
    const demoPayload = {
      id: "demo-" + Math.floor(Math.random() * 10000),
      orderNumber: "ORD-" + Math.floor(1000 + Math.random() * 9000),
      status: testStatus,
      trackingMessage: "রাইডার বনানী মোড়ে অতিক্রম করেছে 🛵",
      total: 890,
      itemsCount: 2,
      updatedAt: Date.now()
    };
    window.dispatchEvent(
      new CustomEvent("trigger-floating-bubble-demo", { detail: demoPayload })
    );
  };

  // Filtered orders list by search query
  const filteredOrders = orders.filter((o) => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      (o.orderNumber || "").toLowerCase().includes(q) ||
      (o.customerName || "").toLowerCase().includes(q) ||
      (o.customerPhone || "").toLowerCase().includes(q) ||
      (o.status || "").toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
        <RefreshCw className="w-8 h-8 text-[#004b23] animate-spin mb-3" />
        <p className="text-xs font-bold text-gray-400">ফ্লোটিং বাবল সেটিংস লোড হচ্ছে...</p>
      </div>
    );
  }

  const currentPreviewStatus = getOrderStatusInfo(testStatus);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#004b23] to-[#003618] rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-xs font-bold text-emerald-300">
              <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-300" />
              <span>টার্গেটেড ইন-অ্যাপ ফ্লোটিং বাবল</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              অর্ডার ট্র্যাকিং ও লাইভ লোকেশন মেসেঞ্জার
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/80 max-w-xl">
              নির্দিষ্ট গ্রাহকের অর্ডারে কিংবা সরাসরি যেকোনো নিবন্ধিত একাউন্টের (মোবাইল নম্বর) অ্যাপের ফ্লোটিং বাবলে লাইভ লোকেশন বা মেসেজ পাঠান।
            </p>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === "global-settings" && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white text-[#004b23] hover:bg-emerald-50 font-black text-xs shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {saving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{saving ? "সংরক্ষণ হচ্ছে..." : "সেভ করুন"}</span>
              </button>
            )}
          </div>
        </div>

        {saveSuccess && (
          <div className="mt-4 p-3 bg-emerald-500/30 border border-emerald-400/40 rounded-2xl flex items-center gap-2 text-xs font-bold text-emerald-200 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>ফ্লোটিং বাবল সেটিংস সফলভাবে ক্লাউড ডাটাবেসে সেভ হয়েছে!</span>
          </div>
        )}
      </div>

      {/* Mode Sub-Tabs */}
      <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-2xl">
        <button
          onClick={() => setActiveTab("targeted-messenger")}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === "targeted-messenger"
              ? "bg-white text-[#004b23] shadow-xs"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Target className="w-4 h-4 text-emerald-600" />
          <span>🎯 নির্দিষ্ট গ্রাহক বা অর্ডারে বাবল পাঠান</span>
        </button>

        <button
          onClick={() => setActiveTab("global-settings")}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === "global-settings"
              ? "bg-white text-[#004b23] shadow-xs"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Sliders className="w-4 h-4 text-emerald-600" />
          <span>⚙️ গ্লোবাল বাবল কনফিগারেশন</span>
        </button>
      </div>

      {/* TAB 1: TARGETED LIVE MESSENGER */}
      {activeTab === "targeted-messenger" && (
        <div className="space-y-6">

          {/* Privacy & Target Assurance Notice */}
          <div className="bg-emerald-50/90 border border-emerald-200/90 rounded-2xl p-4 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#004b23] shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-950 leading-relaxed">
              <span className="font-bold text-[#004b23]">অর্ডার ভিত্তিক লাইভ বাবল ও রিয়েল-টাইম ট্র্যাকিং:</span> নিচে শুধুমাত্র যেসব গ্রাহক অর্ডার করেছেন তাদের তালিকা ও ফোন নম্বর প্রদর্শিত হচ্ছে। যে অর্ডারে আপনি লোকেশন আপডেট বা মেসেজ পাঠাবেন, লাইভ বাবলটি <span className="font-bold underline">শুধুমাত্র ওই নির্দিষ্ট গ্রাহকের অ্যাপেই রিয়েল-টাইমে</span> ভেসে উঠবে।
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Left 5 Cols: Recipients List to Select */}
            <div className="lg:col-span-5 bg-white rounded-3xl p-5 border border-gray-200/80 shadow-xs space-y-4">
              
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#004b23]" />
                  <span>অর্ডার তালিকা ({combinedRecipients.length})</span>
                </h3>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                  রিয়েল-টাইম সিঙ্ক
                </span>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="মোবাইল নম্বর (যেমন 01872...), নাম বা অর্ডার..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#004b23]"
                />
              </div>

              {/* Direct Phone Number Fast-Input */}
              <form onSubmit={handleDirectPhoneSubmit} className="pt-1 flex gap-2">
                <input
                  type="text"
                  placeholder="বা সরাসরি যেকোনো নম্বর লিখুন..."
                  value={directPhoneInput}
                  onChange={(e) => setDirectPhoneInput(e.target.value)}
                  className="flex-1 px-3 py-2 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs font-mono font-bold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#004b23]"
                />
                <button
                  type="submit"
                  disabled={!directPhoneInput.trim()}
                  className="px-3 py-2 bg-[#004b23] hover:bg-[#003618] text-white rounded-xl text-xs font-bold transition-all disabled:opacity-40 cursor-pointer shrink-0"
                >
                  সিলেক্ট করুন
                </button>
              </form>

              {/* List */}
              <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
                {recipientsLoading ? (
                  <div className="py-12 text-center text-xs font-bold text-gray-400 flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-[#004b23]" />
                    <span>লোড হচ্ছে...</span>
                  </div>
                ) : combinedRecipients.length === 0 ? (
                  <div className="py-12 text-center text-xs font-bold text-gray-400">
                    কোনো অর্ডার পাওয়া যায়নি
                  </div>
                ) : (
                  combinedRecipients.map((rec) => {
                    const isSelected = selectedRecipient?.id === rec.id;
                    const statusObj = getOrderStatusInfo(rec.status);
                    const phoneDisplay = rec.customerPhone || "ফোন নম্বর নেই";

                    return (
                      <div
                        key={rec.id}
                        onClick={() => handleSelectRecipient(rec)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-emerald-50/90 border-[#004b23] shadow-md ring-2 ring-[#004b23]/30"
                            : "bg-gray-50/70 hover:bg-gray-100/90 border-gray-200/80"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-black text-gray-900 tracking-wide flex items-center gap-1.5">
                            <span>#{rec.orderNumber}</span>
                          </span>

                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full text-white ${statusObj.badgeColor}`}>
                            {statusObj.shortLabel}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs gap-2 mb-1.5">
                          <div className="flex items-center gap-1.5 font-bold text-gray-900 truncate">
                            <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span className="truncate">{rec.customerName}</span>
                          </div>
                          
                          {/* Prominent Phone Badge */}
                          <div className="flex items-center gap-1 font-mono font-bold text-[#004b23] bg-emerald-100/70 border border-emerald-300/60 px-2 py-0.5 rounded-md text-[11px] shrink-0">
                            <Phone className="w-3 h-3 text-[#004b23]" />
                            <span>{phoneDisplay}</span>
                          </div>
                        </div>

                        {rec.shippingAddress?.district && (
                          <div className="text-[11px] text-gray-500 truncate flex items-center gap-1 mb-1.5">
                            <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                            <span className="truncate">
                              {rec.shippingAddress.upazila ? `${rec.shippingAddress.upazila}, ` : ""}
                              {rec.shippingAddress.district}
                            </span>
                          </div>
                        )}

                        {rec.trackingMessage ? (
                          <div className="mt-1 text-[10px] text-emerald-900 bg-white px-2 py-1 rounded-lg border border-emerald-200/80 truncate flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                            <span className="truncate">{rec.trackingMessage}</span>
                          </div>
                        ) : (
                          <div className="mt-1 flex items-center justify-between text-[10px] font-bold text-[#004b23] pt-0.5">
                            <span>{isSelected ? "✓ সিলেক্টেড (মেসেজ লিখুন)" : "বাবল পাঠাতে ক্লিক করুন"}</span>
                            <ChevronRight className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right 7 Cols: Targeted Message Sender Form */}
            <div className="lg:col-span-7 space-y-6" id="target-message-form">
              {selectedRecipient ? (
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200/90 shadow-md space-y-5">
                  
                  {/* Selected Customer Header & Prominent Phone display */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-200/80 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200/50 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 bg-[#004b23] text-white rounded-md text-[11px] font-black tracking-wide">
                          📦 অর্ডার নম্বর: #{selectedRecipient.orderNumber}
                        </span>
                        {selectedRecipient.type === "order" && (
                          <>
                            <span className="text-xs font-bold text-gray-400">|</span>
                            <span className="text-xs font-bold text-gray-800">
                              মোট: ৳{(selectedRecipient.grandTotal || selectedRecipient.total || 0).toLocaleString("bn-BD")}
                            </span>
                          </>
                        )}
                      </div>

                      <span className="text-[11px] font-bold text-emerald-800 bg-white px-2.5 py-1 rounded-full border border-emerald-200/70 shadow-2xs">
                        আইডি: {selectedRecipient.userId === "anonymous" ? "গেস্ট" : (selectedRecipient.userId || selectedRecipient.id).slice(0, 10)}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-[#004b23]" />
                          <span className="text-sm font-black text-gray-900">{selectedRecipient.customerName}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border-2 border-emerald-500/80 rounded-xl text-xs font-black font-mono text-[#004b23] shadow-xs">
                            <Phone className="w-3.5 h-3.5 text-[#004b23]" />
                            <span>{selectedRecipient.customerPhone || "ফোন নম্বর নেই"}</span>
                          </div>
                          <span className="text-[11px] text-gray-500 font-semibold">(গ্রাহকের মোবাইল নম্বর)</span>
                        </div>

                        {selectedRecipient.email && (
                          <p className="text-[11px] text-gray-600 truncate max-w-sm pt-0.5">
                            ইমেইল: {selectedRecipient.email}
                          </p>
                        )}

                        {selectedRecipient.shippingAddress?.fullAddress && (
                          <p className="text-[11px] text-gray-600 flex items-center gap-1 pt-1">
                            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span className="truncate max-w-sm">{selectedRecipient.shippingAddress.fullAddress}</span>
                          </p>
                        )}
                      </div>

                      {/* Direct Phone & WhatsApp Actions */}
                      {selectedRecipient.customerPhone && selectedRecipient.customerPhone !== "ফোন নম্বর নেই" && (
                        <div className="flex items-center gap-2 self-start sm:self-center">
                          <a
                            href={`tel:${selectedRecipient.customerPhone}`}
                            className="px-3 py-2 rounded-xl bg-white border border-gray-200 hover:border-emerald-500 text-gray-800 hover:text-[#004b23] text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
                          >
                            <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                            <span>কল করুন</span>
                          </a>
                          <a
                            href={getWhatsAppUrl(selectedRecipient.customerPhone, selectedRecipient, trackingMessageInput)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-2 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-black flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 1. Update Status Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-800 uppercase tracking-wider block">
                      ১. অর্ডারের বর্তমান অবস্থা (স্ট্যাটাস) নির্বাচন করুন:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { key: "pending", label: "অপেক্ষমাণ", color: "hover:border-amber-400" },
                        { key: "processing", label: "প্রক্রিয়াধীন", color: "hover:border-indigo-400" },
                        { key: "shipped", label: "ডেলিভারির পথে", color: "hover:border-purple-400" },
                        { key: "delivered", label: "ডেলিভার্ড", color: "hover:border-emerald-400" }
                      ].map((item) => {
                        const isSelected = (newStatus || "").toLowerCase() === item.key;
                        return (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => setNewStatus(item.key)}
                            className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                              isSelected
                                ? "bg-[#004b23] text-white border-[#004b23] shadow-xs"
                                : `bg-white text-gray-700 border-gray-200 ${item.color}`
                            }`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Custom Location / Tracking Message */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-800 uppercase tracking-wider block flex items-center justify-between">
                      <span>২. অর্ডার বা মেসেজটি কী? (লাইভ বাবল বার্তা লিখুন):</span>
                      <span className="text-[10px] text-gray-400 font-normal">গ্রাহকের স্ক্রিনের বাবলে ভাসবে</span>
                    </label>

                    <div className="relative">
                      <input
                        type="text"
                        value={trackingMessageInput}
                        onChange={(e) => setTrackingMessageInput(e.target.value)}
                        placeholder="যেমন: রাইডার বনানী মোড় অতিক্রম করেছে 🛵..."
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#004b23] focus:bg-white transition-all"
                      />
                    </div>

                    {/* Quick Preset Buttons */}
                    <div className="pt-2 space-y-1.5">
                      <span className="text-[10px] font-bold text-gray-500 block">কুইক প্রিসেট (এক ক্লিকে বসান):</span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          "🛵 রাইডার ডেলিভারির উদ্দেশ্যে আপনার ঠিকানায় রওনা হয়েছে",
                          "📦 প্যাকেজিং সম্পন্ন, কুরিয়ারে হস্তান্তর করা হয়েছে",
                          "🏢 ডেলিভারি হাবে পৌঁছেছে, দ্রুত ডেলিভারি হবে",
                          "⏱️ আগামী ১৫-২০ মিনিটের মধ্যে আপনার কাছে পৌঁছাবে",
                          "📍 রাইডার আপনার বাসার কাছাকাছি চলে এসেছে"
                        ].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setTrackingMessageInput(preset)}
                            className="px-2.5 py-1 bg-gray-100 hover:bg-emerald-50 hover:text-[#004b23] border border-gray-200 rounded-lg text-[10px] font-bold text-gray-700 transition-all cursor-pointer"
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 space-y-2.5">
                    <button
                      type="button"
                      onClick={handleSendTargetedUpdate}
                      disabled={sendingUpdate}
                      className="w-full py-3.5 px-6 rounded-2xl bg-[#004b23] hover:bg-[#003618] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {sendingUpdate ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-emerald-300" />
                      ) : (
                        <Send className="w-4 h-4 text-emerald-300" />
                      )}
                      <span>
                        {sendingUpdate 
                          ? "মেসেজ পাঠানো হচ্ছে..." 
                          : `গ্রাহকের (${selectedRecipient.customerPhone || selectedRecipient.customerName}) অ্যাপে লাইভ বাবল পাঠান`
                        }
                      </span>
                    </button>

                    {selectedRecipient.customerPhone && selectedRecipient.customerPhone !== "ফোন নম্বর নেই" && (
                      <a
                        href={getWhatsAppUrl(selectedRecipient.customerPhone, selectedRecipient, trackingMessageInput)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2.5 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <MessageCircle className="w-4 h-4 text-emerald-600" />
                        <span>হোয়াটসঅ্যাপেও (WhatsApp) এই {selectedRecipient.customerPhone} নম্বরে লোকেশন মেসেজ পাঠান</span>
                      </a>
                    )}
                  </div>

                  {/* Success Alert */}
                  {sendSuccessMessage && (
                    <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-900 font-bold animate-fade-in shadow-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{sendSuccessMessage}</span>
                    </div>
                  )}

                </div>
              ) : (
                /* Empty state when no recipient selected */
                <div className="bg-white rounded-3xl p-12 border border-gray-200/80 shadow-xs flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#004b23]">
                    <Target className="w-7 h-7" />
                  </div>
                  <h4 className="text-sm font-black text-gray-800">
                    বামপাশের তালিকা থেকে একটি অর্ডার বা গ্রাহক নির্বাচন করুন
                  </h4>
                  <p className="text-xs text-gray-500 max-w-sm">
                    যেকোনো গ্রাহক বা অর্ডারে ক্লিক করলে তার নাম, মোবাইল নম্বর, বর্তমান স্ট্যাটাস ও বাবল মেসেজ পাঠানোর অপশনটি এখানে উন্মুক্ত হবে।
                  </p>
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: GLOBAL CONFIGURATION */}
      {activeTab === "global-settings" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left 2 Columns: Controls */}
          <div className="lg:col-span-2 space-y-6">

            {/* 1. Global Master Switch */}
            <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-gray-900">ইন-অ্যাপ ফ্লোটিং বাবল সক্রিয় রাখুন</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    বন্ধ রাখলে গ্রাহকের স্ক্রিনে কোনো বাবল আসবে না।
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.enabled}
                    onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#004b23]"></div>
                </label>
              </div>
            </div>

            {/* 2. Audio & Haptic Feedback */}
            <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-[#004b23]" />
                <span>সাউন্ড ও ভাইব্রেশন অ্যালার্ট</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Sound Toggle */}
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-gray-900">নোটিফিকেশন চাইম সাউন্ড</h4>
                    <p className="text-[11px] text-gray-500">আপডেট আসলে সফট চাইম বাজবে</p>
                    <button
                      type="button"
                      onClick={playInAppBubbleChime}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-[#004b23] hover:underline pt-1 cursor-pointer"
                    >
                      <Play className="w-3 h-3" />
                      <span>টেস্ট সাউন্ড শুনুন</span>
                    </button>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.soundEnabled}
                    onChange={(e) => setConfig({ ...config, soundEnabled: e.target.checked })}
                    className="w-5 h-5 accent-[#004b23] cursor-pointer"
                  />
                </div>

                {/* Vibration Toggle */}
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-gray-900">মোবাইল হ্যাপটিক ভাইব্রেশন</h4>
                    <p className="text-[11px] text-gray-500">মোবাইলে সফট ভাইব্রেশন দেবে</p>
                    <button
                      type="button"
                      onClick={triggerInAppVibration}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-[#004b23] hover:underline pt-1 cursor-pointer"
                    >
                      <Vibrate className="w-3 h-3" />
                      <span>টেস্ট ভাইব্রেশন</span>
                    </button>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.vibrationEnabled}
                    onChange={(e) => setConfig({ ...config, vibrationEnabled: e.target.checked })}
                    className="w-5 h-5 accent-[#004b23] cursor-pointer"
                  />
                </div>

              </div>
            </div>

            {/* 3. Behavior & Timing Controls */}
            <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#004b23]" />
                <span>ডিসপ্লে ও টাইমিং আচরণ</span>
              </h3>

              <div className="space-y-4">
                
                {/* Banner Auto Expand */}
                <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl">
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">আপডেটের সময় ব্যানার স্বয়ংক্রিয়ভাবে স্লাইড-আউট হবে</h4>
                    <p className="text-[11px] text-gray-400">স্ট্যাটাস পরিবর্তনের সাথে সাথে টেক্সট পিল আকারে দেখাবে</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.autoExpandBanner}
                    onChange={(e) => setConfig({ ...config, autoExpandBanner: e.target.checked })}
                    className="w-5 h-5 accent-[#004b23] cursor-pointer"
                  />
                </div>

                {/* Banner Duration */}
                <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl">
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">ব্যানার প্রদর্শন সময়</h4>
                    <p className="text-[11px] text-gray-400">কত সেকেন্ড পর ব্যানার গুটিয়ে গোল বাবল হয়ে থাকবে</p>
                  </div>
                  <select
                    value={config.bannerDurationSeconds}
                    onChange={(e) => setConfig({ ...config, bannerDurationSeconds: Number(e.target.value) })}
                    className="border border-gray-200 rounded-xl px-3 py-1.5 font-bold bg-white text-xs text-[#004b23]"
                  >
                    <option value={5}>৫ সেকেন্ড</option>
                    <option value={7}>৭ সেকেন্ড (প্রস্তাবিত)</option>
                    <option value={10}>১০ সেকেন্ড</option>
                    <option value={15}>১৫ সেকেন্ড</option>
                  </select>
                </div>

                {/* Show On Delivered Time */}
                <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl">
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">ডেলিভারি সম্পন্ন হওয়ার পর কতক্ষণ বাবল দেখাবে</h4>
                    <p className="text-[11px] text-gray-400">নির্দিষ্ট সময় পার হলে বাবল স্বয়ংক্রিয়ভাবে রিমুভ হবে</p>
                  </div>
                  <select
                    value={config.showOnDeliveredMinutes}
                    onChange={(e) => setConfig({ ...config, showOnDeliveredMinutes: Number(e.target.value) })}
                    className="border border-gray-200 rounded-xl px-3 py-1.5 font-bold bg-white text-xs text-[#004b23]"
                  >
                    <option value={30}>৩০ মিনিট</option>
                    <option value={60}>১ ঘণ্টা</option>
                    <option value={120}>২ ঘণ্টা (প্রস্তাবিত)</option>
                    <option value={240}>৪ ঘণ্টা</option>
                  </select>
                </div>

              </div>
            </div>

          </div>

          {/* Right 1 Column: Interactive Live Test & Preview */}
          <div className="space-y-6">

            {/* Interactive Live Test Box */}
            <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>লাইভ টেস্ট ও প্রিভিউ</span>
              </h3>
              
              <p className="text-xs text-gray-500 leading-relaxed">
                যেকোনো স্ট্যাটাস নির্বাচন করে নিচের বাটনে ক্লিক করুন। সাথে সাথে স্ক্রিনে টেস্ট বাবল আসবে এবং আপনি ড্র্যাগ করে যেকোনো জায়গায় রাখতে পারবেন।
              </p>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700">টেস্ট স্ট্যাটাস নির্বাচন করুন:</label>
                <select
                  value={testStatus}
                  onChange={(e) => setTestStatus(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-2.5 font-bold bg-gray-50 text-xs text-gray-800"
                >
                  <option value="pending">১. অপেক্ষমাণ (Pending)</option>
                  <option value="confirmed">২. কনফার্মড (Confirmed)</option>
                  <option value="processing">৩. প্রসেসিং / প্যাকেজিং (Processing)</option>
                  <option value="shipped">৪. ডেলিভারির পথে (On The Way)</option>
                  <option value="delivered">৫. ডেলিভার্ড (Delivered)</option>
                </select>
              </div>

              {/* Current Preview Card */}
              <div className={`p-4 rounded-2xl border ${currentPreviewStatus.bgLight} ${currentPreviewStatus.borderLight} space-y-2`}>
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full text-white ${currentPreviewStatus.badgeColor}`}>
                    {currentPreviewStatus.shortLabel}
                  </span>
                  <span className="text-[10px] text-gray-400 font-bold">স্টেপ {currentPreviewStatus.step}/৫</span>
                </div>
                <h5 className="text-xs font-bold text-gray-900">{currentPreviewStatus.title}</h5>
              </div>

              {/* Trigger Button */}
              <button
                type="button"
                onClick={handleTriggerDemo}
                className="w-full py-3 px-4 rounded-2xl bg-[#004b23] hover:bg-[#003618] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <Smartphone className="w-4 h-4 text-emerald-300" />
                <span>স্ক্রিনে টেস্ট বাবল চালু করুন</span>
              </button>
            </div>

            {/* Information Card */}
            <div className="bg-gray-50 rounded-3xl p-5 border border-gray-200/70 space-y-3">
              <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-[#004b23]" />
                <span>টার্গেটিং প্রযুক্তি বিবরণ</span>
              </h4>
              
              <ul className="text-[11px] text-gray-600 space-y-2 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#004b23] text-white flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">১</span>
                  <span>প্রতিটি গ্রাহকের ডিভাইসে শুধুমাত্র তার নিজস্ব ইউজার আইডির (`userId == user.uid`) অর্ডার লিসেন করা হয়।</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#004b23] text-white flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">২</span>
                  <span>যেসব ব্যবহারকারী কোনো অর্ডার করেননি, তাদের কাছে কোনো বাবল প্রদর্শিত হবে না।</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#004b23] text-white flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">৩</span>
                  <span>আপনি যখন এই প্যানেল থেকে কোনো অর্ডারে মেসেজ দেন, তা তৎক্ষণাৎ ওই গ্রাহকের ডিভাইসের বাবলে লাইভ পপ-আপ হবে।</span>
                </li>
              </ul>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
