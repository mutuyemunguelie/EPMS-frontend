import React, { useEffect, useState } from "react";

const Modal = ({ open, onClose, children, maxWidth = "max-w-md" }) => {
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (open) {
      setVisible(true);
      requestAnimationFrame(() => setAnimating(true));
    } else {
      setAnimating(false);
      const t = setTimeout(() => setVisible(false), 150);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center px-4
                  transition-all duration-150 ${animating ? "opacity-100" : "opacity-0"}`}
      style={{ backgroundColor: animating ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0)" }}
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-xl shadow-card-lg border border-panel-200
                    w-full ${maxWidth} p-6
                    transition-all duration-200
                    ${animating
                      ? "opacity-100 scale-100 translate-y-0"
                      : "opacity-0 scale-95 translate-y-2"}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

export default Modal;