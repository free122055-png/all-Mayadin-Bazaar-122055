export interface FoodProduct {
  id: string;
  nameBn: string;
  brand: string;
  category: string;
  unit: string; // e.g. "কেজি", "লিটার", "পিস", "গ্রাম"
  unitWeightKg: number; // For weight-based delivery calculation
  pricePerUnit: number;
  originalPrice?: number;
  image: string;
  minQty?: number;
  stepQty?: number;
  badge?: string;
  description?: string;
}

export const defaultFoodCatalog: FoodProduct[] = [
  {
    id: "food-1",
    nameBn: "মিনিকেট চাল (প্রিমিয়াম)",
    brand: "প্রাণ / এসিআই",
    category: "চাল ও আটা",
    unit: "কেজি",
    unitWeightKg: 1,
    pricePerUnit: 78,
    originalPrice: 85,
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80",
    badge: "জনপ্রিয়",
    description: "১০০% ঝরঝরে ও সুস্বাদু প্রিমিয়াম মিনিকেট চাল।"
  },
  {
    id: "food-2",
    nameBn: "মসুর ডাল (দেশি চিকন)",
    brand: "দেশি ফ্রেশ",
    category: "ডাল",
    unit: "কেজি",
    unitWeightKg: 1,
    pricePerUnit: 140,
    originalPrice: 155,
    image: "https://images.unsplash.com/photo-1515942400420-2b98fed1f515?w=400&q=80",
    badge: "সেরা মান",
    description: "খাঁটি দেশি বাছাইকৃত সোনালী মসুর ডাল।"
  },
  {
    id: "food-3",
    nameBn: "তীর ফর্টিফাইড সয়াবিন তেল",
    brand: "তীর (Teer)",
    category: "তেল",
    unit: "লিটার",
    unitWeightKg: 0.92,
    pricePerUnit: 190,
    originalPrice: 205,
    image: "https://images.unsplash.com/photo-1474979266404-7eaacabc88c5?w=400&q=80",
    badge: "১০% ছাড়",
    description: "ভিটামিন এ ও ডি সমৃদ্ধ বিশুদ্ধ পরিশোধিত সয়াবিন তেল।"
  },
  {
    id: "food-4",
    nameBn: "চিনিগুঁড়া পোলাও চাল",
    brand: "প্রাণ অ্যারোমেটিক",
    category: "চাল ও আটা",
    unit: "কেজি",
    unitWeightKg: 1,
    pricePerUnit: 124,
    originalPrice: 140,
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80",
    badge: "সুগন্ধি",
    description: "উৎসব ও সেরা রান্নার জন্য সেরা সুবাসিত চিনিগুঁড়া চাল।"
  },
  {
    id: "food-5",
    nameBn: "খাঁটি সরিষার তেল (ঘানি ভাঙ্গা)",
    brand: "রাধুনি (Radhuni)",
    category: "তেল",
    unit: "লিটার",
    unitWeightKg: 0.95,
    pricePerUnit: 320,
    originalPrice: 360,
    image: "https://images.unsplash.com/photo-1474979266404-7eaacabc88c5?w=400&q=80",
    badge: "খাটি",
    description: "তাজা খাঁটি সরিষার প্রাকৃতিক ঝাঁঝালো স্বাদ।"
  },
  {
    id: "food-6",
    nameBn: "সুন্দরবনের খাঁটি মধু",
    brand: "অল মায়াদিন পিওর",
    category: "মধু",
    unit: "কেজি",
    unitWeightKg: 1,
    pricePerUnit: 750,
    originalPrice: 850,
    image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&q=80",
    badge: "১০০% প্রাকৃতিক",
    description: "সুন্দরবনের প্রাকৃতিক চাকের ১০০% অপরিশোধিত বিশুদ্ধ মধু।"
  },
  {
    id: "food-7",
    nameBn: "মুগ ডাল (ভাজা)",
    brand: "ফ্রেশ (Fresh)",
    category: "ডাল",
    unit: "কেজি",
    unitWeightKg: 1,
    pricePerUnit: 165,
    originalPrice: 180,
    image: "https://images.unsplash.com/photo-1515942400420-2b98fed1f515?w=400&q=80",
    description: "মুচমুচে ভাজা সোনালী প্রিমিয়াম মুগ ডাল।"
  },
  {
    id: "food-8",
    nameBn: "ফার্মের তাজা লাল ডিম",
    brand: "খামারি ফ্রেশ",
    category: "ডিম ও প্রোটিন",
    unit: "পিস",
    unitWeightKg: 0.06,
    pricePerUnit: 13,
    originalPrice: 15,
    image: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400&q=80",
    badge: "তাজা",
    description: "প্রতিদিন খামার থেকে সংগৃহীত পুষ্টিকর তাজা লাল ডিম।"
  },
  {
    id: "food-9",
    nameBn: "হোলহুইট লাল আটা",
    brand: "তীর / এসিআই",
    category: "চাল ও আটা",
    unit: "কেজি",
    unitWeightKg: 1,
    pricePerUnit: 55,
    originalPrice: 62,
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80",
    description: "ফাইবার সমৃদ্ধ পুষ্টিকর খাঁটি লাল গমের আটা।"
  },
  {
    id: "food-10",
    nameBn: "আমেরিকান কাঠবাদাম (Almond)",
    brand: "প্রিমিয়াম নাটস",
    category: "বাদাম",
    unit: "গ্রাম",
    unitWeightKg: 0.25,
    pricePerUnit: 310,
    originalPrice: 350,
    image: "https://images.unsplash.com/photo-1513274271673-820875b11109?w=400&q=80",
    badge: "২৫০ গ্রাম প্যাক",
    description: "খাস্তা ও পুষ্টিকর তাজা প্রিমিয়াম কোয়ালিটি কাঠবাদাম।"
  },
  {
    id: "food-11",
    nameBn: "হলুদ গুঁড়া (প্রিমিয়াম গ্রেড)",
    brand: "রাধুনি (Radhuni)",
    category: "মসলা",
    unit: "গ্রাম",
    unitWeightKg: 0.2,
    pricePerUnit: 75,
    originalPrice: 85,
    image: "https://images.unsplash.com/photo-1532336414038-cf19250c5757?w=400&q=80",
    badge: "২০০ গ্রাম",
    description: "বিশুদ্ধ হলুদের প্রাকৃতিক সোনালী রঙ ও সুবাস।"
  },
  {
    id: "food-12",
    nameBn: "গাভী খাঁটি ঘি",
    brand: "বাঘাবাড়ী পিওর",
    category: "ঘি ও বাটার",
    unit: "কেজি",
    unitWeightKg: 0.5,
    pricePerUnit: 790,
    originalPrice: 850,
    image: "https://images.unsplash.com/photo-1589927986089-35812388d1f4?w=400&q=80",
    badge: "৫০০ গ্রাম প্যাক",
    description: "গাভীর খাঁটি দুধের ননী থেকে তৈরি মনমাতানো সুগন্ধি ঘি।"
  }
];

export const foodCategoryFilters = [
  "সব পণ্য",
  "চাল ও আটা",
  "ডাল",
  "তেল",
  "মসলা",
  "মধু",
  "বাদাম",
  "ডিম ও প্রোটিন"
];
