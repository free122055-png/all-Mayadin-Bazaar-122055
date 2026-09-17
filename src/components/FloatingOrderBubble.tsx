import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  Truck, 
  Package, 
  Clock, 
  CheckCircle2, 
  X, 
  ChevronRight, 
  Radio, 
  Sparkles,
  MapPin
} from "lucide-react";
import { db } from "../lib/firebase";
import { collection, query, where, orderBy, limit, onSnapshot, doc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { 
  DEFAULT_BUBBLE_CONFIG, 
  FloatingBubbleConfig, 
  getOrderStatusInfo, 
  playInAppBubbleChime, 
  triggerInAppVibration 
} from "../lib/floatingBubbleService";

interface ActiveOrderData {
  id: string;
  orderNumber?: string;
  status: string;
  internalStatus?: string;
  trackingMessage?: string;
  currentLocation?: string;
  total?: number;
  itemsCount?: number;
  updatedAt?: number;
  createdAt?: any;
  deliveryInfo?: any;
  shippingAddress?: any;
}

export const FloatingOrderBubble: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile } = useAuth();

  // Config & State
  const [config, setConfig] = useState<FloatingBubbleConfig>(DEFAULT_BUBBLE_CONFIG);
  const [activeOrder, setActiveOrder] = useState<ActiveOrderData | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasNewUpdate, setHasNewUpdate] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Dragging detection refs
  const isDraggingRef = useRef(false);
  const dragStartPosRef = useRef({ x: 0, y: 0 });
  const prevStatusRef = useRef<Record<string, string>>({});
  const prevMessageRef = useRef<Record<string, string>>({});
  const initialLoadDoneRef = useRef(false);
  const autoCollapseTimerRef = useRef<any>(null);

  // 1. Subscribe to Admin Global Settings from Firestore
  useEffect(() => {
    const unsubConfig = onSnapshot(doc(db, "settings", "floating_bubble"), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as Partial<FloatingBubbleConfig>;
        setConfig((prev) => ({ ...prev, ...data }));
      }
    }, (err) => {
      console.warn("Floating bubble config listener notice:", err);
    });

    return () => unsubConfig();
  }, []);

  // 2. Demo Trigger listener for Admin preview
  useEffect(() => {
    const handleDemoEvent = (e: CustomEvent<any>) => {
      const demoOrder: ActiveOrderData = e.detail || {
        id: "demo-order-101",
        orderNumber: "DEMO-8821",
        status: "shipped",
        trackingMessage: "রাইডার আপনার বাড়ির পথে রওনা হয়েছে 🛵",
        total: 1250,
        itemsCount: 3,
        updatedAt: Date.now()
      };
      setIsDemoMode(true);
      setActiveOrder(demoOrder);
      setIsDismissed(false);
      setIsExpanded(true);
      setHasNewUpdate(true);
      playInAppBubbleChime();
      triggerInAppVibration();

      if (autoCollapseTimerRef.current) clearTimeout(autoCollapseTimerRef.current);
      autoCollapseTimerRef.current = setTimeout(() => {
        setIsExpanded(false);
      }, 7000);
    };

    window.addEventListener("trigger-floating-bubble-demo" as any, handleDemoEvent);
    return () => window.removeEventListener("trigger-floating-bubble-demo" as any, handleDemoEvent);
  }, []);

  // 3. Subscribe to Realtime User Active Orders from Firestore
  useEffect(() => {
    if (!config.enabled || isDemoMode) return;

    let unsubUserOrders: (() => void) | null = null;
    let unsubGuestOrder: (() => void) | null = null;

    const handleOrdersSnapshot = (docs: any[]) => {
      if (!docs || docs.length === 0) {
        if (!unsubGuestOrder) setActiveOrder(null);
        return;
      }

      // Find the most recent active order
      const ordersList: ActiveOrderData[] = docs
        .map((d) => {
          if (!d) return null;
          const data = typeof d.data === "function" ? d.data() : (d.data || d);
          if (!data) return null;
          return {
            id: d.id || data.id || "order_temp",
            orderNumber: data.orderNumber || data.orderId || (d.id ? d.id.slice(0, 8).toUpperCase() : "অর্ডার"),
            status: data.status || data.internalStatus || "pending",
            internalStatus: data.internalStatus,
            trackingMessage: data.trackingMessage || data.currentLocation || data.note || "",
            currentLocation: data.currentLocation || data.trackingMessage || "",
            total: data.total || data.grandTotal || 0,
            itemsCount: data.items?.length || 1,
            updatedAt: data.updatedAt || (data.createdAt?.seconds ? data.createdAt.seconds * 1000 : Date.now()),
            createdAt: data.createdAt,
            deliveryInfo: data.deliveryInfo,
            shippingAddress: data.shippingAddress
          };
        })
        .filter(Boolean) as ActiveOrderData[];

      // Filter: Keep active orders (not cancelled; if delivered, only if updated recently)
      const now = Date.now();
      const maxDeliveredAge = (config.showOnDeliveredMinutes || 120) * 60 * 1000;

      const candidates = ordersList.filter((ord) => {
        if (!ord) return false;
        const s = (ord.status || "").toLowerCase();
        if (s === "cancelled" || s === "বাতিল") return false;
        if (s === "delivered" || s === "completed" || s === "ডেলিভারি সম্পন্ন") {
          const elapsed = now - (ord.updatedAt || now);
          return elapsed < maxDeliveredAge;
        }
        return true;
      });

      if (candidates.length === 0) {
        setActiveOrder(null);
        return;
      }

      // Sort by latest updated first
      candidates.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

      // Pick the primary active candidate
      const current = candidates[0];
      if (!current || !current.id) {
        setActiveOrder(null);
        return;
      }

      const prevStatus = prevStatusRef.current[current.id];
      const prevMessage = prevMessageRef.current[current.id];
      const isStatusChanged = prevStatus !== undefined && prevStatus !== current.status;
      const isMessageChanged = prevMessage !== undefined && prevMessage !== current.trackingMessage && Boolean(current.trackingMessage);

      // Check if user previously dismissed this exact status
      const dismissedKey = `bubble_dismissed_${current.id}_${current.status || "pending"}`;
      const isLocallyDismissed = sessionStorage.getItem(dismissedKey) === "true";

      if (isStatusChanged || isMessageChanged) {
        // Status or targeted live message updated in realtime by Admin!
        sessionStorage.removeItem(dismissedKey);
        setIsDismissed(false);
        setIsExpanded(true);
        setHasNewUpdate(true);

        if (config.soundEnabled) playInAppBubbleChime();
        if (config.vibrationEnabled) triggerInAppVibration();

        if (autoCollapseTimerRef.current) clearTimeout(autoCollapseTimerRef.current);
        autoCollapseTimerRef.current = setTimeout(() => {
          setIsExpanded(false);
        }, (config.bannerDurationSeconds || 7) * 1000);
      } else if (!initialLoadDoneRef.current && !isLocallyDismissed) {
        // First load
        setIsDismissed(false);
      } else if (isLocallyDismissed) {
        setIsDismissed(true);
      }

      prevStatusRef.current[current.id] = current.status;
      prevMessageRef.current[current.id] = current.trackingMessage || "";
      initialLoadDoneRef.current = true;
      setActiveOrder(current);
    };

    const userDocsMap = new Map<string, any>();
    const unsubList: (() => void)[] = [];

    const syncAllDocs = () => {
      handleOrdersSnapshot(Array.from(userDocsMap.values()));
    };

    // If logged in, listen to user orders by userId (without composite orderBy to avoid index error)
    if (user?.uid) {
      const qUser = query(
        collection(db, "food_orders"),
        where("userId", "==", user.uid)
      );

      const unsub1 = onSnapshot(qUser, (snapshot) => {
        snapshot.docs.forEach((d) => userDocsMap.set(d.id, d));
        syncAllDocs();
      }, (err) => {
        console.warn("User orders live listener note:", err);
      });
      unsubList.push(unsub1);

      // Listen to direct targeted in-app bubble by userId
      const unsubUserBubble = onSnapshot(doc(db, "user_bubbles", user.uid), (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data && data.active !== false && data.trackingMessage) {
            userDocsMap.set(`user_bubble_${user.uid}`, {
              id: `user_bubble_${user.uid}`,
              data: () => ({
                id: `bubble_${user.uid}`,
                orderNumber: data.orderNumber || "লাইভ ট্র্যাকিং",
                status: data.status || "processing",
                trackingMessage: data.trackingMessage,
                currentLocation: data.currentLocation || data.trackingMessage,
                updatedAt: data.updatedAt || Date.now(),
                createdAt: data.createdAt,
                customerName: data.customerName,
                isDirectMessage: true
              })
            });
            syncAllDocs();
          }
        }
      }, (err) => {
        console.warn("User bubble note:", err);
      });
      unsubList.push(unsubUserBubble);

      // Also query by phone number if present in profile
      const userPhone = profile?.phoneNumber || (user as any)?.phoneNumber;
      if (userPhone) {
        const qPhone = query(
          collection(db, "food_orders"),
          where("customerPhone", "==", userPhone)
        );
        const unsub2 = onSnapshot(qPhone, (snapshot) => {
          snapshot.docs.forEach((d) => userDocsMap.set(d.id, d));
          syncAllDocs();
        }, (err) => {
          console.warn("User phone live listener note:", err);
        });
        unsubList.push(unsub2);

        // Listen to direct targeted in-app bubble by phone number
        const cleanPhone = userPhone.replace(/[^\d]/g, "");
        if (cleanPhone) {
          const unsubPhoneBubble = onSnapshot(doc(db, "user_bubbles", cleanPhone), (snap) => {
            if (snap.exists()) {
              const data = snap.data();
              if (data && data.active !== false && data.trackingMessage) {
                userDocsMap.set(`user_bubble_${cleanPhone}`, {
                  id: `user_bubble_${cleanPhone}`,
                  data: () => ({
                    id: `bubble_${cleanPhone}`,
                    orderNumber: data.orderNumber || "লাইভ ট্র্যাকিং",
                    status: data.status || "processing",
                    trackingMessage: data.trackingMessage,
                    currentLocation: data.currentLocation || data.trackingMessage,
                    updatedAt: data.updatedAt || Date.now(),
                    createdAt: data.createdAt,
                    customerName: data.customerName,
                    isDirectMessage: true
                  })
                });
                syncAllDocs();
              }
            }
          }, (err) => {
            console.warn("Phone bubble note:", err);
          });
          unsubList.push(unsubPhoneBubble);
        }
      }
    }

    // Also check last placed order id from localStorage for instant visibility
    const lastPlacedId = localStorage.getItem("last_placed_order_id");
    if (lastPlacedId) {
      const unsub3 = onSnapshot(doc(db, "food_orders", lastPlacedId), (docSnap) => {
        if (docSnap.exists()) {
          userDocsMap.set(docSnap.id, docSnap);
          syncAllDocs();
        }
      }, (err) => {
        console.warn("Guest order listener note:", err);
      });
      unsubList.push(unsub3);
    }

    return () => {
      unsubList.forEach((u) => u());
      if (autoCollapseTimerRef.current) clearTimeout(autoCollapseTimerRef.current);
    };
  }, [user?.uid, profile?.phoneNumber, config.enabled, config.soundEnabled, config.vibrationEnabled, config.bannerDurationSeconds, isDemoMode]);

  // If globally disabled, or no active order, or dismissed, don't show
  if (!config.enabled || !activeOrder || isDismissed) {
    return null;
  }

  // Do not show bubble on Admin pages to keep admin workspace clean
  if (location.pathname.startsWith("/admin") || location.pathname.startsWith("/super-admin")) {
    if (!isDemoMode) return null;
  }

  // Determine current status styling and labels
  const statusInfo = getOrderStatusInfo(activeOrder.status);

  // Status icon selector
  const getStatusIcon = () => {
    switch (statusInfo.step) {
      case 1:
        return <Clock className="w-5 h-5 text-white" />;
      case 2:
        return <Package className="w-5 h-5 text-white" />;
      case 3:
        return <Package className="w-5 h-5 text-white animate-pulse" />;
      case 4:
        return <Truck className="w-5 h-5 text-white animate-bounce" />;
      case 5:
        return <CheckCircle2 className="w-5 h-5 text-white" />;
      default:
        return <Truck className="w-5 h-5 text-white" />;
    }
  };

  // Handle Bubble Click (Navigates to Order Tracking / Details)
  const handleBubbleClick = (e: React.MouseEvent) => {
    // If the user was dragging, do not navigate!
    if (isDraggingRef.current) return;

    e.stopPropagation();
    setHasNewUpdate(false);
    setIsExpanded(false);

    if (isDemoMode || activeOrder.id?.startsWith("bubble_") || (activeOrder as any).isDirectMessage) {
      navigate("/orders");
      return;
    }

    // Determine correct tracking route
    const isFoodOrder = location.pathname.startsWith("/food");
    if (isFoodOrder) {
      navigate(`/food/order/${activeOrder.id}`);
    } else {
      navigate(`/order/${activeOrder.id}`);
    }
  };

  // Handle Dismiss (Dismisses ONLY in-app bubble UI; NEVER touches order or DB)
  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDismissed(true);
    setIsExpanded(false);
    if (!isDemoMode && activeOrder?.id) {
      sessionStorage.setItem(`bubble_dismissed_${activeOrder.id}_${activeOrder.status || "pending"}`, "true");
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0.12}
        onDragStart={(_event, info) => {
          isDraggingRef.current = true;
          dragStartPosRef.current = { x: info.point.x, y: info.point.y };
        }}
        onDragEnd={(_event, info) => {
          // If moved less than 6px, treat as tap/click
          const dist = Math.hypot(
            info.point.x - dragStartPosRef.current.x,
            info.point.y - dragStartPosRef.current.y
          );
          if (dist < 6) {
            isDraggingRef.current = false;
          } else {
            setTimeout(() => {
              isDraggingRef.current = false;
            }, 120);
          }
        }}
        initial={{ opacity: 0, scale: 0.6, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
        className="fixed z-[999] touch-none select-none cursor-grab active:cursor-grabbing"
        style={{
          bottom: "95px",
          right: "18px"
        }}
      >
        <div className="relative flex items-center flex-row-reverse gap-2">
          
          {/* Main Messenger-style Circular Bubble */}
          <div 
            onClick={handleBubbleClick}
            className="relative group cursor-pointer"
          >
            {/* Live Radar Ping / Ripple Effect when new update or in progress */}
            {hasNewUpdate && (
              <span 
                className="absolute -inset-2 rounded-full animate-ping opacity-60"
                style={{ backgroundColor: statusInfo.pulseColor }}
              />
            )}
            
            {/* Subtle outer glow ring */}
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-[#004b23] rounded-full blur-[2px] opacity-40 group-hover:opacity-70 transition-opacity" />

            {/* Bubble Base */}
            <div className="relative w-14 h-14 rounded-full bg-[#004b23] border-2 border-emerald-400/90 shadow-2xl flex items-center justify-center text-white overflow-hidden transition-transform group-hover:scale-105 active:scale-95">
              
              {/* Dynamic Status Color Accent in Background */}
              <div 
                className={`absolute inset-0 opacity-25 ${statusInfo.badgeColor}`} 
              />
              
              {/* Center Status Icon */}
              <div className="relative z-10">
                {getStatusIcon()}
              </div>

              {/* Live Status indicator arc */}
              <div className="absolute bottom-0 inset-x-0 h-1.5 bg-emerald-400 animate-pulse" />
            </div>

            {/* Unread Alert Dot / Badge */}
            {hasNewUpdate && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 border-2 border-white rounded-full flex items-center justify-center text-[9px] font-black text-white shadow-md animate-bounce">
                1
              </div>
            )}

            {/* Close / Dismiss '×' Button at Top-Left of Bubble */}
            <button
              onClick={handleDismiss}
              title="বাবল সরান (অর্ডার অপরিবর্তিত থাকবে)"
              className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-gray-900/85 hover:bg-rose-600 text-white rounded-full flex items-center justify-center shadow-md border border-white/80 transition-all active:scale-75"
            >
              <X className="w-3 h-3 stroke-[2.5]" />
            </button>
          </div>

          {/* Interactive Floating Status Pill Banner (Slides out to inform user) */}
          <AnimatePresence>
            {isExpanded ? (
              <motion.div
                initial={{ opacity: 0, x: 20, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.9 }}
                onClick={handleBubbleClick}
                className="bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-2xl shadow-xl border border-gray-200/90 flex items-center gap-3 cursor-pointer max-w-[240px] sm:max-w-[280px] active:scale-98 transition-transform"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black text-[#004b23] uppercase tracking-wider truncate">
                      অর্ডার #{activeOrder.orderNumber}
                    </span>
                  </div>
                  {activeOrder.trackingMessage ? (
                    <div className="space-y-0.5">
                      <p className="text-[11px] font-black text-emerald-800 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-rose-500 shrink-0 inline animate-bounce" />
                        <span className="truncate">{activeOrder.trackingMessage}</span>
                      </p>
                      <p className="text-[10px] text-gray-500">
                        {statusInfo.title}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs font-bold text-gray-900 truncate">
                      {statusInfo.title}
                    </p>
                  )}
                  <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                    <span>লাইভ ট্র্যাক করতে ট্যাপ করুন</span>
                    <ChevronRight className="w-3 h-3 text-emerald-600 inline" />
                  </p>
                </div>

                <button
                  onClick={handleDismiss}
                  title="হাইড করুন"
                  className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ) : (
              /* Compact Mini Label Pill */
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => setIsExpanded(true)}
                className={`hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black shadow-md border backdrop-blur-md transition-all ${statusInfo.bgLight} ${statusInfo.textColor} ${statusInfo.borderLight}`}
              >
                <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-600" />
                <span>{statusInfo.shortLabel}</span>
              </motion.button>
            )}
          </AnimatePresence>

        </div>
      </motion.div>
    </AnimatePresence>
  );
};
