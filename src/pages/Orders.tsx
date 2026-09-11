import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Package, ChevronRight, Clock, CheckCircle2, Truck, XCircle, ArrowLeft, RefreshCw, Send, MapPin, CheckCheck } from "lucide-react";
import { db } from "../lib/firebase";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { handleFirestoreError, OperationType } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { Order } from "../types";

const statusStyles: Record<string, { label: string, color: string, bg: string, icon: any }> = {
  placed: { label: "অর্ডার করা হয়েছে", color: "text-amber-600", bg: "bg-amber-50", icon: Clock },
  confirmed: { label: "কনফার্ম করা হয়েছে", color: "text-blue-600", bg: "bg-blue-50", icon: CheckCircle2 },
  prepared: { label: "প্রস্তুত করা হয়েছে", color: "text-indigo-600", bg: "bg-indigo-50", icon: Package },
  shipped: { label: "কুরিয়ারে দেওয়া হয়েছে", color: "text-purple-600", bg: "bg-purple-50", icon: Send },
  on_the_way: { label: "পথে রয়েছে", color: "text-sky-600", bg: "bg-sky-50", icon: MapPin },
  out_for_delivery: { label: "ডেলিভারির জন্য বের হয়েছে", color: "text-orange-600", bg: "bg-orange-50", icon: Truck },
  delivered: { label: "Delivered (ডেলিভারড)", color: "text-green-600", bg: "bg-green-50", icon: CheckCheck },
  cancelled: { label: "বাতিল করা হয়েছে", color: "text-red-600", bg: "bg-red-50", icon: XCircle },
};

export const Orders: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isFood = location.pathname.startsWith("/food/");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "food_orders"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      setOrders(ordersData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, isFood ? "food_orders" : "orders");
    });

    return () => unsubscribe();
  }, [user]);

  const formatDate = (timestamp: any) => {
    try {
      let date: Date;
      if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp) {
        date = new Date(timestamp.seconds * 1000);
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
          <h1 className={`text-lg font-bold ${isFood ? "text-white" : "text-gray-800"}`}>My Orders</h1>
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
            const style = statusStyles[order.internalStatus] || statusStyles.placed;
            return (
              <Link 
                key={order.id} 
                to={isFood ? `/food/order/${order.id}` : `/order/${order.id}`}
                className="block bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg ${style.bg} ${style.color}`}>
                      <style.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 text-xs">{order.orderNumber}</h3>
                      <p className="text-[9px] text-gray-400 font-medium">{formatDate(order.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${style.bg} ${style.color}`}>
                      {style.label}
                    </div>
                    {order.deliveryInfo?.status !== 'not_created' && (
                      <div className="text-[8px] font-black text-[#5842dc] bg-[#5842dc]/5 px-1.5 py-0.5 rounded border border-[#5842dc]/10 uppercase">
                        {order.deliveryInfo.status.replace('_', ' ')}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                  <div className="text-[10px] text-gray-500">
                    <span className="font-bold text-gray-800">{order.items.length}</span> Items
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-[#004b23]">৳{order.total}</span>
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
