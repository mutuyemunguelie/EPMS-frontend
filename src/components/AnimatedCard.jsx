import React from "react";

const AnimatedCard = ({ children, className = "" }) => {
  return (
    <div className={className}>
      {children}
    </div>
  );
};

export default AnimatedCard;