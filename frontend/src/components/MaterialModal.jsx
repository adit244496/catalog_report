import { useState, useRef } from 'react';
import { X, FileText, Maximize, Download, Upload, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../api';
import './MaterialModal.css';

const MaterialModal = ({ material, categories, userRole, onClose, onPdfUploadSuccess }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [enlargedImage, setEnlargedImage] = useState(null);
  const fileInputRef = useRef(null);

  if (!material) return null;

  const categoryName = categories.find(c => c.id === material.category_id)?.name || "Unknown";
  const category = categories.find(c => c.id === material.category_id);

  const getFullUrl = (url) => {
    if (!url) return null;
    return url;
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isUploading) {
      onClose();
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check if it's a PDF
    if (file.type !== 'application/pdf') {
      alert('Please upload a valid PDF file.');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('pdf_file', file);

    try {
      const response = await api.put(`/materials/${material.id}/pdf`, formData);
      if (onPdfUploadSuccess) {
        onPdfUploadSuccess(response.data);
      }
    } catch (err) {
      console.error('Failed to upload PDF', err);
      alert('Failed to upload PDF. Please try again.');
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Calculate dynamic lead time (days since upload)
  const createdDate = new Date(material.created_at);
  const now = new Date();
  const diffTime = Math.abs(now - createdDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  let leadTimeText = `${diffDays} Days`;
  if (diffDays > 14) {
    leadTimeText = `${Math.floor(diffDays / 7)} Weeks`;
  }

  const images = material.image_url ? material.image_url.split(',') : [];
  
  const usedInArray = material.used_in ? material.used_in.split(',').map(p => p.trim()).filter(Boolean) : [];

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content animate-slide-up">
        {/* Header */}
        <div className="modal-header">
          <div className="header-left">
            <div className="header-badges">
              {usedInArray.length > 0 && (
                <div 
                  className="badge-accent" 
                  title={usedInArray.join(', ').toUpperCase()}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'help' }}
                >
                  <span>USED IN: {usedInArray[0].toUpperCase()}</span>
                  {usedInArray.length > 1 && (
                    <span style={{ 
                      background: 'rgba(255,255,255,0.2)', 
                      padding: '1px 6px', 
                      borderRadius: '10px', 
                      fontSize: '0.85em',
                      fontWeight: 'bold' 
                    }}>
                      +{usedInArray.length - 1}
                    </span>
                  )}
                </div>
              )}
              <span className="badge-text">/ SPECIFICATION DATA</span>
            </div>
            <h2 className="modal-title">
              {material.company_url ? (
                <a 
                  href={material.company_url.startsWith('http') ? material.company_url : `https://${material.company_url}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ color: 'inherit', textDecoration: 'none', cursor: 'pointer' }}
                  onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
                  onMouseOut={(e) => e.target.style.textDecoration = 'none'}
                >
                  {material.name.toUpperCase()}
                </a>
              ) : (
                material.name.toUpperCase()
              )}
            </h2>
            <div className="modal-meta">
              <span>Lead Time: <strong>{leadTimeText}</strong></span>
              <span className="divider">|</span>
              <span>Origin: <strong>{material.origin || 'Unknown'}</strong></span>
            </div>
          </div>
          <div className="header-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {material.pdf_url && (
              <button 
                className="preview-toggle-btn" 
                onClick={() => setIsPreviewMode(!isPreviewMode)}
              >
                <FileText size={16} />
                <span>{isPreviewMode ? 'BACK TO DETAILS' : 'PREVIEW BROCHURE'}</span>
              </button>
            )}
            <button className="close-btn" onClick={onClose}><X size={20} /></button>
          </div>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ padding: isPreviewMode ? '0' : '' }}>
          {isPreviewMode ? (
            <iframe
              className="modal-pdf-frame"
              src={getFullUrl(material.pdf_url)}
              width="100%"
              height="650px"
              style={{ border: 'none', display: 'block' }}
              title="PDF Preview"
            />
          ) : (
            <>
              {/* Left Column */}
              <div className="modal-col left-col">
                <div className="modal-image-container" style={{ position: 'relative' }}>
                  {images.length > 0 ? (
                    <>
                      <img 
                        src={getFullUrl(images[currentImageIndex])} 
                        alt={material.name} 
                        className="modal-image" 
                        style={{ cursor: 'zoom-in' }}
                        onClick={() => setEnlargedImage(getFullUrl(images[currentImageIndex]))}
                      />
                      
                      {images.length > 1 && (
                        <>
                          <button 
                            style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.8)', border: 'none', borderRadius: '50px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}
                            onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1); }}
                          >
                            <ChevronLeft size={20} />
                          </button>
                          <button 
                            style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.8)', border: 'none', borderRadius: '50px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}
                            onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1); }}
                          >
                            <ChevronRight size={20} />
                          </button>
                          
                          <div style={{ position: 'absolute', bottom: '10px', left: '0', width: '100%', display: 'flex', justifyContent: 'center', gap: '6px' }}>
                            {images.map((_, idx) => (
                              <div key={idx} style={{ width: '6px', height: '6px', borderRadius: '50%', background: idx === currentImageIndex ? 'var(--primary-color)' : 'rgba(0,0,0,0.2)' }} />
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="modal-image-placeholder">No Image Available</div>
                  )}
                </div>

            <div className="scope-section">
              <h4 className="section-title">SCOPE DESCRIPTION</h4>
              <p className="scope-text">{material.description || 'No description available for this material.'}</p>
            </div>
          </div>

          {/* Right Column */}
          <div className="modal-col right-col">
            <h4 className="section-title">ARCHITECTURAL PARAMETERS</h4>
            <div className="params-table">
              {category?.param1_name && (
                <div className="param-row">
                  <div className="param-name">{category.param1_name}</div>
                  <div className="param-value">{material.param1_value || '-'}</div>
                </div>
              )}
              {category?.param2_name && (
                <div className="param-row">
                  <div className="param-name">{category.param2_name}</div>
                  <div className="param-value">{material.param2_value || '-'}</div>
                </div>
              )}
              {category?.param3_name && (
                <div className="param-row">
                  <div className="param-name">{category.param3_name}</div>
                  <div className="param-value">{material.param3_value || '-'}</div>
                </div>
              )}
              {category?.param4_name && (
                <div className="param-row">
                  <div className="param-name">{category.param4_name}</div>
                  <div className="param-value">{material.param4_value || '-'}</div>
                </div>
              )}
              {category?.param5_name && (
                <div className="param-row">
                  <div className="param-name">{category.param5_name}</div>
                  <div className="param-value">{material.param5_value || '-'}</div>
                </div>
              )}

              {!category?.param1_name && !category?.param2_name && !category?.param3_name && !category?.param4_name && !category?.param5_name && (
                <div className="no-params">No architectural parameters defined for this category.</div>
              )}
            </div>

            {/* PDF Section */}
            {(material.pdf_url || userRole === 'super_admin' || userRole === 'admin') && (
              <div className="pdf-section">
                <div className="pdf-box">
                  <div className="pdf-icon"><FileText size={24} /></div>
                  <div className="pdf-info">
                    <div className="pdf-name">{material.pdf_url ? 'Technical_Form.pdf' : 'No PDF Uploaded'}</div>
                    <div className="pdf-sub">INTERACTIVE SPECS PDF ATTACHMENT</div>
                  </div>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept=".pdf"
                  onChange={handleFileChange}
                />

                <div className="pdf-actions">
                  {material.pdf_url && (
                    <a href={getFullUrl(material.pdf_url)} target="_blank" rel="noreferrer" className="pdf-btn pdf-btn-outline">
                      <Maximize size={14} /> FULLSCREEN
                    </a>
                  )}

                  {/* If user is super_admin/admin, show UPLOAD or RE-UPLOAD. Otherwise if viewer, show SAVE BROCHURE */}
                  {(userRole === 'super_admin' || userRole === 'admin') ? (
                    <button
                      className="pdf-btn pdf-btn-solid"
                      onClick={handleUploadClick}
                      disabled={isUploading}
                    >
                      <Upload size={14} /> {isUploading ? 'UPLOADING...' : (material.pdf_url ? 'RE-UPLOAD BROCHURE' : 'UPLOAD BROCHURE')}
                    </button>
                  ) : material.pdf_url ? (
                    <a href={getFullUrl(material.pdf_url)} download target="_blank" rel="noreferrer" className="pdf-btn pdf-btn-solid">
                      <Download size={14} /> SAVE BROCHURE
                    </a>
                  ) : null}
                </div>
              </div>
            )}

            {/* Footer action removed as requested */}
          </div>
          </>
          )}
        </div>
      </div>
      
      {enlargedImage && (
        <div 
          className="enlarged-image-overlay"
          onClick={() => setEnlargedImage(null)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 99999,
            display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'zoom-out'
          }}
        >
          <img 
            src={enlargedImage} 
            alt="Enlarged View" 
            style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }} 
          />
          <button 
            onClick={() => setEnlargedImage(null)}
            style={{ position: 'absolute', top: '30px', right: '40px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.8 }}
          >
            <X size={36} />
          </button>
        </div>
      )}
    </div>
  );
};

export default MaterialModal;
