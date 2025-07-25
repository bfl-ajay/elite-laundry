import React from 'react';

const WashingIcon = ({ className = "w-6 h-6", color = "currentColor" }) => (
  <svg
    className={className}
    fill="none"
    stroke={color}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="12" cy="12" r="9" strokeWidth="2" />
    <circle cx="12" cy="12" r="6" strokeWidth="1.5" />
    <circle cx="12" cy="12" r="3" strokeWidth="1" />
    <path d="M8 8l8 8" strokeWidth="1" />
    <path d="M16 8l-8 8" strokeWidth="1" />
  </svg>
);

export default WashingIcon;