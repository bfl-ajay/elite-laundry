import React from 'react';

const IroningIcon = ({ className = "w-6 h-6", color = "currentColor" }) => (
  <svg
    className={className}
    fill="none"
    stroke={color}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      d="M4 18h16v2H4v-2z" 
      fill={color} 
      stroke="none"
    />
    <path 
      d="M6 18V8c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2v10" 
      strokeWidth="2"
    />
    <path 
      d="M10 4h4v2h-4V4z" 
      fill={color} 
      stroke="none"
    />
    <circle cx="9" cy="10" r="1" fill={color} />
    <circle cx="15" cy="10" r="1" fill={color} />
  </svg>
);

export default IroningIcon;