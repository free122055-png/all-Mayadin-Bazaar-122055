import { db } from "./firebase";
import { doc, getDoc, collection, query, where, getDocs, limit } from "firebase/firestore";
import { ALL_INITIAL_PRODUCTS } from "../data/allProductsData";
import { defaultFoodCatalog } from "../data/foodProducts";

export interface ResolvedProduct {
  id: string;
  numericId?: number | string;
  code?: string;
  name: string;
  nameBn: string;
  nameEn?: string;
  categoryId?: string;
  price: number;
  discountPrice?: number;
  discountPercent?: number;
  weight?: string;
  unit?: string;
  stockQuantity?: number;
  stockStatus?: "In Stock" | "Out of Stock" | "in_stock" | "out_of_stock" | string;
  description?: string;
  image?: string;
  images?: string[];
  colors?: string[];
  sizes?: string[];
  variants?: Array<{ id: string; name: string; price: number; discountPrice?: number }>;
  brand?: string;
  rating?: number;
  reviews?: string | number;
  status?: "active" | "inactive" | string;
  isDeleted?: boolean;
}

export interface ProductFetchResult {
  product: ResolvedProduct | null;
  status: "found" | "not_found" | "unavailable" | "out_of_stock";
  message?: string;
}

/**
 * Returns Native Android App Deep Link without any domain dependency:
 * almayadinbazar://product/458
 */
export function getProductDeepLink(
  product: { id: string; numericId?: number | string; slug?: string; code?: string } | string
): string {
  let identifier = "";
  if (typeof product === "string") {
    identifier = product.trim();
  } else {
    identifier = String(product.numericId || product.code || product.slug || product.id || "").trim();
  }
  return `almayadinbazar://product/${encodeURIComponent(identifier)}`;
}

/**
 * Returns canonical product shareable link (defaults to Native Deep Link almayadinbazar://product/:id)
 */
export function getProductShareUrl(
  product: { id: string; numericId?: number | string; slug?: string; code?: string } | string,
  preferredDomain?: string
): string {
  let identifier = "";
  if (typeof product === "string") {
    identifier = product.trim();
  } else {
    identifier = String(product.numericId || product.code || product.slug || product.id || "").trim();
  }

  // If user specifically passed an HTTPS custom domain
  if (preferredDomain && preferredDomain.trim() !== "") {
    let d = preferredDomain.trim().replace(/\/+$/, "");
    if (!d.startsWith("http")) d = "https://" + d;
    return `${d}/product/${encodeURIComponent(identifier)}`;
  }

  // Pure Native App Deep Link without domain
  return `almayadinbazar://product/${encodeURIComponent(identifier)}`;
}

/**
 * Robust Product Resolver with Instant Cache & Timeout Protection
 * Resolves across:
 * 1. Firestore Document ID
 * 2. Numeric Product ID (e.g. 458)
 * 3. Product Code or Slug
 * 4. Static Initial Catalog (Immediate fallback so never white/blank screen)
 */
export async function fetchProductById(idOrSlug: string): Promise<ProductFetchResult> {
  if (!idOrSlug || idOrSlug.trim() === "") {
    return { product: null, status: "not_found", message: "দুঃখিত, এই পণ্যটি বর্তমানে উপলব্ধ নয়" };
  }

  const cleanId = decodeURIComponent(idOrSlug.trim());
  const numericVal = Number(cleanId);
  const isNumeric = !isNaN(numericVal) && cleanId !== "" && !cleanId.includes("-");

  // Strategy 1: Check static cache first for instant 0ms lookup
  const immediateStatic = ALL_INITIAL_PRODUCTS.find(p => 
    p.id === cleanId || 
    (isNumeric && p.id === "demo-p" + cleanId) ||
    (isNumeric && p.id === "p" + cleanId) ||
    (p as any).numericId === numericVal ||
    p.id.toLowerCase() === cleanId.toLowerCase()
  );

  // Strategy 2: Attempt Firestore query with 1.8s timeout protection
  const firestoreFetchPromise = (async (): Promise<ResolvedProduct | null> => {
    try {
      // 2a. Direct Firestore doc ID in "products"
      const directDocRef = doc(db, "products", cleanId);
      const directSnap = await getDoc(directDocRef);

      if (directSnap.exists()) {
        const data = directSnap.data();
        return sanitizeProductData(directSnap.id, data);
      }

      // 2b. Numeric ID or slug query
      const productsRef = collection(db, "products");
      let queryField = isNumeric ? "numericId" : "slug";
      let q = query(productsRef, where(queryField, "==", isNumeric ? numericVal : cleanId), limit(1));
      let qSnap = await getDocs(q);

      if (!qSnap.empty) {
        return sanitizeProductData(qSnap.docs[0].id, qSnap.docs[0].data());
      }

      // 2c. By "code" field
      q = query(productsRef, where("code", "==", cleanId), limit(1));
      qSnap = await getDocs(q);
      if (!qSnap.empty) {
        return sanitizeProductData(qSnap.docs[0].id, qSnap.docs[0].data());
      }

      // 2d. Check "food_products" collection
      const foodDocRef = doc(db, "food_products", cleanId);
      const foodSnap = await getDoc(foodDocRef);
      if (foodSnap.exists()) {
        return sanitizeProductData(foodSnap.id, foodSnap.data());
      }
    } catch (err) {
      console.warn("[productLink] Firestore fetch warning:", err);
    }
    return null;
  })();

  const timeoutPromise = new Promise<null>((resolve) => {
    setTimeout(() => resolve(null), 1800);
  });

  try {
    const firestoreProduct = await Promise.race([firestoreFetchPromise, timeoutPromise]);
    if (firestoreProduct) {
      return evaluateProductAvailability(firestoreProduct);
    }
  } catch (err) {
    console.warn("[productLink] Race condition notice:", err);
  }

  // Strategy 3: Check static initial system catalog
  if (immediateStatic) {
    const product = sanitizeProductData(immediateStatic.id, immediateStatic);
    return evaluateProductAvailability(product);
  }

  const staticFound = ALL_INITIAL_PRODUCTS.find(p => 
    p.id.toLowerCase() === cleanId.toLowerCase() || 
    p.nameEn?.toLowerCase() === cleanId.toLowerCase() ||
    p.nameBn === cleanId
  );

  if (staticFound) {
    const product = sanitizeProductData(staticFound.id, staticFound);
    return evaluateProductAvailability(product);
  }

  // Strategy 4: Check default food catalog
  const foodFound = defaultFoodCatalog.find(p => p.id === cleanId || p.id.toLowerCase() === cleanId.toLowerCase());
  if (foodFound) {
    const product = sanitizeProductData(foodFound.id, {
      nameBn: foodFound.nameBn,
      name: foodFound.nameBn,
      price: foodFound.pricePerUnit,
      discountPrice: foodFound.pricePerUnit,
      weight: `${foodFound.unitWeightKg} ${foodFound.unit}`,
      unit: foodFound.unit,
      image: foodFound.image,
      images: [foodFound.image],
      description: `${foodFound.brand} এর মানসম্পন্ন ও ফ্রেশ পণ্য।`,
      status: "active",
      stockQuantity: 100
    });
    return evaluateProductAvailability(product);
  }

  return {
    product: null,
    status: "not_found",
    message: "দুঃখিত, এই পণ্যটি বর্তমানে উপলব্ধ নয়"
  };
}

function sanitizeProductData(id: string, data: any): ResolvedProduct {
  let images = data.images && Array.isArray(data.images) && data.images.length > 0 
    ? [...data.images] 
    : [data.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80"];

  const defaultImagesPool = [
    images[0],
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80",
    "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&q=80",
    "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&q=80"
  ];

  while (images.length < 5) {
    images.push(defaultImagesPool[images.length % defaultImagesPool.length]);
  }

  const regularPrice = Number(data.price || data.basePrice || 0);
  const discountPrice = Number(data.discountPrice || regularPrice);
  const discountPercent = Number(data.discountPercent || data.discountPercentage || 0);

  return {
    id: id,
    numericId: data.numericId || data.code || id.replace(/\D/g, "") || undefined,
    code: data.code,
    name: data.name || data.nameBn || "পণ্য",
    nameBn: data.nameBn || data.name || "পণ্য",
    nameEn: data.nameEn || data.name,
    categoryId: data.categoryId,
    price: regularPrice,
    discountPrice: discountPrice,
    discountPercent: discountPercent,
    weight: data.weight || data.unit || "",
    unit: data.unit || data.weight || "",
    stockQuantity: data.stockQuantity !== undefined ? Number(data.stockQuantity) : 50,
    stockStatus: data.stockStatus || (data.status === "inactive" ? "Out of Stock" : "In Stock"),
    description: data.description || data.descriptionBn || "আল মায়াদিন বাজারের প্রিমিয়াম কোয়ালিটির পণ্য।",
    image: images[0],
    images: images,
    colors: data.colors || (data.color ? [data.color] : []),
    sizes: data.sizes || (data.size ? [data.size] : []),
    variants: data.variants || [],
    brand: data.brand || "আল মায়াদিন",
    rating: data.rating || 4.9,
    reviews: data.reviews || "150+",
    status: data.status || "active",
    isDeleted: data.isDeleted === true
  };
}

function evaluateProductAvailability(product: ResolvedProduct): ProductFetchResult {
  if (product.isDeleted) {
    return {
      product: null,
      status: "unavailable",
      message: "দুঃখিত, এই পণ্যটি বর্তমানে উপলব্ধ নয়"
    };
  }

  if (product.status === "inactive") {
    return {
      product: product,
      status: "unavailable",
      message: "দুঃখিত, এই পণ্যটি বর্তমানে উপলব্ধ নয়"
    };
  }

  if (product.stockStatus === "Out of Stock" || product.stockStatus === "out_of_stock" || (product.stockQuantity !== undefined && product.stockQuantity <= 0)) {
    return {
      product: product,
      status: "out_of_stock",
      message: "দুঃখিত, এই পণ্যটি বর্তমানে স্টকে নেই।"
    };
  }

  return {
    product,
    status: "found"
  };
}

/**
 * Generate formatted share messages for social media & messaging apps
 */
export function generateShareDetails(product: ResolvedProduct, preferredDomain?: string) {
  const deepLink = getProductDeepLink(product);
  const title = product.nameBn || product.name || "আল মায়াদিন বাজার";
  const price = product.discountPrice || product.price;
  const originalPrice = product.price;
  const hasDiscount = originalPrice && price < originalPrice;

  const priceText = hasDiscount 
    ? `৳${price} (মূল মূল্য: ৳${originalPrice})` 
    : `৳${price}`;

  const messageText = `🛍️ *AL MAYADIN BAZAR*\n📌 *${title}*\n💰 অফার মূল্য: ${priceText}\n🚚 সারাদেশে ক্যাশ অন ডেলিভারি!\n\n📱 *অ্যাপে সরাসরি পণ্যটি দেখতে ও অর্ডার করতে ক্লিক করুন:*\n${deepLink}`;

  const encodedText = encodeURIComponent(messageText);

  return {
    title,
    deepLink,
    shareUrl: deepLink,
    messageText,
    whatsappUrl: `https://api.whatsapp.com/send?text=${encodedText}`,
    facebookUrl: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(deepLink)}&quote=${encodedText}`,
    messengerUrl: `fb-messenger://share/?link=${encodeURIComponent(deepLink)}`,
    telegramUrl: `https://t.me/share/url?url=${encodeURIComponent(deepLink)}&text=${encodeURIComponent(`🛍️ ${title} - ${priceText}`)}`,
    smsUrl: `sms:?body=${encodedText}`
  };
}
