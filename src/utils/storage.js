import imageCompression from 'browser-image-compression';
import { supabase } from './supabase';

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
 * Compress and upload an image to Supabase
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
    
    const guestId = getGuestId();
    const timestamp = Date.now();
    // Use a unique file name
    const fileExt = file.name.split('.').pop();
    const fileName = `${timestamp}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${guestId}/${fileName}`;

    // 1. Upload the image to Supabase Storage 'gallery' bucket
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('gallery')
      .upload(filePath, compressedFile, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw new Error(uploadError.message);

    // 2. Insert metadata into the 'images' table
    const dbEntry = {
      id: uploadData.path, // We use the storage path as a unique ID
      url: uploadData.path, // This maps to the storage path
      name: file.name,
      size: compressedFile.size,
      timestamp: timestamp,
      guestId: guestId
    };

    const { data: dbData, error: dbError } = await supabase
      .from('images')
      .insert([dbEntry])
      .select();

    if (dbError) throw new Error(dbError.message);

    return dbData[0];
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}

/**
 * Retrieve all global images from Supabase
 */
export async function getImages() {
  try {
    const { data, error } = await supabase
      .from('images')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) throw new Error(error.message);
    
    return data || [];
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
    // 1. Delete from storage bucket
    const { error: storageError } = await supabase
      .storage
      .from('gallery')
      .remove([imageId]);
      
    if (storageError) throw new Error(storageError.message);

    // 2. Delete from database table
    const { error: dbError } = await supabase
      .from('images')
      .delete()
      .eq('id', imageId)
      .eq('guestId', getGuestId()); // Only let the uploading guest delete it

    if (dbError) throw new Error(dbError.message);

    return { success: true };
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
}

/**
 * Get full image URL from a relative db path
 */
export function getImageUrl(urlPath) {
  if (!urlPath) return '';
  // Convert the relative path into a full public URL from the Supabase bucket
  const { data } = supabase.storage.from('gallery').getPublicUrl(urlPath);
  return data.publicUrl;
}
