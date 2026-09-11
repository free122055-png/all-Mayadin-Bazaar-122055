import React, { useState, useEffect, useRef, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { motion, AnimatePresence } from "motion/react";
import {
  Camera,
  X,
  Zap,
  RotateCw,
  Upload,
  Keyboard,
  Sparkles,
  ShoppingCart,
  Check,
  CheckCheck,
  RefreshCw,
  AlertCircle,
  ArrowLeft,
  Store,
  Award,
  ChevronRight,
  Minus,
  Plus,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Package,
  Truck,
  User,
  Phone,
  MapPin,
  Search,
  Volume2,
  VolumeX,
  History,
  Copy,
  Tag,
  Clock,
  Trash2,
  QrCode,
  Barcode as BarcodeIcon,
  FileImage,
  Layers,
  ZoomIn,
  ZoomOut,
  ArrowUpRight,
  Percent,
  Star,
  Info,
  Maximize2,
  Sliders,
  CheckCircle,
  Navigation,
  Share2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useScanner, ScannerUserRole } from "../context/ScannerContext";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import {
  ScannedProduct,
  ScannedOrder,
  ScannedCoupon,
  CATALOG_PRODUCTS,
  DEMO_ORDERS,
  DEMO_COUPONS,
  updateProductStockInDb,
  updateOrderStatusInDb,
  ScanLookupResult,
} from "../lib/scannerLookup";
import { soundEngine } from "../lib/soundEffects";

interface ScanHistoryItem {
  id: string;
  code: string;
  type: "product" | "order" | "coupon" | "unknown";
  title: string;
  subtitle?: string;
  image?: string;
  price?: number;
  timestamp: string;
}

export const CentralScannerModal: React.FC = () => {
  const {
    isScannerOpen,
    activeRole,
    scanResult,
    closeScanner,
    setActiveRole,
    processCode,
    clearResult,
  } = useScanner();

  const { addItem } = useCart();
  const { requireAuth } = useAuth();
  const navigate = useNavigate();

  // Active Main Navigation View Tab
  const [activeNavTab, setActiveNavTab] = useState<"scanner" | "samples" | "history" | "manual">("scanner");

  // Sample categories tab inside samples box
  const [sampleCategory, setSampleCategory] = useState<"food" | "fashion" | "cosmetics" | "orders" | "coupons">("food");

  // Camera & optical viewfinder states
  const [cameraFacing, setCameraFacing] = useState<"environment" | "user">("environment");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isTorchOn, setIsTorchOn] = useState(false);

  // Scan History
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem("amb_scan_history");
      if (saved) return JSON.parse(saved);
      // Pre-seed 2 recent luxury history items for a rich first impression
      return [
        {
          id: "hist-01",
          code: "894110001001",
          type: "product",
          title: "মিনিকেট চাল (প্রিমিয়াম)",
          subtitle: "খাদ্য বাজার • ১ কেজি",
          image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80",
          price: 78,
          timestamp: "আজ, ১২:৩০",
        },
        {
          id: "hist-02",
          code: "AMB-ORD-882190",
          type: "order",
          title: "অর্ডার #AMB-882190",
          subtitle: "মুহাম্মদ রাফি • ৳১,৮৫০",
          timestamp: "গতকাল, ০৫:১৫",
        },
      ];
    } catch {
      return [];
    }
  });

  // Manual input & live query
  const [manualInput, setManualInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Product Quantity in Scan Result
  const [productQty, setProductQty] = useState(1);
  const [addedToCartToast, setAddedToCartToast] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Seller stock editing state
  const [editStock, setEditStock] = useState<number>(50);
  const [stockUpdating, setStockUpdating] = useState(false);
  const [stockSuccess, setStockSuccess] = useState(false);

  // Order update state
  const [orderUpdating, setOrderUpdating] = useState(false);
  const [orderSuccessMsg, setOrderSuccessMsg] = useState<string | null>(null);

  // Refs for Transition-safe scanner lifecycle
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isTransitioningRef = useRef<boolean>(false);
  const isScanningRef = useRef<boolean>(false);
  const scannerContainerId = "central-scanner-viewfinder";

  // Save history to localStorage
  const saveToHistory = useCallback((res: ScanLookupResult, rawCode: string) => {
    const nowStr = new Date().toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" });
    let newItem: ScanHistoryItem;

    if (res.type === "product") {
      newItem = {
        id: `${res.data.id}-${Date.now()}`,
        code: rawCode,
        type: "product",
        title: res.data.nameBn,
        subtitle: `${res.data.category} • ${res.data.weight || res.data.unit}`,
        image: res.data.image,
        price: res.data.discountPrice || res.data.price,
        timestamp: `আজ, ${nowStr}`,
      };
    } else if (res.type === "order") {
      newItem = {
        id: `${res.data.id}-${Date.now()}`,
        code: rawCode,
        type: "order",
        title: `অর্ডার #${res.data.orderNumber}`,
        subtitle: `${res.data.customer.name} • ৳${res.data.total}`,
        timestamp: `আজ, ${nowStr}`,
      };
    } else if (res.type === "coupon") {
      newItem = {
        id: `${res.data.id}-${Date.now()}`,
        code: rawCode,
        type: "coupon",
        title: res.data.title,
        subtitle: res.data.discountBn,
        timestamp: `আজ, ${nowStr}`,
      };
    } else {
      newItem = {
        id: `unknown-${Date.now()}`,
        code: rawCode,
        type: "unknown",
        title: `অপরিচিত কোড: ${rawCode}`,
        timestamp: `আজ, ${nowStr}`,
      };
    }

    setScanHistory((prev) => {
      const filtered = prev.filter((item) => item.code !== rawCode);
      const updated = [newItem, ...filtered].slice(0, 30);
      try {
        localStorage.setItem("amb_scan_history", JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });
  }, []);

  // Safe camera stop
  const stopCameraSafe = useCallback(async () => {
    if (isTransitioningRef.current) {
      let attempts = 0;
      while (isTransitioningRef.current && attempts < 8) {
        await new Promise((r) => setTimeout(r, 60));
        attempts++;
      }
    }

    const scanner = html5QrCodeRef.current;
    if (!scanner) return;

    try {
      if (scanner.isScanning) {
        isTransitioningRef.current = true;
        await scanner.stop();
      }
    } catch (err) {
      console.warn("Safe scanner stop error:", err);
    } finally {
      isScanningRef.current = false;
      setIsCameraActive(false);
      isTransitioningRef.current = false;
    }
  }, []);

  // Safe scanner clear
  const clearScannerSafe = useCallback(async () => {
    await stopCameraSafe();
    const scanner = html5QrCodeRef.current;
    if (scanner) {
      try {
        await scanner.clear();
      } catch (err) {
        console.warn("Safe scanner clear error:", err);
      }
      html5QrCodeRef.current = null;
    }
  }, [stopCameraSafe]);

  // Sync initial stock when product scanned
  useEffect(() => {
    if (scanResult?.type === "product") {
      setEditStock(scanResult.data.stock);
      setProductQty(1);
    }
  }, [scanResult]);

  // Handle scanned code found
  const handleCodeFound = useCallback(
    async (decodedText: string) => {
      soundEngine.playScanBeep();
      soundEngine.triggerHaptic("scan");
      await stopCameraSafe();
      const result = await processCode(decodedText);
      saveToHistory(result, decodedText);
      // Ensure we switch to scanner view to see result clearly
      setActiveNavTab("scanner");
    },
    [processCode, saveToHistory, stopCameraSafe]
  );

  // Initialize Camera Scanner
  useEffect(() => {
    let isMounted = true;

    if (!isScannerOpen || activeNavTab !== "scanner" || scanResult !== null) {
      stopCameraSafe();
      return () => {
        isMounted = false;
      };
    }

    setCameraError(null);

    const startScanner = async () => {
      await new Promise((r) => setTimeout(r, 150));
      if (!isMounted) return;

      const element = document.getElementById(scannerContainerId);
      if (!element || !isMounted) return;

      if (isTransitioningRef.current) {
        let attempts = 0;
        while (isTransitioningRef.current && attempts < 8) {
          await new Promise((r) => setTimeout(r, 60));
          attempts++;
        }
      }

      if (!isMounted) return;

      try {
        if (!html5QrCodeRef.current) {
          html5QrCodeRef.current = new Html5Qrcode(scannerContainerId, { verbose: false });
        }

        const scanner = html5QrCodeRef.current;
        if (scanner.isScanning) {
          return;
        }

        isTransitioningRef.current = true;
        const config = {
          fps: 20,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        };

        await scanner.start(
          { facingMode: cameraFacing },
          config,
          (decodedText) => {
            handleCodeFound(decodedText);
          },
          undefined
        );

        if (isMounted) {
          isScanningRef.current = true;
          setIsCameraActive(true);
          setCameraError(null);
        }
      } catch (err: any) {
        if (isMounted) {
          console.warn("Scanner start error:", err);
          const msg = err?.message || String(err);
          if (!msg.toLowerCase().includes("transition") && !msg.toLowerCase().includes("already")) {
            setCameraError(
              "ক্যামেরা চালু করা সম্ভব হয়নি। অনুগ্রহ করে ব্রাউজার ক্যামেরা পারমিশন অনুমোদন করুন অথবা টেস্ট স্যাম্পল / ছবি আপলোড ব্যবহার করুন।"
            );
          }
          setIsCameraActive(false);
        }
      } finally {
        isTransitioningRef.current = false;
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      stopCameraSafe();
    };
  }, [isScannerOpen, activeNavTab, cameraFacing, scanResult !== null, handleCodeFound, stopCameraSafe]);

  // Handle File Upload Scan
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const tempScanner = new Html5Qrcode("central-scanner-temp-file", { verbose: false });
    try {
      const decodedText = await tempScanner.scanFile(file, true);
      try {
        await tempScanner.clear();
      } catch (_) {}
      handleCodeFound(decodedText);
    } catch (err) {
      try {
        await tempScanner.clear();
      } catch (_) {}
      soundEngine.triggerHaptic("warning");
      alert("ছবি থেকে কোনো বারকোড বা কিউআর কোড স্ক্যান করা সম্ভব হয়নি। পরিষ্কার ছবি আপলোড করুন।");
    } finally {
      e.target.value = "";
    }
  };

  // Close full-screen scanner modal
  const handleCloseModal = useCallback(async () => {
    await clearScannerSafe();
    closeScanner();
  }, [clearScannerSafe, closeScanner]);

  // Keyboard shortcut: ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isScannerOpen) {
        handleCloseModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isScannerOpen, handleCloseModal]);

  // Handle Manual Code Submit
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    handleCodeFound(manualInput.trim());
  };

  // Action: Add to Cart (Buyer)
  const handleAddToCart = (product: ScannedProduct, qty: number = 1) => {
    addItem({
      productId: product.id,
      name: product.nameBn,
      price: product.discountPrice || product.price,
      quantity: qty,
      image: product.image,
      weight: product.weight || product.unit || "",
    });
    soundEngine.playSuccessChime();
    soundEngine.triggerHaptic("success");
    setAddedToCartToast(true);
    setTimeout(() => setAddedToCartToast(false), 3000);
  };

  // Action: Buy Now (Buyer)
  const handleBuyNow = (product: ScannedProduct) => {
    requireAuth(() => {
      handleAddToCart(product, productQty);
      handleCloseModal();
      navigate(product.categoryId === "cat1" ? "/food/buy" : "/checkout", {
        state: { selectedProduct: product, quantity: productQty },
      });
    }, "পণ্য সরাসরি অর্ডার করতে প্রথমে লগইন করুন।");
  };

  // Action: Update Stock (Seller/Admin)
  const handleSaveStock = async (product: ScannedProduct) => {
    setStockUpdating(true);
    try {
      await updateProductStockInDb(product.id, editStock);
      product.stock = editStock;
      soundEngine.playSuccessChime();
      soundEngine.triggerHaptic("success");
      setStockSuccess(true);
      setTimeout(() => setStockSuccess(false), 3000);
    } catch (err) {
      alert("স্টক আপডেট করতে সমস্যা হয়েছে।");
    } finally {
      setStockUpdating(false);
    }
  };

  // Action: Update Order Status (Delivery / Admin)
  const handleUpdateOrderStatus = async (
    order: ScannedOrder,
    newStatus: ScannedOrder["status"],
    msg: string
  ) => {
    setOrderUpdating(true);
    try {
      await updateOrderStatusInDb(order.id, newStatus);
      order.status = newStatus;
      soundEngine.playSuccessChime();
      soundEngine.triggerHaptic("success");
      setOrderSuccessMsg(msg);
      setTimeout(() => setOrderSuccessMsg(null), 4000);
    } catch (err) {
      alert("অর্ডার স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে।");
    } finally {
      setOrderUpdating(false);
    }
  };

  // Copy code to clipboard
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    soundEngine.triggerHaptic("scan");
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Clear Scan History
  const handleClearHistory = () => {
    if (window.confirm("আপনি কি সমস্ত স্ক্যান হিস্ট্রি মুছে ফেলতে চান?")) {
      setScanHistory([]);
      localStorage.removeItem("amb_scan_history");
      soundEngine.triggerHaptic("warning");
    }
  };

  // Filter products for live manual search
  const filteredCatalog = CATALOG_PRODUCTS.filter(
    (p) =>
      p.nameBn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isScannerOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] w-screen h-screen bg-[#f8fafc] text-slate-900 flex flex-col overflow-hidden select-none animate-fadeIn">
      {/* Hidden container for file decoding */}
      <div id="central-scanner-temp-file" className="hidden" />

      {/* ========================================================================= */}
      {/* 1. TOP EXECUTIVE ENTERPRISE HEADER BOX                                    */}
      {/* ========================================================================= */}
      <header className="bg-white border-b border-slate-200/90 px-4 sm:px-6 py-3 flex items-center justify-between shrink-0 shadow-sm z-30">
        
        {/* Brand & System Status */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={handleCloseModal}
            className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-all active:scale-95 border border-slate-200"
            title="স্ক্যানার বন্ধ করুন"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-700 via-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-sm font-black border border-emerald-400/40 shrink-0">
              <QrCode className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-none">
                  আল মায়াদিন সেন্ট্রাল স্ক্যানার
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                  AI অপটিক্যাল v3.5
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 font-semibold mt-0.5">
                রিয়েল-টাইম বারকোড, কিউআর ও ইনভেন্টরি অটোমেশন হাব
              </p>
            </div>
          </div>
        </div>

        {/* Center: Executive Role Switcher Box (Desktop) */}
        <div className="hidden lg:flex items-center bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
          {(
            [
              { id: "buyer", label: "🛍️ ক্রেতা মোড", desc: "পণ্য ক্রয় ও অফার" },
              { id: "seller", label: "🏬 বিক্রেতা / ইনভেন্টরি", desc: "স্টক ও প্রফিট ম্যানেজমেন্ট" },
              { id: "delivery", label: "🚚 রাইডার ও ডেলিভারি", desc: "অর্ডার ট্র্যাকিং ও হ্যান্ডওভার" },
            ] as { id: ScannerUserRole; label: string; desc: string }[]
          ).map((role) => (
            <button
              key={role.id}
              onClick={() => {
                setActiveRole(role.id);
                soundEngine.playScanBeep();
              }}
              className={`text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                activeRole === role.id
                  ? "bg-white text-emerald-800 shadow-sm font-black border border-emerald-200/60"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
              }`}
            >
              <span>{role.label}</span>
            </button>
          ))}
        </div>

        {/* Right: Quick Controls Box */}
        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              soundEngine.setSoundEnabled(next);
              if (next) soundEngine.playScanBeep();
            }}
            className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all border ${
              soundEnabled
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm"
                : "bg-slate-100 text-slate-400 hover:text-slate-700 border-slate-200"
            }`}
            title={soundEnabled ? "সাউন্ড অন" : "সাউন্ড মিউট"}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>

          {/* Close Modal */}
          <button
            onClick={handleCloseModal}
            className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-slate-700 flex items-center justify-center transition-all active:scale-95 border border-slate-200"
            title="স্ক্যানার বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MOBILE ROLE SELECTOR BAR                                               */}
      {/* ========================================================================= */}
      <div className="lg:hidden bg-white px-4 py-2.5 flex items-center justify-between border-b border-slate-200 shrink-0">
        <span className="text-xs font-bold text-slate-600">ইউজার মোড:</span>
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
          {(
            [
              { id: "buyer", label: "🛍️ ক্রেতা" },
              { id: "seller", label: "🏬 বিক্রেতা" },
              { id: "delivery", label: "🚚 রাইডার" },
            ] as { id: ScannerUserRole; label: string }[]
          ).map((role) => (
            <button
              key={role.id}
              onClick={() => {
                setActiveRole(role.id);
                soundEngine.playScanBeep();
              }}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                activeRole === role.id
                  ? "bg-white text-emerald-800 shadow-sm font-black border border-emerald-200"
                  : "text-slate-600"
              }`}
            >
              {role.label}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. ENTERPRISE NAVIGATION BAR (BOX PILLS)                                  */}
      {/* ========================================================================= */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-2.5 shrink-0 z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          
          <div className="flex items-center gap-2">
            {[
              { id: "scanner", label: "লাইভ ক্যামেরা স্ক্যানার", icon: Camera, count: isCameraActive ? "সক্রিয়" : undefined },
              { id: "samples", label: "তাত্ক্ষণিক টেস্ট স্যাম্পল", icon: Sparkles, count: `${CATALOG_PRODUCTS.length + DEMO_ORDERS.length}+` },
              { id: "history", label: "স্ক্যান হিস্ট্রি", icon: History, count: `${scanHistory.length}` },
              { id: "manual", label: "ম্যানুয়াল কোড ইনপুট", icon: Keyboard },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeNavTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveNavTab(tab.id as any);
                    if (scanResult && tab.id === "scanner") {
                      clearResult();
                    }
                  }}
                  className={`py-2 px-3.5 sm:px-4 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap border ${
                    isActive
                      ? "bg-emerald-700 text-white shadow-sm font-black border-emerald-800"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200/80"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.count && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                        isActive ? "bg-emerald-800 text-white" : "bg-slate-200 text-slate-800"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick upload button */}
          <label className="hidden md:flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-3.5 py-2 rounded-2xl text-xs font-bold cursor-pointer transition-all shrink-0">
            <Upload className="w-3.5 h-3.5" />
            <span>ছবি থেকে স্ক্যান</span>
            <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. MAIN BENTO BOX DASHBOARD GRID                                          */}
      {/* ========================================================================= */}
      <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6 bg-[#f8fafc]">
        <div className="max-w-7xl mx-auto space-y-5">
          
          {/* ===================================================================== */}
          {/* 🌟 1. SCANNED RESULT ENTERPRISE HUB (WHEN DETECTED)                   */}
          {/* ===================================================================== */}
          {scanResult && (
            <div className="bg-white border-2 border-emerald-500/30 rounded-3xl p-5 sm:p-7 shadow-lg space-y-6 animate-fadeIn ring-4 ring-emerald-50">
              
              {/* Result Header Box */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white flex items-center justify-center font-bold shadow-md">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-black text-slate-900">
                        {scanResult.type === "product"
                          ? "পণ্য সফলভাবে যাচাইকৃত হয়েছে!"
                          : scanResult.type === "order"
                          ? "অর্ডার ইনভয়েস ও রিয়েল-টাইম ট্র্যাকিং"
                          : scanResult.type === "coupon"
                          ? "বিশেষ ডিসকাউন্ট কুপন সক্রিয়!"
                          : "অপরিচিত কোড শনাক্ত"}
                      </h2>
                      <span className="bg-emerald-100 text-emerald-800 text-[11px] font-black px-2.5 py-0.5 rounded-full border border-emerald-300">
                        ১০০% খাঁটি
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">
                      সিস্টেম রেজাল্ট আইডি: <span className="font-mono text-slate-700 font-bold">{scanResult.type === "product" ? scanResult.data.sku : scanResult.type === "order" ? scanResult.data.orderNumber : "AMB-SCAN"}</span>
                    </p>
                  </div>
                </div>

                {/* Clear & Scan Again Button */}
                <button
                  onClick={() => {
                    clearResult();
                    setActiveNavTab("scanner");
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-5 py-2.5 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 shrink-0"
                >
                  <RefreshCw className="w-4 h-4" /> পরবর্তী স্ক্যান করুন
                </button>
              </div>

              {/* PRODUCT SCAN RESULT BENTO BOX */}
              {scanResult.type === "product" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Left Product Visual & Identity Box (5 Cols) */}
                  <div className="lg:col-span-5 bg-slate-50 border border-slate-200/90 rounded-3xl p-5 flex flex-col justify-between space-y-4">
                    
                    <div className="relative w-full aspect-square max-h-72 bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-center overflow-hidden shadow-inner">
                      <img
                        src={scanResult.data.image}
                        alt={scanResult.data.nameBn}
                        className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
                      />
                      {scanResult.data.discount && (
                        <div className="absolute top-3 left-3 bg-red-600 text-white text-xs font-black px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                          <Percent className="w-3 h-3" /> {scanResult.data.discount}
                        </div>
                      )}
                      <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm border border-slate-200 text-slate-700 text-[11px] font-bold px-2.5 py-1 rounded-xl shadow-sm">
                        {scanResult.data.weight || scanResult.data.unit}
                      </div>
                    </div>

                    {/* Barcode & SKU Pill Box */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <BarcodeIcon className="w-5 h-5 text-slate-500" />
                        <div>
                          <p className="font-mono text-slate-900 font-bold">{scanResult.data.barcode}</p>
                          <p className="text-[10px] text-slate-400 font-mono">SKU: {scanResult.data.sku}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCopyCode(scanResult.data.barcode)}
                        className="text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 font-bold px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1 transition-all"
                      >
                        {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedCode ? "কপি হয়েছে" : "বারকোড কপি"}
                      </button>
                    </div>

                    {/* Verified Seller Box */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                          <Store className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900">{scanResult.data.seller.shopName}</p>
                          <p className="text-[11px] text-slate-500 font-semibold">
                            রেটিং: ⭐ {scanResult.data.seller.rating} • {scanResult.data.origin || "বাংলাদেশ"}
                          </p>
                        </div>
                      </div>

                      <a
                        href={`tel:${scanResult.data.seller.phone}`}
                        className="w-9 h-9 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 flex items-center justify-center active:scale-95 transition-all"
                        title="সরাসরি কল দিন"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    </div>
                  </div>

                  {/* Right Commercial & Action Hub (7 Cols) */}
                  <div className="lg:col-span-7 space-y-5 flex flex-col justify-between">
                    
                    {/* Main Title & Price Matrix Box */}
                    <div className="bg-slate-50 border border-slate-200/90 rounded-3xl p-5 space-y-4">
                      
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-3 py-1 rounded-full border border-emerald-200">
                          {scanResult.data.category}
                        </span>
                        <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" /> আল মায়াদিন অথেনটিক পণ্য
                        </span>
                      </div>

                      <div>
                        <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
                          {scanResult.data.nameBn}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-0.5">
                          {scanResult.data.nameEn}
                        </p>
                      </div>

                      {/* Pricing Tier Display */}
                      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex items-baseline justify-between">
                        <div>
                          <p className="text-xs text-slate-500 font-bold mb-1">বর্তমান বিক্রয় মূল্য:</p>
                          <div className="flex items-baseline gap-3">
                            <span className="text-3xl font-black text-emerald-600 tracking-tight">
                              ৳{scanResult.data.discountPrice || scanResult.data.price}
                            </span>
                            {scanResult.data.discountPrice && (
                              <span className="text-base font-bold text-slate-400 line-through">
                                ৳{scanResult.data.price}
                              </span>
                            )}
                            <span className="text-xs font-bold text-slate-500">
                              / {scanResult.data.weight || scanResult.data.unit}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="inline-block bg-emerald-50 text-emerald-800 text-xs font-black px-3 py-1.5 rounded-xl border border-emerald-200">
                            স্টক: {scanResult.data.stock} টি
                          </span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">
                        {scanResult.data.descriptionBn}
                      </p>
                    </div>

                    {/* BUYER ACTION MATRIX */}
                    {activeRole === "buyer" && (
                      <div className="bg-emerald-50/50 border border-emerald-200 rounded-3xl p-5 space-y-4">
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-800">অর্ডার পরিমাণ নির্বাচন করুন:</span>
                          <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border border-emerald-300 shadow-sm">
                            <button
                              onClick={() => setProductQty((prev) => Math.max(1, prev - 1))}
                              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center font-bold active:scale-90"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-sm font-black text-slate-900 w-8 text-center">{productQty}</span>
                            <button
                              onClick={() => setProductQty((prev) => Math.min(scanResult.data.stock, prev + 1))}
                              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center font-bold active:scale-90"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Total estimation */}
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700 bg-white/80 p-3 rounded-xl border border-emerald-200">
                          <span>মোট পরিশোধযোগ্য মূল্য ({productQty} টি):</span>
                          <span className="text-base font-black text-emerald-700">
                            ৳{(scanResult.data.discountPrice || scanResult.data.price) * productQty}
                          </span>
                        </div>

                        {/* Action buttons */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <button
                            onClick={() => handleAddToCart(scanResult.data, productQty)}
                            className="bg-white hover:bg-emerald-50 border-2 border-emerald-600 text-emerald-800 font-black py-3 rounded-2xl flex items-center justify-center gap-2 text-xs active:scale-95 transition-all shadow-sm"
                          >
                            <ShoppingCart className="w-4 h-4" /> কার্টে যোগ করুন
                          </button>

                          <button
                            onClick={() => handleBuyNow(scanResult.data)}
                            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black py-3 rounded-2xl flex items-center justify-center gap-2 text-xs shadow-md active:scale-95 transition-all"
                          >
                            <Zap className="w-4 h-4" /> সরাসরি অর্ডার করুন
                          </button>
                        </div>

                        {addedToCartToast && (
                          <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 animate-fadeIn">
                            <Check className="w-4 h-4 stroke-[3]" />
                            কার্টে {productQty} টি সফলভাবে যুক্ত হয়েছে!
                          </div>
                        )}
                      </div>
                    )}

                    {/* SELLER INVENTORY MATRIX */}
                    {activeRole === "seller" && (
                      <div className="bg-amber-50/70 border border-amber-300 rounded-3xl p-5 space-y-4">
                        
                        <div className="flex items-center justify-between border-b border-amber-200/80 pb-3">
                          <span className="text-xs font-black text-amber-950">বিক্রেতা অ্যানালিটিক্স ও ইনভেন্টরি:</span>
                          <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                            মার্জিন: {scanResult.data.margin}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="bg-white p-3 rounded-xl border border-amber-200">
                            <p className="text-slate-500 font-bold">পাইকারি ক্রয়মূল্য:</p>
                            <p className="text-base font-black text-amber-900">৳{scanResult.data.costPrice}</p>
                          </div>
                          <div className="bg-white p-3 rounded-xl border border-amber-200">
                            <p className="text-slate-500 font-bold">খুচরা বিক্রয়মূল্য:</p>
                            <p className="text-base font-black text-emerald-700">৳{scanResult.data.discountPrice || scanResult.data.price}</p>
                          </div>
                        </div>

                        {/* Quick stock editor */}
                        <div className="space-y-2 pt-1">
                          <label className="text-xs font-black text-slate-800 flex items-center justify-between">
                            <span>📦 ইনভেন্টরি স্টক আপডেট করুন:</span>
                            {stockSuccess && (
                              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" /> স্টক সংরক্ষিত হয়েছে!
                              </span>
                            )}
                          </label>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setEditStock((prev) => Math.max(0, prev - 1))}
                              className="w-10 h-10 rounded-xl bg-white border border-slate-300 font-bold flex items-center justify-center active:scale-90"
                            >
                              <Minus className="w-4 h-4" />
                            </button>

                            <input
                              type="number"
                              value={editStock}
                              onChange={(e) => setEditStock(Math.max(0, parseInt(e.target.value) || 0))}
                              className="w-24 bg-white border border-slate-300 rounded-xl py-2 text-center font-black text-slate-900 text-sm"
                            />

                            <button
                              onClick={() => setEditStock((prev) => prev + 1)}
                              className="w-10 h-10 rounded-xl bg-white border border-slate-300 font-bold flex items-center justify-center active:scale-90"
                            >
                              <Plus className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleSaveStock(scanResult.data)}
                              disabled={stockUpdating}
                              className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 shadow-sm active:scale-95"
                            >
                              {stockUpdating ? <RefreshCw className="w-4 h-4 animate-spin" /> : "স্টক সেভ করুন"}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ORDER SCAN RESULT BENTO BOX */}
              {scanResult.type === "order" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-6 bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                      <span className="text-xs font-mono font-black text-slate-700">
                        অর্ডার #{scanResult.data.orderNumber}
                      </span>
                      <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-3 py-1 rounded-full">
                        {scanResult.data.status}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="bg-white p-3 rounded-2xl border border-slate-200">
                        <p className="font-black text-slate-900">{scanResult.data.customer.name}</p>
                        <p className="text-slate-600 font-mono mt-0.5">📞 {scanResult.data.customer.phone}</p>
                        <p className="text-slate-600 mt-0.5">📍 {scanResult.data.customer.address}</p>
                      </div>

                      <div className="bg-white p-3 rounded-2xl border border-slate-200">
                        <p className="font-bold text-slate-800 mb-2">অর্ডারকৃত পণ্যসমূহ:</p>
                        {scanResult.data.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between text-slate-700 py-1 border-b border-slate-100 last:border-none">
                            <span>• {it.nameBn} x {it.quantity}</span>
                            <span className="font-black">৳{it.price * it.quantity}</span>
                          </div>
                        ))}
                        <div className="pt-2 flex justify-between font-black text-emerald-700 text-sm border-t border-slate-200 mt-2">
                          <span>মোট প্রদেয় বিল:</span>
                          <span>৳{scanResult.data.total} ({scanResult.data.paymentMethod})</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-6 space-y-4 flex flex-col justify-between">
                    <div className="bg-blue-50/60 border border-blue-200 rounded-3xl p-5 space-y-4">
                      <h4 className="text-xs font-black text-blue-900">ডেলিভারি হ্যান্ডওভার ও রাইডার অ্যাকশন:</h4>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <a
                          href={`tel:${scanResult.data.customer.phone}`}
                          className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
                        >
                          <Phone className="w-3.5 h-3.5 text-emerald-600" /> গ্রাহককে কল দিন
                        </a>

                        <button
                          onClick={() => alert(`গ্রাহকের ঠিকানা: ${scanResult.data.customer.address}`)}
                          className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
                        >
                          <Navigation className="w-3.5 h-3.5 text-blue-600" /> ম্যাপ লোকেশন
                        </button>
                      </div>

                      <button
                        onClick={() => handleUpdateOrderStatus(scanResult.data, "delivered", "অর্ডারটি সফলভাবে ডেলিভারি সম্পন্ন হিসেবে চিহ্নিত হয়েছে!")}
                        disabled={orderUpdating}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-2xl text-xs flex items-center justify-center gap-2 active:scale-95 shadow-md transition-all"
                      >
                        <CheckCheck className="w-4 h-4" /> ডেলিভারি সম্পন্ন কনফার্ম করুন
                      </button>

                      {orderSuccessMsg && (
                        <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-2xl text-xs font-bold text-center">
                          {orderSuccessMsg}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* COUPON RESULT BOX */}
              {scanResult.type === "coupon" && (
                <div className="bg-gradient-to-br from-amber-500 via-amber-400 to-yellow-500 rounded-3xl p-6 text-slate-950 text-center space-y-4 shadow-md max-w-lg mx-auto">
                  <div className="w-14 h-14 rounded-2xl bg-white text-amber-600 flex items-center justify-center mx-auto shadow-md">
                    <Tag className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black">{scanResult.data.title}</h3>
                    <p className="text-2xl font-black mt-1 text-slate-900">{scanResult.data.discountBn}</p>
                    <p className="text-xs font-bold text-slate-800 mt-1">{scanResult.data.descriptionBn}</p>
                  </div>
                  <div className="bg-white/95 rounded-2xl p-3 font-mono font-black text-base text-slate-900 border-2 border-dashed border-amber-600 flex items-center justify-between px-4">
                    <span>কুপন কোড: {scanResult.data.code}</span>
                    <button
                      onClick={() => handleCopyCode(scanResult.data.code)}
                      className="bg-amber-600 text-white text-xs font-bold px-3 py-1 rounded-xl active:scale-95"
                    >
                      {copiedCode ? "কপি হয়েছে" : "কপি"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===================================================================== */}
          {/* 🌟 2. MULTI-BOX BENTO WORKSPACE (WHEN IDLE / ACTIVE TAB)              */}
          {/* ===================================================================== */}
          {(!scanResult || activeNavTab !== "scanner") && (
            <div className="space-y-5">
              
              {/* TAB 1: OPTICAL SCANNER PRIMARY BOX */}
              {activeNavTab === "scanner" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  
                  {/* Left Viewport Card (7 Cols) */}
                  <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4 flex flex-col justify-between">
                    
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h2 className="text-base font-black text-slate-900">
                          অপটিক্যাল স্ক্যানার ভিউফাইন্ডার
                        </h2>
                        <p className="text-xs text-slate-500 font-medium">
                          পণ্য, বারকোড বা কিউআর কোড ফ্রেমের মাঝে রাখুন
                        </p>
                      </div>
                      <span className="bg-emerald-100 text-emerald-800 text-[11px] font-mono font-bold px-2.5 py-1 rounded-full">
                        HD 1080p • 20 FPS
                      </span>
                    </div>

                    {/* Camera Stage Container */}
                    <div className="relative w-full aspect-square max-h-[380px] bg-slate-950 rounded-3xl overflow-hidden shadow-inner flex items-center justify-center mx-auto">
                      
                      {/* HTML5 QR Camera Element */}
                      <div id={scannerContainerId} className="w-full h-full object-cover" />

                      {/* Optical HUD Reticle Overlay */}
                      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-5 z-10">
                        
                        {/* Top HUD Info */}
                        <div className="w-full flex items-center justify-between text-[10px] font-mono text-emerald-400 font-bold bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full">
                          <span>[AUTO-FOCUS: LOCKED]</span>
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                            AI SCANNER ACTIVE
                          </span>
                        </div>

                        {/* Framing Reticle */}
                        <div className="relative w-60 h-60 border border-emerald-400/30 rounded-2xl flex items-center justify-center my-auto">
                          {/* 4 Corners */}
                          <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl" />
                          <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl" />
                          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl" />
                          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-xl" />
                          
                          {/* Laser Sweep Line */}
                          <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] animate-bounce opacity-90" />
                        </div>

                        <p className="bg-black/70 text-white text-xs font-bold px-4 py-1.5 rounded-full backdrop-blur-md border border-white/10">
                          🎯 বারকোড বা কিউআর কোড ফ্রেমে রাখুন
                        </p>
                      </div>

                      {/* Camera Controls inside Stage */}
                      <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2">
                        <button
                          onClick={() => setCameraFacing((prev) => (prev === "environment" ? "user" : "environment"))}
                          className="w-10 h-10 rounded-2xl bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center shadow-lg active:scale-90 transition-all border border-slate-200"
                          title="ক্যামেরা ফ্লিপ করুন"
                        >
                          <RotateCw className="w-4 h-4 text-slate-800" />
                        </button>
                      </div>

                      {/* Camera Error Handling */}
                      {cameraError && (
                        <div className="absolute inset-0 bg-slate-950/95 p-6 flex flex-col items-center justify-center text-center text-white space-y-4 z-30">
                          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                            <AlertCircle className="w-8 h-8" />
                          </div>
                          <div className="space-y-1">
                            <h3 className="text-sm font-bold text-amber-400">ক্যামেরা অ্যাক্সেস নির্দেশিকা</h3>
                            <p className="text-xs text-slate-300 leading-relaxed max-w-xs">{cameraError}</p>
                          </div>
                          <div className="flex flex-wrap gap-2 justify-center pt-2">
                            <button
                              onClick={() => setActiveNavTab("samples")}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs active:scale-95 shadow-sm"
                            >
                              ⚡ টেস্ট স্যাম্পল দিয়ে ট্রাই করুন
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Quick Viewport Sub-actions */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <label className="bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-emerald-800 p-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all">
                        <Upload className="w-4 h-4 text-emerald-600" />
                        <span>ছবি / স্ক্রিনশট আপলোড</span>
                        <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                      </label>

                      <button
                        onClick={() => setActiveNavTab("manual")}
                        className="bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-emerald-800 p-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all"
                      >
                        <Keyboard className="w-4 h-4 text-emerald-600" />
                        <span>কোড টাইপ করে খুঁজুন</span>
                      </button>
                    </div>
                  </div>

                  {/* Right Side Quick Intelligent Boxes (5 Cols) */}
                  <div className="lg:col-span-5 space-y-4">
                    
                    {/* Box 1: Quick 1-Tap Fast Samples */}
                    <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-sm space-y-3.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-emerald-600" />
                          <h3 className="text-xs font-black text-slate-900">তাত্ক্ষণিক টেস্ট স্যাম্পল (1-Tap)</h3>
                        </div>
                        <button
                          onClick={() => setActiveNavTab("samples")}
                          className="text-[11px] font-bold text-emerald-700 hover:underline"
                        >
                          সবগুলো দেখুন →
                        </button>
                      </div>

                      <div className="space-y-2">
                        {CATALOG_PRODUCTS.slice(0, 3).map((prod) => (
                          <div
                            key={prod.id}
                            onClick={() => handleCodeFound(prod.barcode)}
                            className="p-3 bg-slate-50 hover:bg-emerald-50/80 rounded-2xl border border-slate-200 hover:border-emerald-300 cursor-pointer transition-all flex items-center justify-between active:scale-98 group"
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={prod.image}
                                alt={prod.nameBn}
                                className="w-10 h-10 rounded-xl object-contain bg-white border border-slate-200 p-1 shrink-0"
                              />
                              <div>
                                <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-800">
                                  {prod.nameBn}
                                </p>
                                <p className="text-[10px] font-mono text-slate-500">
                                  {prod.barcode} • ৳{prod.discountPrice || prod.price}
                                </p>
                              </div>
                            </div>

                            <span className="text-[10px] font-bold bg-white group-hover:bg-emerald-600 group-hover:text-white px-2.5 py-1 rounded-xl border border-slate-200 group-hover:border-emerald-600 text-slate-700 transition-all">
                              স্ক্যান ⚡
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Box 2: Recent Scan History Preview */}
                    <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-sm space-y-3.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <History className="w-4 h-4 text-emerald-600" />
                          <h3 className="text-xs font-black text-slate-900">সাম্প্রতিক স্ক্যান হিস্ট্রি</h3>
                        </div>
                        <button
                          onClick={() => setActiveNavTab("history")}
                          className="text-[11px] font-bold text-emerald-700 hover:underline"
                        >
                          সম্পূর্ণ হিস্ট্রি ({scanHistory.length}) →
                        </button>
                      </div>

                      {scanHistory.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-4">এখনো কোনো কোড স্ক্যান করা হয়নি</p>
                      ) : (
                        <div className="space-y-2">
                          {scanHistory.slice(0, 2).map((item) => (
                            <div
                              key={item.id}
                              onClick={() => handleCodeFound(item.code)}
                              className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 cursor-pointer transition-all flex items-center justify-between text-xs"
                            >
                              <div>
                                <p className="font-bold text-slate-900">{item.title}</p>
                                <p className="text-[11px] text-slate-500">{item.subtitle || item.code}</p>
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono">{item.timestamp}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: RICH CATEGORIZED SAMPLES BOX */}
              {activeNavTab === "samples" && (
                <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-7 shadow-sm space-y-6 animate-fadeIn">
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <h2 className="text-lg font-black text-slate-900">
                        তাত্ক্ষণিক টেস্ট স্যাম্পল ক্যাটালগ
                      </h2>
                      <p className="text-xs text-slate-500 font-semibold mt-0.5">
                        ক্যামেরা ছাড়াই যেকোনো আইটেমে ১-ট্যাপে ক্লিক করে তাৎক্ষণিক স্ক্যান টেস্ট করুন
                      </p>
                    </div>

                    {/* Category Tabs */}
                    <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200 overflow-x-auto no-scrollbar">
                      {[
                        { id: "food", label: "🌾 খাদ্য বাজার" },
                        { id: "fashion", label: "👗 ফ্যাশন" },
                        { id: "cosmetics", label: "💄 কসমেটিক্স" },
                        { id: "orders", label: "📦 অর্ডার" },
                        { id: "coupons", label: "🎟️ কুপন" },
                      ].map((c) => (
                        <button
                          key={c.id}
                          onClick={() => setSampleCategory(c.id as any)}
                          className={`text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                            sampleCategory === c.id
                              ? "bg-white text-emerald-800 shadow-sm font-black border border-slate-200"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* PRODUCTS SAMPLES GRID */}
                  {(sampleCategory === "food" || sampleCategory === "fashion" || sampleCategory === "cosmetics") && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {CATALOG_PRODUCTS.map((prod) => (
                        <div
                          key={prod.id}
                          onClick={() => handleCodeFound(prod.barcode)}
                          className="bg-slate-50 hover:bg-emerald-50/80 border border-slate-200 hover:border-emerald-300 rounded-3xl p-4 cursor-pointer transition-all space-y-3 group shadow-sm active:scale-98"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 p-1.5 flex items-center justify-center shrink-0 overflow-hidden">
                              <img
                                src={prod.image}
                                alt={prod.nameBn}
                                className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                {prod.category}
                              </span>
                              <h4 className="text-xs font-bold text-slate-900 truncate mt-1 group-hover:text-emerald-800">
                                {prod.nameBn}
                              </h4>
                              <p className="text-xs font-black text-emerald-600 mt-0.5">
                                ৳{prod.discountPrice || prod.price}
                              </p>
                            </div>
                          </div>

                          <div className="bg-white rounded-2xl p-2.5 border border-slate-200 flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-1.5 font-mono text-slate-600 font-bold">
                              <BarcodeIcon className="w-3.5 h-3.5" />
                              <span>{prod.barcode}</span>
                            </div>
                            <span className="bg-emerald-600 text-white font-bold px-2.5 py-1 rounded-xl text-[10px] shadow-sm">
                              স্ক্যান করুন ⚡
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ORDER SAMPLES */}
                  {sampleCategory === "orders" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {DEMO_ORDERS.map((ord) => (
                        <div
                          key={ord.id}
                          onClick={() => handleCodeFound(ord.qrPayload || ord.orderNumber)}
                          className="bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-3xl p-4 cursor-pointer transition-all space-y-3 group shadow-sm active:scale-98"
                        >
                          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                            <span className="text-xs font-mono font-black text-slate-800">
                              অর্ডার #{ord.orderNumber}
                            </span>
                            <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                              {ord.status}
                            </span>
                          </div>
                          <div className="text-xs text-slate-600 space-y-1">
                            <p className="font-bold text-slate-900">{ord.customer.name}</p>
                            <p>মোট বিল: <span className="font-bold text-emerald-700">৳{ord.total}</span></p>
                            <p className="truncate text-slate-500">📍 {ord.customer.address}</p>
                          </div>
                          <div className="bg-white rounded-2xl p-2.5 border border-slate-200 flex items-center justify-between text-[11px]">
                            <span className="font-mono text-slate-500">{ord.orderNumber}</span>
                            <span className="bg-blue-600 text-white font-bold px-2.5 py-1 rounded-xl text-[10px]">
                              ট্র্যাক স্ক্যান ⚡
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* COUPON SAMPLES */}
                  {sampleCategory === "coupons" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {DEMO_COUPONS.map((cpn) => (
                        <div
                          key={cpn.id}
                          onClick={() => handleCodeFound(cpn.code)}
                          className="bg-amber-50 hover:bg-amber-100/80 border border-amber-200 hover:border-amber-300 rounded-3xl p-5 cursor-pointer transition-all space-y-3 shadow-sm active:scale-98"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-amber-900">{cpn.title}</span>
                            <span className="text-xs font-black bg-amber-200 text-amber-900 px-2.5 py-0.5 rounded-full">
                              {cpn.discountBn}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600">{cpn.descriptionBn}</p>
                          <div className="bg-white rounded-2xl p-2.5 border border-amber-300 flex items-center justify-between text-xs font-mono font-black text-slate-900">
                            <span>{cpn.code}</span>
                            <span className="bg-amber-600 text-white font-bold px-2.5 py-1 rounded-xl text-[10px]">
                              কুপন সক্রিয় ⚡
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: SCAN HISTORY BOX */}
              {activeNavTab === "history" && (
                <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-7 shadow-sm space-y-5 animate-fadeIn">
                  
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <h2 className="text-lg font-black text-slate-900">
                        স্ক্যান হিস্ট্রি ও ডাটা রেকর্ড
                      </h2>
                      <p className="text-xs text-slate-500 font-semibold mt-0.5">
                        আপনার সাম্প্রতিক স্ক্যানকৃত পণ্য, অর্ডার ও কুপন তালিকা
                      </p>
                    </div>

                    {scanHistory.length > 0 && (
                      <button
                        onClick={handleClearHistory}
                        className="bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold px-3.5 py-2 rounded-2xl border border-red-200 flex items-center gap-1.5 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> হিস্ট্রি মুছুন
                      </button>
                    )}
                  </div>

                  {scanHistory.length === 0 ? (
                    <div className="py-12 text-center space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                        <History className="w-7 h-7" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-700">হিস্ট্রি খালি আছে</h3>
                      <p className="text-xs text-slate-400 max-w-xs mx-auto">
                        ক্যামেরা দিয়ে স্ক্যান করুন অথবা টেস্ট স্যাম্পল থেকে যেকোনো আইটেমে ক্লিক করুন।
                      </p>
                      <button
                        onClick={() => setActiveNavTab("samples")}
                        className="bg-emerald-600 text-white font-bold px-4 py-2 rounded-xl text-xs"
                      >
                        টেস্ট স্যাম্পল দেখুন
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {scanHistory.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleCodeFound(item.code)}
                          className="bg-slate-50 hover:bg-emerald-50/80 border border-slate-200 hover:border-emerald-300 rounded-3xl p-4 cursor-pointer transition-all flex items-center justify-between text-xs space-y-2 active:scale-98 shadow-sm group"
                        >
                          <div className="flex items-center gap-3">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.title}
                                className="w-12 h-12 rounded-2xl object-contain bg-white border border-slate-200 p-1 shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shrink-0 text-emerald-600 font-bold">
                                <QrCode className="w-5 h-5" />
                              </div>
                            )}

                            <div>
                              <h4 className="font-bold text-slate-900 group-hover:text-emerald-800">{item.title}</h4>
                              <p className="text-[11px] text-slate-500">{item.subtitle}</p>
                              <p className="text-[10px] font-mono text-slate-400 mt-1">{item.timestamp}</p>
                            </div>
                          </div>

                          <span className="text-[10px] font-bold bg-white group-hover:bg-emerald-600 group-hover:text-white px-2.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 transition-all">
                            পুনরায় স্ক্যান ⚡
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: MANUAL SEARCH & LIVE CATALOG INPUT BOX */}
              {activeNavTab === "manual" && (
                <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-7 shadow-sm space-y-6 animate-fadeIn max-w-3xl mx-auto">
                  
                  <div className="text-center space-y-1">
                    <h2 className="text-lg font-black text-slate-900">
                      ম্যানুয়াল কোড টাইপ ও লাইভ সার্চ
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      বারকোড নম্বর, SKU কোড বা পণ্যের বাংলা নাম লিখে সরাসরি সার্চ করুন
                    </p>
                  </div>

                  {/* Search Bar Box */}
                  <form onSubmit={handleManualSubmit} className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={manualInput}
                        onChange={(e) => {
                          setManualInput(e.target.value);
                          setSearchQuery(e.target.value);
                        }}
                        placeholder="যেমন: 894110001001 বা চাল বা মধু..."
                        className="w-full bg-slate-50 border-2 border-slate-200 focus:border-emerald-500 rounded-2xl py-3 pl-11 pr-4 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none transition-all shadow-inner"
                      />
                    </div>
                    <button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 py-3 rounded-2xl text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                    >
                      <Search className="w-4 h-4" /> খুঁজুন
                    </button>
                  </form>

                  {/* Search suggestions */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-bold text-slate-600">ক্যাটালগ পণ্যসমূহ:</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                      {filteredCatalog.map((prod) => (
                        <div
                          key={prod.id}
                          onClick={() => handleCodeFound(prod.barcode)}
                          className="p-3 bg-slate-50 hover:bg-emerald-50 rounded-2xl border border-slate-200 hover:border-emerald-300 cursor-pointer transition-all flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <img src={prod.image} alt={prod.nameBn} className="w-10 h-10 rounded-xl object-contain bg-white p-1" />
                            <div>
                              <p className="font-bold text-slate-900">{prod.nameBn}</p>
                              <p className="font-mono text-[10px] text-slate-500">{prod.barcode} • ৳{prod.discountPrice || prod.price}</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-lg">
                            লোড করুন
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* ========================================================================= */}
      {/* 5. FOOTER STATUS BAR                                                      */}
      {/* ========================================================================= */}
      <footer className="bg-white border-t border-slate-200 px-4 sm:px-6 py-2 flex items-center justify-between text-[11px] text-slate-500 font-semibold shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>আল মায়াদিন সেন্ট্রাল স্ক্যানার v3.5 • নিরাপদ এনক্রিপ্টেড ডাটাবেজ সংযোগ</span>
        </div>
        <span className="hidden sm:inline-block">বন্ধ করতে ESC চাপুন</span>
      </footer>
    </div>
  );
};
