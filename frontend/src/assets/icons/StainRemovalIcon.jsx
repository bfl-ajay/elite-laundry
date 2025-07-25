import React from 'react';

const StainRemovalIcon = ({ className = "w-6 h-6", color = "currentColor" }) => (
  <svg
    className={className}
    fill="none"
    stroke={color}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="12" cy="12" r="9" strokeWidth="2" />
    <path 
      d="M8 8l8 8M16 8l-8 8" 
      strokeWidth="2"
      strokeLinecap="round"
    />
    <circle cx="9" cy="9" r="2" strokeWidth="1.5" opacity="0.6" />
    <circle cx="15" cy="15" r="1.5" strokeWidth="1.5" opacity="0.4" />
    <circle cx="7" cy="16" r="1" strokeWidth="1" opacity="0.3" />
  </svg>
);

export default StainRemovalIcon;