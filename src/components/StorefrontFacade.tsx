import React from "react";
import storeFacadeImg from "../assets/images/mayadin_store_facade_1788168375366.jpg";

interface StorefrontFacadeProps {
  children?: React.ReactNode;
}

export const StorefrontFacade: React.FC<StorefrontFacadeProps> = () => {
  return (
    <div className="relative w-full overflow-hidden shadow-xl bg-[#031d12] border-y-2 border-[#095732]">
      {/* Background Storefront Facade Image */}
      <div className="relative w-full aspect-[16/9] sm:aspect-[2.1/1] overflow-hidden">
        <img 
          src={storeFacadeImg} 
          alt="All Mayadin Bazar Super Shop Storefront" 
          className="w-full h-full object-cover object-center"
        />

        {/* Subtle Dark Gradient Overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />
      </div>
    </div>
  );
};
