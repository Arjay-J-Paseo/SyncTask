import { useRef, useState } from 'react';
import { useWorkspace } from '../context/MockWorkspaceContext';
import { useToast } from '../context/ToastContext';
import { useActivity } from '../context/ActivityContext';
import Button from '../components/ui/Button';
import FilePreviewModal from '../components/FilePreviewModal';
import ConfirmModal from '../components/ConfirmModal';
import { IconUpload, IconFile, IconTrash } from '../components/icons';
import { formatBytes, formatRelative } from '../utils/format';
import { describeSupabaseError } from '../utils/errors';
import './Files.css';

const MAX_FILE_SIZE = 100 * 1024 * 1024;
const ALLOWED_FILE_EXTENSIONS = new Set([
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'csv', 'txt', 'zip',
  'png', 'jpg', 'jpeg', 'gif', 'webp'
]);
const ALLOWED_FILE_MIME_TYPES = {
  pdf: ['application/pdf', 'application/x-pdf'],
  doc: ['application/msword'],
  docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  xls: ['application/vnd.ms-excel'],
  xlsx: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  ppt: ['application/vnd.ms-powerpoint'],
  pptx: ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  csv: ['text/csv', 'application/csv', 'application/vnd.ms-excel', 'text/plain'],
  txt: ['text/plain'],
  zip: ['application/zip', 'application/x-zip-compressed'],
  png: ['image/png'],
  jpg: ['image/jpeg'],
  jpeg: ['image/jpeg'],
  gif: ['image/gif'],
  webp: ['image/webp']
};

function isImageFile(file) {
  return file?.mime_type?.startsWith('image/')
    || /\.(png|jpe?g|gif|webp)$/i.test(file?.file_name || '');
}

export default function Files() {
  const { push } = useToast();
  const {
    workspace,
    files,
    members,
    loading,
    uploadFile,
    deleteFile,
    getFileUrl
  } = useWorkspace();
  const { logActivity } = useActivity();

  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingFile, setDeletingFile] = useState(false);
  const [downloadingFile, setDownloadingFile] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const [fileToDelete, setFileToDelete] = useState(null);
  const inputRef = useRef(null);
  const downloadLock = useRef(false);
  const uploadLock = useRef(false);
  const previewRequest = useRef(0);

  const usedBytes = files.reduce((sum, f) => sum + (f.size_bytes || 0), 0);
  const limitBytes = workspace?.storage_limit_bytes || 1073741824;
  const pct = Math.min(100, Math.round((usedBytes / limitBytes) * 100));

  async function openPreview(file) {
    const requestId = ++previewRequest.current;
    setPreviewFile(file);
    setPreviewUrl('');
    setPreviewError('');
    setPreviewLoading(false);

    if (!isImageFile(file)) return;
    if (!file.storage_path) {
      setPreviewError('This image is missing its Storage path.');
      return;
    }

    setPreviewLoading(true);
    try {
      const url = await getFileUrl(file.storage_path);
      if (requestId === previewRequest.current) setPreviewUrl(url);
    } catch (err) {
      console.error('[files] image preview URL failed:', describeSupabaseError(err), err);
      if (requestId === previewRequest.current) setPreviewError(describeSupabaseError(err));
    } finally {
      if (requestId === previewRequest.current) setPreviewLoading(false);
    }
  }

  function closePreview() {
    previewRequest.current++;
    setPreviewFile(null);
    setPreviewUrl('');
    setPreviewError('');
    setPreviewLoading(false);
  }

  function handleImageLoadError() {
    setPreviewUrl('');
    setPreviewError('The image could not be loaded. Close the preview and try again.');
  }

  async function handleFiles(fileList) {
    const arr = Array.from(fileList || []);
    if (!arr.length || uploadLock.current) return;

    uploadLock.current = true;
    setUploading(true);
    let successCount = 0;
    const errors = [];

    try {
      for (const file of arr) {
        const extension = file?.name?.split('.').pop()?.toLowerCase();
        let validationError = '';

        if (!file || !file.name || !Number.isFinite(file.size)) {
          validationError = 'Invalid file.';
        } else if (file.size <= 0) {
          validationError = 'The file is empty.';
        } else if (file.size > MAX_FILE_SIZE) {
          validationError = 'File is too large (max 100 MB per file).';
        } else if (!ALLOWED_FILE_EXTENSIONS.has(extension)) {
          validationError = 'This file type is not supported.';
        } else if (
          file.type && file.type !== 'application/octet-stream'
          && !ALLOWED_FILE_MIME_TYPES[extension]?.includes(file.type.toLowerCase())
        ) {
          validationError = 'The file type does not match its extension.';
        }

        if (validationError) {
          errors.push(`${file?.name || 'Selected file'}: ${validationError}`);
          continue;
        }

        try {
          await uploadFile(file);
          logActivity({
            type: 'file',
            title: 'File uploaded',
            sub: file.name
          });
          successCount++;
        } catch (err) {
          console.error('[files] upload failed:', describeSupabaseError(err), err);
          errors.push(file.name + ': ' + describeSupabaseError(err));
        }
      }
    } finally {
      uploadLock.current = false;
      setUploading(false);
    }

    if (successCount > 0) {
      push(`${successCount} file${successCount === 1 ? '' : 's'} uploaded`, 'success');
    }
    if (errors.length > 0) {
      push(errors.join('\n'), 'error');
    }
  }

  async function confirmDelete() {
    if (!fileToDelete || deletingFile) return;
    setDeletingFile(true);
    try {
      await deleteFile(fileToDelete.id);
      logActivity({
        type: 'file',
        title: 'File deleted',
        sub: fileToDelete.file_name
      });
      push('File deleted', 'success');
      setFileToDelete(null);
      closePreview();
    } catch (err) {
      console.error('[files] delete failed:', describeSupabaseError(err), err);
      push(describeSupabaseError(err), 'error');
    } finally {
      setDeletingFile(false);
    }
  }

  async function handleDownload(file) {
    if (downloadLock.current) return;
    if (!file?.storage_path || !file?.file_name) {
      push('The selected file is missing its storage path or filename.', 'error');
      return;
    }

    downloadLock.current = true;
    setDownloadingFile(true);
    let objectUrl;
    const link = document.createElement('a');

    try {
      const signedUrl = await getFileUrl(file.storage_path);
      const response = await fetch(signedUrl);
      if (!response.ok) {
        throw new Error(`File download failed: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      objectUrl = URL.createObjectURL(blob);
      link.href = objectUrl;
      link.download = file.file_name;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      console.error('[files] download failed:', describeSupabaseError(err), err);
      push(describeSupabaseError(err), 'error');
    } finally {
      link.remove();
      if (objectUrl) window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      downloadLock.current = false;
      setDownloadingFile(false);
    }
  }

  const findUploader = (id) => members.find(m => m.id === id);

  if (loading) {
    return (
      <div>
        <div className="page-head">
          <div className="page-eyebrow">Files</div>
          <h1 className="page-title">Files</h1>
        </div>
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-2)' }}>
          Loading files…
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-head">
        <div className="page-eyebrow">Files</div>
        <h1 className="page-title">Files</h1>
        <p className="page-sub">Store, share, and manage all your project files in one place.</p>
      </div>

      <div className="files-top">
        <div
          className={`card files-dropzone ${dragging ? 'dragging' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
        >
          <div className="card-body" style={{ textAlign: 'center', padding: '40px 24px' }}>
            <div className="files-upload-icon">
              <IconUpload style={{ width: 40, height: 40, color: '#fff' }} />
            </div>
            <div className="files-upload-title">
              {uploading ? 'Uploading…' : 'Upload your first file'}
            </div>
            <p className="muted" style={{ marginBottom: 16 }}>
              Drag and drop files here, or click to browse.
            </p>
            <Button
              variant="primary"
              onClick={() => inputRef.current && inputRef.current.click()}
              disabled={uploading}
            >
              {uploading ? 'Uploading…' : 'Browse files'}
            </Button>
            <p className="muted-2 mt-16" style={{ fontSize: 12.5 }}>
              Allowed: PDF, Word, Excel, PowerPoint, CSV, TXT, ZIP, PNG, JPG, GIF, WebP (max 100 MB). File checks do not scan image content.
            </p>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt,.zip,.png,.jpg,.jpeg,.gif,.webp"
              style={{ display: 'none' }}
              onChange={(e) => {
                const selectedFiles = e.target.files;
                e.target.value = '';
                handleFiles(selectedFiles);
              }}
            />
          </div>
        </div>

        <div className="card">
          <div className="card-header bordered">
            <div className="card-title" style={{ fontSize: 15 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <IconFile style={{ width: 18, height: 18 }} /> File Storage
              </span>
            </div>
            <span className="muted" style={{ fontSize: 13 }}>
              {formatBytes(usedBytes)} of {formatBytes(limitBytes)}
            </span>
          </div>
          <div className="card-body">
            <div className="files-meter">
              <div className="files-meter-fill" style={{ width: pct + '%' }} />
            </div>
            <div className="files-meter-label">
              {files.length} file{files.length === 1 ? '' : 's'}
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 22 }}>
        {files.length === 0 ? (
          <div className="card-body" style={{ textAlign: 'center', padding: '50px 24px' }}>
            <svg width="120" height="90" viewBox="0 0 120 90" style={{ marginBottom: 16 }}>
              <rect x="6" y="20" width="108" height="60" rx="8" fill="#eae0f7" />
              <path d="M6 32 L114 32 L114 28 A8 8 0 0 0 106 20 L62 20 L56 12 L14 12 A8 8 0 0 0 6 20 Z" fill="#eae0f7" />
              <line x1="20" y1="20" x2="100" y2="80" stroke="#fff" strokeWidth="8" strokeLinecap="round" />
            </svg>
            <p className="muted" style={{ maxWidth: 560, margin: '0 auto' }}>
              <strong style={{ color: 'var(--text)' }}>No files yet.</strong> Files shared by your team will appear here.<br />
              Upload project documents, designs, research, or other resources to get started.
            </p>
          </div>
        ) : (
          <div className="files-list">
            {files.map(f => {
              const uploader = findUploader(f.uploaded_by);
              return (
                <div
                  key={f.id}
                  className="files-row files-row-clickable"
                  onClick={() => openPreview(f)}
                >
                  <div className="files-icon">
                    <IconFile style={{ width: 18, height: 18 }} />
                  </div>
                  <div className="files-main">
                    <div className="files-name">{f.file_name}</div>
                    <div className="files-meta">
                      {uploader?.full_name || 'Unknown'} · {formatRelative(f.created_at)}
                    </div>
                  </div>
                  <div className="files-version">v{f.version}</div>
                  <div className="files-size">{formatBytes(f.size_bytes)}</div>
                  <button
                    className="files-delete"
                    aria-label="Delete file"
                    onClick={(e) => { e.stopPropagation(); setFileToDelete(f); }}
                  >
                    <IconTrash style={{ width: 15, height: 15 }} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <FilePreviewModal
        open={!!previewFile}
        file={previewFile}
        onClose={closePreview}
        onDelete={(f) => setFileToDelete(f)}
        onDownload={handleDownload}
        downloading={downloadingFile}
        isImage={isImageFile(previewFile)}
        imageUrl={previewUrl}
        imageLoading={previewLoading}
        imageError={previewError}
        onImageError={handleImageLoadError}
      />

      <ConfirmModal
        open={!!fileToDelete}
        onClose={() => setFileToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete this file?"
        message={fileToDelete ? `"${fileToDelete.file_name}" will be permanently removed. This cannot be undone.` : ''}
        confirmLabel={deletingFile ? 'Deleting…' : 'Delete'}
        danger
      />
    </div>
  );
}
