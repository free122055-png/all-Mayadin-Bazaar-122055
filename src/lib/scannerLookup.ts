import { db } from "./firebase";
import { collection, query, where, getDocs, doc, getDoc, updateDoc, setDoc, serverTimestamp } from "firebase/firestore";

export interface ScannedProduct {
  id: string;
  barcode: string;
  sku: string;
  nameBn: string;
  nameEn: string;
  category: string;
  categoryId: string;
  price: number;
  discountPrice?: number;
  discount?: string;
  stock: number;
  costPrice?: number; // For Seller/Admin
  margin?: string;
  weight?: string;
  unit?: string;
  image: string;
  seller: {
    id: string;
    name: string;
    phone: string;
    rating: number;
    shopName: string;
    verified: boolean;
  };
  descriptionBn?: string;
  origin?: string;
}

export interface ScannedOrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  barcode?: string;
  weight?: string;
  image?: string;
}

export interface ScannedOrder {
  id: string;
  orderNumber: string;
  qrPayload: string;
  customer: {
    name: string;
    phone: string;
    email?: string;
    address: string;
    deliveryArea: string;
  };
  items: ScannedOrderItem[];
  subtotal: number;
  deliveryCharge: number;
  discount: number;
  total: number;
  paymentMethod: "cod" | "bkash" | "nagad" | "card";
  paymentStatus: "paid" | "pending" | "failed";
  status: "pending" | "confirmed" | "processing" | "packed" | "out_for_delivery" | "delivered" | "cancelled";
  verificationPin: string;
  riderName?: string;
  riderPhone?: string;
  createdAt: string;
  updatedAt: string;
  deliveryNotes?: string;
}

export interface ScannedCoupon {
  id: string;
  code: string;
  title: string;
  discountBn: string;
  discountAmount: number;
  discountType: "fixed" | "percent";
  minSpend: number;
  expiresAt: string;
  category?: string;
  descriptionBn: string;
}

export type ScanLookupResult =
  | { type: "product"; data: ScannedProduct }
  | { type: "order"; data: ScannedOrder }
  | { type: "coupon"; data: ScannedCoupon }
  | { type: "unknown"; rawCode: string };

// Comprehensive pre-seeded dataset for fallback & instant scanning
export const CATALOG_PRODUCTS: ScannedProduct[] = [
  {
    id: "food-1",
    barcode: "894110001001",
    sku: "AMB-FOOD-001",
    nameBn: "মিনিকেট চাল (প্রিমিয়াম)",
    nameEn: "Miniket Rice Premium",
    category: "খাদ্য বাজার",
    categoryId: "cat1",
    price: 85,
    discountPrice: 78,
    discount: "১০% ছাড়",
    stock: 145,
    costPrice: 65,
    margin: "২০%",
    weight: "১ কেজি",
    unit: "কেজি",
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80",
    seller: {
      id: "sel-01",
      name: "মেসার্স আল মায়াদিন এগ্রো",
      shopName: "আল মায়াদিন ডিরেক্ট ফার্ম",
      phone: "০১৭৮৯-৪৫৬১২৩",
      rating: 4.9,
      verified: true,
    },
    descriptionBn: "১০০% ঝরঝরে ও সুস্বাদু প্রিমিয়াম মিনিকেট চাল, সরাসরি চাতাল থেকে সংগৃহীত।",
    origin: "দিনাজপুর, বাংলাদেশ"
  },
  {
    id: "food-5",
    barcode: "894110001002",
    sku: "AMB-FOOD-005",
    nameBn: "খাঁটি সরিষার তেল (ঘানি ভাঙ্গা)",
    nameEn: "Pure Mustard Oil",
    category: "খাদ্য বাজার",
    categoryId: "cat1",
    price: 360,
    discountPrice: 320,
    discount: "১১% ছাড়",
    stock: 62,
    costPrice: 260,
    margin: "২৩%",
    weight: "১ লিটার",
    unit: "লিটার",
    image: "https://images.unsplash.com/photo-1474979266404-7eaacabc88c5?w=400&q=80",
    seller: {
      id: "sel-02",
      name: "রাধুনি পিওর ন্যাচারালস",
      shopName: "অর্গানিক অয়েল মিল",
      phone: "০১৯১১-২২৩৩৪৪",
      rating: 4.8,
      verified: true,
    },
    descriptionBn: "ঘানি ভাঙ্গা প্রাকৃতিক ঝাঁঝালো খাঁটি সরিষার তেল। কোনো রাসায়নিক মিশ্রিত নেই।",
    origin: "সিরাজগঞ্জ"
  },
  {
    id: "food-6",
    barcode: "894110001003",
    sku: "AMB-FOOD-006",
    nameBn: "সুন্দরবনের খাঁটি মধু",
    nameEn: "Sundarbans Raw Honey",
    category: "খাদ্য বাজার",
    categoryId: "cat1",
    price: 850,
    discountPrice: 750,
    discount: "১২% ছাড়",
    stock: 28,
    costPrice: 580,
    margin: "২৯%",
    weight: "১ কেজি",
    unit: "কেজি",
    image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&q=80",
    seller: {
      id: "sel-03",
      name: "মৌয়াল ন্যাচারাল কালেকশন",
      shopName: "সুন্দরবন মধুঘর",
      phone: "০১৬৭৮-৯৯৮৮৭৭",
      rating: 5.0,
      verified: true,
    },
    descriptionBn: "সুন্দরবনের প্রাকৃতিক চাকের অপরিশোধিত ১০০% খাঁটি প্রাকৃতিক মধু।",
    origin: "সুন্দরবন"
  },
  {
    id: "beauty-1",
    barcode: "894120002001",
    sku: "AMB-BEAUTY-001",
    nameBn: "রোলেজ মেকআপ কিট (অল-ইন-ওয়ান)",
    nameEn: "Rose Luxe Makeup Kit Pro",
    category: "রূপসজ্জা বাজার",
    categoryId: "cat2",
    price: 1450,
    discountPrice: 1199,
    discount: "১৭% ছাড়",
    stock: 40,
    costPrice: 850,
    margin: "৪১%",
    weight: "৪৫০ গ্রাম",
    unit: "পিস",
    image: "https://images.unsplash.com/photo-1512496011931-a2c388278ab0?w=400&q=80",
    seller: {
      id: "sel-04",
      name: "গ্ল্যামার ওয়ার্ল্ড বিডি",
      shopName: "গ্ল্যামার লাক্সারি কসমেটিকস",
      phone: "০১৮১২-৩৪৫৬৭৮",
      rating: 4.7,
      verified: true,
    },
    descriptionBn: "আন্তর্জাতিক মানের আইশ্যাডো, লিপস্টিক ও হাইলাইটার সমৃদ্ধ প্রফেশনাল কিট।",
    origin: "ইম্পোর্টেড (কোরিয়া)"
  },
  {
    id: "clothing-1",
    barcode: "894130003001",
    sku: "AMB-CLOTH-001",
    nameBn: "প্রিমিয়াম লিনেন শার্ট",
    nameEn: "Men's Premium Linen Shirt",
    category: "কাপড় ও পরিধান বাজার",
    categoryId: "cat3",
    price: 2950,
    discountPrice: 2450,
    discount: "১৭% ছাড়",
    stock: 55,
    costPrice: 1600,
    margin: "৫৩%",
    weight: "১ পিস (L / XL)",
    unit: "পিস",
    image: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=400&q=80",
    seller: {
      id: "sel-05",
      name: "রয়াল ফ্যাশন হাউস",
      shopName: "রয়াল মেনজ কালেকশন",
      phone: "০১৭২২-৩৩৪৪৫৫",
      rating: 4.8,
      verified: true,
    },
    descriptionBn: "১০০% পিওর কটন লিনেন ফ্যাব্রিক। গ্রীষ্ম ও যেকোনো অনুষ্ঠানে আরামদায়ক।",
    origin: "ঢাকা"
  },
  {
    id: "gift-1",
    barcode: "894140004001",
    sku: "AMB-GIFT-001",
    nameBn: "লাক্সারি হ্যান্ডমেড গিফট বক্স",
    nameEn: "Luxury Celebration Gift Hamper",
    category: "উপহার বাজার",
    categoryId: "cat4",
    price: 1850,
    discountPrice: 1550,
    discount: "১৬% ছাড়",
    stock: 19,
    costPrice: 980,
    margin: "৫৮%",
    weight: "১ বক্স",
    unit: "বক্স",
    image: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400&q=80",
    seller: {
      id: "sel-06",
      name: "উপহার সম্ভার",
      shopName: "মেমোরিজ অ্যান্ড গিফটস",
      phone: "০১৯৩৩-৪৪৫৫৬৬",
      rating: 4.9,
      verified: true,
    },
    descriptionBn: "প্রিয়জনের জন্মদিনের বা বার্ষিকীর জন্য স্পেশাল চকলেট ও উইশিং কার্ড সহ বক্স।",
    origin: "ঢাকা"
  },
  {
    id: "fashion-1",
    barcode: "894150005001",
    sku: "AMB-FASH-001",
    nameBn: "লেদার ল্যাপটপ ব্যাগ (ওয়াটারপ্রুফ)",
    nameEn: "Genuine Leather Laptop Bag 15.6 Inch",
    category: "ব্যাগ ও ফ্যাশন অ্যাক্সেসরিজ বাজার",
    categoryId: "cat5",
    price: 2450,
    discountPrice: 1950,
    discount: "২০% ছাড়",
    stock: 34,
    costPrice: 1250,
    margin: "৫৬%",
    weight: "৭০০ গ্রাম",
    unit: "পিস",
    image: "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=400&q=80",
    seller: {
      id: "sel-07",
      name: "লেদার ক্রাফট বিডি",
      shopName: "স্মার্ট লেদার গ্যালারি",
      phone: "০১৬১১-২২৩৩৪৪",
      rating: 4.8,
      verified: true,
    },
    descriptionBn: "প্রিমিয়াম জেনুইন ওয়াটারপ্রুফ লেদার ব্যাকপ্যাক, অফিস ও ভ্রমণের জন্য আদর্শ।",
    origin: "হাজারীবাগ, ঢাকা"
  },
  {
    id: "islamic-1",
    barcode: "894160006001",
    sku: "AMB-ISLAM-001",
    nameBn: "ডিজিটাল তসবিহ ও প্রিমিয়াম জায়নামাজ সেট",
    nameEn: "Digital Tasbeeh & Luxury Prayer Mat",
    category: "ইসলামিক বাজার",
    categoryId: "cat6",
    price: 950,
    discountPrice: 790,
    discount: "১৭% ছাড়",
    stock: 75,
    costPrice: 480,
    margin: "৬৫%",
    weight: "৬০০ গ্রাম",
    unit: "সেট",
    image: "https://images.unsplash.com/photo-1601053073740-410a563ee9f3?w=400&q=80",
    seller: {
      id: "sel-08",
      name: "মদিনা ইসলামিক স্টোর",
      shopName: "আল হিদায়াহ পাবলিকেশন্স",
      phone: "০১৭৫০-১১২২৩৩",
      rating: 5.0,
      verified: true,
    },
    descriptionBn: "তুর্কি মখমল কাপড়ে তৈরি আরামদায়ক জায়নামাজ ও এলইডি ডিজিটাল তসবিহ।",
    origin: "টার্কি / ঢাকা"
  },
  {
    id: "electronics-1",
    barcode: "894170007001",
    sku: "AMB-ELEC-001",
    nameBn: "আল্ট্রা স্মার্টওয়াচ ৮ (AMOLED ডিসপ্লে)",
    nameEn: "Ultra Smartwatch 8 Series AMOLED",
    category: "ইলেকট্রনিক্স বাজার",
    categoryId: "cat7",
    price: 3200,
    discountPrice: 2650,
    discount: "১৭% ছাড়",
    stock: 48,
    costPrice: 1900,
    margin: "৩৯%",
    weight: "১৫০ গ্রাম",
    unit: "পিস",
    image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400&q=80",
    seller: {
      id: "sel-09",
      name: "স্মার্ট টেক বিডি",
      shopName: "গ্যাজেট জোন বাংলাদেশ",
      phone: "০১৯৮৮-৭৭৬৬৫৫",
      rating: 4.9,
      verified: true,
    },
    descriptionBn: "ব্লুটুথ কলিং, হার্ট রেট সেন্সর ও ৭ দিনের ব্যাটারি লাইফ সহ প্রিমিয়াম স্মার্টওয়াচ।",
    origin: "ইম্পোর্টেড"
  },
  {
    id: "education-1",
    barcode: "894180008001",
    sku: "AMB-EDU-001",
    nameBn: "প্যারাডক্সিক্যাল সাজিদ ১ ও ২ (বই সেট)",
    nameEn: "Paradoxical Sajid Combo Vol 1 & 2",
    category: "বই ও শিক্ষা বাজার",
    categoryId: "cat8",
    price: 650,
    discountPrice: 520,
    discount: "২০% ছাড়",
    stock: 92,
    costPrice: 340,
    margin: "৫৩%",
    weight: "৪৫০ গ্রাম",
    unit: "সেট",
    image: "https://images.unsplash.com/photo-1491841573634-28140fc7ced7?w=400&q=80",
    seller: {
      id: "sel-10",
      name: "গার্ডিয়ান পাবলিকেশন্স",
      shopName: "বইঘর ঢাকা",
      phone: "০১৭০৯-৮৮৭৭৬৬",
      rating: 5.0,
      verified: true,
    },
    descriptionBn: "আরিফ আজাদ রচিত বহুল পঠিত বিশ্বাস ও যুক্তি বিষয়ক জনপ্রিয় বই সেট।",
    origin: "বাংলাবাজার, ঢাকা"
  }
];

export const DEMO_ORDERS: ScannedOrder[] = [
  {
    id: "ord-8492",
    orderNumber: "AMB-8492",
    qrPayload: "ORD-AMB-8492",
    customer: {
      name: "তানভীর আহমেদ",
      phone: "০১৭৮৯-১২৩৪৫৬",
      email: "tanvir.ahmed@gmail.com",
      address: "ফ্ল্যাট ৪বি, বাড়ি ১২, রোড ৭, সেক্টর ৪, উত্তরা",
      deliveryArea: "উত্তরা, ঢাকা"
    },
    items: [
      { productId: "food-1", name: "মিনিকেট চাল (প্রিমিয়াম)", quantity: 2, unitPrice: 78, weight: "১ কেজি", image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80", barcode: "894110001001" },
      { productId: "food-5", name: "খাঁটি সরিষার তেল (ঘানি ভাঙ্গা)", quantity: 1, unitPrice: 320, weight: "১ লিটার", image: "https://images.unsplash.com/photo-1474979266404-7eaacabc88c5?w=400&q=80", barcode: "894110001002" },
      { productId: "food-6", name: "সুন্দরবনের খাঁটি মধু", quantity: 1, unitPrice: 750, weight: "১ কেজি", image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&q=80", barcode: "894110001003" },
    ],
    subtotal: 1226,
    deliveryCharge: 60,
    discount: 0,
    total: 1286,
    paymentMethod: "bkash",
    paymentStatus: "paid",
    status: "out_for_delivery",
    verificationPin: "4892",
    riderName: "মোঃ সজীব হোসেন (রাইডার)",
    riderPhone: "০১৯৮৭-৬৫৪৩২১",
    createdAt: "আজ, সকাল ১০:৩০",
    updatedAt: "আজ, দুপুর ০১:১৫",
    deliveryNotes: "গেট বন্ধ থাকলে ফোন দিন, ৪ তলায় পৌঁছে দিতে হবে।"
  },
  {
    id: "ord-9124",
    orderNumber: "AMB-9124",
    qrPayload: "ORD-AMB-9124",
    customer: {
      name: "সাবরিনা রহমান",
      phone: "০১৮১৬-৭৮৯০১২",
      email: "sabrina.r@yahoo.com",
      address: "হাউজ ২৫/এ, রোড ৩, ধানমন্ডি",
      deliveryArea: "ধানমন্ডি, ঢাকা"
    },
    items: [
      { productId: "beauty-1", name: "রোলেজ মেকআপ কিট (অল-ইন-ওয়ান)", quantity: 1, unitPrice: 1199, weight: "৪৫০ গ্রাম", image: "https://images.unsplash.com/photo-1512496011931-a2c388278ab0?w=400&q=80", barcode: "894120002001" },
    ],
    subtotal: 1199,
    deliveryCharge: 60,
    discount: 50,
    total: 1209,
    paymentMethod: "cod",
    paymentStatus: "pending",
    status: "processing",
    verificationPin: "9124",
    riderName: "অ্যাসাইন করা হয়নি",
    createdAt: "গতকাল, বিকাল ০৫:২০",
    updatedAt: "আজ, সকাল ০৯:০০",
    deliveryNotes: "ক্যাশ অন ডেলিভারি, অনুগ্রহ করে চেঞ্জ টাকা রাখবেন।"
  },
  {
    id: "ord-7731",
    orderNumber: "AMB-7731",
    qrPayload: "ORD-AMB-7731",
    customer: {
      name: "মোঃ রফিকুল ইসলাম",
      phone: "০১৭৩৩-৯৮৭৬৫৪",
      email: "rafiq.islam@outlook.com",
      address: "প্লট ৯৮, ব্লক ডি, বসুন্ধরা আ/এ",
      deliveryArea: "বসুন্ধরা, ঢাকা"
    },
    items: [
      { productId: "electronics-1", name: "আল্ট্রা স্মার্টওয়াচ ৮ (AMOLED ডিসপ্লে)", quantity: 1, unitPrice: 2650, weight: "১ পিস", image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400&q=80", barcode: "894170007001" },
      { productId: "islamic-1", name: "ডিজিটাল তসবিহ ও জায়নামাজ সেট", quantity: 1, unitPrice: 790, weight: "৬০০ গ্রাম", image: "https://images.unsplash.com/photo-1601053073740-410a563ee9f3?w=400&q=80", barcode: "894160006001" },
    ],
    subtotal: 3440,
    deliveryCharge: 60,
    discount: 100,
    total: 3400,
    paymentMethod: "nagad",
    paymentStatus: "paid",
    status: "packed",
    verificationPin: "7731",
    riderName: "রাকিবুল হাসান (পিকআপ টিম)",
    riderPhone: "০১৬৭৭-৮৮৯৯০০",
    createdAt: "আজ, সকাল ০৮:০০",
    updatedAt: "আজ, দুপুর ১২:০০",
  }
];

export const DEMO_COUPONS: ScannedCoupon[] = [
  {
    id: "coup-1",
    code: "MAYADIN50",
    title: "মেগা ক্যাশব্যাক অফার",
    discountBn: "৳৫০ ফ্ল্যাট ছাড়",
    discountAmount: 50,
    discountType: "fixed",
    minSpend: 500,
    expiresAt: "৩১ ডিসেম্বর, ২০২৬",
    category: "সকল পণ্য",
    descriptionBn: "যেকোনো অর্ডারে সর্বনিম্ন ৫০০ টাকা কেনাকাটায় পাচ্ছেন সরাসরি ৫০ টাকা ক্যাশ ডিসকাউন্ট।"
  },
  {
    id: "coup-2",
    code: "EID100",
    title: "ঈদ স্পেশাল ভাউচার",
    discountBn: "৳১০০ ইনস্ট্যান্ট ছাড়",
    discountAmount: 100,
    discountType: "fixed",
    minSpend: 1000,
    expiresAt: "৩১ ডিসেম্বর, ২০২৬",
    category: "পোশাক ও উপহার",
    descriptionBn: "১০০০ টাকার পোশাকে বা উপহার কেনাকাটায় পান সরাসরি ১০০ টাকা নিশ্চিত ছাড়।"
  },
  {
    id: "coup-3",
    code: "WELCOME10",
    title: "প্রথম অর্ডার ডিসকাউন্ট",
    discountBn: "১০% মেগা ছাড়",
    discountAmount: 10,
    discountType: "percent",
    minSpend: 300,
    expiresAt: "৩১ ডিসেম্বর, ২০২৬",
    category: "খাদ্য ও গ্রোসারি",
    descriptionBn: "আল মায়াদিন বাজারের সকল খাদ্য ও অর্গানিক পণ্যে পাচ্ছেন ১০% বিশেষ ছাড়।"
  }
];

// Helper to lookup barcode or QR code in Firebase or Local Catalog
export async function lookupBarcodeOrQR(code: string): Promise<ScanLookupResult> {
  const cleanCode = code.trim();
  if (!cleanCode) {
    return { type: "unknown", rawCode: code };
  }

  // 0. Check if it's a Coupon / Promo Voucher code
  const isCoupon = cleanCode.toUpperCase().startsWith("COUPON-") ||
                   cleanCode.toUpperCase().startsWith("VOUCHER-") ||
                   cleanCode.toUpperCase() === "MAYADIN50" ||
                   cleanCode.toUpperCase() === "EID100" ||
                   cleanCode.toUpperCase() === "WELCOME10";

  if (isCoupon) {
    const rawCoupon = cleanCode.toUpperCase().replace(/^(COUPON-|VOUCHER-)/i, "");
    const matchedCoupon = DEMO_COUPONS.find(
      (c) => c.code.toUpperCase() === rawCoupon || c.code.toUpperCase() === cleanCode.toUpperCase()
    );
    if (matchedCoupon) {
      return { type: "coupon", data: matchedCoupon };
    }
  }

  // 1. Check if it's an Order Code (starts with ORD-, AMB-, or matches order payload)
  const isOrderCode = cleanCode.toUpperCase().startsWith("ORD-") || 
                      cleanCode.toUpperCase().startsWith("AMB-") || 
                      cleanCode.toUpperCase().includes("ORDER");

  if (isOrderCode) {
    // Try Firestore orders first
    try {
      const q = query(
        collection(db, "orders"),
        where("orderNumber", "==", cleanCode.replace(/^ORD-/i, ""))
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const docData = snapshot.docs[0].data();
        return {
          type: "order",
          data: {
            id: snapshot.docs[0].id,
            orderNumber: docData.orderNumber || snapshot.docs[0].id,
            qrPayload: cleanCode,
            customer: docData.shippingAddress || {
              name: docData.customerName || "সম্মানিত ক্রেতা",
              phone: docData.phone || "",
              address: docData.address || "",
              deliveryArea: docData.deliveryArea || "ঢাকা",
            },
            items: docData.items || [],
            subtotal: docData.subtotal || 0,
            deliveryCharge: docData.deliveryCharge || 60,
            discount: docData.discount || 0,
            total: docData.total || 0,
            paymentMethod: docData.paymentMethod || "cod",
            paymentStatus: docData.paymentStatus || "pending",
            status: docData.status || docData.currentStatus || "processing",
            verificationPin: docData.verificationPin || "0000",
            riderName: docData.riderName,
            riderPhone: docData.riderPhone,
            createdAt: docData.createdAt ? new Date(docData.createdAt).toLocaleString("bn-BD") : "আজ",
            updatedAt: docData.updatedAt ? new Date(docData.updatedAt).toLocaleString("bn-BD") : "আজ",
            deliveryNotes: docData.notes,
          }
        };
      }
    } catch (err) {
      console.warn("Firestore Order Lookup fallback:", err);
    }

    // Match in Demo Orders
    const matchedOrder = DEMO_ORDERS.find(
      (o) =>
        o.qrPayload.toUpperCase() === cleanCode.toUpperCase() ||
        o.orderNumber.toUpperCase() === cleanCode.toUpperCase() ||
        o.id.toUpperCase() === cleanCode.toUpperCase() ||
        `ORD-${o.orderNumber}`.toUpperCase() === cleanCode.toUpperCase()
    );

    if (matchedOrder) {
      return { type: "order", data: matchedOrder };
    }
  }

  // 2. Check if it's a Product Barcode or SKU or Product ID
  try {
    // Check Firestore products by barcode
    const q1 = query(collection(db, "products"), where("barcode", "==", cleanCode));
    const snap1 = await getDocs(q1);
    if (!snap1.empty) {
      const pDoc = snap1.docs[0];
      const pData = pDoc.data();
      return {
        type: "product",
        data: {
          id: pDoc.id,
          barcode: pData.barcode || cleanCode,
          sku: pData.sku || `SKU-${pDoc.id}`,
          nameBn: pData.nameBn || pData.name || "পণ্য",
          nameEn: pData.nameEn || pData.name || "Product",
          category: pData.category || "খাদ্য বাজার",
          categoryId: pData.categoryId || "cat1",
          price: Number(pData.price || 0),
          discountPrice: pData.discountPrice ? Number(pData.discountPrice) : undefined,
          discount: pData.discount,
          stock: Number(pData.stock ?? 50),
          costPrice: pData.costPrice ? Number(pData.costPrice) : Math.round(Number(pData.price || 0) * 0.75),
          margin: pData.margin || "২৫%",
          weight: pData.weight || pData.unit,
          unit: pData.unit || "পিস",
          image: pData.image || (pData.images && pData.images[0]) || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80",
          seller: pData.seller || {
            id: "sel-main",
            name: "আল মায়াদিন অথরাইজড সেলার",
            shopName: "আল মায়াদিন স্টোর",
            phone: "০১৭০০-০০০০০০",
            rating: 4.9,
            verified: true,
          },
          descriptionBn: pData.descriptionBn || pData.description,
        }
      };
    }

    // Check Firestore products by ID
    const directDoc = await getDoc(doc(db, "products", cleanCode));
    if (directDoc.exists()) {
      const pData = directDoc.data();
      return {
        type: "product",
        data: {
          id: directDoc.id,
          barcode: pData.barcode || cleanCode,
          sku: pData.sku || `SKU-${directDoc.id}`,
          nameBn: pData.nameBn || pData.name || "পণ্য",
          nameEn: pData.nameEn || pData.name || "Product",
          category: pData.category || "খাদ্য বাজার",
          categoryId: pData.categoryId || "cat1",
          price: Number(pData.price || 0),
          discountPrice: pData.discountPrice ? Number(pData.discountPrice) : undefined,
          discount: pData.discount,
          stock: Number(pData.stock ?? 50),
          costPrice: pData.costPrice ? Number(pData.costPrice) : Math.round(Number(pData.price || 0) * 0.75),
          margin: pData.margin || "২৫%",
          weight: pData.weight || pData.unit,
          unit: pData.unit || "পিস",
          image: pData.image || (pData.images && pData.images[0]) || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80",
          seller: pData.seller || {
            id: "sel-main",
            name: "আল মায়াদিন অথরাইজড সেলার",
            shopName: "আল মায়াদিন স্টোর",
            phone: "০১৭০০-০০০০০০",
            rating: 4.9,
            verified: true,
          },
          descriptionBn: pData.descriptionBn || pData.description,
        }
      };
    }
  } catch (err) {
    console.warn("Firestore Product Lookup fallback:", err);
  }

  // 3. Check in Pre-seeded Catalog
  const matchedProd = CATALOG_PRODUCTS.find(
    (p) =>
      p.barcode === cleanCode ||
      p.sku.toUpperCase() === cleanCode.toUpperCase() ||
      p.id.toLowerCase() === cleanCode.toLowerCase()
  );

  if (matchedProd) {
    return { type: "product", data: matchedProd };
  }

  // 4. Also check if the raw text matches any product title/keyword
  const keywordMatch = CATALOG_PRODUCTS.find(
    (p) =>
      p.nameBn.includes(cleanCode) ||
      p.nameEn.toLowerCase().includes(cleanCode.toLowerCase())
  );

  if (keywordMatch) {
    return { type: "product", data: keywordMatch };
  }

  return { type: "unknown", rawCode: cleanCode };
}

// Update Stock directly (Seller/Admin Action)
export async function updateProductStockInDb(productId: string, newStock: number): Promise<boolean> {
  try {
    const prodRef = doc(db, "products", productId);
    await updateDoc(prodRef, {
      stock: newStock,
      updatedAt: Date.now(),
    });
  } catch (err) {
    console.warn("Local update fallback for stock:", err);
  }

  // Update in local in-memory catalog as well
  const found = CATALOG_PRODUCTS.find((p) => p.id === productId);
  if (found) {
    found.stock = newStock;
  }
  return true;
}

// Update Order Status directly (Pickup/Delivery / Admin Action)
export async function updateOrderStatusInDb(
  orderId: string,
  newStatus: ScannedOrder["status"],
  deliveryNote?: string
): Promise<boolean> {
  try {
    const orderRef = doc(db, "orders", orderId);
    await updateDoc(orderRef, {
      status: newStatus,
      currentStatus: newStatus,
      updatedAt: Date.now(),
      deliveryNotes: deliveryNote || "",
    });
  } catch (err) {
    console.warn("Local update fallback for order:", err);
  }

  // Update in local demo orders
  const found = DEMO_ORDERS.find((o) => o.id === orderId || o.orderNumber === orderId);
  if (found) {
    found.status = newStatus;
    if (newStatus === "delivered") {
      found.paymentStatus = "paid";
    }
    if (deliveryNote) found.deliveryNotes = deliveryNote;
    found.updatedAt = "এইমাত্র হালনাগাদ";
  }
  return true;
}
