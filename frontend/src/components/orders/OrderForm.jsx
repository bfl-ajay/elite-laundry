import React, { useState } from 'react';
import { WashingMachineIcon, IroningIcon, DryCleanIcon, StainRemovalIcon } from '../../assets/icons/laundry-icons';
import { orderService } from '../../services';
import { useError } from '../../contexts/ErrorContext';
import useFormValidation from '../../hooks/useFormValidation';
import useAsyncOperation from '../../hooks/useAsyncOperation';
import { InlineLoader } from '../common/LoadingState';

const OrderForm = ({ onOrderCreated, onCancel }) => {
  const { handleApiError } = useError();
  
  const initialValues = {
    customerName: '',
    contactNumber: '',
    customerAddress: '',
    orderDate: new Date().toISOString().split('T')[0],
    services: []
  };

  const validationRules = {
    customerName: [
      'required',
      { type: 'minLength', value: 2, message: 'Customer name must be at least 2 characters' },
      { type: 'maxLength', value: 100, message: 'Customer name must not exceed 100 characters' }
    ],
    contactNumber: [
      'required',
      { type: 'phone', message: 'Please enter a valid phone number' },
      { type: 'minLength', value: 10, message: 'Phone number must be at least 10 digits' }
    ],
    customerAddress: [
      { type: 'maxLength', value: 500, message: 'Address must not exceed 500 characters' }
    ],
    orderDate: ['required'],
    services: [
      { type: 'custom', validator: (services) => services && services.length > 0, message: 'At least one service is required' }
    ]
  };

  const {
    values: formData,
    errors,
    touched,
    isSubmitting,
    isValid,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue
  } = useFormValidation(initialValues, validationRules);

  const { execute: createOrder } = useAsyncOperation({
    onSuccess: () => {
      if (onOrderCreated) onOrderCreated();
    },
    errorContext: 'Creating order'
  });

  const serviceTypes = [
    { value: 'washing', label: 'Washing', icon: WashingMachineIcon, color: 'text-primary-500' },
    { value: 'ironing', label: 'Ironing', icon: IroningIcon, color: 'text-accent-500' },
    { value: 'dryclean', label: 'Dry Clean', icon: DryCleanIcon, color: 'text-success-500' },
    { value: 'stain_removal', label: 'Stain Removal', icon: StainRemovalIcon, color: 'text-warning-500' }
  ];

  const clothTypes = [
    { value: 'saari', label: 'Saari' },
    { value: 'normal', label: 'Normal' },
    { value: 'others', label: 'Others' }
  ];

  const addService = () => {
    const newServices = [...formData.services, {
      serviceType: 'washing',
      clothType: 'normal',
      quantity: 1,
      unitCost: 0
    }];
    setFieldValue('services', newServices);
  };

  const calculateTotal = () => {
    return formData.services.reduce((total, service) => {
      return total + (service.quantity * service.unitCost);
    }, 0);
  };

  const updateService = (index, field, value) => {
    const updatedServices = formData.services.map((service, i) => 
      i === index ? { ...service, [field]: value } : service
    );
    setFieldValue('services', updatedServices);
  };

  const removeService = (index) => {
    const filteredServices = formData.services.filter((_, i) => i !== index);
    setFieldValue('services', filteredServices);
  };

  const onSubmit = async (formValues) => {
    await createOrder(orderService.createOrder, formValues);
  };

  return (
    <div className="bg-surface rounded-lg shadow-md p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Create New Order</h2>
      
      <form onSubmit={(e) => {
        e.preventDefault();
        handleSubmit(onSubmit);
      }} className="space-y-4 sm:space-y-6">
        {/* Customer Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer Name *
            </label>
            <input
              type="text"
              required
              value={formData.customerName}
              onChange={(e) => handleChange('customerName', e.target.value)}
              onBlur={() => handleBlur('customerName')}
              className={`w-full px-3 py-2 sm:px-4 sm:py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 ${
                errors.customerName && touched.customerName 
                  ? 'border-error-500 bg-error-50 focus:ring-error-500' 
                  : 'border-gray-300'
              }`}
              placeholder="Enter customer name"
            />
            {errors.customerName && touched.customerName && (
              <p className="mt-1 text-sm text-error-600 animate-slideIn">{errors.customerName}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contact Number *
            </label>
            <input
              type="tel"
              required
              value={formData.contactNumber}
              onChange={(e) => handleChange('contactNumber', e.target.value)}
              onBlur={() => handleBlur('contactNumber')}
              className={`w-full px-3 py-2 sm:px-4 sm:py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 ${
                errors.contactNumber && touched.contactNumber 
                  ? 'border-error-500 bg-error-50 focus:ring-error-500' 
                  : 'border-gray-300'
              }`}
              placeholder="Enter contact number"
            />
            {errors.contactNumber && touched.contactNumber && (
              <p className="mt-1 text-sm text-error-600 animate-slideIn">{errors.contactNumber}</p>
            )}
          </div>
        </div>

        {/* Customer Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Customer Address
          </label>
          <textarea
            value={formData.customerAddress}
            onChange={(e) => handleChange('customerAddress', e.target.value)}
            onBlur={() => handleBlur('customerAddress')}
            className={`w-full px-3 py-2 sm:px-4 sm:py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 resize-none ${
              errors.customerAddress && touched.customerAddress 
                ? 'border-error-500 bg-error-50 focus:ring-error-500' 
                : 'border-gray-300'
            }`}
            placeholder="Enter customer address (optional)"
            rows={3}
            maxLength={500}
          />
          {errors.customerAddress && touched.customerAddress && (
            <p className="mt-1 text-sm text-error-600 animate-slideIn">{errors.customerAddress}</p>
          )}
          <div className="text-xs text-gray-500 mt-1">
            {formData.customerAddress.length}/500 characters
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Order Date *
            </label>
            <input
              type="date"
              required
              value={formData.orderDate}
              onChange={(e) => handleChange('orderDate', e.target.value)}
              onBlur={() => handleBlur('orderDate')}
              className={`w-full px-3 py-2 sm:px-4 sm:py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 ${
                errors.orderDate && touched.orderDate 
                  ? 'border-error-500 bg-error-50 focus:ring-error-500' 
                  : 'border-gray-300'
              }`}
            />
            {errors.orderDate && touched.orderDate && (
              <p className="mt-1 text-sm text-error-600 animate-slideIn">{errors.orderDate}</p>
            )}
          </div>
        </div>

        {/* Services */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 space-y-2 sm:space-y-0">
            <label className="block text-sm font-medium text-gray-700">
              Services *
            </label>
            <button
              type="button"
              onClick={addService}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-all duration-200 transform hover:scale-105 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 flex items-center justify-center space-x-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
              </svg>
              <span>Add Service</span>
            </button>
          </div>
          
          {errors.services && touched.services && (
            <p className="text-sm text-error-600 mb-4 animate-slideIn">{errors.services}</p>
          )}

          {formData.services.map((service, index) => {
            const selectedServiceType = serviceTypes.find(type => type.value === service.serviceType);
            const ServiceIcon = selectedServiceType?.icon;
            
            return (
              <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4 transition-all duration-300 hover:shadow-lg hover:border-primary-300 animate-slideIn bg-gradient-to-r from-white to-gray-50">
                {/* Mobile-first responsive grid */}
                <div className="space-y-4">
                  {/* Service Type and Cloth Type - Full width on mobile, side by side on larger screens */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Service Type
                      </label>
                      <div className="relative">
                        <select
                          value={service.serviceType}
                          onChange={(e) => updateService(index, 'serviceType', e.target.value)}
                          className="w-full px-3 py-2 pl-10 sm:px-4 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                        >
                          {serviceTypes.map(type => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                        {ServiceIcon && (
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                            <ServiceIcon className={`w-4 h-4 ${selectedServiceType.color}`} />
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cloth Type
                      </label>
                      <select
                        value={service.clothType}
                        onChange={(e) => updateService(index, 'clothType', e.target.value)}
                        className="w-full px-3 py-2 sm:px-4 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                      >
                        {clothTypes.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Quantity and Unit Cost - Full width on mobile, side by side on larger screens */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantity
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={service.quantity}
                        onChange={(e) => updateService(index, 'quantity', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 sm:px-4 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                        placeholder="Enter quantity"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Unit Cost (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={service.unitCost}
                        onChange={(e) => updateService(index, 'unitCost', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 sm:px-4 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* Total and Remove Button */}
                  <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between space-y-3 sm:space-y-0 pt-2 border-t border-gray-200">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Total Cost
                      </label>
                      <div className="px-4 py-2.5 bg-primary-50 border border-primary-200 rounded-lg text-lg font-bold text-primary-700">
                        ₹{(service.quantity * service.unitCost).toFixed(2)}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeService(index)}
                      className="px-4 py-2 bg-error-500 text-white rounded-lg hover:bg-error-600 transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-error-500 focus:ring-offset-2 flex items-center justify-center space-x-2 sm:ml-4"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/>
                      </svg>
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          
          {formData.services.length > 0 && (
            <div className="border-t border-gray-200 pt-4 mt-4 bg-gradient-to-r from-primary-50 to-accent-50 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
                <span className="text-base sm:text-lg font-medium text-gray-900">Order Total:</span>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl sm:text-3xl font-bold text-primary-600">
                    ₹{calculateTotal().toFixed(2)}
                  </span>
                  <div className="text-xs text-gray-500">
                    ({formData.services.length} service{formData.services.length !== 1 ? 's' : ''})
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-4 border-t border-gray-200">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="w-full sm:w-auto px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 transform hover:scale-105 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting || !isValid}
            className="w-full sm:w-auto px-6 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 hover:shadow-md disabled:transform-none disabled:hover:scale-100 disabled:hover:shadow-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 flex items-center justify-center space-x-2"
          >
            {isSubmitting && <InlineLoader className="text-white" />}
            <span>{isSubmitting ? 'Creating Order...' : 'Create Order'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default OrderForm;