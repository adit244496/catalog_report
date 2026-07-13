import { ExternalLink, FileText, Edit3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './MaterialCard.css';

const MaterialCard = ({ material, categories, userRole, onOpenModal }) => {
  const navigate = useNavigate();
  // Find category name
  const categoryName = categories.find(c => c.id === material.category_id)?.name || "Unknown";

  const getFullUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('/')) {
      return `http://localhost:8000${url}`;
    }
    return url;
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

  const firstImageUrl = material.image_url ? material.image_url.split(',')[0] : null;

  let projectsList = [];
  let latestProject = null;
  if (material.used_in) {
    projectsList = material.used_in.split(',').map(p => p.trim()).filter(Boolean);
    if (projectsList.length > 0) {
      latestProject = projectsList[projectsList.length - 1];
    }
  }

  return (
    <div className="material-card animate-fade-in">
      <div className="card-image-container" onClick={onOpenModal} style={{cursor: 'pointer'}}>
        {firstImageUrl ? (
          <img src={getFullUrl(firstImageUrl)} alt={material.name} className="card-image" />
        ) : (
          <div className="card-image-placeholder">No Image Available</div>
        )}
        {material.used_in && latestProject && (
          <div className="used-in-badge" title={`Projects: ${projectsList.join(', ')}`}>
            USED IN: {latestProject.toUpperCase()}
            {projectsList.length > 1 ? ` +${projectsList.length - 1}` : ''}
          </div>
        )}
      </div>

      <div className="card-content" style={{ padding: '1rem 1.2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <div className="card-subtitle" style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Lead: {leadTimeText} • Origin: {material.origin || 'Unknown'}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {(userRole === 'admin' || userRole === 'super_admin') && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/admin', { state: { editMaterialId: material.id, restrictedMode: true } });
                }}
                style={{ background: 'transparent', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', padding: 0, display: 'flex' }}
                title="Edit Projects Used In"
              >
                <Edit3 size={14} />
              </button>
            )}
            {material.pdf_url ? <a href={getFullUrl(material.pdf_url)} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'flex' }}><FileText size={14} /></a> : null}
          </div>
        </div>
        
        <h3 className="card-title" style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary-color)', letterSpacing: 0 }}>
          {material.name}
        </h3>
        
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-main)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: '1.5' }}>
          {material.description || 'No description provided.'}
        </p>
      </div>
    </div>
  );
};

export default MaterialCard;
