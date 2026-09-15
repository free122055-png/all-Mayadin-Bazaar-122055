import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

interface BrandVariant {
  top: string;
  main: string;
  sub: string;
}

const VARIANTS: BrandVariant[] = [
  { top: "ALL", main: "MAYADIN", sub: "BAZAR" },
  { top: "অল", main: "মায়াদিন", sub: "বাজার" },
  { top: "সেরা", main: "All MAYADIN FASHION", sub: "সুপারশপ" },
  { top: "ALL", main: "MAYADIN", sub: "BAZAR" },
];

export const AnimatedBrandLogo: React.FC<{ isCompact?: boolean }> = ({ isCompact = false }) => {
  const [variantIndex, setVariantIndex] = useState(0);
  const [displayedMain, setDisplayedMain] = useState("");
  const [displayedSub, setDisplayedSub] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [charIndex, setCharIndex] = useState(0);

  const currentVariant = VARIANTS[variantIndex];
  const targetMain = currentVariant.main;
  const targetSub = currentVariant.sub;

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (!isDeleting) {
      // TYPING PHASE
      if (charIndex < targetMain.length) {
        timer = setTimeout(() => {
          setDisplayedMain(targetMain.slice(0, charIndex + 1));
          setCharIndex(prev => prev + 1);
        }, 110);
      } else {
        // Main text finished typing, type the subtitle if needed or show complete
        setDisplayedSub(targetSub);
        // Pause when fully typed
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, 2200);
      }
    } else {
      // DELETING / ERASING PHASE (নিভে যাওয়া)
      if (charIndex > 0) {
        timer = setTimeout(() => {
          setDisplayedMain(targetMain.slice(0, charIndex - 1));
          setCharIndex(prev => prev - 1);
        }, 55);
      } else {
        // Finished deleting, switch to next variant
        setDisplayedSub("");
        setIsDeleting(false);
        setVariantIndex((prev) => (prev + 1) % VARIANTS.length);
      }
    }

    return () => clearTimeout(timer);
  }, [charIndex, isDeleting, targetMain, targetSub]);

  return (
    <Link 
      to="/" 
      className={`flex flex-col items-center group transition-all duration-300 select-none ${
        isCompact ? "scale-90" : ""
      }`}
      title="All MAYADIN FASHION"
    >
      {/* Top Tag: ALL / অল + Shopping Bag Icon */}
      <div className="flex items-center gap-1 mb-[-2px]">
        <span className="text-[10px] sm:text-[11px] font-black tracking-[0.22em] text-white/95 uppercase transition-all duration-200">
          {currentVariant.top}
        </span>
        <div className="bg-[#ffb703] p-0.5 rounded-[4px] shadow-xs flex items-center justify-center">
          <svg 
            width="12" 
            height="12" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="#000" 
            strokeWidth="3.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
            <path d="M3 6h18"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
        </div>
      </div>

      {/* Main Dynamic Typography Heading (MAYADIN / মায়াদিন / All MAYADIN FASHION) */}
      <div className="flex items-center justify-center min-h-[28px] sm:min-h-[32px]">
        <span 
          className={`${
            isCompact ? "text-[18px]" : "text-[22px] sm:text-[25px]"
          } font-black tracking-tight leading-tight text-white transition-all drop-shadow-xs`}
        >
          {displayedMain}
        </span>
        {/* Blinking Glowing Cursor */}
        <span className="inline-block w-[2.5px] h-5 sm:h-6 bg-[#ffb703] ml-0.5 rounded-full animate-pulse shadow-[0_0_8px_rgba(255,183,3,0.8)]" />
      </div>

      {/* Subtitle / Bottom Line (BAZAR / বাজার / সুপারশপ) */}
      <div className="min-h-[14px] flex items-center justify-center">
        <span 
          className={`text-[10px] sm:text-[11px] font-black text-[#ffb703] tracking-[0.45em] uppercase leading-none transition-all duration-300 ${
            !displayedSub ? "opacity-0 scale-90" : "opacity-100 scale-100"
          }`}
        >
          {displayedSub || targetSub}
        </span>
      </div>
    </Link>
  );
};
export default AnimatedBrandLogo;
