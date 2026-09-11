import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  Package, 
  Percent, 
  Tag, 
  Image as ImageIcon, 
  X, 
  Upload, 
  ArrowUpDown, 
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Database,
  Copy,
  Share2,
  Check
} from "lucide-react";
import { db } from "../../lib/firebase";
import { 
  collection, 
  onSnapshot, 
  doc, 
  deleteDoc, 
  updateDoc, 
  setDoc,
  query, 
  orderBy 
} from "firebase/firestore";
import { compressImage } from "../../lib/imageUtils";
import { seedDemoProducts, ALL_INITIAL_PRODUCTS } from "../../data/allProductsData";
import { getProductShareUrl, ResolvedProduct } from "../../lib/productLink";
import { ShareProductModal } from "../ShareProductModal";

export interface ProductItem {
  id: string;
  nameBn?: string;
  nameEn?: string;
  categoryId?: string;
  price?: number;
  discountPercent?: number;
  discountPrice?: number;
  stockQuantity?: number;
  weight?: string;
  sizes?: string[];
  colors?: string[];
  description?: string;
  status?: "active" | "inactive" | string;
  stockStatus?: string;
  isFeatured?: boolean;
  image?: string;
  images?: string[];
  createdAt?: number;
  updatedAt?: number;
  isDeleted?: boolean;
}

interface ProductManagementProps {
  onNavigateToAddProduct: () => void;
}

export const ProductManagement: React.FC<ProductManagementProps> = ({ onNavigateToAddProduct }) => {
  // Initialize with initial demo products so list is never empty!
  const [products, setProducts] = useState<ProductItem[]>(ALL_INITIAL_PRODUCTS as ProductItem[]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");
  const [toastMessage, setToastMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  // Edit Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [modalName, setModalName] = useState("");
  const [modalCategory, setModalCategory] = useState("");
  const [modalPrice, setModalPrice] = useState("");
  const [modalDiscount, setModalDiscount] = useState("");
  const [modalStock, setModalStock] = useState("");
  const [modalSizes, setModalSizes] = useState<string[]>([]);
  const [modalCustomSize, setModalCustomSize] = useState("");
  const [modalDesc, setModalDesc] = useState("");
  const [modalStatus, setModalStatus] = useState<"active" | "inactive">("active");
  const [modalFeatured, setModalFeatured] = useState(false);
  const [modalImages, setModalImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleAddModalSize = (sizeToAdd: string) => {
    const trimmed = sizeToAdd.trim();
    if (trimmed && !modalSizes.includes(trimmed)) {
      setModalSizes(prev => [...prev, trimmed]);
    }
  };

  const handleRemoveModalSize = (sizeToRemove: string) => {
    setModalSizes(prev => prev.filter(s => s !== sizeToRemove));
  };

  const handleTogglePresetModalSizes = (presets: string[]) => {
    setModalSizes(prev => {
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

  // Delete Confirm Modal State
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState<ProductItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Direct Share Link States
  const [selectedShareProduct, setSelectedShareProduct] = useState<ResolvedProduct | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyProductLink = (prod: ProductItem) => {
    const url = getProductShareUrl(prod.id);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedId(prod.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Category definitions with Bengali names
  const categoryMap: Record<string, string> = {
    cat1: "খাদ্য বাজার",
    cat2: "রূপসজ্জা বাজার",
    cat3: "কাপড় ও পরিধান",
    cat4: "উপহার বাজার",
    cat5: "ব্যাগ ও ফ্যাশন",
    cat6: "ইসলামিক বাজার",
    cat7: "ইলেকট্রনিক্স বাজার",
    cat8: "বই ও শিক্ষা বাজার"
  };

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

  const [isSyncing, setIsSyncing] = useState(false);

  const showToast = (text: string, isError = false) => {
    setToastMessage({ text, isError });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Real-time listener for Firestore "products" collection
  useEffect(() => {
    const q = query(collection(db, "products"));
    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        if (!snapshot.empty) {
          const firestoreItems: ProductItem[] = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data()
          })) as ProductItem[];

          // Create a merged list: Firestore docs take priority, demo items fill any remaining
          const firestoreMap = new Map<string, ProductItem>();
          firestoreItems.forEach(item => {
            if (item.status !== "deleted" && !item.isDeleted) {
              firestoreMap.set(item.id, item);
            }
          });

          const merged: ProductItem[] = [];
          // Add all non-deleted firestore items
          firestoreMap.forEach(item => merged.push(item));

          // Add any initial products not already in Firestore and not deleted
          (ALL_INITIAL_PRODUCTS as ProductItem[]).forEach(demoProd => {
            if (!firestoreMap.has(demoProd.id)) {
              // check if it was marked deleted in firestore
              const wasDeleted = firestoreItems.some(f => f.id === demoProd.id && (f.status === "deleted" || f.isDeleted));
              if (!wasDeleted) {
                merged.push(demoProd);
              }
            }
          });

          // Sort newest or by id
          merged.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          setProducts(merged);
        } else {
          // If Firestore is empty, show full initial demo products
          setProducts(ALL_INITIAL_PRODUCTS as ProductItem[]);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Firestore product fetch error:", error);
        // Fallback to initial products if offline or error
        setProducts(ALL_INITIAL_PRODUCTS as ProductItem[]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Manual trigger to re-sync or restore demo products
  const handleSyncDemoProducts = async () => {
    setIsSyncing(true);
    try {
      const count = await seedDemoProducts(true);
      showToast(`মোট ${count} টি ডেমো প্রোডাক্ট সফলভাবে সিঙ্ক / রিস্টোর হয়েছে!`);
    } catch (err: any) {
      showToast("ডেমো প্রোডাক্ট সিঙ্ক করতে সমস্যা হয়েছে: " + err.message, true);
    } finally {
      setIsSyncing(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (product: ProductItem) => {
    setEditingProduct(product);
    setModalName(product.nameBn || product.nameEn || "");
    setModalCategory(product.categoryId || "cat1");
    setModalPrice(product.price ? String(product.price) : "");
    setModalDiscount(product.discountPercent ? String(product.discountPercent) : "0");
    setModalStock(
      product.stockQuantity !== undefined
        ? String(product.stockQuantity)
        : product.weight ? product.weight.replace(/[^0-9]/g, "") || "10" : "10"
    );
    setModalSizes(product.sizes && Array.isArray(product.sizes) ? [...product.sizes] : []);
    setModalCustomSize("");
    setModalDesc(product.description || "");
    setModalStatus(product.status === "inactive" ? "inactive" : "active");
    setModalFeatured(Boolean(product.isFeatured));
    setModalImages(
      product.images && product.images.length > 0
        ? product.images
        : product.image ? [product.image] : []
    );
    setIsEditModalOpen(true);
  };

  // Upload images inside Edit Modal
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const newImgs: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const base64 = await compressImage(files[i]);
        newImgs.push(base64);
      }
      setModalImages((prev) => [...prev, ...newImgs]);
      showToast("ছবি আপলোড সফল হয়েছে!");
    } catch (err) {
      console.error(err);
      showToast("ছবি আপলোড ব্যর্থ হয়েছে", true);
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleRemoveModalImage = (index: number) => {
    setModalImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Save changes to Firestore
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (!modalName.trim()) {
      showToast("প্রোডাক্টের নাম লিখুন", true);
      return;
    }
    const priceNum = Number(modalPrice) || 0;
    const discountNum = Number(modalDiscount) || 0;
    const stockNum = Number(modalStock) || 0;

    if (priceNum <= 0) {
      showToast("সঠিক মূল্য দিন", true);
      return;
    }

    const calculatedDiscountPrice = discountNum > 0
      ? Math.round(priceNum - (priceNum * discountNum) / 100)
      : priceNum;

    const primaryImg = modalImages.length > 0 
      ? modalImages[0] 
      : editingProduct.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80";

    setIsSaving(true);
    try {
      const productRef = doc(db, "products", editingProduct.id);
      const updatedData = {
        ...editingProduct,
        nameBn: modalName.trim(),
        nameEn: modalName.trim(),
        categoryId: modalCategory,
        price: priceNum,
        discountPercent: discountNum,
        discountPrice: calculatedDiscountPrice,
        stockQuantity: stockNum,
        weight: `${stockNum} Pcs/Stock`,
        sizes: modalSizes,
        description: modalDesc.trim(),
        status: modalStatus,
        stockStatus: modalStatus === "active" ? "In Stock" : "Out of Stock",
        isFeatured: modalFeatured,
        image: primaryImg,
        images: modalImages,
        updatedAt: Date.now()
      };

      await setDoc(productRef, updatedData, { merge: true });

      // Update state locally immediately
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? updatedData : p));

      showToast("প্রোডাক্ট সফলভাবে আপডেট করা হয়েছে!");
      setIsEditModalOpen(false);
      setEditingProduct(null);
    } catch (err: any) {
      console.error("Update error:", err);
      showToast("আপডেট ব্যর্থ হয়েছে: " + err.message, true);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete product permanently
  const handleConfirmDelete = async () => {
    if (!deleteConfirmProduct) return;
    setIsDeleting(true);
    try {
      const productRef = doc(db, "products", deleteConfirmProduct.id);
      await setDoc(productRef, { ...deleteConfirmProduct, status: "deleted", isDeleted: true, updatedAt: Date.now() }, { merge: true });
      try {
        await deleteDoc(productRef);
      } catch (_) {}

      // Update state locally immediately
      setProducts(prev => prev.filter(p => p.id !== deleteConfirmProduct.id));

      showToast(`"${deleteConfirmProduct.nameBn || "প্রোডাক্ট"}" মুছে ফেলা হয়েছে!`);
      setDeleteConfirmProduct(null);
    } catch (err: any) {
      console.error("Delete error:", err);
      showToast("মুছে ফেলতে সমস্যা হয়েছে: " + err.message, true);
    } finally {
      setIsDeleting(false);
    }
  };

  // Quick toggle product status (Active / Inactive)
  const handleToggleStatus = async (product: ProductItem) => {
    const nextStatus = product.status === "inactive" ? "active" : "inactive";
    try {
      const productRef = doc(db, "products", product.id);
      const updated = {
        ...product,
        status: nextStatus,
        stockStatus: nextStatus === "active" ? "In Stock" : "Out of Stock",
        updatedAt: Date.now()
      };
      await setDoc(productRef, updated, { merge: true });

      // Update state locally immediately
      setProducts(prev => prev.map(p => p.id === product.id ? updated : p));

      showToast(`স্ট্যাটাস পরিবর্তন হয়েছে: ${nextStatus === "active" ? "অ্যাক্টিভ" : "ইনঅ্যাক্টিভ"}`);
    } catch (err: any) {
      showToast("স্ট্যাটাস আপডেট ব্যর্থ", true);
    }
  };

  // Category counts with flexible matching
  const getCategoryProductCount = (catId: string) => {
    return products.filter(p => 
      p.categoryId === catId ||
      (catId === "cat1" && (p.categoryId === "food" || (p as any).category === "খাদ্য বাজার")) ||
      (catId === "cat2" && (p.categoryId === "beauty" || (p as any).category === "রূপসজ্জা বাজার")) ||
      (catId === "cat3" && (p.categoryId === "clothing" || (p as any).category === "কাপড় ও পরিধান")) ||
      (catId === "cat4" && (p.categoryId === "gift" || (p as any).category === "উপহার বাজার")) ||
      (catId === "cat5" && (p.categoryId === "fashion" || (p as any).category === "ব্যাগ ও ফ্যাশন")) ||
      (catId === "cat6" && (p.categoryId === "islamic" || (p as any).category === "ইসলামিক বাজার")) ||
      (catId === "cat7" && (p.categoryId === "electronics" || (p as any).category === "ইলেকট্রনিক্স বাজার")) ||
      (catId === "cat8" && (p.categoryId === "education" || (p as any).category === "বই ও শিক্ষা বাজার"))
    ).length;
  };

  // Filter products based on search, category, and status
  const filteredProducts = products.filter((item) => {
    const nameMatch = (item.nameBn || item.nameEn || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase().trim());
    const categoryMatch =
      selectedCategoryFilter === "all" ||
      item.categoryId === selectedCategoryFilter ||
      (selectedCategoryFilter === "cat1" && (item.categoryId === "food" || (item as any).category === "খাদ্য বাজার")) ||
      (selectedCategoryFilter === "cat2" && (item.categoryId === "beauty" || (item as any).category === "রূপসজ্জা বাজার")) ||
      (selectedCategoryFilter === "cat3" && (item.categoryId === "clothing" || (item as any).category === "কাপড় ও পরিধান")) ||
      (selectedCategoryFilter === "cat4" && (item.categoryId === "gift" || (item as any).category === "উপহার বাজার")) ||
      (selectedCategoryFilter === "cat5" && (item.categoryId === "fashion" || (item as any).category === "ব্যাগ ও ফ্যাশন")) ||
      (selectedCategoryFilter === "cat6" && (item.categoryId === "islamic" || (item as any).category === "ইসলামিক বাজার")) ||
      (selectedCategoryFilter === "cat7" && (item.categoryId === "electronics" || (item as any).category === "ইলেকট্রনিক্স বাজার")) ||
      (selectedCategoryFilter === "cat8" && (item.categoryId === "education" || (item as any).category === "বই ও শিক্ষা বাজার"));
    const statusMatch =
      selectedStatusFilter === "all" ||
      (selectedStatusFilter === "active" ? item.status !== "inactive" : item.status === "inactive");

    return nameMatch && categoryMatch && statusMatch;
  });

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-6">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`p-3.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm transition-all animate-in fade-in ${
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

      {/* Header & Stats Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200/80 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <span>সকল প্রোডাক্ট তালিকা</span>
            <span className="text-xs sm:text-sm font-black text-[#5842dc] bg-[#5842dc]/10 px-2.5 py-1 rounded-full">
              {products.length} টি প্রোডাক্ট
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
            এখানে সকল ক্যাটাগরির প্রোডাক্ট দেখা, ফিল্টার করা, সম্পাদনা (Edit) ও মুছে ফেলা (Delete / Remove) যাবে
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleSyncDemoProducts}
            disabled={isSyncing}
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs active:scale-95 transition-all shrink-0 disabled:opacity-50"
            title="সবগুলো ক্যাটাগরির ডিফল্ট ডেমো প্রোডাক্ট ডেটাবেজে সিঙ্ক বা রিস্টোর করুন"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin text-emerald-600" : "text-emerald-700"}`} />
            <span>{isSyncing ? "সিঙ্ক হচ্ছে..." : "ডেমো প্রোডাক্ট সিঙ্ক"}</span>
          </button>

          <button
            type="button"
            onClick={onNavigateToAddProduct}
            className="bg-[#5842dc] hover:bg-[#4b35cf] text-white px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>নতুন প্রোডাক্ট যোগ করুন</span>
          </button>
        </div>
      </div>

      {/* Category Summary Quick Chips */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        <button
          type="button"
          onClick={() => setSelectedCategoryFilter("all")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 flex items-center gap-1.5 ${
            selectedCategoryFilter === "all"
              ? "bg-[#0f172a] text-white shadow-xs"
              : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
          }`}
        >
          <span>সব ক্যাটাগরি</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedCategoryFilter === "all" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-700"}`}>
            {products.length}
          </span>
        </button>

        {categories.map((cat) => {
          const catCount = getCategoryProductCount(cat.id);
          const isSelected = selectedCategoryFilter === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 flex items-center gap-1.5 ${
                isSelected
                  ? "bg-[#5842dc] text-white shadow-xs"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span>{cat.nameBn}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isSelected ? "bg-white/20 text-white" : "bg-gray-100 text-gray-700"}`}>
                {catCount}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        
        {/* Search input */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="প্রোডাক্টের নাম খুঁজুন..."
            className="w-full bg-gray-50/80 border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5842dc]/30 focus:border-[#5842dc] transition-all"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center gap-2.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          
          {/* Category Filter */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs font-bold text-gray-500 hidden sm:inline">ক্যাটাগরি:</span>
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="bg-gray-50/80 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5842dc]/30 cursor-pointer"
            >
              <option value="all">সব ক্যাটাগরি</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameBn}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs font-bold text-gray-500 hidden sm:inline">স্ট্যাটাস:</span>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="bg-gray-50/80 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5842dc]/30 cursor-pointer"
            >
              <option value="all">সব স্ট্যাটাস</option>
              <option value="active">অ্যাক্টিভ (সক্রিয়)</option>
              <option value="inactive">ইনঅ্যাক্টিভ</option>
            </select>
          </div>

        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="min-h-[300px] bg-white rounded-3xl border border-gray-200 flex flex-col items-center justify-center p-8 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-[#5842dc] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs sm:text-sm font-bold text-gray-600">প্রোডাক্ট লোড হচ্ছে...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        /* Empty State */
        <div className="min-h-[300px] bg-white rounded-3xl border border-gray-200 flex flex-col items-center justify-center p-8 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400">
            <Package className="w-7 h-7" />
          </div>
          <h3 className="text-base font-black text-gray-800">কোনো প্রোডাক্ট পাওয়া যায়নি</h3>
          <p className="text-xs text-gray-500 max-w-sm">
            {products.length === 0
              ? "এখনো কোনো প্রোডাক্ট যোগ করা হয়নি। উপরে থাকা 'নতুন প্রোডাক্ট যোগ করুন' বাটনে ক্লিক করে প্রোডাক্ট যুক্ত করুন।"
              : "আপনার ফিল্টার বা সার্চ অনুযায়ী কোনো প্রোডাক্ট মেলেনি।"}
          </p>
          {products.length === 0 && (
            <button
              type="button"
              onClick={onNavigateToAddProduct}
              className="mt-2 bg-[#5842dc] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#4b35cf] transition-all"
            >
              প্রথম প্রোডাক্ট যোগ করুন
            </button>
          )}
        </div>
      ) : (
        /* Product Cards Grid & List View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => {
            const isInactive = product.status === "inactive";
            const catName = (product.categoryId && categoryMap[product.categoryId]) || "সাধারণ ক্যাটাগরি";
            const productPrice = Number(product.price) || 0;
            const discountPrice = Number(product.discountPrice) || productPrice;
            const discountPercent = Number(product.discountPercent) || 0;

            return (
              <div
                key={product.id}
                className={`bg-white rounded-3xl border p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-all flex flex-col justify-between group ${
                  isInactive ? "border-rose-200 bg-rose-50/20 opacity-90" : "border-gray-200/90"
                }`}
              >
                <div>
                  {/* Top Row: Category badge & Active Status */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[11px] font-bold text-[#5842dc] bg-[#5842dc]/10 px-2.5 py-0.5 rounded-full">
                      {catName}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleToggleStatus(product)}
                      className={`text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 cursor-pointer transition-all active:scale-95 ${
                        isInactive
                          ? "bg-rose-100 text-rose-700 border border-rose-200"
                          : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      }`}
                      title="স্ট্যাটাস পরিবর্তন করতে ক্লিক করুন"
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${isInactive ? "bg-rose-600" : "bg-emerald-600"}`} />
                      <span>{isInactive ? "ইনঅ্যাক্টিভ" : "অ্যাক্টিভ"}</span>
                    </button>
                  </div>

                  {/* Main Product Info: Image + Details */}
                  <div className="flex gap-3.5 items-start">
                    {/* Thumbnail */}
                    <div className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-2xl overflow-hidden bg-gray-100 shrink-0 border border-gray-100">
                      <img
                        src={product.image || (product.images && product.images[0]) || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80"}
                        alt={product.nameBn || "Product"}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {discountPercent > 0 && (
                        <div className="absolute top-1 left-1 bg-[#ffb703] text-amber-950 font-black text-[9px] px-1.5 py-0.5 rounded-md shadow-xs">
                          {discountPercent}% ছাড়
                        </div>
                      )}
                      {product.isFeatured && (
                        <div className="absolute bottom-1 right-1 bg-indigo-600 text-white font-bold text-[8px] px-1.5 py-0.5 rounded-md">
                          ফিচার্ড
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <h3 className="text-sm font-black text-gray-900 line-clamp-2 leading-tight">
                        {product.nameBn || product.nameEn || "নামহীন প্রোডাক্ট"}
                      </h3>
                      
                      {/* Price info */}
                      <div className="flex items-baseline gap-1.5 pt-0.5">
                        <span className="text-base font-black text-[#5842dc]">
                          ৳{discountPrice}
                        </span>
                        {discountPercent > 0 && (
                          <span className="text-xs text-gray-400 line-through">
                            ৳{productPrice}
                          </span>
                        )}
                      </div>

                      {/* Stock quantity */}
                      <p className="text-[11px] font-bold text-gray-500 flex items-center gap-1">
                        <span>স্টক:</span>
                        <span className="text-gray-800">
                          {product.stockQuantity !== undefined
                            ? `${product.stockQuantity} পিস`
                            : product.weight || "পর্যাপ্ত"}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Description preview if exists */}
                  {product.description && (
                    <p className="text-[11px] text-gray-500 line-clamp-2 mt-2.5 pt-2 border-t border-gray-100">
                      {product.description}
                    </p>
                  )}

                  {/* Direct Link Shareable Pill Box */}
                  <div className="mt-3 p-2 bg-emerald-50/50 rounded-2xl border border-emerald-200/80 flex items-center justify-between gap-1.5">
                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] font-black text-emerald-800 block uppercase tracking-wider">অ্যাপ ডিপ লিংক (Deep Link)</span>
                      <span className="text-[11px] font-mono font-bold text-[#004b23] truncate block">
                        almayadinbazar://product/{product.id}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyProductLink(product)}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-black flex items-center gap-1 shrink-0 transition-all active:scale-90 ${
                        copiedId === product.id
                          ? "bg-emerald-600 text-white"
                          : "bg-white hover:bg-emerald-100 text-[#004b23] border border-emerald-200 shadow-2xs"
                      }`}
                      title="অ্যাপ ডিপ লিংক কপি করুন"
                    >
                      {copiedId === product.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3 text-[#004b23]" />}
                      <span>{copiedId === product.id ? "কপি হয়েছে" : "কপি"}</span>
                    </button>
                  </div>
                </div>

                {/* Bottom Actions: Live View, Share, Edit and Delete Buttons */}
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-1.5 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    {/* Live View Button */}
                    <a
                      href={`/product/${product.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all active:scale-95"
                      title="গ্রাহক হিসেবে সরাসরি পেইজ দেখুন"
                    >
                      <Eye className="w-3 h-3 text-emerald-600" />
                      <span>লাইভ</span>
                    </a>

                    {/* Share Modal Trigger */}
                    <button
                      type="button"
                      onClick={() => setSelectedShareProduct({
                        id: product.id,
                        name: product.nameBn || product.nameEn || "Product",
                        nameBn: product.nameBn || "পণ্য",
                        price: Number(product.price || 0),
                        discountPrice: Number(product.discountPrice || product.price || 0),
                        image: product.image || (product.images && product.images[0]) || "",
                        images: product.images,
                        description: product.description
                      })}
                      className="bg-emerald-50 hover:bg-emerald-100 text-[#004b23] px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all active:scale-95"
                      title="সোশ্যাল মিডিয়া ও হোয়াটসঅ্যাপে শেয়ার"
                    >
                      <Share2 className="w-3 h-3 text-[#ffb703]" />
                      <span>শেয়ার</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Edit Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(product)}
                      className="bg-indigo-50 hover:bg-indigo-100 text-[#5842dc] px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all active:scale-95"
                    >
                      <Edit3 className="w-3 h-3 stroke-[2.2]" />
                      <span>সম্পাদনা</span>
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmProduct(product)}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-600 px-2 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all active:scale-95"
                    >
                      <Trash2 className="w-3 h-3 stroke-[2.2]" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ================= EDIT MODAL ================= */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-gray-100 space-y-4 animate-in fade-in zoom-in duration-200 my-8">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#5842dc]" />
                <span>প্রোডাক্ট সম্পাদনা (Edit Product)</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Edit Form */}
            <form onSubmit={handleSaveEdit} className="space-y-4">
              
              {/* Product Name */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-800">
                  প্রোডাক্টের নাম <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={modalName}
                  onChange={(e) => setModalName(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5842dc]/40"
                />
              </div>

              {/* Category */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-800">
                  ক্যাটাগরি <span className="text-red-500">*</span>
                </label>
                <select
                  value={modalCategory}
                  onChange={(e) => setModalCategory(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5842dc]/40 cursor-pointer"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameBn}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price, Discount, Stock Grid */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-gray-800">
                    মূল দাম (৳) *
                  </label>
                  <input
                    type="number"
                    required
                    value={modalPrice}
                    onChange={(e) => setModalPrice(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-2.5 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5842dc]/40"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-gray-800">
                    ছাড় (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={modalDiscount}
                    onChange={(e) => setModalDiscount(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-2.5 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5842dc]/40"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-gray-800">
                    স্টক পরিমাণ *
                  </label>
                  <input
                    type="number"
                    required
                    value={modalStock}
                    onChange={(e) => setModalStock(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-2.5 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5842dc]/40"
                  />
                </div>
              </div>

              {/* Status and Featured toggle */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                {/* Status Toggle */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-800">
                    স্ট্যাটাস
                  </label>
                  <select
                    value={modalStatus}
                    onChange={(e) => setModalStatus(e.target.value as "active" | "inactive")}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#5842dc]/40"
                  >
                    <option value="active">অ্যাক্টিভ (Active)</option>
                    <option value="inactive">ইনঅ্যাক্টিভ (Inactive)</option>
                  </select>
                </div>

                {/* Featured toggle */}
                <div className="flex flex-col justify-end">
                  <label
                    onClick={() => setModalFeatured(!modalFeatured)}
                    className="flex items-center gap-2 cursor-pointer p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={modalFeatured}
                      onChange={() => {}}
                      className="w-4 h-4 rounded text-[#5842dc] focus:ring-[#5842dc]"
                    />
                    <span className="text-xs font-bold text-gray-800">হোমে ফিচার্ড রাখুন</span>
                  </label>
                </div>
              </div>

              {/* সাইজ ও ভ্যারিয়েন্ট ব্যবস্থাপনা (Product Sizes) */}
              <div className="space-y-2.5 p-3.5 bg-purple-50/60 rounded-2xl border border-purple-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-[#5842dc]" />
                    প্রোডাক্টের সাইজসমূহ (Sizes)
                  </label>
                  {modalSizes.length > 0 && (
                    <span className="text-[10px] font-bold text-[#5842dc] bg-white px-2 py-0.5 rounded-full border border-purple-200">
                      {modalSizes.length}টি সাইজ
                    </span>
                  )}
                </div>

                {/* Quick Preset Buttons */}
                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() => handleTogglePresetModalSizes(["S", "M", "L", "XL", "XXL"])}
                    className="px-2 py-0.5 bg-white hover:bg-purple-100 border border-purple-200 text-[#5842dc] rounded-lg text-[10px] font-bold transition-all active:scale-95"
                  >
                    👕 শার্ট (S, M, L, XL, XXL)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTogglePresetModalSizes(["38", "40", "42", "44"])}
                    className="px-2 py-0.5 bg-white hover:bg-purple-100 border border-purple-200 text-[#5842dc] rounded-lg text-[10px] font-bold transition-all active:scale-95"
                  >
                    👔 পাঞ্জাবি (38, 40, 42, 44)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTogglePresetModalSizes(["52", "54", "56", "Free Size"])}
                    className="px-2 py-0.5 bg-white hover:bg-purple-100 border border-purple-200 text-[#5842dc] rounded-lg text-[10px] font-bold transition-all active:scale-95"
                  >
                    👗 বোরকা/শাড়ি
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTogglePresetModalSizes(["39", "40", "41", "42", "43"])}
                    className="px-2 py-0.5 bg-white hover:bg-purple-100 border border-purple-200 text-[#5842dc] rounded-lg text-[10px] font-bold transition-all active:scale-95"
                  >
                    👟 জুতা
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTogglePresetModalSizes(["500g", "1kg", "2kg", "5kg"])}
                    className="px-2 py-0.5 bg-white hover:bg-purple-100 border border-purple-200 text-[#5842dc] rounded-lg text-[10px] font-bold transition-all active:scale-95"
                  >
                    🌾 ওজন
                  </button>
                </div>

                {/* Custom Size Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={modalCustomSize}
                    onChange={(e) => setModalCustomSize(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        if (modalCustomSize.trim()) {
                          handleAddModalSize(modalCustomSize);
                          setModalCustomSize("");
                        }
                      }
                    }}
                    placeholder="কাস্টম সাইজ লিখুন (যেমন: XXL)..."
                    className="flex-1 bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5842dc]/40"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (modalCustomSize.trim()) {
                        handleAddModalSize(modalCustomSize);
                        setModalCustomSize("");
                      }
                    }}
                    className="px-3 py-1.5 bg-[#5842dc] text-white rounded-xl text-xs font-bold shrink-0 hover:bg-[#4b35cf] active:scale-95"
                  >
                    যোগ করুন
                  </button>
                </div>

                {/* Chips List */}
                {modalSizes.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {modalSizes.map((sz, idx) => (
                      <div
                        key={idx}
                        className="inline-flex items-center gap-1 bg-white border border-purple-200 text-[#5842dc] px-2.5 py-1 rounded-lg text-xs font-bold shadow-2xs"
                      >
                        <span>{sz}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveModalSize(sz)}
                          className="text-gray-400 hover:text-red-500 rounded-full p-0.5 hover:bg-red-50"
                        >
                          <X className="w-3 h-3 stroke-[3]" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setModalSizes([])}
                      className="text-[10px] text-red-500 font-bold hover:underline px-1.5 py-0.5 self-center"
                    >
                      সব মুছুন
                    </button>
                  </div>
                ) : (
                  <p className="text-[10px] text-gray-400 italic">কোনো সাইজ যোগ করা হয়নি।</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-800">
                  বিবরণ
                </label>
                <textarea
                  rows={3}
                  value={modalDesc}
                  onChange={(e) => setModalDesc(e.target.value)}
                  placeholder="প্রোডাক্ট সম্পর্কে লিখুন..."
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5842dc]/40 resize-none"
                />
              </div>

              {/* Product Images */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-800">
                  প্রোডাক্টের ছবিসমূহ
                </label>

                <div className="flex items-center gap-2 overflow-x-auto py-1">
                  {modalImages.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative w-16 h-16 rounded-xl border border-gray-200 overflow-hidden shrink-0 bg-gray-50"
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveModalImage(idx)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center shadow-xs"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}

                  <label className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-300 hover:border-[#5842dc] flex flex-col items-center justify-center cursor-pointer text-gray-400 hover:text-[#5842dc] shrink-0 bg-gray-50/50 transition-colors">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Upload className="w-4 h-4 mb-0.5" />
                    <span className="text-[9px] font-bold">
                      {isUploading ? "..." : "যোগ করুন"}
                    </span>
                  </label>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-1/2 py-2.5 rounded-xl bg-[#5842dc] hover:bg-[#4b35cf] text-white text-xs font-bold shadow-sm disabled:opacity-50"
                >
                  {isSaving ? "সংরক্ষণ..." : "আপডেট করুন"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ================= DELETE CONFIRM MODAL ================= */}
      {deleteConfirmProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl border border-gray-100 space-y-4 animate-in fade-in zoom-in duration-200 text-center">
            
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6 stroke-[2.2]" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-black text-gray-900">
                প্রোডাক্ট মুছে ফেলতে চান?
              </h3>
              <p className="text-xs text-gray-500 font-medium">
                আপনি কি নিশ্চিত যে <span className="font-bold text-gray-800">"{deleteConfirmProduct.nameBn || deleteConfirmProduct.nameEn || "এই প্রোডাক্টটি"}"</span> স্থায়ীভাবে ডিলিট করতে চান?
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmProduct(null)}
                className="w-1/2 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50"
              >
                না, রাখুন
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="w-1/2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm disabled:opacity-50"
              >
                {isDeleting ? "মুছে ফেলা হচ্ছে..." : "হ্যাঁ, ডিলিট করুন"}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ================= SHARE PRODUCT MODAL ================= */}
      {selectedShareProduct && (
        <ShareProductModal
          isOpen={!!selectedShareProduct}
          onClose={() => setSelectedShareProduct(null)}
          product={selectedShareProduct}
        />
      )}

    </div>
  );
};
