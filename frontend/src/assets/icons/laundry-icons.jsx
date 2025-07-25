// Custom SVG icons for laundry management system

export const WashingMachineIcon = ({ className = "w-6 h-6", color = "currentColor" }) => (
  <svg className={className} fill={color} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 2.01L6 2c-1.11 0-2 .89-2 2v16c0 1.11.89 2 2 2h12c1.11 0 2-.89 2-2V4c0-1.11-.89-1.99-2-1.99zM18 20H6V4h12v16zM8 5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm2 0c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm2 3c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 8c-1.65 0-3-1.35-3-3s1.35-3 3-3 3 1.35 3 3-1.35 3-3 3z"/>
  </svg>
);

export const IroningIcon = ({ className = "w-6 h-6", color = "currentColor" }) => (
  <svg className={className} fill={color} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 6c-1.66 0-3 1.34-3 3v4c0 1.66 1.34 3 3 3s3-1.34 3-3V9c0-1.66-1.34-3-3-3zm1 7c0 .55-.45 1-1 1s-1-.45-1-1V9c0-.55.45-1 1-1s1 .45 1 1v4zM17.5 12c0 .28-.22.5-.5.5s-.5-.22-.5-.5.22-.5.5-.5.5.22.5.5zM12 3L2 12h3v8h14v-8h3L12 3zm5 15H7v-6.83l5-4.17 5 4.17V18z"/>
  </svg>
);

export const DryCleanIcon = ({ className = "w-6 h-6", color = "currentColor" }) => (
  <svg className={className} fill={color} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z"/>
  </svg>
);

export const StainRemovalIcon = ({ className = "w-6 h-6", color = "currentColor" }) => (
  <svg className={className} fill={color} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
  </svg>
);

export const LaundryBasketIcon = ({ className = "w-6 h-6", color = "currentColor" }) => (
  <svg className={className} fill={color} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.5 4.5c-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-1.45-1.1-3.55-1.5-5.5-1.5zm3.5 15c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v12z"/>
    <path d="M11 7.5c0 .83.67 1.5 1.5 1.5S14 8.33 14 7.5 13.33 6 12.5 6 11 6.67 11 7.5z"/>
  </svg>
);

export const MoneyIcon = ({ className = "w-6 h-6", color = "currentColor" }) => (
  <svg className={className} fill={color} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
  </svg>
);

export const CalendarIcon = ({ className = "w-6 h-6", color = "currentColor" }) => (
  <svg className={className} fill={color} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
  </svg>
);

export const ChartIcon = ({ className = "w-6 h-6", color = "currentColor" }) => (
  <svg className={className} fill={color} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"/>
  </svg>
);

export const FileUploadIcon = ({ className = "w-6 h-6", color = "currentColor" }) => (
  <svg className={className} fill={color} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
    <path d="M12 11L16 15H13V19H11V15H8L12 11Z"/>
  </svg>
);

export const LoadingSpinnerIcon = ({ className = "w-6 h-6", color = "currentColor" }) => (
  <svg className={`${className} animate-spin`} fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke={color} strokeWidth="4"></circle>
    <path className="opacity-75" fill={color} d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

export const CheckIcon = ({ className = "w-6 h-6", color = "currentColor" }) => (
  <svg className={className} fill={color} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
  </svg>
);

export const CloseIcon = ({ className = "w-6 h-6", color = "currentColor" }) => (
  <svg className={className} fill={color} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
  </svg>
);

export const EditIcon = ({ className = "w-6 h-6", color = "currentColor" }) => (
  <svg className={className} fill={color} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
  </svg>
);

export const DeleteIcon = ({ className = "w-6 h-6", color = "currentColor" }) => (
  <svg className={className} fill={color} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
  </svg>
);

// Laundry-themed illustrations
export const LaundryIllustration = ({ className = "w-32 h-32", color = "#0099CC" }) => (
  <svg className={className} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="washingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={color} stopOpacity="0.8"/>
        <stop offset="100%" stopColor="#00C1D4" stopOpacity="0.6"/>
      </linearGradient>
    </defs>
    
    {/* Washing machine body */}
    <rect x="40" y="60" width="120" height="120" rx="10" fill="url(#washingGradient)" stroke={color} strokeWidth="2"/>
    
    {/* Control panel */}
    <rect x="50" y="70" width="100" height="20" rx="5" fill="#F7FAFC" stroke={color} strokeWidth="1"/>
    
    {/* Door */}
    <circle cx="100" cy="130" r="35" fill="none" stroke={color} strokeWidth="3"/>
    <circle cx="100" cy="130" r="30" fill="#F7FAFC" fillOpacity="0.3"/>
    
    {/* Door handle */}
    <circle cx="125" cy="130" r="3" fill={color}/>
    
    {/* Water/soap bubbles */}
    <circle cx="85" cy="115" r="4" fill="#00C1D4" fillOpacity="0.6"/>
    <circle cx="110" cy="125" r="3" fill="#00C1D4" fillOpacity="0.7"/>
    <circle cx="95" cy="140" r="2" fill="#00C1D4" fillOpacity="0.8"/>
    <circle cx="115" cy="145" r="3" fill="#00C1D4" fillOpacity="0.6"/>
    
    {/* Clothes inside */}
    <path d="M 80 120 Q 90 110 100 120 Q 110 130 120 120" stroke="#38A169" strokeWidth="2" fill="none"/>
    <path d="M 85 135 Q 95 125 105 135 Q 115 145 125 135" stroke="#E53E3E" strokeWidth="2" fill="none"/>
  </svg>
);

export const ExpenseIllustration = ({ className = "w-32 h-32", color = "#D69E2E" }) => (
  <svg className={className} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="expenseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={color} stopOpacity="0.8"/>
        <stop offset="100%" stopColor="#38A169" stopOpacity="0.6"/>
      </linearGradient>
    </defs>
    
    {/* Receipt/Bill */}
    <rect x="60" y="40" width="80" height="120" rx="5" fill="url(#expenseGradient)" stroke={color} strokeWidth="2"/>
    
    {/* Receipt lines */}
    <line x1="70" y1="60" x2="130" y2="60" stroke="#F7FAFC" strokeWidth="2"/>
    <line x1="70" y1="75" x2="120" y2="75" stroke="#F7FAFC" strokeWidth="1"/>
    <line x1="70" y1="90" x2="125" y2="90" stroke="#F7FAFC" strokeWidth="1"/>
    <line x1="70" y1="105" x2="115" y2="105" stroke="#F7FAFC" strokeWidth="1"/>
    <line x1="70" y1="120" x2="130" y2="120" stroke="#F7FAFC" strokeWidth="2"/>
    <line x1="70" y1="135" x2="110" y2="135" stroke="#F7FAFC" strokeWidth="1"/>
    
    {/* Dollar sign */}
    <circle cx="100" cy="100" r="15" fill="#38A169" fillOpacity="0.8"/>
    <text x="100" y="108" textAnchor="middle" fill="#F7FAFC" fontSize="16" fontWeight="bold">$</text>
  </svg>
);

export const DashboardIllustration = ({ className = "w-32 h-32", color = "#0099CC" }) => (
  <svg className={className} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="dashboardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={color} stopOpacity="0.8"/>
        <stop offset="100%" stopColor="#00C1D4" stopOpacity="0.6"/>
      </linearGradient>
    </defs>
    
    {/* Dashboard background */}
    <rect x="30" y="50" width="140" height="100" rx="10" fill="url(#dashboardGradient)" stroke={color} strokeWidth="2"/>
    
    {/* Chart bars */}
    <rect x="50" y="120" width="15" height="20" fill="#38A169"/>
    <rect x="70" y="110" width="15" height="30" fill="#D69E2E"/>
    <rect x="90" y="100" width="15" height="40" fill="#E53E3E"/>
    <rect x="110" y="90" width="15" height="50" fill="#0099CC"/>
    <rect x="130" y="105" width="15" height="35" fill="#00C1D4"/>
    
    {/* Chart line */}
    <polyline points="50,80 70,70 90,60 110,50 130,65 150,55" 
              fill="none" stroke="#F7FAFC" strokeWidth="2" strokeDasharray="3,3"/>
  </svg>
);

// Additional icons for error handling
export const AlertTriangleIcon = ({ className = "w-6 h-6", color = "currentColor" }) => (
  <svg className={className} fill={color} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
  </svg>
);

export const InfoIcon = ({ className = "w-6 h-6", color = "currentColor" }) => (
  <svg className={className} fill={color} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
  </svg>
);

export const CheckCircleIcon = ({ className = "w-6 h-6", color = "currentColor" }) => (
  <svg className={className} fill={color} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
  </svg>
);

export const XIcon = ({ className = "w-6 h-6", color = "currentColor" }) => (
  <svg className={className} fill={color} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
  </svg>
);

export const RefreshIcon = ({ className = "w-6 h-6", color = "currentColor" }) => (
  <svg className={className} fill={color} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
  </svg>
);