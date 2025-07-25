import React, { useState, useRef } from 'react';
import { businessSettingsService } from '../../services';

const LogoUploader = ({ 
  currentLogo, 
  onUploadSuccess, 
  onUploadError, 
  onRemoveSuccess,
  onRemoveError 
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleFileSelect = (file) => {
    // Validate file
    const validation = businessSettingsService.validateFile(file, 'logo');
    if (!validation.valid) {
      onUploadError?.(validation.error);
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);

      const response = await businessSettingsService.uploadLogo(
        selectedFile,
        (progress) => setUploadProgress(progress)
      );

      if (response.success) {
        onUploadSuccess?.(response.data, response.message);
        clearSelection();
      } else {
        onUploadError?.(response.error?.message || 'Failed to upload logo');
      }
    } catch (error) {
      console.error('Logo upload error:', error);
      onUploadError?.(error.error?.message || 'Failed to upload logo');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemove = async () => {
    if (!currentLogo) return;

    try {
      setIsRemoving(true);
      const response = await businessSettingsService.removeLogo();
      
      if (response.success) {
        onRemoveSuccess?.(response.data, response.message);
      } else {
        onRemoveError?.(response.error?.message || 'Failed to remove logo');
      }
    } catch (error) {
      console.error('Logo remove error:', error);
      onRemoveError?.(error.error?.message || 'Failed to remove logo');
    } finally {
      setIsRemoving(false);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6">
      {/* Current Logo Display */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Current Logo</h3>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50">
          {currentLogo ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                <img
                  src={currentLogo}
                  alt="Business Logo"
                  className="max-h-32 max-w-full object-contain rounded-lg shadow-sm"
                />
              </div>
              <button
                onClick={handleRemove}
                disabled={isRemoving}
                className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {isRemoving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-red-700" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Removing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Remove Logo
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-sm font-medium">No logo uploaded</p>
              <p className="text-xs text-gray-400 mt-1">Upload a logo to brand your business</p>
            </div>
          )}
        </div>
      </div>

      {/* Upload New Logo */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Upload New Logo</h3>
        
        {/* Drag and Drop Area */}
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 ${
            dragActive 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/svg+xml"
            onChange={handleFileInputChange}
            className="hidden"
          />

          {preview ? (
            /* Preview Selected File */
            <div className="space-y-4">
              <div className="flex justify-center">
                <img
                  src={preview}
                  alt="Logo Preview"
                  className="max-h-32 max-w-full object-contain rounded-lg shadow-sm"
                />
              </div>
              <div className="text-sm text-gray-600">
                <p className="font-medium">{selectedFile?.name}</p>
                <p className="text-xs text-gray-500">
                  {(selectedFile?.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={clearSelection}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {isUploading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Upload Logo
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Upload Instructions */
            <div className="space-y-4">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Drag and drop your logo here, or{' '}
                  <button
                    onClick={openFileDialog}
                    className="text-blue-600 hover:text-blue-500 font-medium focus:outline-none focus:underline"
                  >
                    browse files
                  </button>
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Supports JPG, PNG, SVG up to 5MB
                </p>
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && uploadProgress > 0 && (
            <div className="absolute inset-x-0 bottom-0 px-6 pb-4">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* File Format Information */}
        <div className="mt-3 text-xs text-gray-500">
          <p className="font-medium mb-1">Supported formats:</p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>JPG/JPEG:</strong> Best for photographs and complex images</li>
            <li><strong>PNG:</strong> Best for logos with transparency</li>
            <li><strong>SVG:</strong> Best for scalable vector graphics (recommended)</li>
          </ul>
          <p className="mt-2">Maximum file size: 5MB</p>
        </div>
      </div>
    </div>
  );
};

export default LogoUploader;