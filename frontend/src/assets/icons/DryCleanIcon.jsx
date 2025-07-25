import React from 'react';

const DryCleanIcon = ({ className = "w-6 h-6", color = "currentColor" }) => (
  <svg
    className={className}
    fill="none"
    stroke={color}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      d="M7 4h10l2 16H5L7 4z" 
      strokeWidth="2"
    />
    <path 
      d="M9 4V2h6v2" 
      strokeWidth="2"
    />
    <path 
      d="M8 8h8" 
      strokeWidth="1.5"
    />
    <path 
      d="M8.5 12h7" 
      strokeWidth="1.5"
    />
    <path 
      d="M9 16h6" 
      strokeWidth="1.5"
    />
    <circle cx="12" cy="10" r="1" fill={color} />
  </svg>
);

export default DryCleanIcon;