import React from "react";

export const AdminProductListing: React.FC = () => {
  return (
    <div id="admin-product-listing-empty" className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-gray-200 shadow-sm space-y-4">
        <div className="w-16 h-16 bg-emerald-50 text-[#004b23] rounded-2xl flex items-center justify-center mx-auto text-2xl font-black">
          ⚙️
        </div>
        <h1 className="text-xl font-black text-gray-900">
          এডমিন প্যানেল
        </h1>
        <p className="text-sm text-gray-500 font-medium leading-relaxed">
          খালি করা হয়েছে।
        </p>
      </div>
    </div>
  );
};
