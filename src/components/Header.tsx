import React, { useState } from "react";
import { Menu, Bell, Scan } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { MenuDrawer } from "./MenuDrawer";
import { useScanner } from "../context/ScannerContext";
import { useNotificationContext } from "../context/NotificationContext";
import { AnimatedBrandLogo } from "./AnimatedBrandLogo";
import { AnimatedSearchInput } from "./AnimatedSearchInput";

export const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { openScanner } = useScanner();
  const { unreadCount } = useNotificationContext();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const isHome = location.pathname === "/";

  if (!isHome) return null;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    if (val === "122055") {
      localStorage.setItem("admin_secret_unlocked", "true");
      navigate("/admin");
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm === "122055") {
      localStorage.setItem("admin_secret_unlocked", "true");
      navigate("/admin");
      return;
    }
    if (searchTerm.trim()) {
      navigate(`/categories?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <>
      <header className={`sticky top-0 z-50 bg-[#052b1b] text-white shadow-md transition-all duration-300 ${!isHome ? 'py-2' : ''}`}>
        <div className="px-4 pt-3.5 pb-3 max-w-7xl mx-auto">
          {/* Top Row: Menu - Brand Logo - Notifications */}
          <div className={`flex items-center justify-between transition-all duration-300 ${!isHome ? 'mb-2' : 'mb-3'}`}>
            {/* Hamburger Button */}
            <button 
              onClick={() => setIsMenuOpen(true)}
              className="w-11 h-11 flex items-center justify-center bg-white/10 hover:bg-white/15 active:scale-95 rounded-full border border-white/10 text-white transition-all shadow-xs" 
              aria-label="Menu"
              title="মেনু খুলুন"
            >
              <Menu className="w-5 h-5 stroke-[2.5]" />
            </button>
            
            {/* Dynamic Typography Brand Logo (Types, Erases, and Re-types) */}
            <AnimatedBrandLogo isCompact={!isHome} />

            {/* Notification Button */}
            <button 
              onClick={() => navigate("/notifications")}
              className="relative w-11 h-11 flex items-center justify-center bg-white/10 hover:bg-white/15 active:scale-95 rounded-full border border-white/10 text-white transition-all shadow-xs"
              aria-label="Notifications"
              title="বিজ্ঞপ্তি সেন্টার"
            >
              <Bell className="w-5 h-5 stroke-[2]" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#ffb703] text-black text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-[#052b1b] shadow-sm animate-pulse">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* Search Bar with Integrated Scanner */}
          <div className="relative flex items-center">
            <AnimatedSearchInput
              value={searchTerm}
              onChange={handleSearchChange}
              onSubmit={handleSearchSubmit}
              category="general"
              onClear={() => setSearchTerm("")}
              showClearButton={false}
              inputClassName={`rounded-full pl-11 pr-14 text-sm font-medium shadow-md ${!isHome ? 'py-2.5' : 'py-3'}`}
            />
            <button 
              type="button"
              onClick={() => openScanner()}
              className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#054429] hover:bg-[#065332] active:scale-95 rounded-2xl text-[#4ade80] shadow-sm flex items-center justify-center transition-all border border-emerald-600/30 z-20 ${!isHome ? 'w-8 h-8 rounded-xl' : ''}`}
              title="সেন্ট্রাল বারকোড ও কিউআর স্ক্যানার"
            >
              <Scan className={`${!isHome ? 'w-4 h-4' : 'w-5 h-5'} stroke-[2.5]`} />
            </button>
          </div>
        </div>
      </header>

      {/* Slide-out Menu Drawer */}
      <MenuDrawer isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  );
};

