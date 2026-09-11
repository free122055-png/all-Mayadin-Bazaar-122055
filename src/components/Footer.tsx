import React from "react";
import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-100 pt-12 pb-24 md:pb-12 px-4 mt-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        {/* Brand */}
        <div className="space-y-6">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-[#004b23]">All mayadin</span>
              <span className="text-xl font-bold text-[#ffb703]">Bazar</span>
            </div>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Fresh. Pure. Trusted.</p>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">
            Your premium destination for fresh groceries and high-quality household essentials in Bangladesh.
          </p>
          <div className="flex items-center gap-4">
            {[Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
              <a key={i} href="#" className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-[#004b23] hover:text-white transition-all">
                <Icon className="w-5 h-5" />
              </a>
            ))}
          </div>
        </div>

        {/* Links */}
        <div className="space-y-6">
          <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Quick Links</h4>
          <ul className="space-y-3 text-sm text-gray-500 font-medium">
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/contact">Contact Us</Link></li>
            <li><Link to="/faq">FAQs</Link></li>
            <li><Link to="/policies">Return Policy</Link></li>
          </ul>
        </div>

        <div className="space-y-6">
          <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Categories</h4>
          <ul className="space-y-3 text-sm text-gray-500 font-medium">
            <li><Link to="/category/rice-flour">Rice & Flour</Link></li>
            <li><Link to="/category/dal-pulses">Dal & Pulses</Link></li>
            <li><Link to="/category/spices">Spices</Link></li>
            <li><Link to="/category/beverages">Beverages</Link></li>
          </ul>
        </div>

        {/* Contact */}
        <div className="space-y-6">
          <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Contact Info</h4>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-[#004b23] flex-shrink-0" />
              <span className="text-sm text-gray-500">Mirpur 12, Dhaka 1216, Bangladesh</span>
            </li>
            <li className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-[#004b23] flex-shrink-0" />
              <span className="text-sm text-gray-500">+880 1234 567890</span>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-[#004b23] flex-shrink-0" />
              <span className="text-sm text-gray-500">info@allmayadinbazar.com</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-gray-50 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
        <p>© 2026 All Mayadin Bazar. All Rights Reserved.</p>
        <div className="flex items-center gap-6">
          <Link to="/terms">Terms</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/cookies">Cookies</Link>
        </div>
      </div>
    </footer>
  );
};
