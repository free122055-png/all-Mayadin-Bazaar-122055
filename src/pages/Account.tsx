import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { User, Package, MapPin, Heart, Bell, Shield, LogOut, ChevronRight, Settings, Edit3, X, Check, Camera, Phone, FileText, LockIcon } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNotificationContext } from "../context/NotificationContext";
import { auth, db } from "../lib/firebase";
import { signOut, updateProfile as updateFirebaseProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp, collection, query, where, getDocs } from "firebase/firestore";
import { handleFirestoreError, OperationType } from "../lib/firebase";

export const Account: React.FC = () => {
  const { user, profile, loading, refreshProfile } = useAuth();
  const { unreadCount } = useNotificationContext();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Sync state when profile loads or editing starts
  React.useEffect(() => {
    if (profile) {
      setName(profile.displayName || "");
      setPhone(profile.phoneNumber || "");
      setPhotoURL(profile.photoURL || "");
    }
  }, [profile, isEditing]);

  const handleLogout = async () => {
    localStorage.removeItem("admin_secret_unlocked");
    await signOut(auth);
    navigate("/");
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setSuccessMsg("");

    try {
      // Update Firebase Auth profile
      await updateFirebaseProfile(user, {
        displayName: name.trim(),
        photoURL: photoURL.trim()
      });

      // Update Firestore user document
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, {
        displayName: name.trim(),
        phoneNumber: phone.trim(),
        photoURL: photoURL.trim(),
        updatedAt: serverTimestamp()
      }, { merge: true });

      await refreshProfile();
      setSuccessMsg("প্রোফাইল সফলভাবে আপডেট করা হয়েছে!");
      setTimeout(() => {
        setIsEditing(false);
        setSuccessMsg("");
      }, 1500);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setSaving(false);
    }
  };

  const accountMenu = [
    { icon: Package, label: "🛍️ আমার অর্ডারসমূহ", path: "/orders" },
    { icon: Heart, label: "❤️ পছন্দের তালিকা", path: "/wishlist" },
    { icon: MapPin, label: "📍 সংরক্ষিত ঠিকানা", path: "/addresses" },
    { icon: Bell, label: "🔔 বিজ্ঞপ্তি", path: "/notifications", count: unreadCount > 0 ? unreadCount.toString() : null },
    { icon: User, label: "👤 প্রোফাইল এডিট", action: () => setIsEditing(true) },
  ];

  const legalMenu = [
    { icon: Shield, label: "🔒 গোপনীয়তা নীতি", path: "/privacy" },
    { icon: FileText, label: "📜 শর্তাবলী", path: "/terms" },
    { icon: LockIcon, label: "🛡️ নিরাপত্তা", path: "/security" },
  ];

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#004b23] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-6">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
          <User className="w-12 h-12 text-gray-300" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-800">অনুগ্রহ করে সাইন ইন করুন</h2>
          <p className="text-gray-500 max-w-xs mx-auto">আপনার অর্ডার, প্রোফাইল এবং ঠিকানা দেখতে লগইন করুন।</p>
        </div>
        <button 
          onClick={() => navigate("/login")}
          className="bg-[#004b23] text-white font-bold py-4 px-12 rounded-2xl shadow-lg shadow-[#004b23]/20 flex items-center gap-2 transition-transform active:scale-95"
        >
          লগইন করুন <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24 w-full overflow-x-hidden max-w-lg mx-auto md:max-w-none">
      {/* Profile Header */}
      <div className="bg-[#004b23] w-full px-5 sm:px-6 pt-12 pb-10 rounded-b-[36px] shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-18 h-18 rounded-full bg-white/20 backdrop-blur-md border-2 border-white/40 flex items-center justify-center overflow-hidden shadow-inner">
              {(profile?.photoURL || user.photoURL) ? (
                <img src={profile?.photoURL || user.photoURL || ""} alt={profile?.displayName || user.displayName || ""} className="w-full h-full object-cover" />
              ) : (
                <User className="w-9 h-9 text-white" />
              )}
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-black text-white">{profile?.displayName || user.displayName || "সম্মানিত গ্রাহক"}</h2>
              <div className="flex items-center gap-1.5 text-emerald-100 text-xs font-medium">
                <Phone className="w-3.5 h-3.5 text-[#ffb703]" />
                <span>{profile?.phoneNumber || "মোবাইল নম্বর যোগ করা হয়নি"}</span>
              </div>
              <p className="text-white/70 text-[11px]">{user.email}</p>
            </div>
          </div>

          {/* Edit Profile Button */}
          <button
            onClick={() => setIsEditing(true)}
            className="bg-[#ffb703] hover:bg-[#e0a200] text-black font-bold px-3.5 py-2 rounded-xl text-xs shadow-md flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <Edit3 className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>প্রোফাইল এডিট</span>
          </button>
        </div>
        <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* Edit Profile Modal (Now Full Screen) */}
      <AnimatePresence>
        {isEditing && (
          <motion.div 
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[2000] bg-white flex flex-col"
          >
            {/* Header */}
            <div className="bg-[#004b23] p-6 pt-10 text-white flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                  <Edit3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-black leading-tight">প্রোফাইল আপডেট</h3>
                  <p className="text-[10px] text-emerald-100 font-medium">আপনার তথ্য পরিবর্তন করুন</p>
                </div>
              </div>
              <button 
                onClick={() => setIsEditing(false)}
                className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all active:scale-90"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              {successMsg && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-emerald-50 text-emerald-700 p-4 rounded-2xl text-sm font-bold text-center flex items-center justify-center gap-2 border border-emerald-100"
                >
                  <Check className="w-5 h-5" />
                  <span>{successMsg}</span>
                </motion.div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-gray-700 ml-1">আপনার নাম (Full Name)</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input 
                      type="text" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full bg-gray-50 border border-gray-100 px-10 py-3.5 rounded-2xl text-sm font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#004b23] focus:border-transparent transition-all outline-none"
                      placeholder="আপনার পূর্ণ নাম লিখুন"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-gray-700 ml-1">মোবাইল নম্বর (Phone Number)</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input 
                      type="tel" 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-100 px-10 py-3.5 rounded-2xl text-sm font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#004b23] focus:border-transparent transition-all outline-none"
                      placeholder="017xxxxxxxx"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-gray-700 ml-1">প্রোফাইল ছবির লিঙ্ক (Photo URL)</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        <Camera className="w-4 h-4" />
                      </div>
                      <input 
                        type="url" 
                        value={photoURL} 
                        onChange={(e) => setPhotoURL(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-100 px-10 py-3.5 rounded-2xl text-sm font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#004b23] focus:border-transparent transition-all outline-none"
                        placeholder="https://example.com/photo.jpg"
                      />
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center shrink-0 overflow-hidden border border-gray-100 shadow-inner">
                      {photoURL ? (
                        <img src={photoURL} alt="Preview" className="w-full h-full object-cover" onError={(e)=>{(e.target as HTMLElement).style.display='none';}} />
                      ) : (
                        <Camera className="w-5 h-5 text-gray-300" />
                      )}
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1.5 italic ml-1">* গুগল বা অন্য কোনো সাইট থেকে ছবির লিংক এখানে দিতে পারেন।</p>
                </div>

                <div className="pt-6 flex flex-col gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-[#004b23] hover:bg-[#00381a] text-white font-black py-4 rounded-2xl text-sm shadow-xl shadow-[#004b23]/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving ? "সংরক্ষণ হচ্ছে..." : "তথ্য আপডেট করুন"}
                    {!saving && <Check className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="w-full bg-gray-50 hover:bg-gray-100 text-gray-500 font-bold py-3.5 rounded-2xl text-sm transition-all"
                  >
                    ফিরে যান
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Menu Sections */}
      <div className="px-4 space-y-6">
        {/* My Account Section */}
        <div className="space-y-3">
          <h3 className="px-4 text-[13px] font-black text-gray-400 uppercase tracking-widest">আমার অ্যাকাউন্ট</h3>
          <div className="bg-white rounded-[32px] p-2 shadow-sm border border-gray-100 overflow-hidden">
            <div className="divide-y divide-gray-50">
              {accountMenu.map((item, i) => (
                item.action ? (
                  <button 
                    key={i} 
                    onClick={item.action}
                    className="w-full flex items-center justify-between py-4 px-3 group hover:bg-gray-50/80 rounded-2xl transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 bg-emerald-50 rounded-2xl flex items-center justify-center text-[#004b23] group-hover:bg-[#004b23] group-hover:text-white transition-colors">
                        <item.icon className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-gray-800 text-sm">{item.label}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
                  </button>
                ) : (
                  <Link 
                    key={i} 
                    to={item.path!}
                    className="flex items-center justify-between py-4 px-3 group hover:bg-gray-50/80 rounded-2xl transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 bg-emerald-50 rounded-2xl flex items-center justify-center text-[#004b23] group-hover:bg-[#004b23] group-hover:text-white transition-colors">
                        <item.icon className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-gray-800 text-sm">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.count && (
                        <span className="bg-[#ffb703] text-black text-[10px] font-black px-2.5 py-1 rounded-full shadow-xs">
                          {item.count}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                )
              ))}
            </div>
          </div>
        </div>

        {/* Legal & Security Section */}
        <div className="space-y-3">
          <h3 className="px-4 text-[13px] font-black text-gray-400 uppercase tracking-widest">আইনি ও নিরাপত্তা</h3>
          <div className="bg-white rounded-[32px] p-2 shadow-sm border border-gray-100 overflow-hidden">
            <div className="divide-y divide-gray-50">
              {legalMenu.map((item, i) => (
                <Link 
                  key={i} 
                  to={item.path!}
                  className="flex items-center justify-between py-4 px-3 group hover:bg-gray-50/80 rounded-2xl transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-[#004b23] group-hover:text-white transition-colors">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-gray-800 text-sm">{item.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Logout */}
      <div className="px-4">
        <button 
          onClick={handleLogout}
          className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 border border-red-100 active:scale-95 transition-all text-sm shadow-sm"
        >
          <LogOut className="w-4 h-4" /> লগআউট করুন (Logout)
        </button>
      </div>

      <div className="text-center text-[10px] text-gray-400 font-medium pb-6">
        App Version 8.0 • AL MAYADIN BAZAAR
      </div>
    </div>
  );
};
