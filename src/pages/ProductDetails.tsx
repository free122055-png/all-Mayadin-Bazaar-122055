import React, { useState, useEffect } from "react";
import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Star, Heart, Share2, ShieldCheck, Truck, RefreshCw, ShoppingCart, 
  Zap, Plus, Minus, ChevronRight, ArrowLeft, Check, Maximize2, 
  X, ZoomIn, Copy, AlertCircle, ShoppingBag, Store, ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { 
  fetchProductById, 
  ResolvedProduct, 
  getProductShareUrl, 
  generateShareDetails 
} from "../lib/productLink";
import { QuickOrderModal } from "../components/QuickOrderModal";
import { ShareProductModal } from "../components/ShareProductModal";
import { SEO } from "../components/SEO";
import { ALL_INITIAL_PRODUCTS } from "../data/allProductsData";

export const ProductDetails: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { addItem, totalItems } = useCart();
  const { user } = useAuth();
  const isFood = location.pathname.startsWith("/food/");

  const initialPassedProduct = (location.state as any)?.product || (location.state as any)?.selectedProduct || ALL_INITIAL_PRODUCTS.find(p => 
    p.id === productId || 
    (p as any).numericId === Number(productId) ||
    p.id.toLowerCase() === (productId || "").toLowerCase()
  );

  const [product, setProduct] = useState<ResolvedProduct | null>(initialPassedProduct ? {
    id: initialPassedProduct.id,
    name: initialPassedProduct.nameBn || initialPassedProduct.name,
    nameBn: initialPassedProduct.nameBn || initialPassedProduct.name,
    price: initialPassedProduct.price,
    discountPrice: initialPassedProduct.discountPrice || initialPassedProduct.price,
    image: initialPassedProduct.image,
    images: initialPassedProduct.images || [initialPassedProduct.image],
    description: initialPassedProduct.description,
    stockQuantity: initialPassedProduct.stockQuantity || 50,
    status: initialPassedProduct.status || "active",
    colors: initialPassedProduct.colors,
    sizes: initialPassedProduct.sizes,
    weight: initialPassedProduct.weight
  } : null);
  const [fetchStatus, setFetchStatus] = useState<"loading" | "found" | "not_found" | "unavailable" | "out_of_stock">(initialPassedProduct ? "found" : "loading");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  
  // Modals
  const [isFullScreenModalOpen, setIsFullScreenModalOpen] = useState(false);
  const [isQuickOrderOpen, setIsQuickOrderOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  
  // Toasts
  const [copiedLink, setCopiedLink] = useState(false);
  const [showCartToast, setShowCartToast] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // Safety timeout: Never stay on loading spinner for more than 1.5s
    const safetyTimer = setTimeout(() => {
      if (isMounted && fetchStatus === "loading") {
        const fallback = ALL_INITIAL_PRODUCTS.find(p => 
          p.id === productId || 
          (p as any).numericId === Number(productId) ||
          p.id.toLowerCase() === (productId || "").toLowerCase()
        );
        if (fallback) {
          setProduct({
            id: fallback.id,
            name: fallback.nameBn,
            nameBn: fallback.nameBn,
            price: fallback.price,
            discountPrice: fallback.discountPrice || fallback.price,
            image: fallback.image,
            images: fallback.images || [fallback.image],
            description: fallback.description,
            stockQuantity: fallback.stockQuantity || 50,
            status: fallback.status || "active"
          });
          setFetchStatus("found");
        } else {
          setFetchStatus("not_found");
          setStatusMessage("দুঃখিত, এই পণ্যটি বর্তমানে উপলব্ধ নয়।");
        }
      }
    }, 1500);

    const loadProduct = async () => {
      if (!productId || productId.trim() === "") {
        setFetchStatus("not_found");
        setStatusMessage("পণ্যটি খুঁজে পাওয়া যায়নি");
        return;
      }

      if (!initialPassedProduct) {
        setFetchStatus("loading");
      }
      try {
        if (typeof navigator !== "undefined" && !navigator.onLine) {
          const offlineMatch = ALL_INITIAL_PRODUCTS.find(p => 
            p.id === productId || 
            (p as any).numericId === Number(productId) ||
            p.id.toLowerCase() === productId.toLowerCase()
          );
          if (offlineMatch) {
            setProduct({
              id: offlineMatch.id,
              name: offlineMatch.nameBn,
              nameBn: offlineMatch.nameBn,
              price: offlineMatch.price,
              discountPrice: offlineMatch.discountPrice || offlineMatch.price,
              image: offlineMatch.image,
              images: offlineMatch.images || [offlineMatch.image],
              description: offlineMatch.description,
              stockQuantity: offlineMatch.stockQuantity || 50,
              status: offlineMatch.status || "active"
            });
            setFetchStatus("found");
            return;
          } else {
            setFetchStatus("unavailable");
            setStatusMessage("ইন্টারনেট সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।");
            return;
          }
        }

        const result = await fetchProductById(productId);
        if (!isMounted) return;

        setFetchStatus(result.status);
        if (result.product) {
          setProduct(result.product);
          if (result.product.colors && result.product.colors.length > 0) {
            setSelectedColor(result.product.colors[0]);
          }
          if (result.product.sizes && result.product.sizes.length > 0) {
            setSelectedSize(result.product.sizes[0]);
          } else if (result.product.weight) {
            setSelectedSize(result.product.weight);
          }
        }
        if (result.message) {
          setStatusMessage(result.message);
        }
      } catch (err: any) {
        if (!isMounted) return;
        console.error("[ProductDetails] Error loading product:", err);
        if (typeof navigator !== "undefined" && !navigator.onLine) {
          setFetchStatus("unavailable");
          setStatusMessage("ইন্টারনেট সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।");
        } else {
          setFetchStatus("not_found");
          setStatusMessage("দুঃখিত, এই পণ্যটি বর্তমানে উপলব্ধ নয়।");
        }
      }
    };

    loadProduct();

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
    };
  }, [productId]);

  const handleCopyLink = () => {
    if (!product) return;
    const shareUrl = getProductShareUrl(product);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const availableSizes = (product?.sizes && product.sizes.length > 0)
    ? product.sizes
    : ((product?.categoryId === "cat3" || (product?.nameBn && /শার্ট|পাঞ্জাবি|টি-শার্ট|পোশাক|বোরকা|শাড়ি|কাপড়|জিন্স|প্যান্ট|জামা/i.test(product.nameBn)))
        ? ["M", "L", "XL", "XXL"]
        : (product?.weight ? [product.weight] : []));

  useEffect(() => {
    if (availableSizes.length > 0 && !selectedSize) {
      setSelectedSize(availableSizes[0]);
    }
  }, [availableSizes, selectedSize]);

  const handleAddToCart = () => {
    if (!product) return;
    const imagesList = product.images && product.images.length > 0 ? product.images : [product.image || ""];
    const chosenSize = selectedSize || (availableSizes.length > 0 ? availableSizes[0] : "");
    const chosenColor = selectedColor || (product.colors && product.colors.length > 0 ? product.colors[0] : "");

    addItem({
      productId: product.id,
      name: product.nameBn || product.name || "পণ্য",
      price: Number(product.discountPrice || product.price || 0),
      quantity,
      selectedSize: chosenSize || undefined,
      selectedColor: chosenColor || undefined,
      image: imagesList[activeImageIndex] || product.image || "",
      weight: chosenSize || product.weight || product.unit || "পিস",
    });
    setShowCartToast(true);
    setTimeout(() => setShowCartToast(false), 2500);
  };

  const [isOrdering, setIsOrdering] = useState(false);

  const handleOpenDirectOrder = () => {
    if (!product) return;
    setIsOrdering(true);
    const chosenSize = selectedSize || (availableSizes.length > 0 ? availableSizes[0] : "");
    const chosenColor = selectedColor || (product.colors && product.colors.length > 0 ? product.colors[0] : "");

    setTimeout(() => {
      navigate("/food/buy", {
        state: {
          selectedProduct: product,
          quantity: quantity,
          selectedSize: chosenSize,
          selectedColor: chosenColor,
          categoryName: (product as any).categoryName || (product as any).category || "All MAYADIN FASHION"
        }
      });
    }, 300);
  };

  // Loading Screen
  if (fetchStatus === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-4 px-4 text-center">
        <div className="w-14 h-14 border-4 border-[#004b23] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-bold text-gray-600">পণ্য তথ্য লোড হচ্ছে...</p>
      </div>
    );
  }

  // Not Found / Unavailable Screen (Never broken!)
  if (fetchStatus === "not_found" || fetchStatus === "unavailable" || !product) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center p-6 text-center space-y-5 max-w-lg mx-auto">
        <div className="w-20 h-20 bg-rose-50 border border-rose-200 text-rose-600 rounded-full flex items-center justify-center shadow-inner">
          <AlertCircle className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">
            দুঃখিত, এই পণ্যটি বর্তমানে উপলব্ধ নয়।
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 max-w-sm">
            {statusMessage || "আপনি যে পণ্যটির লিংক ওপেন করেছেন সেটি সাময়িকভাবে বন্ধ অথবা স্টক শেষ হয়ে গেছে।"}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs pt-2">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex-1 bg-[#004b23] hover:bg-[#00381a] text-white font-black py-3 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md active:scale-95 transition-transform"
          >
            <Store className="w-4 h-4 text-[#ffb703]" />
            <span>হোম পেজে যান</span>
          </button>
          
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-black py-3 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>পেছনে যান</span>
          </button>
        </div>
      </div>
    );
  }

  const getGuaranteedImages = (prod: ResolvedProduct | null) => {
    if (!prod) return ["https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80"];
    const baseImages = prod.images && Array.isArray(prod.images) && prod.images.length > 0
      ? [...prod.images]
      : [prod.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80"];
    
    const pool = [
      baseImages[0],
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80",
      "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&q=80",
      "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&q=80"
    ];

    while (baseImages.length < 5) {
      baseImages.push(pool[baseImages.length % pool.length]);
    }
    return baseImages;
  };

  const imagesList = getGuaranteedImages(product);
  const isOutOfStock = fetchStatus === "out_of_stock" || (product.stockQuantity !== undefined && product.stockQuantity <= 0);
  const currentPrice = Number(product.discountPrice || product.price || 0);
  const regularPrice = Number(product.price || currentPrice);
  const hasDiscount = regularPrice > currentPrice;

  return (
    <div className={`space-y-5 pb-32 relative max-w-4xl mx-auto ${isFood ? "-mx-4 -mt-4" : ""}`}>
      {/* Dynamic SEO Meta */}
      <SEO
        title={`${product.nameBn || product.name} - ৳${currentPrice} | All MAYADIN FASHION`}
        description={product.description || `${product.nameBn} - সুলভ মূল্যে All MAYADIN FASHIONে অর্ডার করুন।`}
        image={imagesList[0]}
      />

      {/* Cart Toast Notification */}
      <AnimatePresence>
        {showCartToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-5 left-4 right-4 z-50 max-w-md mx-auto bg-[#004b23] text-white px-4 py-3.5 rounded-2xl shadow-2xl flex items-center justify-between gap-3 border border-white/20"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                <Check className="w-4 h-4 text-white" />
              </div>
              <div className="text-xs font-bold leading-tight">
                <p className="font-black text-[#ffb703] text-[11px]">কার্টে যোগ হয়েছে!</p>
                <p className="line-clamp-1">{product.nameBn || product.name}</p>
              </div>
            </div>
            <Link
              to={isFood ? "/food/buy" : "/cart"}
              className="bg-[#ffb703] text-black text-[11px] font-black px-3.5 py-1.5 rounded-xl shrink-0 active:scale-95 shadow-sm"
            >
              কার্ট দেখুন
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Copied Link Toast */}
      <AnimatePresence>
        {copiedLink && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 left-4 right-4 z-50 max-w-sm mx-auto bg-gray-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 border border-gray-700"
          >
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs font-bold">প্রোডাক্টের ডিরেক্ট লিংক কপি হয়েছে!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full-Screen Multiple Photos & Details Modal */}
      {isFullScreenModalOpen && (
        <div className="fixed inset-0 z-[999] bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 overflow-y-auto">
          <div className="flex items-center justify-between text-white py-2">
            <div>
              <h2 className="text-sm font-black text-[#ffb703]">পূর্ণাঙ্গ স্ক্রিন গ্যালারি ও বিবরণ</h2>
              <p className="text-xs text-gray-300 line-clamp-1">{product.nameBn || product.name}</p>
            </div>
            <button
              onClick={() => setIsFullScreenModalOpen(false)}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white active:scale-90 transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center my-4">
            <div className="relative w-full max-w-2xl aspect-square bg-black/40 rounded-3xl overflow-hidden border border-white/20 flex items-center justify-center shadow-2xl">
              <img
                src={imagesList[activeImageIndex]}
                alt={product.nameBn}
                className="w-full h-full object-contain p-2"
              />
              <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs font-bold px-3 py-1 rounded-full">
                {activeImageIndex + 1} / {imagesList.length}
              </div>
            </div>

            {/* Thumbnails in Full Screen */}
            <div className="flex gap-3 mt-4 overflow-x-auto max-w-full p-2">
              {imagesList.map((imgUrl: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-16 h-16 rounded-2xl overflow-hidden border-2 transition-all shrink-0 ${
                    activeImageIndex === idx ? "border-[#ffb703] scale-105 shadow-lg" : "border-white/30 opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={imgUrl} alt="Thumb" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-3xl text-white space-y-2 max-w-2xl mx-auto w-full">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black">{product.nameBn || product.name}</h3>
              <span className="text-xl font-black text-[#ffb703]">৳{currentPrice}</span>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">{product.description || "বিস্তারিত বিবরণ উপলব্ধ নেই।"}</p>
          </div>
        </div>
      )}

      {/* Top Header Navigation */}
      {isFood ? (
        <header className="bg-[#004b23] px-5 pt-8 pb-4 rounded-b-[40px] shadow-lg sticky top-0 z-40 mb-4">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate(-1)} className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center border border-white/20 active:scale-90 transition-transform" aria-label="Back">
              <ArrowLeft className="w-4 h-4 text-white" />
            </button>
            <h1 className="text-white text-base sm:text-lg font-black tracking-tight">পণ্য বিবরণ ও অর্ডার</h1>
            <div className="flex items-center gap-2">
              <Link to="/food/buy" className="relative p-2 bg-white/10 rounded-full border border-white/20 shadow-inner">
                <ShoppingCart className="w-4 h-4 text-white" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#ffb703] text-[#000] text-[8px] font-black w-4.5 h-4.5 flex items-center justify-center rounded-full border-2 border-[#004b23]">
                    {totalItems}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </header>
      ) : (
        <div className="flex items-center justify-between pt-3 pb-2 px-1">
          <button 
            onClick={() => navigate(-1)} 
            className="w-10 h-10 bg-white hover:bg-gray-100 rounded-full flex items-center justify-center border border-gray-200 shadow-xs active:scale-90 transition-transform"
            aria-label="Back"
            title="পেছনে ফিরে যান"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-xs font-black bg-emerald-100 text-[#004b23] px-2.5 py-1 rounded-full">
              ID: #{product.numericId || product.id}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/cart" className="relative p-2.5 bg-white hover:bg-gray-100 rounded-full border border-gray-200 shadow-xs active:scale-90 transition-transform">
              <ShoppingCart className="w-4 h-4 text-gray-700" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#004b23] text-white text-[9px] font-black w-4.5 h-4.5 flex items-center justify-center rounded-full">
                  {totalItems}
                </span>
              )}
            </Link>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className={`${isFood ? "px-4" : "px-2 sm:px-4"} space-y-4`}>
        
        {/* Gallery Box */}
        <div className="space-y-3">
          <div 
            onClick={() => setIsFullScreenModalOpen(true)}
            className="aspect-square max-h-[420px] mx-auto bg-white rounded-3xl overflow-hidden border border-gray-200 shadow-xs relative group cursor-pointer flex items-center justify-center"
          >
            <img 
              src={imagesList[activeImageIndex]} 
              alt={product.nameBn} 
              className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300" 
            />
            
            {/* Zoom overlay hint */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 text-white text-xs font-bold px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
                <ZoomIn className="w-4 h-4 text-[#ffb703]" />
                <span>বড় করে দেখুন (Click to Zoom)</span>
              </div>
            </div>

            <button 
              onClick={(e) => { e.stopPropagation(); setIsFullScreenModalOpen(true); }}
              className="absolute top-3 right-3 p-2.5 bg-white/90 backdrop-blur-xs rounded-full shadow-md text-gray-700 hover:text-[#004b23] transition-colors"
              title="বড় স্ক্রিনে দেখুন"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            {hasDiscount && (
              <div className="absolute top-3 left-3 bg-[#ffb703] text-amber-950 text-xs font-black px-3 py-1 rounded-full shadow-md">
                {product.discountPercent ? `${product.discountPercent}% ছাড়` : "বিশেষ ছাড়"}
              </div>
            )}
          </div>

          {/* Thumbnails Row */}
          {imagesList.length > 1 && (
            <div className="flex gap-2.5 overflow-x-auto pb-2 no-scrollbar">
              {imagesList.map((imgUrl: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-18 h-18 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 shrink-0 bg-white transition-all ${
                    activeImageIndex === idx ? "border-[#004b23] ring-2 ring-[#004b23]/30 scale-105 shadow-md" : "border-gray-200 opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={imgUrl} alt={`Thumb ${idx}`} className="w-full h-full object-cover p-1" />
                </button>
              ))}
            </div>
          )}
        </div>



        {/* Product Info Card */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">
                {product.nameBn || product.name}
              </h1>
              {product.nameEn && product.nameEn !== product.nameBn && (
                <p className="text-xs text-gray-400 mt-0.5">{product.nameEn}</p>
              )}
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">আইডি</span>
              <span className="text-xs font-black text-gray-800 bg-gray-100 px-2 py-0.5 rounded-md">
                #{product.numericId || product.id}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-baseline gap-2.5">
              <span className="text-2xl sm:text-3xl font-black text-[#004b23]">৳{currentPrice}</span>
              {hasDiscount && (
                <span className="text-base text-gray-400 line-through font-bold">৳{regularPrice}</span>
              )}
            </div>

            {/* In Stock or Out of Stock Badge */}
            <div className="flex items-center gap-1.5">
              {isOutOfStock ? (
                <span className="bg-rose-50 text-rose-700 text-xs font-black px-3 py-1 rounded-xl border border-rose-200">
                  আউট অব স্টক
                </span>
              ) : (
                <span className="bg-emerald-50 text-emerald-800 text-xs font-black px-3 py-1 rounded-xl border border-emerald-200 flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>স্টকে আছে ({product.stockQuantity || "পর্যাপ্ত"})</span>
                </span>
              )}
            </div>
          </div>

          {/* Rating and Delivery guarantee row */}
          <div className="flex items-center gap-3 pt-2 border-t border-gray-100 text-xs font-bold text-gray-600">
            <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200 text-amber-900">
              <Star className="w-3.5 h-3.5 text-[#ffb703] fill-[#ffb703]" />
              <span className="font-black">{product.rating || 4.9}</span>
              <span className="text-[10px] text-gray-500">({product.reviews || "150+"} রিভিউ)</span>
            </div>
            
            <div className="flex items-center gap-1 text-emerald-700">
              <ShieldCheck className="w-4 h-4" />
              <span>১০০% আসল প্রোডাক্ট</span>
            </div>
          </div>
        </div>

        {/* Variants Selection: Color & Size/Weight */}
        {(product.colors && product.colors.length > 0) && (
          <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-xs space-y-2">
            <label className="text-xs font-black text-gray-800 block">রং (Color) নির্বাচন করুন:</label>
            <div className="flex flex-wrap gap-2">
              {product.colors.map((clr, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedColor(clr)}
                  className={`text-xs px-3.5 py-2 rounded-2xl font-black transition-all ${
                    selectedColor === clr
                      ? "bg-[#004b23] text-white shadow-md ring-2 ring-[#004b23]/30 scale-102"
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
                  }`}
                >
                  {clr}
                </button>
              ))}
            </div>
          </div>
        )}

        {availableSizes && availableSizes.length > 0 && (
          <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-gray-800 block">সাইজ / ভ্যারিয়েন্ট (Size/Variant):</label>
              {selectedSize && (
                <span className="text-[11px] font-bold text-[#004b23] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                  নির্বাচিত: {selectedSize}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {availableSizes.map((sz, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedSize(sz)}
                  className={`text-xs px-3.5 py-2 rounded-2xl font-black transition-all cursor-pointer ${
                    selectedSize === sz
                      ? "bg-[#004b23] text-white shadow-md ring-2 ring-[#004b23]/30 scale-102"
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quantity Selector Card */}
        <div className="flex items-center justify-between bg-white p-4 rounded-3xl border border-gray-100 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="text-xs font-black text-gray-700">পরিমাণ:</span>
            <div className="flex items-center gap-3 bg-gray-50 px-3 py-1.5 rounded-2xl border border-gray-200">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="text-gray-600 hover:text-[#004b23] p-1 active:scale-90"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-base font-black w-6 text-center text-gray-900">{quantity}</span>
              <button 
                onClick={() => setQuantity(quantity + 1)}
                className="text-gray-600 hover:text-[#004b23] p-1 active:scale-90"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-gray-400 font-bold block">মোট মূল্য</span>
            <span className="text-base font-black text-[#004b23]">৳{currentPrice * quantity}</span>
          </div>
        </div>

        {/* Detailed Description */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-xs space-y-3">
          <h3 className="text-sm sm:text-base font-black text-gray-900 border-b border-gray-100 pb-2">
            পণ্যের বিস্তারিত বিবরণ (Full Details)
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed whitespace-pre-line">
            {product.description || "All MAYADIN FASHIONের প্রিমিয়াম কোয়ালিটি সম্পন্ন পণ্য। ১০০% সঠিক ও আসল মানের নিশ্চয়তা সহ সরবরাহ করা হয়।"}
          </p>
          
          <div className="grid grid-cols-2 gap-3 pt-3">
            <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#004b23]" />
              <div>
                <p className="text-[11px] font-black text-gray-800">১০০% আসল পণ্য</p>
                <p className="text-[10px] text-gray-500">গুণগত মান পরীক্ষিত</p>
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 flex items-center gap-2">
              <Truck className="w-5 h-5 text-[#004b23]" />
              <div>
                <p className="text-[11px] font-black text-gray-800">ক্যাশ অন ডেলিভারি</p>
                <p className="text-[10px] text-gray-500">পণ্য পেয়ে মূল্য পরিশোধ</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Bottom Actions Bar */}
        <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 p-3.5 flex gap-3 z-50 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] max-w-4xl mx-auto">
          <button 
            type="button"
            disabled={isOutOfStock}
            onClick={handleAddToCart}
            className="flex-1 flex items-center justify-center gap-2 bg-[#004b23]/10 hover:bg-[#004b23]/20 disabled:opacity-50 text-[#004b23] font-black py-3.5 rounded-2xl border-2 border-[#004b23] active:scale-95 transition-transform text-xs sm:text-sm cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>কার্টে যোগ করুন</span>
          </button>

          <button 
            type="button"
            disabled={isOutOfStock || isOrdering}
            onClick={handleOpenDirectOrder}
            className="flex-1 flex items-center justify-center gap-2 bg-[#004b23] hover:bg-[#00381a] disabled:opacity-50 text-white font-black py-3.5 rounded-2xl shadow-lg shadow-[#004b23]/25 active:scale-95 transition-transform text-xs sm:text-sm cursor-pointer"
          >
            {isOrdering ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Zap className="w-4 h-4 fill-[#ffb703] text-[#ffb703]" />
            )}
            <span>{isOrdering ? "অর্ডার প্রস্তুত হচ্ছে..." : "এখনই অর্ডার করুন"}</span>
          </button>
        </div>
      </div>

      {/* Quick Order Direct Checkout Modal */}
      {isQuickOrderOpen && (
        <QuickOrderModal
          isOpen={isQuickOrderOpen}
          onClose={() => setIsQuickOrderOpen(false)}
          product={product}
          initialQuantity={quantity}
          initialColor={selectedColor}
          initialSize={selectedSize}
        />
      )}

      {/* Share Product Modal */}
      {isShareModalOpen && (
        <ShareProductModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          product={product}
        />
      )}
    </div>
  );
};
