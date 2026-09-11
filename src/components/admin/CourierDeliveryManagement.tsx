import React, { useEffect, useState } from "react";
import { db } from "../../lib/firebase";
import { getApiUrl } from "../../lib/api";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, getDoc } from "firebase/firestore";
import { 
  Truck, 
  Search, 
  Filter, 
  Eye, 
  CheckCircle, 
  CheckCircle2, 
  Clock, 
  X,
  ChevronRight,
  User,
  Phone,
  MapPin,
  Package,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  Play
} from "lucide-react";
import { Order } from "../../types";

export const CourierDeliveryManagement: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreatingDelivery, setIsCreatingDelivery] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; isError?: boolean } | null>(null);
  const [integrationActive, setIntegrationActive] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "food_orders"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      setOrders(ordersData);
      setLoading(false);
    }, (error) => {
      console.warn("Courier delivery listener notice:", error.message);
      setLoading(false);
    });

    // Check integration status from Firestore metadata (SECURE)
    const checkIntegration = async () => {
      try {
        const docSnap = await getDoc(doc(db, "configs", "integration_steadfast"));
        const data = docSnap.exists() ? docSnap.data() : null;
        
        // Metadata-only check: relies on backend having the real keys
        if (data && data.enabled && data.configured) {
          setIntegrationActive(true);
          setActionMessage(null);
        } else {
          setIntegrationActive(false);
        }
      } catch (err) {
        console.error("Integration check failed:", err);
      }
    };

    checkIntegration();

    return () => unsubscribe();
  }, []);

  const showMessage = (text: string, isError = false) => {
    setActionMessage({ text, isError });
    setTimeout(() => setActionMessage(null), 5000);
  };

  const createSteadfastDelivery = async (order: Order) => {
    if (order.deliveryInfo?.status !== 'not_created' && order.deliveryInfo?.consignmentId) {
      if (!window.confirm("এই অর্ডারের জন্য ইতিমধ্যে ডেলিভারি ক্রিয়েট করা হয়েছে। আপনি কি আবার ক্রিয়েট করতে চান?")) {
        return;
      }
    }

    setIsCreatingDelivery(true);
    try {
      // SECURE ARCHITECTURE: No keys fetched or sent in headers.
      // The backend proxy route reads credentials from server environment.
      const response = await fetch(getApiUrl("/api/delivery/steadfast/create-parcel"), {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          invoice: order.orderNumber,
          recipient_name: order.shippingAddress.name,
          recipient_phone: order.shippingAddress.phone,
          recipient_address: order.shippingAddress.fullAddress,
          cod_amount: order.codAmount,
          note: `Order from All Mayadin Bazar. Items: ${order.items.map(i => i.name).join(", ")}`
        })
      });

      const result = await response.json();

      if (response.ok && result.status === 200) {
        const orderRef = doc(db, "food_orders", order.id);
        await updateDoc(orderRef, {
          "deliveryInfo.provider": "steadfast",
          "deliveryInfo.status": "created",
          "deliveryInfo.trackingId": result.consignment.tracking_code,
          "deliveryInfo.consignmentId": result.consignment.consignment_id.toString(),
          "deliveryInfo.lastUpdated": Date.now(),
          "internalStatus": "processing",
          "updatedAt": Date.now()
        });
        
        showMessage("Steadfast ডেলিভারি সফলভাবে ক্রিয়েট হয়েছে!");
        if (selectedOrder?.id === order.id) {
          setIsModalOpen(false);
        }
      } else {
        const errorMsg = result.message || result.errors?.join(", ") || "ডেলিভারি ক্রিয়েট করতে ব্যর্থ হয়েছে।";
        showMessage(`Error: ${errorMsg}`, true);
      }
    } catch (error: any) {
      console.error("Steadfast Create Error:", error);
      showMessage(`ভুল: ${error.message}`, true);
    } finally {
      setIsCreatingDelivery(false);
    }
  };

  const syncDeliveryStatus = async (order: Order) => {
    if (!order.deliveryInfo?.trackingId) return;

    try {
      // SECURE: No keys sent. Backend handles credentials.
      const response = await fetch(getApiUrl(`/api/delivery/steadfast/track/${order.deliveryInfo.trackingId}`));
      
      const result = await response.json();

      if (response.ok && result.status === 200) {
        const orderRef = doc(db, "food_orders", order.id);
        await updateDoc(orderRef, {
          "deliveryInfo.status": mapSteadfastStatus(result.delivery_status),
          "deliveryInfo.lastUpdated": Date.now(),
          "updatedAt": Date.now()
        });
        showMessage(`স্ট্যাটাস আপডেট হয়েছে: ${result.delivery_status}`);
      }
    } catch (error) {
      console.error("Status Sync Error:", error);
    }
  };

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

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.shippingAddress?.phone?.includes(searchTerm) ||
      order.shippingAddress?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === "all" || (order.deliveryInfo?.status === filterStatus);
    
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "not_created": return "bg-gray-100 text-gray-700 border-gray-200";
      case "created": return "bg-blue-100 text-blue-700 border-blue-200";
      case "pickup_pending": return "bg-amber-100 text-amber-700 border-amber-200";
      case "picked_up": return "bg-indigo-100 text-indigo-700 border-indigo-200";
      case "in_transit": return "bg-purple-100 text-purple-700 border-purple-200";
      case "delivered": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "returned": return "bg-rose-100 text-rose-700 border-rose-200";
      case "failed": return "bg-red-100 text-red-700 border-red-200";
      case "cancelled": return "bg-gray-200 text-gray-800 border-gray-300";
      default: return "bg-gray-50 text-gray-500";
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
            <Truck className="w-8 h-8 text-[#5842dc]" />
            ডেলিভারি ম্যানেজমেন্ট
          </h2>
          <p className="text-sm text-gray-500 font-medium">কুরিয়ার ডেলিভারি এবং পার্সেল ট্র্যাকিং নিয়ন্ত্রণ করুন</p>
        </div>
      </div>

      {actionMessage && (
        <div className={`p-4 rounded-2xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 shadow-sm border ${
          actionMessage.isError ? "bg-rose-50 text-rose-700 border-rose-100" : "bg-emerald-50 text-emerald-700 border-emerald-100"
        }`}>
          <div className="flex items-center gap-3">
            {actionMessage.isError ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            <span className="text-sm font-bold">{actionMessage.text}</span>
          </div>
          <button 
            onClick={() => setActionMessage(null)}
            className="p-1 hover:bg-black/5 rounded-full transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {!integrationActive && !loading && (
        <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center gap-3 text-amber-700">
          <AlertCircle className="w-5 h-5" />
          <div className="flex flex-col">
            <span className="text-xs font-black">ইন্টিগ্রেশন সক্রিয় নেই</span>
            <span className="text-[10px] font-bold opacity-80 uppercase tracking-tighter">দয়া করে ইন্টিগ্রেশন সেন্টার থেকে এটি কনফিগার ও অ্যাক্টিভেট করুন।</span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="অর্ডার নং বা মোবাইল নম্বর..."
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
            <option value="all">সব ডেলিভারি</option>
            <option value="not_created">নট ক্রিয়েটেড</option>
            <option value="created">ক্রিয়েটেড</option>
            <option value="pickup_pending">পিকআপ পেন্ডিং</option>
            <option value="in_transit">ইন ট্রানজিট</option>
            <option value="delivered">ডেলিভারড</option>
            <option value="returned">রিটার্নড</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500 font-bold flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin" />
            লোড হচ্ছে...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-gray-500 font-bold">কোন ডেলিভারি তথ্য পাওয়া যায়নি</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase">অর্ডার নং</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase">কাস্টমার ও এলাকা</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase">ট্র্যাকিং আইডি</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase">ডেলিভারি স্ট্যাটাস</th>
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
                        <span className="text-sm font-bold text-gray-900">{order.shippingAddress.name}</span>
                        <span className="text-[10px] text-gray-500 font-medium">{order.shippingAddress.district}, {order.shippingAddress.area}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {order.deliveryInfo?.trackingId ? (
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-[#5842dc]">{order.deliveryInfo.trackingId}</span>
                          <span className="text-[9px] text-gray-400 font-bold uppercase">{order.deliveryInfo.provider}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-300 font-bold italic">No Tracking</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black border ${getStatusColor(order.deliveryInfo?.status || 'not_created')}`}>
                        {(order.deliveryInfo?.status || 'not_created').replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {order.deliveryInfo?.status === 'not_created' ? (
                          <button 
                            onClick={() => createSteadfastDelivery(order)}
                            disabled={isCreatingDelivery}
                            className="bg-[#5842dc] hover:bg-[#4b35cf] text-white px-3 py-1.5 rounded-xl text-[10px] font-black shadow-sm active:scale-95 transition-all disabled:opacity-50 flex items-center gap-1.5"
                          >
                            {isCreatingDelivery ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Package className="w-3 h-3" />}
                            ডেলিভারি ক্রিয়েট
                          </button>
                        ) : (
                          <button 
                            onClick={() => syncDeliveryStatus(order)}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                            title="সিঙ্ক স্ট্যাটাস"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => {
                            setSelectedOrder(order);
                            setIsModalOpen(true);
                          }}
                          className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl transition-all"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#5842dc]/10 text-[#5842dc] flex items-center justify-center">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900">ডেলিভারি ডিটেইলস</h3>
                  <p className="text-[11px] text-gray-500 font-bold">অর্ডার: #{selectedOrder.orderNumber}</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-all">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Delivery Status Card */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-gray-400 uppercase">ডেলিভারি স্ট্যাটাস</span>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black border ${getStatusColor(selectedOrder.deliveryInfo?.status || 'not_created')}`}>
                      {(selectedOrder.deliveryInfo?.status || 'not_created').replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
                {selectedOrder.deliveryInfo?.trackingId && (
                  <div className="text-right">
                    <span className="text-[10px] font-black text-gray-400 uppercase block">ট্র্যাকিং আইডি</span>
                    <span className="text-sm font-black text-[#5842dc]">{selectedOrder.deliveryInfo.trackingId}</span>
                  </div>
                )}
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-gray-400 uppercase block">গ্রাহক</span>
                  <p className="text-sm font-bold text-gray-800">{selectedOrder.shippingAddress.name}</p>
                </div>
                <div className="space-y-1 text-right">
                  <span className="text-[10px] font-black text-gray-400 uppercase block">মোবাইল</span>
                  <p className="text-sm font-bold text-gray-800">{selectedOrder.shippingAddress.phone}</p>
                </div>
                <div className="col-span-2 space-y-1 pt-2 border-t border-gray-50">
                  <span className="text-[10px] font-black text-gray-400 uppercase block">ঠিকানা</span>
                  <p className="text-xs font-medium text-gray-600 leading-relaxed">
                    {selectedOrder.shippingAddress.fullAddress}, {selectedOrder.shippingAddress.area}, {selectedOrder.shippingAddress.district}
                  </p>
                </div>
              </div>

              {/* Order Info */}
              <div className="bg-[#5842dc]/5 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#5842dc] shadow-sm">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase block">COD পরিমাণ</span>
                    <span className="text-lg font-black text-[#5842dc]">৳{(selectedOrder.codAmount || 0).toLocaleString('bn-BD')}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black text-gray-400 uppercase block">পেমেন্ট মেথড</span>
                  <span className="text-xs font-bold text-gray-700">{selectedOrder.paymentMethod.toUpperCase()}</span>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 flex items-center justify-between border-t border-gray-100">
              {selectedOrder.deliveryInfo?.status === 'not_created' ? (
                <button 
                  onClick={() => createSteadfastDelivery(selectedOrder)}
                  disabled={isCreatingDelivery}
                  className="bg-[#5842dc] text-white px-8 py-3 rounded-2xl text-xs font-black shadow-lg shadow-[#5842dc]/20 flex items-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isCreatingDelivery ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
                  ক্রিয়েট স্টিডফাস্ট পার্সেল
                </button>
              ) : (
                <a 
                  href={`https://portal.steadfast.com.bd/tracking/${selectedOrder.deliveryInfo?.trackingId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-[#5842dc] hover:underline text-xs font-black"
                >
                  <ExternalLink className="w-4 h-4" /> স্টিডফাস্ট ট্র্যাকিং পেজ
                </a>
              )}
              <button 
                onClick={() => setIsModalOpen(false)}
                className="bg-gray-200 text-gray-700 px-6 py-3 rounded-2xl text-xs font-black active:scale-95 transition-all"
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
