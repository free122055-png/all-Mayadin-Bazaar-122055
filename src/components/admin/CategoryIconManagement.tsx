import React, { useState, useEffect } from "react";
import { 
  Plus, Save, Trash2, Edit2, X, Upload, LayoutGrid, 
  CheckCircle2, AlertCircle, Loader2, Image as ImageIcon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { db } from "../../lib/firebase";
import { 
  collection, getDocs, doc, setDoc, query, onSnapshot
} from "firebase/firestore";
import { compressImage } from "../../lib/imageUtils";

// These match the IDs in Home.tsx
const FIXED_CATEGORIES = [
  { id: "cat1", title: "খাদ্য বাজার" },
  { id: "cat2", title: "রুপসজ্জা বাজার" },
  { id: "cat3", title: "কাপড় ও পরিধান" },
  { id: "cat4", title: "উপহার বাজার" },
  { id: "cat5", title: "ব্যাগ ও ফ্যাশন" },
  { id: "cat6", title: "ইসলামিক বাজার" },
  { id: "cat7", title: "ইলেকট্রনিক্স বাজার" },
  { id: "cat8", title: "বই ও শিক্ষা বাজার" },
];

export const CategoryIconManagement: React.FC = () => {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; isError?: boolean } | null>(null);

  // Form states
  const [image, setImage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "category_icons"), (snapshot) => {
      const data: Record<string, string> = {};
      snapshot.docs.forEach(doc => {
        data[doc.id] = doc.data().image;
      });
      setConfig(data);
      setLoading(false);
    }, (error) => {
      console.warn("Category icons listener notice:", error.message);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const showToast = (text: string, isError = false) => {
    setToast({ text, isError });
    setTimeout(() => setToast(null), 3000);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const base64 = await compressImage(file);
      setImage(base64);
      showToast("ছবি আপলোড হয়েছে");
    } catch (error) {
      showToast("ছবি আপলোড ব্যর্থ হয়েছে", true);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!editingId) return;
    if (!image) return showToast("ছবি নির্বাচন করুন", true);

    setSaveLoading(true);
    try {
      await setDoc(doc(db, "category_icons", editingId), {
        image: image,
        updatedAt: Date.now()
      });
      showToast("সফলভাবে আপডেট হয়েছে");
      setEditingId(null);
      setImage("");
    } catch (error) {
      showToast("সেভ করতে সমস্যা হয়েছে", true);
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-6 pb-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black text-gray-900 italic">বাজার ক্যাটাগরি ফটো</h2>
          <p className="text-sm text-gray-500 font-medium mt-1 tracking-tight">হোম পেজের প্রধান বাজারগুলোর ফটো এখান থেকে সরাসরি সেট করুন</p>
        </div>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-24 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 border ${
              toast.isError ? "bg-rose-50 border-rose-200 text-rose-700" : "bg-emerald-50 border-emerald-200 text-emerald-700"
            }`}
          >
            {toast.isError ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            <span className="font-bold text-sm">{toast.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Modal */}
      <AnimatePresence>
        {editingId && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl border border-gray-100"
            >
              <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                <h3 className="text-lg font-black text-gray-900 italic">
                  {FIXED_CATEGORIES.find(c => c.id === editingId)?.title} - ফটো সেট করুন
                </h3>
                <button onClick={() => {setEditingId(null); setImage("");}} className="p-2 hover:bg-gray-200 rounded-full transition-all">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">নতুন ফটো আপলোড করুন</label>
                  <label className="w-full h-52 border-2 border-dashed border-gray-200 rounded-[28px] flex flex-col items-center justify-center bg-gray-50/50 hover:bg-gray-50 hover:border-[#5842dc]/40 transition-all cursor-pointer relative overflow-hidden group">
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    {image ? (
                      <>
                        <img src={image} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                          <Upload className="w-8 h-8 text-white" />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400 mb-2">
                          {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
                        </div>
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">গ্যালারি থেকে ফটো নিন</span>
                      </>
                    )}
                  </label>
                </div>

                <button 
                  onClick={handleSave}
                  disabled={saveLoading || isUploading}
                  className="w-full bg-[#5842dc] text-white py-4 rounded-2xl text-sm font-black flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all disabled:opacity-50"
                >
                  {saveLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  <span>আপডেট করুন</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid Display */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-10 h-10 text-[#5842dc] animate-spin" />
          <span className="text-sm font-bold text-gray-400">লোডিং হচ্ছে...</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {FIXED_CATEGORIES.map((cat) => (
            <motion.div 
              key={cat.id}
              className="bg-white p-4 rounded-[32px] border border-gray-100 shadow-sm flex flex-col items-center group relative overflow-hidden hover:shadow-md transition-all"
            >
              <div className="w-full aspect-square rounded-[24px] bg-gray-50 overflow-hidden mb-4 relative">
                {config[cat.id] ? (
                  <img src={config[cat.id]} alt={cat.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-2">
                    <ImageIcon className="w-10 h-10" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">ফটো নেই</span>
                  </div>
                )}
                
                <button 
                  onClick={() => {setEditingId(cat.id); setImage(config[cat.id] || "");}}
                  className="absolute bottom-3 right-3 p-3 bg-white/90 backdrop-blur-sm text-[#5842dc] rounded-full shadow-lg hover:bg-[#5842dc] hover:text-white transition-all active:scale-90"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
              <h3 className="text-sm font-black text-gray-900 text-center">{cat.title}</h3>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
