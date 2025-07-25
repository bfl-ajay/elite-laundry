import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import Logo from './Logo';
import { 
  DashboardIllustration, 
  LaundryBasketIcon, 
  ExpenseIllustration,
  MoneyIcon 
} from '../../assets/icons/laundry-icons';

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const {
    canViewDashboard,
    canViewAnalytics,
    canAccessSettings,
    roleDisplayName
  } = usePermissions();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Define all possible navigation items with role requirements
  const allNavItems = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: DashboardIllustration,
      iconProps: { className: 'w-5 h-5 sm:w-6 sm:h-6' },
      roles: ['admin', 'super_admin'], // Only admin and super_admin can see dashboard
      show: canViewDashboard
    },
    {
      path: '/orders',
      label: 'Orders',
      icon: LaundryBasketIcon,
      iconProps: { className: 'w-5 h-5 sm:w-6 sm:h-6 text-current' },
      roles: ['employee', 'admin', 'super_admin'], // All roles can see orders
      show: true
    },
    {
      path: '/expenses',
      label: 'Expenses',
      icon: MoneyIcon,
      iconProps: { className: 'w-5 h-5 sm:w-6 sm:h-6 text-current' },
      roles: ['employee', 'admin', 'super_admin'], // All roles can see expenses
      show: true
    },
    {
      path: '/analytics',
      label: 'Analytics',
      icon: ExpenseIllustration,
      iconProps: { className: 'w-5 h-5 sm:w-6 sm:h-6 text-current' },
      roles: ['admin', 'super_admin'], // Only admin and super_admin can see analytics
      show: canViewAnalytics
    },
    {
      path: '/users',
      label: 'Users',
      icon: DashboardIllustration, // Using dashboard icon for now, can be changed
      iconProps: { className: 'w-5 h-5 sm:w-6 sm:h-6' },
      roles: ['super_admin'], // Only super_admin can see user management
      show: canAccessSettings // Using same permission check as settings
    },
    {
      path: '/settings',
      label: 'Settings',
      icon: DashboardIllustration, // Using dashboard icon for now, can be changed
      iconProps: { className: 'w-5 h-5 sm:w-6 sm:h-6' },
      roles: ['super_admin'], // Only super_admin can see business settings
      show: canAccessSettings
    }
  ];

  // Filter navigation items based on user role and permissions
  const navItems = allNavItems.filter(item => item.show);

  const isActive = (path) => location.pathname === path;

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white shadow-lg border-b border-primary-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link 
              to="/dashboard" 
              className="transition-transform duration-200 hover:scale-105"
              onClick={closeMobileMenu}
            >
              <Logo 
                variant="compact" 
                size="md" 
                showTagline={false}
                className="hidden sm:block"
              />
              <Logo 
                variant="compact" 
                size="sm" 
                showTagline={false}
                className="sm:hidden"
              />
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-4 lg:space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 hover:shadow-md ${
                    isActive(item.path)
                      ? 'bg-primary-100 text-primary-700 shadow-sm'
                      : 'text-primary-600 hover:text-primary-700 hover:bg-primary-50'
                  }`}
                >
                  <Icon {...item.iconProps} />
                  <span className="hidden lg:block">{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Desktop User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {/* User Info */}
            <div className="flex items-center space-x-2 px-3 py-2 bg-primary-50 rounded-lg">
              <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user?.username?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="hidden lg:block">
                <div className="text-sm font-medium text-primary-700">{user?.username}</div>
                <div className="text-xs text-primary-500">{roleDisplayName}</div>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="text-primary-600 hover:text-primary-700 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-primary-50 hover:shadow-sm transform hover:scale-105"
            >
              Logout
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMobileMenu}
              className="text-gray-600 hover:text-gray-900 p-2 rounded-lg transition-all duration-200 hover:bg-gray-100 transform hover:scale-105"
              aria-label="Toggle mobile menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <div className={`md:hidden transition-all duration-300 ease-in-out ${
          isMobileMenuOpen 
            ? 'max-h-96 opacity-100 pb-4' 
            : 'max-h-0 opacity-0 overflow-hidden'
        }`}>
          <div className="space-y-2 pt-2">
            {/* Mobile User Info */}
            <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50 rounded-lg mx-2 mb-2">
              <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
                <span className="text-white font-medium">
                  {user?.username?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">{user?.username}</div>
                <div className="text-xs text-gray-500">{roleDisplayName}</div>
              </div>
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={closeMobileMenu}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 transform hover:scale-105 ${
                    isActive(item.path)
                      ? 'bg-primary-100 text-primary-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon {...item.iconProps} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <button
              onClick={() => {
                handleLogout();
                closeMobileMenu();
              }}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200 transform hover:scale-105"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;