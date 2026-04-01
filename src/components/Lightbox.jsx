import React, { useEffect, useState, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Download, Trash2 } from 'lucide-react';
import { getImageUrl } from '../utils/storage';

export default function Lightbox({ 
  images, 
  currentIndex, 
  onClose, 
  onDelete, 
  currentGuestId 
}) {
  const [index, setIndex] = useState(currentIndex);
  
  // Guard clause
  if (!images || images.length === 0 || index < 0 || index >= images.length) {
    return null;
  }

  const currentImage = images[index];
  const isOwner = currentImage.guestId === currentGuestId;

  const handleNext = useCallback((e) => {
    e?.stopPropagation();
    if (index < images.length - 1) {
      setIndex(index + 1);
    }
  }, [index, images.length]);

  const handlePrev = useCallback((e) => {
    e?.stopPropagation();
    if (index > 0) {
      setIndex(index - 1);
    }
  }, [index]);

  const handleDownload = (e) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = getImageUrl(currentImage.url);
    // Add _blank so it triggers download for cross-origin or same-origin fallback
    link.target = '_blank';
    link.download = `wedding-moment-${currentImage.name}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this photo?")) {
      onDelete(currentImage.id);
      // Close lightbox after delete to refresh grid seamlessly
      onClose();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, onClose]);

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <div className="lightbox-toolbar" onClick={(e) => e.stopPropagation()}>
        <div className="lightbox-info">
          <span>{index + 1} of {images.length}</span>
        </div>
        <div className="lightbox-actions">
          {isOwner && (
            <button className="lb-icon-btn delete-btn" onClick={handleDelete} title="Delete your photo">
              <Trash2 size={24} />
            </button>
          )}
          <button className="lb-icon-btn" onClick={handleDownload} title="Download">
            <Download size={24} />
          </button>
          <button className="lb-icon-btn" onClick={onClose} title="Close">
            <X size={28} />
          </button>
        </div>
      </div>

      <div className="lightbox-content">
        <button 
          className="lb-nav-btn prev" 
          onClick={handlePrev} 
          disabled={index === 0}
        >
          <ChevronLeft size={48} />
        </button>

        <div className="lb-image-container" onClick={(e) => e.stopPropagation()}>
          <img 
            src={getImageUrl(currentImage.url)} 
            alt={currentImage.name} 
            className="lb-image"
          />
        </div>

        <button 
          className="lb-nav-btn next" 
          onClick={handleNext} 
          disabled={index === images.length - 1}
        >
          <ChevronRight size={48} />
        </button>
      </div>
    </div>
  );
}
