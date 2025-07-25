import React from 'react';

const LaundryBasketIcon = ({ className = "w-6 h-6", color = "currentColor" }) => (
  <svg
    className={className}
    fill="none"
    stroke={color}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      d="M4 8h16l-1 12H5L4 8z" 
      strokeWidth="2"
    />
    <path 
      d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" 
      strokeWidth="2"
    />
    <path 
      d="M6 12h12" 
      strokeWidth="1"
      opacity="0.5"
    />
    <path 
      d="M7 16h10" 
      strokeWidth="1"
      opacity="0.5"
    />
    <circle cx="8" cy="10" r="0.5" fill={color} />
    <circle cx="16" cy="10" r="0.5" fill={color} />
  </svg>
);

export default LaundryBasketIcon;