import React from "react";
import { Building2, Heart } from "lucide-react";

const Footer = () => {
  return (
    <footer className="mt-auto bg-white border-t border-panel-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-panel-500 text-xs">
            <Building2 size={13} />
            <span>SmartPark · Rubavu District, Rwanda</span>
          </div>
          <div className="flex items-center gap-1 text-panel-400 text-xs">
            <span>EPMS © {new Date().getFullYear()}</span>
            <span>·</span>
            <span className="flex items-center gap-0.5">
              Made with <Heart size={10} className="text-red-400 fill-red-400" /> SmartPark
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;