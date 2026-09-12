import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, User, Phone, Mail, Camera, Shield, Bell, Lock, 
  MapPin, Check, ChevronRight, LogOut, Moon, Globe, 
  Smartphone, Eye, EyeOff, Save, Trash2, KeyRound 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../context/AuthContext";
import { auth, db } from "../lib/firebase";
import { signOut, updateProfile, updatePassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { SEO } from "../components/SEO";
import { getApiUrl } from "../lib/api";
import { DeleteAccountModal } from "../components/DeleteAccountModal";

export const AccountSettings: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();

  // Active Tab
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "notifications" | "preferences">("profile");
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Profile fields
  const [name, setName] = useState(user?.displayName || "মোঃ আরিফুল ইসলাম");
  const [phone, setPhone] = useState(profile?.phoneNumber || "01700-000000");
  const [email, setEmail] = useState(user?.email || "user@allmayadin.com");
  const [photoURL, setPhotoURL] = useState(user?.photoURL || "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");

  // Security / Password fields
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [passMsg, setPassMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Notification Toggles
  const [smsOrderAlerts, setSmsOrderAlerts] = useState(true);
  const [promoPushAlerts, setPromoPushAlerts] = useState(true);
  const [deliveryUpdates, setDeliveryUpdates] = useState(true);
  const [emailDigest, setEmailDigest] = useState(false);

  // App Preferences
  const [rememberMe, setRememberMe] = useState(true);
  const [language, setLanguage] = useState("bn");

  useEffect(() => {
    if (user) {
      if (user.displayName) setName(user.displayName);
      if (user.email) setEmail(user.email);
      if (user.photoURL) setPhotoURL(user.photoURL);
    }
    if (profile?.phoneNumber) {
      setPhone(profile.phoneNumber);
    }
  }, [user, profile]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoURL(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileMsg("");

    try {
      if (user) {
        await updateProfile(user, {
          displayName: name.trim(),
          photoURL: photoURL
        });
        await setDoc(doc(db, "users", user.uid), {
          displayName: name.trim(),
          phoneNumber: phone.trim(),
          email: email.trim(),
          photoURL: photoURL,
          updatedAt: serverTimestamp()
        }, { merge: true });

        if (email && email.includes("@") && !email.includes("@allmayadin.com")) {
          fetch(getApiUrl("/api/subscribers/save"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: email.trim(),
              name: name.trim(),
              phone: phone.trim(),
              uid: user.uid
            })
          }).catch(() => {});
        }

        await refreshProfile();
      }
      setProfileMsg("প্রোফাইল সফলভাবে আপডেট করা হয়েছে!");
      setTimeout(() => setProfileMsg(""), 3000);
    } catch (err: any) {
      setProfileMsg("সংরক্ষণে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass.length < 6) {
      setPassMsg({ type: "error", text: "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।" });
      return;
    }
    if (newPass !== confirmPass) {
      setPassMsg({ type: "error", text: "উভয় পাসওয়ার্ড হুবহু একই হতে হবে।" });
      return;
    }

    setIsChangingPass(true);
    setPassMsg(null);

    try {
      if (user) {
        await updatePassword(user, newPass);
        setPassMsg({ type: "success", text: "পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!" });
        setNewPass("");
        setConfirmPass("");
      } else {
        setPassMsg({ type: "error", text: "দয়া করে প্রথমে লগইন করুন।" });
      }
    } catch (err: any) {
      setPassMsg({ type: "error", text: "পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে। সম্প্রতি লগইন করে পুনরায় চেষ্টা করুন।" });
    } finally {
      setIsChangingPass(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-24 text-gray-800">
      <SEO title="অ্যাকাউন্ট সেটিংস (Account Settings)" description="আপনার অল মায়াদিন বাজার অ্যাকাউন্ট সেটিংস ও নিরাপত্তা" />

      {/* Header */}
      <div className="bg-gradient-to-b from-[#031d14] to-[#004b23] text-white px-5 pt-8 pb-10 rounded-b-[40px] shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between relative z-10 mb-6">
          <button 
            onClick={() => navigate(-1)} 
            className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md active:scale-95 transition-all text-white border border-white/10"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="inline-flex items-center gap-1.5 bg-[#ffb703]/20 border border-[#ffb703]/40 text-[#ffb703] text-xs font-black px-3.5 py-1 rounded-full backdrop-blur-md">
            <span>👑</span> গোল্ড মেম্বার অ্যাকাউন্ট
          </div>
        </div>

        {/* Profile Snapshot Header */}
        <div className="relative z-10 max-w-xl mx-auto flex items-center gap-4">
          <div className="relative w-16 h-16 rounded-2xl bg-[#022c1e] text-white flex items-center justify-center shrink-0 overflow-hidden border-2 border-white/40 shadow-inner">
            {photoURL ? (
              <img src={photoURL} alt={name} className="w-full h-full object-cover" />
            ) : (
              <User className="w-8 h-8 text-white/80" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white truncate">
              {name}
            </h1>
            <p className="text-xs text-emerald-100 font-medium truncate mt-0.5">
              {phone} • {email}
            </p>
          </div>
        </div>

        {/* Background Decor */}
        <div className="absolute -right-16 -top-16 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-4 relative z-20 space-y-6">

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar scrollbar-hide bg-white p-1.5 rounded-2xl border border-gray-200 shadow-xs">
          {[
            { id: "profile", label: "প্রোফাইল তথ্য", icon: User },
            { id: "security", label: "নিরাপত্তা ও পাসওয়ার্ড", icon: Shield },
            { id: "notifications", label: "বিজ্ঞপ্তি সেটিংস", icon: Bell },
            { id: "preferences", label: "অ্যাপ প্রেফারেন্স", icon: Globe },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center justify-center gap-2 ${
                  active 
                    ? "bg-[#004b23] text-white shadow-sm" 
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? "text-[#ffb703]" : "text-gray-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Profile Information */}
        {activeTab === "profile" && (
          <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-sm sm:text-base font-black text-gray-900">ব্যক্তিগত তথ্য আপডেট</h3>
                <p className="text-[11px] text-gray-400 font-medium">আপনার নাম, ফোন ও প্রোফাইল ছবি পরিবর্তন করুন</p>
              </div>
            </div>

            {profileMsg && (
              <div className="bg-emerald-50 text-emerald-800 p-3 rounded-2xl text-xs font-bold flex items-center gap-2 border border-emerald-200">
                <Check className="w-4 h-4 text-emerald-600" /> {profileMsg}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              {/* Photo Upload Avatar */}
              <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <div className="relative w-16 h-16 rounded-2xl bg-[#022c1e] text-white overflow-hidden shrink-0 border border-gray-200">
                  {photoURL ? (
                    <img src={photoURL} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 m-auto text-white/70" />
                  )}
                  <label className="absolute inset-0 bg-black/50 text-white flex flex-col items-center justify-center cursor-pointer opacity-75 hover:opacity-100 transition-opacity">
                    <Camera className="w-4 h-4" />
                    <span className="text-[7px] font-bold mt-0.5">ছবি দিন</span>
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </label>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-xs">প্রোফাইল অবতার ছবি</h4>
                  <p className="text-[10px] text-gray-400 font-medium">JPG, PNG বা WebP ফরম্যাট (সর্বোচ্চ ২MB)</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">পূর্ণ নাম</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl p-3 font-semibold focus:border-[#004b23] focus:ring-1 focus:ring-[#004b23] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1">মোবাইল নাম্বার</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl p-3 font-semibold focus:border-[#004b23] focus:ring-1 focus:ring-[#004b23] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">ইমেইল এড্রেস</label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 font-semibold text-gray-500 cursor-not-allowed"
                />
                <span className="text-[10px] text-gray-400 font-medium mt-1 block">ইমেইল আইডি অ্যাকাউন্ট ইউনিক আইডেন্টিফায়ার হিসেবে ব্যবহৃত হয়।</span>
              </div>

              <button
                type="submit"
                disabled={isSavingProfile}
                className="w-full sm:w-auto px-8 bg-[#004b23] hover:bg-[#00381a] text-white font-black py-3 rounded-xl shadow-md text-xs flex items-center justify-center gap-2 active:scale-98 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingProfile ? "সংরক্ষণ হচ্ছে..." : "পরিবর্তন সংরক্ষণ করুন"}</span>
              </button>
            </form>
          </div>
        )}

        {/* Tab 2: Security & Password */}
        {activeTab === "security" && (
          <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-sm sm:text-base font-black text-gray-900">নিরাপত্তা ও পাসওয়ার্ড পরিবর্তন</h3>
                <p className="text-[11px] text-gray-400 font-medium">অ্যাকাউন্টের নিরাপত্তা নিশ্চিত করতে শক্তিশালী পাসওয়ার্ড ব্যবহার করুন</p>
              </div>
            </div>

            {passMsg && (
              <div className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 border ${
                passMsg.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-red-50 text-red-800 border-red-200"
              }`}>
                {passMsg.type === "success" ? <Check className="w-4 h-4 text-emerald-600" /> : <Shield className="w-4 h-4 text-red-600" />}
                <span>{passMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
              <div className="space-y-3">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">নতুন পাসওয়ার্ড</label>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      required
                      placeholder="কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড"
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl p-3 pr-10 font-semibold focus:border-[#004b23] focus:ring-1 focus:ring-[#004b23] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1">নতুন পাসওয়ার্ড পুনরায় নিশ্চিত করুন</label>
                  <input
                    type={showPass ? "text" : "password"}
                    required
                    placeholder="হুবহু একই পাসওয়ার্ড লিখুন"
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl p-3 font-semibold focus:border-[#004b23] focus:ring-1 focus:ring-[#004b23] outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isChangingPass}
                className="w-full sm:w-auto px-8 bg-[#004b23] hover:bg-[#00381a] text-white font-black py-3 rounded-xl shadow-md text-xs flex items-center justify-center gap-2 active:scale-98 transition-all"
              >
                <KeyRound className="w-4 h-4" />
                <span>{isChangingPass ? "পরিবর্তন হচ্ছে..." : "নতুন পাসওয়ার্ড সেট করুন"}</span>
              </button>
            </form>

            {/* Danger Zone: Permanent Account Deletion */}
            <div className="pt-6 border-t border-red-100 space-y-3">
              <div className="flex items-center gap-2 text-red-600">
                <Trash2 className="w-4 h-4" />
                <h4 className="text-xs font-black uppercase tracking-wider">বিপদজনক অঞ্চল (Danger Zone)</h4>
              </div>
              <div className="bg-red-50/70 border border-red-200/70 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h5 className="font-bold text-gray-900 text-xs">স্থায়ীভাবে অ্যাকাউন্ট মুছে ফেলুন</h5>
                  <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                    আপনার প্রোফাইল, অর্ডার হিস্ট্রি ও সংরক্ষিত সমস্ত ডেটা ডাটাবেস থেকে স্থায়ীভাবে মুছে যাবে।
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="px-4 py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5 shrink-0 transition-all active:scale-95"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>অ্যাকাউন্ট মুছুন</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Notification Preferences */}
        {activeTab === "notifications" && (
          <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs space-y-4">
            <div className="pb-3 border-b border-gray-100">
              <h3 className="text-sm sm:text-base font-black text-gray-900">বিজ্ঞপ্তি প্রেফারেন্স</h3>
              <p className="text-[11px] text-gray-400 font-medium">কোন কোন চ্যানেলে নোটিফিকেশন পেতে চান তা নিয়ন্ত্রণ করুন</p>
            </div>

            <div className="space-y-3 divide-y divide-gray-100">
              
              <div className="pt-3 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-gray-900">অর্ডার স্ট্যাটাস এসএমএস অ্যালার্ট</h4>
                  <p className="text-[10px] text-gray-400 font-medium">অর্ডার গ্রহণ, প্যাকেজিং ও কুরিয়ার ট্র্যাকিং এসএমএস</p>
                </div>
                <input
                  type="checkbox"
                  checked={smsOrderAlerts}
                  onChange={(e) => setSmsOrderAlerts(e.target.checked)}
                  className="w-5 h-5 accent-[#004b23] rounded-lg cursor-pointer"
                />
              </div>

              <div className="pt-3 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-gray-900">ধামাকা অফার ও কুপন ডিসকাউন্ট</h4>
                  <p className="text-[10px] text-gray-400 font-medium">ফ্ল্যাশ সেল, ঈদ ক্যাম্পেইন ও বিশেষ ছাড়ের বার্তা</p>
                </div>
                <input
                  type="checkbox"
                  checked={promoPushAlerts}
                  onChange={(e) => setPromoPushAlerts(e.target.checked)}
                  className="w-5 h-5 accent-[#004b23] rounded-lg cursor-pointer"
                />
              </div>

              <div className="pt-3 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-gray-900">রাইডার লাইভ ডেলিভারি আপডেট</h4>
                  <p className="text-[10px] text-gray-400 font-medium">ডেলিভারিম্যান আপনার গন্তব্যে পৌঁছানোর সময়ের সতর্কতা</p>
                </div>
                <input
                  type="checkbox"
                  checked={deliveryUpdates}
                  onChange={(e) => setDeliveryUpdates(e.target.checked)}
                  className="w-5 h-5 accent-[#004b23] rounded-lg cursor-pointer"
                />
              </div>

            </div>
          </div>
        )}

        {/* Tab 4: App Preferences & Quick Links */}
        {activeTab === "preferences" && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs space-y-4">
              <div className="pb-3 border-b border-gray-100">
                <h3 className="text-sm sm:text-base font-black text-gray-900">অ্যাপ প্রেফারেন্স</h3>
                <p className="text-[11px] text-gray-400 font-medium">ভাষাগত ও স্বয়ংক্রিয় লগইন সেটিংস</p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl">
                  <div>
                    <h4 className="font-bold text-gray-900">স্বয়ংক্রিয় লগইন (Remember Me)</h4>
                    <p className="text-[10px] text-gray-400">পরবর্তী ভিজিটে পুনরায় সাইন-ইন করতে হবে না</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-5 h-5 accent-[#004b23] rounded-lg cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl">
                  <div>
                    <h4 className="font-bold text-gray-900">অ্যাপের ভাষা (Language)</h4>
                    <p className="text-[10px] text-gray-400">বাংলা অথবা ইংরেজি নির্বাচন করুন</p>
                  </div>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="border border-gray-200 rounded-xl px-3 py-1.5 font-bold bg-white text-xs text-[#004b23]"
                  >
                    <option value="bn">বাংলা (Bengali)</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Quick Links Section */}
            <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs space-y-2">
              <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">শর্টকাট সার্ভিস</h4>
              
              <button
                onClick={() => navigate("/addresses")}
                className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-2xl transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-[#004b23]" />
                  <span className="text-xs font-bold text-gray-800">সংরক্ষিত ঠিকানা ব্যবস্থাপনা</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>

              <button
                onClick={() => navigate("/privacy")}
                className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-2xl transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <Shield className="w-4 h-4 text-[#004b23]" />
                  <span className="text-xs font-bold text-gray-800">প্রাইভেসি ও শর্তাবলী</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Logout and Delete Actions */}
            <div className="pt-2 flex flex-col gap-2.5">
              <button
                onClick={handleLogout}
                className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-black py-3.5 rounded-2xl border border-red-200 flex items-center justify-center gap-2 active:scale-98 transition-all text-xs"
              >
                <LogOut className="w-4 h-4" />
                <span>অ্যাকাউন্ট থেকে লগআউট করুন</span>
              </button>

              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="w-full bg-white hover:bg-red-50/50 text-red-500 font-bold py-3 rounded-2xl border border-dashed border-red-200 flex items-center justify-center gap-2 active:scale-98 transition-all text-xs"
              >
                <Trash2 className="w-4 h-4" />
                <span>স্থায়ীভাবে অ্যাকাউন্ট মুছে ফেলুন (Delete Account)</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Delete Account Modal */}
      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
      />
    </div>
  );
};
export default AccountSettings;
