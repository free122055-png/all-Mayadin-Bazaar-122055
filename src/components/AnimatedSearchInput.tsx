import React, { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AnimatedSearchInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit?: (e: React.FormEvent) => void;
  category?: string; // e.g. 'food', 'electronics', 'beauty', 'clothing', 'general'
  placeholderOverride?: string[];
  className?: string;
  inputClassName?: string;
  iconClassName?: string;
  onClear?: () => void;
  showClearButton?: boolean;
}

const CATEGORY_PLACEHOLDERS: Record<string, string[]> = {
  food: [
    "তাজা শাকসবজি ও ফলমূল খুঁজুন...",
    "চাল, ডাল, তেল ও মসলা খুঁজুন...",
    "দুধ, ডিম ও প্রাতঃরাশের সামগ্রী...",
    "মাছ, মাংস ও অর্গানিক খাবার..."
  ],
  electronics: [
    "স্মার্টফোন ও হেডফোন খুঁজুন...",
    "ল্যাপটপ ও কম্পিউটার এক্সেসরিজ...",
    "স্মার্টওয়াচ ও পাওয়ার ব্যাংক...",
    "ব্লুটুথ স্পিকার ও গ্যাজেট..."
  ],
  beauty: [
    "লিপস্টিক ও মেকআপ সামগ্রী...",
    "স্কিন কেয়ার ক্রিম ও সিরাম...",
    "শ্যাম্পু ও হেয়ার কেয়ার...",
    "প্রিমিয়াম পারফিউম ও বডি স্প্রে..."
  ],
  clothing: [
    "স্টাইলিশ পাঞ্জাবি ও শার্ট খুঁজুন...",
    "আর্ষণীয় শাড়ি ও থ্রিপিস...",
    "শিশুদের ফ্যাশনেবল পোশাক...",
    "শীতের জ্যাকেট ও হুডি..."
  ],
  islamic: [
    "নরম জায়নামাজ ও তসবিহ খুঁজুন...",
    "হালাল আতর ও সুরমা...",
    "ইসলামিক কিতাব ও কোরআন শরীফ...",
    "টুপি ও জায়নামাজ সেট..."
  ],
  general: [
    "খাদ্যপণ্য বা মুদি বাজার খুঁজুন...",
    "ইলেকট্রনিক্স ও গ্যাজেট খুঁজুন...",
    "রূপসজ্জা ও পোশাক সামগ্রী...",
    "বিশেষ উপহার ও বই খুঁজুন..."
  ]
};

export const AnimatedSearchInput: React.FC<AnimatedSearchInputProps> = ({
  value,
  onChange,
  onSubmit,
  category = "general",
  placeholderOverride,
  className = "",
  inputClassName = "",
  iconClassName = "w-5 h-5 text-gray-400",
  onClear,
  showClearButton = true
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);

  const placeholders = placeholderOverride || CATEGORY_PLACEHOLDERS[category] || CATEGORY_PLACEHOLDERS.general;

  useEffect(() => {
    // If user is typing or input is focused, don't rotate
    if (value || isFocused || placeholders.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % placeholders.length);
    }, 2800);

    return () => clearInterval(timer);
  }, [value, isFocused, placeholders.length]);

  return (
    <form onSubmit={onSubmit} className={`relative flex items-center w-full ${className}`}>
      <div className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10 ${iconClassName}`}>
        <Search className="w-4 h-4 stroke-[2.2]" />
      </div>

      <div className="relative w-full flex items-center">
        <input
          type="text"
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`w-full bg-white text-gray-800 rounded-2xl py-3 pl-10 pr-10 text-xs sm:text-sm font-bold shadow-xs focus:outline-none focus:ring-2 focus:ring-[#004b23] transition-all ${inputClassName}`}
        />

        {/* Animated Placeholder overlay when input is empty and not focused */}
        {!value && !isFocused && (
          <div className="absolute left-10 right-12 top-1/2 -translate-y-1/2 pointer-events-none overflow-hidden h-6 flex items-center">
            <AnimatePresence mode="wait">
              <motion.span
                key={currentIndex}
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -15, opacity: 0 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="text-xs sm:text-sm font-medium text-gray-400 truncate block whitespace-nowrap"
              >
                {placeholders[currentIndex]}
              </motion.span>
            </AnimatePresence>
          </div>
        )}

        {/* Clear Button */}
        {showClearButton && value && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors z-10"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </form>
  );
};
export default AnimatedSearchInput;
