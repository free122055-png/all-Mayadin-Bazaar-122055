import React, { useState, useEffect } from "react";
import { 
  Plus, Save, Trash2, Edit2, X, Upload, 
  CheckCircle2, AlertCircle, Loader2, Image as ImageIcon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { db } from "../../lib/firebase";
import { 
  collection, addDoc, getDocs, deleteDoc, 
  doc, updateDoc, query, orderBy, onSnapshot
} from "firebase/firestore";
import { compressImage } from "../../lib/imageUtils";

interface MainBanner {
  id: string;
  image: string;
  order: number;
  createdAt: number;
}

export const MainBannerManagement: React.FC = () => {
  const [banners, setBanners] = useState<MainBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; isError?: boolean } | null>(null);

  // Form states
  const [image, setImage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "main_banners"), orderBy("order", "asc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MainBanner[];
      setBanners(data);
      setLoading(false);
    }, (error) => {
      console.warn("Main banner listener notice:", error.message);
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
    if (!image) return showToast("ছবি নির্বাচন করুন", true);

    setSaveLoading(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, "main_banners", editingId), {
          image: image,
          updatedAt: Date.now()
        });
        showToast("সফলভাবে আপডেট হয়েছে");
      } else {
        await addDoc(collection(db, "main_banners"), {
          image: image,
          order: banners.length,
          createdAt: Date.now()
        });
        showToast("সফলভাবে যোগ হয়েছে");
      }
      resetForm();
    } catch (error) {
      showToast("সেভ করতে সমস্যা হয়েছে", true);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("আপনি কি নিশ্চিত এই ব্যানারটি ডিলিট করতে চান?")) return;

    try {
      await deleteDoc(doc(db, "main_banners", id));
      showToast("ডিলিট করা হয়েছে");
    } catch (error) {
      showToast("ডিলিট করতে সমস্যা হয়েছে", true);
    }
  };

  const resetForm = () => {
    setImage("");
    setEditingId(null);
    setIsAdding(false);
  };

  const startEdit = (banner: MainBanner) => {
    setImage(banner.image);
    setEditingId(banner.id);
    setIsAdding(true);
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-6 pb-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black text-gray-900 italic uppercase">মেইনডেস বুট ব্যানার</h2>
          <p className="text-sm text-gray-500 font-medium mt-1">হোম পেজের বড় স্লাইডার ব্যানারগুলো এখান থেকে ম্যানেজ করুন</p>
        </div>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-[#5842dc] text-white px-4 py-2.5 rounded-2xl text-sm font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>নতুন ব্যানার যোগ করুন</span>
          </button>
        )}
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

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isAdding && (
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
              className="bg-white w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl border border-gray-100"
            >
              <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                <h3 className="text-lg font-black text-gray-900 italic">{editingId ? "ব্যানার এডিট করুন" : "নতুন ব্যানার যোগ করুন"}</h3>
                <button onClick={resetForm} className="p-2 hover:bg-gray-200 rounded-full transition-all">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 italic">ব্যানার ফটো</label>
                  <label className="w-full aspect-[21/9] border-2 border-dashed border-gray-200 rounded-[28px] flex flex-col items-center justify-center bg-gray-50/50 hover:bg-gray-50 hover:border-[#5842dc]/40 transition-all cursor-pointer relative overflow-hidden group">
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
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">গ্যালারি থেকে ব্যানার নিন</span>
                      </>
                    )}
                  </label>
                  <p className="text-[10px] text-gray-400 font-medium text-center italic mt-2 uppercase tracking-widest">রেকমেন্ডেড সাইজ: ১২০০ x ৬০০ পিক্সেল</p>
                </div>

                <button 
                  onClick={handleSave}
                  disabled={saveLoading || isUploading}
                  className="w-full bg-[#5842dc] text-white py-4 rounded-2xl text-sm font-black flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all disabled:opacity-50"
                >
                  {saveLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  <span>{editingId ? "আপডেট করুন" : "সংরক্ষণ করুন"}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List Display */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-10 h-10 text-[#5842dc] animate-spin" />
          <span className="text-sm font-bold text-gray-400">অপেক্ষা করুন...</span>
        </div>
      ) : banners.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[40px] border border-gray-100 shadow-sm px-10 text-center">
          <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-4">
            <ImageIcon className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-lg font-black text-gray-900 italic uppercase">কোনো ব্যানার নেই</h3>
          <p className="text-sm text-gray-400 font-medium mt-1">হোম পেজের ব্যানার যোগ করতে উপরের বাটনে ক্লিক করুন</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {banners.map((banner) => (
            <motion.div 
              layout
              key={banner.id}
              className="bg-white p-2 rounded-[36px] border border-gray-100 shadow-sm flex flex-col group overflow-hidden"
            >
              <div className="w-full aspect-[21/9] rounded-[28px] overflow-hidden relative">
                <img src={banner.image} alt="Banner" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-3">
                  <button 
                    onClick={() => startEdit(banner)}
                    className="p-3 bg-white text-[#5842dc] rounded-full shadow-lg hover:scale-110 transition-all"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => handleDelete(banner.id)}
                    className="p-3 bg-white text-rose-500 rounded-full shadow-lg hover:scale-110 transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
