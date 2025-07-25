import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinnerIcon, LaundryIllustration } from '../../assets/icons/laundry-icons';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <LaundryIllustration className="w-16 h-16 opacity-60" />
          </div>
          <LoadingSpinnerIcon className="w-8 h-8 mx-auto mb-4" color="#0099CC" />
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;