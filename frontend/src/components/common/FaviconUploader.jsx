import React, { useState, useRef } from 'react';
import { businessSettingsService } from '../../services';

const FaviconUploader = ({ 
  currentFavicon, 
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
    const validation = businessSettingsService.validateFile(file, 'favicon');
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

      const response = await businessSettingsService.uploadFavicon(
        selectedFile,
        (progress) => setUploadProgress(progress)
      );

      if (response.success) {
        onUploadSuccess?.(response.data, response.message);
        clearSelection();
        
        // Update favicon in browser
        updateBrowserFavicon(response.data.faviconUrl);
      } else {
        onUploadError?.(response.error?.message || 'Failed to upload favicon');
      }
    } catch (error) {
      console.error('Favicon upload error:', error);
      onUploadError?.(error.error?.message || 'Failed to upload favicon');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemove = async () => {
    if (!currentFavicon) return;

    try {
      setIsRemoving(true);
      const response = await businessSettingsService.removeFavicon();
      
      if (response.success) {
        onRemoveSuccess?.(response.data, response.message);
        
        // Reset favicon in browser to default
        updateBrowserFavicon('/favicon.ico');
      } else {
        onRemoveError?.(response.error?.message || 'Failed to remove favicon');
      }
    } catch (error) {
      console.error('Favicon remove error:', error);
      onRemoveError?.(error.error?.message || 'Failed to remove favicon');
    } finally {
      setIsRemoving(false);
    }
  };

  const updateBrowserFavicon = (faviconUrl) => {
    const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'shortcut icon';
    link.href = faviconUrl;
    document.getElementsByTagName('head')[0].appendChild(link);
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
      {/* Current Favicon Display */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Current Favicon</h3>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50">
          {currentFavicon ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="p-2 bg-white rounded-lg shadow-sm border">
                  <img
                    src={currentFavicon}
                    alt="Favicon"
                    className="w-8 h-8 object-contain"
                  />
                </div>
              </div>
              <div className="text-xs text-gray-600">
                <p>This favicon appears in browser tabs and bookmarks</p>
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
                    Remove Favicon
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="text-gray-500">
              <div className="w-8 h-8 mx-auto bg-gray-300 rounded mb-3"></div>
              <p className="text-sm font-medium">No favicon uploaded</p>
              <p className="text-xs text-gray-400 mt-1">Upload a favicon for browser tabs</p>
            </div>
          )}
        </div>
      </div>

      {/* Upload New Favicon */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Upload New Favicon</h3>
        
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
            accept="image/x-icon,image/png,image/jpeg,image/jpg"
            onChange={handleFileInputChange}
            className="hidden"
          />

          {preview ? (
            /* Preview Selected File */
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="p-2 bg-white rounded-lg shadow-sm border">
                  <img
                    src={preview}
                    alt="Favicon Preview"
                    className="w-8 h-8 object-contain"
                  />
                </div>
              </div>
              <div className="text-sm text-gray-600">
                <p className="font-medium">{selectedFile?.name}</p>
                <p className="text-xs text-gray-500">
                  {(selectedFile?.size / 1024).toFixed(1)} KB
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
                      Upload Favicon
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Upload Instructions */
            <div className="space-y-4">
              <div className="w-12 h-12 mx-auto bg-gray-200 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Drag and drop your favicon here, or{' '}
                  <button
                    onClick={openFileDialog}
                    className="text-blue-600 hover:text-blue-500 font-medium focus:outline-none focus:underline"
                  >
                    browse files
                  </button>
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Supports ICO, PNG, JPG up to 5MB
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
            <li><strong>ICO:</strong> Traditional favicon format (recommended)</li>
            <li><strong>PNG:</strong> Modern format with transparency support</li>
            <li><strong>JPG:</strong> Basic format for simple icons</li>
          </ul>
          <p className="mt-2">
            <strong>Recommended size:</strong> 32x32 pixels or 16x16 pixels<br />
            <strong>Maximum file size:</strong> 5MB
          </p>
        </div>

        {/* Browser Preview */}
        {preview && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-2">Browser Tab Preview:</p>
            <div className="flex items-center space-x-2 bg-white p-2 rounded border">
              <img src={preview} alt="Favicon Preview" className="w-4 h-4 object-contain" />
              <span className="text-sm text-gray-600">Your Business Name - Tab Title</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FaviconUploader;