import React, { useState } from 'react';

export default function CsvUploadModal({ isOpen, onClose, onUploadSuccess }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setStatusMessage(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setStatusMessage(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('/api/transactions/import-csv', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Upload failed');
      }

      setStatusMessage({
        type: 'success',
        text: `Successfully imported ${data.summary.imported_count} transactions! ${
          data.summary.error_count > 0 ? `(${data.summary.error_count} skipped)` : ''
        }`
      });

      setTimeout(() => {
        onUploadSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.message
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <div className="modal-header">
          <h3 className="modal-title">Bulk Import Transactions (CSV)</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Upload a standard CSV file with columns: <code>date, category, amount, description, payment_method</code>.
        </p>

        <div
          style={{
            border: '2px dashed var(--border)',
            padding: '2rem',
            borderRadius: 'var(--radius-md)',
            textAlign: 'center',
            backgroundColor: '#f8fafc',
            marginBottom: '1rem'
          }}
        >
          <input
            type="file"
            accept=".csv"
            id="csv-file-input"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <label htmlFor="csv-file-input" className="btn btn-outline" style={{ cursor: 'pointer' }}>
            Choose .CSV File
          </label>
          <div style={{ marginTop: '0.75rem', fontSize: '0.8125rem', color: 'var(--text-main)' }}>
            {selectedFile ? selectedFile.name : 'No file chosen'}
          </div>
        </div>

        {statusMessage && (
          <div
            style={{
              padding: '0.75rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8125rem',
              marginBottom: '1rem',
              backgroundColor: statusMessage.type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)',
              color: statusMessage.type === 'success' ? 'var(--success)' : 'var(--danger)'
            }}
          >
            {statusMessage.text}
          </div>
        )}

        <div className="form-actions">
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={isUploading}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
          >
            {isUploading ? 'Importing...' : 'Upload & Process'}
          </button>
        </div>
      </div>
    </div>
  );
}
