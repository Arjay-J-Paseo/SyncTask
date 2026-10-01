import Modal from './ui/Modal';
import Button from './ui/Button';
import { IconFile, IconTrash, IconUpload } from './icons';
import { formatBytes, formatRelative } from '../utils/format';

export default function FilePreviewModal({ open, file, onClose, onDelete, onDownload, downloading }) {
  if (!file) return null;

  const isImage = file.mime_type && file.mime_type.startsWith('image/');
  const isPDF = file.mime_type === 'application/pdf';

  return (
    <Modal open={open} onClose={onClose} maxWidth={720}>
      <div className="file-preview">
        <div className="file-preview-header">
          <div className="file-preview-header-icon">
            <IconFile />
          </div>
          <div className="file-preview-header-text">
            <div className="file-preview-name">{file.file_name}</div>
            <div className="file-preview-meta">
              {formatBytes(file.size_bytes)} · v{file.version} · {formatRelative(file.created_at)}
            </div>
          </div>
        </div>

        <div className="file-preview-body">
          {isImage ? (
            <div className="file-preview-media">
              <div className="file-preview-placeholder">
                <IconFile style={{ width: 48, height: 48, color: 'var(--accent)' }} />
                <div className="file-preview-placeholder-text">
                  Image preview
                </div>
              </div>
            </div>
          ) : isPDF ? (
            <div className="file-preview-media">
              <div className="file-preview-placeholder">
                <IconFile style={{ width: 48, height: 48, color: 'var(--accent)' }} />
                <div className="file-preview-placeholder-text">
                  PDF preview
                </div>
              </div>
            </div>
          ) : (
            <div className="file-preview-media">
              <div className="file-preview-placeholder">
                <IconFile style={{ width: 48, height: 48, color: 'var(--accent)' }} />
                <div className="file-preview-placeholder-text">
                  No preview available
                </div>
              </div>
            </div>
          )}

          <div className="file-preview-info">
            <div className="file-preview-info-row">
              <span className="file-preview-info-label">Type</span>
              <span className="file-preview-info-value">{file.mime_type || 'Unknown'}</span>
            </div>
            <div className="file-preview-info-row">
              <span className="file-preview-info-label">Size</span>
              <span className="file-preview-info-value">{formatBytes(file.size_bytes)}</span>
            </div>
            <div className="file-preview-info-row">
              <span className="file-preview-info-label">Version</span>
              <span className="file-preview-info-value">v{file.version}</span>
            </div>
            <div className="file-preview-info-row">
              <span className="file-preview-info-label">Uploaded</span>
              <span className="file-preview-info-value">{formatRelative(file.created_at)}</span>
            </div>
          </div>
        </div>

        <div className="file-preview-footer">
          <Button variant="danger" onClick={() => onDelete(file)}>
            <IconTrash style={{ width: 15, height: 15 }} /> Delete
          </Button>
          <div className="row gap-12">
            <Button variant="secondary" onClick={onClose}>Close</Button>
            <Button variant="primary" onClick={() => onDownload(file)} disabled={downloading}>
              <IconUpload style={{ width: 15, height: 15 }} /> {downloading ? 'Downloading…' : 'Download'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
