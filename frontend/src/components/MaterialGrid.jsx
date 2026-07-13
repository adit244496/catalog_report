import MaterialCard from './MaterialCard';
import './MaterialGrid.css';

const MaterialGrid = ({ materials, categories, loading, userRole, onOpenModal }) => {
  if (loading) {
    return <div className="grid-loading">Loading portfolio...</div>;
  }

  if (materials.length === 0) {
    return <div className="grid-empty">No materials found for this selection.</div>;
  }

  return (
    <div className="material-grid">
      {materials.map(material => (
        <MaterialCard 
          key={material.id} 
          material={material} 
          categories={categories} 
          userRole={userRole}
          onOpenModal={() => onOpenModal(material)}
        />
      ))}
    </div>
  );
};

export default MaterialGrid;
