import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Camera, Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getImages, saveImage, deleteImage, getImageUrl, getGuestId } from '../utils/storage';
import Lightbox from '../components/Lightbox';

export default function Gallery() {
  const navigate = useNavigate();
  const [images, setImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Lightbox state
  const [activeLightboxIndex, setActiveLightboxIndex] = useState(null);
  
  const guestId = getGuestId();

  // Load images on mount
  useEffect(() => {
    loadGlobalImages();
    // Set up a simple poll to sync images every 10 seconds for a collaborative feel
    const interval = setInterval(loadGlobalImages, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadGlobalImages = async () => {
    try {
      const list = await getImages();
      setImages(list);
    } catch (err) {
      console.error("Failed to fetch gallery:", err);
    }
  };

  const onDrop = useCallback(async (acceptedFiles, rejectedFiles) => {
    if (rejectedFiles && rejectedFiles.length > 0) {
      setErrorMsg('Invalid file type or size. Please upload images under 15MB.');
      setTimeout(() => setErrorMsg(''), 5000);
      return;
    }

    if (!acceptedFiles || acceptedFiles.length === 0) return;
    setIsUploading(true);

    try {
      let newlySaved = [];
      for (const file of acceptedFiles) {
        const res = await saveImage(file);
        newlySaved.push(res);
      }
      
      // Update gallery instantly
      setImages(prev => [...newlySaved, ...prev].sort((a, b) => b.timestamp - a.timestamp));
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to process image. Make sure the backend server is running.');
    } finally {
      setIsUploading(false);
      setTimeout(() => setErrorMsg(''), 4000);
    }
  }, []);

  const handleDelete = async (imageId) => {
    try {
      await deleteImage(imageId);
      // Remove from UI immediately
      setImages(prev => prev.filter(img => img.id !== imageId));
    } catch (err) {
      alert("Error deleting image: " + err.message);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'image/webp': []
    },
    maxSize: 15 * 1024 * 1024 // 15MB max input before compression
  });

  return (
    <div className="gallery-container">
      <header className="glass-header">
        <button className="icon-btn" onClick={() => navigate('/')}>
          <ArrowLeft size={24} />
        </button>
        <h2 className="header-title">Shared Gallery</h2>
        <div style={{ width: 40 }} /> {/* spacer */}
      </header>

      <main className="gallery-main">
        {errorMsg && (
          <div className="error-banner">{errorMsg}</div>
        )}

        <div 
          {...getRootProps()} 
          className={`dropzone ${isDragActive ? 'active' : ''} ${isUploading ? 'disabled' : ''}`}
        >
          <input {...getInputProps()} disabled={isUploading} />
          {isUploading ? (
            <div className="dz-content">
              <Loader2 className="spinner" size={40} />
              <p>Compressing & Uploading to Global Gallery...</p>
            </div>
          ) : (
            <div className="dz-content">
              <Camera size={40} className="dz-icon" />
              {isDragActive ? (
                <p>Drop the files here...</p>
              ) : (
                <p>Drag 'n' drop some photos here to share with everyone, or click to select</p>
              )}
            </div>
          )}
        </div>

        <div className="moodboard">
          {images.map((img, index) => (
            <div 
              key={img.id} 
              className="image-card" 
              onClick={() => setActiveLightboxIndex(index)}
              title="Click to view full screen"
            >
              <img src={getImageUrl(img.url)} alt={img.name} loading="lazy" />
              <div className="overlay overlay-click-hint">
                <span>View Full Size</span>
              </div>
            </div>
          ))}
          {images.length === 0 && !isUploading && (
            <div className="empty-state">
              <p>No photos yet. Be the first to add to our moodboard!</p>
            </div>
          )}
        </div>
      </main>

      {/* Lightbox Viewer */}
      {activeLightboxIndex !== null && (
        <Lightbox 
          images={images}
          currentIndex={activeLightboxIndex}
          onClose={() => setActiveLightboxIndex(null)}
          onDelete={handleDelete}
          currentGuestId={guestId}
        />
      )}
    </div>
  );
}
