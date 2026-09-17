import React, { useEffect, useState } from "react";
import { db } from "../../lib/firebase";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { 
  ClipboardList, 
  Search, 
  Filter, 
  Eye, 
  Trash2, 
  CheckCircle, 
  Clock, 
  Truck, 
  X,
  ChevronRight,
  User,
  Phone,
  MapPin,
  Calendar,
  XCircle,
  CheckCircle2,
  Send
} from "lucide-react";

interface OrderItem {
  id?: string;
  nameBn?: string;
  name?: string;
  pricePerUnit?: number;
  price?: number;
  quantity: number;
  unit?: string;
  selectedSize?: string;
  selectedColor?: string;
  size?: string;
  color?: string;
  total?: number;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: OrderItem[];
  totalItemPrice: number;
  deliveryCharge: number;
  grandTotal: number;
  paymentMethod: string;
  paymentStatus?: string;
  paymentDetails?: {
    senderNumber?: string;
    transactionId?: string;
  } | null;
  deliveryMethod: string;
  status: string;
  createdAt: number;
}

export const OrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [trackingNoteInput, setTrackingNoteInput] = useState("");
  const [isUpdatingTracking, setIsUpdatingTracking] = useState(false);
  const [trackingUpdateSuccess, setTrackingUpdateSuccess] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "food_orders"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          orderNumber: data.orderNumber || data.orderId || doc.id.slice(0, 8).toUpperCase(),
          customerName: data.customerName || data.name || data.shippingAddress?.name || data.shippingAddress?.fullName || "সম্মানিত গ্রাহক",
          customerPhone: data.customerPhone || data.phone || data.rawPhone || data.shippingAddress?.phone || "ফোন নেই",
          status: data.status || data.internalStatus || "Pending",
          grandTotal: data.grandTotal || data.total || 0,
        };
      }) as Order[];
      setOrders(ordersData);
      setLoading(false);
    }, (error) => {
      console.warn("Order management listener notice:", error.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "food_orders", orderId), {
        status: newStatus,
        updatedAt: Date.now()
      });
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleSendTargetedLocation = async (orderId: string, message: string) => {
    if (!orderId) return;
    setIsUpdatingTracking(true);
    setTrackingUpdateSuccess(false);
    try {
      await updateDoc(doc(db, "food_orders", orderId), {
        trackingMessage: message,
        currentLocation: message,
        updatedAt: Date.now()
      });
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? ({ ...prev, trackingMessage: message, currentLocation: message } as any) : null);
      }
      setTrackingUpdateSuccess(true);
      setTimeout(() => setTrackingUpdateSuccess(false), 3000);
    } catch (err) {
      console.error("Error sending targeted location message:", err);
      alert("মেসেজ পাঠাতে সমস্যা হয়েছে।");
    } finally {
      setIsUpdatingTracking(false);
    }
  };

  const updatePaymentStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "food_orders", orderId), {
        paymentStatus: newStatus,
        updatedAt: Date.now()
      });
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, paymentStatus: newStatus } : null);
      }
    } catch (error) {
      console.error("Error updating payment status:", error);
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (window.confirm("আপনি কি নিশ্চিতভাবে এই অর্ডারটি ডিলিট করতে চান?")) {
      try {
        await deleteDoc(doc(db, "food_orders", orderId));
        setIsModalOpen(false);
      } catch (error) {
        console.error("Error deleting order:", error);
      }
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerPhone?.includes(searchTerm) ||
      order.customerName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === "all" || order.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending": return "bg-amber-100 text-amber-700 border-amber-200";
      case "Processing": return "bg-blue-100 text-blue-700 border-blue-200";
      case "Shipped": return "bg-indigo-100 text-indigo-700 border-indigo-200";
      case "Delivered": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "Cancelled": return "bg-rose-100 text-rose-700 border-rose-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

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
        month: 'long',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
      });
    } catch (e) {
      return "N/A";
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
            <ClipboardList className="w-8 h-8 text-[#5842dc]" />
            অর্ডার ব্যবস্থাপনা
          </h2>
          <p className="text-sm text-gray-500 font-medium">আপনার দোকানের সকল অর্ডার এখান থেকে নিয়ন্ত্রণ করুন</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="অর্ডার আইডি বা মোবাইল নম্বর দিয়ে খুঁজুন..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5842dc]/40 transition-all"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#5842dc]/40 transition-all"
          >
            <option value="all">সব স্ট্যাটাস</option>
            <option value="Pending">পেন্ডিং</option>
            <option value="Processing">প্রসেসিং</option>
            <option value="Shipped">শিপড</option>
            <option value="Delivered">ডেলিভারড</option>
            <option value="Cancelled">ক্যানসেলড</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500 font-bold">লোড হচ্ছে...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-gray-500 font-bold">কোন অর্ডার পাওয়া যায়নি</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase">অর্ডার নং</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase">কাস্টমার</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase">তারিখ</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase">মোট টাকা</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase">স্ট্যাটাস</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="text-sm font-black text-gray-900">#{order.orderNumber}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900">{order.customerName}</span>
                        <span className="text-[11px] text-gray-500">{order.customerPhone}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-gray-600 font-medium">{formatDate(order.createdAt)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-black text-[#5842dc]">৳{(order.grandTotal || 0).toLocaleString('bn-BD')}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black border ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => {
                          setSelectedOrder(order);
                          setTrackingNoteInput((order as any)?.trackingMessage || (order as any)?.currentLocation || "");
                          setTrackingUpdateSuccess(false);
                          setIsModalOpen(true);
                        }}
                        className="p-2 text-[#5842dc] hover:bg-indigo-50 rounded-xl transition-all"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#5842dc]/10 text-[#5842dc] flex items-center justify-center">
                  <ClipboardList className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900">অর্ডার ডিটেইলস</h3>
                  <p className="text-[11px] text-gray-500 font-bold">আইডি: #{selectedOrder.orderNumber}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-all"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Status Update */}
              <div className="bg-gray-50 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-gray-400 uppercase">বর্তমান অবস্থা:</span>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black border ${getStatusColor(selectedOrder.status)}`}>
                    {selectedOrder.status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {["Pending", "Processing", "Shipped", "Delivered", "Cancelled"].map((s) => (
                    <button
                      key={s}
                      onClick={() => updateOrderStatus(selectedOrder.id, s)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all ${
                        selectedOrder.status === s 
                          ? "bg-[#5842dc] text-white" 
                          : "bg-white text-gray-600 border border-gray-200 hover:border-[#5842dc] hover:text-[#5842dc]"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Targeted Live Location & In-App Bubble Message */}
              <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    <h4 className="text-xs font-black text-[#004b23] uppercase tracking-wider">
                      💬 গ্রাহকের স্ক্রিনের ফ্লোটিং বাবলে লাইভ লোকেশন আপডেট পাঠান
                    </h4>
                  </div>
                  <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100/80 px-2 py-0.5 rounded-md">
                    শুধুমাত্র এই কাস্টমারের ফোনেই যাবে
                  </span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={trackingNoteInput}
                    onChange={(e) => setTrackingNoteInput(e.target.value)}
                    placeholder="যেমন: রাইডার বনানী মোড়ে আছে / হাব থেকে রওনা হয়েছে..."
                    className="flex-1 bg-white border border-emerald-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#004b23]"
                  />
                  <button
                    onClick={() => handleSendTargetedLocation(selectedOrder.id, trackingNoteInput)}
                    disabled={isUpdatingTracking || !trackingNoteInput.trim()}
                    className="px-4 py-2 bg-[#004b23] hover:bg-[#003618] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isUpdatingTracking ? "পাঠানো হচ্ছে..." : "আপডেট পাঠান"}</span>
                  </button>
                </div>

                {/* Quick Preset Pills */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] font-bold text-gray-500">কুইক প্রিসেট:</span>
                  {[
                    "🛵 রাইডার আপনার ঠিকানায় রওনা হয়েছে",
                    "📦 প্যাকেজিং সম্পন্ন, কুরিয়ারে হস্তান্তর হয়েছে",
                    "🏢 ডেলিভারি হাবে পৌঁছেছে",
                    "⏱️ আগামী ১৫-২০ মিনিটের মধ্যে পৌঁছাবে",
                    "📍 রাইডার আপনার বাসার কাছাকাছি পৌঁছেছে"
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setTrackingNoteInput(preset)}
                      className="px-2.5 py-1 bg-white hover:bg-emerald-100 border border-emerald-200 rounded-lg text-[10px] font-bold text-[#004b23] transition-colors cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                {trackingUpdateSuccess && (
                  <p className="text-[11px] font-bold text-emerald-700 flex items-center gap-1 animate-fade-in">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>এই গ্রাহকের অ্যাপের ফ্লোটিং বাবলে লাইভ লোকেশন মেসেজ পৌঁছে দেওয়া হয়েছে!</span>
                  </p>
                )}
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-3">
                  <h4 className="text-xs font-black text-gray-400 uppercase flex items-center gap-2">
                    <User className="w-3.5 h-3.5" /> কাস্টমার ডিটেইলস
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                        <User className="w-4 h-4" />
                      </span>
                      <span className="text-sm font-black text-gray-900">{selectedOrder.customerName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                        <Phone className="w-4 h-4" />
                      </span>
                      <span className="text-sm font-bold text-gray-700">{selectedOrder.customerPhone}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-3">
                  <h4 className="text-xs font-black text-gray-400 uppercase flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5" /> ডেলিভারি ঠিকানা
                  </h4>
                  <div className="flex items-start gap-2">
                    <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
                      <MapPin className="w-4 h-4" />
                    </span>
                    <span className="text-xs font-medium text-gray-600 leading-relaxed">
                      {selectedOrder.customerAddress}
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-gray-400 uppercase">অর্ডার আইটেম</h4>
                <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase">পণ্য</th>
                        <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase text-center">পরিমাণ</th>
                        <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase text-right">মোট</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {selectedOrder.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-3">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-gray-800">{item.nameBn || item.name || "পণ্য"}</span>
                              {(!selectedOrder.categoryId || selectedOrder.categoryId === "cat3" || selectedOrder.categoryId === "clothing" || String(item.nameBn).includes("শার্ট") || String(item.nameBn).includes("পাঞ্জাবি") || String(item.nameBn).includes("বোরকা") || String(item.nameBn).includes("শাড়ি") || String(item.nameBn).includes("কাপড়") || String(item.nameBn).includes("প্যান্ট")) && (item.selectedSize || item.size) && (
                                <span className="inline-flex items-center w-fit px-2 py-0.5 bg-purple-50 text-[#5842dc] border border-purple-200 rounded-md text-[10px] font-black mt-1">
                                  👗 সাইজ: {item.selectedSize || item.size}
                                </span>
                              )}
                              {(!selectedOrder.categoryId || selectedOrder.categoryId === "cat3" || selectedOrder.categoryId === "clothing" || String(item.nameBn).includes("শার্ট") || String(item.nameBn).includes("পাঞ্জাবি") || String(item.nameBn).includes("বোরকা") || String(item.nameBn).includes("শাড়ি") || String(item.nameBn).includes("কাপড়") || String(item.nameBn).includes("প্যান্ট")) && (item.selectedColor || item.color) && (
                                <span className="inline-flex items-center w-fit px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md text-[10px] font-bold mt-0.5">
                                  রং: {item.selectedColor || item.color}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-xs font-black text-gray-600">{item.quantity} {item.unit || "পিস"}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-xs font-black text-gray-900">৳{(item.total || ((item.pricePerUnit || item.price || 0) * item.quantity) || 0).toLocaleString('bn-BD')}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total Calculation */}
              <div className="bg-[#5842dc]/5 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-gray-500">সাব-টোটাল:</span>
                  <span className="font-black text-gray-900">৳{(selectedOrder.totalItemPrice || 0).toLocaleString('bn-BD')}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-gray-500">ডেলিভারি চার্জ:</span>
                  <span className="font-black text-gray-900">৳{(selectedOrder.deliveryCharge || 0).toLocaleString('bn-BD')}</span>
                </div>
                <div className="pt-2 border-t border-gray-200 flex justify-between">
                  <span className="text-sm font-black text-gray-900">সর্বমোট:</span>
                  <span className="text-lg font-black text-[#5842dc]">৳{(selectedOrder.grandTotal || 0).toLocaleString('bn-BD')}</span>
                </div>
              </div>

              {/* Payment Info */}
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[140px] p-4 bg-gray-50 rounded-xl space-y-3">
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase block">পেমেন্ট মেথড</span>
                    <span className="text-sm font-black text-gray-900">{selectedOrder.paymentMethod}</span>
                  </div>
                  
                  {selectedOrder.paymentDetails && (
                    <div className="pt-2 border-t border-gray-200 space-y-1">
                      <div>
                        <span className="text-[10px] text-gray-500">প্রেরক:</span>
                        <span className="text-xs font-bold text-gray-900 ml-1">{selectedOrder.paymentDetails.senderNumber}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-500">TrxID:</span>
                        <span className="text-xs font-bold text-gray-900 ml-1 uppercase">{selectedOrder.paymentDetails.transactionId}</span>
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-gray-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">পেমেন্ট স্ট্যাটাস</span>
                      {selectedOrder.paymentStatus === 'paid' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> পেইড
                        </span>
                      ) : selectedOrder.paymentStatus === 'pending_verification' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                          <Clock className="w-3 h-3" /> ভেরিফিকেশন অপেক্ষায়
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                          <XCircle className="w-3 h-3" /> আনপেইড
                        </span>
                      )}
                    </div>
                    
                    {selectedOrder.paymentStatus === 'pending_verification' && (
                      <button 
                        onClick={() => updatePaymentStatus(selectedOrder.id, 'paid')}
                        className="text-[11px] font-bold bg-[#004b23] text-white px-3 py-1.5 rounded-lg hover:bg-[#00381a] transition-colors"
                      >
                        ভেরিফাই করুন
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-[140px] p-4 bg-gray-50 rounded-xl flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase block">অর্ডারের তারিখ</span>
                    <span className="text-sm font-bold text-gray-900">{formatDate(selectedOrder.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 flex items-center justify-between border-t border-gray-100">
              <button 
                onClick={() => deleteOrder(selectedOrder.id)}
                className="flex items-center gap-1.5 text-rose-500 hover:text-rose-600 text-xs font-black transition-all"
              >
                <Trash2 className="w-4 h-4" /> অর্ডার ডিলিট করুন
              </button>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="bg-gray-900 text-white px-6 py-2.5 rounded-xl text-xs font-black active:scale-95 transition-all shadow-md"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
