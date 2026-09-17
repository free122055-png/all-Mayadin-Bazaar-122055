import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Plus, Trash2, Home, Briefcase, School, ChevronRight, ArrowLeft, Check, Edit3, X } from "lucide-react";
import { db } from "../lib/firebase";
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc, updateDoc, writeBatch } from "firebase/firestore";
import { handleFirestoreError, OperationType } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "motion/react";

interface Address {
  id: string;
  label: 'Home' | 'Office' | 'Madrasa' | 'Other';
  fullAddress: string;
  isDefault: boolean;
  phoneNumber?: string;
  receiverName?: string;
}

export const Addresses: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  // Form state
  const [label, setLabel] = useState<'Home' | 'Office' | 'Madrasa' | 'Other'>('Home');
  const [fullAddress, setFullAddress] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [phone, setPhone] = useState("");
  const [loadingLocation, setLoadingLocation] = useState(false);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "addresses"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Address[];
      setAddresses(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "addresses");
    });

    return () => unsubscribe();
  }, [user]);

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const id = doc(collection(db, "addresses")).id;
    const isFirst = addresses.length === 0;

    try {
      await setDoc(doc(db, "addresses", id), {
        userId: user.uid,
        label,
        fullAddress,
        receiverName,
        phoneNumber: phone,
        isDefault: isFirst,
        createdAt: Date.now()
      });
      setIsAdding(false);
      setFullAddress("");
      setReceiverName("");
      setPhone("");
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `addresses/${id}`);
    }
  };

  const setDefault = async (id: string) => {
    if (!user) return;
    try {
      const batch = writeBatch(db);
      addresses.forEach(addr => {
        batch.update(doc(db, "addresses", addr.id), { isDefault: addr.id === id });
      });
      await batch.commit();
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, "addresses");
    }
  };

  const deleteAddress = async (id: string) => {
    try {
      await deleteDoc(doc(db, "addresses", id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `addresses/${id}`);
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("আপনার ডিভাইসে লোকেশন সার্ভিস সাপোর্ট করে না।");
      return;
    }

    setLoadingLocation(true);
    
    // Fallback if geolocation takes too long
    const timeout = setTimeout(() => {
       if (loadingLocation) {
         setLoadingLocation(false);
         alert("লোকেশন পেতে সময় লাগছে। দয়া করে নিশ্চিত করুন আপনার ডিভাইসের GPS/লোকেশন সার্ভিস চালু রয়েছে।");
       }
    }, 10000);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        clearTimeout(timeout);
        const { latitude, longitude } = position.coords;
        try {
          // Fallback to a client-side reverse geocoding approach
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`, {
            headers: {
              'Accept-Language': 'bn-BD,bn;q=0.9,en-US;q=0.8,en;q=0.7' // Request Bengali if possible
            }
          });
          const data = await response.json();
          if (data && data.display_name) {
            setFullAddress(data.display_name);
          } else {
            setFullAddress(`অক্ষাংশ: ${latitude.toFixed(6)}, দ্রাঘিমাংশ: ${longitude.toFixed(6)}`);
          }
        } catch (error) {
          console.error("Error fetching address:", error);
          setFullAddress(`অক্ষাংশ: ${latitude.toFixed(6)}, দ্রাঘিমাংশ: ${longitude.toFixed(6)}`);
        } finally {
          setLoadingLocation(false);
        }
      },
      (error) => {
        clearTimeout(timeout);
        console.error("Error getting location:", error.message || error);
        
        let errorMsg = "লোকেশন পাওয়া যায়নি। দয়া করে ডিভাইসের জিপিএস (GPS) অন করুন।";
        if (error.code === 1) { // PERMISSION_DENIED
           errorMsg = "লোকেশন পারমিশন দেওয়া হয়নি। দয়া করে ডিভাইসের সেটিংস থেকে লোকেশন পারমিশন এলাউ (Allow) করুন।";
        } else if (error.code === 2) { // POSITION_UNAVAILABLE
           errorMsg = "বর্তমান লোকেশন সিগন্যাল পাওয়া যাচ্ছে না। আপনার জিপিএস বা ইন্টারনেট সংযোগ চেক করুন।";
        } else if (error.code === 3) { // TIMEOUT
           errorMsg = "লোকেশন পেতে অনেক বেশি সময় লাগছে। দয়া করে আবার চেষ্টা করুন।";
        }
        
        alert(errorMsg);
        setLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const getLabelIcon = (label: string) => {
    switch (label) {
      case 'Home': return <Home className="w-5 h-5" />;
      case 'Office': return <Briefcase className="w-5 h-5" />;
      case 'Madrasa': return <School className="w-5 h-5" />;
      default: return <MapPin className="w-5 h-5" />;
    }
  };

  const getLabelText = (label: string) => {
    switch (label) {
      case 'Home': return "বাসা";
      case 'Office': return "অফিস";
      case 'Madrasa': return "মাদরাসা";
      default: return "অন্যান্য";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-[#004b23] px-5 pt-10 pb-6 rounded-b-[40px] shadow-lg sticky top-0 z-50 flex items-center justify-between text-white">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md active:scale-90 transition-transform">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-black">সংরক্ষিত ঠিকানা</h1>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="w-10 h-10 bg-[#ffb703] text-black rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-transform"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-[#004b23] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : addresses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="w-24 h-24 bg-white rounded-[32px] shadow-sm flex items-center justify-center">
              <MapPin className="w-10 h-10 text-gray-100" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-gray-800">কোনো ঠিকানা নেই</h3>
              <p className="text-xs text-gray-400 font-medium">অর্ডার করার জন্য একটি ঠিকানা যোগ করুন।</p>
            </div>
            <button 
              onClick={() => setIsAdding(true)}
              className="mt-2 bg-[#004b23] text-white font-bold py-3 px-8 rounded-2xl shadow-lg shadow-[#004b23]/20"
            >
              নতুন ঠিকানা যোগ করুন
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {addresses.map((addr) => (
              <div 
                key={addr.id}
                className={`bg-white p-5 rounded-[32px] shadow-sm border transition-all ${addr.isDefault ? 'border-[#004b23] ring-4 ring-[#004b23]/5' : 'border-gray-100'}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${addr.isDefault ? 'bg-[#004b23] text-white' : 'bg-emerald-50 text-[#004b23]'}`}>
                      {getLabelIcon(addr.label)}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-gray-900">{getLabelText(addr.label)} {addr.isDefault && <span className="ml-2 text-[8px] bg-[#ffb703] text-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter">Default</span>}</h4>
                      <p className="text-[10px] text-gray-400 font-bold">{addr.receiverName || "গ্রাহক"}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => deleteAddress(addr.id)} className="w-9 h-9 bg-red-50 text-red-500 rounded-xl flex items-center justify-center active:scale-90 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-600 font-medium leading-relaxed mb-4">{addr.fullAddress}</p>
                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <span className="text-[10px] font-black text-gray-400">{addr.phoneNumber}</span>
                  {!addr.isDefault && (
                    <button 
                      onClick={() => setDefault(addr.id)}
                      className="text-[10px] font-black text-[#004b23] bg-emerald-50 px-3 py-1.5 rounded-xl active:scale-95"
                    >
                      ডিফল্ট সেট করুন
                    </button>
                  )}
                  {addr.isDefault && (
                    <div className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl">
                      <Check className="w-3 h-3" /> ডিফল্ট ঠিকানা
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Address Modal */}
      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            className="fixed inset-0 z-[2000] bg-white flex flex-col"
          >
            <div className="bg-[#004b23] p-6 pt-10 text-white flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-black">নতুন ঠিকানা</h3>
              </div>
              <button onClick={() => setIsAdding(false)} className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center active:scale-90 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
              <form onSubmit={handleAddAddress} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 ml-1">ঠিকানার ধরণ</label>
                  <div className="grid grid-cols-4 gap-3">
                    {(['Home', 'Office', 'Madrasa', 'Other'] as const).map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => setLabel(l)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${label === l ? 'border-[#004b23] bg-emerald-50 text-[#004b23]' : 'border-gray-50 text-gray-400 grayscale'}`}
                      >
                        {getLabelIcon(l)}
                        <span className="text-[10px] font-black">{getLabelText(l)}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 ml-1">গ্রাহকের নাম</label>
                  <input 
                    type="text" 
                    value={receiverName}
                    onChange={(e) => setReceiverName(e.target.value)}
                    required
                    className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-[#004b23] transition-all"
                    placeholder="নাম লিখুন"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 ml-1">মোবাইল নম্বর</label>
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-[#004b23] transition-all"
                    placeholder="017xxxxxxxx"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-xs font-black text-gray-400">পূর্ণ ঠিকানা</label>
                    <button 
                      type="button" 
                      onClick={handleGetCurrentLocation}
                      disabled={loadingLocation}
                      className="text-[10px] font-black text-[#004b23] bg-emerald-50 px-3 py-1.5 rounded-xl active:scale-95 flex items-center gap-1 transition-all disabled:opacity-50"
                    >
                      {loadingLocation ? (
                        <div className="w-3 h-3 border-2 border-[#004b23] border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <MapPin className="w-3 h-3" />
                      )}
                      {loadingLocation ? "লোকেশন খুঁজছে..." : "লাইভ লোকেশন সেট করুন"}
                    </button>
                  </div>
                  <textarea 
                    value={fullAddress}
                    onChange={(e) => setFullAddress(e.target.value)}
                    required
                    rows={4}
                    className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-[#004b23] transition-all resize-none"
                    placeholder="গ্রাম, রাস্তা, থানা, জেলা..."
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-[#004b23] text-white font-black py-5 rounded-2xl shadow-xl shadow-[#004b23]/20 active:scale-[0.98] transition-all"
                >
                  ঠিকানা সংরক্ষণ করুন
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
