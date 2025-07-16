import React, { useState, useRef, useEffect } from 'react';
import { useOverlay } from '../OverlayProvider';
import { useContentLibrary, ContentItem } from '../ContentLibraryProvider';
import { X, UploadCloud, Check } from 'lucide-react';

function MinimalContentLibraryOverlay({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (backdropRef.current && e.target === backdropRef.current) {
        onClose();
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-[12px]"
      style={{ WebkitBackdropFilter: 'blur(12px)' }}
    >
      <div
        ref={overlayRef}
        className="relative w-full max-w-lg mx-auto bg-white/90 rounded-xl border border-white/30 shadow-lg flex flex-col items-center min-h-[40vh] max-h-[90vh] min-w-[320px] p-0"
        style={{ boxShadow: '0 4px 32px 0 rgba(0,0,0,0.08)', border: '1px solid rgba(255,255,255,0.3)' }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-xl p-2 rounded-full focus:outline-none z-10"
          aria-label="Close content library"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="w-full h-full px-8 py-8 overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function ContentLibraryOverlay({ onContentSelect }: { onContentSelect?: (content: string) => void }) {
  const { open, closeOverlay } = useOverlay();
  const { addItem, selectItem } = useContentLibrary();
  const [customText, setCustomText] = useState('');
  const [customFile, setCustomFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [added, setAdded] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCustomFile(e.target.files[0]);
      const reader = new FileReader();
      reader.onload = ev => {
        setCustomText(ev.target?.result as string || '');
      };
      reader.readAsText(e.target.files[0]);
    }
  };

  const handleAddCustom = () => {
    if (!customText.trim()) return;
    setUploading(true);
    const newItem: ContentItem = {
      id: Date.now().toString(),
      type: 'custom',
      language: 'other',
      domain: 'custom',
      label: `Custom (${(customFile && customFile.name) || 'Text'})`,
      content: customText,
    };
    addItem(newItem);
    selectItem(newItem.id);
    if (onContentSelect) onContentSelect(newItem.content);
    
    setCustomText('');
    setCustomFile(null);
    setUploading(false);
    setAdded(true);
    
    setTimeout(() => {
      setAdded(false);
      closeOverlay();
    }, 1200);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setCustomFile(e.dataTransfer.files[0]);
      const reader = new FileReader();
      reader.onload = ev => {
        setCustomText(ev.target?.result as string || '');
      };
      reader.readAsText(e.dataTransfer.files[0]);
    }
  };

  return (
    <MinimalContentLibraryOverlay open={open === 'content-library'} onClose={closeOverlay}>
      <section className="w-full flex flex-col gap-4 items-center">
        <header className="w-full mb-2 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Upload Custom Content</h1>
          <p className="text-sm text-gray-600 mt-1">Upload a .txt file, drag and drop, or paste your own text below.</p>
        </header>

        <div
          className={`w-full flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer ${dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:border-gray-400'}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-upload-input')?.click()}
        >
          <UploadCloud className={`w-10 h-10 mb-2 ${dragActive ? 'text-blue-400' : 'text-gray-400'}`} />
          <span className="text-base font-semibold text-gray-600">{customFile ? customFile.name : 'Drag & drop a file here'}</span>
          <span className="text-sm text-gray-500">or click to browse</span>
          <input
            id="file-upload-input"
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept=".txt"
          />
        </div>

        <textarea
          className="w-full border border-gray-300 rounded-lg p-3 text-base focus:outline-none focus:ring-2 focus:ring-gray-400 transition mt-2"
          rows={5}
          placeholder="Or paste your custom content here..."
          value={customText}
          onChange={e => setCustomText(e.target.value)}
        />
        
        <button
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all duration-200 ${added ? 'bg-green-600 text-white' : 'bg-gray-900 text-white hover:bg-gray-700'}`}
          onClick={handleAddCustom}
          disabled={!customText.trim() || uploading}
        >
          {added ? <Check className="w-5 h-5" /> : null}
          {added ? 'Content Added!' : (uploading ? 'Adding...' : 'Add Custom Content')}
        </button>
      </section>
    </MinimalContentLibraryOverlay>
  );
} 