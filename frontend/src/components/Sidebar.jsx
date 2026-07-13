import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LogOut, LayoutDashboard, Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
import ambujaLogo from '../assets/ambuja_logo.png';
import sidebarGraphic from '../assets/godown_graphic.png';
import './Sidebar.css';

const Sidebar = ({ categories, selectedCategory, onSelectCategory, onLogout, userRole, isOpen, setIsOpen, isDesktopCollapsed, setIsDesktopCollapsed }) => {
  const [categorySearchQuery, setCategorySearchQuery] = useState('');

  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(categorySearchQuery.toLowerCase())
  );

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'active' : ''}`} onClick={() => setIsOpen(false)}></div>
      <div className={`sidebar ${isOpen ? 'open' : ''} ${isDesktopCollapsed ? 'desktop-collapsed' : ''}`}>
        
        <button 
          className="desktop-sidebar-collapser" 
          onClick={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
          title={isDesktopCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isDesktopCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

      <div className="sidebar-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '0.5rem', paddingTop: '1.5rem' }}>
        <img src={ambujaLogo} alt="Ambuja Neotia" style={{ width: '160px', objectFit: 'contain', marginBottom: '1.5rem', filter: 'brightness(0) invert(1)' }} />
        <h2 className="section-title" style={{ margin: 0, alignSelf: 'flex-start', paddingLeft: '0.2rem' }}>MATERIAL CATEGORIES</h2>
      </div>

      <div className="sidebar-search-container">
        <Search size={14} style={{ position: 'absolute', left: '1.6rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
        <input 
          type="text" 
          placeholder="Search categories..."
          value={categorySearchQuery}
          onChange={(e) => setCategorySearchQuery(e.target.value)}
          className="sidebar-search-input"
          style={{ paddingRight: categorySearchQuery ? '2rem' : '0.8rem' }}
        />
        {categorySearchQuery && (
          <button 
            onClick={() => setCategorySearchQuery('')}
            style={{ 
              position: 'absolute', 
              right: '1.4rem', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              background: 'none', 
              border: 'none', 
              color: '#94a3b8', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2px'
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="category-list">
        <button 
          className={`category-item ${selectedCategory === null ? 'active' : ''}`}
          onClick={() => onSelectCategory(null)}
        >
          <span className="category-name">ALL CATALOGUES</span>
          <span className="category-count">
            {categories.reduce((acc, cat) => acc + cat.item_count, 0)}
          </span>
        </button>

        {filteredCategories.map((cat) => (
          <button 
            key={cat.id} 
            className={`category-item ${selectedCategory === cat.id ? 'active' : ''}`}
            onClick={() => onSelectCategory(cat.id)}
          >
            <span className="category-name">{cat.name.toUpperCase()}</span>
            <span className="category-count">{cat.item_count.toString().padStart(2, '0')}</span>
          </button>
        ))}
      </div>
      
      <div className="sidebar-graphic" style={{ backgroundImage: `url(${sidebarGraphic})` }}></div>

      <div className="sidebar-footer">

        {userRole ? (
          <button onClick={onLogout} className="logout-btn btn btn-outline">
            <LogOut size={18} /> Logout
          </button>
        ) : (
          <NavLink to="/login" className="login-link btn btn-primary">
            Login
          </NavLink>
        )}
        
        <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#ffffff', textAlign: 'center', fontWeight: '500', textShadow: '0 1px 3px rgba(0,0,0,0.8)', zIndex: 10, position: 'relative', whiteSpace: 'nowrap', letterSpacing: '-0.02em' }}>
          &copy; {new Date().getFullYear()} AmbujaNeotia. All rights reserved.
        </div>
      </div>
      </div>
    </>
  );
};

export default Sidebar;
