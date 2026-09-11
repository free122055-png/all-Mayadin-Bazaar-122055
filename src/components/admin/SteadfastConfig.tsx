import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, Save, ShieldCheck, Lock, Unlock, AlertCircle, 
  CheckCircle2, Globe, Key, RefreshCw, Activity, Play, X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { db } from "../../lib/firebase";
import { getApiUrl } from "../../lib/api";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";

interface SteadfastConfigProps {
  onBack: () => void;
}

interface ConfigData {
  apiKey: string;
  secretKey: string;
  baseUrl: string;
  status: string;
  enabled: boolean;
  lastTestTime?: number;
  lastTestSuccess?: boolean;
}

export const SteadfastConfig: React.FC<SteadfastConfigProps> = ({ onBack }) => {
  const [config, setConfig] = useState<any>({
    status: "not_configured",
    enabled: false,
    configured: false
  });
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const docSnap = await getDoc(doc(db, "configs", "integration_steadfast"));
      if (docSnap.exists()) {
        const data = docSnap.data();
        // PROPER SECURE ARCHITECTURE: Never read plaintext keys into frontend state
        const { apiKey, secretKey, ...metadata } = data;
        setConfig(metadata);
      }
    } catch (err: any) {
      console.warn("Notice: Steadfast config pending or offline:", err?.message || err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleInitialize = async () => {
    try {
      // PROPER SECURE ARCHITECTURE: Store ONLY non-sensitive metadata
      const metadataToSave = {
        integrationId: "integration_steadfast",
        providerId: "steadfast",
        category: "courier",
        enabled: false,
        status: "INACTIVE",
        configured: true,
        updatedAt: Date.now()
      };
      
      await setDoc(doc(db, "configs", "integration_steadfast"), metadataToSave);
      showToast("Integration Metadata Initialized", "success");
      fetchConfig();
    } catch (err: any) {
      showToast("Initialization failed: " + err.message, "error");
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      // SECURE: No keys sent in headers. Backend reads from server environment
      const res = await fetch(getApiUrl("/api/admin/integrations/steadfast/test"), { 
        method: "POST"
      });
      const result = await res.json();
      
      if (res.ok && result.success) {
        showToast("Connection Successful!", "success");
        await updateDoc(doc(db, "configs", "integration_steadfast"), {
          connectionTested: true,
          lastTestedAt: Date.now(),
          lastTestSuccess: true
        });
        fetchConfig();
      } else {
        showToast(result.error || "Connection Failed. Check Server Logs.", "error");
        await updateDoc(doc(db, "configs", "integration_steadfast"), {
          lastTestedAt: Date.now(),
          lastTestSuccess: false
        });
        fetchConfig();
      }
    } catch (err) {
      showToast("Server communication failed", "error");
    } finally {
      setTesting(false);
    }
  };

  const handleActivate = async () => {
    try {
      await updateDoc(doc(db, "configs", "integration_steadfast"), {
        enabled: true,
        status: "ACTIVE",
        activatedAt: Date.now()
      });
      showToast("Steadfast Integration Activated", "success");
      fetchConfig();
    } catch (err) {
      showToast("Activation failed", "error");
    }
  };

  const handleDeactivate = async () => {
    try {
      await updateDoc(doc(db, "configs", "integration_steadfast"), {
        enabled: false,
        status: "INACTIVE"
      });
      showToast("Integration Deactivated", "success");
      fetchConfig();
    } catch (err) {
      showToast("Deactivation failed", "error");
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center p-20">
      <RefreshCw className="w-8 h-8 animate-spin text-[#5842dc]" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-full transition-all text-gray-500"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
          {config.status === "ACTIVE" ? (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-black">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              ACTIVE
            </div>
          ) : (
            <div className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-black">
              INACTIVE
            </div>
          )}
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-[#5842dc] rounded-[32px] p-8 text-white overflow-hidden relative shadow-xl">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <ShieldCheck className="w-8 h-8" />
            <h2 className="text-2xl font-black">Secure Steadfast Gateway</h2>
          </div>
          <p className="text-white/80 text-sm font-medium leading-relaxed max-w-md">
            This integration uses the <b>Secure Backend Architecture</b>. Credentials are never stored in the browser or Firestore.
          </p>
        </div>
        <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
      </div>

      {/* Security Notice */}
      <div className="bg-amber-50 border border-amber-100 rounded-[32px] p-6 flex gap-4">
        <AlertCircle className="w-6 h-6 text-amber-500 shrink-0" />
        <div className="space-y-1">
          <p className="text-sm font-black text-amber-900">Credential Management</p>
          <p className="text-xs text-amber-800 leading-relaxed font-medium">
            To enable this integration, please set your <b>STEADFAST_API_KEY</b> and <b>STEADFAST_SECRET_KEY</b> in the 
            <b> Settings → Environment Variables</b> menu.
          </p>
        </div>
      </div>

      {/* Management Card */}
      <div className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm space-y-8">
        {!config.configured ? (
          <div className="text-center space-y-4 py-8">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
              <Globe className="w-8 h-8 text-gray-300" />
            </div>
            <div className="space-y-1">
              <h3 className="font-black text-gray-900">Not Initialized</h3>
              <p className="text-xs text-gray-400 font-medium">Setup the integration metadata to begin connectivity tests.</p>
            </div>
            <button 
              onClick={handleInitialize}
              className="px-8 py-4 bg-black text-white rounded-2xl text-sm font-black hover:bg-gray-900 transition-all active:scale-95 shadow-lg shadow-gray-200"
            >
              INITIALIZE INTEGRATION
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-gray-50 rounded-3xl space-y-2 border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Configuration</p>
                <p className="font-black text-gray-900">METADATA SYNCED</p>
              </div>
              <div className="p-6 bg-gray-50 rounded-3xl space-y-2 border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Connectivity</p>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${config.lastTestSuccess ? "bg-emerald-500" : "bg-rose-500"}`} />
                  <p className="font-black text-gray-900 uppercase">{config.lastTestSuccess ? "Verified" : "Unverified"}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <button 
                onClick={handleTest}
                disabled={testing}
                className="w-full bg-white border-2 border-[#5842dc] text-[#5842dc] py-5 rounded-2xl text-sm font-black flex items-center justify-center gap-2 hover:bg-[#5842dc]/5 transition-all active:scale-95 disabled:opacity-50"
              >
                {testing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Activity className="w-5 h-5" />}
                RUN SECURE CONNECTION TEST
              </button>

              <div className="flex gap-4">
                {config.enabled ? (
                  <button 
                    onClick={handleDeactivate}
                    className="flex-1 bg-rose-50 text-rose-600 py-5 rounded-2xl text-sm font-black flex items-center justify-center gap-2 hover:bg-rose-100 transition-all active:scale-95"
                  >
                    <X className="w-5 h-5" />
                    DEACTIVATE
                  </button>
                ) : (
                  <button 
                    onClick={handleActivate}
                    disabled={!config.lastTestSuccess}
                    className="flex-1 bg-emerald-600 text-white py-5 rounded-2xl text-sm font-black flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-emerald-100"
                  >
                    <Play className="w-5 h-5" />
                    ACTIVATE GATEWAY
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* History Footer */}
      {config.lastTestedAt && (
        <div className="px-8 flex items-center justify-between text-[10px] font-bold text-gray-400">
          <span>LAST TESTED: {new Date(config.lastTestedAt).toLocaleString()}</span>
          <span>PROVIDER ID: {config.providerId?.toUpperCase()}</span>
        </div>
      )}

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`fixed bottom-12 left-1/2 -translate-x-1/2 px-8 py-4 rounded-2xl shadow-2xl text-white text-xs font-black z-50 flex items-center gap-3 ${
              toast.type === "success" ? "bg-emerald-500" : "bg-rose-500"
            }`}
          >
            {toast.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
