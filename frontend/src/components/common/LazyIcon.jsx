import React, { lazy, Suspense } from 'react';

// Lazy load icon components for better performance
const LazyIcon = ({ 
  iconName, 
  className = "w-6 h-6", 
  color = "currentColor",
  fallback = null,
  ...props 
}) => {
  // Dynamic import based on icon name
  const IconComponent = lazy(() => 
    import('../../assets/icons/laundry-icons').then(module => ({
      default: module[iconName]
    }))
  );

  const FallbackIcon = () => (
    fallback || (
      <div className={`${className} bg-gray-200 rounded animate-pulse`} />
    )
  );

  return (
    <Suspense fallback={<FallbackIcon />}>
      <IconComponent className={className} color={color} {...props} />
    </Suspense>
  );
};

// Preload commonly used icons
export const preloadIcons = (iconNames = []) => {
  iconNames.forEach(iconName => {
    import('../../assets/icons/laundry-icons').then(module => {
      // Icons are now cached
    });
  });
};

// Common icon sets for preloading
export const COMMON_ICONS = [
  'LoadingSpinnerIcon',
  'CheckIcon',
  'CloseIcon',
  'AlertTriangleIcon',
  'RefreshIcon'
];

export const LAUNDRY_ICONS = [
  'WashingMachineIcon',
  'IroningIcon',
  'DryCleanIcon',
  'StainRemovalIcon',
  'LaundryBasketIcon'
];

export const DASHBOARD_ICONS = [
  'DashboardIllustration',
  'ChartIcon',
  'MoneyIcon',
  'CalendarIcon'
];

export default LazyIcon;