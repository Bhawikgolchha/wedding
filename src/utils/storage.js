import imageCompression from 'browser-image-compression';

// Dynamically use the same hostname as the page.
// This makes it work on localhost AND when guests scan the QR code from their phones on the LAN.
const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const API_BASE_URL = `http://${hostname}:3001/api`;

/**
 * Gets or creates a unique guest ID to identify uploads
 */
export function getGuestId() {
  let guestId = localStorage.getItem('guestId');
  if (!guestId) {
    guestId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('guestId', guestId);
  }
  return guestId;
}

/**
 * Compress and upload an image
 * @param {File} file 
 */
export async function saveImage(file) {
  try {
    const options = {
      maxSizeMB: 1, // Compress to max 1MB
      maxWidthOrHeight: 1200,
      useWebWorker: true
    };
    
    // Compress the file
    const compressedFile = await imageCompression(file, options);
    
    // Create form data
    const formData = new FormData();
    // We send the compressed file, keeping the original file name
    formData.append('image', compressedFile, file.name);
    // Include the uploader's unique identity
    formData.append('guestId', getGuestId());

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to upload');
    }

    return await response.json();
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}

/**
 * Retrieve all global images from Server
 */
export async function getImages() {
  try {
    const response = await fetch(`${API_BASE_URL}/images`);
    if (!response.ok) {
      throw new Error('Failed to fetch images');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching images:', error);
    return [];
  }
}

/**
 * Delete an image (authorized by guestId)
 */
export async function deleteImage(imageId) {
  try {
    const response = await fetch(`${API_BASE_URL}/images/${imageId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ guestId: getGuestId() })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to delete');
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
}

/**
 * Get full image URL from a relative db path
 */
export function getImageUrl(urlPath) {
  return `http://localhost:3001${urlPath}`;
}
