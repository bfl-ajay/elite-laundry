import React from 'react';
import { MoneyIcon, FileUploadIcon } from '../../assets/icons/laundry-icons';
import { expenseService } from '../../services';
import FileUpload from '../common/FileUpload';
import { useError } from '../../contexts/ErrorContext';
import useFormValidation from '../../hooks/useFormValidation';
import useAsyncOperation from '../../hooks/useAsyncOperation';
import { InlineLoader } from '../common/LoadingState';

const ExpenseForm = ({ onExpenseCreated, onCancel }) => {
  const { handleApiError } = useError();
  
  const initialValues = {
    expenseType: '',
    amount: '',
    expenseDate: new Date().toISOString().split('T')[0],
    billAttachment: null
  };

  const validationRules = {
    expenseType: [
      'required',
      { type: 'minLength', value: 2, message: 'Expense type must be at least 2 characters' }
    ],
    amount: [
      'required',
      { type: 'positiveNumber', message: 'Amount must be a positive number' }
    ],
    expenseDate: ['required']
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

  const { execute: createExpense } = useAsyncOperation({
    onSuccess: () => {
      if (onExpenseCreated) onExpenseCreated();
    },
    errorContext: 'Creating expense'
  });

  const expenseTypes = [
    'Utilities',
    'Rent',
    'Equipment',
    'Supplies',
    'Maintenance',
    'Marketing',
    'Transportation',
    'Insurance',
    'Other'
  ];

  const handleFileUpload = (file) => {
    setFieldValue('billAttachment', file);
  };

  const onSubmit = async (formValues) => {
    await createExpense(expenseService.createExpense, formValues);
  };

  return (
    <div className="bg-surface rounded-lg shadow-md p-6">
      <div className="flex items-center mb-6">
        <MoneyIcon className="w-6 h-6 text-primary-500 mr-2" />
        <h2 className="text-xl font-semibold text-gray-900">Add New Expense</h2>
      </div>
      
      <form onSubmit={(e) => {
        e.preventDefault();
        handleSubmit(onSubmit);
      }} className="space-y-6">
        {/* Expense Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Expense Type *
          </label>
          <select
            required
            value={formData.expenseType}
            onChange={(e) => handleChange('expenseType', e.target.value)}
            onBlur={() => handleBlur('expenseType')}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
              errors.expenseType && touched.expenseType 
                ? 'border-red-500 bg-red-50' 
                : 'border-gray-300'
            }`}
          >
            <option value="">Select expense type</option>
            {expenseTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          {errors.expenseType && touched.expenseType && (
            <p className="mt-1 text-sm text-red-600">{errors.expenseType}</p>
          )}
        </div>

        {/* Amount and Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount (₹) *
            </label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.amount}
              onChange={(e) => handleChange('amount', e.target.value)}
              onBlur={() => handleBlur('amount')}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                errors.amount && touched.amount 
                  ? 'border-red-500 bg-red-50' 
                  : 'border-gray-300'
              }`}
              placeholder="0.00"
            />
            {errors.amount && touched.amount && (
              <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expense Date *
            </label>
            <input
              type="date"
              required
              value={formData.expenseDate}
              onChange={(e) => handleChange('expenseDate', e.target.value)}
              onBlur={() => handleBlur('expenseDate')}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                errors.expenseDate && touched.expenseDate 
                  ? 'border-red-500 bg-red-50' 
                  : 'border-gray-300'
              }`}
            />
            {errors.expenseDate && touched.expenseDate && (
              <p className="mt-1 text-sm text-red-600">{errors.expenseDate}</p>
            )}
          </div>
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bill Attachment (Optional)
          </label>
          <FileUpload
            onFileSelect={handleFileUpload}
            acceptedTypes="image/*,.pdf"
            maxSize={5 * 1024 * 1024} // 5MB
            currentFile={formData.billAttachment}
          />
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting || !isValid}
            className="px-6 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center"
          >
            {isSubmitting ? (
              <>
                <InlineLoader className="mr-2" />
                Creating...
              </>
            ) : (
              <>
                <MoneyIcon className="w-4 h-4 mr-2" />
                Add Expense
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ExpenseForm;