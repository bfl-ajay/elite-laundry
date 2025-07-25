import React, { useState, useEffect } from 'react';
import { XMarkIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import userService from '../../services/userService';

const UserForm = ({ user, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'employee'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const isEditing = !!user;

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        password: '',
        role: user.role || 'employee'
      });
    }
  }, [user]);

  const validateForm = () => {
    const errors = {};

    // Username validation
    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    } else if (formData.username.length > 50) {
      errors.username = 'Username must not exceed 50 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      errors.username = 'Username can only contain letters, numbers, and underscores';
    }

    // Password validation (required for new users, optional for editing)
    if (!isEditing && !formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password && formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    // Role validation
    if (!['super_admin', 'admin', 'employee'].includes(formData.role)) {
      errors.role = 'Please select a valid role';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let response;
      const submitData = {
        username: formData.username.trim(),
        role: formData.role
      };

      // Only include password if it's provided
      if (formData.password) {
        submitData.password = formData.password;
      }

      if (isEditing) {
        response = await userService.updateUser(user.id, submitData);
      } else {
        response = await userService.createUser(submitData);
      }

      if (response.success) {
        onSave(response.data);
      } else {
        setError(response.error?.message || 'Failed to save user');
      }
    } catch (error) {
      console.error('Error saving user:', error);
      const errorMessage = error.response?.data?.error?.message || 'Failed to save user';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const getRoleDescription = (role) => {
    switch (role) {
      case 'super_admin':
        return 'Full system access including user management and business settings';
      case 'admin':
        return 'Full access to orders, expenses, and analytics';
      case 'employee':
        return 'Limited access to orders and expenses with restrictions';
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Edit User' : 'Create New User'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Username Field */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Username *
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validationErrors.username ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter username"
              disabled={loading}
            />
            {validationErrors.username && (
              <p className="text-red-600 text-sm mt-1">{validationErrors.username}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password {!isEditing && '*'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.password ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder={isEditing ? 'Leave blank to keep current password' : 'Enter password'}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
            {validationErrors.password && (
              <p className="text-red-600 text-sm mt-1">{validationErrors.password}</p>
            )}
            {isEditing && (
              <p className="text-gray-500 text-sm mt-1">
                Leave blank to keep the current password
              </p>
            )}
          </div>

          {/* Role Field */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              Role *
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validationErrors.role ? 'border-red-300' : 'border-gray-300'
              }`}
              disabled={loading}
            >
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
            {validationErrors.role && (
              <p className="text-red-600 text-sm mt-1">{validationErrors.role}</p>
            )}
            <p className="text-gray-500 text-sm mt-1">
              {getRoleDescription(formData.role)}
            </p>
          </div>

          {/* Role Permissions Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Role Permissions:</h4>
            <div className="text-sm text-blue-800 space-y-1">
              {formData.role === 'employee' && (
                <ul className="list-disc list-inside space-y-1">
                  <li>Create and view orders</li>
                  <li>Edit orders (if not completed/paid)</li>
                  <li>Create expenses (cannot edit after creation)</li>
                  <li>No access to dashboard or analytics</li>
                </ul>
              )}
              {formData.role === 'admin' && (
                <ul className="list-disc list-inside space-y-1">
                  <li>Full order management (create, edit, reject)</li>
                  <li>Full expense management</li>
                  <li>Access to dashboard and analytics</li>
                  <li>No access to business settings or user management</li>
                </ul>
              )}
              {formData.role === 'super_admin' && (
                <ul className="list-disc list-inside space-y-1">
                  <li>All admin permissions</li>
                  <li>User management</li>
                  <li>Business settings (logo, favicon)</li>
                  <li>Complete system access</li>
                </ul>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {isEditing ? 'Updating...' : 'Creating...'}
                </div>
              ) : (
                isEditing ? 'Update User' : 'Create User'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserForm;