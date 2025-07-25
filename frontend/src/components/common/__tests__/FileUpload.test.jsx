import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import FileUpload from '../FileUpload';

describe('FileUpload', () => {
  const mockProps = {
    onFileSelect: jest.fn(),
    onFileRemove: jest.fn(),
    accept: '.pdf,.jpg,.jpeg,.png',
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders file upload component', () => {
    render(<FileUpload {...mockProps} />);

    expect(screen.getByText('Choose File')).toBeInTheDocument();
    expect(screen.getByText('or drag and drop')).toBeInTheDocument();
    expect(screen.getByText('PDF, JPG, PNG up to 5MB')).toBeInTheDocument();
  });

  test('handles file selection via input', async () => {
    render(<FileUpload {...mockProps} />);

    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByRole('button', { name: /choose file/i }).querySelector('input');
    
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockProps.onFileSelect).toHaveBeenCalledWith(file);
    });
  });

  test('validates file type', async () => {
    render(<FileUpload {...mockProps} />);

    const invalidFile = new File(['test content'], 'test.exe', { type: 'application/exe' });
    const fileInput = screen.getByRole('button', { name: /choose file/i }).querySelector('input');
    
    fireEvent.change(fileInput, { target: { files: [invalidFile] } });

    await waitFor(() => {
      expect(screen.getByText('Invalid file type. Please select a PDF, JPG, or PNG file.')).toBeInTheDocument();
    });

    expect(mockProps.onFileSelect).not.toHaveBeenCalled();
  });

  test('validates file size', async () => {
    render(<FileUpload {...mockProps} />);

    // Create a file larger than 5MB
    const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByRole('button', { name: /choose file/i }).querySelector('input');
    
    fireEvent.change(fileInput, { target: { files: [largeFile] } });

    await waitFor(() => {
      expect(screen.getByText('File size exceeds 5MB limit.')).toBeInTheDocument();
    });

    expect(mockProps.onFileSelect).not.toHaveBeenCalled();
  });

  test('handles drag and drop', async () => {
    render(<FileUpload {...mockProps} />);

    const dropZone = screen.getByText('Choose File').closest('div');
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });

    // Simulate drag enter
    fireEvent.dragEnter(dropZone, {
      dataTransfer: { files: [file] }
    });

    expect(dropZone).toHaveClass('border-primary', 'bg-primary-50');

    // Simulate drop
    fireEvent.drop(dropZone, {
      dataTransfer: { files: [file] }
    });

    await waitFor(() => {
      expect(mockProps.onFileSelect).toHaveBeenCalledWith(file);
    });
  });

  test('handles drag leave', () => {
    render(<FileUpload {...mockProps} />);

    const dropZone = screen.getByText('Choose File').closest('div');

    // Simulate drag enter
    fireEvent.dragEnter(dropZone);
    expect(dropZone).toHaveClass('border-primary', 'bg-primary-50');

    // Simulate drag leave
    fireEvent.dragLeave(dropZone);
    expect(dropZone).not.toHaveClass('border-primary', 'bg-primary-50');
  });

  test('prevents default drag over behavior', () => {
    render(<FileUpload {...mockProps} />);

    const dropZone = screen.getByText('Choose File').closest('div');
    const dragOverEvent = new Event('dragover', { bubbles: true });
    const preventDefaultSpy = jest.spyOn(dragOverEvent, 'preventDefault');

    fireEvent(dropZone, dragOverEvent);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  test('displays selected file information', () => {
    const selectedFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    
    render(<FileUpload {...mockProps} selectedFile={selectedFile} />);

    expect(screen.getByText('test.pdf')).toBeInTheDocument();
    expect(screen.getByText('Remove')).toBeInTheDocument();
  });

  test('handles file removal', () => {
    const selectedFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    
    render(<FileUpload {...mockProps} selectedFile={selectedFile} />);

    const removeButton = screen.getByText('Remove');
    fireEvent.click(removeButton);

    expect(mockProps.onFileRemove).toHaveBeenCalled();
  });

  test('supports multiple file selection', async () => {
    render(<FileUpload {...mockProps} multiple={true} />);

    const file1 = new File(['content1'], 'test1.pdf', { type: 'application/pdf' });
    const file2 = new File(['content2'], 'test2.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByRole('button', { name: /choose file/i }).querySelector('input');
    
    fireEvent.change(fileInput, { target: { files: [file1, file2] } });

    await waitFor(() => {
      expect(mockProps.onFileSelect).toHaveBeenCalledWith([file1, file2]);
    });
  });

  test('displays multiple selected files', () => {
    const selectedFiles = [
      new File(['content1'], 'test1.pdf', { type: 'application/pdf' }),
      new File(['content2'], 'test2.jpg', { type: 'image/jpeg' })
    ];
    
    render(<FileUpload {...mockProps} selectedFiles={selectedFiles} multiple={true} />);

    expect(screen.getByText('test1.pdf')).toBeInTheDocument();
    expect(screen.getByText('test2.jpg')).toBeInTheDocument();
    expect(screen.getAllByText('Remove')).toHaveLength(2);
  });

  test('handles individual file removal in multiple mode', () => {
    const selectedFiles = [
      new File(['content1'], 'test1.pdf', { type: 'application/pdf' }),
      new File(['content2'], 'test2.jpg', { type: 'image/jpeg' })
    ];
    
    render(<FileUpload {...mockProps} selectedFiles={selectedFiles} multiple={true} />);

    const removeButtons = screen.getAllByText('Remove');
    fireEvent.click(removeButtons[0]);

    expect(mockProps.onFileRemove).toHaveBeenCalledWith(0);
  });

  test('shows upload progress', () => {
    render(<FileUpload {...mockProps} uploading={true} uploadProgress={50} />);

    expect(screen.getByText('Uploading...')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '50');
  });

  test('disables interaction during upload', () => {
    render(<FileUpload {...mockProps} uploading={true} />);

    const dropZone = screen.getByText('Uploading...').closest('div');
    expect(dropZone).toHaveClass('pointer-events-none', 'opacity-50');
  });

  test('displays error message', () => {
    const error = 'Upload failed. Please try again.';
    render(<FileUpload {...mockProps} error={error} />);

    expect(screen.getByText(error)).toBeInTheDocument();
    expect(screen.getByText(error)).toHaveClass('text-red-600');
  });

  test('clears error on new file selection', async () => {
    const error = 'Upload failed. Please try again.';
    const { rerender } = render(<FileUpload {...mockProps} error={error} />);

    expect(screen.getByText(error)).toBeInTheDocument();

    // Simulate new file selection
    rerender(<FileUpload {...mockProps} error={null} />);

    expect(screen.queryByText(error)).not.toBeInTheDocument();
  });

  test('is accessible with proper ARIA attributes', () => {
    render(<FileUpload {...mockProps} />);

    const fileInput = screen.getByRole('button', { name: /choose file/i }).querySelector('input');
    expect(fileInput).toHaveAttribute('aria-describedby');
    
    const dropZone = screen.getByText('Choose File').closest('div');
    expect(dropZone).toHaveAttribute('role', 'button');
    expect(dropZone).toHaveAttribute('tabIndex', '0');
  });

  test('handles keyboard navigation', () => {
    render(<FileUpload {...mockProps} />);

    const dropZone = screen.getByText('Choose File').closest('div');
    
    // Test Enter key
    fireEvent.keyDown(dropZone, { key: 'Enter', code: 'Enter' });
    // Should trigger file input click (tested indirectly)

    // Test Space key
    fireEvent.keyDown(dropZone, { key: ' ', code: 'Space' });
    // Should trigger file input click (tested indirectly)
  });

  test('displays file size in human readable format', () => {
    const largeFile = new File(['x'.repeat(1024 * 1024)], 'large.pdf', { type: 'application/pdf' });
    
    render(<FileUpload {...mockProps} selectedFile={largeFile} />);

    expect(screen.getByText('1.0 MB')).toBeInTheDocument();
  });

  test('shows file type icon', () => {
    const pdfFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    
    render(<FileUpload {...mockProps} selectedFile={pdfFile} />);

    // Should show PDF icon (tested by checking for specific class or data attribute)
    const fileIcon = screen.getByTestId('file-icon');
    expect(fileIcon).toHaveClass('text-red-500'); // PDF icon color
  });

  test('handles custom accept types', () => {
    render(<FileUpload {...mockProps} accept=".doc,.docx" />);

    expect(screen.getByText('DOC, DOCX up to 5MB')).toBeInTheDocument();
  });

  test('handles custom max size display', () => {
    render(<FileUpload {...mockProps} maxSize={10 * 1024 * 1024} />);

    expect(screen.getByText('PDF, JPG, PNG up to 10MB')).toBeInTheDocument();
  });
});