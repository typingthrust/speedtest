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
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-[12px]"
      style={{ WebkitBackdropFilter: 'blur(12px)' }}
    >
      <div
        ref={overlayRef}
        className="relative w-full max-w-lg mx-4 sm:mx-auto bg-slate-800/95 rounded-2xl border border-slate-700 shadow-2xl flex flex-col items-center min-h-[40vh] max-h-[90vh] min-w-0 sm:min-w-[320px] p-0"
        style={{ boxShadow: '0 8px 40px 0 rgba(0,0,0,0.5)' }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 text-xl p-2 rounded-full hover:bg-slate-700 transition-colors focus:outline-none z-10"
          aria-label="Close content library"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="w-full h-full px-8 py-8 overflow-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
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
          <h1 className="text-2xl font-bold text-slate-100">Upload Custom Content</h1>
          <p className="text-sm text-slate-400 mt-1">Upload a .txt file, drag and drop, or paste your own text below.</p>
        </header>

        <div
          className={`w-full flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer ${dragActive ? 'border-cyan-400 bg-cyan-900/20' : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-upload-input')?.click()}
        >
          <UploadCloud className={`w-10 h-10 mb-2 ${dragActive ? 'text-cyan-400' : 'text-slate-400'}`} />
          <span className="text-base font-semibold text-slate-300">{customFile ? customFile.name : 'Drag & drop a file here'}</span>
          <span className="text-sm text-slate-500">or click to browse</span>
          <input
            id="file-upload-input"
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept=".txt"
          />
        </div>

        <textarea
          className="w-full border border-slate-600 rounded-lg p-3 text-base bg-slate-700 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition mt-2"
          rows={5}
          placeholder="Or paste your custom content here..."
          value={customText}
          onChange={e => setCustomText(e.target.value)}
        />
        
        <button
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all duration-200 ${added ? 'bg-green-500 text-slate-900' : 'bg-cyan-500 text-slate-900 hover:bg-cyan-400'}`}
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