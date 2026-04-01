import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';
import { Camera } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();
  const [galleryUrl, setGalleryUrl] = useState('');

  useEffect(() => {
    // Dynamically get the current origin to generate the QR code
    // In a real scenario, this would point to the production URL.
    const currentOrigin = window.location.origin;
    setGalleryUrl(`${currentOrigin}/gallery`);
  }, []);

  return (
    <div className="landing-container">
      <div className="glass-card">
        {/* Placeholder for the user's uploaded portrait */}
        <div className="hero-image-container" style={{ marginBottom: '1.5rem' }}>
          <img src="/couple-illustration.png" alt="Ekta and Rahul" style={{ width: '100%', borderRadius: '16px', objectFit: 'cover', maxHeight: '300px' }} onError={(e) => e.target.style.display = 'none'} />
        </div>
        <h1 className="title">Ekta & Rahul</h1>
        <p className="subtitle">Welcome to our wedding! We are so thrilled to celebrate with you.</p>
        
        <div className="qr-wrapper">
          {galleryUrl && (
            <QRCodeSVG 
              value={galleryUrl} 
              size={200} 
              bgColor={"#ffffff"} 
              fgColor={"#3E2723"} 
              level={"M"}
              className="qr-code" 
            />
          )}
        </div>
        
        <p className="scan-instruction">Scan the QR code to open the gallery</p>
        
        <div className="action-row">
          <span className="divider">or</span>
        </div>
        
        <button className="primary-button continue-btn" onClick={() => navigate('/gallery')}>
          <Camera size={20} />
          Go to Gallery
        </button>
      </div>
    </div>
  );
}
