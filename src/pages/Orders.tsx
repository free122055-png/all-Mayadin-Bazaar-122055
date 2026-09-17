import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Package, ChevronRight, Clock, CheckCircle2, Truck, XCircle, ArrowLeft, RefreshCw, Send, MapPin, CheckCheck } from "lucide-react";
import { db } from "../lib/firebase";
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore";
import { handleFirestoreError, OperationType } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { Order } from "../types";

const statusStyles: Record<string, { label: string, color: string, bg: string, icon: any }> = {
  placed: { label: "অর্ডার করা হয়েছে", color: "text-amber-600", bg: "bg-amber-50", icon: Clock },
  pending: { label: "অপেক্ষমান", color: "text-amber-600", bg: "bg-amber-50", icon: Clock },
  confirmed: { label: "কনফার্ম করা হয়েছে", color: "text-blue-600", bg: "bg-blue-50", icon: CheckCircle2 },
  processing: { label: "প্রস্তুত হচ্ছে", color: "text-indigo-600", bg: "bg-indigo-50", icon: Package },
  prepared: { label: "প্রস্তুত করা হয়েছে", color: "text-indigo-600", bg: "bg-indigo-50", icon: Package },
  shipped: { label: "কুরিয়ারে দেওয়া হয়েছে", color: "text-purple-600", bg: "bg-purple-50", icon: Send },
  on_the_way: { label: "পথে রয়েছে", color: "text-sky-600", bg: "bg-sky-50", icon: MapPin },
  out_for_delivery: { label: "ডেলিভারির জন্য বের হয়েছে", color: "text-orange-600", bg: "bg-orange-50", icon: Truck },
  delivered: { label: "Delivered (ডেলিভারড)", color: "text-green-600", bg: "bg-green-50", icon: CheckCheck },
  completed: { label: "সম্পন্ন হয়েছে", color: "text-green-600", bg: "bg-green-50", icon: CheckCheck },
  cancelled: { label: "বাতিল করা হয়েছে", color: "text-red-600", bg: "bg-red-50", icon: XCircle },
};

export const Orders: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const isFood = location.pathname.startsWith("/food/");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubs: (() => void)[] = [];
    const ordersMap = new Map<string, Order>();

    const updateAndSortOrders = () => {
      const allOrders = Array.from(ordersMap.values());
      allOrders.sort((a: any, b: any) => {
        const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (typeof a.createdAt === 'number' ? a.createdAt : 0);
        const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (typeof b.createdAt === 'number' ? b.createdAt : 0);
        return timeB - timeA;
      });
      setOrders(allOrders);
      setLoading(false);
    };

    const processSnapshot = (docs: any[]) => {
      if (!Array.isArray(docs)) return;
      docs.forEach(d => {
        if (!d || !d.exists || !d.data) return;
        const data = d.data();
        if (!data) return;
        
        const rawStatus = data.internalStatus || data.status || "placed";
        const normalizedStatus = statusStyles[rawStatus] ? rawStatus : "placed";
        
        ordersMap.set(d.id, {
          id: d.id,
          ...data,
          orderNumber: data.orderNumber || data.orderId || d.id.slice(0, 8).toUpperCase(),
          total: data.total || data.grandTotal || 0,
          grandTotal: data.grandTotal || data.total || 0,
          internalStatus: normalizedStatus,
          status: data.status || normalizedStatus,
          items: Array.isArray(data.items) ? data.items : []
        } as Order);
      });
      updateAndSortOrders();
    };

    if (user?.uid) {
      // 1. Query by userId from food_orders
      const qFood = query(
        collection(db, "food_orders"),
        where("userId", "==", user.uid)
      );
      unsubs.push(
        onSnapshot(qFood, (snapshot) => {
          processSnapshot(snapshot.docs);
        }, (error) => {
          console.warn("User orders query notice:", error);
          setLoading(false);
        })
      );

      // Also listen to general "orders" collection if userId exists
      const qOrders = query(
        collection(db, "orders"),
        where("userId", "==", user.uid)
      );
      unsubs.push(
        onSnapshot(qOrders, (snapshot) => {
          processSnapshot(snapshot.docs);
        }, (err) => console.warn("General orders query notice:", err))
      );

      // 2. Query by phone number if present
      const userPhone = profile?.phoneNumber || (user as any)?.phoneNumber;
      if (userPhone) {
        const qPhone = query(
          collection(db, "food_orders"),
          where("customerPhone", "==", userPhone)
        );
        unsubs.push(
          onSnapshot(qPhone, (snapshot) => {
            processSnapshot(snapshot.docs);
          }, (err) => console.warn("Phone order query notice:", err))
        );
      }
    }

    // 3. Fallback for guest or recently placed order ID stored in localStorage
    const lastPlacedId = localStorage.getItem("last_placed_order_id");
    if (lastPlacedId) {
      getDoc(doc(db, "food_orders", lastPlacedId)).then((docSnap) => {
        if (docSnap.exists()) {
          processSnapshot([docSnap]);
        }
      }).catch((e) => console.warn("Local order fetch notice:", e));

      getDoc(doc(db, "orders", lastPlacedId)).then((docSnap) => {
        if (docSnap.exists()) {
          processSnapshot([docSnap]);
        }
      }).catch((e) => console.warn("Local general order fetch notice:", e));
    }

    if (!user && !lastPlacedId) {
      setLoading(false);
    }

    return () => {
      unsubs.forEach(unsub => unsub());
    };
  }, [user, profile]);

  const formatDate = (timestamp: any) => {
    try {
      if (!timestamp) return "আজকে";
      let date: Date;
      if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp) {
        date = new Date(timestamp.seconds * 1000);
      } else if (typeof timestamp === 'number') {
        date = new Date(timestamp);
      } else {
        date = new Date(timestamp);
      }

      if (isNaN(date.getTime())) return "N/A";

      return date.toLocaleDateString('bn-BD', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return "N/A";
    }
  };

  return (
    <div className={`space-y-4 pb-24 ${isFood ? "-mx-4 -mt-4 bg-[#fcfdfc] min-h-screen" : ""}`}>
      {/* Header */}
      <div className={isFood ? "bg-[#004b23] px-5 pt-8 pb-4 rounded-b-[40px] shadow-lg sticky top-0 z-50 mb-4 flex items-center gap-3" : "flex items-center gap-3"}>
        <button onClick={() => navigate(-1)} className={isFood ? "w-9 h-9 bg-white/10 rounded-full flex items-center justify-center border border-white/20 active:scale-90 transition-transform" : "w-9 h-9 bg-white hover:bg-gray-100 rounded-full flex items-center justify-center border border-gray-200 shadow-xs active:scale-90 transition-transform"}>
          <ArrowLeft className={`w-4 h-4 ${isFood ? "text-white" : "text-gray-700"}`} />
        </button>
        <div className="flex items-center gap-2">
          <h1 className={`text-lg font-bold ${isFood ? "text-white" : "text-gray-800"}`}>অর্ডার হিস্টোরি (My Orders)</h1>
          {!isFood && !loading && <span className="text-xs text-gray-400">({orders.length})</span>}
        </div>
      </div>

      <div className={isFood ? "px-4 space-y-3" : "space-y-3"}>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <RefreshCw className="w-8 h-8 text-[#004b23] animate-spin" />
            <p className="text-xs text-gray-400">লোড হচ্ছে...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
              <Package className="w-10 h-10 text-gray-200" />
            </div>
            <p className="text-sm font-bold text-gray-400">আপনি এখনো কোনো অর্ডার করেননি</p>
          </div>
        ) : (
          orders.map((order) => {
            const currentStatusKey = order?.internalStatus || (order as any)?.status || "placed";
            const style = statusStyles[currentStatusKey] || statusStyles.placed;
            const itemsCount = Array.isArray(order?.items) ? order.items.length : 1;
            const displayTotal = order?.total || order?.grandTotal || 0;
            const deliveryStatus = order?.deliveryInfo?.status;

            return (
              <Link 
                key={order.id} 
                to={isFood ? `/food/order/${order.id}` : `/order/${order.id}`}
                className="block bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md active:scale-[0.99]"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg ${style.bg} ${style.color}`}>
                      <style.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 text-xs">#{order.orderNumber || order.id?.slice(0, 8)}</h3>
                      <p className="text-[9px] text-gray-400 font-medium">{formatDate(order.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${style.bg} ${style.color}`}>
                      {style.label}
                    </div>
                    {deliveryStatus && deliveryStatus !== 'not_created' && (
                      <div className="text-[8px] font-black text-[#5842dc] bg-[#5842dc]/5 px-1.5 py-0.5 rounded border border-[#5842dc]/10 uppercase">
                        {String(deliveryStatus).replace(/_/g, ' ')}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                  <div className="text-[10px] text-gray-500">
                    <span className="font-bold text-gray-800">{itemsCount}</span> Items
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-[#004b23]">৳{displayTotal}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
};
