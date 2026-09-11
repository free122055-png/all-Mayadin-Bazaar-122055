import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Heart, ShoppingCart, Trash2, ArrowLeft, RefreshCw, ShoppingBag, ChevronRight } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { db } from "../lib/firebase";
import { collection, query, where, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import { handleFirestoreError, OperationType } from "../lib/firebase";
import { motion, AnimatePresence } from "motion/react";

interface WishlistItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  image: string;
  stock?: boolean;
}

export const Wishlist: React.FC = () => {
  const { addItem } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "wishlist"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as WishlistItem[];
      setItems(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "wishlist");
    });

    return () => unsubscribe();
  }, [user]);

  const removeItem = async (id: string) => {
    try {
      await deleteDoc(doc(db, "wishlist", id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `wishlist/${id}`);
    }
  };

  const handleMoveToCart = async (item: WishlistItem) => {
    addItem({
      productId: item.productId,
      name: item.name,
      price: item.price,
      quantity: 1,
      image: item.image
    });
    // Optional: remove from wishlist after adding to cart
    // await removeItem(item.id);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-[#004b23] px-5 pt-10 pb-6 rounded-b-[40px] shadow-lg sticky top-0 z-50 flex items-center justify-between text-white">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md active:scale-90 transition-transform">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-black">পছন্দের তালিকা</h1>
        </div>
        <div className="bg-white/20 px-3 py-1.5 rounded-xl backdrop-blur-md text-[10px] font-black uppercase tracking-widest">
          {items.length} Items
        </div>
      </div>

      <div className="p-4 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <RefreshCw className="w-10 h-10 text-[#004b23] animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
            <div className="w-32 h-32 bg-white rounded-[40px] shadow-sm flex items-center justify-center">
              <Heart className="w-14 h-14 text-red-50 grayscale opacity-20" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-gray-800">তালিকা খালি!</h3>
              <p className="text-xs text-gray-400 font-medium px-10">আপনার পছন্দের পণ্যগুলো এখানে সেভ করে রাখতে পারেন।</p>
            </div>
            <Link 
              to="/" 
              className="bg-[#004b23] text-white font-black py-4 px-10 rounded-2xl shadow-xl shadow-[#004b23]/20 flex items-center gap-2"
            >
              পণ্য দেখুন <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            <AnimatePresence>
              {items.map((item, i) => (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white p-4 rounded-[32px] shadow-sm border border-gray-100 flex items-center gap-4 group"
                >
                  <div className="w-20 h-20 bg-gray-50 rounded-2xl overflow-hidden shrink-0 border border-gray-100">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <h3 className="text-sm font-black text-gray-800 leading-tight">{item.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">Available</span>
                    </div>
                    <p className="text-sm font-black text-[#004b23]">৳{item.price}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={() => handleMoveToCart(item)}
                      className="w-10 h-10 bg-[#004b23] text-white rounded-xl shadow-lg shadow-[#004b23]/10 flex items-center justify-center active:scale-90 transition-all"
                    >
                      <ShoppingCart className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => removeItem(item.id)}
                      className="w-10 h-10 bg-red-50 text-red-400 rounded-xl flex items-center justify-center active:scale-90 transition-all hover:bg-red-500 hover:text-white"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};
