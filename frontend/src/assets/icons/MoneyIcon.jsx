import React from 'react';

const MoneyIcon = ({ className = "w-6 h-6", color = "currentColor" }) => (
  <svg
    className={className}
    fill="none"
    stroke={color}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="12" cy="12" r="9" strokeWidth="2" />
    <path 
      d="M12 6v12M9 9h6M9 15h6" 
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path 
      d="M10.5 6h3M10.5 18h3" 
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

export default MoneyIcon;