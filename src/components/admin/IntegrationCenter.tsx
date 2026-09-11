import React, { useState, useEffect } from "react";
import { Truck, MessageSquare, CreditCard, LayoutGrid, RefreshCw, Bell } from "lucide-react";
import { IntegrationCard } from "./IntegrationCard";
import { SteadfastConfig } from "./SteadfastConfig";
import { SmsConfig } from "./SmsConfig";
import { OneSignalConfig } from "./OneSignalConfig";
import { motion, AnimatePresence } from "motion/react";
import { db } from "../../lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

import { UserProfile } from "../../types";

interface IntegrationCenterProps {
  preSelectedUser?: UserProfile | null;
  clearPreSelectedUser?: () => void;
}

export const IntegrationCenter: React.FC<IntegrationCenterProps> = ({ preSelectedUser, clearPreSelectedUser }) => {
  const [view, setView] = useState<"list" | "steadfast" | "sms" | "onesignal">("list");
  const [integrations, setIntegrations] = useState<any>({
    steadfast: { status: "not_configured", enabled: false },
    sms: { status: "not_configured", enabled: false },
    onesignal: { 
      status: "ACTIVE", 
      enabled: true,
      configured: true,
      appId: "d28392ee-2a0f-4f62-ba65-03fb3e0915ab",
      imgbbApiKey: typeof process !== "undefined" && process.env?.IMGBB_API_KEY ? process.env.IMGBB_API_KEY : atob("NTJlY2Y5ZWI0NGYzMmQyYTg4ZDIxMGNhMzM5OWMwNTQ=")
    }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchIntegrations();
  }, []);

  // Handle direct navigation from User Management
  useEffect(() => {
    if (preSelectedUser) {
      setView("onesignal");
    }
  }, [preSelectedUser]);

  const fetchIntegrations = async () => {
    try {
      const [steadfastSnap, smsSnap, onesignalSnap] = await Promise.all([
        getDoc(doc(db, "configs", "integration_steadfast")).catch(() => null),
        getDoc(doc(db, "configs", "integration_sms")).catch(() => null),
        getDoc(doc(db, "configs", "integration_onesignal")).catch(() => null)
      ]);
      
      setIntegrations({
        steadfast: steadfastSnap?.exists() ? steadfastSnap.data() : { status: "not_configured", enabled: false },
        sms: smsSnap?.exists() ? smsSnap.data() : { status: "not_configured", enabled: false },
        onesignal: onesignalSnap?.exists() ? onesignalSnap.data() : { 
          status: "ACTIVE", 
          enabled: true,
          configured: true,
          appId: "d28392ee-2a0f-4f62-ba65-03fb3e0915ab",
          imgbbApiKey: typeof process !== "undefined" && process.env?.IMGBB_API_KEY ? process.env.IMGBB_API_KEY : atob("NTJlY2Y5ZWI0NGYzMmQyYTg4ZDIxMGNhMzM5OWMwNTQ=")
        }
      });
    } catch (err) {
      console.warn("Offline or failed to fetch integrations from Firestore, using default states:", err);
      setIntegrations({
        steadfast: { status: "not_configured", enabled: false },
        sms: { status: "not_configured", enabled: false },
        onesignal: { 
          status: "ACTIVE", 
          enabled: true,
          configured: true,
          appId: "d28392ee-2a0f-4f62-ba65-03fb3e0915ab",
          imgbbApiKey: typeof process !== "undefined" && process.env?.IMGBB_API_KEY ? process.env.IMGBB_API_KEY : atob("NTJlY2Y5ZWI0NGYzMmQyYTg4ZDIxMGNhMzM5OWMwNTQ=")
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      await updateDoc(doc(db, "configs", `integration_${id}`), {
        enabled,
        status: enabled ? "ACTIVE" : "INACTIVE"
      });
      fetchIntegrations();
    } catch (err) {
      console.error("Toggle failed:", err);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <AnimatePresence mode="wait">
        {view === "list" ? (
          <motion.div 
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-8"
          >
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Integration Center</h1>
              <p className="text-sm text-gray-500 font-medium">Connect and manage external services to power your software.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <IntegrationCard 
                name="Steadfast Courier"
                description="Automated delivery management, real-time tracking, and parcel creation for your orders."
                status={integrations.steadfast.status}
                icon={<Truck className="w-6 h-6 text-[#5842dc]" />}
                onConfigure={() => setView("steadfast")}
                onToggle={(enabled) => handleToggle("steadfast", enabled)}
              />

              <IntegrationCard 
                name="Bulk SMS Gateway"
                description="Send automated order confirmations and marketing SMS to your customers."
                status={integrations.sms.status}
                icon={<MessageSquare className="w-6 h-6 text-amber-500" />}
                onConfigure={() => setView("sms")}
                onToggle={(enabled) => handleToggle("sms", enabled)}
              />

              <IntegrationCard 
                name="OneSignal Push"
                description="Engage users with real-time push notifications across all devices and browsers."
                status={integrations.onesignal.status}
                icon={<Bell className="w-6 h-6 text-[#5842dc]" />}
                onConfigure={() => setView("onesignal")}
                onToggle={(enabled) => handleToggle("onesignal", enabled)}
              />

              <IntegrationCard 
                name="bKash Payment"
                description="Accept secure payments directly via bKash Checkout URL and manage refunds."
                status="not_configured"
                icon={<CreditCard className="w-6 h-6 text-pink-500" />}
                onConfigure={() => {}}
              />
            </div>
          </motion.div>
        ) : view === "steadfast" ? (
          <motion.div 
            key="steadfast"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <SteadfastConfig onBack={() => {
              setView("list");
              fetchIntegrations();
            }} />
          </motion.div>
        ) : view === "onesignal" ? (
          <motion.div 
            key="onesignal"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <OneSignalConfig 
              onBack={() => {
                if (clearPreSelectedUser) clearPreSelectedUser();
                setView("list");
                fetchIntegrations();
              }} 
              preSelectedUser={preSelectedUser}
              clearPreSelectedUser={clearPreSelectedUser}
            />
          </motion.div>
        ) : (
          <motion.div 
            key="sms"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <SmsConfig onBack={() => {
              setView("list");
              fetchIntegrations();
            }} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
