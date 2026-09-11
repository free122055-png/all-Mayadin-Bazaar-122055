import React, { useState } from "react";
import { Link } from "react-router-dom";
import { 
  ArrowLeft, Menu, Save, Upload, X, Plus, Tag, CheckCircle2, 
  AlertCircle, Percent, Image as ImageIcon, PackagePlus, 
  Package, Truck, ClipboardList, LayoutDashboard, Settings,
  LayoutGrid, Users, Download, KeyRound, Copy, Home as HomeIcon, Bell, Mail, Eye
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { db } from "../lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { compressImage } from "../lib/imageUtils";
import { BannerManagement } from "../components/admin/BannerManagement";
import { ProductManagement } from "../components/admin/ProductManagement";
import { DeliveryManagement as DeliverySettings } from "../components/admin/DeliveryManagement";
import { OrderManagement } from "../components/admin/OrderManagement";
import { CourierDeliveryManagement } from "../components/admin/CourierDeliveryManagement";
import { FoodSubcategoryManagement } from "../components/admin/FoodSubcategoryManagement";
import { CategoryIconManagement } from "../components/admin/CategoryIconManagement";
import { CategoryVisibilityManagement } from "../components/admin/CategoryVisibilityManagement";
import { MainBannerManagement } from "../components/admin/MainBannerManagement";
import { IntegrationCenter } from "../components/admin/IntegrationCenter";
import { UserManagement } from "../components/admin/UserManagement";
import { OneSignalConfig } from "../components/admin/OneSignalConfig";
import { EmailAutomationSection } from "../components/admin/EmailAutomationSection";

const CERT_TEXT = `-----BEGIN CERTIFICATE-----
MIIDrDCCApSgAwIBAgIUbgYcPFUN2XsLeghtCPsqIYtBzaswDQYJKoZIhvcNAQEL
BQAwZzEXMBUGA1UEAwwOQWxNYXlhZGluQmF6YXIxCzAJBgNVBAsMAklUMRIwEAYD
VQQKDAlBbE1heWFkaW4xDjAMBgNVBAcMBURoYWthMQ4wDAYDVQQIDAVEaGFrYTEL
MAkGA1UEBhMCQkQwIBcNMjYwOTA1MDExOTAzWhgPMjA1NDAxMjEwMTE5MDNaMGcx
FzAVBgNVBAMMDkFsTWF5YWRpbkJhemFyMQswCQYDVQQLDAJJVDESMBAGA1UECgwJ
QWxNYXlhZGluMQ4wDAYDVQQHDAVEaGFrYTEOMAwGA1UECAwFRGhha2ExCzAJBgNV
BAYTAkJEMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAviP68ivjAo6v
Unlbn3mQ+TALPmrpIXU+fgieWShnnY87pvmTYPLQoR0JTSL+fG9HQ4gm2knzCMXO
+d3hTfVdKtbd0kFy6o5xMemhIyav97OM0N1zvAHVhjlSKur6I2+zQFoagE+n0uU7
KrY6bYOxIMFugWW/G2Hf7PAO9V91LwODU/hW5yzEz5Ff1YhX1olOQVWdHdFQMBop
3jTdibo8r1oYzmrH/ZU8EgAtNJQ5PSNVUXp55BHQTz7Zs73T7mtCRtxd5+wUhALj
/6MeXbWQbSf+4RfamabJwh4Dhya1l4pfNhunchvvyTktpGcASdv9wvwLsTbY3QtL
EowJ4tzE0wIDAQABo04wTDAJBgNVHRMEAjAAMAsGA1UdDwQEAwIFoDATBgNVHSUE
DDAKBggrBgEFBQcDAzAdBgNVHQ4EFgQUR3TGcUW3FpVJrprtIRzP+bow3TkwDQYJ
KoZIhvcNAQELBQADggEBAHFAsHyB0XkYk6fOT4mmqp8ZwvtBlUJOnyGbKH7hLm+O
LChwZ/51lGpvv5XHvBqtbE9PCDX9eon6BDXrC0qHRte/F25MjmrcL6oSfAfXiskf
y0yoJ5bfrBqZPdcEljdgBVtM6ubKTuzBzFS794EZ/VeTDOcWWiWeduXuMnJjNLOF
3w5cEKghRo7PUeAatg+fT7TyAgujs0lvYB8W1esvs0dwEWxWh/CEcIv5z0McCXmG
OVKwXvSuAXa961yvmxhloAvVNj3PHewurSsi+j//+6+EtA9G5LJmj+1BBhxglwOk
55HxX8zghz4QKZeBFB07kjohqwXoqPOkqwPoBTpCOEo=
-----END CERTIFICATE-----`;

export const Admin: React.FC = () => {
  // Navigation Menu State
  const [activeMenu, setActiveMenu] = useState<
    "all-products" | "add-product" | "banner-management" | "delivery-settings" | "delivery-management" | "orders" | "food-subcategories" | "category-icons" | "category-visibility" | "main-banners" | "integration-center" | "user-management" | "onesignal" | "signing-keystore" | "email-automation"
  >("all-products");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedUserForNotification, setSelectedUserForNotification] = useState<any>(null);

  const handleSendNotificationToUser = (user: any) => {
    setSelectedUserForNotification(user);
    setActiveMenu("onesignal");
  };

  // Category list for dropdown selection
  const categories = [
    { id: "cat1", nameBn: "খাদ্য বাজার" },
    { id: "cat2", nameBn: "রূপসজ্জা বাজার" },
    { id: "cat3", nameBn: "কাপড় ও পরিধান" },
    { id: "cat4", nameBn: "উপহার বাজার" },
    { id: "cat5", nameBn: "ব্যাগ ও ফ্যাশন" },
    { id: "cat6", nameBn: "ইসলামিক বাজার" },
    { id: "cat7", nameBn: "ইলেকট্রনিক্স বাজার" },
    { id: "cat8", nameBn: "বই ও শিক্ষা বাজার" }
  ];

  // Form states
  const [productName, setProductName] = useState("");
  const [customProductCode, setCustomProductCode] = useState(() => String(Math.floor(100 + Math.random() * 900)));
  const [selectedCategory, setSelectedCategory] = useState("");
  const [regularPrice, setRegularPrice] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [productSizes, setProductSizes] = useState<string[]>([]);
  const [customSizeInput, setCustomSizeInput] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [isFeatured, setIsFeatured] = useState(false);
  
  // Images list (multiple images)
  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  const handleAddSize = (sizeToAdd: string) => {
    const trimmed = sizeToAdd.trim();
    if (trimmed && !productSizes.includes(trimmed)) {
      setProductSizes(prev => [...prev, trimmed]);
    }
  };

  const handleRemoveSize = (sizeToRemove: string) => {
    setProductSizes(prev => prev.filter(s => s !== sizeToRemove));
  };

  const handleTogglePresetSizes = (presets: string[]) => {
    setProductSizes(prev => {
      const allPresent = presets.every(p => prev.includes(p));
      if (allPresent) {
        return prev.filter(p => !presets.includes(p));
      } else {
        const next = [...prev];
        presets.forEach(p => {
          if (!next.includes(p)) next.push(p);
        });
        return next;
      }
    });
  };

  const showToast = (text: string, isError = false) => {
    setToastMessage({ text, isError });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleDownloadCertInMemory = () => {
    try {
      const blob = new Blob([CERT_TEXT], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "upload_certificate.pem";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("আসল upload_certificate.pem ফাইল ডাউনলোড হয়েছে!");
    } catch (err) {
      showToast("ডাউনলোড ব্যর্থ হয়েছে। দয়া করে কোডটি কপি করুন।", true);
    }
  };

  const handleCopyCertInMemory = () => {
    navigator.clipboard.writeText(CERT_TEXT);
    showToast("আসল সার্টিফিকেট টেক্সট কপি হয়েছে!");
  };

  const handleDownloadKeystoreFromMemory = async () => {
    try {
      const res = await fetch("/public/keystore_b64.txt");
      let b64 = "";
      if (res.ok) {
        b64 = (await res.text()).trim();
      }
      if (b64) {
        const byteCharacters = atob(b64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "application/octet-stream" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "release.keystore";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast("✓ release.keystore ডাউনলোড সম্পন্ন হয়েছে!");
        return;
      }
    } catch (err) {
      console.warn("Client fallback to direct link", err);
    }
    const a = document.createElement("a");
    a.href = "/api/download-keystore";
    a.download = "release.keystore";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast("✓ release.keystore ডাউনলোড শুরু হয়েছে!");
  };

  const handleCopyKeystoreBase64 = async () => {
    try {
      const res = await fetch("/public/keystore_b64.txt");
      if (res.ok) {
        const b64 = (await res.text()).trim();
        await navigator.clipboard.writeText(b64);
        showToast("✓ release.keystore-এর Base64 টেক্সট ক্লিপবোর্ডে কপি হয়েছে (CM_KEYSTORE এর জন্য)!");
        return;
      }
    } catch (e) {
      console.error(e);
    }
    showToast("কপি করা যায়নি, দয়া করে ফাইলটি ডাউনলোড করুন।", true);
  };

  // Calculate final discounted sale price automatically
  const regularNum = Number(regularPrice) || 0;
  const discountNum = Number(discountPercent) || 0;
  const finalDiscountPrice = discountNum > 0 && regularNum > 0
    ? Math.round(regularNum - (regularNum * discountNum) / 100)
    : regularNum;

  // Handle image upload from device
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const newUploadedImgs: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const compressedBase64 = await compressImage(file);
        newUploadedImgs.push(compressedBase64);
      }
      setImages((prev) => [...prev, ...newUploadedImgs]);
      showToast("ছবি সফলভাবে আপলোড হয়েছে!");
    } catch (error) {
      console.error("Image upload error:", error);
      showToast("ছবি আপলোড ব্যর্থ হয়েছে", true);
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  // Remove uploaded image
  const handleRemoveImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Submit and save product to selected category
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!productName.trim()) {
      showToast("প্রোডাক্টের নাম লিখুন", true);
      return;
    }
    if (!selectedCategory) {
      showToast("দয়া করে একটি ক্যাটাগরি নির্বাচন করুন", true);
      return;
    }
    if (!regularPrice || Number(regularPrice) <= 0) {
      showToast("প্রোডাক্টের মূল দাম উল্লেখ করুন", true);
      return;
    }
    if (!stockQuantity) {
      showToast("স্টক পরিমাণ উল্লেখ করুন", true);
      return;
    }

    setLoading(true);
    try {
      const primaryImage = images.length > 0 ? images[0] : "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80";
      
      const assignedCode = customProductCode.trim() || String(Math.floor(100 + Math.random() * 900));
      
      const payload = {
        nameBn: productName.trim(),
        nameEn: productName.trim(),
        numericId: Number(assignedCode) || Math.floor(100 + Math.random() * 900),
        code: assignedCode,
        categoryId: selectedCategory,
        price: regularNum,
        discountPercent: discountNum,
        discountPrice: finalDiscountPrice,
        weight: `${stockQuantity} Pcs/Stock`,
        stockQuantity: Number(stockQuantity),
        sizes: productSizes,
        description: description.trim(),
        status: status,
        stockStatus: status === "active" ? "In Stock" : "Out of Stock",
        isFeatured: isFeatured,
        image: primaryImage,
        images: images,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const docRef = await addDoc(collection(db, "products"), payload);

      showToast(`প্রোডাক্ট সফলভাবে সংরক্ষিত! ইউনিক লিংক: /product/${assignedCode || docRef.id}`);

      // Reset form fields
      setProductName("");
      setCustomProductCode(String(Math.floor(100 + Math.random() * 900)));
      setSelectedCategory("");
      setRegularPrice("");
      setDiscountPercent("");
      setStockQuantity("");
      setProductSizes([]);
      setCustomSizeInput("");
      setDescription("");
      setStatus("active");
      setIsFeatured(false);
      setImages([]);

      // Auto switch to all products tab after 1 second so admin can see the new item
      setTimeout(() => {
        setActiveMenu("all-products");
      }, 1000);
    } catch (err: any) {
      console.error("Product save error:", err);
      showToast("প্রোডাক্ট যোগ করতে সমস্যা হয়েছে: " + err.message, true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-50/70 flex flex-col items-stretch overflow-x-hidden overflow-y-auto pb-28 md:pb-16">
      
      {/* Header Bar matching the Screenshot style */}
      <div className="w-full bg-[#004b23] px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/15 backdrop-blur-md text-white flex items-center justify-center active:scale-95 transition-all cursor-pointer shrink-0"
            title="মেনু ওপেন করুন"
          >
            <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-white font-black text-base sm:text-lg leading-none tracking-tight">AL MAYADIN</h1>
            <span className="text-white/70 text-[9px] sm:text-[10px] font-bold tracking-widest mt-0.5 sm:mt-1 uppercase">BAZAR ADMIN</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Quick link to main storefront */}
          <a
            href="/"
            title="ওয়েবসাইটে যান (হোম পেজ)"
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-white/15 hover:bg-white/25 active:scale-95 text-white font-bold text-xs rounded-xl transition cursor-pointer"
          >
            <HomeIcon className="w-4 h-4 text-emerald-300" />
            <span className="hidden sm:inline">হোম পেইজ</span>
          </a>

          {/* Quick 1-click Download release.keystore in Admin Header */}
          <button
            onClick={handleDownloadKeystoreFromMemory}
            title="Android release.keystore ডাউনলোড করুন"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-amber-400 hover:bg-amber-300 active:scale-95 text-gray-950 font-black text-xs rounded-xl shadow-md transition cursor-pointer"
          >
            <KeyRound className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">release.keystore ডাউনলোড</span>
            <span className="sm:hidden">.keystore</span>
          </button>

          {/* Quick 1-click In-Memory Download .PEM file in Admin Header */}
          <button
            onClick={handleDownloadCertInMemory}
            title="গুগল প্লে আপলোড সার্টিফিকেট (.PEM) ডাউনলোড"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-gray-950 font-black text-xs rounded-xl shadow-md transition cursor-pointer"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Play Cert (.PEM) ডাউনলোড</span>
            <span className="sm:hidden">.PEM</span>
          </button>

          <div className="relative">
            <button className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/10 text-white flex items-center justify-center active:scale-95 transition-all">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-[#ffcc00] border-2 border-[#004b23] rounded-full text-[8px] sm:text-[9px] font-black text-gray-900 flex items-center justify-center">
              3
            </span>
          </div>
        </div>
      </div>

      {/* Horizontal Quick Navigation Bar (Mobile-friendly horizontal swipe tabs) */}
      <div className="w-full bg-white border-b border-gray-200/90 shadow-2xs sticky top-[53px] sm:top-[65px] z-30 overflow-x-auto no-scrollbar scroll-smooth">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2 flex items-center gap-1.5 min-w-max">
          {[
            { id: "all-products", label: "সকল প্রোডাক্ট", icon: Package },
            { id: "signing-keystore", label: "🔑 সাইনিং কি (.keystore)", icon: KeyRound },
            { id: "add-product", label: "নতুন প্রোডাক্ট যোগ", icon: PackagePlus },
            { id: "orders", label: "অর্ডারসমূহ", icon: ClipboardList },
            { id: "user-management", label: "ইউজার", icon: Users },
            { id: "banner-management", label: "ব্যানার", icon: ImageIcon },
            { id: "delivery-management", label: "কুরিয়ার ডেলিভারি", icon: Truck },
            { id: "delivery-settings", label: "ডেলিভারি সেটিংস", icon: Settings },
            { id: "food-subcategories", label: "খাদ্য সাব-ক্যাটাগরি", icon: LayoutGrid },
            { id: "category-icons", label: "ক্যাটাগরি ফটো", icon: ImageIcon },
            { id: "category-visibility", label: "ক্যাটাগরি দৃশ্যমানতা (On/Off)", icon: Eye },
            { id: "main-banners", label: "মেইন ব্যানার", icon: ImageIcon },
            { id: "onesignal", label: "নোটিফিকেশন", icon: Bell },
            { id: "email-automation", label: "ইমেল অটোমেশন", icon: Mail },
            { id: "integration-center", label: "ইন্টিগ্রেশন", icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeMenu === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveMenu(tab.id as any);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap active:scale-95 cursor-pointer ${
                  isActive
                    ? "bg-[#004b23] text-white shadow-sm"
                    : "bg-gray-100/90 hover:bg-gray-200/80 text-gray-700"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-emerald-300" : "text-gray-500"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Side Drawer Menu */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-black/60 z-50"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
              className="fixed top-0 left-0 h-full w-72 bg-white z-50 shadow-2xl flex flex-col will-change-transform"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#5842dc] flex items-center justify-center text-white">
                    <LayoutDashboard className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-black text-gray-900">এডমিন প্যানেল</h2>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-all text-gray-400"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                <MenuButton
                  icon={<Package />}
                  label="সকল প্রোডাক্ট"
                  active={activeMenu === "all-products"}
                  onClick={() => {
                    setActiveMenu("all-products");
                    setIsDrawerOpen(false);
                  }}
                />
                <MenuButton
                  icon={<KeyRound className="text-amber-500" />}
                  label="🔑 সাইনিং কি-স্টোর (.keystore)"
                  active={activeMenu === "signing-keystore"}
                  onClick={() => {
                    setActiveMenu("signing-keystore");
                    setIsDrawerOpen(false);
                  }}
                />
                <MenuButton
                  icon={<PackagePlus />}
                  label="প্রোডাক্ট যোগ করুন"
                  active={activeMenu === "add-product"}
                  onClick={() => {
                    setActiveMenu("add-product");
                    setIsDrawerOpen(false);
                  }}
                />
                <MenuButton
                  icon={<ImageIcon />}
                  label="ব্যানার ম্যানেজমেন্ট"
                  active={activeMenu === "banner-management"}
                  onClick={() => {
                    setActiveMenu("banner-management");
                    setIsDrawerOpen(false);
                  }}
                />
                <MenuButton
                  icon={<Truck />}
                  label="ডেলিভারি ম্যানেজমেন্ট"
                  active={activeMenu === "delivery-management"}
                  onClick={() => {
                    setActiveMenu("delivery-management");
                    setIsDrawerOpen(false);
                  }}
                />
                <MenuButton
                  icon={<Settings />}
                  label="ডেলিভারি সেটিংস"
                  active={activeMenu === "delivery-settings"}
                  onClick={() => {
                    setActiveMenu("delivery-settings");
                    setIsDrawerOpen(false);
                  }}
                />
                <MenuButton
                  icon={<Bell className="text-amber-500" />}
                  label="পুশ নোটিফিকেশন"
                  active={activeMenu === "onesignal"}
                  onClick={() => {
                    setActiveMenu("onesignal");
                    setIsDrawerOpen(false);
                  }}
                />
                <MenuButton
                  icon={<Mail className="text-emerald-600" />}
                  label="ইমেল অটোমেশন ও মার্কেটিং"
                  active={activeMenu === "email-automation"}
                  onClick={() => {
                    setActiveMenu("email-automation");
                    setIsDrawerOpen(false);
                  }}
                />
                <MenuButton
                  icon={<Settings />}
                  label="ইন্টিগ্রেশন সেন্টার"
                  active={activeMenu === "integration-center"}
                  onClick={() => {
                    setActiveMenu("integration-center");
                    setIsDrawerOpen(false);
                  }}
                />
                <MenuButton
                  icon={<ClipboardList />}
                  label="অর্ডারসমূহ"
                  active={activeMenu === "orders"}
                  onClick={() => {
                    setActiveMenu("orders");
                    setIsDrawerOpen(false);
                  }}
                />
                <MenuButton
                  icon={<Users />}
                  label="ইউজার ম্যানেজমেন্ট"
                  active={activeMenu === "user-management"}
                  onClick={() => {
                    setActiveMenu("user-management");
                    setIsDrawerOpen(false);
                  }}
                />
                <MenuButton
                  icon={<LayoutGrid />}
                  label="খাদ্য সাব-ক্যাটাগরি"
                  active={activeMenu === "food-subcategories"}
                  onClick={() => {
                    setActiveMenu("food-subcategories");
                    setIsDrawerOpen(false);
                  }}
                />
                <MenuButton
                  icon={<ImageIcon />}
                  label="ক্যাটাগরি ফটো"
                  active={activeMenu === "category-icons"}
                  onClick={() => {
                    setActiveMenu("category-icons");
                    setIsDrawerOpen(false);
                  }}
                />
                <MenuButton
                  icon={<Eye className="text-emerald-600" />}
                  label="ক্যাটাগরি দৃশ্যমানতা (On/Off)"
                  active={activeMenu === "category-visibility"}
                  onClick={() => {
                    setActiveMenu("category-visibility");
                    setIsDrawerOpen(false);
                  }}
                />
                <MenuButton
                  icon={<ImageIcon />}
                  label="মেইন ব্যানার"
                  active={activeMenu === "main-banners"}
                  onClick={() => {
                    setActiveMenu("main-banners");
                    setIsDrawerOpen(false);
                  }}
                />

                <div className="pt-2 space-y-2">
                  <a
                    href="/release.keystore"
                    download="release.keystore"
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white transition-all font-bold text-sm shadow-sm cursor-pointer"
                  >
                    <KeyRound className="w-5 h-5 text-amber-200" />
                    <span>release.keystore ডাউনলোড</span>
                  </a>
                  <a
                    href="/api/download-upload-cert"
                    download="upload_certificate.pem"
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-600 text-white transition-all font-bold text-sm shadow-sm cursor-pointer"
                  >
                    <Download className="w-5 h-5 text-emerald-300" />
                    <span>Google Play Cert (.PEM) ডাউনলোড</span>
                  </a>
                </div>
              </div>

              <div className="p-4 border-t border-gray-100">
                <button 
                  onClick={() => window.location.href = "/"}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-gray-600 hover:bg-gray-50 transition-all font-bold"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>হোম পেইজ</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Prominent Direct Android Signing Keystore & Certificate Download Banner in Admin Dashboard */}
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 pt-3 pb-2">
        <div className="bg-gradient-to-r from-[#032517] via-[#053d26] to-[#042819] border-2 border-emerald-500/60 rounded-2xl p-3 sm:p-4 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3.5 w-full md:w-auto">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-400/30 shadow-inner">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">
                  Android Signing: release.keystore
                </h3>
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-bold rounded-full border border-amber-400/30">
                  Codemagic & Play Store
                </span>
              </div>
              <p className="text-xs text-emerald-200/90 mt-0.5">
                Codemagic AAB সাইন করার আসল কি (Alias: <code className="text-amber-300 font-mono">almayadin</code> | Pass: <code className="text-amber-300 font-mono">almayadin123</code>)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full md:w-auto shrink-0">
            <button
              onClick={handleDownloadKeystoreFromMemory}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-amber-400 hover:bg-amber-300 active:scale-95 text-gray-950 font-black text-xs sm:text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>ডাউনলোড .keystore</span>
            </button>
            <button
              onClick={handleCopyKeystoreBase64}
              className="flex-1 sm:flex-none px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Base64 কপি</span>
            </button>
            <button
              onClick={() => {
                setActiveMenu("signing-keystore");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="w-full sm:w-auto px-3.5 py-2.5 bg-white/15 hover:bg-white/25 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 border border-white/20 transition cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>সম্পূর্ণ তথ্য ও গাইড</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area - Scrollable, Full Width & Fully Mobile-Optimized */}
      <main className="w-full max-w-7xl mx-auto px-2 sm:px-4 md:px-6 py-2 sm:py-4 flex-1 flex flex-col items-center">
        {/* VIEW 1: ALL PRODUCTS MANAGEMENT (VIEW, EDIT, DELETE) */}
        {activeMenu === "all-products" ? (
          <ProductManagement onNavigateToAddProduct={() => setActiveMenu("add-product")} />
        ) : activeMenu === "signing-keystore" ? (
          /* VIEW: ANDROID SIGNING KEYSTORE MANAGEMENT & DOWNLOAD */
          <div className="w-full max-w-4xl px-2 sm:px-4 py-4 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-2.5">
                  <span className="p-2 bg-amber-100 text-amber-700 rounded-xl">
                    <KeyRound className="w-6 h-6" />
                  </span>
                  অ্যান্ড্রয়েড রিলিজ সাইনিং কি-স্টোর
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Google Play Store এবং Codemagic-এ রিলিজ AAB সাইন করার আসল কি-স্টোর ফাইল ও ক্রেডেনশিয়াল
                </p>
              </div>
              <button
                onClick={() => setActiveMenu("all-products")}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl active:scale-95 transition flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>ফিরে যান</span>
              </button>
            </div>

            {/* Main Action Card */}
            <div className="bg-white rounded-2xl border-2 border-emerald-500/40 p-5 sm:p-6 shadow-md">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-5 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
                      ✓ মূল কি-স্টোর সংরক্ষিত
                    </span>
                    <span className="text-xs text-gray-500 font-mono">2,758 Bytes (PKCS12)</span>
                  </div>
                  <h3 className="text-lg font-black text-gray-900 mt-1 font-mono">
                    release.keystore
                  </h3>
                  <p className="text-xs text-gray-600 mt-0.5">
                    এই ফাইলটি দিয়ে আপনার অ্যাপের প্রতিটি সংস্করণ গুগল প্লে-র জন্য সাইন করা হয়।
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                  <button
                    onClick={handleDownloadKeystoreFromMemory}
                    className="flex-1 sm:flex-none px-5 py-3 bg-amber-400 hover:bg-amber-300 text-gray-950 font-black text-sm rounded-xl shadow-md active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-5 h-5 stroke-[2.5]" />
                    <span>release.keystore ডাউনলোড</span>
                  </button>

                  <a
                    href="/api/download-keystore"
                    download="release.keystore"
                    className="px-3.5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl active:scale-95 transition flex items-center justify-center gap-1 cursor-pointer"
                    title="ডাইরেক্ট সার্ভার লিংক"
                  >
                    <span>ডাইরেক্ট লিংক</span>
                  </a>
                </div>
              </div>

              {/* Codemagic Environment Variables Table with 1-click Copy */}
              <div className="mt-5 space-y-3">
                <h4 className="text-sm font-black text-gray-900 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-emerald-600" />
                  Codemagic Secure Environment Variables (কপি করে বসান):
                </h4>

                <div className="grid grid-cols-1 gap-2.5">
                  {/* CM_KEYSTORE Base64 */}
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          CM_KEYSTORE
                        </span>
                        <span className="text-[11px] text-gray-500">Base64 Encoded Keystore Data</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 font-mono text-ellipsis overflow-hidden">
                        3,680 অক্ষরবিশিষ্ট সম্পূর্ণ Base64 স্ট্রিং
                      </p>
                    </div>
                    <button
                      onClick={handleCopyKeystoreBase64}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg active:scale-95 transition flex items-center gap-1.5 shrink-0"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Base64 কপি করুন</span>
                    </button>
                  </div>

                  {/* CM_KEY_ALIAS */}
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          CM_KEY_ALIAS
                        </span>
                        <span className="text-[11px] text-gray-500">Key Alias Name</span>
                      </div>
                      <p className="text-xs text-gray-800 mt-1 font-mono font-bold">
                        almayadin
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText("almayadin");
                        showToast("✓ CM_KEY_ALIAS ('almayadin') কপি হয়েছে!");
                      }}
                      className="px-3.5 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs rounded-lg active:scale-95 transition flex items-center gap-1.5 shrink-0"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>কপি করুন</span>
                    </button>
                  </div>

                  {/* CM_KEYSTORE_PASSWORD */}
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          CM_KEYSTORE_PASSWORD
                        </span>
                        <span className="text-[11px] text-gray-500">Keystore Password</span>
                      </div>
                      <p className="text-xs text-gray-800 mt-1 font-mono font-bold">
                        almayadin123
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText("almayadin123");
                        showToast("✓ CM_KEYSTORE_PASSWORD ('almayadin123') কপি হয়েছে!");
                      }}
                      className="px-3.5 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs rounded-lg active:scale-95 transition flex items-center gap-1.5 shrink-0"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>কপি করুন</span>
                    </button>
                  </div>

                  {/* CM_KEY_PASSWORD */}
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                          CM_KEY_PASSWORD
                        </span>
                        <span className="text-[11px] text-gray-500">Key Password (ঐচ্ছিক)</span>
                      </div>
                      <p className="text-xs text-gray-800 mt-1 font-mono font-bold">
                        almayadin123
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText("almayadin123");
                        showToast("✓ CM_KEY_PASSWORD ('almayadin123') কপি হয়েছে!");
                      }}
                      className="px-3.5 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs rounded-lg active:scale-95 transition flex items-center gap-1.5 shrink-0"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>কপি করুন</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Instructions & Help */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option 1: Upload File */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                <h4 className="font-black text-gray-900 text-sm flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-xs flex items-center justify-center font-bold">১</span>
                  Codemagic-এ সরাসরি ফাইল আপলোড:
                </h4>
                <ol className="text-xs text-gray-600 mt-3 space-y-2 list-decimal list-inside">
                  <li>উপরের <strong className="text-gray-900">"release.keystore ডাউনলোড"</strong> বাটনে ক্লিক করে ফাইলটি সংরক্ষণ করুন।</li>
                  <li>Codemagic ড্যাশবোর্ডে গিয়ে <strong className="text-gray-900">Code signing</strong> সেকশনে যান।</li>
                  <li><strong className="text-gray-900">release.keystore</strong> ফাইলটি আপলোড করুন।</li>
                  <li>Password: <code className="bg-gray-100 px-1 py-0.5 rounded text-amber-700 font-bold font-mono">almayadin123</code> এবং Alias: <code className="bg-gray-100 px-1 py-0.5 rounded text-blue-700 font-bold font-mono">almayadin</code> দিন।</li>
                </ol>
              </div>

              {/* Option 2: Base64 Variable */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                <h4 className="font-black text-gray-900 text-sm flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 text-xs flex items-center justify-center font-bold">২</span>
                  Environment Variables এ Base64 যোগ:
                </h4>
                <ol className="text-xs text-gray-600 mt-3 space-y-2 list-decimal list-inside">
                  <li><strong className="text-emerald-700">"Base64 কপি করুন"</strong> বাটনে ক্লিক করুন।</li>
                  <li>Codemagic-এর <strong className="text-gray-900">Environment variables</strong> ট্যাবে যান।</li>
                  <li>Variable: <code className="bg-gray-100 px-1 py-0.5 rounded font-bold font-mono">CM_KEYSTORE</code> এবং Value ঘরে পেস্ট করুন।</li>
                  <li><strong className="text-gray-900">Secure</strong> চেকবক্সে টিক দিয়ে সেভ করে নতুন বিল্ড দিন।</li>
                </ol>
              </div>
            </div>

            {/* Other Cert Files */}
            <div className="bg-gray-100/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Google Play Console আপলোড সার্টিফিকেটের প্রয়োজন হলে .PEM ডাউনলোড করুন</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadCertInMemory}
                  className="px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg text-gray-800 font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>.PEM সার্টিফিকেট</span>
                </button>
                <a
                  href="/download-keystore.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg text-gray-800 font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <span>আলাদা পেজ</span>
                </a>
              </div>
            </div>
          </div>
        ) : activeMenu === "banner-management" ? (
          /* VIEW 2: BANNER MANAGEMENT */
          <BannerManagement />
        ) : activeMenu === "delivery-settings" ? (
          /* VIEW 4: DELIVERY SETTINGS */
          <DeliverySettings />
        ) : activeMenu === "delivery-management" ? (
          /* VIEW 9: COURIER DELIVERY MANAGEMENT */
          <CourierDeliveryManagement />
        ) : activeMenu === "orders" ? (
          /* VIEW 5: ORDER MANAGEMENT */
          <OrderManagement />
        ) : activeMenu === "food-subcategories" ? (
          /* VIEW 6: FOOD SUBCATEGORIES MANAGEMENT */
          <FoodSubcategoryManagement />
        ) : activeMenu === "category-icons" ? (
          /* VIEW 7: CATEGORY ICONS MANAGEMENT */
          <CategoryIconManagement />
        ) : activeMenu === "category-visibility" ? (
          /* VIEW 7.5: CATEGORY VISIBILITY ON/OFF CONTROL */
          <CategoryVisibilityManagement />
        ) : activeMenu === "main-banners" ? (
          /* VIEW 8: MAIN DASHBOARD BANNER MANAGEMENT */
          <MainBannerManagement />
        ) : activeMenu === "onesignal" ? (
          /* VIEW 9: ONESIGNAL PUSH NOTIFICATIONS DIRECT */
          <div className="w-full max-w-4xl px-2 sm:px-4 py-4">
            <OneSignalConfig 
              onBack={() => setActiveMenu("all-products")} 
              preSelectedUser={selectedUserForNotification}
              clearPreSelectedUser={() => setSelectedUserForNotification(null)}
            />
          </div>
        ) : activeMenu === "email-automation" ? (
          /* VIEW 9.5: ONESIGNAL EMAIL AUTOMATION & MARKETING */
          <div className="w-full max-w-6xl px-2 sm:px-4 py-4">
            <EmailAutomationSection />
          </div>
        ) : activeMenu === "integration-center" ? (
          /* VIEW 10: INTEGRATION CENTER */
          <IntegrationCenter preSelectedUser={selectedUserForNotification} clearPreSelectedUser={() => setSelectedUserForNotification(null)} />
        ) : activeMenu === "user-management" ? (
          /* VIEW 11: USER MANAGEMENT */
          <div className="w-full max-w-5xl px-2 sm:px-4 py-4">
            <UserManagement onSendNotification={handleSendNotificationToUser} />
          </div>
        ) : (
          /* VIEW 3: PRODUCT ADD FORM */
          <div className="w-full max-w-2xl bg-white rounded-2xl md:rounded-[32px] shadow-sm md:shadow-xl border border-gray-200/90 md:border-gray-100 my-2 mb-20 overflow-visible">
          
          {/* Top Header Bar */}
          <header className="px-4 py-3.5 flex items-center justify-between border-b border-gray-100 sticky top-0 bg-white z-20">
            <div className="flex items-center gap-3">
              <button 
                type="button"
                onClick={() => setActiveMenu("all-products")}
                className="p-1.5 text-gray-700 hover:text-black rounded-lg active:scale-95 transition-all"
                title="সকল প্রোডাক্ট তালিকায় ফিরুন"
              >
                <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
              </button>
            </div>

            <h1 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
              নতুন প্রোডাক্ট যোগ করুন
            </h1>

            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={loading}
              className="bg-[#5842dc] hover:bg-[#4b35cf] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>সংরক্ষণ</span>
            </button>
          </header>

          {/* Toast Notification */}
          {toastMessage && (
            <div
              className={`mx-4 mt-3 p-3 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all ${
                toastMessage.isError
                  ? "bg-rose-50 border border-rose-200 text-rose-700"
                  : "bg-emerald-50 border border-emerald-200 text-[#004b23]"
              }`}
            >
              {toastMessage.isError ? (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-[#004b23] shrink-0" />
              )}
              <span>{toastMessage.text}</span>
            </div>
          )}

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5">
            
            {/* 1. প্রোডাক্টের ছবি */}
            <div className="space-y-3">
              <label className="block text-sm font-black text-gray-900">
                প্রোডাক্টের ছবি
              </label>

              {/* Dotted Upload Dropzone */}
              <label className="border-2 border-dashed border-[#5842dc]/40 hover:border-[#5842dc] rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer bg-[#f9f9ff] transition-all group">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-[#5842dc] mb-2 group-hover:scale-110 transition-transform">
                  <Upload className="w-7 h-7 stroke-[2.2]" />
                </div>
                <span className="text-xs sm:text-sm font-black text-[#5842dc]">
                  {isUploading ? "ছবি আপলোড হচ্ছে..." : "ছবি আপলোড করুন"}
                </span>
                <span className="text-[11px] text-gray-400 font-medium mt-0.5">
                  বা ট্যাপ করে নির্বাচন করুন
                </span>
              </label>

              {/* Image Preview & Add (+) Thumbnails */}
              <div className="flex items-center gap-2.5 overflow-x-auto py-1">
                {images.map((imgUrl, idx) => (
                  <div
                    key={idx}
                    className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-2xl border border-gray-200 overflow-hidden bg-gray-50 shrink-0 shadow-xs"
                  >
                    <img
                      src={imgUrl}
                      alt={`Preview ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center shadow-md active:scale-90 transition-all"
                    >
                      <X className="w-2.5 h-2.5 stroke-[3]" />
                    </button>
                  </div>
                ))}

                {/* Add more button */}
                <label className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl border-2 border-dashed border-gray-300 hover:border-gray-400 flex items-center justify-center cursor-pointer text-gray-400 hover:text-gray-600 bg-gray-50/50 shrink-0 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Plus className="w-6 h-6 stroke-[2]" />
                </label>
              </div>
            </div>

            {/* 2. প্রোডাক্টের নাম ও ইউনিক আইডি */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-gray-800">
                  প্রোডাক্টের নাম <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="প্রোডাক্টের নাম লিখুন"
                  className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-3 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5842dc]/40 focus:border-[#5842dc] transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-gray-800 flex items-center justify-between">
                  <span>ইউনিক আইডি (ID)</span>
                  <button
                    type="button"
                    onClick={() => setCustomProductCode(String(Math.floor(100 + Math.random() * 900)))}
                    className="text-[10px] text-[#5842dc] font-black hover:underline"
                  >
                    নতুন জেনারেট
                  </button>
                </label>
                <input
                  type="text"
                  value={customProductCode}
                  onChange={(e) => setCustomProductCode(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ""))}
                  placeholder="উদাহরণ: 458"
                  className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-3 text-xs sm:text-sm text-gray-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#5842dc]/40 focus:border-[#5842dc] transition-all"
                />
              </div>
            </div>

            {/* লাইভ অ্যাপ ডিপ লিংক প্রিভিউ */}
            <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-black text-[#004b23] uppercase tracking-wider block">
                  📱 নেটিভ অ্যাপ ডিপ লিংক (ডোমেন ছাড়া সরাসরি অ্যাপ ওপেন)
                </span>
                <span className="text-xs font-mono font-bold text-[#004b23] truncate block mt-0.5">
                  almayadinbazar://product/{customProductCode || "458"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const url = `almayadinbazar://product/${customProductCode || "458"}`;
                  navigator.clipboard?.writeText(url);
                  showToast("অ্যাপ ডিপ লিংক কপি করা হয়েছে!");
                }}
                className="px-3 py-1.5 bg-white hover:bg-emerald-100 text-[#004b23] border border-emerald-200 rounded-xl text-xs font-black shrink-0 transition-all active:scale-95 shadow-2xs"
              >
                ডিপ লিংক কপি
              </button>
            </div>

            {/* 3. ক্যাটাগরি */}
            <div className="space-y-1.5">
              <label className="block text-xs sm:text-sm font-bold text-gray-800">
                ক্যাটাগরি <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  required
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-3 text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5842dc]/40 focus:border-[#5842dc] appearance-none cursor-pointer transition-all pr-10"
                >
                  <option value="" disabled>
                    ক্যাটাগরি নির্বাচন করুন
                  </option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nameBn}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* 4. দাম (৳), ডিসকাউন্ট ছাড় (%) এবং স্টক পরিমাণ */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              
              {/* মূল দাম */}
              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-gray-800">
                  মূল দাম (৳) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  value={regularPrice}
                  onChange={(e) => setRegularPrice(e.target.value)}
                  placeholder="যেমন: 1200"
                  className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-3 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5842dc]/40 focus:border-[#5842dc] transition-all"
                />
              </div>

              {/* ছাড় / ডিসকাউন্ট (%) */}
              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-gray-800 flex items-center justify-between">
                  <span>ছাড় (%)</span>
                  {discountNum > 0 && (
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-md">
                      {discountNum}% অফ
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(e.target.value)}
                    placeholder="যেমন: 15"
                    className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-3 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5842dc]/40 focus:border-[#5842dc] transition-all pr-8"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <Percent className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              {/* স্টক পরিমাণ */}
              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-gray-800">
                  স্টক পরিমাণ <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  placeholder="যেমন: 25"
                  className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-3 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5842dc]/40 focus:border-[#5842dc] transition-all"
                />
              </div>
            </div>

            {/* লাইভ ডিসকাউন্ট হিসেব প্রিভিউ কার্ড */}
            {discountNum > 0 && regularNum > 0 && (
              <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#5842dc] text-white flex items-center justify-center text-xs font-black">
                    %
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-500 font-bold">ছাড়ের পর বিক্রয় মূল্য:</p>
                    <p className="text-sm font-black text-[#5842dc]">
                      ৳{finalDiscountPrice} <span className="text-xs text-gray-400 line-through font-normal">৳{regularNum}</span>
                    </p>
                  </div>
                </div>
                <span className="text-xs font-black text-emerald-600 bg-white px-2.5 py-1 rounded-xl shadow-xs border border-emerald-100">
                  সাশ্রয়: ৳{regularNum - finalDiscountPrice} ({discountNum}%)
                </span>
              </div>
            )}

            {/* 4.5. সাইজ ও ভ্যারিয়েন্ট ব্যবস্থাপনা (Sizes / Variants for Clothing & Products) */}
            <div className="space-y-3 p-4 bg-gradient-to-br from-purple-50/70 to-indigo-50/40 rounded-2xl border border-purple-100/90">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <div>
                  <label className="text-xs sm:text-sm font-black text-gray-900 flex items-center gap-1.5">
                    <span className="p-1 bg-[#5842dc]/10 text-[#5842dc] rounded-lg">
                      <Tag className="w-4 h-4" />
                    </span>
                    প্রোডাক্টের সাইজ / ভ্যারিয়েন্ট (Sizes)
                  </label>
                  <p className="text-[11px] text-gray-500 font-medium">
                    কাপড়, পোশাক বা পণ্যের সাইজ যোগ করুন যেন কাস্টমার সাইজ সিলেক্ট করে অর্ডার করতে পারে।
                  </p>
                </div>
                {productSizes.length > 0 && (
                  <span className="text-[10px] font-black text-[#5842dc] bg-white px-2.5 py-1 rounded-full border border-purple-200 shrink-0 w-fit">
                    মোট {productSizes.length}টি সাইজ সিলেক্টেড
                  </span>
                )}
              </div>

              {/* Quick Preset Buttons */}
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-bold text-gray-700 block">⚡ দ্রুত সাইজ সেট যোগ করুন (Quick Presets):</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleTogglePresetSizes(["S", "M", "L", "XL", "XXL"])}
                    className="px-2.5 py-1 bg-white hover:bg-purple-100/80 border border-purple-200 text-[#5842dc] rounded-xl text-[11px] font-bold transition-all active:scale-95 shadow-2xs"
                  >
                    👕 শার্ট/টি-শার্ট (S, M, L, XL, XXL)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTogglePresetSizes(["38", "40", "42", "44"])}
                    className="px-2.5 py-1 bg-white hover:bg-purple-100/80 border border-purple-200 text-[#5842dc] rounded-xl text-[11px] font-bold transition-all active:scale-95 shadow-2xs"
                  >
                    👔 পাঞ্জাবি/প্যান্ট (38, 40, 42, 44)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTogglePresetSizes(["52", "54", "56", "Free Size"])}
                    className="px-2.5 py-1 bg-white hover:bg-purple-100/80 border border-purple-200 text-[#5842dc] rounded-xl text-[11px] font-bold transition-all active:scale-95 shadow-2xs"
                  >
                    👗 বোরকা/শাড়ি (52, 54, 56, Free Size)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTogglePresetSizes(["39", "40", "41", "42", "43"])}
                    className="px-2.5 py-1 bg-white hover:bg-purple-100/80 border border-purple-200 text-[#5842dc] rounded-xl text-[11px] font-bold transition-all active:scale-95 shadow-2xs"
                  >
                    👟 জুতা (39, 40, 41, 42, 43)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTogglePresetSizes(["500g", "1kg", "2kg", "5kg"])}
                    className="px-2.5 py-1 bg-white hover:bg-purple-100/80 border border-purple-200 text-[#5842dc] rounded-xl text-[11px] font-bold transition-all active:scale-95 shadow-2xs"
                  >
                    🌾 খাদ্য ওজন (500g, 1kg, 2kg, 5kg)
                  </button>
                </div>
              </div>

              {/* Custom Size Input */}
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={customSizeInput}
                  onChange={(e) => setCustomSizeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      if (customSizeInput.trim()) {
                        handleAddSize(customSizeInput);
                        setCustomSizeInput("");
                      }
                    }
                  }}
                  placeholder="অন্যান্য কাস্টম সাইজ লিখুন (যেমন: 46 বা 3XL)..."
                  className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5842dc]/40"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customSizeInput.trim()) {
                      handleAddSize(customSizeInput);
                      setCustomSizeInput("");
                    }
                  }}
                  className="px-4 py-2 bg-[#5842dc] hover:bg-[#4b35cf] text-white rounded-xl text-xs font-bold shrink-0 active:scale-95 transition-all shadow-2xs"
                >
                  যোগ করুন
                </button>
              </div>

              {/* Selected Sizes Chips */}
              {productSizes.length > 0 ? (
                <div className="pt-1">
                  <span className="text-[11px] font-bold text-gray-600 block mb-1.5">নির্বাচিত সাইজসমূহ (কাস্টমার দেখতে পাবে):</span>
                  <div className="flex flex-wrap gap-2">
                    {productSizes.map((sz, idx) => (
                      <div
                        key={idx}
                        className="inline-flex items-center gap-1.5 bg-white border border-purple-200 text-[#5842dc] px-3 py-1.5 rounded-xl text-xs font-black shadow-2xs group"
                      >
                        <span>{sz}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSize(sz)}
                          className="text-gray-400 hover:text-red-500 rounded-full p-0.5 hover:bg-red-50 transition-colors"
                          title="মুছে ফেলুন"
                        >
                          <X className="w-3 h-3 stroke-[3]" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setProductSizes([])}
                      className="text-[10px] text-red-500 font-bold hover:underline px-2 py-1 self-center"
                    >
                      সব মুছুন
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 bg-white/80 rounded-xl border border-dashed border-purple-200 text-center">
                  <p className="text-[11px] text-gray-400 font-medium">
                    এখনও কোনো সাইজ যোগ করা হয়নি। উপরের প্রিসেট বাটন অথবা কাস্টম বক্সে লিখে সাইজ যোগ করুন।
                  </p>
                </div>
              )}
            </div>

            {/* 5. প্রোডাক্টের বিবরণ */}
            <div className="space-y-1.5">
              <label className="block text-xs sm:text-sm font-bold text-gray-800">
                প্রোডাক্টের বিবরণ
              </label>
              <div className="relative">
                <textarea
                  rows={4}
                  maxLength={500}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="প্রোডাক্ট সম্পর্কে বিস্তারিত লিখুন..."
                  className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-3 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5842dc]/40 focus:border-[#5842dc] resize-none transition-all pb-6"
                />
                <span className="absolute right-3 bottom-2.5 text-[10px] font-bold text-gray-400">
                  {description.length}/500
                </span>
              </div>
            </div>

            {/* 6. প্রোডাক্ট স্ট্যাটাস */}
            <div className="space-y-2">
              <label className="block text-xs sm:text-sm font-bold text-gray-800">
                প্রোডাক্ট স্ট্যাটাস
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div
                  onClick={() => setStatus("active")}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-center ${
                    status === "active"
                      ? "border-[#5842dc] bg-[#f5f3ff] ring-1 ring-[#5842dc]"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        status === "active"
                          ? "border-[#5842dc]"
                          : "border-gray-400"
                      }`}
                    >
                      {status === "active" && (
                        <div className="w-2 h-2 rounded-full bg-[#5842dc]" />
                      )}
                    </div>
                    <span className="text-xs sm:text-sm font-black text-gray-900">
                      অ্যাক্টিভ
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-gray-500 font-medium pl-6">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>সাইটে প্রদর্শিত হবে</span>
                  </div>
                </div>

                <div
                  onClick={() => setStatus("inactive")}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-center ${
                    status === "inactive"
                      ? "border-[#5842dc] bg-[#f5f3ff] ring-1 ring-[#5842dc]"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        status === "inactive"
                          ? "border-[#5842dc]"
                          : "border-gray-400"
                      }`}
                    >
                      {status === "inactive" && (
                        <div className="w-2 h-2 rounded-full bg-[#5842dc]" />
                      )}
                    </div>
                    <span className="text-xs sm:text-sm font-black text-gray-900">
                      ইনঅ্যাক্টিভ
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-gray-500 font-medium pl-6">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    <span>সাইটে প্রদর্শিত হবে না</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 7. ফিচার্ড প্রোডাক্ট টগল */}
            <div className="p-3.5 rounded-2xl border border-gray-200 bg-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#ede9fe] text-[#5842dc] flex items-center justify-center shrink-0">
                  <Tag className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-gray-900">
                    ফিচার্ড প্রোডাক্ট
                  </h4>
                  <p className="text-[10px] sm:text-xs text-gray-400 font-medium">
                    হোম পেইজে ফিচার্ড হিসেবে দেখাবে
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsFeatured(!isFeatured)}
                className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                  isFeatured ? "bg-[#5842dc]" : "bg-gray-200"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                    isFeatured ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* 8. বটম সাবমিট বাটন */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#5842dc] hover:bg-[#4b35cf] text-white py-3.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all disabled:opacity-50"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>{loading ? "সংরক্ষণ করা হচ্ছে..." : "প্রোডাক্ট যোগ করুন"}</span>
              </button>
            </div>

          </form>

        </div>
      )}
      </main>

    </div>
  );
};

// Helper Component for Drawer Menu Buttons
interface MenuButtonProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

const MenuButton: React.FC<MenuButtonProps> = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all font-bold text-sm ${
      active
        ? "bg-[#5842dc]/10 text-[#5842dc] shadow-sm"
        : "text-gray-600 hover:bg-gray-50"
    }`}
  >
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
      active ? "bg-[#5842dc] text-white" : "bg-gray-100 text-gray-400"
    }`}>
      {React.cloneElement(icon as React.ReactElement, { className: "w-5 h-5" })}
    </div>
    <span>{label}</span>
  </button>
);

export default Admin;
