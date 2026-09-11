import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { 
  ArrowLeft, MapPin, CreditCard, Package, ChevronRight, 
  CheckCircle2, Circle, RefreshCw, ExternalLink, 
  Timer, Truck, ShoppingBag, Utensils, Home
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { db } from "../lib/firebase";
import { getApiUrl } from "../lib/api";
import { doc, onSnapshot } from "firebase/firestore";
import { Order } from "../types";

const LiveTracking: React.FC<{ order: Order }> = ({ order }) => {
  const [timeLeft, setTimeLeft] = useState("");
  
  useEffect(() => {
    if (order.internalStatus === 'completed' || order.internalStatus === 'cancelled') {
      setTimeLeft(order.internalStatus === 'completed' ? "ডেলিভারি সম্পন্ন" : "অর্ডার বাতিল");
      return;
    }

    const calculateTime = () => {
      const now = Date.now();
      const createdTime = order.createdAt?.seconds 
        ? order.createdAt.seconds * 1000 
        : (typeof order.createdAt === 'number' ? order.createdAt : now);
      
      const totalTime = 40 * 60 * 1000; // 40 minutes in ms
      const elapsed = now - createdTime;
      const remaining = totalTime - elapsed;

      if (remaining <= 0) {
        setTimeLeft("শীঘ্রই পৌঁছাবে");
      } else {
        const mins = Math.floor(remaining / (1000 * 60));
        const secs = Math.floor((remaining % (1000 * 60)) / 1000);
        setTimeLeft(`${mins}:${secs < 10 ? '0' : ''}${secs} মিনিট বাকি`);
      }
    };

    const timer = setInterval(calculateTime, 1000);
    calculateTime();
    return () => clearInterval(timer);
  }, [order]);

  const steps = [
    { key: 'placed', icon: ShoppingBag, label: 'প্লেসড' },
    { key: 'confirmed', icon: Utensils, label: 'নিশ্চিত' },
    { key: 'processing', icon: Package, label: 'রান্না' },
    { key: 'shipped', icon: Truck, label: 'পথে' },
    { key: 'completed', icon: Home, label: 'পৌঁছেছে' }
  ];

  const getStepStatus = (stepKey: string) => {
    const statuses = ['placed', 'confirmed', 'processing', 'shipped', 'completed'];
    const currentIndex = statuses.indexOf(order.internalStatus);
    const stepIndex = statuses.indexOf(stepKey);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  return (
    <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-xl overflow-hidden relative">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl opacity-50 -mr-16 -mt-16"></div>
      
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center">
            <Timer className="w-5 h-5 text-emerald-600 animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">লাইভ টাইম</p>
            <h3 className="text-lg font-black text-gray-900 font-mono">{timeLeft}</h3>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">অর্ডার নং</p>
          <h3 className="text-sm font-black text-[#004b23]">#{order.orderNumber}</h3>
        </div>
      </div>

      {/* Horizontal Timeline */}
      <div className="relative pt-4 pb-2">
        {/* Connection Line Background */}
        <div className="absolute top-[22px] left-4 right-4 h-1 bg-gray-100 rounded-full"></div>
        
        {/* Active Line Progress */}
        <motion.div 
          initial={{ width: 0 }}
          animate={{ 
            width: `${(steps.findIndex(s => s.key === order.internalStatus) / (steps.length - 1)) * 100}%` 
          }}
          className="absolute top-[22px] left-4 h-1 bg-emerald-500 rounded-full z-10 transition-all duration-1000"
        ></motion.div>

        <div className="flex justify-between relative z-20">
          {steps.map((step, index) => {
            const status = getStepStatus(step.key);
            return (
              <div key={step.key} className="flex flex-col items-center gap-2">
                <motion.div 
                  initial={false}
                  animate={{
                    scale: status === 'active' ? 1.2 : 1,
                    backgroundColor: status === 'completed' || status === 'active' ? '#10b981' : '#f3f4f6',
                    color: status === 'completed' || status === 'active' ? '#ffffff' : '#9ca3af'
                  }}
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg transition-colors border-2 ${status === 'active' ? 'border-emerald-200' : 'border-white'}`}
                >
                  <step.icon className={`w-5 h-5 ${status === 'active' ? 'animate-bounce' : ''}`} />
                </motion.div>
                <span className={`text-[9px] font-black uppercase tracking-tighter ${status === 'pending' ? 'text-gray-400' : 'text-emerald-700'}`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const OrderDetails: React.FC = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isFood = location.pathname.startsWith("/food/");
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;

    // We need to find by orderNumber or docId. 
    // Since we pass orderId from URL, if it's the docId, we use doc().
    // However, usually we pass the doc.id.
    const unsubscribe = onSnapshot(doc(db, "food_orders", orderId), (docSnap) => {
      if (docSnap.exists()) {
        const orderData = { id: docSnap.id, ...docSnap.data() } as Order;
        setOrder(orderData);
        
        // Auto-sync status if needed
        if (orderData.deliveryInfo?.trackingId && orderData.deliveryInfo.status !== 'delivered' && orderData.deliveryInfo.status !== 'cancelled') {
          syncStatus(orderData);
        }
      } else {
        setOrder(null);
      }
      setLoading(false);
    }, (error) => {
      console.warn("Order details listener notice:", error.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [orderId]);

  const syncStatus = async (orderData: Order) => {
    try {
      const response = await fetch(getApiUrl(`/api/delivery/steadfast/track/${orderData.deliveryInfo?.trackingId}`));
      const result = await response.json();

      if (response.ok && result.status === 200) {
        const { updateDoc, doc } = await import("firebase/firestore");
        const orderRef = doc(db, "food_orders", orderData.id);
        
        // Map Steadfast status to our internal delivery status
        const mapSteadfastStatus = (steadfastStatus: string): Order['deliveryInfo']['status'] => {
          const s = steadfastStatus.toLowerCase();
          if (s.includes('pending')) return 'pickup_pending';
          if (s.includes('picked')) return 'picked_up';
          if (s.includes('transit')) return 'in_transit';
          if (s.includes('delivered')) return 'delivered';
          if (s.includes('return')) return 'returned';
          if (s.includes('cancel')) return 'cancelled';
          if (s.includes('fail')) return 'failed';
          return 'created';
        };

        const newStatus = mapSteadfastStatus(result.delivery_status);
        if (newStatus !== orderData.deliveryInfo?.status) {
          await updateDoc(orderRef, {
            "deliveryInfo.status": newStatus,
            "deliveryInfo.lastUpdated": Date.now(),
            "internalStatus": newStatus === 'delivered' ? 'completed' : 
                             (newStatus === 'cancelled' || newStatus === 'failed' || newStatus === 'returned' ? 'cancelled' : orderData.internalStatus),
            "updatedAt": Date.now()
          });
        }
      }
    } catch (error) {
      console.error("Status Sync Error:", error);
    }
  };

  const getStepStatus = (stepKey: string) => {
    const statuses = ['placed', 'confirmed', 'processing', 'shipped', 'completed'];
    const currentIndex = statuses.indexOf(order.internalStatus);
    const stepIndex = statuses.indexOf(stepKey);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-2 min-h-screen">
        <RefreshCw className="w-8 h-8 text-[#004b23] animate-spin" />
        <p className="text-xs text-gray-400">অর্ডার ডিটেইলস লোড হচ্ছে...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 min-h-screen">
        <Package className="w-12 h-12 text-gray-200" />
        <p className="text-gray-500">অর্ডারটি পাওয়া যায়নি</p>
        <button onClick={() => navigate(-1)} className="text-[#004b23] font-bold">ফিরে যান</button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 pb-24 ${isFood ? "-mx-4 -mt-4 bg-[#fcfdfc] min-h-screen" : ""}`}>
      {/* Header */}
      <div className={isFood ? "bg-[#004b23] px-5 pt-10 pb-6 rounded-b-[40px] shadow-lg sticky top-0 z-50 mb-6 flex items-center gap-3" : "flex items-center gap-3 py-4"}>
        <button onClick={() => navigate(-1)} className={isFood ? "w-10 h-10 bg-white/10 rounded-full flex items-center justify-center border border-white/20" : "p-2 bg-white rounded-xl shadow-sm border border-gray-100"}>
          <ArrowLeft className={`w-5 h-5 ${isFood ? "text-white" : "text-gray-600"}`} />
        </button>
        <h1 className={`text-xl font-bold ${isFood ? "text-white" : "text-gray-800"}`}>অর্ডার ট্র্যাকিং</h1>
        {!isFood && <div className="w-10"></div>}
      </div>

      <div className={isFood ? "px-4 space-y-6" : "space-y-6"}>
        {/* Live Tracking Timeline */}
        <LiveTracking order={order} />

        {/* Courier Info if available */}
        {order.deliveryInfo?.trackingId && (
          <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm overflow-hidden relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">কুরিয়ার ট্র্যাকিং আইডি</p>
                <p className="text-sm font-black text-[#5842dc]">{order.deliveryInfo.trackingId}</p>
              </div>
              <a 
                href={`https://portal.steadfast.com.bd/tracking/${order.deliveryInfo.trackingId}`}
                target="_blank"
                rel="noreferrer"
                className="bg-[#5842dc] text-white px-4 py-2 rounded-2xl text-[10px] font-black flex items-center gap-2 hover:bg-[#4632b8] transition-colors"
              >
                লাইভ ট্র্যাকিং <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}

        {/* Items List */}
        <div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">পণ্যসমূহ</h3>
          <div className="divide-y divide-gray-50">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center gap-4 py-3">
                <div className="w-16 h-16 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-gray-800 line-clamp-1">{item.name}</h4>
                  <p className="text-[10px] text-gray-500 font-medium">পরিমাণ: {item.quantity}</p>
                  <p className="text-xs font-bold text-[#004b23] mt-1">৳{item.price * item.quantity}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery & Payment Info */}
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-gray-800 uppercase tracking-wider">
              <MapPin className="w-4 h-4 text-[#004b23]" /> ডেলিভারি ঠিকানা
            </div>
            <div className="text-xs text-gray-600 leading-relaxed">
              <p className="font-bold text-gray-800">{order.shippingAddress.name}</p>
              <p>{order.shippingAddress.fullAddress}, {order.shippingAddress.area}, {order.shippingAddress.district}</p>
              <p>{order.shippingAddress.phone}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-gray-800 uppercase tracking-wider">
              <CreditCard className="w-4 h-4 text-[#004b23]" /> পেমেন্ট পদ্ধতি
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600 uppercase font-bold">{order.paymentMethod}</span>
              <span className={`font-bold px-2 py-0.5 rounded uppercase tracking-tighter ${order.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                {order.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
              </span>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm space-y-3">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">পণ্যের মূল্য</span>
            <span className="font-bold text-gray-800">৳{order.subtotal}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">ডেলিভারি চার্জ</span>
            <span className="font-bold text-gray-800">৳{order.deliveryCharge}</span>
          </div>
          <div className="border-t pt-3 flex justify-between items-center">
            <span className="text-sm font-bold text-gray-800">সর্বমোট</span>
            <span className="text-xl font-black text-[#004b23]">৳{order.total}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
