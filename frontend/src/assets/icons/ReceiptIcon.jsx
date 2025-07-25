import React from 'react';

const ReceiptIcon = ({ className = "w-6 h-6", color = "currentColor" }) => (
  <svg
    className={className}
    fill="none"
    stroke={color}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      d="M6 2h12v20l-3-2-3 2-3-2-3 2V2z" 
      strokeWidth="2"
    />
    <path 
      d="M9 7h6M9 11h6M9 15h4" 
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

export default ReceiptIcon;