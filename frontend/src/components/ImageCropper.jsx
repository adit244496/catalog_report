import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../utils/cropImage';
import './ImageCropper.css';
import { X } from 'lucide-react';

const ImageCropper = ({ imageSrc, onCropComplete, onCancel }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropCompleteHandler = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    
    setIsProcessing(true);
    try {
      const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropComplete(croppedImageBlob);
    } catch (e) {
      console.error(e);
      alert('Error cropping image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="cropper-overlay">
      <div className="cropper-modal">
        <div className="cropper-header">
          <h3>Align & Set Image Layout</h3>
          <button className="cropper-close" onClick={onCancel}>
            <X size={20} />
          </button>
        </div>
        
        <div className="cropper-container">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={16 / 9}
            onCropChange={setCrop}
            onCropComplete={onCropCompleteHandler}
            onZoomChange={setZoom}
            objectFit="horizontal-cover"
          />
        </div>
        
        <div className="cropper-controls">
          <label className="zoom-label">Zoom</label>
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            aria-labelledby="Zoom"
            onChange={(e) => setZoom(e.target.value)}
            className="zoom-slider"
          />
        </div>
        
        <div className="cropper-footer">
          <button className="btn btn-outline" onClick={onCancel} disabled={isProcessing}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleConfirm} disabled={isProcessing}>
            {isProcessing ? 'Processing...' : 'Confirm Alignment'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropper;
