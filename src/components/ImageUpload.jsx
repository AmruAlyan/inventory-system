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
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setSrc(reader.result);
        setShowCropModal(true);
      });
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onImageLoad = useCallback((img) => {
    imgRef.current = img;
    const { width, height } = img;
    
    // Set initial crop to fit the entire image
    const cropSize = Math.min(width, height);
    setCrop({
      unit: 'px',
      width: cropSize,
      height: cropSize,
      x: (width - cropSize) / 2,
      y: (height - cropSize) / 2,
      aspect: 1
    });
  }, []);

  const getCroppedImg = (image, crop) => {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext('2d');

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

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 0.8);
    });
  };

  const handleCropComplete = async () => {
    if (!completedCrop || !imgRef.current) return;

    setUploading(true);
    try {
      const croppedImageBlob = await getCroppedImg(imgRef.current, completedCrop);
      
      // Upload to Firebase Storage
      const timestamp = Date.now();
      const fileName = `products/${productId || 'temp'}_${timestamp}.jpg`;
      const storageRef = ref(storage, fileName);
      
      await uploadBytes(storageRef, croppedImageBlob);
      const downloadURL = await getDownloadURL(storageRef);
      
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
      toast.success('התמונה הועלתה בהצלחה');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('שגיאה בהעלאת התמונה');
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
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={1}
                  circularCrop={false}
                >
                  <img
                    ref={imgRef}
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
                disabled={!completedCrop || uploading}
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
