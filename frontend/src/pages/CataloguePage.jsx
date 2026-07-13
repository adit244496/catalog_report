import { useState, useEffect } from 'react';
import api from '../api';
import Sidebar from '../components/Sidebar';
import TopNavigation from '../components/TopNavigation';
import MaterialGrid from '../components/MaterialGrid';
import MaterialModal from '../components/MaterialModal';
import CalendarModal from '../components/CalendarModal';

const CataloguePage = ({ isAuthenticated, onLogout, userRole }) => {
  const [categories, setCategories] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [materialTypeFilter, setMaterialTypeFilter] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [usedInFilter, setUsedInFilter] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [selectedMaterialModal, setSelectedMaterialModal] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories/');
        setCategories(res.data);
      } catch (err) {
        console.error("Failed to fetch categories", err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch materials when filters change
  useEffect(() => {
    const fetchMaterials = async () => {
      setLoading(true);
      try {
        let url = '/materials/?limit=100';
        if (selectedCategory) url += `&category_id=${selectedCategory}`;
        if (materialTypeFilter) url += `&material_type=${encodeURIComponent(materialTypeFilter)}`;
        if (companyFilter) url += `&company=${encodeURIComponent(companyFilter)}`;
        if (usedInFilter) url += `&used_in=${encodeURIComponent(usedInFilter)}`;
        
        const res = await api.get(url);
        setMaterials(res.data);
      } catch (err) {
        console.error("Failed to fetch materials", err);
      } finally {
        setLoading(false);
      }
    };

    // Debounce search slightly
    const timeoutId = setTimeout(() => {
      fetchMaterials();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [selectedCategory, materialTypeFilter, companyFilter, usedInFilter]);

  return (
    <div className="app-container">
      <Sidebar 
        categories={categories} 
        selectedCategory={selectedCategory} 
        onSelectCategory={setSelectedCategory}
        onLogout={onLogout}
        userRole={userRole}
        isOpen={isMobileMenuOpen}
        setIsOpen={setIsMobileMenuOpen}
        isDesktopCollapsed={isDesktopCollapsed}
        setIsDesktopCollapsed={setIsDesktopCollapsed}
      />
      
      <main className={`main-content ${isDesktopCollapsed ? 'desktop-expanded' : ''}`}>
        <TopNavigation 
          materialTypeFilter={materialTypeFilter}
          setMaterialTypeFilter={setMaterialTypeFilter}
          companyFilter={companyFilter}
          setCompanyFilter={setCompanyFilter}
          usedInFilter={usedInFilter}
          setUsedInFilter={setUsedInFilter}
          totalItems={materials.length}
          materials={materials}
          userRole={userRole}
          onOpenCalendar={() => setShowCalendar(true)}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />
        
        <MaterialGrid 
          materials={materials} 
          categories={categories} 
          loading={loading}
          userRole={userRole}
          onOpenModal={(material) => setSelectedMaterialModal(material)}
        />
        
        {/* Render Modal */}
        <MaterialModal 
          material={selectedMaterialModal} 
          categories={categories} 
          userRole={userRole}
          onClose={() => setSelectedMaterialModal(null)} 
          onPdfUploadSuccess={(updatedMat) => {
            // Update the selected material so modal UI refreshes immediately
            setSelectedMaterialModal(updatedMat);
            // Also update the materials array so the card updates
            setMaterials(prev => prev.map(m => m.id === updatedMat.id ? updatedMat : m));
          }}
        />
        
        {showCalendar && (
          <CalendarModal 
            userRole={userRole} 
            categories={categories}
            onClose={() => setShowCalendar(false)} 
            onOpenMaterial={(mat) => setSelectedMaterialModal(mat)}
          />
        )}
      </main>
    </div>
  );
};

export default CataloguePage;
