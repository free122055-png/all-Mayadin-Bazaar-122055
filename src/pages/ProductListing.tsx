import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Heart, ShoppingCart, Search, Maximize, MapPin, ChevronDown, Bell, LayoutGrid, ShieldCheck, Truck, Banknote, Shield, ArrowLeft, ChevronRight, Star, Check, X, Zap, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { SEO } from "../components/SEO";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useNotificationContext } from "../context/NotificationContext";
import { db } from "../lib/firebase";
import { collection, query, where, getDocs, onSnapshot, orderBy, doc, getDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { ALL_INITIAL_PRODUCTS } from "../data/allProductsData";
import { AnimatedSearchInput } from "../components/AnimatedSearchInput";

const foodCategories = [
  { id: "f1", name: "চাল ও আটা", image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80" },
  { id: "f2", name: "ডাল", image: "https://images.unsplash.com/photo-1515942400420-2b98fed1f515?w=400&q=80" },
  { id: "f3", name: "মসলা", image: "https://images.unsplash.com/photo-1532336414038-cf19250c5757?w=400&q=80" },
  { id: "f4", name: "তেল", image: "https://images.unsplash.com/photo-1474979266404-7eaacabc88c5?w=400&q=80" },
  { id: "f5", name: "মধু", image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&q=80" },
  { id: "f6", name: "বাদাম", image: "https://images.unsplash.com/photo-1513274271673-820875b11109?w=400&q=80" },
  { id: "f7", name: "পানীয়", image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80" },
  { id: "f8", name: "অন্যান্য", icon: LayoutGrid },
];

const bannerSlides = [
  {
    id: 1,
    title: "Fresh Products",
    subtitle: "Healthy Life",
    discount: "25% Off",
    tagline: "25% OFF",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80",
    gradient: "from-[#004b23] to-[#143a2d]"
  },
  {
    id: 2,
    title: "Organic Fruits",
    subtitle: "Stay Energetic",
    discount: "30% Off",
    tagline: "30% OFF",
    image: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=800&q=80",
    gradient: "from-[#006400] to-[#004d00]"
  }
];

const bestSellingProducts = [
  {
    id: "p1",
    nameBn: "সয়াবিন তেল",
    weight: "5 Liter",
    price: 1050,
    discountPrice: 950,
    discount: "10% OFF",
    image: "https://images.unsplash.com/photo-1474979266404-7eaacabc88c5?w=400&q=80",
  },
  {
    id: "p2",
    nameBn: "চিনিগুড়া চাল",
    weight: "5 KG",
    price: 730,
    discountPrice: 620,
    discount: "15% OFF",
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80",
  },
  {
    id: "p3",
    nameBn: "মসুর ডাল (দেশী)",
    weight: "1 KG",
    price: 150,
    discountPrice: 135,
    discount: "10% OFF",
    image: "https://images.unsplash.com/photo-1515942400420-2b98fed1f515?w=400&q=80",
  },
  {
    id: "p4",
    nameBn: "খাঁটি মধু (সুন্দরবন)",
    weight: "500 gm",
    price: 450,
    discountPrice: 390,
    discount: "13% OFF",
    image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&q=80",
  },
  {
    id: "p5",
    nameBn: "কাঠবাদাম",
    weight: "250 gm",
    price: 350,
    discountPrice: 310,
    discount: "11% OFF",
    image: "https://images.unsplash.com/photo-1513274271673-820875b11109?w=400&q=80",
  },
  {
    id: "p6",
    nameBn: "মিনিকেট চাল (প্রিমিয়াম)",
    weight: "25 KG",
    price: 1750,
    discountPrice: 1650,
    discount: "৳১০০ ছাড়",
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80",
  },
  {
    id: "p7",
    nameBn: "মুগ ডাল (ভাজা)",
    weight: "1 KG",
    price: 180,
    discountPrice: 165,
    discount: "8% OFF",
    image: "https://images.unsplash.com/photo-1515942400420-2b98fed1f515?w=400&q=80",
  },
  {
    id: "p8",
    nameBn: "গরম মশলা গুঁড়া",
    weight: "100 gm",
    price: 120,
    discountPrice: 105,
    discount: "12% OFF",
    image: "https://images.unsplash.com/photo-1532336414038-cf19250c5757?w=400&q=80",
  },
  {
    id: "p9",
    nameBn: "সরিষার তেল (ঘানি ভাঙ্গা)",
    weight: "1 Liter",
    price: 320,
    discountPrice: 290,
    discount: "9% OFF",
    image: "https://images.unsplash.com/photo-1474979266404-7eaacabc88c5?w=400&q=80",
  },
  {
    id: "p10",
    nameBn: "কালোজিরা মধু",
    weight: "250 gm",
    price: 280,
    discountPrice: 250,
    discount: "10% OFF",
    image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&q=80",
  },
  {
    id: "p11",
    nameBn: "কাজু বাদাম",
    weight: "200 gm",
    price: 420,
    discountPrice: 380,
    discount: "10% OFF",
    image: "https://images.unsplash.com/photo-1513274271673-820875b11109?w=400&q=80",
  },
  {
    id: "p12",
    nameBn: "আটা (লাল)",
    weight: "2 KG",
    price: 110,
    discountPrice: 95,
    discount: "14% OFF",
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80",
  },
  {
    id: "p13",
    nameBn: "হলুদ গুঁড়া",
    weight: "200 gm",
    price: 85,
    discountPrice: 75,
    discount: "12% OFF",
    image: "https://images.unsplash.com/photo-1532336414038-cf19250c5757?w=400&q=80",
  },
  {
    id: "p14",
    nameBn: "মরিচ গুঁড়া (ঝাল)",
    weight: "200 gm",
    price: 95,
    discountPrice: 85,
    discount: "10% OFF",
    image: "https://images.unsplash.com/photo-1532336414038-cf19250c5757?w=400&q=80",
  },
  {
    id: "p15",
    nameBn: "ঘি (গাভী)",
    weight: "500 gm",
    price: 850,
    discountPrice: 790,
    discount: "৳৬০ ছাড়",
    image: "https://images.unsplash.com/photo-1589927986089-35812388d1f4?w=400&q=80",
  },
  {
    id: "p16",
    nameBn: "পিঙ্ক সল্ট",
    weight: "500 gm",
    price: 140,
    discountPrice: 125,
    discount: "11% OFF",
    image: "https://images.unsplash.com/photo-1532336414038-cf19250c5757?w=400&q=80",
  },
  {
    id: "p17",
    nameBn: "কালিজিরা চাল",
    weight: "1 KG",
    price: 160,
    discountPrice: 145,
    discount: "9% OFF",
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80",
  },
  {
    id: "p18",
    nameBn: "ছোলা বুট",
    weight: "1 KG",
    price: 110,
    discountPrice: 98,
    discount: "11% OFF",
    image: "https://images.unsplash.com/photo-1515942400420-2b98fed1f515?w=400&q=80",
  },
  {
    id: "p19",
    nameBn: "চিয়া সিড",
    weight: "100 gm",
    price: 250,
    discountPrice: 220,
    discount: "12% OFF",
    image: "https://images.unsplash.com/photo-1513274271673-820875b11109?w=400&q=80",
  },
  {
    id: "p20",
    nameBn: "খেজুর (আজওয়া)",
    weight: "500 gm",
    price: 950,
    discountPrice: 850,
    discount: "৳১০০ ছাড়",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80",
  },
  {
    id: "p21",
    nameBn: "কাঠবাদাম তেল",
    weight: "100 ml",
    price: 380,
    discountPrice: 340,
    discount: "10% OFF",
    image: "https://images.unsplash.com/photo-1474979266404-7eaacabc88c5?w=400&q=80",
  },
  {
    id: "p22",
    nameBn: "তোকমা দানা",
    weight: "100 gm",
    price: 120,
    discountPrice: 100,
    discount: "16% OFF",
    image: "https://images.unsplash.com/photo-1513274271673-820875b11109?w=400&q=80",
  },
];

const beautyProducts = [
  {
    id: "b1",
    nameBn: "রোলেজ মেকআপ কিট",
    price: 1200,
    discountPrice: 950,
    discount: "২১%",
    rating: 5,
    image: "https://images.unsplash.com/photo-1512496011931-a2c388278ab0?w=400&q=80",
  },
  {
    id: "b2",
    nameBn: "রোলেজ মেকআপ কিট",
    price: 1200,
    discountPrice: 950,
    discount: "২১%",
    rating: 5,
    image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&q=80",
  },
  {
    id: "b3",
    nameBn: "রোলেজ মেকআপ কিট",
    price: 1200,
    discountPrice: 950,
    discount: "২১%",
    rating: 5,
    image: "https://images.unsplash.com/photo-1596462502278-27bfad450526?w=400&q=80",
  },
  {
    id: "b4",
    nameBn: "ফর্মি কারক ক্রিম",
    price: 1200,
    discountPrice: 950,
    discount: "২১%",
    rating: 5,
    image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&q=80",
  },
];

const clothingProducts = [
  {
    id: "c1",
    nameBn: "প্রিমিয়াম লিনেন শার্ট",
    price: 2950,
    discount: "৩৮%\nছাড়",
    rating: 4.8,
    reviews: "1.2k",
    image: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=400&q=80",
  },
  {
    id: "c2",
    nameBn: "ডিজাইনার সিল্ক শাড়ি",
    price: 2950,
    discount: "১৮%\nছাড়",
    rating: 4.8,
    reviews: "1.2k",
    image: "https://images.unsplash.com/photo-1610116306796-6fea9f4fae38?w=400&q=80",
  },
  {
    id: "c3",
    nameBn: "বয়েজ কটন পাঞ্জাবি",
    price: 2950,
    discount: "১২%\nছাড়",
    rating: 4.8,
    reviews: "1.2k",
    image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&q=80",
  },
];

const giftProducts = [
  {
    id: "g1",
    nameBn: "প্রিমিয়াম উপহার বাক্স",
    price: 5500,
    discount: "৩৮%\nছাড়",
    rating: 4.8,
    reviews: "1.2k",
    image: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400&q=80",
  },
  {
    id: "g2",
    nameBn: "ডিজাইনার ঘড়ি",
    price: 2950,
    discount: "১৮%\nছাড়",
    rating: 4.8,
    reviews: "1.2k",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80",
  },
  {
    id: "g3",
    nameBn: "বিবাহ বার্ষিকী উপহার",
    price: 2500,
    discount: "১২%\nছাড়",
    rating: 4.8,
    reviews: "1.2k",
    image: "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=400&q=80",
  },
];

const fashionProducts = [
  {
    id: "fa1",
    nameBn: "হ্যান্ড-ওভেন ব্যাগ",
    price: 4550,
    discount: "১০%\nছাড়",
    rating: 4.9,
    reviews: "1.5k",
    image: "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=400&q=80",
  },
  {
    id: "fa2",
    nameBn: "ডিজাইনার ওয়ালেট",
    price: 2250,
    discount: "১৮%\nছাড়",
    rating: 4.8,
    reviews: "1.2k",
    image: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=400&q=80",
  },
  {
    id: "fa3",
    nameBn: "প্রিমিয়াম সানগ্লাস",
    price: 3200,
    discount: "১৫%\nছাড়",
    rating: 4.7,
    reviews: "950",
    image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400&q=80",
  },
];

const islamicProducts = [
  {
    id: "is1",
    nameBn: "লেদার প্রিমিয়াম টুপি",
    price: 1050,
    discount: "NEW",
    rating: 4.8,
    reviews: "1.5k",
    image: "https://images.unsplash.com/photo-1596766436923-b6d4cb800888?w=400&q=80",
  },
  {
    id: "is2",
    nameBn: "তাতামিক আতর ও টুপি",
    price: 2250,
    discount: "SALE",
    rating: 4.8,
    reviews: "1.2k",
    image: "https://images.unsplash.com/photo-1588693836171-460d3d5f308f?w=400&q=80",
  },
  {
    id: "is3",
    nameBn: "জায়নামাজ",
    price: 3200,
    discount: "NEW",
    rating: 4.7,
    reviews: "950",
    image: "https://images.unsplash.com/photo-1579998188289-53b0e145efab?w=400&q=80",
  },
];

const educationProducts = [
  {
    id: "ed1",
    nameBn: "লোবীয় উতার বাগ",
    author: "জাথক প্রিয়ান",
    price: 950,
    rating: 4.8,
    reviews: "1.5k",
    image: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400&q=80",
  },
  {
    id: "ed2",
    nameBn: "আমষার উভোমি",
    author: "অথক নুবিন",
    price: 950,
    rating: 4.8,
    reviews: "1.5k",
    image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&q=80",
  },
  {
    id: "ed3",
    nameBn: "রামায়ণ",
    author: "অজ্ঞাত",
    price: 950,
    rating: 4.8,
    reviews: "1.5k",
    image: "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&q=80",
  },
];

const electronicsProducts = [
  {
    id: "el1",
    nameBn: "প্রিমিয়াম ওয়ারলেস ইয়ারবাডস",
    author: "সাউন্ডকোর (soundcore)",
    price: 1190,
    discount: "NEW",
    discountColor: "bg-[#1877f2]",
    stock: true,
    rating: 4.8,
    reviews: "1.5k",
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&q=80",
  },
  {
    id: "el2",
    nameBn: "স্মার্টওয়াচ সিরিজ ৭",
    author: "অ্যাপল (Apple)",
    price: 2950,
    discount: "-20%",
    discountColor: "bg-black",
    rating: 4.8,
    reviews: "1.5k",
    image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400&q=80",
  },
  {
    id: "el3",
    nameBn: "পাওয়ার ব্যাংক",
    author: "অ্যাঙ্কার (Anker)",
    price: 1150,
    rating: 4.9,
    reviews: "1.6k",
    image: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400&q=80",
  },
];

// Default Category Info for 0ms Instant Page Load with ZERO delay and ZERO loading spinners
const DEFAULT_CATEGORY_INFO: Record<string, any> = {
  cat1: { id: "cat1", title: "খাদ্য বাজার", nameBn: "খাদ্য বাজার", subtitle: "তাজা খাবার ও নিত্যপ্রয়োজনীয় পণ্য" },
  cat2: { id: "cat2", title: "রুপসজ্জা বাজার", nameBn: "রুপসজ্জা বাজার", subtitle: "সৌন্দর্য ও প্রিমিয়াম গ্রুমিং" },
  cat3: { id: "cat3", title: "কাপড় ও পরিধান", nameBn: "কাপড় ও পরিধান", subtitle: "পুরুষ, নারী ও শিশুদের পোশাক" },
  cat4: { id: "cat4", title: "উপহার বাজার", nameBn: "উপহার বাজার", subtitle: "প্রিয়জনের জন্য বিশেষ উপহার" },
  cat5: { id: "cat5", title: "ব্যাগ ও ফ্যাশন", nameBn: "ব্যাগ ও ফ্যাশন", subtitle: "স্টাইলিশ ব্যাগ ও এক্সেসরিজ" },
  cat6: { id: "cat6", title: "ইসলামিক বাজার", nameBn: "ইসলামিক বাজার", subtitle: "জায়নামাজ, আতর ও ধর্মীয় পণ্য" },
  cat7: { id: "cat7", title: "ইলেকট্রনিক্স বাজার", nameBn: "ইলেকট্রনিক্স বাজার", subtitle: "স্মার্ট গ্যাজেট ও ইলেকট্রনিক্স" },
  cat8: { id: "cat8", title: "বই ও শিক্ষা বাজার", nameBn: "বই ও শিক্ষা বাজার", subtitle: "বই, স্টেশনারি ও শিক্ষা সামগ্রী" },
  food: { id: "cat1", title: "খাদ্য বাজার", nameBn: "খাদ্য বাজার", subtitle: "তাজা খাবার ও নিত্যপ্রয়োজনীয় পণ্য" },
  beauty: { id: "cat2", title: "রুপসজ্জা বাজার", nameBn: "রুপসজ্জা বাজার", subtitle: "সৌন্দর্য ও প্রিমিয়াম গ্রুমিং" },
  clothing: { id: "cat3", title: "কাপড় ও পরিধান", nameBn: "কাপড় ও পরিধান", subtitle: "পুরুষ, নারী ও শিশুদের পোশাক" },
  gift: { id: "cat4", title: "উপহার বাজার", nameBn: "উপহার বাজার", subtitle: "প্রিয়জনের জন্য বিশেষ উপহার" },
  fashion: { id: "cat5", title: "ব্যাগ ও ফ্যাশন", nameBn: "ব্যাগ ও ফ্যাশন", subtitle: "স্টাইলিশ ব্যাগ ও এক্সেসরিজ" },
  islamic: { id: "cat6", title: "ইসলামিক বাজার", nameBn: "ইসলামিক বাজার", subtitle: "জায়নামাজ, আতর ও ধর্মীয় পণ্য" },
  electronics: { id: "cat7", title: "ইলেকট্রনিক্স বাজার", nameBn: "ইলেকট্রনিক্স বাজার", subtitle: "স্মার্ট গ্যাজেট ও ইলেকট্রনিক্স" },
  education: { id: "cat8", title: "বই ও শিক্ষা বাজার", nameBn: "বই ও শিক্ষা বাজার", subtitle: "বই, স্টেশনারি ও শিক্ষা সামগ্রী" },
};

// Global singleton cache so switching or opening ANY category is 100% instant (0ms)
let globalCachedProducts: any[] = ALL_INITIAL_PRODUCTS;
let globalCachedFoodSubcategories: any[] = foodCategories;
let globalCachedCategoryBanners: any[] = [];
const globalCachedSubcategories: Record<string, any[]> = {};
const globalCachedBanners: Record<string, any[]> = {};
const globalCachedCategoryDocs: Record<string, any> = {};

let hasInitializedGlobalListeners = false;

function initGlobalMarketplaceListeners() {
  if (hasInitializedGlobalListeners) return;
  hasInitializedGlobalListeners = true;

  // Background products listener - runs once for entire session
  try {
    const qProd = query(collection(db, "products"));
    onSnapshot(qProd, (snapshot) => {
      const live = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (live.length > 0) {
        globalCachedProducts = live;
      }
    }, (err) => console.warn("Background product sync notice:", err.message));
  } catch (e) {
    console.warn("Product listener notice:", e);
  }

  // Background food subcategories listener - runs once
  try {
    const qFoodSub = query(collection(db, "food_subcategories"), orderBy("order", "asc"));
    onSnapshot(qFoodSub, (snapshot) => {
      const subs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (subs.length > 0) {
        globalCachedFoodSubcategories = subs;
      }
    }, (err) => console.warn("Background food subcategories sync notice:", err.message));
  } catch (e) {
    console.warn("Food sub listener notice:", e);
  }

  // Background category banners listener - runs once
  try {
    onSnapshot(doc(db, "app_settings", "category_banners"), (docSnap) => {
      if (docSnap.exists() && docSnap.data().categories) {
        globalCachedCategoryBanners = docSnap.data().categories as any[];
      }
    }, (err) => console.warn("Background category banners sync notice:", err.message));
  } catch (e) {
    console.warn("Category banner listener notice:", e);
  }
}

// Immediate eager execution
initGlobalMarketplaceListeners();

export const ProductListing: React.FC = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const { addItem, totalItems } = useCart();
  const { requireAuth } = useAuth();
  const { unreadCount } = useNotificationContext();

  // Normalize target category id
  const rawParam = categoryId || "cat1";
  const normalizedId = 
    rawParam === "food" ? "cat1" :
    rawParam === "beauty" ? "cat2" :
    rawParam === "clothing" ? "cat3" :
    rawParam === "gift" ? "cat4" :
    rawParam === "fashion" ? "cat5" :
    rawParam === "islamic" ? "cat6" :
    rawParam === "electronics" ? "cat7" :
    rawParam === "education" ? "cat8" : rawParam;

  // Initialize immediately from in-memory cache — ZERO wait, ZERO spinner
  const [category, setCategory] = useState<any>(() => 
    globalCachedCategoryDocs[normalizedId] || DEFAULT_CATEGORY_INFO[normalizedId] || { id: normalizedId, title: "বাজার" }
  );
  const [currentSlide, setCurrentSlide] = useState(0);
  const [products, setProducts] = useState<any[]>(() => globalCachedProducts.length > 0 ? globalCachedProducts : ALL_INITIAL_PRODUCTS);
  const [subCategories, setSubCategories] = useState<any[]>(() => globalCachedSubcategories[normalizedId] || []);
  const [foodSubcategories, setFoodSubcategories] = useState<any[]>(() => globalCachedFoodSubcategories.length > 0 ? globalCachedFoodSubcategories : foodCategories);
  const [banners, setBanners] = useState<any[]>(() => globalCachedBanners[normalizedId] || []);
  const [categoryManagedBanners, setCategoryManagedBanners] = useState<any[]>(() => {
    if (globalCachedCategoryBanners.length > 0) {
      const match = globalCachedCategoryBanners.find(c => 
        c.categoryId === normalizedId || 
        c.categoryId === rawParam || 
        c.categoryNumber === Number(normalizedId.replace("cat", ""))
      );
      return match?.banners || [];
    }
    return [];
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [categoryVisibility, setCategoryVisibility] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const unsubVis = onSnapshot(doc(db, "settings", "category_visibility"), (snap) => {
      if (snap.exists()) {
        setCategoryVisibility(snap.data() as Record<string, boolean>);
      }
    });
    return () => unsubVis();
  }, []);

  const isCategoryDisabled = categoryVisibility[normalizedId] === false;

  useEffect(() => {
    // Instant scroll to top on navigation
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });

    // Sync latest from cache immediately
    if (globalCachedProducts.length > 0) setProducts(globalCachedProducts);
    if (globalCachedFoodSubcategories.length > 0) setFoodSubcategories(globalCachedFoodSubcategories);
    if (globalCachedCategoryDocs[normalizedId] || DEFAULT_CATEGORY_INFO[normalizedId]) {
      setCategory(globalCachedCategoryDocs[normalizedId] || DEFAULT_CATEGORY_INFO[normalizedId]);
    }
    if (globalCachedSubcategories[normalizedId]) {
      setSubCategories(globalCachedSubcategories[normalizedId]);
    }
    if (globalCachedBanners[normalizedId]) {
      setBanners(globalCachedBanners[normalizedId]);
    }
    if (globalCachedCategoryBanners.length > 0) {
      const match = globalCachedCategoryBanners.find(c => 
        c.categoryId === normalizedId || 
        c.categoryId === rawParam || 
        c.categoryNumber === Number(normalizedId.replace("cat", ""))
      );
      if (match?.banners) setCategoryManagedBanners(match.banners);
    }

    // Fetch Category Details if not in cache
    if (!globalCachedCategoryDocs[normalizedId]) {
      getDoc(doc(db, "categories", normalizedId)).then(docSnap => {
        if (docSnap.exists()) {
          const catData = { id: docSnap.id, ...docSnap.data() };
          globalCachedCategoryDocs[normalizedId] = catData;
          setCategory(catData);
        }
      }).catch(() => {});
    }

    // Fetch Subcategories for this category
    const qSub = query(collection(db, "subcategories"), where("parentId", "==", normalizedId));
    const unsubSub = onSnapshot(
      qSub, 
      (snapshot) => {
        const subs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        globalCachedSubcategories[normalizedId] = subs;
        setSubCategories(subs);
      },
      () => {}
    );

    // Fetch Banners for this category
    const qBan = query(collection(db, "banners"), where("categoryId", "==", normalizedId));
    const unsubBan = onSnapshot(
      qBan, 
      (snapshot) => {
        const bans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        globalCachedBanners[normalizedId] = bans;
        setBanners(bans);
      },
      () => {}
    );

    return () => {
      unsubSub();
      unsubBan();
    };
  }, [categoryId, normalizedId, rawParam]);

  const handleAddToCart = (product: any, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    requireAuth(() => {
      const price = Number(product.discountPrice || product.price || 0);
      const name = product.nameBn || product.name || product.title || "পণ্য";
      const image = product.image || (product.images && product.images[0]) || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80";
      const productId = String(product.id || name);
      
      let defaultSize = undefined;
      if (product.sizes && product.sizes.length > 0) {
        defaultSize = product.sizes[0];
      } else if (product.categoryId === "cat3" || (product.nameBn && /শার্ট|পাঞ্জাবি|টি-শার্ট|পোশাক|বোরকা|শাড়ি|কাপড়|জিন্স|প্যান্ট|জামা/i.test(product.nameBn))) {
        defaultSize = "M"; // fallback
      }

      addItem({
        productId,
        name,
        price,
        quantity: 1,
        image,
        weight: product.weight || product.unit || "",
        selectedSize: defaultSize
      });

      setToastMessage(name);
      setTimeout(() => {
        setToastMessage(null);
      }, 2500);
    }, "পণ্য ক্রয় বা কার্টে যোগ করতে প্রথমে আপনার অ্যাকাউন্টে লগইন করুন।");
  };

  const handleBuyNow = async (product: any, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const imagesList = product.images && product.images.length > 0 ? product.images : [product.image || ""];
    
    // Determine default size if it's clothing and has sizes
    let defaultSize = "";
    if (product.sizes && product.sizes.length > 0) {
      defaultSize = product.sizes[0];
    } else if (product.categoryId === "cat3" || (product.nameBn && /শার্ট|পাঞ্জাবি|টি-শার্ট|পোশাক|বোরকা|শাড়ি|কাপড়|জিন্স|প্যান্ট|জামা/i.test(product.nameBn))) {
      defaultSize = "M"; // fallback
    }

    navigate("/food/buy", {
      state: {
        selectedProduct: {
          ...product,
          images: imagesList,
          image: imagesList[0]
        },
        quantity: 1,
        selectedSize: defaultSize || undefined,
        categoryName: product.category || category?.title || "All MAYADIN FASHION"
      }
    });
  };

  const isFood = category?.title?.includes("খাদ্য") || categoryId === "cat1" || categoryId === "food";
  const isBeauty = category?.title?.includes("রূপসজ্জা") || categoryId === "cat2";
  const isClothing = category?.title?.includes("কাপড়") || category?.title?.includes("কাপড়") || categoryId === "cat3" || categoryId === "clothing";
  const isGift = category?.title?.includes("উপহার") || categoryId === "cat4" || categoryId === "gift";
  const isFashion = category?.title?.includes("ব্যাগ") || category?.title?.includes("ফ্যাশন") || categoryId === "cat5" || categoryId === "fashion";
  const isIslamic = category?.title?.includes("ইসলামিক") || categoryId === "cat6" || categoryId === "islamic";
  const isEducation = category?.title?.includes("শিক্ষা") || categoryId === "cat8" || categoryId === "education";
  const isElectronics = category?.title?.includes("ইলেকট্রনিক") || categoryId === "cat7" || categoryId === "electronics";
  const themeColor = isBeauty ? "bg-gradient-to-b from-[#d9c5b2] via-[#e8d5c5] to-[#f5eade]" : "bg-[#004b23]";
  const accentColor = isBeauty ? "text-[#8b5e34]" : "text-[#004b23]";
  const lightBg = isBeauty ? "bg-[#fdf8f4]" : "bg-[#f0f9f1]";
  const borderColor = isBeauty ? "border-[#e8d5c5]" : "border-[#dcf0dd]";
  const btnColor = isBeauty ? "bg-[#8b5e34]" : "bg-[#004b23]";

  const handleBannerClick = (bannerItem?: any) => {
    const banner = bannerItem || (displayBanners && displayBanners[currentSlide]);
    const bId = banner?.id ? String(banner.id) : `b_${targetCatId}_1`;
    navigate(`/banner-offer/${bId}`);
  };

  const beautyCategories = [
    { id: "b1", name: "মেকআপ", image: "https://cdn-icons-png.flaticon.com/512/3501/3501241.png" },
    { id: "b2", name: "স্কিন কেয়ার", image: "https://cdn-icons-png.flaticon.com/512/3163/3163195.png" },
    { id: "b3", name: "হেয়ার কেয়ার", image: "https://cdn-icons-png.flaticon.com/512/3461/3461144.png" },
    { id: "b4", name: "পারফিউম", image: "https://cdn-icons-png.flaticon.com/512/3058/3058995.png" },
    { id: "b5", name: "বডি কেয়ার", image: "https://cdn-icons-png.flaticon.com/512/2553/2553642.png" },
  ];

  const electronicsBanners = [
    {
      id: 1,
      title: "ইলেকট্রনিক গ্যাজেট বাজার",
      subtitle: "“৫,০০০-এর মধ্যে দরকারি\nআধুনিক গ্যাজেট”",
      btnText: "গ্যাজেট দেখুন →",
      image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400&q=80"
    },
    {
      id: 2,
      title: "স্মার্ট লাইফস্টাইল",
      subtitle: "প্রিমিয়াম ব্র্যান্ডের\nআসল গ্যাজেট",
      btnText: "কালেকশন দেখুন →",
      image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&q=80"
    },
    {
      id: 3,
      title: "অডিও ও সাউন্ড",
      subtitle: "সেরা সাউন্ড কোয়ালিটি\nসাশ্রয়ী মূল্যে",
      btnText: "অফার দেখুন →",
      image: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400&q=80"
    }
  ];

  const educationBanners = [
    {
      id: 1,
      title: "বই ও শিক্ষা বাজার",
      subtitle: "“জ্ঞান, শিক্ষা ও শেখার\nসবকিছু এক জায়গায়”",
      btnText: "এখনই ঘুরে দেখুন →",
      image: "https://images.unsplash.com/photo-1491841573634-28140fc7ced7?w=400&q=80"
    },
    {
      id: 2,
      title: "সেরা বইয়ের কালেকশন",
      subtitle: "আপনার প্রিয় লেখকের\nসব বই এখন এখানে",
      btnText: "বই দেখুন →",
      image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&q=80"
    },
    {
      id: 3,
      title: "শিক্ষা উপকরণ",
      subtitle: "স্টেশনারি ও প্রয়োজনীয়\nসব শিক্ষা সামগ্রী",
      btnText: "অফার দেখুন →",
      image: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400&q=80"
    }
  ];

  const giftBanners = [
    {
      id: 1,
      title: "উপহার বাজার",
      subtitle: "প্রিয়জনের জন্য\nপছন্দের উপহার",
      btnText: "[ উপহার দেখুন ]",
      image: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400&q=80"
    },
    {
      id: 2,
      title: "বিশেষ দিনের\nবিশেষ উপহার",
      subtitle: "জন্মদিন বা বিবাহ বার্ষিকীর\nসেরা কালেকশন",
      btnText: "[ এখনই কিনুন ]",
      image: "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=400&q=80"
    },
    {
      id: 3,
      title: "ভালোবাসার\nউপহার",
      subtitle: "ভালোবাসা প্রকাশের জন্য\nসুন্দর উপহার",
      btnText: "[ কালেকশন দেখুন ]",
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80"
    }
  ];

  const clothingBanners = [
    {
      id: 1,
      title: "নতুন স্টাইলে\nনিজেকে সাজান",
      subtitle: "পুরুষ, নারী ও শিশুদের\nজন্য বাছাই করা পোশাক",
      btnText: "[ এখনই কেনাকাটা করুন ]",
      image: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=400&q=80"
    },
    {
      id: 2,
      title: "শীতের নতুন\nকালেকশন",
      subtitle: "উষ্ণতা ও স্টাইলের\nনিখুঁত সংমিশ্রণ",
      btnText: "[ কালেকশন দেখুন ]",
      image: "https://images.unsplash.com/photo-1610116306796-6fea9f4fae38?w=400&q=80"
    },
    {
      id: 3,
      title: "উৎসবে আনুন\nনতুন চমক",
      subtitle: "স্পেশাল ডিজাইনার\nওয়েডিং পোশাক",
      btnText: "[ অফার দেখুন ]",
      image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&q=80"
    }
  ];

  const fashionBanners = [
    {
      id: 1,
      title: "ব্যাগ ও ফ্যাশন বাজার",
      subtitle: "“আপনার স্টাইল,\nআপনার পরিচয়”",
      btnText: "ফ্যাশন দেখুন →",
      image: "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=400&q=80"
    },
    {
      id: 2,
      title: "নতুন ট্রেন্ডস",
      subtitle: "“নিজেকে সাজান\nনতুন রূপে”",
      btnText: "কালেকশন দেখুন →",
      image: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=400&q=80"
    },
    {
      id: 3,
      title: "অত্যাধুনিক ডিজাইন",
      subtitle: "“প্রিমিয়াম কোয়ালিটি\nসাশ্রয়ী মূল্যে”",
      btnText: "অফার দেখুন →",
      image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400&q=80"
    }
  ];

  const islamicBanners = [
    {
      id: 1,
      title: "ইসলামিক বাজার",
      subtitle: "ইসলামিক জীবনযাপনের\nজন্য প্রয়োজনীয় সবকিছু",
      btnText: "পণ্য দেখুন →",
      image: "https://images.unsplash.com/photo-1601053073740-410a563ee9f3?w=400&q=80"
    },
    {
      id: 2,
      title: "প্রিমিয়াম জায়নামাজ",
      subtitle: "আপনার ইবাদতের\nজন্য সেরা মানের",
      btnText: "কালেকশন দেখুন →",
      image: "https://images.unsplash.com/photo-1579998188289-53b0e145efab?w=400&q=80"
    },
    {
      id: 3,
      title: "আতর ও সুগন্ধি",
      subtitle: "বিশুদ্ধ আতরের\nসুঘ্রাণে স্নিগ্ধতা",
      btnText: "অফার দেখুন →",
      image: "https://images.unsplash.com/photo-1588693836171-460d3d5f308f?w=400&q=80"
    }
  ];

  const beautyBanners = [
    {
      id: 1,
      title: "রুপসজ্জা বাজার",
      subtitle: "বিউটি ও রূপচর্চা পণ্যে\nসেরা অফার ও ছাড়",
      btnText: "এখনই দেখুন →",
      image: "https://images.unsplash.com/photo-1512496011931-a2c388278ab0?w=800&q=80"
    },
    {
      id: 2,
      title: "স্কিন কেয়ার ডিলস",
      subtitle: "তাজা ও উজ্জ্বল ত্বকের\nজন্য প্রিমিয়াম পণ্য",
      btnText: "অফার দেখুন →",
      image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80"
    }
  ];

  const targetCatId = isFood ? "cat1" : isBeauty ? "cat2" : isClothing ? "cat3" : isGift ? "cat4" : isFashion ? "cat5" : isIslamic ? "cat6" : isElectronics ? "cat7" : isEducation ? "cat8" : (categoryId || "cat1");

  const formattedManagedBanners = categoryManagedBanners.map(b => ({
    id: b.id,
    title: b.title,
    subtitle: b.subtitle,
    discount: b.discountText,
    tagline: b.discountText,
    btnText: b.btnText || "এই পণ্য ক্রয় করুন →",
    image: b.image,
    gradient: b.bgGradient || "from-[#004b23] to-[#143a2d]",
    offerProduct: b.offerProduct
  }));

  const defaultBanners = isBeauty ? beautyBanners : isElectronics ? electronicsBanners : isEducation ? educationBanners : isIslamic ? islamicBanners : isFashion ? fashionBanners : isGift ? giftBanners : isClothing ? clothingBanners : bannerSlides;
  const displayBanners = banners.length > 0 ? banners : (formattedManagedBanners.length > 0 ? formattedManagedBanners : defaultBanners);
  const displaySubCategories = isFood && foodSubcategories.length > 0 
    ? foodSubcategories 
    : (subCategories.length > 0 ? subCategories : (isBeauty ? beautyCategories : (isClothing || isGift || isFashion || isIslamic || isEducation || isElectronics) ? [] : foodCategories));

  const displayProducts = React.useMemo(() => {
    const activeProducts = products.filter(p => p.status !== "inactive");
    const matched = activeProducts.filter((p) => {
      if (p.categoryId === targetCatId) return true;
      if (isFood && (p.categoryId === "cat1" || p.categoryId === "food" || p.category === "খাদ্য বাজার")) return true;
      if (isBeauty && (p.categoryId === "cat2" || p.categoryId === "beauty" || p.category === "রূপসজ্জা বাজার")) return true;
      if (isClothing && (p.categoryId === "cat3" || p.categoryId === "clothing" || p.category === "কাপড় ও পরিধান")) return true;
      if (isGift && (p.categoryId === "cat4" || p.categoryId === "gift" || p.category === "উপহার বাজার")) return true;
      if (isFashion && (p.categoryId === "cat5" || p.categoryId === "fashion" || p.category === "ব্যাগ ও ফ্যাশন")) return true;
      if (isIslamic && (p.categoryId === "cat6" || p.categoryId === "islamic" || p.category === "ইসলামিক বাজার")) return true;
      if (isElectronics && (p.categoryId === "cat7" || p.categoryId === "electronics" || p.category === "ইলেকট্রনিক্স বাজার")) return true;
      if (isEducation && (p.categoryId === "cat8" || p.categoryId === "education" || p.category === "বই ও শিক্ষা বাজার")) return true;
      return false;
    });

    if (matched.length > 0) return matched;
    return ALL_INITIAL_PRODUCTS.filter(p => p.categoryId === targetCatId);
  }, [products, targetCatId, isFood, isBeauty, isClothing, isGift, isFashion, isIslamic, isElectronics, isEducation]);

  useEffect(() => {
    if (displayBanners.length > 0) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % displayBanners.length);
      }, 3000);
      return () => clearInterval(timer);
    }
  }, [displayBanners.length]);

  const renderToast = () => (
    <AnimatePresence>
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="fixed top-5 left-4 right-4 z-[999] max-w-md mx-auto bg-[#004b23] text-white px-4 py-3.5 rounded-2xl shadow-2xl flex items-center justify-between gap-3 border border-white/20"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center shrink-0">
              <Check className="w-4 h-4 text-white" />
            </div>
            <div className="text-xs font-bold leading-tight">
              <p className="font-black text-[#ffb703] text-[11px]">সফলভাবে কার্টে যোগ হয়েছে!</p>
              <p className="line-clamp-1">"{toastMessage}" কার্টে যুক্ত হয়েছে।</p>
            </div>
          </div>
          <Link
            to={isFood || categoryId === "cat1" ? "/food/buy" : "/cart"}
            className="bg-[#ffb703] text-black text-[11px] font-black px-3.5 py-1.5 rounded-xl shrink-0 active:scale-95 shadow-sm"
          >
            কার্ট দেখুন
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const filterList = (list: any[]) => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter((item: any) => {
      const name = (item.nameBn || item.name || item.title || "").toLowerCase();
      const author = (item.author || item.brand || "").toLowerCase();
      const weight = (item.weight || item.unit || "").toLowerCase();
      const subtitle = (item.subtitle || "").toLowerCase();
      return name.includes(q) || author.includes(q) || weight.includes(q) || subtitle.includes(q);
    });
  };

  const renderCategoryHeroBanner = (customAspect = "aspect-[26/9] sm:aspect-[4.5/1]") => {
    if (!displayBanners || displayBanners.length === 0) return null;
    return (
      <section className="px-4 py-2">
        <div 
          onClick={() => handleBannerClick(displayBanners[currentSlide])}
          className={`relative w-full ${customAspect} rounded-[20px] overflow-hidden shadow-md cursor-pointer group bg-gray-100 border border-black/5`}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="w-full h-full absolute inset-0"
            >
              <img 
                src={displayBanners[currentSlide]?.image} 
                alt="Banner" 
                className="w-full h-full object-cover object-center group-hover:scale-[1.02] transition-transform duration-500" 
              />
            </motion.div>
          </AnimatePresence>

          {displayBanners.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-black/25 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
              {displayBanners.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setCurrentSlide(idx);
                  }}
                  className={`transition-all duration-300 rounded-full ${
                    currentSlide === idx 
                      ? "w-4 h-1.5 bg-[#ffb703] shadow-xs" 
                      : "w-1.5 h-1.5 bg-white/60 hover:bg-white"
                  }`}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    );
  };

  const renderCategorySearchBar = (opts?: {
    placeholder?: string;
    inputBg?: string;
    textColor?: string;
    btnBg?: string;
    btnText?: string;
    borderColor?: string;
  }) => {
    const inputBg = opts?.inputBg || "bg-white";
    const textColor = opts?.textColor || "text-gray-800";
    const borderColor = opts?.borderColor || "border-gray-200";

    const getAnimCategory = (id?: string) => {
      if (!id) return "general";
      const c = id.toLowerCase();
      if (c.includes("food") || c.includes("cat1") || c.includes("grocery")) return "food";
      if (c.includes("beauty") || c.includes("cat2") || c.includes("grooming")) return "beauty";
      if (c.includes("cloth") || c.includes("cat3") || c.includes("apparel") || c.includes("bag") || c.includes("cat5")) return "clothing";
      if (c.includes("islam") || c.includes("cat6") || c.includes("religion")) return "islamic";
      if (c.includes("electro") || c.includes("cat7") || c.includes("gadget")) return "electronics";
      return "general";
    };

    const animCat = getAnimCategory(categoryId);

    return (
      <div className="px-4 pt-3 pb-2 relative z-30">
        <AnimatedSearchInput
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          category={animCat}
          onClear={() => setSearchQuery("")}
          inputClassName={`${inputBg} ${textColor} border ${borderColor} rounded-2xl py-3 pl-10 pr-10 text-xs font-bold shadow-xs focus:ring-2 focus:ring-[#004b23]/20`}
        />
        {searchQuery && (
          <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 mt-1.5 px-1">
            <span>"{searchQuery}" ফিল্টার করা হচ্ছে</span>
            <button onClick={() => setSearchQuery("")} className="text-red-500 hover:underline">
              ফিল্টার রিসেট
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderEmptySearch = (categoryName = "পণ্য") => (
    <div className="text-center py-10 bg-white rounded-3xl border border-gray-100 p-6 my-4 mx-4 shadow-sm">
      <Search className="w-10 h-10 text-gray-300 mx-auto mb-2" />
      <h3 className="text-xs font-black text-gray-800">কোনো {categoryName} পাওয়া যায়নি</h3>
      <p className="text-[11px] text-gray-400 mt-1">"{searchQuery}" এর সাথে মিলে এমন কোনো পণ্য তালিকায় নেই।</p>
      <button
        onClick={() => setSearchQuery("")}
        className="mt-3 text-xs font-bold text-[#004b23] bg-[#004b23]/10 px-3.5 py-1.5 rounded-xl active:scale-95 transition-transform"
      >
        সব {categoryName} দেখুন
      </button>
    </div>
  );

  if (isCategoryDisabled) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <SEO title="সেকশন বন্ধ - All MAYADIN FASHION" description="Category currently unavailable" />
        <div className="w-20 h-20 bg-rose-100 text-rose-700 rounded-3xl flex items-center justify-center mb-4 shadow-sm">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-black text-gray-900 mb-2">সেকশনটি সাময়িকভাবে বন্ধ আছে</h2>
        <p className="text-xs text-gray-500 max-w-sm font-medium mb-6 leading-relaxed">
          সম্মানিত গ্রাহক, '<b>{category?.title || category?.nameBn || "এই ক্যাটাগরি"}</b>' সেকশনটি বর্তমানে এডমিন কর্তৃক সাময়িকভাবে বন্ধ রাখা হয়েছে। শীঘ্রই পুনরায় চালু করা হবে।
        </p>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-3 bg-[#004b23] text-white font-bold text-xs rounded-2xl shadow-md hover:bg-[#00381a] active:scale-95 transition-transform flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>হোম পেইজে ফিরে যান</span>
        </button>
      </div>
    );
  }

  if (isElectronics) {
    const currentElectronics = filterList(displayProducts);

    return (
      <div className="bg-[#fcfdfc] min-h-screen -mx-4 -mt-4 pb-20 overflow-x-hidden font-sans relative">
        <SEO title="ইলেকট্রনিক গ্যাজেট বাজার" description="All Mayadin Bazar Electronics and Gadgets" />
        {renderToast()}
        
        {/* Header */}
        <header className="px-4 pt-6 pb-3 sticky top-0 bg-[#00040f] text-white z-50 flex items-center justify-between shadow-md">
           <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate(-1)} 
                className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center border border-white/20 active:scale-90 transition-transform shrink-0"
                title="ফিরে যান"
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <div className="flex items-center gap-2">
                <span className="text-[24px] text-[#3b82f6]">⚡</span>
                <h1 className="text-[18px] font-black tracking-tight leading-none">ইলেকট্রনিক গ্যাজেট বাজার</h1>
              </div>
           </div>
           <div className="flex items-center gap-2">
              <button onClick={() => navigate("/")} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                 <Heart className="w-5 h-5 text-gray-300" />
              </button>
              <button onClick={() => navigate("/cart")} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors relative">
                 <ShoppingCart className="w-5 h-5 text-gray-300" />
                 {totalItems > 0 && (
                   <span className="absolute -top-1 -right-1 bg-[#3b82f6] text-white text-[8px] font-black w-4.5 h-4.5 flex items-center justify-center rounded-full border border-[#00040f]">
                     {totalItems}
                   </span>
                 )}
              </button>
           </div>
        </header>

        {/* Category Search & Scanner Bar */}
        <div className="bg-[#00040f] pb-3 border-b border-gray-800">
          {renderCategorySearchBar({
            placeholder: "ইলেকট্রনিক গ্যাজেট বা ব্র্যান্ড সার্চ করুন...",
            inputBg: "bg-[#0b1120] text-white",
            borderColor: "border-gray-700",
            btnBg: "bg-[#3b82f6]",
            btnText: "text-white"
          })}
        </div>

        {searchQuery ? (
          <section className="px-4 py-4">
            <h3 className="text-gray-800 text-[13px] font-black tracking-wider uppercase mb-3 flex items-center gap-1.5">
              <span>⚡</span> সার্চ ফলাফল ({currentElectronics.length})
            </h3>
            {currentElectronics.length === 0 ? (
              renderEmptySearch("গ্যাজেট")
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {currentElectronics.map((product) => (
                  <div 
                    key={`search-${product.id}`} 
                    onClick={() => navigate(`/product/${product.id}`)}
                    className="bg-white rounded-[24px] border-2 border-[#e2e8f0] p-2.5 relative flex flex-col shadow-sm cursor-pointer hover:border-blue-500 transition-colors"
                  >
                    {product.discount && (
                      <div className={`absolute top-0 left-0 ${product.discountColor || 'bg-red-500'} px-3 py-1 rounded-br-[16px] rounded-tl-[20px] z-20`}>
                        <span className="text-white text-[10px] font-black">{product.discount}</span>
                      </div>
                    )}
                    <div className="bg-[#f8fafc] rounded-[16px] aspect-square relative overflow-hidden mb-3 p-2">
                      <img src={product.image} alt={product.nameBn} className="w-full h-full object-contain mix-blend-multiply" />
                    </div>
                    <div className="px-1 flex-1">
                      <h3 className="text-gray-900 text-[13px] font-black leading-tight mb-1 truncate">{product.nameBn}</h3>
                      <p className="text-gray-500 text-[10px] font-bold mb-1 truncate">ব্র্যান্ড: {product.author}</p>
                      <div className="flex items-center gap-1 mb-2">
                        <Star className="w-3.5 h-3.5 fill-[#fbbf24] text-[#fbbf24]" />
                        <span className="text-gray-600 text-[10px] font-bold">{product.rating || "4.8"} ({product.reviews || "12"})</span>
                      </div>
                      <div className="flex flex-col gap-2 mt-auto">
                        <div className="flex items-center justify-between">
                          <div className="text-gray-900 text-[15px] font-black">৳ {Number(product.price || 0).toLocaleString('bn-BD')}</div>
                          <button 
                            onClick={(e) => handleAddToCart(product, e)}
                            className="w-8 h-8 flex items-center justify-center bg-[#0f172a] text-white rounded-full hover:bg-blue-600 active:scale-90 transition-all shadow-sm"
                            title="কার্টে যোগ করুন"
                          >
                            <ShoppingCart className="w-4 h-4" />
                          </button>
                        </div>
                        <button 
                          onClick={(e) => handleBuyNow(product, e)}
                          className="w-full bg-[#3b82f6] text-white text-[11px] font-black py-2 rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-1 shadow-sm"
                        >
                          <Zap className="w-3.5 h-3.5 fill-white" /> কিনুন
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : (
          <>
            {/* Hero Banner - Clean image display */}
            {renderCategoryHeroBanner()}

            {/* Popular Products */}
            <section className="px-4 py-6">
               <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[18px] font-black text-gray-900 flex items-center gap-1.5">
                     <span className="text-[20px]">🔥</span> জনপ্রিয় পণ্য
                  </h2>
                  <span className="text-[12px] font-bold text-gray-600">
                     মোট {displayProducts.length}টি পণ্য
                  </span>
               </div>
               
               <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                  {displayProducts.slice(0, 6).map((product) => (
                     <div key={product.id} className="min-w-[160px] max-w-[160px] bg-white rounded-[24px] border-2 border-[#e2e8f0] p-2.5 relative flex flex-col">
                        {(product.discount || (product.discountPercent && Number(product.discountPercent) > 0)) && (
                           <div className="absolute top-0 left-0 bg-blue-600 px-3 py-1 rounded-br-[16px] rounded-tl-[20px] z-20">
                              <span className="text-white text-[10px] font-black">{product.discount || `${product.discountPercent}% OFF`}</span>
                           </div>
                        )}
                        <div className="bg-[#f8fafc] rounded-[16px] aspect-square relative overflow-hidden mb-3 p-2">
                           <img src={product.image || (product.images && product.images[0])} alt={product.nameBn || product.name} className="w-full h-full object-contain mix-blend-multiply" />
                        </div>
                        <div className="px-1 flex-1">
                           <h3 className="text-gray-900 text-[13px] font-black leading-tight mb-0.5 truncate">{product.nameBn || product.name}</h3>
                           <p className="text-gray-500 text-[10px] font-bold mb-1.5 truncate">ব্র্যান্ড: {product.author || product.brand || "গ্যাজেট"}</p>
                           <div className="flex items-center gap-1 mb-2">
                              <Star className="w-3.5 h-3.5 fill-[#fbbf24] text-[#fbbf24]" />
                              <span className="text-gray-600 text-[10px] font-bold">{product.rating || "4.8"} ({product.reviews || "10"})</span>
                           </div>
                           <div className="flex flex-col gap-2 mt-auto">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="text-gray-900 text-[15px] font-black">৳ {Number(product.discountPrice || product.price).toLocaleString('bn-BD')}</div>
                                  {product.discountPrice && product.discountPrice < product.price && (
                                    <div className="text-gray-400 text-[11px] font-bold line-through">৳ {Number(product.price).toLocaleString('bn-BD')}</div>
                                  )}
                                </div>
                                <button 
                                   onClick={(e) => handleAddToCart(product, e)}
                                   className="w-8 h-8 flex items-center justify-center bg-[#0f172a] text-white rounded-full hover:bg-blue-600 active:scale-90 transition-all shadow-sm shrink-0"
                                   title="কার্টে যোগ করুন"
                                >
                                   <ShoppingCart className="w-4 h-4" />
                                </button>
                              </div>
                              <button 
                                onClick={(e) => handleBuyNow(product, e)}
                                className="w-full bg-[#3b82f6] text-white text-[11px] font-black py-2 rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-1 shadow-sm mt-0.5"
                              >
                                <Zap className="w-3.5 h-3.5 fill-white" /> কিনুন
                              </button>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </section>

            {/* Featured Gadget Section */}
            <section className="px-4 py-2">
               <h3 className="text-gray-800 text-[13px] font-black tracking-wider uppercase mb-3 flex items-center gap-1.5">
                 <span className="text-[16px]">💡</span> FEATURED GADGET
               </h3>
               <div className="bg-[#f4f4f4] rounded-[24px] p-5 flex relative overflow-hidden h-[160px] shadow-sm">
                  <div className="flex flex-col justify-center w-[60%] relative z-10 text-gray-900">
                     <h2 className="text-[18px] font-black leading-[1.2] flex items-center gap-1.5 mb-2 text-[#0f172a]">
                        স্মার্ট জীবনের<br/>ছোট ছোট সমাধান
                     </h2>
                     <p className="text-gray-700 text-[11px] font-bold leading-[1.4] mb-3">
                        প্রিমিয়াম গ্যাজেট সেরা অফারে
                     </p>
                     <button className="bg-black text-white px-4 py-2 rounded-[20px] text-[10px] font-black w-fit tracking-wide shadow-md flex items-center gap-1">
                       অফার দেখুন <ChevronRight className="w-3 h-3" />
                     </button>
                  </div>
                  <div className="absolute right-[-5%] top-[-10%] h-[120%] w-[50%] flex items-center py-2">
                     <img src="https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=400&q=80" alt="Featured Electronics" className="w-full h-full object-contain drop-shadow-xl" />
                  </div>
               </div>
            </section>

            {/* Offer Section */}
            <section className="px-4 py-6">
               <div className="bg-[#0b1120] rounded-[24px] p-5 flex relative overflow-hidden h-[140px] shadow-md border border-gray-800">
                  <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
                  <div className="flex flex-col justify-center w-[100%] relative z-10 text-white">
                     <h2 className="text-[16px] font-black leading-[1.2] flex items-center gap-1.5 mb-2 text-[#93c5fd]">
                        <span className="text-[18px]">🏷️</span> আজকের গ্যাজেট অফার
                     </h2>
                     <p className="text-[#e2e8f0] text-[11px] font-bold leading-[1.4] mb-3">
                        ২৫% ছাড়! ব্লুটুথ স্পিকার সেট<br/>শিক্ষার জন্য। প্রিমিয়াম স্টাইলে ২০% ছাড়।
                     </p>
                     <button className="bg-[#93c5fd] text-[#0f172a] px-4 py-2 rounded-[20px] text-[10px] font-black w-fit tracking-wide shadow-md flex items-center gap-1">
                       অফার দেখুন <ChevronRight className="w-3 h-3" />
                     </button>
                  </div>
               </div>
            </section>

            {/* All Products */}
            <section className="px-4 py-2">
               <h3 className="text-gray-800 text-[13px] font-black tracking-wider uppercase mb-3 flex items-center gap-1.5">
                 <span className="text-[16px]">✨</span> ALL GADGETS ({displayProducts.length})
               </h3>
               <div className="grid grid-cols-2 gap-4">
                  {displayProducts.map((product) => (
                     <div key={`all-${product.id}`} className="bg-white rounded-[24px] border-2 border-[#e2e8f0] p-2.5 relative flex flex-col">
                        {(product.discount || (product.discountPercent && Number(product.discountPercent) > 0)) && (
                           <div className="absolute top-0 left-0 bg-blue-600 px-3 py-1 rounded-br-[16px] rounded-tl-[20px] z-20">
                              <span className="text-white text-[10px] font-black">{product.discount || `${product.discountPercent}% OFF`}</span>
                           </div>
                        )}
                        <div className="bg-[#f8fafc] rounded-[16px] aspect-square relative overflow-hidden mb-3 p-2">
                           <img src={product.image || (product.images && product.images[0])} alt={product.nameBn || product.name} className="w-full h-full object-contain mix-blend-multiply" />
                        </div>
                        <div className="px-1 flex-1">
                           <h3 className="text-gray-900 text-[13px] font-black leading-tight mb-1 truncate">{product.nameBn || product.name}</h3>
                           <p className="text-gray-500 text-[10px] font-bold mb-1 truncate">{product.author || product.brand || "গ্যাজেট"}</p>
                           <div className="flex items-center gap-1 mb-1.5">
                              <Star className="w-3.5 h-3.5 fill-[#fbbf24] text-[#fbbf24]" />
                              <span className="text-gray-600 text-[10px] font-bold">{product.rating || "4.8"} ({product.reviews || "10"})</span>
                           </div>
                           <div className="flex flex-col gap-2 mt-auto">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="text-gray-900 text-[15px] font-black">৳ {Number(product.discountPrice || product.price).toLocaleString('bn-BD')}</div>
                                  {product.discountPrice && product.discountPrice < product.price && (
                                    <div className="text-gray-400 text-[11px] font-bold line-through">৳ {Number(product.price).toLocaleString('bn-BD')}</div>
                                  )}
                                </div>
                                <button 
                                   onClick={(e) => handleAddToCart(product, e)}
                                   className="w-8 h-8 flex items-center justify-center bg-[#0f172a] text-white rounded-full hover:bg-blue-600 active:scale-90 transition-all shadow-sm shrink-0"
                                   title="কার্টে যোগ করুন"
                                >
                                   <ShoppingCart className="w-4 h-4" />
                                </button>
                              </div>
                              <button 
                                onClick={(e) => handleBuyNow(product, e)}
                                className="w-full bg-[#3b82f6] text-white text-[11px] font-black py-2 rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-1 shadow-sm mt-0.5"
                              >
                                <Zap className="w-3.5 h-3.5 fill-white" /> কিনুন
                              </button>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </section>
          </>
        )}

      </div>
    );
  }

  if (isEducation) {
    const currentEducation = filterList(displayProducts);

    return (
      <div className="bg-[#fcfdfc] min-h-screen -mx-4 -mt-4 pb-20 overflow-x-hidden font-sans relative">
        <SEO title="বই ও শিক্ষা বাজার" description="All Mayadin Bazar Books and Education Products" />
        {renderToast()}
        
        {/* Header */}
        <header className="px-4 pt-6 pb-3 sticky top-0 bg-[#0f172a] text-[#cca25f] z-50 flex items-center justify-between shadow-md">
           <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate(-1)} 
                className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center border border-white/20 active:scale-90 transition-transform shrink-0"
                title="ফিরে যান"
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5 text-[#cca25f]" />
              </button>
              <div className="flex items-center gap-2">
                <span className="text-[24px]">📚</span>
                <h1 className="text-[18px] font-black tracking-tight text-white leading-none">বই ও শিক্ষা বাজার</h1>
              </div>
           </div>
           <div className="flex items-center gap-2">
              <button onClick={() => navigate("/")} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                 <Heart className="w-5 h-5 text-[#cca25f]" />
              </button>
              <button onClick={() => navigate("/cart")} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors relative">
                 <ShoppingCart className="w-5 h-5 text-[#cca25f]" />
                 {totalItems > 0 && (
                   <span className="absolute -top-1 -right-1 bg-[#cca25f] text-[#0f172a] text-[8px] font-black w-4.5 h-4.5 flex items-center justify-center rounded-full border border-[#0f172a]">
                     {totalItems}
                   </span>
                 )}
              </button>
           </div>
        </header>

        {/* Category Search & Scanner Bar */}
        <div className="bg-[#0f172a] pb-3 border-b border-gray-800">
          {renderCategorySearchBar({
            placeholder: "বইয়ের নাম বা লেখকের নাম সার্চ করুন...",
            inputBg: "bg-[#1e293b] text-white",
            borderColor: "border-[#cca25f]/30",
            btnBg: "bg-[#cca25f]",
            btnText: "text-[#0f172a]"
          })}
        </div>

        {searchQuery ? (
          <section className="px-4 py-4">
            <h3 className="text-gray-800 text-[13px] font-black tracking-wider uppercase mb-3 flex items-center gap-1.5">
              <span>📚</span> সার্চ ফলাফল ({currentEducation.length})
            </h3>
            {currentEducation.length === 0 ? (
              renderEmptySearch("বই ও শিক্ষা সামগ্রী")
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {currentEducation.map((product) => (
                  <div key={`search-${product.id}`} className="bg-white rounded-[24px] border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-2.5 relative flex flex-col">
                    {(product.discount || (product.discountPercent && Number(product.discountPercent) > 0)) && (
                      <div className="absolute top-2 left-2 bg-[#cca25f] text-[#0f172a] text-[9px] font-black px-2 py-0.5 rounded-[6px] z-20">
                        {product.discount || `${product.discountPercent}% OFF`}
                      </div>
                    )}
                    <div className="bg-[#f5f5f5] rounded-[20px] aspect-[4/5] relative overflow-hidden mb-3">
                      <img src={product.image || (product.images && product.images[0])} alt={product.nameBn || product.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="px-1 flex-1">
                      <h3 className="text-gray-900 text-[13px] font-black leading-tight mb-1 truncate">{product.nameBn || product.name}</h3>
                      <p className="text-gray-500 text-[10px] font-bold mb-1.5 truncate">লেখক: {product.author || product.brand || "লেখক"}</p>
                      <div className="flex items-center gap-1 mb-1.5">
                        <Star className="w-3.5 h-3.5 fill-[#cca25f] text-[#cca25f]" />
                        <span className="text-gray-600 text-[10px] font-bold">{product.rating || "4.9"} ({product.reviews || "15"})</span>
                      </div>
                      <div className="flex flex-col gap-2 mt-auto">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-gray-900 text-[15px] font-black">৳ {Number(product.discountPrice || product.price).toLocaleString('bn-BD')}</div>
                            {product.discountPrice && product.discountPrice < product.price && (
                              <div className="text-gray-400 text-[11px] font-bold line-through">৳ {Number(product.price).toLocaleString('bn-BD')}</div>
                            )}
                          </div>
                          <button 
                            onClick={(e) => handleAddToCart(product, e)}
                            className="w-8 h-8 flex items-center justify-center bg-[#0f172a] text-[#cca25f] rounded-full shadow-md active:scale-90 transition-transform"
                            title="কার্টে যোগ করুন"
                          >
                            <ShoppingCart className="w-4 h-4" />
                          </button>
                        </div>
                        <button 
                          onClick={(e) => handleBuyNow(product, e)}
                          className="w-full bg-[#cca25f] text-[#0f172a] text-[11px] font-black py-2 rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-1 shadow-sm"
                        >
                          <Zap className="w-3.5 h-3.5 fill-[#0f172a]" /> কিনুন
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : (
          <>
            {/* Hero Banner - Clean image display */}
            {renderCategoryHeroBanner()}

            {/* Popular Products */}
            <section className="px-4 py-6">
               <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[18px] font-black text-gray-900 flex items-center gap-1.5">
                     <span className="text-[20px]">🔥</span> জনপ্রিয় বই ও সামগ্রী
                  </h2>
                  <span className="text-[12px] font-bold text-gray-600">
                     মোট {displayProducts.length}টি পণ্য
                  </span>
               </div>
               
               <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                  {displayProducts.slice(0, 6).map((product) => (
                     <div key={product.id} className="min-w-[160px] max-w-[160px] bg-white rounded-[24px] border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-2 relative flex flex-col pt-[30%]">
                        <div className="absolute top-0 left-0 right-0 h-[45%] bg-[#0f172a] rounded-t-[24px]"></div>
                        {(product.discount || (product.discountPercent && Number(product.discountPercent) > 0)) && (
                           <div className="absolute top-2 left-2 bg-[#cca25f] text-[#0f172a] text-[9px] font-black px-2 py-0.5 rounded-[6px] z-20">
                              {product.discount || `${product.discountPercent}% OFF`}
                           </div>
                        )}
                        <div className="bg-transparent rounded-[8px] aspect-[3/4] relative z-10 w-[70%] mx-auto shadow-md mb-2 overflow-hidden">
                           <img src={product.image || (product.images && product.images[0])} alt={product.nameBn || product.name} className="w-full h-full object-cover rounded-[8px]" />
                        </div>
                        <div className="px-2 pb-2 flex-1 relative z-10">
                           <h3 className="text-gray-900 text-[13px] font-black leading-tight mb-0.5 truncate">{product.nameBn || product.name}</h3>
                           <p className="text-gray-500 text-[10px] font-bold mb-1.5 truncate">লেখক: {product.author || product.brand || "লেখক"}</p>
                           <div className="flex items-center gap-1 mb-2">
                              <Star className="w-3 h-3 fill-[#cca25f] text-[#cca25f]" />
                              <span className="text-gray-600 text-[10px] font-bold">{product.rating || "4.9"} ({product.reviews || "15"})</span>
                           </div>
                           <div className="flex flex-col gap-2 mt-2">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="text-gray-900 text-[14px] font-black">৳ {Number(product.discountPrice || product.price).toLocaleString('bn-BD')}</div>
                                  {product.discountPrice && product.discountPrice < product.price && (
                                    <div className="text-gray-400 text-[10px] font-bold line-through">৳ {Number(product.price).toLocaleString('bn-BD')}</div>
                                  )}
                                </div>
                                <button 
                                   onClick={(e) => handleAddToCart(product, e)}
                                   className="w-7 h-7 flex items-center justify-center bg-[#0f172a] text-[#cca25f] rounded-full shadow-md active:scale-90 transition-transform"
                                   title="কার্টে যোগ করুন"
                                >
                                   <ShoppingCart className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <button 
                                onClick={(e) => handleBuyNow(product, e)}
                                className="w-full bg-[#cca25f] text-[#0f172a] text-[10px] font-black py-1.5 rounded-lg active:scale-95 transition-transform flex items-center justify-center gap-1 shadow-sm"
                              >
                                <Zap className="w-3 h-3 fill-[#0f172a]" /> কিনুন
                              </button>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </section>

            {/* Featured Knowledge Section */}
            <section className="px-4 py-2">
               <h3 className="text-gray-800 text-[13px] font-black tracking-wider uppercase mb-3 flex items-center gap-1.5">
                 <span className="text-[16px]">✨</span> FEATURED KNOWLEDGE SECTION
               </h3>
               <div className="bg-[#f5f1ea] rounded-[24px] p-5 flex relative overflow-hidden h-[160px] shadow-sm">
                  <div className="flex flex-col justify-center w-[60%] relative z-10 text-gray-900">
                     <h2 className="text-[18px] font-black leading-[1.2] flex items-center gap-1.5 mb-2 text-[#0f172a]">
                        “শেখার যাত্রা<br/>শুরু হোক আজ”
                     </h2>
                     <p className="text-gray-700 text-[11px] font-bold leading-[1.4] mb-3">
                        আপনার জ্ঞানের নতুন সংযোজন
                     </p>
                     <button className="bg-[#0f172a] text-[#cca25f] px-4 py-2 rounded-[20px] text-[10px] font-black w-fit tracking-wide shadow-md flex items-center gap-1">
                       অফার দেখুন <ChevronRight className="w-3 h-3" />
                     </button>
                  </div>
                  <div className="absolute right-[-10%] top-[-10%] h-[120%] w-[55%] flex items-center py-2">
                     <img src="https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&q=80" alt="Featured Education" className="w-full h-full object-cover drop-shadow-xl rounded-l-full" />
                  </div>
               </div>
            </section>

            {/* Offer Section */}
            <section className="px-4 py-6">
               <div className="bg-[#0f172a] rounded-[24px] p-5 flex relative overflow-hidden h-[140px] shadow-sm border-t-2 border-b-2 border-dashed border-[#cca25f]">
                  <div className="flex flex-col justify-center w-[100%] relative z-10 text-white">
                     <h2 className="text-[16px] font-black leading-[1.2] flex items-center gap-1.5 mb-2 text-[#cca25f]">
                        <span className="text-[18px]">🏷️</span> শিক্ষার জন্য বিশেষ অফার
                     </h2>
                     <p className="text-[#e2e8f0] text-[10px] font-bold leading-[1.4] mb-3">
                        শিক্ষার উৎকর্ষ সাধনে আমাদের বিশেষ অফার। প্রিমিয়াম শিক্ষা সামগ্রীতে বিশেষ ছাড়।
                     </p>
                     <button className="bg-[#cca25f] text-[#0f172a] px-4 py-2 rounded-[20px] text-[10px] font-black w-fit tracking-wide shadow-md flex items-center gap-1">
                       অফার দেখুন <ChevronRight className="w-3 h-3" />
                     </button>
                  </div>
               </div>
            </section>

            {/* All Products */}
            <section className="px-4 py-2">
               <h3 className="text-gray-800 text-[13px] font-black tracking-wider uppercase mb-3 flex items-center gap-1.5">
                 <span className="text-[16px]">✨</span> সব বই ও সামগ্রী ({displayProducts.length})
               </h3>
               <div className="grid grid-cols-2 gap-4">
                  {displayProducts.map((product) => (
                     <div key={`all-${product.id}`} className="bg-white rounded-[24px] border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-2.5 relative flex flex-col">
                        {(product.discount || (product.discountPercent && Number(product.discountPercent) > 0)) && (
                           <div className="absolute top-2 left-2 bg-[#cca25f] text-[#0f172a] text-[9px] font-black px-2 py-0.5 rounded-[6px] z-20">
                              {product.discount || `${product.discountPercent}% OFF`}
                           </div>
                        )}
                        <div className="bg-[#f5f5f5] rounded-[20px] aspect-[4/5] relative overflow-hidden mb-3">
                           <img src={product.image || (product.images && product.images[0])} alt={product.nameBn || product.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="px-1 flex-1">
                           <h3 className="text-gray-900 text-[13px] font-black leading-tight mb-1 truncate">{product.nameBn || product.name}</h3>
                           <p className="text-gray-500 text-[10px] font-bold mb-1.5 truncate">লেখক: {product.author || product.brand || "লেখক"}</p>
                           <div className="flex items-center gap-1 mb-1.5">
                              <Star className="w-3.5 h-3.5 fill-[#cca25f] text-[#cca25f]" />
                              <span className="text-gray-600 text-[10px] font-bold">{product.rating || "4.9"} ({product.reviews || "15"})</span>
                           </div>
                           <div className="flex flex-col gap-2 mt-auto">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="text-gray-900 text-[15px] font-black">৳ {Number(product.discountPrice || product.price).toLocaleString('bn-BD')}</div>
                                  {product.discountPrice && product.discountPrice < product.price && (
                                    <div className="text-gray-400 text-[11px] font-bold line-through">৳ {Number(product.price).toLocaleString('bn-BD')}</div>
                                  )}
                                </div>
                                <button 
                                   onClick={(e) => handleAddToCart(product, e)}
                                   className="w-8 h-8 flex items-center justify-center bg-[#0f172a] text-[#cca25f] rounded-full shadow-md active:scale-90 transition-transform"
                                   title="কার্টে যোগ করুন"
                                >
                                   <ShoppingCart className="w-4 h-4" />
                                </button>
                              </div>
                              <button 
                                onClick={(e) => handleBuyNow(product, e)}
                                className="w-full bg-[#cca25f] text-[#0f172a] text-[11px] font-black py-2 rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-1 shadow-sm"
                              >
                                <Zap className="w-3.5 h-3.5 fill-[#0f172a]" /> কিনুন
                              </button>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </section>
          </>
        )}

      </div>
    );
  }

  if (isIslamic) {
    const currentIslamic = filterList(displayProducts);

    return (
      <div className="bg-[#fcfdfc] min-h-screen -mx-4 -mt-4 pb-20 overflow-x-hidden font-sans relative">
        <SEO title="ইসলামিক বাজার" description="All Mayadin Bazar Islamic Products" />
        {renderToast()}
        
        {/* Header */}
        <header className="px-4 pt-6 pb-3 sticky top-0 bg-white/95 backdrop-blur-md z-50 flex items-center justify-between border-b border-gray-100 shadow-sm">
           <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate(-1)} 
                className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center border border-gray-200 active:scale-90 transition-transform shrink-0"
                title="ফিরে যান"
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5 text-gray-800" />
              </button>
              <div className="flex items-center gap-2">
                <span className="text-[24px]">🕌</span>
                <h1 className="text-gray-900 text-[18px] font-black tracking-tight leading-none">ইসলামিক বাজার</h1>
              </div>
           </div>
           <div className="flex items-center gap-2">
              <button onClick={() => navigate("/")} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                 <Heart className="w-5 h-5 text-gray-800" />
              </button>
              <button onClick={() => navigate("/cart")} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors relative">
                 <ShoppingCart className="w-5 h-5 text-gray-800" />
                 {totalItems > 0 && (
                   <span className="absolute -top-1 -right-1 bg-[#004b23] text-white text-[8px] font-black w-4.5 h-4.5 flex items-center justify-center rounded-full border border-white">
                     {totalItems}
                   </span>
                 )}
              </button>
           </div>
        </header>

        {/* Category Search & Scanner Bar */}
        <div className="bg-white pb-3 border-b border-gray-100">
          {renderCategorySearchBar({
            placeholder: "ইসলামিক বই, আতর, জায়নামাজ ইত্যাদি সার্চ করুন...",
            inputBg: "bg-gray-50 text-gray-900",
            borderColor: "border-gray-200",
            btnBg: "bg-[#004b23]",
            btnText: "text-white"
          })}
        </div>

        {searchQuery ? (
          <section className="px-4 py-4">
            <h3 className="text-gray-800 text-[13px] font-black tracking-wider uppercase mb-3 flex items-center gap-1.5">
              <span>🕌</span> সার্চ ফলাফল ({currentIslamic.length})
            </h3>
            {currentIslamic.length === 0 ? (
              renderEmptySearch("ইসলামিক পণ্য")
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {currentIslamic.map((product) => (
                  <div key={`search-${product.id}`} className="bg-white rounded-[24px] border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-2.5 relative flex flex-col">
                    {(product.discount || (product.discountPercent && Number(product.discountPercent) > 0)) && (
                      <div className="absolute top-2 right-2 bg-[#bda87a]/90 backdrop-blur-sm px-2 py-1 rounded-[8px] z-20">
                        <span className="text-white text-[9px] font-black leading-tight block text-center whitespace-pre-line">
                          {product.discount || `${product.discountPercent}% OFF`}
                        </span>
                      </div>
                    )}
                    <div className="bg-[#f5f5f5] rounded-[20px] aspect-[4/5] relative overflow-hidden mb-3">
                      <img src={product.image || (product.images && product.images[0])} alt={product.nameBn || product.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="px-1 flex-1">
                      <h3 className="text-gray-900 text-[13px] font-black leading-tight mb-1 truncate">{product.nameBn || product.name}</h3>
                      <div className="flex items-center gap-1 mb-1.5">
                        <Star className="w-3.5 h-3.5 fill-[#ffb703] text-[#ffb703]" />
                        <span className="text-gray-600 text-[10px] font-bold">{product.rating || "4.9"} ({product.reviews || "20"})</span>
                      </div>
                      <div className="flex flex-col gap-2 mt-auto">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-gray-900 text-[15px] font-black">৳ {Number(product.discountPrice || product.price).toLocaleString('bn-BD')}</div>
                            {product.discountPrice && product.discountPrice < product.price && (
                              <div className="text-gray-400 text-[11px] font-bold line-through">৳ {Number(product.price).toLocaleString('bn-BD')}</div>
                            )}
                          </div>
                          <button 
                            onClick={(e) => handleAddToCart(product, e)}
                            className="w-8 h-8 flex items-center justify-center bg-[#004b23] text-white rounded-full shadow-md active:scale-90 transition-transform"
                            title="কার্টে যোগ করুন"
                          >
                            <ShoppingCart className="w-4 h-4" />
                          </button>
                        </div>
                        <button 
                          onClick={(e) => handleBuyNow(product, e)}
                          className="w-full bg-[#bda87a] text-white text-[11px] font-black py-2 rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-1 shadow-sm"
                        >
                          <Zap className="w-3.5 h-3.5 fill-white" /> কিনুন
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : (
          <>
            {/* Hero Banner - Clean image display */}
            {renderCategoryHeroBanner()}

            {/* Popular Products */}
            <section className="px-4 py-6">
               <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[18px] font-black text-gray-900 flex items-center gap-1.5">
                     <span className="text-[20px]">🔥</span> জনপ্রিয় পণ্য
                  </h2>
                  <span className="text-[12px] font-bold text-gray-600">
                     মোট {displayProducts.length}টি পণ্য
                  </span>
               </div>
               
               <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                  {displayProducts.slice(0, 6).map((product) => (
                     <div key={product.id} className="min-w-[160px] max-w-[160px] bg-white rounded-[24px] border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-2.5 relative flex flex-col">
                        {(product.discount || (product.discountPercent && Number(product.discountPercent) > 0)) && (
                           <div className="absolute top-2 right-2 bg-[#bda87a]/90 backdrop-blur-sm px-2 py-1 rounded-[8px] z-20">
                              <span className="text-white text-[9px] font-black leading-tight block text-center whitespace-pre-line">
                                {product.discount || `${product.discountPercent}% OFF`}
                              </span>
                           </div>
                        )}
                        <div className="bg-[#f5f5f5] rounded-[20px] aspect-[4/5] relative overflow-hidden mb-3">
                           <img src={product.image || (product.images && product.images[0])} alt={product.nameBn || product.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="px-1 flex-1">
                           <h3 className="text-gray-900 text-[13px] font-black leading-tight mb-1 truncate">{product.nameBn || product.name}</h3>
                           <div className="flex items-center gap-1 mb-1.5">
                              <Star className="w-3.5 h-3.5 fill-[#ffb703] text-[#ffb703]" />
                              <span className="text-gray-600 text-[10px] font-bold">{product.rating || "4.9"} ({product.reviews || "20"})</span>
                           </div>
                           <div className="flex flex-col gap-2 mt-auto">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="text-gray-900 text-[15px] font-black">৳ {Number(product.discountPrice || product.price).toLocaleString('bn-BD')}</div>
                                  {product.discountPrice && product.discountPrice < product.price && (
                                    <div className="text-gray-400 text-[11px] font-bold line-through">৳ {Number(product.price).toLocaleString('bn-BD')}</div>
                                  )}
                                </div>
                                <button 
                                   onClick={(e) => handleAddToCart(product, e)}
                                   className="w-8 h-8 flex items-center justify-center bg-[#004b23] text-[#efead8] rounded-full shadow-md active:scale-90 transition-transform"
                                   title="কার্টে যোগ করুন"
                                >
                                   <ShoppingCart className="w-4 h-4" />
                                </button>
                              </div>
                              <button 
                                onClick={(e) => handleBuyNow(product, e)}
                                className="w-full bg-[#bda87a] text-white text-[11px] font-black py-2 rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-1 shadow-sm"
                              >
                                <Zap className="w-3.5 h-3.5 fill-white" /> কিনুন
                              </button>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </section>

            {/* Featured Islamic Collection */}
            <section className="px-4 py-2">
               <h3 className="text-gray-800 text-[13px] font-black tracking-wider uppercase mb-3 flex items-center gap-1.5">
                 <span className="text-[16px]">✨</span> FEATURED ISLAMIC COLLECTION
               </h3>
               <div className="bg-[#f0ece1] rounded-[24px] p-5 flex relative overflow-hidden h-[160px] shadow-sm">
                  <div className="flex flex-col justify-center w-[55%] relative z-10 text-gray-900">
                     <h2 className="text-[16px] font-black leading-[1.2] flex items-center gap-1.5 mb-2 text-[#004b23]">
                        <span className="text-[18px]">🕌</span> আতর টুপি ও<br/>লাইফস্টাইল
                     </h2>
                     <p className="text-gray-700 text-[11px] font-bold leading-[1.4] mb-3">
                        আপনার স্টাইলের নতুন সংযোজন
                     </p>
                     <button className="bg-[#004b23] text-white px-4 py-2 rounded-[20px] text-[10px] font-black w-fit tracking-wide shadow-md">
                       লাইফস্টাইল পণ্য
                     </button>
                  </div>
                  <div className="absolute right-[-5%] top-[-10%] h-[120%] w-[55%] flex items-center py-2">
                     <img src="https://images.unsplash.com/photo-1596766436923-b6d4cb800888?w=400&q=80" alt="Featured Islamic" className="w-full h-full object-contain drop-shadow-xl" />
                  </div>
               </div>
            </section>

            {/* Offer Section */}
            <section className="px-4 py-6">
               <div className="border border-dashed border-[#a4a4a4] rounded-[24px] bg-white p-5 flex relative overflow-hidden h-[140px] shadow-sm">
                  <div className="flex flex-col justify-center w-[60%] relative z-10 text-gray-900">
                     <h2 className="text-[16px] font-black leading-[1.2] flex items-center gap-1.5 mb-2 text-[#004b23]">
                        <span className="text-[18px]">🏷️</span> বিশেষ অফার
                     </h2>
                     <p className="text-gray-700 text-[10px] font-bold leading-[1.3] mb-3">
                        ইসলামিক পণ্যে বিশেষ অফার<br/>প্রিমিয়াম ইসলামিক সামগ্রীতে বিশেষ ছাড়
                     </p>
                     <button className="bg-[#004b23] text-white px-4 py-2 rounded-[20px] text-[10px] font-black w-fit tracking-wide shadow-md flex items-center gap-1">
                       অফার দেখুন <ChevronRight className="w-3 h-3" />
                     </button>
                  </div>
                  <div className="absolute right-[-5%] bottom-[-10%] h-[120%] w-[50%] flex items-end justify-end">
                     <img src="https://images.unsplash.com/photo-1579998188289-53b0e145efab?w=400&q=80" alt="Offer Islamic" className="w-full h-[90%] object-contain drop-shadow-2xl" />
                  </div>
               </div>
            </section>

            {/* All Products */}
            <section className="px-4 py-2">
               <h3 className="text-gray-800 text-[13px] font-black tracking-wider uppercase mb-3 flex items-center gap-1.5">
                 <span className="text-[16px]">✨</span> সব পণ্য ({displayProducts.length})
               </h3>
               <div className="grid grid-cols-2 gap-4">
                  {displayProducts.map((product) => (
                     <div key={`all-${product.id}`} className="bg-white rounded-[24px] border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-2.5 relative flex flex-col">
                        {(product.discount || (product.discountPercent && Number(product.discountPercent) > 0)) && (
                           <div className="absolute top-2 right-2 bg-[#bda87a]/90 backdrop-blur-sm px-2 py-1 rounded-[8px] z-20">
                              <span className="text-white text-[9px] font-black leading-tight block text-center whitespace-pre-line">
                                {product.discount || `${product.discountPercent}% OFF`}
                              </span>
                           </div>
                        )}
                        <div className="bg-[#f5f5f5] rounded-[20px] aspect-[4/5] relative overflow-hidden mb-3">
                           <img src={product.image || (product.images && product.images[0])} alt={product.nameBn || product.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="px-1 flex-1">
                           <h3 className="text-gray-900 text-[13px] font-black leading-tight mb-1 truncate">{product.nameBn || product.name}</h3>
                           <div className="flex items-center gap-1 mb-1.5">
                              <Star className="w-3.5 h-3.5 fill-[#ffb703] text-[#ffb703]" />
                              <span className="text-gray-600 text-[10px] font-bold">{product.rating || "4.9"} ({product.reviews || "20"})</span>
                           </div>
                           <div className="flex items-center justify-between mb-2">
                             <div>
                               <div className="text-gray-900 text-[15px] font-black">৳ {Number(product.discountPrice || product.price).toLocaleString('bn-BD')}</div>
                               {product.discountPrice && product.discountPrice < product.price && (
                                 <div className="text-gray-400 text-[11px] font-bold line-through">৳ {Number(product.price).toLocaleString('bn-BD')}</div>
                               )}
                             </div>
                           </div>
                           <div className="flex gap-2">
                              <button 
                                 onClick={(e) => handleAddToCart(product, e)}
                                 className="flex-1 bg-[#004b23] text-white py-2.5 rounded-[14px] text-[10px] font-black flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-transform"
                                 title="কার্টে যোগ করুন"
                              >
                                 <ShoppingCart className="w-3.5 h-3.5" /> কার্টে যোগ করুন
                              </button>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </section>
          </>
        )}

      </div>
    );
  }

  if (isFashion) {
    const currentFashion = filterList(displayProducts);

    return (
      <div className="bg-[#5c5643] min-h-screen -mx-4 -mt-4 pb-20 overflow-x-hidden font-sans relative">
        <SEO title="ব্যাগ ও ফ্যাশন বাজার" description="All Mayadin Bazar Bags & Fashion" />
        {renderToast()}
        
        {/* Header */}
        <header className="px-4 pt-6 pb-3 sticky top-0 bg-[#484334] text-[#efead8] z-50 flex items-center justify-between border-b border-white/10 shadow-sm">
           <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate(-1)} 
                className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center border border-white/20 active:scale-90 transition-transform shrink-0"
                title="ফিরে যান"
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5 text-[#efead8]" />
              </button>
              <div className="flex items-center gap-2">
                <span className="text-[24px]">👜</span>
                <h1 className="text-[#efead8] text-[18px] font-black tracking-tight leading-none">ব্যাগ ও ফ্যাশন বাজার</h1>
              </div>
           </div>
           <div className="flex items-center gap-2">
              <button onClick={() => navigate("/")} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                 <Heart className="w-5 h-5 text-[#efead8]" />
              </button>
              <button onClick={() => navigate("/cart")} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors relative">
                 <ShoppingCart className="w-5 h-5 text-[#efead8]" />
                 {totalItems > 0 && (
                   <span className="absolute -top-1 -right-1 bg-black text-[#efead8] text-[8px] font-black w-4.5 h-4.5 flex items-center justify-center rounded-full border border-white">
                     {totalItems}
                   </span>
                 )}
              </button>
           </div>
        </header>

        {/* Category Search & Scanner Bar */}
        <div className="bg-[#484334] pb-3 border-b border-white/10">
          {renderCategorySearchBar({
            placeholder: "লেডিস ব্যাগ, ব্যাকপ্যাক বা ফ্যাশন পণ্য সার্চ করুন...",
            inputBg: "bg-[#383428] text-[#efead8]",
            borderColor: "border-white/20",
            btnBg: "bg-[#efead8]",
            btnText: "text-[#484334]"
          })}
        </div>

        {searchQuery ? (
          <section className="px-4 py-4">
            <h3 className="text-[#efead8] text-[13px] font-black tracking-wider uppercase mb-3 flex items-center gap-1.5">
              <span>👜</span> সার্চ ফলাফল ({currentFashion.length})
            </h3>
            {currentFashion.length === 0 ? (
              renderEmptySearch("ব্যাগ ও ফ্যাশন পণ্য")
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {currentFashion.map((product) => (
                  <div key={`search-${product.id}`} className="bg-white rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.1)] p-2.5 relative flex flex-col">
                    {(product.discount || (product.discountPercent && Number(product.discountPercent) > 0)) && (
                      <div className="absolute top-0 right-0 bg-[#5c5643]/90 backdrop-blur-sm px-2 py-1.5 rounded-bl-[16px] rounded-tr-[20px] z-20">
                        <span className="text-[#efead8] text-[10px] font-black leading-tight block text-center whitespace-pre-line">
                          {product.discount || `${product.discountPercent}% OFF`}
                        </span>
                      </div>
                    )}
                    <div className="bg-[#f5f5f5] rounded-[20px] aspect-[4/5] relative overflow-hidden mb-3">
                      <img src={product.image || (product.images && product.images[0])} alt={product.nameBn || product.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="px-1 flex-1">
                      <h3 className="text-gray-900 text-[13px] font-black leading-tight mb-1 truncate">{product.nameBn || product.name}</h3>
                      <div className="flex items-center gap-1 mb-1.5">
                        <Star className="w-3.5 h-3.5 fill-[#ffb703] text-[#ffb703]" />
                        <span className="text-gray-600 text-[10px] font-bold">{product.rating || "4.8"} ({product.reviews || "10"})</span>
                      </div>
                      <div className="flex flex-col gap-2 mt-auto">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-gray-900 text-[15px] font-black">৳ {Number(product.discountPrice || product.price).toLocaleString('bn-BD')}</div>
                            {product.discountPrice && product.discountPrice < product.price && (
                              <div className="text-gray-400 text-[11px] font-bold line-through">৳ {Number(product.price).toLocaleString('bn-BD')}</div>
                            )}
                          </div>
                          <button 
                            onClick={(e) => handleAddToCart(product, e)}
                            className="w-8 h-8 flex items-center justify-center bg-[#5c5643] text-[#efead8] rounded-full shadow-md active:scale-90 transition-transform"
                            title="কার্টে যোগ করুন"
                          >
                            <ShoppingCart className="w-4 h-4" />
                          </button>
                        </div>
                        <button 
                          onClick={(e) => handleBuyNow(product, e)}
                          className="w-full bg-[#efead8] text-[#5c5643] text-[11px] font-black py-2 rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-1 shadow-sm"
                        >
                          <Zap className="w-3.5 h-3.5 fill-[#5c5643]" /> কিনুন
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : (
          <>
            {/* Hero Banner - Clean image display */}
            {renderCategoryHeroBanner()}

            {/* Popular Products */}
            <section className="px-4 py-6 text-[#efead8]">
               <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[18px] font-black flex items-center gap-1.5">
                     <span className="text-[20px]">🔥</span> জনপ্রিয় পণ্য
                  </h2>
                  <span className="text-[12px] font-bold text-[#b5a995]">
                     মোট {displayProducts.length}টি পণ্য
                  </span>
               </div>
               
               <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                  {displayProducts.slice(0, 6).map((product) => (
                     <div key={product.id} className="min-w-[160px] max-w-[160px] bg-white rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.1)] p-2.5 relative flex flex-col">
                        {(product.discount || (product.discountPercent && Number(product.discountPercent) > 0)) && (
                           <div className="absolute top-0 right-0 bg-[#5c5643]/90 backdrop-blur-sm px-2 py-1.5 rounded-bl-[16px] rounded-tr-[20px] z-20">
                              <span className="text-[#efead8] text-[10px] font-black leading-tight block text-center whitespace-pre-line">
                                {product.discount || `${product.discountPercent}% OFF`}
                              </span>
                           </div>
                        )}
                        <div className="bg-[#f5f5f5] rounded-[20px] aspect-[4/5] relative overflow-hidden mb-3">
                           <img src={product.image || (product.images && product.images[0])} alt={product.nameBn || product.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="px-1 flex-1">
                           <h3 className="text-gray-900 text-[13px] font-black leading-tight mb-1 truncate">{product.nameBn || product.name}</h3>
                           <div className="flex items-center gap-1 mb-1.5">
                              <Star className="w-3.5 h-3.5 fill-[#ffb703] text-[#ffb703]" />
                              <span className="text-gray-600 text-[10px] font-bold">{product.rating || "4.8"} ({product.reviews || "10"})</span>
                           </div>
                           <div className="flex flex-col gap-2 mt-auto">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="text-gray-900 text-[15px] font-black">৳ {Number(product.discountPrice || product.price).toLocaleString('bn-BD')}</div>
                                  {product.discountPrice && product.discountPrice < product.price && (
                                    <div className="text-gray-400 text-[11px] font-bold line-through">৳ {Number(product.price).toLocaleString('bn-BD')}</div>
                                  )}
                                </div>
                                <button 
                                   onClick={(e) => handleAddToCart(product, e)}
                                   className="w-8 h-8 flex items-center justify-center bg-[#5c5643] text-[#efead8] rounded-full shadow-md active:scale-90 transition-transform"
                                   title="কার্টে যোগ করুন"
                                >
                                   <ShoppingCart className="w-4 h-4" />
                                </button>
                              </div>
                              <button 
                                onClick={(e) => handleBuyNow(product, e)}
                                className="w-full bg-[#efead8] text-[#5c5643] text-[11px] font-black py-2 rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-1 shadow-sm"
                              >
                                <Zap className="w-3.5 h-3.5 fill-[#5c5643]" /> কিনুন
                              </button>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </section>

            {/* Featured Fashion Section */}
            <section className="px-4 py-2 text-[#efead8]">
               <h3 className="text-[13px] font-black tracking-wider uppercase mb-3 flex items-center gap-1.5">
                 <span className="text-[16px]">✨</span> FEATURED FASHION
               </h3>
               <div className="bg-[#f0ece1] rounded-[24px] p-5 flex relative overflow-hidden h-[160px] shadow-lg">
                  <div className="flex flex-col justify-center w-[55%] relative z-10 text-gray-900">
                     <h2 className="text-[16px] font-black leading-[1.2] flex items-center gap-1.5 mb-2">
                        <span className="text-[18px]">✨</span> আপনার স্টাইলের<br/>নতুন সংযোজন
                     </h2>
                     <p className="text-gray-700 text-[11px] font-bold leading-[1.4] mb-3">
                        আপনার স্টাইলের নতুন সংযোজন
                     </p>
                     <button className="bg-black text-[#f6f4f0] px-4 py-2 rounded-[20px] text-[10px] font-black w-fit tracking-wide shadow-md">
                       [ এখনই দেখুন ]
                     </button>
                  </div>
                  <div className="absolute right-[-5%] top-[-10%] h-[120%] w-[55%] flex items-center py-2">
                     <img src="https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80" alt="Featured Fashion" className="w-full h-full object-contain drop-shadow-xl" />
                  </div>
               </div>
            </section>

            {/* Offer Section */}
            <section className="px-4 py-6 text-[#efead8]">
               <h3 className="text-[13px] font-black tracking-wider uppercase mb-3 flex items-center gap-1.5">
                 <span className="text-[16px]">🏷️</span> OFFER
               </h3>
               <div className="bg-[#f0ece1] rounded-[24px] p-5 flex relative overflow-hidden h-[140px] shadow-lg">
                  <div className="flex flex-col justify-center w-[60%] relative z-10 text-gray-900">
                     <h2 className="text-[16px] font-black leading-[1.2] flex items-center gap-1.5 mb-2">
                        <span className="text-[18px]">🏷️</span> আজকের ফ্যাশন অফার
                     </h2>
                     <p className="text-gray-700 text-[11px] font-bold leading-[1.3] mb-3">
                        প্রিমিয়াম ফ্যাশন সেটে বিশেষ ছাড়
                     </p>
                     <button className="bg-black text-[#f6f4f0] px-4 py-2 rounded-[20px] text-[10px] font-black w-fit tracking-wide shadow-md">
                       [ অফার দেখুন ]
                     </button>
                  </div>
                  <div className="absolute right-[-5%] bottom-[-10%] h-[120%] w-[50%] flex items-end justify-end">
                     <img src="https://images.unsplash.com/photo-1575032617751-6d43e5c98692?w=400&q=80" alt="Offer Gift" className="w-full h-[90%] object-contain drop-shadow-2xl" />
                  </div>
               </div>
            </section>

            {/* All Products */}
            <section className="px-4 py-2 text-[#efead8]">
               <h3 className="text-[13px] font-black tracking-wider uppercase mb-3 flex items-center gap-1.5">
                 <span className="text-[16px]">✨</span> সব পণ্য ({displayProducts.length})
               </h3>
               <div className="grid grid-cols-2 gap-4">
                  {displayProducts.map((product) => (
                     <div key={`all-${product.id}`} className="bg-white rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.1)] p-2.5 relative flex flex-col">
                        {(product.discount || (product.discountPercent && Number(product.discountPercent) > 0)) && (
                           <div className="absolute top-0 right-0 bg-[#5c5643]/90 backdrop-blur-sm px-2 py-1.5 rounded-bl-[16px] rounded-tr-[20px] z-20">
                              <span className="text-[#efead8] text-[10px] font-black leading-tight block text-center whitespace-pre-line">
                                {product.discount || `${product.discountPercent}% OFF`}
                              </span>
                           </div>
                        )}
                        <div className="bg-[#f5f5f5] rounded-[20px] aspect-[4/5] relative overflow-hidden mb-3">
                           <img src={product.image || (product.images && product.images[0])} alt={product.nameBn || product.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="px-1 flex-1">
                           <h3 className="text-gray-900 text-[13px] font-black leading-tight mb-1 truncate">{product.nameBn || product.name}</h3>
                           <div className="flex items-center gap-1 mb-1.5">
                              <Star className="w-3.5 h-3.5 fill-[#ffb703] text-[#ffb703]" />
                              <span className="text-gray-600 text-[10px] font-bold">{product.rating || "4.8"} ({product.reviews || "10"})</span>
                           </div>
                           <div className="flex flex-col gap-2 mt-auto">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="text-gray-900 text-[15px] font-black">৳ {Number(product.discountPrice || product.price).toLocaleString('bn-BD')}</div>
                                  {product.discountPrice && product.discountPrice < product.price && (
                                    <div className="text-gray-400 text-[11px] font-bold line-through">৳ {Number(product.price).toLocaleString('bn-BD')}</div>
                                  )}
                                </div>
                                <button 
                                   onClick={(e) => handleAddToCart(product, e)}
                                   className="w-8 h-8 flex items-center justify-center bg-[#5c5643] text-[#efead8] rounded-full shadow-md active:scale-90 transition-transform"
                                   title="কার্টে যোগ করুন"
                                >
                                   <ShoppingCart className="w-4 h-4" />
                                </button>
                              </div>
                              <button 
                                onClick={(e) => handleBuyNow(product, e)}
                                className="w-full bg-[#efead8] text-[#5c5643] text-[11px] font-black py-2 rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-1 shadow-sm"
                              >
                                <Zap className="w-3.5 h-3.5 fill-[#5c5643]" /> কিনুন
                              </button>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </section>
          </>
        )}

      </div>
    );
  }

  if (isGift) {
    const currentGifts = filterList(displayProducts);

    return (
      <div className="bg-[#fcfdfc] min-h-screen -mx-4 -mt-4 pb-20 overflow-x-hidden font-sans relative">
        <SEO title="উপহার বাজার" description="All Mayadin Bazar Gifts" />
        {renderToast()}
        
        {/* Header */}
        <header className="px-4 pt-6 pb-4 sticky top-0 bg-white/95 backdrop-blur-md z-50 flex items-center justify-between border-b border-gray-100 shadow-sm">
           <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate(-1)} 
                className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center border border-gray-200 active:scale-90 transition-transform shrink-0"
                title="ফিরে যান"
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5 text-gray-800" />
              </button>
              <div className="flex items-center gap-2">
                <span className="text-[24px]">🎁</span>
                <h1 className="text-gray-900 text-[18px] font-black tracking-tight leading-none">উপহার বাজার</h1>
              </div>
           </div>
           <div className="flex items-center gap-3">
              <button onClick={() => navigate("/cart")} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors relative">
                 <ShoppingCart className="w-5 h-5 text-gray-800" />
                 {totalItems > 0 && (
                   <span className="absolute -top-1 -right-1 bg-black text-white text-[8px] font-black w-4.5 h-4.5 flex items-center justify-center rounded-full border border-white">
                     {totalItems}
                   </span>
                 )}
              </button>
           </div>
        </header>

        {/* Category Search & Central Scanner Bar */}
        {renderCategorySearchBar({
          placeholder: "উপহার পণ্য বা ব্র্যান্ড খুঁজুন...",
          inputBg: "bg-white",
          textColor: "text-gray-900",
          btnBg: "bg-black",
          btnText: "text-[#f6f4f0]"
        })}

        {searchQuery && currentGifts.length === 0 ? (
          renderEmptySearch("উপহার")
        ) : searchQuery ? (
          <section className="px-4 py-4">
             <h3 className="text-xs font-black text-gray-500 uppercase tracking-wider mb-3">সার্চ ফলাফল ({currentGifts.length}টি উপহার)</h3>
             <div className="grid grid-cols-2 gap-3">
                {currentGifts.map((product) => (
                  <div key={`search-gift-${product.id}`} className="bg-white rounded-[24px] border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-2.5 relative flex flex-col">
                     <div className="bg-[#f8f5f0] rounded-[20px] aspect-[4/5] relative overflow-hidden mb-3">
                        <img src={product.image || (product.images && product.images[0])} alt={product.nameBn || product.name} className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300" />
                        {(product.discount || (product.discountPercent && Number(product.discountPercent) > 0)) && (
                          <div className="absolute top-0 right-0 bg-[#cbb8a4]/90 backdrop-blur-sm px-2 py-1.5 rounded-bl-[16px] rounded-tr-[20px] z-20">
                             <span className="text-white text-[10px] font-black leading-tight block text-center whitespace-pre-line">
                               {product.discount || `${product.discountPercent}% OFF`}
                             </span>
                          </div>
                        )}
                     </div>
                     <div className="px-1 flex-1">
                        <h3 className="text-gray-900 text-[13px] font-black leading-tight mb-1 truncate">{product.nameBn || product.name}</h3>
                        <div className="flex items-center gap-1 mb-1.5">
                           <Star className="w-3.5 h-3.5 fill-[#ffb703] text-[#ffb703]" />
                           <span className="text-gray-600 text-[10px] font-bold">{product.rating || "4.9"} ({product.reviews || "15"})</span>
                        </div>
                        <div className="flex items-center justify-between mb-3 mt-auto">
                          <div>
                            <div className="text-gray-900 text-[15px] font-black">৳ {Number(product.discountPrice || product.price).toLocaleString('bn-BD')}</div>
                            {product.discountPrice && product.discountPrice < product.price && (
                              <div className="text-gray-400 text-[11px] font-bold line-through">৳ {Number(product.price).toLocaleString('bn-BD')}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                           <button 
                              onClick={(e) => handleAddToCart(product, e)}
                              className="flex-1 bg-black text-white py-2.5 rounded-xl text-[10px] font-black flex items-center justify-center gap-1.5 active:scale-95 transition-transform shadow-md"
                              title="কার্টে যোগ করুন"
                           >
                              <ShoppingCart className="w-3.5 h-3.5" /> কার্ট
                           </button>
                           <button onClick={(e) => handleBuyNow(product, e)} className="px-2.5 py-2.5 bg-zinc-800 text-white rounded-xl text-[10px] font-black active:scale-95 transition-transform">
                              কিনুন
                           </button>
                        </div>
                     </div>
                  </div>
                ))}
             </div>
          </section>
        ) : (
          <>
            {/* Hero Banner - Clean image display */}
            {renderCategoryHeroBanner()}

            {/* Popular Gifts */}
            <section className="px-4 py-6">
               <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[18px] font-black text-gray-900 flex items-center gap-1.5">
                     <span className="text-[20px]">🔥</span> জনপ্রিয় উপহার
                  </h2>
                  <span className="text-[12px] font-bold text-[#a08a70]">
                     মোট {displayProducts.length}টি উপহার
                  </span>
               </div>
               
               <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                  {displayProducts.slice(0, 6).map((product) => (
                     <div key={product.id} className="min-w-[170px] max-w-[170px] bg-white rounded-[24px] border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-2.5 relative flex flex-col">
                        <div className="bg-[#f8f5f0] rounded-[20px] aspect-[4/5] relative overflow-hidden mb-3">
                           <img src={product.image || (product.images && product.images[0])} alt={product.nameBn || product.name} className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300" />
                           {(product.discount || (product.discountPercent && Number(product.discountPercent) > 0)) && (
                             <div className="absolute top-0 right-0 bg-[#cbb8a4]/90 backdrop-blur-sm px-2 py-1.5 rounded-bl-[16px] rounded-tr-[20px] z-20">
                                <span className="text-white text-[10px] font-black leading-tight block text-center whitespace-pre-line">
                                  {product.discount || `${product.discountPercent}% OFF`}
                                </span>
                             </div>
                           )}
                        </div>
                        <div className="px-1 flex-1">
                           <h3 className="text-gray-900 text-[13px] font-black leading-tight mb-1 truncate">{product.nameBn || product.name}</h3>
                           <div className="flex items-center gap-1 mb-1.5">
                              <Star className="w-3.5 h-3.5 fill-[#ffb703] text-[#ffb703]" />
                              <span className="text-gray-600 text-[10px] font-bold">{product.rating || "4.9"} ({product.reviews || "15"})</span>
                           </div>
                           <div className="flex flex-col gap-2 mt-auto">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="text-gray-900 text-[15px] font-black">৳ {Number(product.discountPrice || product.price).toLocaleString('bn-BD')}</div>
                                  {product.discountPrice && product.discountPrice < product.price && (
                                    <div className="text-gray-400 text-[11px] font-bold line-through">৳ {Number(product.price).toLocaleString('bn-BD')}</div>
                                  )}
                                </div>
                                <button 
                                   onClick={(e) => handleAddToCart(product, e)}
                                   className="w-8 h-8 flex items-center justify-center bg-black text-white rounded-full shadow-md active:scale-90 transition-transform"
                                   title="কার্টে যোগ করুন"
                                >
                                   <ShoppingCart className="w-4 h-4" />
                                </button>
                              </div>
                              <button 
                                onClick={(e) => handleBuyNow(product, e)}
                                className="w-full bg-[#cbb8a4] text-white text-[11px] font-black py-2 rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-1 shadow-sm"
                              >
                                <Zap className="w-3.5 h-3.5 fill-white" /> কিনুন
                              </button>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </section>

            {/* Featured Gift Section */}
            <section className="px-4 py-2">
               <h3 className="text-gray-800 text-[13px] font-black tracking-wider uppercase mb-3">FEATURED GIFT SECTION</h3>
               <div className="bg-[#f2f1ef] rounded-[32px] p-5 flex relative overflow-hidden h-[160px]">
                  <div className="flex flex-col justify-center w-[60%] relative z-10">
                     <span className="text-gray-900 text-[18px] font-black leading-[1.2] flex items-center gap-1.5 mb-2">
                        <span className="text-[20px]">💝</span> বিশেষ কারও জন্য
                     </span>
                     <p className="text-gray-700 text-[11px] font-bold leading-[1.4] mb-3">
                        ভালোবাসা প্রকাশের জন্য<br/>একটি সুন্দর উপহার
                     </p>
                     <button className="bg-black text-[#f6f4f0] px-4 py-2 rounded-xl text-[10px] font-black w-fit tracking-wide">
                       [ এখনই দেখুন ]
                     </button>
                  </div>
                  <div className="absolute right-[-2%] top-0 bottom-0 h-full w-[45%] flex items-center py-3">
                     <img src="https://images.unsplash.com/photo-1544816155-12df9643f363?w=400&q=80" alt="Featured Gift" className="w-full h-full object-contain drop-shadow-xl" />
                  </div>
               </div>
            </section>

            {/* All Products in Gift */}
            <section className="px-4 py-6">
               <h3 className="text-gray-800 text-[13px] font-black tracking-wider uppercase mb-3 flex items-center gap-1.5">
                 <span className="text-[16px]">✨</span> সব উপহার পণ্য ({displayProducts.length})
               </h3>
               <div className="grid grid-cols-2 gap-3">
                  {displayProducts.map((product) => (
                     <div key={`all-gift-${product.id}`} className="bg-white rounded-[24px] border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-2.5 relative flex flex-col">
                        <div className="bg-[#f8f5f0] rounded-[20px] aspect-[4/5] relative overflow-hidden mb-3">
                           <img src={product.image || (product.images && product.images[0])} alt={product.nameBn || product.name} className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300" />
                           {(product.discount || (product.discountPercent && Number(product.discountPercent) > 0)) && (
                             <div className="absolute top-0 right-0 bg-[#cbb8a4]/90 backdrop-blur-sm px-2 py-1.5 rounded-bl-[16px] rounded-tr-[20px] z-20">
                                <span className="text-white text-[10px] font-black leading-tight block text-center whitespace-pre-line">
                                  {product.discount || `${product.discountPercent}% OFF`}
                                </span>
                             </div>
                           )}
                        </div>
                        <div className="px-1 flex-1">
                           <h3 className="text-gray-900 text-[13px] font-black leading-tight mb-1 truncate">{product.nameBn || product.name}</h3>
                           <div className="flex items-center gap-1 mb-1.5">
                              <Star className="w-3.5 h-3.5 fill-[#ffb703] text-[#ffb703]" />
                              <span className="text-gray-600 text-[10px] font-bold">{product.rating || "4.9"} ({product.reviews || "15"})</span>
                           </div>
                           <div className="flex flex-col gap-2 mt-auto">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="text-gray-900 text-[15px] font-black">৳ {Number(product.discountPrice || product.price).toLocaleString('bn-BD')}</div>
                                  {product.discountPrice && product.discountPrice < product.price && (
                                    <div className="text-gray-400 text-[11px] font-bold line-through">৳ {Number(product.price).toLocaleString('bn-BD')}</div>
                                  )}
                                </div>
                                <button 
                                   onClick={(e) => handleAddToCart(product, e)}
                                   className="w-8 h-8 flex items-center justify-center bg-black text-white rounded-full shadow-md active:scale-90 transition-transform"
                                   title="কার্টে যোগ করুন"
                                >
                                   <ShoppingCart className="w-4 h-4" />
                                </button>
                              </div>
                              <button 
                                onClick={(e) => handleBuyNow(product, e)}
                                className="w-full bg-[#cbb8a4] text-white text-[11px] font-black py-2 rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-1 shadow-sm"
                              >
                                <Zap className="w-3.5 h-3.5 fill-white" /> কিনুন
                              </button>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </section>
          </>
        )}

      </div>
    );
  }

  if (isClothing) {
    const currentClothing = filterList(displayProducts);

    return (
      <div className="bg-[#fcfdfc] min-h-screen -mx-4 -mt-4 pb-20 overflow-x-hidden font-sans relative">
        <SEO title="কাপড় বাজার" description="All Mayadin Bazar Clothing" />
        {renderToast()}
        
        {/* Header */}
        <header className="px-4 pt-6 pb-4 sticky top-0 bg-white/95 backdrop-blur-md z-50 flex items-center justify-between border-b border-gray-100 shadow-sm">
           <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate(-1)} 
                className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center border border-gray-200 active:scale-90 transition-transform shrink-0"
                title="ফিরে যান"
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5 text-gray-800" />
              </button>
              <div className="flex items-center gap-2">
                <span className="text-[24px]">👗</span>
                <h1 className="text-gray-900 text-[18px] font-black tracking-tight leading-none">কাপড় ও পরিধান বাজার</h1>
              </div>
           </div>
           <div className="flex items-center gap-3">
              <button onClick={() => navigate("/cart")} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors relative">
                 <ShoppingCart className="w-5 h-5 text-gray-800" />
                 {totalItems > 0 && (
                   <span className="absolute -top-1 -right-1 bg-black text-white text-[8px] font-black w-4.5 h-4.5 flex items-center justify-center rounded-full border border-white">
                     {totalItems}
                   </span>
                 )}
              </button>
           </div>
        </header>

        {/* Category Search & Central Scanner Bar */}
        {renderCategorySearchBar({
          placeholder: "পোশাক ও ফ্যাশন আইটেম খুঁজুন...",
          inputBg: "bg-white",
          textColor: "text-gray-900",
          btnBg: "bg-black",
          btnText: "text-[#f6f4f0]"
        })}

        {searchQuery && currentClothing.length === 0 ? (
          renderEmptySearch("পোশাক")
        ) : searchQuery ? (
          <section className="px-4 py-4">
             <h3 className="text-xs font-black text-gray-500 uppercase tracking-wider mb-3">সার্চ ফলাফল ({currentClothing.length}টি পোশাক)</h3>
             <div className="grid grid-cols-2 gap-3">
                {currentClothing.map((product) => (
                  <div key={`search-cloth-${product.id}`} className="bg-white rounded-[24px] border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-2.5 relative flex flex-col">
                     <div className="bg-[#f8f5f0] rounded-[20px] aspect-[4/5] relative overflow-hidden mb-3">
                        <img src={product.image || (product.images && product.images[0])} alt={product.nameBn || product.name} className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300" />
                        {(product.discount || (product.discountPercent && Number(product.discountPercent) > 0)) && (
                          <div className="absolute top-0 right-0 bg-[#d4ba9e]/90 backdrop-blur-sm px-2 py-1.5 rounded-bl-[16px] rounded-tr-[20px] z-20">
                             <span className="text-white text-[10px] font-black leading-tight block text-center whitespace-pre-line">
                               {product.discount || `${product.discountPercent}% OFF`}
                             </span>
                          </div>
                        )}
                     </div>
                     <div className="px-1 flex-1">
                        <h3 className="text-gray-900 text-[13px] font-black leading-tight mb-1 truncate">{product.nameBn || product.name}</h3>
                        <div className="flex items-center gap-1 mb-1.5">
                           <Star className="w-3.5 h-3.5 fill-[#ffb703] text-[#ffb703]" />
                           <span className="text-gray-600 text-[10px] font-bold">{product.rating || "4.8"} ({product.reviews || "22"})</span>
                        </div>
                        <div className="flex items-center justify-between mb-3 mt-auto">
                          <div>
                            <div className="text-gray-900 text-[15px] font-black">৳ {Number(product.discountPrice || product.price).toLocaleString('bn-BD')}</div>
                            {product.discountPrice && product.discountPrice < product.price && (
                              <div className="text-gray-400 text-[11px] font-bold line-through">৳ {Number(product.price).toLocaleString('bn-BD')}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                           <button 
                              onClick={(e) => handleAddToCart(product, e)}
                              className="flex-1 bg-black text-white py-2.5 rounded-xl text-[10px] font-black flex items-center justify-center gap-1.5 active:scale-95 transition-transform shadow-md"
                              title="কার্টে যোগ করুন"
                           >
                              <ShoppingCart className="w-3.5 h-3.5" /> কার্ট
                           </button>
                           <button onClick={(e) => handleBuyNow(product, e)} className="px-2.5 py-2.5 bg-zinc-800 text-white rounded-xl text-[10px] font-black active:scale-95 transition-transform">
                              কিনুন
                           </button>
                        </div>
                     </div>
                  </div>
                ))}
             </div>
          </section>
        ) : (
          <>
            {/* Hero Banner - Clean image display */}
            {renderCategoryHeroBanner()}

            {/* Popular Products */}
            <section className="px-4 py-6">
               <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[18px] font-black text-gray-900 flex items-center gap-1.5">
                     <span className="text-[20px]">🔥</span> জনপ্রিয় পণ্য
                  </h2>
                  <span className="text-[12px] font-bold text-[#8b5e34]">
                     মোট {displayProducts.length}টি পণ্য
                  </span>
               </div>
               
               <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                  {displayProducts.slice(0, 6).map((product) => (
                     <div key={product.id} className="min-w-[170px] max-w-[170px] bg-white rounded-[24px] border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-2.5 relative flex flex-col">
                        <div className="bg-[#f8f5f0] rounded-[20px] aspect-[4/5] relative overflow-hidden mb-3">
                           <img src={product.image || (product.images && product.images[0])} alt={product.nameBn || product.name} className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300" />
                           {(product.discount || (product.discountPercent && Number(product.discountPercent) > 0)) && (
                             <div className="absolute top-0 right-0 bg-[#d4ba9e]/90 backdrop-blur-sm px-2 py-1.5 rounded-bl-[16px] rounded-tr-[20px] z-20">
                                <span className="text-white text-[10px] font-black leading-tight block text-center whitespace-pre-line">
                                  {product.discount || `${product.discountPercent}% OFF`}
                                </span>
                             </div>
                           )}
                        </div>
                        <div className="px-1 flex-1">
                           <h3 className="text-gray-900 text-[13px] font-black leading-tight mb-1 truncate">{product.nameBn || product.name}</h3>
                           <div className="flex items-center gap-1 mb-1.5">
                              <Star className="w-3.5 h-3.5 fill-[#ffb703] text-[#ffb703]" />
                              <span className="text-gray-600 text-[10px] font-bold">{product.rating || "4.8"} ({product.reviews || "22"})</span>
                           </div>
                           <div className="flex flex-col gap-2 mt-auto">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="text-gray-900 text-[15px] font-black">৳ {Number(product.discountPrice || product.price).toLocaleString('bn-BD')}</div>
                                  {product.discountPrice && product.discountPrice < product.price && (
                                    <div className="text-gray-400 text-[11px] font-bold line-through">৳ {Number(product.price).toLocaleString('bn-BD')}</div>
                                  )}
                                </div>
                                <button 
                                   onClick={(e) => handleAddToCart(product, e)}
                                   className="w-8 h-8 flex items-center justify-center bg-black text-white rounded-full shadow-md active:scale-90 transition-transform"
                                   title="কার্টে যোগ করুন"
                                >
                                   <ShoppingCart className="w-4 h-4" />
                                </button>
                              </div>
                              <button 
                                onClick={(e) => handleBuyNow(product, e)}
                                className="w-full bg-[#d4ba9e] text-white text-[11px] font-black py-2 rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-1 shadow-sm"
                              >
                                <Zap className="w-3.5 h-3.5 fill-white" /> কিনুন
                              </button>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </section>

            {/* All Products */}
            <section className="px-4 py-6">
               <h3 className="text-gray-800 text-[13px] font-black tracking-wider uppercase mb-3">ALL PRODUCTS</h3>
               <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[18px] font-black text-gray-900 flex items-center gap-1.5">
                     <span className="text-[20px]">✨</span> সব পণ্য ({displayProducts.length})
                  </h2>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                  {displayProducts.map((product) => (
                     <div key={`all-${product.id}`} className="bg-white rounded-[24px] border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-2.5 relative flex flex-col">
                        <div className="bg-[#f8f5f0] rounded-[20px] aspect-[4/5] relative overflow-hidden mb-3">
                           <img src={product.image || (product.images && product.images[0])} alt={product.nameBn || product.name} className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300" />
                           {(product.discount || (product.discountPercent && Number(product.discountPercent) > 0)) && (
                             <div className="absolute top-0 right-0 bg-[#d4ba9e]/90 backdrop-blur-sm px-2 py-1.5 rounded-bl-[16px] rounded-tr-[20px] z-20">
                                <span className="text-white text-[10px] font-black leading-tight block text-center whitespace-pre-line">
                                  {product.discount || `${product.discountPercent}% OFF`}
                                </span>
                             </div>
                           )}
                        </div>
                        <div className="px-1 flex-1">
                           <h3 className="text-gray-900 text-[13px] font-black leading-tight mb-1 truncate">{product.nameBn || product.name}</h3>
                           <div className="flex items-center gap-1 mb-1.5">
                              <Star className="w-3.5 h-3.5 fill-[#ffb703] text-[#ffb703]" />
                              <span className="text-gray-600 text-[10px] font-bold">{product.rating || "4.8"} ({product.reviews || "22"})</span>
                           </div>
                           <div className="flex flex-col gap-2 mt-auto">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="text-gray-900 text-[15px] font-black">৳ {Number(product.discountPrice || product.price).toLocaleString('bn-BD')}</div>
                                  {product.discountPrice && product.discountPrice < product.price && (
                                    <div className="text-gray-400 text-[11px] font-bold line-through">৳ {Number(product.price).toLocaleString('bn-BD')}</div>
                                  )}
                                </div>
                                <button 
                                   onClick={(e) => handleAddToCart(product, e)}
                                   className="w-8 h-8 flex items-center justify-center bg-black text-white rounded-full shadow-md active:scale-90 transition-transform"
                                   title="কার্টে যোগ করুন"
                                >
                                   <ShoppingCart className="w-4 h-4" />
                                </button>
                              </div>
                              <button 
                                onClick={(e) => handleBuyNow(product, e)}
                                className="w-full bg-[#d4ba9e] text-white text-[11px] font-black py-2 rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-1 shadow-sm"
                              >
                                <Zap className="w-3.5 h-3.5 fill-white" /> কিনুন
                              </button>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </section>
          </>
        )}

      </div>
    );
  }

  const currentDisplayProducts = filterList(displayProducts);

  return (
    <div className="bg-[#fcfdfc] min-h-screen -mx-4 -mt-4 pb-20 overflow-x-hidden relative">
      <SEO title={category?.title || "Market"} description={category?.subtitle || "Products from All Mayadin Bazar."} />
      {renderToast()}

      {/* Header Section */}
      <header className={`${isBeauty ? themeColor : 'bg-[#004b23]'} px-4 pt-5 pb-6 ${isBeauty ? 'rounded-b-[48px]' : ''} sticky top-0 z-50 transition-all duration-500 shadow-md`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {isBeauty ? (
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => navigate(-1)} 
                  className="w-10 h-10 bg-black/5 hover:bg-black/10 rounded-full flex items-center justify-center border border-black/5 active:scale-90 transition-transform shrink-0"
                  title="ফিরে যান"
                  aria-label="Back"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-900" />
                </button>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-[22px]">💄</span>
                    <span className="text-gray-900 text-xl font-black tracking-tight leading-none">রূপসজ্জা বাজার</span>
                  </div>
                  <span className="text-gray-600 text-[11px] font-bold mt-1 opacity-90">(সৌন্দর্য ও ব্যক্তিগত যত্নের সব পণ্য)</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => navigate(-1)} 
                  className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center border border-white/20 active:scale-90 transition-transform shrink-0"
                  title="ফিরে যান"
                  aria-label="Back"
                >
                  <ArrowLeft className="w-5 h-5 text-white" />
                </button>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-1.5 shadow-md shrink-0">
                    <div className="relative">
                      <ShoppingCart className="w-6 h-6 text-[#004b23]" />
                      <div className="absolute -top-0.5 -right-0.5 w-2.5 h-3 bg-[#004b23] rounded-full flex items-center justify-center">
                        <div className="w-0.5 h-1.5 bg-white rounded-full"></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <h1 className="text-white text-lg font-black leading-none tracking-tight">
                      All mayadin <span className="text-[#ffb703]">Bazar</span>
                    </h1>
                    <span className="text-white/80 text-[9px] font-medium mt-0.5">Fresh. Pure. Trusted.</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <Link to={isBeauty ? "/cart" : "/food/cart"} className={`relative p-2.5 ${isBeauty ? 'bg-black/5' : 'bg-white/10'} rounded-full border ${isBeauty ? 'border-black/5' : 'border-white/10'} shadow-sm`}>
              <ShoppingCart className={`w-5 h-5 ${isBeauty ? 'text-gray-800' : 'text-white'}`} />
              {totalItems > 0 && (
                <span className={`absolute top-0 right-0 ${isBeauty ? 'bg-red-500 text-white' : 'bg-[#ffb703] text-black'} text-[8px] font-black w-4.5 h-4.5 flex items-center justify-center rounded-full border-2 ${isBeauty ? 'border-[#f5eade]' : 'border-[#004b23]'}`}>
                  {totalItems}
                </span>
              )}
            </Link>
          </div>
        </div>

        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isBeauty ? "বিউটি ও রূপসজ্জা পণ্য খুঁজুন..." : "পণ্য বা ক্যাটাগরি সার্চ করুন..."}
            className={`w-full ${isBeauty ? 'bg-[#f3f4f6] text-gray-800 rounded-full py-3.5' : 'bg-white text-gray-800 rounded-2xl py-3.5'} pl-11 pr-10 text-[13px] font-medium shadow-sm border border-gray-100 focus:outline-none`}
          />
          {searchQuery && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
              <button 
                onClick={() => setSearchQuery("")}
                className="w-7 h-7 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center hover:bg-gray-300"
                title="মুছে ফেলুন"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Auto-Slider Hero Banner - Positioned at the top for maximum visibility */}
      {renderCategoryHeroBanner()}

      {/* Auto-Scrolling Subcategories (Marquee) - ONLY for Food Bazar as requested */}
      {isFood && displaySubCategories.length > 0 && (
        <section className="py-4 overflow-hidden bg-white">
          <div className="flex overflow-hidden">
            <motion.div 
              animate={{ x: ["0%", "-50%"] }}
              transition={{ 
                duration: 20, 
                repeat: Infinity, 
                ease: "linear" 
              }}
              className="flex gap-4 whitespace-nowrap px-4"
            >
              {[...displaySubCategories, ...displaySubCategories, ...displaySubCategories].map((cat: any, index: number) => (
                <button 
                  key={`${cat.id || index}-${index}`} 
                  onClick={() => setSearchQuery(searchQuery === cat.name ? "" : cat.name)}
                  style={{ touchAction: "manipulation" }}
                  className="flex flex-col items-center gap-2 min-w-[100px] cursor-pointer active:scale-90 transition-transform duration-75 text-left focus:outline-none"
                >
                  <div className={`w-[70px] h-[70px] rounded-full bg-white shadow-[0_4px_15px_rgba(0,0,0,0.08)] border-2 ${searchQuery === cat.name ? 'border-[#004b23] ring-2 ring-[#004b23]/30' : 'border-gray-50'} flex items-center justify-center overflow-hidden p-1`}>
                     {cat.image ? (
                       <img src={cat.image} alt={cat.name} loading="eager" decoding="async" className="w-full h-full object-cover rounded-full" />
                     ) : (
                       <LayoutGrid className="w-6 h-6 text-gray-300" />
                     )}
                  </div>
                  <span className={`text-[12px] font-black ${searchQuery === cat.name ? 'text-[#004b23]' : 'text-gray-800'} tracking-tight text-center`}>{cat.name}</span>
                </button>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* Featured Products Grid */}
      <section className="px-4 py-6">
        <div className="flex items-center justify-between mb-6 px-1">
           <div>
             <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
               {isBeauty ? "🔥 জনপ্রিয় পণ্য" : "Best Selling Products"}
             </h2>
             {isBeauty && <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Trending Products</p>}
           </div>
           <button className={`text-sm font-black ${accentColor} flex items-center gap-1`}>{isBeauty ? "সব দেখুন" : "View All"} <ChevronRight className="w-4 h-4" /></button>
        </div>

        {searchQuery && currentDisplayProducts.length === 0 ? (
          renderEmptySearch(isBeauty ? "বিউটি" : "পণ্য")
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {currentDisplayProducts.map((product: any) => (
            <div 
              key={product.id} 
              className={`bg-white ${isBeauty ? 'rounded-[24px] p-0 overflow-hidden' : 'rounded-3xl p-3'} border border-gray-100 shadow-[0_8px_40px_rgba(0,0,0,0.04)] relative flex flex-col h-full active:scale-95 transition-all group`}
            >
               {(product.discount || (product.discountPercent && Number(product.discountPercent) > 0)) && (
                 <div className={`absolute top-3 left-3 ${isBeauty ? 'bg-[#8b5e34] text-white' : 'bg-[#ffb703] text-black'} text-[10px] font-black px-2 py-1 rounded-md z-10 uppercase shadow-sm`}>
                   {product.discount || `${product.discountPercent}% ছাড়`}
                 </div>
               )}
               
               {!isBeauty && (
                 <button className="absolute top-3 right-3 w-9 h-9 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg z-10 border border-gray-50 active:scale-90 transition-transform">
                    <Heart className="w-5 h-5 text-gray-300 hover:text-red-500 transition-colors" />
                 </button>
               )}
               
               <div className={`${isBeauty ? 'aspect-[4/3] rounded-b-[24px] mb-3 p-2.5' : 'aspect-square rounded-2xl mb-3 p-2.5'} ${isBeauty ? 'bg-[#f8e7d8]/40' : 'bg-gray-50'} flex items-center justify-center overflow-hidden relative`}>
                   <img src={product.image || (product.images && product.images[0]) || "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&q=80"} alt={product.nameBn} className="w-full h-full object-contain transform group-hover:scale-105 transition-transform duration-300" />
               </div>
               
               <div className="space-y-1 mb-3 px-3 flex-1">
                  <h3 className={`${isBeauty ? 'text-[14px]' : 'text-[14px]'} font-black text-gray-900 leading-tight line-clamp-1`}>{product.nameBn}</h3>
                  
                  {isBeauty && (
                    <div className="flex items-center gap-0.5 mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-[#ffb703] text-[#ffb703]" />
                      ))}
                    </div>
                  )}

                  <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 mt-1.5">
                    <span className={`${isBeauty ? 'text-[15px]' : 'text-[16px]'} font-black text-gray-900`}>৳ {Number(product.discountPrice || product.price).toLocaleString('bn-BD')}</span>
                    {product.discountPrice && product.discountPrice < product.price && (
                      <span className="text-[12px] text-gray-400 line-through font-bold">৳ {Number(product.price).toLocaleString('bn-BD')}</span>
                    )}
                  </div>
                  {!isBeauty && <p className="text-[11px] font-bold text-gray-400 mt-1">{product.weight}</p>}
               </div>
               
               <div className={`${isBeauty ? 'px-3 pb-3 space-y-2' : 'mt-2 space-y-2'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <button 
                      onClick={(e) => handleAddToCart(product, e)}
                      className={`flex-1 ${btnColor} text-white ${isBeauty ? 'py-2.5 rounded-xl text-[12px]' : 'py-3 rounded-2xl text-[12px]'} flex items-center justify-center gap-2 font-black shadow-lg active:scale-95 transition-transform`}
                      title="কার্টে যোগ করুন"
                    >
                       <ShoppingCart className="w-4 h-4" /> কার্ট
                    </button>
                    <button 
                      onClick={(e) => handleBuyNow(product, e)}
                      className={`flex-1 ${isBeauty ? 'bg-[#8b5e34]' : 'bg-zinc-800'} text-white ${isBeauty ? 'py-2.5 rounded-xl text-[12px]' : 'py-3 rounded-2xl text-[12px]'} flex items-center justify-center gap-2 font-black shadow-lg active:scale-95 transition-transform`}
                    >
                       <Zap className="w-4 h-4 fill-white" /> কিনুন
                    </button>
                  </div>
               </div>
            </div>
          ))}
        </div>
        )}
      </section>

      {/* Combo Offer Section */}
      {!isFood && !isBeauty && (
        <section className="px-4 py-4">
          <div className="bg-[#fff9ed] rounded-[32px] p-6 relative overflow-hidden border border-[#fff1d1] shadow-sm">
            <div className="flex flex-col gap-2 max-w-[60%]">
              <h2 className="text-[#8b5e34] text-xl font-black leading-tight">Smart Combo</h2>
              <p className="text-gray-600 text-sm font-bold">Save More with <br/> Combo Offers</p>
              <button className="mt-4 bg-[#004b23] text-white px-6 py-2.5 rounded-xl text-[12px] font-black w-fit flex items-center gap-2 active:scale-95 transition-transform">
                Explore Combos <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="absolute right-0 bottom-0 w-44 h-44 flex items-center justify-center">
               <div className="relative w-full h-full">
                  <img src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80" className="absolute right-4 bottom-4 w-32 h-32 object-cover rounded-2xl shadow-xl z-10" />
                  <div className="absolute top-4 right-4 w-16 h-16 bg-[#ffb703] rounded-full flex flex-col items-center justify-center shadow-lg border-4 border-white z-20">
                    <span className="text-black text-[10px] font-black leading-none">UPTO</span>
                    <span className="text-black text-sm font-black">20%</span>
                    <span className="text-black text-[8px] font-black">OFF</span>
                  </div>
               </div>
            </div>
          </div>
        </section>
      )}

      {/* Today's Special Offer (Beauty) */}
      {isBeauty && (
        <section className="px-4 py-6">
           <div className={`bg-gradient-to-r from-[#d9c5b2] to-[#8b5e34] rounded-[32px] p-6 relative overflow-hidden shadow-xl`}>

              <div className="relative z-10 flex items-center justify-between gap-4">
                 <div className="flex items-center gap-4 max-w-[70%]">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shrink-0">
                      <span className="text-[24px]">🏷️</span>
                    </div>
                    <div>
                        <h3 className="text-gray-900 text-[13px] font-black uppercase tracking-tight">আজকের বিশেষ অফার</h3>
                       <p className="text-white text-[15px] font-black leading-tight mt-1">
                         সব স্কিন কেয়ারের ৩০% ছাড়
                       </p>
                    </div>
                 </div>
                 <button className="bg-[#8b5e34] text-white px-5 py-2.5 rounded-xl text-[12px] font-black active:scale-95 transition-all shadow-lg">
                   এখনই কিনুন
                 </button>
              </div>

           </div>
        </section>
      )}

      {/* Trust Badges */}
      {!isFood && (
        <section className="px-4 py-8">
          <div className={`grid grid-cols-2 gap-3 ${!isBeauty ? 'bg-[#f0f9f1]/50 p-4 rounded-[32px] border border-[#dcf0dd]/50' : ''}`}>
            {[
              { icon: ShieldCheck, title: isBeauty ? "100% Original" : "100% Fresh", subtitle: isBeauty ? "Trusted Products" : "Quality Products" },
              { icon: Truck, title: "Fast Delivery", subtitle: isBeauty ? "Safety First" : "30-60 Min" },
              { icon: Banknote, title: "Cash on Delivery", subtitle: isBeauty ? "Secure Payment" : "Available" },
              { icon: Shield, title: isBeauty ? "Money Back" : "100% Secure", subtitle: isBeauty ? "Guarantee" : "Shopping" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2.5 bg-white p-3 rounded-xl border border-gray-50 shadow-sm">
                 <div className={`w-9 h-9 ${lightBg} rounded-lg flex items-center justify-center border ${borderColor}`}>
                    <item.icon className={`w-4 h-4 ${accentColor}`} />
                 </div>
                 <div className="flex flex-col">
                    <span className="text-[9px] font-black text-gray-900 leading-none mb-0.5">{item.title}</span>
                    <span className="text-[8px] text-gray-400 font-bold uppercase tracking-tight">{item.subtitle}</span>
                 </div>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
};

