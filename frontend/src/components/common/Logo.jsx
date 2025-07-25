import React from 'react';
import logoSvg from '../../assets/logo.svg';
import logoCompactSvg from '../../assets/logo-compact.svg';

const Logo = ({ 
  variant = 'full', // 'full' | 'compact' | 'text-only'
  size = 'md', // 'sm' | 'md' | 'lg'
  className = '',
  showTagline = true 
}) => {
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-12',
    lg: 'h-16'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl'
  };

  const taglineSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  if (variant === 'compact') {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {/* <img 
          src={logoCompactSvg} 
          alt="Elite Laundry" 
          className={sizeClasses[size]}
        /> */}
        <div className="flex flex-col">
          <span className={`font-bold text-primary-700 leading-tight ${textSizeClasses[size]}`}>
            Elite Laundry
          </span>
          {showTagline && size !== 'sm' && (
            <span className={`text-primary-600 leading-tight ${taglineSizeClasses[size]}`}>
              Elite Care for Everyday Wear
            </span>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'text-only') {
    return (
      <div className={`flex flex-col ${className}`}>
        <span className={`font-bold text-primary-700 leading-tight ${textSizeClasses[size]}`}>
          Elite Laundry
        </span>
        {showTagline && (
          <span className={`text-primary-600 leading-tight ${taglineSizeClasses[size]}`}>
            Elite Care for Everyday Wear
          </span>
        )}
      </div>
    );
  }

  // Full logo
  return (
    <div className={`flex items-center ${className}`}>
      <img 
        src={logoSvg} 
        alt="Elite Laundry - Elite Care for Everyday Wear" 
        className={`${sizeClasses[size]} w-auto`}
      />
    </div>
  );
};

export default Logo;