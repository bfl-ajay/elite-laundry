import React, { useState, useRef } from 'react';
import { FileUploadIcon, CheckIcon, CloseIcon } from '../../assets/icons/laundry-icons';

const FileUpload = ({ 
  onFileSelect, 
  acceptedTypes = "image/*,.pdf", 
  maxSize = 5 * 1024 * 1024, // 5MB default
  currentFile = null 
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    setError('');
    
    // Validate file size
    if (file.size > maxSize) {
      setError(`File size must be less than ${(maxSize / (1024 * 1024)).toFixed(1)}MB`);
      return;
    }

    // Validate file type
    const acceptedTypesArray = acceptedTypes.split(',').map(type => type.trim());
    const isValidType = acceptedTypesArray.some(type => {
      if (type.startsWith('.')) {
        return file.name.toLowerCase().endsWith(type.toLowerCase());
      } else if (type.includes('/*')) {
        return file.type.startsWith(type.replace('/*', ''));
      } else {
        return file.type === type;
      }
    });

    if (!isValidType) {
      setError('File type not supported');
      return;
    }

    // Simulate upload progress
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 100);

    setTimeout(() => {
      onFileSelect(file);
    }, 1000);
  };

  const removeFile = () => {
    onFileSelect(null);
    setUploadProgress(0);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full">
      {!currentFile ? (
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 transition-colors duration-200 ${
            dragActive
              ? 'border-primary-500 bg-primary-50'
              : error
              ? 'border-error-300 bg-error-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleChange}
            accept={acceptedTypes}
          />
          
          <div className="text-center">
            <FileUploadIcon className={`mx-auto h-12 w-12 ${error ? 'text-error-400' : 'text-gray-400'}`} />
            <div className="mt-4">
              <p className="text-sm text-gray-600">
                <button
                  type="button"
                  onClick={openFileDialog}
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  Click to upload
                </button>
                {' '}or drag and drop
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {acceptedTypes.includes('image') && 'Images, '}
                {acceptedTypes.includes('pdf') && 'PDF files '}
                up to {(maxSize / (1024 * 1024)).toFixed(1)}MB
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {uploadProgress === 100 ? (
                  <div className="w-10 h-10 bg-success-100 rounded-full flex items-center justify-center">
                    <CheckIcon className="w-5 h-5 text-success-600" />
                  </div>
                ) : (
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <FileUploadIcon className="w-5 h-5 text-primary-600" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {currentFile.name}
                </p>
                <p className="text-sm text-gray-500">
                  {formatFileSize(currentFile.size)}
                </p>
                
                {uploadProgress < 100 && (
                  <div className="mt-2">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Uploading... {uploadProgress}%
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <button
              type="button"
              onClick={removeFile}
              className="flex-shrink-0 p-1 text-gray-400 hover:text-error-500 transition-colors duration-200"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
      
      {error && (
        <p className="mt-2 text-sm text-error-600">{error}</p>
      )}
    </div>
  );
};

export default FileUpload;