import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Bell, ArrowLeft, CheckCheck, Clock, Tag, Package, ChevronRight, 
  Sparkles, Megaphone, ShoppingBag, ExternalLink, ShieldCheck 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useNotificationContext, NotificationItem } from "../context/NotificationContext";
import { useAuth } from "../context/AuthContext";

export const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const { user, openAuthModal } = useAuth();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotificationContext();
  const [activeTab, setActiveTab] = useState<'all' | 'offers' | 'orders'>('all');

  const getIcon = (type?: string) => {
    switch (type) {
      case 'order':
        return <Package className="w-5 h-5 text-blue-600" />;
      case 'offer':
        return <Tag className="w-5 h-5 text-amber-500" />;
      case 'payment':
        return <CheckCheck className="w-5 h-5 text-emerald-600" />;
      case 'push':
        return <Megaphone className="w-5 h-5 text-purple-600" />;
      default:
        return <Bell className="w-5 h-5 text-[#004b23]" />;
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "কিছুক্ষণ আগে";
    let date: Date;
    if (typeof timestamp.toDate === 'function') {
      date = timestamp.toDate();
    } else if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }

    if (isNaN(date.getTime())) return "সম্প্রতি";

    return date.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }) + ", " + 
           date.toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' });
  };

  const filteredNotifications = notifications.filter(notif => {
    if (activeTab === 'offers') return notif.type === 'offer' || notif.type === 'push' || Boolean(notif.data?.productId);
    if (activeTab === 'orders') return notif.type === 'order';
    return true;
  });

  const handleNotificationClick = async (notif: NotificationItem) => {
    await markAsRead(notif.id);
    if (notif.link) {
      navigate(notif.link);
    } else if (notif.data?.productId) {
      navigate(`/product/${notif.data.productId}`);
    } else if (notif.data?.orderId) {
      navigate(`/food/tracking/${notif.data.orderId}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-24">
      {/* Header */}
      <div className="bg-[#004b23] px-5 pt-8 pb-6 rounded-b-[36px] shadow-lg sticky top-0 z-50 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)} 
              className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md active:scale-90 transition-transform text-white border border-white/10"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-black tracking-tight">বিজ্ঞপ্তি সেন্টার (Notifications)</h1>
              <p className="text-[11px] text-emerald-100 font-medium">সকল নোটিফিকেশন, অফার ও অর্ডার আপডেট</p>
            </div>
          </div>

          {unreadCount > 0 && (
            <button 
              onClick={markAllAsRead}
              className="text-[11px] font-black bg-[#ffb703] text-black px-3 py-1.5 rounded-xl shadow-md active:scale-95 transition-all flex items-center gap-1 shrink-0"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>পড়েছি</span>
            </button>
          )}
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 mt-5 bg-black/20 p-1 rounded-2xl border border-white/10">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${activeTab === 'all' ? 'bg-white text-[#004b23] shadow-md' : 'text-white/80 hover:text-white'}`}
          >
            সবগুলো ({notifications.length})
          </button>
          <button
            onClick={() => setActiveTab('offers')}
            className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${activeTab === 'offers' ? 'bg-white text-[#004b23] shadow-md' : 'text-white/80 hover:text-white'}`}
          >
            অফার ও আপডেট
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${activeTab === 'orders' ? 'bg-white text-[#004b23] shadow-md' : 'text-white/80 hover:text-white'}`}
          >
            অর্ডার ({notifications.filter(n => n.type === 'order').length})
          </button>
        </div>
      </div>

      {/* Guest Notice Banner if not logged in */}
      {!user && (
        <div className="mx-4 mt-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center shrink-0 font-bold">
              🔔
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900">লগইন ছাড়াই অফার দেখতে পাচ্ছেন</h4>
              <p className="text-[11px] text-gray-600">ব্যক্তিগত অর্ডার বিজ্ঞপ্তি পেতে একাউন্টে লগইন করুন</p>
            </div>
          </div>
          <button
            onClick={() => openAuthModal('login')}
            className="px-3 py-1.5 bg-[#004b23] text-white text-xs font-bold rounded-xl shadow-xs shrink-0"
          >
            লগইন
          </button>
        </div>
      )}

      {/* Main List */}
      <div className="p-4 space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-10 h-10 border-4 border-[#004b23] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-gray-400 font-bold">নোটিফিকেশন লোড হচ্ছে...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="w-20 h-20 bg-emerald-50 text-[#004b23] rounded-3xl flex items-center justify-center shadow-xs">
              <Bell className="w-10 h-10 stroke-[1.5]" />
            </div>
            <div className="space-y-1 max-w-xs">
              <h3 className="text-base font-black text-gray-900">কোনো নোটিফিকেশন নেই</h3>
              <p className="text-xs text-gray-500 font-medium">
                {activeTab === 'offers' ? "বর্তমানে নতুন কোনো বিশেষ অফার নেই।" : activeTab === 'orders' ? "আপনার কোনো সাম্প্রতিক অর্ডার নোটিফিকেশন নেই।" : "আপনার সকল সিস্টেম নোটিফিকেশন, পুশ বার্তা ও অফার এখানে যুক্ত হবে।"}
              </p>
            </div>
          </div>
        ) : (
          <AnimatePresence>
            {filteredNotifications.map((notif, i) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
                onClick={() => handleNotificationClick(notif)}
                className={`bg-white p-4 rounded-3xl shadow-xs border transition-all cursor-pointer relative overflow-hidden active:scale-[0.99] ${
                  !notif.read ? 'border-emerald-200 bg-emerald-50/30 ring-1 ring-emerald-500/20' : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                {!notif.read && (
                  <div className="absolute top-4 right-4 flex items-center gap-1.5">
                    <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">নতুন</span>
                    <span className="w-2.5 h-2.5 bg-[#ffb703] rounded-full shadow-[0_0_8px_#ffb703] animate-pulse"></span>
                  </div>
                )}

                <div className="flex items-start gap-3.5">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${!notif.read ? 'bg-white border border-emerald-100' : 'bg-gray-100'}`}>
                    {getIcon(notif.type)}
                  </div>

                  <div className="flex-1 min-w-0 pr-12">
                    <h4 className={`text-sm font-black leading-snug ${!notif.read ? 'text-gray-900' : 'text-gray-700'}`}>
                      {notif.title}
                    </h4>
                    
                    <p className="text-xs text-gray-600 font-medium leading-relaxed mt-1">
                      {notif.message || notif.body}
                    </p>

                    {/* Image Banner Thumbnail if attached */}
                    {notif.imageUrl && (
                      <div className="mt-2.5 rounded-2xl overflow-hidden border border-gray-100 max-h-48 bg-gray-50">
                        <img 
                          src={notif.imageUrl} 
                          alt="Notification banner" 
                          className="w-full h-full object-cover" 
                          loading="lazy"
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-400 font-bold">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span>{formatDate(notif.createdAt)}</span>
                      </div>

                      {(notif.link || notif.data?.productId || notif.data?.orderId) && (
                        <span className="text-[#004b23] font-black flex items-center gap-0.5 hover:underline">
                          দেখুন <ChevronRight className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};
