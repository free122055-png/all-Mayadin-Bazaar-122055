import React, { useState, useEffect } from "react";
import { 
  Plus, Edit3, Trash2, GripVertical, Upload, X, Check, Image as ImageIcon, 
  Sparkles, AlertCircle, CheckCircle2, ShoppingBag, Tag, Package, DollarSign,
  Layers, Info, FileText, ShieldCheck, Truck, Eye
} from "lucide-react";
import { compressImage } from "../../lib/imageUtils";
import { db } from "../../lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export interface BannerProductOffer {
  productName: string;
  regularPrice: number;
  offerPrice: number;
  discountText?: string;
  unitWeight?: string;
  description?: string;
  features?: string[];
  images?: string[];
  stock?: number;
  inStock?: boolean;
  deliveryNote?: string;
}

export interface CategoryBannerItem {
  id: string;
  title: string;
  subtitle: string;
  discountText: string;
  image: string;
  btnText?: string;
  bgGradient?: string;
  offerProduct?: BannerProductOffer;
}

export interface CategoryBanners {
  categoryId: string;
  categoryNumber: number;
  categoryNameBn: string;
  categoryIcon: string;
  banners: CategoryBannerItem[];
}

export const INITIAL_CATEGORY_BANNERS: CategoryBanners[] = [
  {
    categoryId: "cat1",
    categoryNumber: 1,
    categoryNameBn: "খাদ্য বাজার",
    categoryIcon: "🛒",
    banners: [
      {
        id: "b_cat1_1",
        title: "তাজা খাবার",
        subtitle: "ন্যাচারাল ও ফ্রেশ পণ্য",
        discountText: "২০% ছাড়",
        image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80",
        btnText: "এই পণ্য ক্রয় করুন →",
        bgGradient: "from-emerald-950/80 via-emerald-900/60 to-transparent",
        offerProduct: {
          productName: "স্পেশাল অর্গানিক ফ্রেশ ফুড প্যাকেজ (মধু, ঘি ও ড্রাই ফ্রুটস)",
          regularPrice: 1450,
          offerPrice: 1150,
          discountText: "২০% ছাড়",
          unitWeight: "১.৫ কেজি কম্বো প্যাক",
          description: "১০০% খাঁটি সুন্দরবনের মধু, গাওয়া ঘি এবং প্রিমিয়াম রোস্টেড কাজু-পেস্তা সমাহার। সেরা পুষ্টি ও সুস্বাস্থ্যের জন্য বিশেষ অফার প্যাকেজ।",
          features: [
            "১০০% খাঁটি ও নির্ভেজাল নিশ্চয়তা",
            "গাওয়া ঘি ৫০০ গ্রাম + মধু ৫০০ গ্রাম + বাদাম ৫০০ গ্রাম",
            "সরাসরি উৎপাদক থেকে সংগৃহীত",
            "ক্যাশ অন ডেলিভারিতে পণ্য বুঝে পেয়ে পেমেন্ট"
          ],
          images: [
            "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80",
            "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&q=80"
          ],
          stock: 35,
          inStock: true,
          deliveryNote: "সারা দেশে ফ্রি ডেলিভারি"
        }
      },
      {
        id: "b_cat1_2",
        title: "বিশুদ্ধ মসলা",
        subtitle: "খাঁটি স্বাদ, খাঁটি জীবন",
        discountText: "১৫% ছাড়",
        image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&q=80",
        btnText: "এই পণ্য ক্রয় করুন →",
        bgGradient: "from-amber-950/80 via-amber-900/60 to-transparent",
        offerProduct: {
          productName: "খাঁটি গুড়া মসলা প্রিমিয়াম কম্বো (হলুদ, মরিচ, ধনিয়া ও জিরা)",
          regularPrice: 850,
          offerPrice: 720,
          discountText: "১৫% ছাড়",
          unitWeight: "১ কেজি (৪ প্রকার মসলা)",
          description: "কোনো প্রকার ভেজাল বা কৃত্রিম রঙ ছাড়া শতভাগ খাঁটি মসলা। খাবারের রঙ ও ঘ্রাণে নিয়ে আসবে ঐতিহ্যবাহী দেশি স্বাদ।",
          features: [
            "কোনো কেমিক্যাল বা কৃত্রিম রঙ নেই",
            "অ্যারোমা সিল করা এয়ারটাইট জার",
            "স্বাদ ও পুষ্টিগুণে শতভাগ খাঁটি",
            "দ্রুততম সময়ে হোম ডেলিভারি"
          ],
          images: [
            "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&q=80"
          ],
          stock: 50,
          inStock: true,
          deliveryNote: "হোম ডেলিভারি ৬০ টাকা"
        }
      },
      {
        id: "b_cat1_3",
        title: "প্রিমিয়াম চাল",
        subtitle: "সেরা মানের নিশ্চয়তা",
        discountText: "১০% ছাড়",
        image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&q=80",
        btnText: "এই পণ্য ক্রয় করুন →",
        bgGradient: "from-stone-950/80 via-stone-900/60 to-transparent",
        offerProduct: {
          productName: "চিনিগুঁড়া পোলাও চাল স্পেশাল প্যাকেজ",
          regularPrice: 380,
          offerPrice: 340,
          discountText: "১০% ছাড়",
          unitWeight: "২ কেজি ব্যাগ",
          description: "দিনাজপুরের বিখ্যাত সুগন্ধি চিনিগুঁড়া চাল। বিশেষ উৎসব ও রান্নায় নিখুঁত ঘ্রাণ ও অতুলনীয় স্বাদ।",
          features: [
            "শতভাগ পুরাতন ও বাছাইকৃত চাল",
            "রান্নায় ভাত ঝরঝরে ও সুবাসিত হয়",
            "কোনো রাসায়নিক পলিশ বা প্রিজারভেটিভ নেই"
          ],
          images: [
            "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&q=80"
          ],
          stock: 60,
          inStock: true
        }
      }
    ]
  },
  {
    categoryId: "cat2",
    categoryNumber: 2,
    categoryNameBn: "রুপসজ্জা বাজার",
    categoryIcon: "✨",
    banners: [
      {
        id: "b_cat2_1",
        title: "ত্বকের যত্নে",
        subtitle: "নতুন সমাধান",
        discountText: "২০% ছাড়",
        image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80",
        btnText: "এই পণ্য ক্রয় করুন →",
        bgGradient: "from-pink-950/80 via-pink-900/60 to-transparent",
        offerProduct: {
          productName: "অর্গানিক ভিটামিন সি গ্লো সিরাম ও ফেসওয়াশ কম্বো",
          regularPrice: 1250,
          offerPrice: 990,
          discountText: "২০% ছাড়",
          unitWeight: "১০০ মিলি + ৫০ মিলি",
          description: "ত্বকের ডার্ক স্পট দূর করে প্রাকৃতিক উজ্জ্বলতা ও কোমলতা ফিরিয়ে আনার বিশ্বস্ত রূপচর্চা প্যাকেজ।",
          features: [
            "ন্যাচারাল ভিটামিন সি ও নিয়াসিনামাইড সমৃদ্ধ",
            "ত্বক উজ্জ্বল ও মসৃণ করে",
            "সব ধরনের ত্বকে ব্যবহার উপযোগী"
          ],
          images: [
            "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80"
          ],
          stock: 40,
          inStock: true,
          deliveryNote: "ফ্রি ডেলিভারি"
        }
      },
      {
        id: "b_cat2_2",
        title: "প্রিমিয়াম কসমেটিক্স",
        subtitle: "নিজেকে করুন আরো সুন্দর",
        discountText: "১৫% ছাড়",
        image: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&q=80",
        btnText: "এই পণ্য ক্রয় করুন →",
        bgGradient: "from-rose-950/80 via-rose-900/60 to-transparent",
        offerProduct: {
          productName: "ম্যাট লিপস্টিক ও হাইলাইটার স্পেশাল বক্স",
          regularPrice: 890,
          offerPrice: 750,
          discountText: "১৫% ছাড়",
          unitWeight: "৩টি শেড কম্বো",
          description: "লং লাস্টিং ওয়াটারপ্রুফ ম্যাট টেক্সচার লিপস্টিক এবং সফট গ্লো হাইলাইটার।",
          features: ["১২ ঘণ্টা লং লাস্টিং", "স্মাজ প্রুফ ফর্মুলা", "প্রিমিয়াম গিফট প্যাকেজিং"],
          images: ["https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&q=80"],
          stock: 25,
          inStock: true
        }
      },
      {
        id: "b_cat2_3",
        title: "চুলের যত্নে",
        subtitle: "প্রাকৃতিক সুরক্ষা",
        discountText: "১০% ছাড়",
        image: "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=800&q=80",
        btnText: "এই পণ্য ক্রয় করুন →",
        bgGradient: "from-orange-950/80 via-orange-900/60 to-transparent",
        offerProduct: {
          productName: "আমলা ও ভৃঙ্গরাজ হারবাল হেয়ার অয়েল প্যাক",
          regularPrice: 550,
          offerPrice: 495,
          discountText: "১০% ছাড়",
          unitWeight: "২০০ মিলি বোতল",
          description: "চুল পড়া বন্ধ করে নতুন চুল গজাতে সহায়তা করে বিশুদ্ধ হারবাল ভেষজ তেল।",
          features: ["২১টি খাঁটি ভেষজ উপাদান", "চুল পড়া হ্রাস করে", "খুশকি প্রতিরোধক"],
          images: ["https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=800&q=80"],
          stock: 30,
          inStock: true
        }
      }
    ]
  },
  {
    categoryId: "cat3",
    categoryNumber: 3,
    categoryNameBn: "কাপড় ও পরিধান",
    categoryIcon: "👕",
    banners: [
      {
        id: "b_cat3_1",
        title: "স্টাইলিশ পাঞ্জাবি",
        subtitle: "ঐতিহ্য ও ফ্যাশনের মেলবন্ধন",
        discountText: "২০% ছাড়",
        image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&q=80",
        btnText: "এই পণ্য ক্রয় করুন →",
        bgGradient: "from-slate-950/80 via-slate-900/60 to-transparent",
        offerProduct: {
          productName: "সেমি লং প্রিমিয়াম সুতি এমব্রয়ডারি পাঞ্জাবি",
          regularPrice: 1850,
          offerPrice: 1480,
          discountText: "২০% ছাড়",
          unitWeight: "সাইজ: ৪০, ৪২, ৪৪",
          description: "উচ্চমানের ১০০% প্রিমিয়াম সুতি ফেব্রিক এবং গলায় সূক্ষ্ম ডিজিটাল এমব্রয়ডারি কারুকাজ। অত্যন্ত আরামদায়ক ও আভিজাত্যপূর্ণ।",
          features: [
            "১০০% সফট কটন ফেব্রিক",
            "কালার গ্যারান্টি",
            "স্মার্ট ফিট সেমি লং কাটিং",
            "যেকোনো অনুষ্ঠানে পরিধানযোগ্য"
          ],
          images: [
            "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&q=80"
          ],
          stock: 20,
          inStock: true,
          deliveryNote: "ফ্রি হোম ডেলিভারি"
        }
      },
      {
        id: "b_cat3_2",
        title: "নতুন কালেকশন",
        subtitle: "সেরা ডিজাইন, সেরা আপনি",
        discountText: "১৫% ছাড়",
        image: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800&q=80",
        btnText: "এই পণ্য ক্রয় করুন →",
        bgGradient: "from-zinc-950/80 via-zinc-900/60 to-transparent",
        offerProduct: {
          productName: "ক্লাসিক প্রিমিয়াম পোলো শার্ট কম্বো (২টি সেট)",
          regularPrice: 1100,
          offerPrice: 935,
          discountText: "১৫% ছাড়",
          unitWeight: "২ পিস সেট",
          description: "এক্সক্লুসিভ পিক ফ্যাব্রিক পোলো শার্ট যা দেবে সর্বোচ্চ কমফোর্ট ও আকর্ষণীয় লুক।",
          features: ["১০০% কম্প্যাক্ট কটন পিক", "ব্রিদেবল ফেব্রিক", "দীর্ঘস্থায়ী কালার"],
          images: ["https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800&q=80"],
          stock: 35,
          inStock: true
        }
      },
      {
        id: "b_cat3_3",
        title: "কমফোর্টেবল পোশাক",
        subtitle: "আরামেই হোক আপনার দিন",
        discountText: "১০% ছাড়",
        image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80",
        btnText: "এই পণ্য ক্রয় করুন →",
        bgGradient: "from-stone-950/80 via-stone-900/60 to-transparent",
        offerProduct: {
          productName: "হোম কমফোর্ট কটন ট্রাউজার ও টি-শার্ট কম্বো",
          regularPrice: 850,
          offerPrice: 765,
          discountText: "১০% ছাড়",
          unitWeight: "১ সেট",
          description: "বাসায় বা ক্যাজুয়াল আউটিংয়ের জন্য আরামদায়ক সুতি ড্রেস সেট।",
          features: ["সফট ও ফ্লেক্সিবল ফেব্রিক", "সাইড পকেট সহ ট্রাউজার"],
          images: ["https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80"],
          stock: 45,
          inStock: true
        }
      }
    ]
  },
  {
    categoryId: "cat4",
    categoryNumber: 4,
    categoryNameBn: "উপহার বাজার",
    categoryIcon: "🎁",
    banners: [
      {
        id: "b_cat4_1",
        title: "প্রিয়জনের জন্য",
        subtitle: "পারফেক্ট উপহার",
        discountText: "২০% ছাড়",
        image: "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=800&q=80",
        btnText: "এই পণ্য ক্রয় করুন →",
        bgGradient: "from-amber-950/80 via-amber-900/60 to-transparent",
        offerProduct: {
          productName: "লাক্সারি গিফট বক্স (চকলেট, পারফিউম ও কাস্টম উইশ কার্ড)",
          regularPrice: 1650,
          offerPrice: 1320,
          discountText: "২০% ছাড়",
          unitWeight: "প্রিমিয়াম গিফট হ্যাম্পার",
          description: "জন্মদিন, বিবাহবার্ষিকী বা বিশেষ যেকোনো উৎসবে প্রিয়জনকে চমকে দিতে আকর্ষণীয় ডিজাইনার গিফট হ্যাম্পার।",
          features: [
            "প্রিমিয়াম ব্র্যান্ডেড চকোলেট বক্স",
            "ফ্রাগ্রেন্স পারফিউম ৫০ মিলি",
            "কাস্টমাইজড উইশ কার্ড ও আকর্ষণীয় রিবন বক্স"
          ],
          images: [
            "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=800&q=80"
          ],
          stock: 18,
          inStock: true,
          deliveryNote: "ফ্রি হোম ডেলিভারি"
        }
      },
      {
        id: "b_cat4_2",
        title: "স্পেশাল গিফট আইটেম",
        subtitle: "মনে রাখার মতো স্মৃতি",
        discountText: "১৫% ছাড়",
        image: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&q=80",
        btnText: "এই পণ্য ক্রয় করুন →",
        bgGradient: "from-rose-950/80 via-rose-900/60 to-transparent",
        offerProduct: {
          productName: "কাস্টমাইজড ফটো ফ্রেম ও উইন্ড চাইম কম্বো",
          regularPrice: 950,
          offerPrice: 800,
          discountText: "১৫% ছাড়",
          unitWeight: "১ সেট",
          description: "ঘরের সৌন্দর্য ও স্মৃতি ধরে রাখার চমৎকার উপহার।",
          features: ["উড টেক্সচার ফ্রেম", "সফট মেলোডি উইন্ড চাইম"],
          images: ["https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&q=80"],
          stock: 25,
          inStock: true
        }
      },
      {
        id: "b_cat4_3",
        title: "চমক দিন",
        subtitle: "ভালোবাসার মানুষকে",
        discountText: "১০% ছাড়",
        image: "https://images.unsplash.com/photo-1512909006721-3d6018887383?w=800&q=80",
        btnText: "এই পণ্য ক্রয় করুন →",
        bgGradient: "from-red-950/80 via-red-900/60 to-transparent",
        offerProduct: {
          productName: "টেডি বিয়ার ও রেড রোজ বুকেট কম্বো",
          regularPrice: 750,
          offerPrice: 675,
          discountText: "১০% ছাড়",
          unitWeight: "১ সেট",
          description: "ভালোবাসা ও অনুভূতির প্রকাশে মিষ্টি টেডি ও সুদৃশ্য গোলাপ তোড়া।",
          features: ["সুপার সফট টেডি", "লং লাস্টিং আর্টিফিশিয়াল রোজ"],
          images: ["https://images.unsplash.com/photo-1512909006721-3d6018887383?w=800&q=80"],
          stock: 30,
          inStock: true
        }
      }
    ]
  },
  {
    categoryId: "cat5",
    categoryNumber: 5,
    categoryNameBn: "ব্যাগ ও ফ্যাশন",
    categoryIcon: "👜",
    banners: [
      {
        id: "b_cat5_1",
        title: "স্টাইলিশ হ্যান্ডব্যাগ",
        subtitle: "আপনার ফ্যাশনের সঙ্গী",
        discountText: "২০% ছাড়",
        image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=80",
        btnText: "এই পণ্য ক্রয় করুন →",
        bgGradient: "from-teal-950/80 via-teal-900/60 to-transparent",
        offerProduct: {
          productName: "প্রিমিয়াম পিইউ লেদার উইমেনস হ্যান্ডব্যাগ ও ওয়ালেট সেট",
          regularPrice: 1950,
          offerPrice: 1560,
          discountText: "২০% ছাড়",
          unitWeight: "১টি ব্যাগ + ১টি ওয়ালেট",
          description: "আধুনিক ডিজাইন, টেকসই মেটেরিয়াল এবং প্রচুর স্পেস সমৃদ্ধ আকর্ষণীয় লেডিস ব্যাগ সেট।",
          features: [
            "ওয়াটার রেজিস্ট্যান্ট পিইউ লেদার",
            "এডজাস্টেবল শোল্ডার স্ট্র্যাপ",
            "গোল্ডেন মেটাল জিপার ও এক্সেসরিজ"
          ],
          images: [
            "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=80"
          ],
          stock: 22,
          inStock: true,
          deliveryNote: "ফ্রি ডেলিভারি"
        }
      },
      {
        id: "b_cat5_2",
        title: "প্রিমিয়াম ব্যাকপ্যাক",
        subtitle: "টেকসই ও ট্রেন্ডি",
        discountText: "১৫% ছাড়",
        image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80",
        btnText: "এই পণ্য ক্রয় করুন →",
        bgGradient: "from-gray-950/80 via-gray-900/60 to-transparent",
        offerProduct: {
          productName: "অ্যান্টি থেফ্ট ওয়াটারপ্রুফ ল্যাপটপ ব্যাকপ্যাক",
          regularPrice: 1550,
          offerPrice: 1315,
          discountText: "১৫% ছাড়",
          unitWeight: "১৫.৬ ইঞ্চি ল্যাপটপ সাইজ",
          description: "অফিস, ভার্সিটি বা ভ্রমণের জন্য সেরা মানের মাল্টি-পকেট ওয়াটারপ্রুফ ব্যাকপ্যাক।",
          features: ["ইউএসবি চার্জিং পোর্ট", "হিডেন সিকিউরিটি পকেট", "প্যাডেড কুশন ব্যাক"],
          images: ["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80"],
          stock: 30,
          inStock: true
        }
      },
      {
        id: "b_cat5_3",
        title: "ফ্যাশন এক্সেসরিজ",
        subtitle: "স্টাইল হোক অনন্য",
        discountText: "১০% ছাড়",
        image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=800&q=80",
        btnText: "এই পণ্য ক্রয় করুন →",
        bgGradient: "from-stone-950/80 via-stone-900/60 to-transparent",
        offerProduct: {
          productName: "জেনুইন লেদার ওয়ালেট ও বেল্ট কম্বো",
          regularPrice: 1100,
          offerPrice: 990,
          discountText: "১০% ছাড়",
          unitWeight: "১ সেট",
          description: "১০০% খাঁটি চামড়ার তৈরি ওয়ালেট ও স্টাইলিশ বেল্ট কম্বো।",
          features: ["১০০% জেনুইন লেদার", "গিফট বক্স প্যাকেজিং"],
          images: ["https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=800&q=80"],
          stock: 25,
          inStock: true
        }
      }
    ]
  },
  {
    categoryId: "cat6",
    categoryNumber: 6,
    categoryNameBn: "ইসলামিক বাজার",
    categoryIcon: "🕌",
    banners: [
      {
        id: "b_cat6_1",
        title: "কুরআন শরীফ",
        subtitle: "পবিত্র কুরআন তিলাওয়াত",
        discountText: "২০% ছাড়",
        image: "https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=800&q=80",
        btnText: "এই পণ্য ক্রয় করুন →",
        bgGradient: "from-emerald-950/80 via-emerald-900/60 to-transparent",
        offerProduct: {
          productName: "তাজউইদ কালার কোডেড বড় অক্ষরের আল-কুরআন ও রেহাল সেট",
          regularPrice: 1450,
          offerPrice: 1160,
          discountText: "২০% ছাড়",
          unitWeight: "১ সেট (কুরআন + উডেন রেহাল)",
          description: "সহজে ও সহীহভাবে পড়ার জন্য বড় হরফের কালার কোডেড নূরানী কুরআন শরীফ এবং সুন্দর কারুকাজ করা কাঠের রেহাল।",
          features: [
            "সহজে তাজবীদ নিয়ম বোঝার কালার কোডিং",
            "উচ্চমানের আর্ট পেপার ও মজবুত হার্ডবাউন্ড",
            "নকশী কাঠের প্রিমিয়াম রেহাল ফ্রি"
          ],
          images: [
            "https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=800&q=80"
          ],
          stock: 40,
          inStock: true,
          deliveryNote: "ফ্রি হোম ডেলিভারি"
        }
      },
      {
        id: "b_cat6_2",
        title: "নামাজের প্রয়োজনীয়তা",
        subtitle: "সবকিছু এক আঙিনায়",
        discountText: "১৫% ছাড়",
        image: "https://images.unsplash.com/photo-1564769625905-50e93615e769?w=800&q=80",
        btnText: "এই পণ্য ক্রয় করুন →",
        bgGradient: "from-slate-950/80 via-slate-900/60 to-transparent",
        offerProduct: {
          productName: "টার্কিশ ভেলভেট সফট জায়নামাজ ও ক্রিস্টাল তসবিহ সেট",
          regularPrice: 950,
          offerPrice: 800,
          discountText: "১৫% ছাড়",
          unitWeight: "১ সেট",
          description: "অত্যন্ত আরামদায়ক মেমোরি ফোম ভেলভেট জায়নামাজ ও সুন্দর সুগন্ধি তসবিহ।",
          features: ["সফট ভেলভেট ফ্যাব্রিক", "নন-স্লিপ ব্যাক সাইড", "১০০ দানার তসবিহ"],
          images: ["https://images.unsplash.com/photo-1564769625905-50e93615e769?w=800&q=80"],
          stock: 35,
          inStock: true
        }
      },
      {
        id: "b_cat6_3",
        title: "ইসলামিক বই",
        subtitle: "জ্ঞান অর্জনে সহায়ক",
        discountText: "১০% ছাড়",
        image: "https://images.unsplash.com/photo-1585036156171-384164a8c675?w=800&q=80",
        btnText: "এই পণ্য ক্রয় করুন →",
        bgGradient: "from-teal-950/80 via-teal-900/60 to-transparent",
        offerProduct: {
          productName: "সিরাতে রাসুল (সাঃ) ও রিয়াদুস সালেহিন বই সেট",
          regularPrice: 1200,
          offerPrice: 1080,
          discountText: "১০% ছাড়",
          unitWeight: "২ খণ্ড সেট",
          description: "বিশুদ্ধ হাদিস ও রসুলুল্লাহ (সাঃ) এর জীবনীর পূর্ণাঙ্গ ইসলামিক গ্রন্থমালা।",
          features: ["সহীহ অনুবাদ ও ব্যাখ্যা", "উন্নত হার্ডকাভার বাঁধাই"],
          images: ["https://images.unsplash.com/photo-1585036156171-384164a8c675?w=800&q=80"],
          stock: 25,
          inStock: true
        }
      }
    ]
  },
  {
    categoryId: "cat7",
    categoryNumber: 7,
    categoryNameBn: "ইলেকট্রনিক্স বাজার",
    categoryIcon: "🎧",
    banners: [
      {
        id: "b_cat7_1",
        title: "স্মার্ট গ্যাজেটস",
        subtitle: "আপনার লাইফস্টাইলের সঙ্গী",
        discountText: "২০% ছাড়",
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
        btnText: "এই পণ্য ক্রয় করুন →",
        bgGradient: "from-indigo-950/80 via-indigo-900/60 to-transparent",
        offerProduct: {
          productName: "ওয়্যারলেস অ্যাক্টিভ নয়েজ ক্যানসেলিং ইয়ারবাডস (Bluetooth 5.3)",
          regularPrice: 1850,
          offerPrice: 1480,
          discountText: "২০% ছাড়",
          unitWeight: "১ সেট (কেস + ইয়ারবাডস)",
          description: "ক্রিস্টাল ক্লিয়ার ডিপ ব্যাস, আল্ট্রা ফাস্ট চার্জিং এবং ৩৬ ঘণ্টা প্লেব্যাক টাইম। গেমিং ও কলিংয়ের জন্য সেরা।",
          features: [
            "এনভায়রনমেন্টাল নয়েজ ক্যানসেলেশন (ENC)",
            "IPX5 ওয়াটার ও সোয়েট রেজিস্ট্যান্ট",
            "৩৬ ঘণ্টা ব্যাটারি লাইফ ব্যাকআপ",
            "৬ মাসের অফিশিয়াল ওয়ারেন্টি"
          ],
          images: [
            "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80"
          ],
          stock: 30,
          inStock: true,
          deliveryNote: "ফ্রি হোম ডেলিভারি"
        }
      },
      {
        id: "b_cat7_2",
        title: "স্মার্টওয়াচ",
        subtitle: "স্বাস্থ্য ও সময়ের হিসাব",
        discountText: "১৫% ছাড়",
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80",
        btnText: "এই পণ্য ক্রয় করুন →",
        bgGradient: "from-cyan-950/80 via-cyan-900/60 to-transparent",
        offerProduct: {
          productName: "ফুল টাচ এইচডি ডিসপ্লে ব্লুটুথ কলিং স্মার্টওয়াচ",
          regularPrice: 2200,
          offerPrice: 1870,
          discountText: "১৫% ছাড়",
          unitWeight: "১ পিস",
          description: "হার্ট রেট, অক্সিজেন মনিটর, ব্লুটুথ কলিং ও ১০০+ স্পোর্টস মোড সমৃদ্ধ প্রিমিয়াম ঘড়ি।",
          features: ["ব্লুটুথ ভয়েস কলিং", "৭ দিনের ব্যাটারি ব্যাকআপ", "মেটাল বডি ও সিলিকন স্ট্র্যাপ"],
          images: ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80"],
          stock: 20,
          inStock: true
        }
      },
      {
        id: "b_cat7_3",
        title: "পোর্টেবল স্পিকার",
        subtitle: "সঙ্গীতের সেরা অনুভূতি",
        discountText: "১০% ছাড়",
        image: "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&q=80",
        btnText: "এই পণ্য ক্রয় করুন →",
        bgGradient: "from-blue-950/80 via-blue-900/60 to-transparent",
        offerProduct: {
          productName: "এক্সট্রা বাস পোর্টেবল ওয়াটারপ্রুফ ব্লুটুথ স্পিকার",
          regularPrice: 1350,
          offerPrice: 1215,
          discountText: "১০% ছাড়",
          unitWeight: "১ পিস",
          description: "৩৬০ ডিগ্রি সারাউন্ড সাউন্ড ও আরজিবি লাইটিং সমৃদ্ধ পোর্টেবল স্পিকার।",
          features: ["ডিপ বেস সাউন্ড", "১২ ঘণ্টা টানা প্লেটাইম", "টিডব্লিউএস মাল্টি-কানেক্ট"],
          images: ["https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&q=80"],
          stock: 35,
          inStock: true
        }
      }
    ]
  },
  {
    categoryId: "cat8",
    categoryNumber: 8,
    categoryNameBn: "বই ও শিক্ষা বাজার",
    categoryIcon: "📚",
    banners: [
      {
        id: "b_cat8_1",
        title: "শিশুদের বই",
        subtitle: "শিশুর মননের বিকাশে",
        discountText: "২০% ছাড়",
        image: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=800&q=80",
        btnText: "এই পণ্য ক্রয় করুন →",
        bgGradient: "from-amber-950/80 via-amber-900/60 to-transparent",
        offerProduct: {
          productName: "ছোটদের সচিত্র বর্ণমালা, গল্প ও ড্রয়িং বুক কম্বো (৫টি বইয়ের সেট)",
          regularPrice: 950,
          offerPrice: 760,
          discountText: "২০% ছাড়",
          unitWeight: "৫টি বইয়ের কম্বো সেট",
          description: "শিশুদের মেধা ও সৃজনশীলতা বিকাশের জন্য রঙিন আকর্ষণীয় অলংকরণে সাজানো শিক্ষামূলক বই সমগ্র।",
          features: [
            "রঙিন সচিত্র পেজ ও বড় হরফ",
            "বাংলা ও ইংরেজি বর্ণমালা ও নৈতিক গল্প",
            "শিশুদের জন্য ড্রয়িং কালার পেন্সিল সেট ফ্রি"
          ],
          images: [
            "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=800&q=80"
          ],
          stock: 45,
          inStock: true,
          deliveryNote: "হোম ডেলিভারি"
        }
      },
      {
        id: "b_cat8_2",
        title: "বেস্টসেলার বই",
        subtitle: "পড়ার আনন্দে হারান",
        discountText: "১৫% ছাড়",
        image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&q=80",
        btnText: "এই পণ্য ক্রয় করুন →",
        bgGradient: "from-rose-950/80 via-rose-900/60 to-transparent",
        offerProduct: {
          productName: "সেলফ ডেভেলপমেন্ট ও মোটিভেশনাল বেস্টসেলার ট্রিলজি",
          regularPrice: 1150,
          offerPrice: 975,
          discountText: "১৫% ছাড়",
          unitWeight: "৩টি বইয়ের সেট",
          description: "জীবন ও ক্যারিয়ারে সফলতার সেরা আন্তর্জাতিক বইগুলোর সাবলীল বাংলা অনুবাদ।",
          features: ["অরিজিনাল প্রিন্ট", "উচ্চমানের বুকমার্ক ফ্রি"],
          images: ["https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&q=80"],
          stock: 30,
          inStock: true
        }
      },
      {
        id: "b_cat8_3",
        title: "স্টেশনারি আইটেম",
        subtitle: "লেখাপড়ায় সেরা প্রস্তুতি",
        discountText: "১০% ছাড়",
        image: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=800&q=80",
        btnText: "এই পণ্য ক্রয় করুন →",
        bgGradient: "from-stone-950/80 via-stone-900/60 to-transparent",
        offerProduct: {
          productName: "স্টুডেন্ট এক্সিকিউটিভ নোটবুক, জেল পেন ও ফাইল প্যাকেজ",
          regularPrice: 650,
          offerPrice: 585,
          discountText: "১০% ছাড়",
          unitWeight: "১ সেট",
          description: "স্কুল, কলেজ ও অফিসের জন্য সম্পূর্ণ স্টেশনারি কম্বো বক্স।",
          features: ["হার্ডবাউন্ড ডায়রি ও নোটবুক", "স্মুথ জেল পেন বক্স"],
          images: ["https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=800&q=80"],
          stock: 40,
          inStock: true
        }
      }
    ]
  }
];

export const BannerManagement: React.FC = () => {
  const [data, setData] = useState<CategoryBanners[]>(() => {
    const cached = localStorage.getItem("almayadin_category_banners");
    return cached ? JSON.parse(cached) : INITIAL_CATEGORY_BANNERS;
  });

  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  // Modal tab: 'banner' (Visuals) or 'product' (Linked Special Offer Product)
  const [activeTab, setActiveTab] = useState<"banner" | "product">("banner");

  // Edit / Add Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingBanner, setEditingBanner] = useState<CategoryBannerItem | null>(null);

  // Form states - Banner Visuals
  const [modalTitle, setModalTitle] = useState("");
  const [modalSubtitle, setModalSubtitle] = useState("");
  const [modalDiscountText, setModalDiscountText] = useState("");
  const [modalBtnText, setModalBtnText] = useState("এই পণ্য ক্রয় করুন →");
  const [modalImage, setModalImage] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Form states - Linked Offer Product Details
  const [offerProductName, setOfferProductName] = useState("");
  const [offerRegularPrice, setOfferRegularPrice] = useState<number | string>("");
  const [offerPrice, setOfferPrice] = useState<number | string>("");
  const [offerUnitWeight, setOfferUnitWeight] = useState("");
  const [offerDescription, setOfferDescription] = useState("");
  const [offerFeature1, setOfferFeature1] = useState("");
  const [offerFeature2, setOfferFeature2] = useState("");
  const [offerFeature3, setOfferFeature3] = useState("");
  const [offerFeature4, setOfferFeature4] = useState("");
  const [offerStock, setOfferStock] = useState<number | string>(30);
  const [offerDeliveryNote, setOfferDeliveryNote] = useState("সারা দেশে ফ্রি ডেলিভারি");

  const showToast = (text: string, isError = false) => {
    setToastMessage({ text, isError });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load banners from Firestore on mount
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const docRef = doc(db, "app_settings", "category_banners");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().categories) {
          const remoteData = docSnap.data().categories as CategoryBanners[];
          setData(remoteData);
          localStorage.setItem("almayadin_category_banners", JSON.stringify(remoteData));
        }
      } catch (err) {
        console.warn("Could not fetch remote category banners, using local:", err);
      }
    };
    fetchBanners();
  }, []);

  // Save changes to Firestore and LocalStorage
  const saveToStorage = async (updatedData: CategoryBanners[]) => {
    setData(updatedData);
    localStorage.setItem("almayadin_category_banners", JSON.stringify(updatedData));
    try {
      const docRef = doc(db, "app_settings", "category_banners");
      await setDoc(docRef, { categories: updatedData, updatedAt: Date.now() }, { merge: true });
    } catch (err) {
      console.warn("Firestore sync warning:", err);
    }
  };

  // Open modal for adding a new banner to category
  const handleOpenAddBanner = (categoryId: string) => {
    setEditingCategoryId(categoryId);
    setEditingBanner(null);
    setActiveTab("banner");
    
    // Default banner visuals
    setModalTitle("");
    setModalSubtitle("");
    setModalDiscountText("২০% ছাড়");
    setModalBtnText("এই পণ্য ক্রয় করুন →");
    setModalImage("");

    // Default product offer details
    setOfferProductName("");
    setOfferRegularPrice(1200);
    setOfferPrice(950);
    setOfferUnitWeight("১ সেট / কম্বো প্যাক");
    setOfferDescription("১০০% খাঁটি ও সেরা মানের নিশ্চয়তা। দ্রুত হোম ডেলিভারিতে পণ্যটি পেতে এখনই অর্ডার করুন।");
    setOfferFeature1("১০০% অরিজিনাল ও অথেনটিক পণ্য");
    setOfferFeature2("সীমিত সময়ের স্পেশাল ডিসকাউন্ট অফার");
    setOfferFeature3("সারা বাংলাদেশে দ্রুত হোম ডেলিভারি");
    setOfferFeature4("ক্যাশ অন ডেলিভারিতে দেখে মূল্য পরিশোধের সুযোগ");
    setOfferStock(30);
    setOfferDeliveryNote("সারা দেশে ফ্রি ডেলিভারি");

    setIsModalOpen(true);
  };

  // Open modal for editing an existing banner
  const handleOpenEditBanner = (categoryId: string, banner: CategoryBannerItem) => {
    setEditingCategoryId(categoryId);
    setEditingBanner(banner);
    setActiveTab("banner");
    
    setModalTitle(banner.title);
    setModalSubtitle(banner.subtitle);
    setModalDiscountText(banner.discountText);
    setModalBtnText(banner.btnText || "এই পণ্য ক্রয় করুন →");
    setModalImage(banner.image);

    const offer = banner.offerProduct;
    setOfferProductName(offer?.productName || banner.title);
    setOfferRegularPrice(offer?.regularPrice || 1200);
    setOfferPrice(offer?.offerPrice || 950);
    setOfferUnitWeight(offer?.unitWeight || "১ সেট / কম্বো প্যাক");
    setOfferDescription(offer?.description || banner.subtitle || "");
    
    const feats = offer?.features || [];
    setOfferFeature1(feats[0] || "১০০% অরিজিনাল ও অথেনটিক পণ্য");
    setOfferFeature2(feats[1] || "সীমিত সময়ের স্পেশাল অফার");
    setOfferFeature3(feats[2] || "সারা দেশে দ্রুত হোম ডেলিভারি");
    setOfferFeature4(feats[3] || "ক্যাশ অন ডেলিভারি সুবিধা");
    
    setOfferStock(offer?.stock || 30);
    setOfferDeliveryNote(offer?.deliveryNote || "সারা দেশে ফ্রি ডেলিভারি");

    setIsModalOpen(true);
  };

  // Delete a banner
  const handleDeleteBanner = (categoryId: string, bannerId: string) => {
    const updated = data.map((cat) => {
      if (cat.categoryId === categoryId) {
        return {
          ...cat,
          banners: cat.banners.filter((b) => b.id !== bannerId)
        };
      }
      return cat;
    });
    saveToStorage(updated);
    showToast("ব্যানার মুছে ফেলা হয়েছে!");
  };

  // Handle image upload from computer/phone
  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      const base64 = await compressImage(files[0]);
      setModalImage(base64);
      showToast("ছবি আপলোড সফল হয়েছে!");
    } catch (err) {
      console.error(err);
      showToast("ছবি আপলোড ব্যর্থ হয়েছে", true);
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  // Save from modal
  const handleModalSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategoryId) return;
    if (!modalTitle.trim()) {
      showToast("ব্যানারের শিরোনাম লিখুন", true);
      setActiveTab("banner");
      return;
    }
    if (!modalImage) {
      showToast("ব্যানারের ছবি নির্বাচন করুন বা আপলোড করুন", true);
      setActiveTab("banner");
      return;
    }

    const regPrice = Number(offerRegularPrice) || Number(offerPrice) || 950;
    const offPrice = Number(offerPrice) || regPrice;

    const offerProductPayload: BannerProductOffer = {
      productName: offerProductName.trim() || modalTitle.trim(),
      regularPrice: regPrice,
      offerPrice: offPrice,
      discountText: modalDiscountText.trim() || `${Math.round(((regPrice - offPrice) / regPrice) * 100)}% ছাড়`,
      unitWeight: offerUnitWeight.trim() || "১ সেট",
      description: offerDescription.trim() || modalSubtitle.trim(),
      features: [
        offerFeature1.trim(),
        offerFeature2.trim(),
        offerFeature3.trim(),
        offerFeature4.trim()
      ].filter(Boolean),
      images: [modalImage],
      stock: Number(offerStock) || 30,
      inStock: true,
      deliveryNote: offerDeliveryNote.trim()
    };

    setLoading(true);

    const targetCategory = data.find((c) => c.categoryId === editingCategoryId);
    const catName = targetCategory ? targetCategory.categoryNameBn : "";

    const updated = data.map((cat) => {
      if (cat.categoryId === editingCategoryId) {
        if (editingBanner) {
          // Update existing banner
          return {
            ...cat,
            banners: cat.banners.map((b) =>
              b.id === editingBanner.id
                ? {
                    ...b,
                    title: modalTitle.trim(),
                    subtitle: modalSubtitle.trim(),
                    discountText: modalDiscountText.trim(),
                    btnText: modalBtnText.trim() || "এই পণ্য ক্রয় করুন →",
                    image: modalImage,
                    offerProduct: offerProductPayload
                  }
                : b
            )
          };
        } else {
          // Add new banner
          const newBanner: CategoryBannerItem = {
            id: `b_${editingCategoryId}_${Date.now()}`,
            title: modalTitle.trim(),
            subtitle: modalSubtitle.trim(),
            discountText: modalDiscountText.trim() || "২০% ছাড়",
            btnText: modalBtnText.trim() || "এই পণ্য ক্রয় করুন →",
            image: modalImage,
            bgGradient: "from-gray-950/80 via-gray-900/60 to-transparent",
            offerProduct: offerProductPayload
          };
          return {
            ...cat,
            banners: [...cat.banners, newBanner]
          };
        }
      }
      return cat;
    });

    await saveToStorage(updated);
    setLoading(false);
    setIsModalOpen(false);
    showToast(
      editingBanner
        ? `${catName}-এর ব্যানার ও অফার পণ্য সফলভাবে আপডেট হয়েছে!`
        : `${catName}-এ নতুন ব্যানার ও অফার পণ্য যোগ করা হয়েছে!`
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-6">
      
      {/* Top Header Section */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🖼️</span>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              ব্যানার ম্যানেজমেন্ট ও অফার পণ্য
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 font-medium mt-0.5">
              ব্যানারে ছবি এবং সরাসরি সংযুক্ত পণ্য যোগ করুন, যাতে ইউজার ক্লিক করলেই অফার ফর্মে গিয়ে কিনতে পারে
            </p>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`p-3.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm transition-all ${
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

      {/* Categories List Cards */}
      <div className="space-y-4">
        {data.map((category) => (
          <div
            key={category.categoryId}
            className="bg-white rounded-[24px] border border-gray-200/80 p-4 sm:p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] space-y-4"
          >
            {/* Category Header Row */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <span className="text-sm sm:text-base font-black text-gray-900">
                  {category.categoryNumber}.
                </span>
                <span className="text-base sm:text-lg">{category.categoryIcon}</span>
                <h3 className="text-sm sm:text-base font-black text-gray-900">
                  {category.categoryNameBn}
                </h3>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  {category.banners.length} টি ব্যানার ও অফার
                </span>
              </div>

              {/* Add Banner button */}
              <button
                type="button"
                onClick={() => handleOpenAddBanner(category.categoryId)}
                className="bg-white border border-[#5842dc]/40 hover:border-[#5842dc] text-[#5842dc] hover:bg-[#5842dc]/5 px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>ব্যানার ও পণ্য যোগ করুন</span>
              </button>
            </div>

            {/* Banners Horizontal Grid */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin">
              
              {/* Drag handle icon on the far left */}
              <div className="text-gray-300 hover:text-gray-500 cursor-grab px-1 shrink-0">
                <GripVertical className="w-5 h-5" />
              </div>

              {/* Existing Banners */}
              {category.banners.map((banner, index) => (
                <div key={banner.id} className="flex flex-col items-center shrink-0 w-[210px] sm:w-[240px]">
                  {/* Banner Card Preview */}
                  <div className="relative w-full h-[105px] sm:h-[115px] rounded-2xl overflow-hidden shadow-xs border border-gray-200 bg-gray-100 group">
                    <img
                      src={banner.image}
                      alt={banner.title || "Banner"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    
                    {/* Badge at top corner indicating linked offer */}
                    {banner.offerProduct?.offerPrice && (
                      <div className="absolute top-2 left-2 z-10">
                        <span className="text-[10px] font-black text-white bg-emerald-700/90 backdrop-blur-xs px-2 py-0.5 rounded-md shadow-xs">
                          ৳ {banner.offerProduct.offerPrice}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions (Edit & Delete) */}
                  <div className="flex items-center justify-between w-full px-1 mt-2 text-xs">
                    <span className="text-[10px] font-bold text-gray-400 truncate max-w-[120px]">
                      {banner.offerProduct?.productName || "সংযুক্ত অফার পণ্য"}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEditBanner(category.categoryId, banner)}
                        className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded-lg transition-colors active:scale-90"
                        title="ব্যানার ও পণ্য এডিট করুন"
                      >
                        <Edit3 className="w-3.5 h-3.5 stroke-[2.2]" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteBanner(category.categoryId, banner.id)}
                        className="text-rose-500 hover:text-rose-700 p-1 hover:bg-rose-50 rounded-lg transition-colors active:scale-90"
                        title="ব্যানার মুছে ফেলুন"
                      >
                        <Trash2 className="w-3.5 h-3.5 stroke-[2.2]" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add New Banner Card (+) */}
              <button
                type="button"
                onClick={() => handleOpenAddBanner(category.categoryId)}
                className="w-[150px] sm:w-[170px] h-[105px] sm:h-[115px] rounded-2xl border-2 border-dashed border-gray-200 hover:border-[#5842dc]/50 bg-gray-50/50 hover:bg-[#5842dc]/5 flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-[#5842dc] shrink-0 transition-all cursor-pointer group"
              >
                <div className="w-7 h-7 rounded-full border border-gray-300 group-hover:border-[#5842dc] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Plus className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-black">
                  নতুন ব্যানার
                </span>
                <span className="text-[9px] font-bold text-gray-400 group-hover:text-[#5842dc]">
                  + পণ্য যোগ করুন
                </span>
              </button>

            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Banner & Linked Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-4 sm:p-6 shadow-2xl border border-gray-100 space-y-4 my-auto animate-in fade-in zoom-in duration-200 max-h-[92vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-[#5842dc]" />
                  <span>
                    {editingBanner ? "ব্যানার ও অফার পণ্য সম্পাদনা" : "নতুন ব্যানার ও অফার পণ্য যোগ"}
                  </span>
                </h3>
                <p className="text-[11px] text-gray-500 font-bold">
                  ব্যানার প্রদর্শনের সাথে পণ্যের স্পেশাল ক্রয় ফর্ম যুক্ত করুন
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tab Switcher */}
            <div className="flex bg-gray-100 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setActiveTab("banner")}
                className={`flex-1 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === "banner" 
                    ? "bg-white text-[#5842dc] shadow-xs" 
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>১. ব্যানার ভিজ্যুয়াল</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("product")}
                className={`flex-1 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === "product" 
                    ? "bg-white text-[#004b23] shadow-xs" 
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>২. অফার পণ্য ও ফর্ম</span>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleModalSave} className="space-y-4">
              
              {activeTab === "banner" ? (
                /* TAB 1: Banner Visuals */
                <div className="space-y-3.5 animate-in fade-in duration-150">
                  
                  {/* Image Upload / Preview */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-800">
                      ব্যানারের ছবি <span className="text-red-500">*</span>
                    </label>

                    {modalImage ? (
                      <div className="relative w-full h-36 rounded-2xl overflow-hidden border border-gray-200 bg-gray-100 group">
                        <img src={modalImage} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setModalImage("")}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 shadow-md hover:bg-red-600 cursor-pointer"
                          title="ছবি মুছুন"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <label className="border-2 border-dashed border-[#5842dc]/40 hover:border-[#5842dc] rounded-2xl p-5 flex flex-col items-center justify-center cursor-pointer bg-[#f9f9ff] transition-all">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageFile}
                          className="hidden"
                        />
                        <Upload className="w-7 h-7 text-[#5842dc] mb-1.5" />
                        <span className="text-xs font-bold text-[#5842dc]">
                          {isUploading ? "ছবি আপলোড হচ্ছে..." : "ডিভাইস থেকে ব্যানার ফটো নির্বাচন করুন"}
                        </span>
                        <span className="text-[10px] text-gray-400 mt-1">
                          অথবা নিচে ছবির অনলাইন লিংক পেস্ট করতে পারেন
                        </span>
                      </label>
                    )}

                    {/* Image URL fallback input */}
                    <div className="pt-1">
                      <input
                        type="url"
                        value={modalImage}
                        onChange={(e) => setModalImage(e.target.value)}
                        placeholder="অথবা ব্যানার ছবির অনলাইন URL পেস্ট করুন (https://...)"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#5842dc]"
                      />
                    </div>
                  </div>

                  {/* Title */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-gray-800">
                      ব্যানারের মূল শিরোনাম <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={modalTitle}
                      onChange={(e) => {
                        setModalTitle(e.target.value);
                        if (!offerProductName) setOfferProductName(e.target.value);
                      }}
                      placeholder="যেমন: তাজা খাবার / স্পেশাল পাঞ্জাবি"
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5842dc]/40"
                    />
                  </div>

                  {/* Subtitle */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-gray-800">
                      সাব-শিরোনাম / স্লোগান
                    </label>
                    <input
                      type="text"
                      value={modalSubtitle}
                      onChange={(e) => setModalSubtitle(e.target.value)}
                      placeholder="যেমন: ন্যাচারাল ও ফ্রেশ পণ্য / ১০০% খাঁটি নিশ্চয়তা"
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5842dc]/40"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Discount Text */}
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-gray-800">
                        ছাড়ের অফার ব্যাজ
                      </label>
                      <input
                        type="text"
                        value={modalDiscountText}
                        onChange={(e) => setModalDiscountText(e.target.value)}
                        placeholder="যেমন: ২০% ছাড় / ১+১ ফ্রি"
                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5842dc]/40"
                      />
                    </div>

                    {/* Button Text */}
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-gray-800">
                        বাটন টেক্সট
                      </label>
                      <input
                        type="text"
                        value={modalBtnText}
                        onChange={(e) => setModalBtnText(e.target.value)}
                        placeholder="যেমন: এই পণ্য ক্রয় করুন →"
                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5842dc]/40"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab("product")}
                      className="w-full py-2.5 bg-[#5842dc]/10 hover:bg-[#5842dc]/20 text-[#5842dc] text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition-all"
                    >
                      <span>পরবর্তী ধাপ: সংযুক্ত অফার পণ্যের বিবরণ দিন</span>
                      <Tag className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>
              ) : (
                /* TAB 2: Linked Offer Product Details */
                <div className="space-y-3.5 animate-in fade-in duration-150">
                  
                  <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl text-xs text-emerald-900 font-bold flex items-start gap-2">
                    <Info className="w-4 h-4 text-[#004b23] shrink-0 mt-0.5" />
                    <span>
                      ইউজার যখন ব্যানারে ক্লিক করবে তখন সরাসরি এই পণ্যটির স্পেশাল অর্ডার পেজে চলে যাবে।
                    </span>
                  </div>

                  {/* Product Full Name */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-gray-800">
                      অফার পণ্যের পুরো নাম
                    </label>
                    <input
                      type="text"
                      value={offerProductName}
                      onChange={(e) => setOfferProductName(e.target.value)}
                      placeholder="যেমন: স্পেশাল অর্গানিক ফ্রেশ ফুড প্যাকেজ (মধু, ঘি ও বাদাম)"
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#004b23]/40"
                    />
                  </div>

                  {/* Pricing and Unit */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-gray-800">
                        আসল মূল্য (৳)
                      </label>
                      <input
                        type="number"
                        value={offerRegularPrice}
                        onChange={(e) => setOfferRegularPrice(e.target.value)}
                        placeholder="যেমন: 1200"
                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#004b23]/40"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-gray-800">
                        অফার মূল্য (৳) *
                      </label>
                      <input
                        type="number"
                        required
                        value={offerPrice}
                        onChange={(e) => setOfferPrice(e.target.value)}
                        placeholder="যেমন: 950"
                        className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2 text-xs font-black text-[#004b23] focus:outline-none focus:ring-2 focus:ring-[#004b23]/40"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-gray-800">
                        ওজন / সাইজ
                      </label>
                      <input
                        type="text"
                        value={offerUnitWeight}
                        onChange={(e) => setOfferUnitWeight(e.target.value)}
                        placeholder="যেমন: ১.৫ কেজি / সাইজ ৪২"
                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#004b23]/40"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-gray-800">
                      পণ্যের অফার বিবরণ ও বৈশিষ্ট্যসমূহ
                    </label>
                    <textarea
                      rows={2}
                      value={offerDescription}
                      onChange={(e) => setOfferDescription(e.target.value)}
                      placeholder="যেমন: ১০০% খাঁটি ও নির্ভেজাল পণ্য। বিশেষ ছাড়ে লুফে নিন..."
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#004b23]/40"
                    />
                  </div>

                  {/* 4 Bullet Features */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-800">
                      মূল ৪টি সুবিধাসমূহ (Bullet Highlights)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={offerFeature1}
                        onChange={(e) => setOfferFeature1(e.target.value)}
                        placeholder="সুবিধা ১ (যেমন: ১০০% খাঁটি ও নির্ভেজাল)"
                        className="bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs text-gray-900"
                      />
                      <input
                        type="text"
                        value={offerFeature2}
                        onChange={(e) => setOfferFeature2(e.target.value)}
                        placeholder="সুবিধা ২ (যেমন: সীমিত সময়ের বিশেষ ছাড়)"
                        className="bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs text-gray-900"
                      />
                      <input
                        type="text"
                        value={offerFeature3}
                        onChange={(e) => setOfferFeature3(e.target.value)}
                        placeholder="সুবিধা ৩ (যেমন: সারা দেশে দ্রুত ডেলিভারি)"
                        className="bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs text-gray-900"
                      />
                      <input
                        type="text"
                        value={offerFeature4}
                        onChange={(e) => setOfferFeature4(e.target.value)}
                        placeholder="সুবিধা ৪ (যেমন: ক্যাশ অন ডেলিভারি)"
                        className="bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs text-gray-900"
                      />
                    </div>
                  </div>

                  {/* Stock & Delivery Note */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-gray-800">
                        স্টক পরিমাণ
                      </label>
                      <input
                        type="number"
                        value={offerStock}
                        onChange={(e) => setOfferStock(e.target.value)}
                        placeholder="যেমন: 35"
                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#004b23]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-gray-800">
                        ডেলিভারি অফার
                      </label>
                      <input
                        type="text"
                        value={offerDeliveryNote}
                        onChange={(e) => setOfferDeliveryNote(e.target.value)}
                        placeholder="যেমন: সারা দেশে ফ্রি ডেলিভারি"
                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#004b23]"
                      />
                    </div>
                  </div>

                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/3 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 active:scale-95 transition-all"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 py-2.5 rounded-xl bg-[#004b23] hover:bg-[#00381a] text-white text-xs font-black shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>সংরক্ষণ করুন</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
