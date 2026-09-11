import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, Save, ShieldCheck, Lock, Unlock, AlertCircle, 
  CheckCircle2, Globe, Key, RefreshCw, Activity, MessageSquare, 
  Play, X, Users, UserPlus, History, Settings, Send, Trash2, 
  Search, Plus, Check, Clock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { db } from "../../lib/firebase";
import { getApiUrl } from "../../lib/api";
import { sendSms as executeSendSms } from "../../lib/smsService";
import { 
  doc, setDoc, getDoc, updateDoc, collection, 
  query, getDocs, addDoc, orderBy, limit, where,
  serverTimestamp 
} from "firebase/firestore";

interface SmsConfigProps {
  onBack: () => void;
}

type TabType = "config" | "manager" | "history";

export const SmsConfig: React.FC<SmsConfigProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<TabType>("config");
  const [config, setConfig] = useState<any>({
    status: "not_configured",
    enabled: false,
    configured: false,
    masterEnabled: true,
    otpVerificationEnabled: false,
    welcomeSmsEnabled: false,
    welcomeSmsText: "আল মায়াদীন বাজারে আপনাকে স্বাগতম। আপনার অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে।"
  });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Manager State
  const [smsType, setSmsType] = useState<"all" | "selected" | "manual">("manual");
  const [recipients, setRecipients] = useState<string>("");
  const [message, setMessage] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchConfig();
    fetchHistory();
    fetchUsers();
  }, []);

  const fetchConfig = async () => {
    try {
      const docSnap = await getDoc(doc(db, "configs", "integration_sms"));
      if (docSnap.exists()) {
        const data = docSnap.data();
        const { apiKey, secretKey, senderId, baseUrl, ...metadata } = data;
        setConfig((prev: any) => ({ ...prev, ...metadata }));
      }
    } catch (err: any) {
      console.warn("Notice: SMS config pending or offline:", err?.message || err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const q = query(collection(db, "sms_history"), orderBy("createdAt", "desc"), limit(20));
      const querySnapshot = await getDocs(q);
      const historyData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHistory(historyData);
    } catch (err) {
      console.error("Failed to fetch history:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const usersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersData);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  };

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const saveConfig = async (updates: any) => {
    try {
      setProcessing(true);
      const docRef = doc(db, "configs", "integration_sms");
      
      // Optimistically update local state first for immediate UI feedback
      setConfig((prev: any) => ({ ...prev, ...updates }));

      await setDoc(docRef, {
        ...updates,
        updatedAt: Date.now()
      }, { merge: true });
      
      showToast("Settings Updated", "success");
    } catch (err) {
      console.error("Save Config Error:", err);
      showToast("Failed to save settings", "error");
      // Revert if failed
      fetchConfig();
    } finally {
      setProcessing(false);
    }
  };

  const sendSms = async (numbers: string[], smsContent: string, type: string) => {
    if (!config.masterEnabled) {
      showToast("Master SMS Service is OFF", "error");
      return;
    }

    try {
      setProcessing(true);
      let successCount = 0;

      for (const num of numbers) {
        const sendResult = await executeSendSms(num, smsContent, type, "Admin");
        if (sendResult.success) {
          successCount++;
        }
      }

      showToast(`Sent ${successCount} of ${numbers.length} messages`, successCount > 0 ? "success" : "error");
      fetchHistory();
      setShowPreview(false);
      if (smsType === "manual") setRecipients("");
      setMessage("");
      setSelectedUsers([]);
    } catch (err: any) {
      showToast("Failed to send: " + err.message, "error");
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkSend = () => {
    let targetNumbers: string[] = [];

    if (smsType === "all") {
      targetNumbers = users.map(u => u.phone).filter(p => p);
    } else if (smsType === "selected") {
      targetNumbers = users.filter(u => selectedUsers.includes(u.id)).map(u => u.phone).filter(p => p);
    } else {
      targetNumbers = recipients.split(/[\n,]/).map(n => n.trim()).filter(n => n.length >= 10);
    }

    if (targetNumbers.length === 0) {
      showToast("No valid recipients found", "error");
      return;
    }

    if (!message) {
      showToast("Message content is required", "error");
      return;
    }

    sendSms(targetNumbers, message, smsType === "all" ? "All Users" : smsType === "selected" ? "Selected Users" : "Manual Number");
  };

  if (loading) return (
    <div className="flex items-center justify-center p-20">
      <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 px-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-all text-gray-500"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-black text-gray-900">SMS & OTP Settings</h2>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-2xl">
          <button 
            onClick={() => setActiveTab("config")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${activeTab === "config" ? "bg-white shadow-sm text-black" : "text-gray-500"}`}
          >
            <Settings className="w-4 h-4 inline-block mr-1.5" />
            CONFIG
          </button>
          <button 
            onClick={() => setActiveTab("manager")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${activeTab === "manager" ? "bg-white shadow-sm text-black" : "text-gray-500"}`}
          >
            <Send className="w-4 h-4 inline-block mr-1.5" />
            MANAGER
          </button>
          <button 
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${activeTab === "history" ? "bg-white shadow-sm text-black" : "text-gray-500"}`}
          >
            <History className="w-4 h-4 inline-block mr-1.5" />
            HISTORY
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "config" && (
          <motion.div 
            key="config"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            {/* Master Toggle & OTP Toggle */}
            <div className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm space-y-6">
              {/* Existing SMS Master Toggle */}
              <div className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl border border-gray-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-gray-900">SMS SERVICE</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${config.masterEnabled ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-600"}`}>
                      {config.masterEnabled ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 font-medium">Enable or disable all SMS features software-wide.</p>
                </div>
                <button 
                  onClick={async () => {
                    const newStatus = !config.masterEnabled;
                    await saveConfig({ masterEnabled: newStatus });
                  }}
                  disabled={processing}
                  className={`w-16 h-8 rounded-full relative transition-all duration-300 ${config.masterEnabled ? "bg-emerald-500" : "bg-gray-200"} ${processing ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all duration-300 ${config.masterEnabled ? "right-1" : "left-1"}`} />
                </button>
              </div>

              {/* Independent OTP Verification Toggle (Phase 2 & 14) */}
              <div className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl border border-gray-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-gray-900">OTP VERIFICATION</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${config.otpVerificationEnabled ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-600"}`}>
                      {config.otpVerificationEnabled ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 font-medium">Require 6-digit SMS OTP verification for new user registration.</p>
                </div>
                <button 
                  onClick={async () => {
                    const newStatus = !config.otpVerificationEnabled;
                    await saveConfig({ otpVerificationEnabled: newStatus });
                  }}
                  disabled={processing}
                  className={`w-16 h-8 rounded-full relative transition-all duration-300 ${config.otpVerificationEnabled ? "bg-emerald-500" : "bg-gray-200"} ${processing ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all duration-300 ${config.otpVerificationEnabled ? "right-1" : "left-1"}`} />
                </button>
              </div>

              {/* Welcome SMS */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl border border-gray-100">
                  <div className="space-y-1">
                    <h3 className="font-black text-gray-900">NEW ACCOUNT WELCOME SMS</h3>
                    <p className="text-xs text-gray-400 font-medium">Send automatic welcome message to new users.</p>
                  </div>
                  <button 
                    onClick={async () => {
                      const newStatus = !config.welcomeSmsEnabled;
                      await saveConfig({ welcomeSmsEnabled: newStatus });
                    }}
                    disabled={processing}
                    className={`w-16 h-8 rounded-full relative transition-all duration-300 ${config.welcomeSmsEnabled ? "bg-emerald-500" : "bg-gray-200"} ${processing ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all duration-300 ${config.welcomeSmsEnabled ? "right-1" : "left-1"}`} />
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Welcome Message Text</label>
                  <textarea 
                    value={config.welcomeSmsText}
                    onChange={(e) => setConfig({ ...config, welcomeSmsText: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20 h-24 resize-none transition-all"
                  />
                  <button 
                    onClick={() => saveConfig({ welcomeSmsText: config.welcomeSmsText })}
                    className="flex items-center gap-2 text-xs font-black text-amber-600 hover:text-amber-700 p-2 transition-all"
                  >
                    <Save className="w-4 h-4" />
                    SAVE WELCOME TEXT
                  </button>
                </div>
              </div>
            </div>

            {/* Existing Provider Info */}
            <div className="bg-amber-50 border border-amber-100 rounded-[32px] p-6 space-y-4">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-amber-600" />
                <h3 className="text-sm font-black text-amber-900 uppercase tracking-widest">Gateway Provider Status</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/50 p-4 rounded-2xl border border-amber-200">
                  <p className="text-[10px] font-black text-amber-600/60 uppercase">API Status</p>
                  <p className="text-sm font-black text-amber-900">{config.status || "UNKNOWN"}</p>
                </div>
                <div className="bg-white/50 p-4 rounded-2xl border border-amber-200">
                  <p className="text-[10px] font-black text-amber-600/60 uppercase">Last Verified</p>
                  <p className="text-sm font-black text-amber-900">{config.lastTestedAt ? new Date(config.lastTestedAt).toLocaleDateString() : "NEVER"}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "manager" && (
          <motion.div 
            key="manager"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm space-y-8">
              {/* Recipient Selection */}
              <div className="space-y-4">
                <div className="flex bg-gray-50 p-1 rounded-2xl">
                  <button 
                    onClick={() => setSmsType("manual")}
                    className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${smsType === "manual" ? "bg-white shadow-sm text-black" : "text-gray-500"}`}
                  >
                    DIRECT NUMBERS
                  </button>
                  <button 
                    onClick={() => setSmsType("selected")}
                    className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${smsType === "selected" ? "bg-white shadow-sm text-black" : "text-gray-500"}`}
                  >
                    SELECT USERS
                  </button>
                  <button 
                    onClick={() => setSmsType("all")}
                    className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${smsType === "all" ? "bg-white shadow-sm text-black" : "text-gray-500"}`}
                  >
                    ALL USERS
                  </button>
                </div>

                {smsType === "manual" && (
                  <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Direct Phone Numbers</label>
                    <textarea 
                      placeholder="Enter numbers separated by commas or new lines..."
                      value={recipients}
                      onChange={(e) => setRecipients(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20 h-32 resize-none transition-all"
                    />
                    <p className="text-[10px] text-gray-400 px-1 font-medium italic">Example: 01700000000, 01800000000</p>
                  </div>
                )}

                {smsType === "selected" && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        type="text"
                        placeholder="Search users by name or phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
                      />
                    </div>
                    <div className="max-h-60 overflow-y-auto pr-2 custom-scrollbar space-y-2">
                      {users
                        .filter(u => (u.displayName?.toLowerCase().includes(searchQuery.toLowerCase())) || (u.phone?.includes(searchQuery)))
                        .map(user => (
                          <div 
                            key={user.id}
                            onClick={() => {
                              if (selectedUsers.includes(user.id)) {
                                setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                              } else {
                                setSelectedUsers([...selectedUsers, user.id]);
                              }
                            }}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                              selectedUsers.includes(user.id) 
                                ? "bg-amber-50 border-amber-200" 
                                : "bg-white border-gray-100 hover:border-gray-200"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-xs font-black text-gray-400">
                                {user.displayName?.charAt(0) || "U"}
                              </div>
                              <div className="space-y-0.5">
                                <p className="text-sm font-black text-gray-900">{user.displayName || "Unknown User"}</p>
                                <p className="text-[10px] font-bold text-gray-400">{user.phone}</p>
                              </div>
                            </div>
                            {selectedUsers.includes(user.id) && <CheckCircle2 className="w-5 h-5 text-amber-500" />}
                          </div>
                        ))}
                    </div>
                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest px-1">
                      {selectedUsers.length} USERS SELECTED
                    </p>
                  </div>
                )}

                {smsType === "all" && (
                  <div className="p-8 bg-amber-50 rounded-3xl border border-amber-100 text-center space-y-2 animate-in fade-in slide-in-from-top-2">
                    <Users className="w-8 h-8 text-amber-500 mx-auto" />
                    <h3 className="font-black text-amber-900 uppercase">Broadcast to All Users</h3>
                    <p className="text-xs text-amber-600 font-bold uppercase tracking-wider">Total Recipients: {users.length}</p>
                  </div>
                )}
              </div>

              {/* Message Content */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Message Content (Custom)</label>
                <textarea 
                  placeholder="Type your custom message here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20 h-40 resize-none transition-all"
                />
              </div>

              <button 
                onClick={() => setShowPreview(true)}
                disabled={processing || (!message)}
                className="w-full bg-gray-900 text-white py-5 rounded-2xl text-sm font-black flex items-center justify-center gap-2 hover:bg-black transition-all active:scale-95 disabled:opacity-50"
              >
                <Play className="w-5 h-5" />
                PREVIEW & SEND SMS
              </button>
            </div>
          </motion.div>
        )}

        {activeTab === "history" && (
          <motion.div 
            key="history"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-gray-900">SMS Transmission History</h3>
                <button 
                  onClick={fetchHistory}
                  className="p-2 hover:bg-gray-100 rounded-full transition-all text-gray-500"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {history.length > 0 ? (
                  history.map((log) => (
                    <div key={log.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`px-2 py-1 rounded text-[9px] font-black uppercase ${
                            log.status === "Accepted" ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                          }`}>
                            {log.status}
                          </div>
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter bg-white px-2 py-1 rounded border border-gray-200">
                            {log.type}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {log.createdAt?.toDate().toLocaleString()}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-black text-gray-900">{log.phoneNumber}</p>
                        <p className="text-xs font-medium text-gray-600 leading-relaxed italic border-l-2 border-gray-200 pl-3">"{log.message}"</p>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200/50">
                        <span className="text-[9px] font-black text-gray-400 uppercase">Provider ID: {log.msgId || "N/A"}</span>
                        <span className="text-[9px] font-black text-gray-400 uppercase">Sent By: {log.sentBy || "System"}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 space-y-3">
                    <History className="w-12 h-12 text-gray-200 mx-auto" />
                    <p className="text-sm font-bold text-gray-400">No transmission history found</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[40px] w-full max-w-md p-8 shadow-2xl space-y-8"
            >
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-500">
                  <Send className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-gray-900">Confirm SMS Broadcast</h3>
                <p className="text-xs text-gray-400 font-medium">Please review the details before sending.</p>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Recipients</span>
                    <span className="text-sm font-black text-gray-900">
                      {smsType === "all" ? users.length : smsType === "selected" ? selectedUsers.length : recipients.split(/[\n,]/).filter(n => n.trim().length >= 10).length} Numbers
                    </span>
                  </div>
                  <div className="space-y-1.5 pt-3 border-t border-gray-200">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Message Preview</span>
                    <p className="text-xs font-bold text-gray-700 leading-relaxed bg-white p-4 rounded-xl border border-gray-100">
                      {message}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setShowPreview(false)}
                    className="flex-1 bg-gray-100 text-gray-500 py-4 rounded-2xl text-xs font-black hover:bg-gray-200 transition-all active:scale-95"
                  >
                    CANCEL
                  </button>
                  <button 
                    onClick={handleBulkSend}
                    disabled={processing}
                    className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl text-xs font-black flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-emerald-100"
                  >
                    {processing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    CONFIRM & SEND
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`fixed bottom-12 left-1/2 -translate-x-1/2 px-8 py-4 rounded-2xl shadow-2xl text-white text-xs font-black z-[110] flex items-center gap-3 ${
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
