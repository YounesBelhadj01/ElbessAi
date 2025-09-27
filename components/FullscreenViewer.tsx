import React from 'react';
import { Icon } from './Icon';

interface FullscreenViewerProps {
  images: string[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (newIndex: number) => void;
}

export const FullscreenViewer: React.FC<FullscreenViewerProps> = ({ images, currentIndex, onClose, onNavigate }) => {
  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex > 0) {
      onNavigate(currentIndex - 1);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex < images.length - 1) {
      onNavigate(currentIndex + 1);
    }
  };
  
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'ArrowLeft' && currentIndex > 0) {
            onNavigate(currentIndex - 1);
        } else if (e.key === 'ArrowRight' && currentIndex < images.length - 1) {
            onNavigate(currentIndex + 1);
        } else if (e.key === 'Escape') {
            onClose();
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentIndex, images.length, onNavigate, onClose]);


  return (
    <div
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Fullscreen image preview"
    >
      <img
        src={images[currentIndex]}
        alt={`Fullscreen preview ${currentIndex + 1} of ${images.length}`}
        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
      <button
        className="absolute top-5 right-5 text-white text-4xl leading-none hover:text-gray-300 transition-colors"
        aria-label="Close fullscreen view"
        onClick={onClose}
      >
        &times;
      </button>

      {images.length > 1 && (
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-3 rounded-full z-10 transition-all transform active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Previous image"
        >
          <Icon name="chevron-left" className="w-8 h-8" />
        </button>
      )}

      {images.length > 1 && (
        <button
          onClick={handleNext}
          disabled={currentIndex === images.length - 1}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-3 rounded-full z-10 transition-all transform active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Next image"
        >
          <Icon name="chevron-right" className="w-8 h-8" />
        </button>
      )}

      {images.length > 1 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm px-3 py-1 rounded-full">
            {currentIndex + 1} / {images.length}
        </div>
      )}
    </div>
  );
};