import React from 'react';

const CalendarIcon = ({ className = "w-6 h-6", color = "currentColor" }) => (
  <svg
    className={className}
    fill="none"
    stroke={color}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2" />
    <path d="M16 2v4M8 2v4M3 10h18" strokeWidth="2" />
    <circle cx="8" cy="14" r="1" fill={color} />
    <circle cx="12" cy="14" r="1" fill={color} />
    <circle cx="16" cy="14" r="1" fill={color} />
    <circle cx="8" cy="18" r="1" fill={color} />
    <circle cx="12" cy="18" r="1" fill={color} />
  </svg>
);

export default CalendarIcon;