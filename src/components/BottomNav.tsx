import React from "react";
import { Home, LayoutGrid, ShoppingCart, User, Scan } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useScanner } from "../context/ScannerContext";

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const { totalItems } = useCart();
  const { openScanner } = useScanner();
  const isFoodMarket = location.pathname === "/category/cat1" || location.pathname.startsWith("/food/");
  const isAdmin = location.pathname.startsWith("/admin") || location.pathname.startsWith("/super-admin");

  if (isFoodMarket || isAdmin) return null;

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 w-full bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] transform-gpu will-change-transform pb-[env(safe-area-inset-bottom,0px)] select-none"
      style={{ touchAction: "manipulation" }}
    >
      <div className="max-w-lg mx-auto px-4 py-1.5 flex justify-between items-center h-[66px]">
        {/* 1. Home */}
        <Link
          to="/"
          className={`flex flex-col items-center gap-0.5 relative min-w-[54px] active:scale-90 transition-transform duration-75 cursor-pointer ${
            location.pathname === "/" ? "text-[#005a36]" : "text-gray-400 hover:text-gray-600"
          }`}
          style={{ touchAction: "manipulation" }}
        >
          {location.pathname === "/" && (
            <div className="absolute -top-1.5 w-7 h-1 bg-[#005a36] rounded-full" />
          )}
          <Home className={`w-6 h-6 ${location.pathname === "/" ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
          <span className="text-[10px] font-bold">হোম</span>
        </Link>

        {/* 2. Categories */}
        <Link
          to="/categories"
          className={`flex flex-col items-center gap-0.5 relative min-w-[54px] active:scale-90 transition-transform duration-75 cursor-pointer ${
            location.pathname === "/categories" ? "text-[#005a36]" : "text-gray-400 hover:text-gray-600"
          }`}
          style={{ touchAction: "manipulation" }}
        >
          {location.pathname === "/categories" && (
            <div className="absolute -top-1.5 w-7 h-1 bg-[#005a36] rounded-full" />
          )}
          <LayoutGrid className={`w-6 h-6 ${location.pathname === "/categories" ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
          <span className="text-[10px] font-bold">ক্যাটাগরি</span>
        </Link>

        {/* 3. Central Floating Scanner Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            openScanner();
          }}
          className="flex flex-col items-center -mt-6 group active:scale-90 transition-transform duration-75 cursor-pointer"
          title="সেন্ট্রাল বারকোড ও কিউআর স্ক্যানার"
          style={{ touchAction: "manipulation" }}
        >
          <div className="w-13 h-13 rounded-2xl bg-[#005a36] text-[#22c55e] flex items-center justify-center shadow-lg shadow-[#005a36]/35 border-2 border-white group-hover:scale-105 transition-transform">
            <Scan className="w-7 h-7 stroke-[2.8]" />
          </div>
          <span className="text-[10px] font-black text-[#005a36] mt-0.5">স্ক্যানার</span>
        </button>

        {/* 4. Cart */}
        <Link
          to="/cart"
          className={`flex flex-col items-center gap-0.5 relative min-w-[54px] active:scale-90 transition-transform duration-75 cursor-pointer ${
            location.pathname === "/cart" ? "text-[#005a36]" : "text-gray-400 hover:text-gray-600"
          }`}
          style={{ touchAction: "manipulation" }}
        >
          {location.pathname === "/cart" && (
            <div className="absolute -top-1.5 w-7 h-1 bg-[#005a36] rounded-full" />
          )}
          <div className="relative">
            <ShoppingCart className={`w-6 h-6 ${location.pathname === "/cart" ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
            <span className="absolute -top-1.5 -right-2 bg-[#ffb703] text-black text-[9.5px] font-black w-4.5 h-4.5 flex items-center justify-center rounded-full border-2 border-white shadow-xs">
              {totalItems > 0 ? totalItems : 1}
            </span>
          </div>
          <span className="text-[10px] font-bold">কার্ট</span>
        </Link>

        {/* 5. Account */}
        <Link
          to="/account"
          className={`flex flex-col items-center gap-0.5 relative min-w-[54px] active:scale-90 transition-transform duration-75 cursor-pointer ${
            location.pathname === "/account" ? "text-[#005a36]" : "text-gray-400 hover:text-gray-600"
          }`}
          style={{ touchAction: "manipulation" }}
        >
          {location.pathname === "/account" && (
            <div className="absolute -top-1.5 w-7 h-1 bg-[#005a36] rounded-full" />
          )}
          <User className={`w-6 h-6 ${location.pathname === "/account" ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
          <span className="text-[10px] font-bold">অ্যাকাউন্ট</span>
        </Link>
      </div>
    </nav>
  );
};

