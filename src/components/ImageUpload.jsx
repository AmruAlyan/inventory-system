import React, { useState, useRef, useCallback } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faTrash, faCrop, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase/firebase';
import { toast } from 'react-toastify';

const ImageUpload = ({ 
  currentImageUrl = null, 
  onImageChange, 
  productId = null,
  disabled = false 
}) => {
  const [src, setSrc] = useState(null);
  const [crop, setCrop] = useState({ aspect: 1 });
  const [completedCrop, setCompletedCrop] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const imgRef = useRef(null);
  const fileInputRef = useRef(null);

  const onSelectFile = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('אנא בחר קובץ תמונה תקין');
        return;
      }
      
      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        toast.error('גודל הקובץ גדול מדי. אנא בחר קובץ קטן מ-10MB');
        return;
      }
      
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setSrc(reader.result);
        setShowCropModal(true);
      });
      reader.addEventListener('error', () => {
        toast.error('שגיאה בקריאת הקובץ');
      });
      reader.readAsDataURL(file);
    }
  };

  const onImageLoad = useCallback((e) => {
    const img = e.target;
    imgRef.current = img;
    const { width, height } = img;
    
    if (width <= 0 || height <= 0) {
      toast.error('שגיאה: גודל התמונה לא תקין');
      return false;
    }
    
    // Set initial crop to fit the entire image
    const cropSize = Math.min(width, height);
    const initialCrop = {
      unit: 'px',
      width: cropSize,
      height: cropSize,
      x: (width - cropSize) / 2,
      y: (height - cropSize) / 2,
      aspect: 1
    };
    
    setCrop(initialCrop);
    setCompletedCrop(initialCrop);
    return false; // Important for ReactCrop
  }, []);

  const getCroppedImg = (image, crop) => {
    return new Promise((resolve, reject) => {
      try {
        console.log('getCroppedImg called with:', { image, crop });
        
        // Validate that image is a proper HTMLImageElement
        if (!image || !(image instanceof HTMLImageElement)) {
          reject(new Error('Invalid image element provided'));
          return;
        }
        
        // Ensure image is loaded
        if (!image.complete) {
          reject(new Error('Image not fully loaded'));
          return;
        }
        
        const canvas = document.createElement('canvas');
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        canvas.width = crop.width;
        canvas.height = crop.height;
        const ctx = canvas.getContext('2d');

        console.log('Canvas dimensions:', canvas.width, canvas.height);
        console.log('Scale factors:', scaleX, scaleY);
        console.log('Image dimensions:', image.width, image.height, image.naturalWidth, image.naturalHeight);

        if (!ctx) {
          reject(new Error('Unable to get canvas context'));
          return;
        }

        ctx.drawImage(
          image,
          crop.x * scaleX,
          crop.y * scaleY,
          crop.width * scaleX,
          crop.height * scaleY,
          0,
          0,
          crop.width,
          crop.height
        );

        console.log('Image drawn to canvas');

        canvas.toBlob((blob) => {
          console.log('Canvas.toBlob result:', blob);
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas to blob conversion failed'));
          }
        }, 'image/jpeg', 0.8);
      } catch (error) {
        console.error('Error in getCroppedImg:', error);
        reject(error);
      }
    });
  };

  const handleCropComplete = async () => {
    console.log('handleCropComplete called');
    console.log('completedCrop:', completedCrop);
    console.log('imgRef.current:', imgRef.current);
    
    if (!completedCrop || !imgRef.current) {
      toast.error('שגיאה: נתונים חסרים לחיתוך התמונה');
      return;
    }

    // Validate that imgRef.current is a proper image element
    if (!(imgRef.current instanceof HTMLImageElement)) {
      toast.error('שגיאה: רכיב התמונה לא תקין');
      return;
    }

    // Ensure image is fully loaded
    if (!imgRef.current.complete) {
      toast.error('שגיאה: התמונה לא נטענה במלואה');
      return;
    }

    // Validate crop dimensions
    if (completedCrop.width <= 0 || completedCrop.height <= 0) {
      toast.error('שגיאה: גודל החיתוך לא תקין');
      return;
    }

    setUploading(true);
    try {
      console.log('Starting crop process...');
      const croppedImageBlob = await getCroppedImg(imgRef.current, completedCrop);
      console.log('Cropped image blob:', croppedImageBlob);
      
      if (!croppedImageBlob) {
        throw new Error('Failed to create cropped image');
      }
      
      // Upload to Firebase Storage
      const timestamp = Date.now();
      const fileName = `products/${productId || 'temp'}_${timestamp}.jpg`;
      const storageRef = ref(storage, fileName);
      
      console.log('Uploading to Firebase...');
      await uploadBytes(storageRef, croppedImageBlob);
      const downloadURL = await getDownloadURL(storageRef);
      console.log('Upload successful, URL:', downloadURL);
      
      // If there was a previous image, delete it
      if (currentImageUrl && productId) {
        try {
          const oldImageRef = ref(storage, currentImageUrl);
          await deleteObject(oldImageRef);
        } catch (error) {
          // Ignore errors when deleting old image
          console.log('Could not delete old image:', error);
        }
      }
      
      onImageChange(downloadURL);
      setShowCropModal(false);
      setSrc(null);
      setCompletedCrop(null);
      toast.success('התמונה הועלתה בהצלחה');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(`שגיאה בהעלאת התמונה: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!currentImageUrl) return;
    
    if (window.confirm('האם אתה בטוח שברצונך למחוק את התמונה?')) {
      setUploading(true);
      try {
        // Delete from Firebase Storage
        const imageRef = ref(storage, currentImageUrl);
        await deleteObject(imageRef);
        
        onImageChange(null);
        toast.success('התמונה נמחקה בהצלחה');
      } catch (error) {
        console.error('Error deleting image:', error);
        toast.error('שגיאה במחיקת התמונה');
      } finally {
        setUploading(false);
      }
    }
  };

  const handleCancelCrop = () => {
    setShowCropModal(false);
    setSrc(null);
    setCompletedCrop(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="image-upload-container">
      <label>תמונת מוצר:</label>
      
      {/* Current Image Display */}
      <div className="current-image-display">
        {currentImageUrl ? (
          <div className="image-preview-container">
            <img 
              src={currentImageUrl} 
              alt="תמונת מוצר" 
              className="product-image-preview"
            />
            <div className="image-actions">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || uploading}
                className="image-action-btn edit-btn"
                title="החלף תמונה"
              >
                <FontAwesomeIcon icon={faUpload} />
              </button>
              <button
                type="button"
                onClick={handleRemoveImage}
                disabled={disabled || uploading}
                className="image-action-btn delete-btn"
                title="מחק תמונה"
              >
                <FontAwesomeIcon icon={faTrash} />
              </button>
            </div>
          </div>
        ) : (
          <div className="no-image-placeholder">
            <div className="placeholder-content">
              <FontAwesomeIcon icon={faUpload} className="placeholder-icon" />
              <p>אין תמונה</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || uploading}
                className="upload-btn"
              >
                העלה תמונה
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onSelectFile}
        disabled={disabled || uploading}
        style={{ display: 'none' }}
      />

      {/* Crop Modal */}
      {showCropModal && (
        <div className="crop-modal-overlay">
          <div className="crop-modal">
            <div className="crop-modal-header">
              <h3>חתוך תמונה</h3>
              <p>בחר את החלק של התמונה שברצונך להציג</p>
            </div>
            
            <div className="crop-container">
              {src && (
                <ReactCrop
                  crop={crop}
                  onChange={(newCrop) => setCrop(newCrop)}
                  onComplete={(c) => {
                    if (c && c.width > 0 && c.height > 0) {
                      setCompletedCrop(c);
                    }
                  }}
                  aspect={1}
                  circularCrop={false}
                  minWidth={50}
                  minHeight={50}
                >
                  <img
                    ref={(ref) => {
                      imgRef.current = ref;
                    }}
                    src={src}
                    alt="לחיתוך"
                    onLoad={onImageLoad}
                    style={{ maxWidth: '100%', maxHeight: '400px' }}
                  />
                </ReactCrop>
              )}
            </div>
            
            <div className="crop-modal-actions">
              <button
                type="button"
                onClick={handleCropComplete}
                disabled={!completedCrop || uploading || (completedCrop && (completedCrop.width <= 0 || completedCrop.height <= 0))}
                className="crop-btn confirm-btn"
              >
                <FontAwesomeIcon icon={faCheck} />
                {uploading ? 'מעלה...' : 'אשר'}
              </button>
              <button
                type="button"
                onClick={handleCancelCrop}
                disabled={uploading}
                className="crop-btn cancel-btn"
              >
                <FontAwesomeIcon icon={faTimes} />
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
