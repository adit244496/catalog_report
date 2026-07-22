import { useState, useRef, useEffect } from 'react';
import { Search as SearchIcon, Settings as SettingsIcon, Filter as FilterIcon, CheckCircle2, LayoutDashboard, Calendar, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import headerGraphic from '../assets/header_graphic.png';
import './TopNavigation.css';

const AutocompleteInput = ({ value, onChange, placeholder, options, style }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => opt && opt.toLowerCase().includes(value.toLowerCase()) && opt.toLowerCase() !== value.toLowerCase()).slice(0, 10);

  return (
    <div ref={wrapperRef} style={{ position: 'relative', display: 'flex' }}>
      <input 
        type="text" 
        placeholder={placeholder} 
        value={value} 
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => { setIsFocused(true); setIsOpen(true); }}
        className="filter-field-input" 
        style={style}
      />
      {isOpen && isFocused && filteredOptions.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          background: 'rgba(255, 255, 255, 0.95)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          marginTop: '4px',
          zIndex: 1000,
          maxHeight: '200px',
          overflowY: 'auto',
          backdropFilter: 'blur(10px)',
          minWidth: '150px'
        }}>
          {filteredOptions.map((opt, i) => (
            <div 
              key={i}
              onClick={() => {
                onChange(opt);
                setIsOpen(false);
              }}
              style={{
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                fontSize: '0.8rem',
                color: 'var(--text-main)',
                borderBottom: i < filteredOptions.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none'
              }}
              onMouseOver={(e) => e.target.style.background = 'rgba(0,0,0,0.05)'}
              onMouseOut={(e) => e.target.style.background = 'transparent'}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const TopNavigation = ({ 
  materialTypeFilter, 
  setMaterialTypeFilter,
  companyFilter,
  setCompanyFilter,
  usedInFilter,
  setUsedInFilter,
  totalItems,
  userRole,
  userName,
  onOpenCalendar,
  onToggleMobileMenu,
  materials = []
}) => {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [clicks, setClicks] = useState(0);
  const [isShining, setIsShining] = useState(false);
  const dropdownRef = useRef(null);

  const uniqueMaterialTypes = Array.from(new Set(materials.flatMap(m => m.tags ? m.tags.map(t => t.tag_name) : []).filter(Boolean)));
  const uniqueCompanies = Array.from(new Set(materials.map(m => m.name).filter(Boolean)));
  
  const uniqueUsedIn = Array.from(new Set(materials.flatMap(m => m.used_in ? m.used_in.split(',').map(s => s.trim()) : []).filter(Boolean)));

  const roleLabel = userRole ? userRole.replace(/_/g, ' ').toUpperCase() : '';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="top-navigation glass" onDragStart={(e) => e.preventDefault()}>
      <div className="header-graphic" style={{ backgroundImage: `url(${headerGraphic})` }}></div>
      
      <div className="nav-left" style={{ display: 'flex', alignItems: 'center', gap: '1rem', zIndex: 2 }}>
        <button className="btn-icon mobile-menu-btn" onClick={onToggleMobileMenu} title="Menu">
          <Menu size={20} />
        </button>
        <h1 
          className={`logo-shine-container ${isShining ? 'logo-shine' : ''}`}
          onClick={() => {
            setIsShining(true);
            setTimeout(() => setIsShining(false), 1200);
          }}
          style={{ 
          margin: 0, 
          fontSize: '1.5rem', 
          fontWeight: '900', 
          letterSpacing: '-0.03em', 
          zIndex: 2, 
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer'
        }}>
          <span style={{ color: '#000000' }}>Neo</span>
          <span style={{ color: '#00509d' }}>Mat</span>
          <span style={{ color: '#f26522' }}>Cat</span>
        </h1>
      </div>

      <div className="nav-right">

        <div className="filter-system-container">
           <div className="filter-fields-wrapper" style={{ maxWidth: '600px', opacity: 1, overflow: 'visible' }}>
             <AutocompleteInput 
               placeholder="Material type..." 
               value={materialTypeFilter} 
               onChange={setMaterialTypeFilter} 
               options={uniqueMaterialTypes}
               style={{ width: '100px' }}
             />
             <AutocompleteInput 
               placeholder="Company..." 
               value={companyFilter} 
               onChange={setCompanyFilter} 
               options={uniqueCompanies}
               style={{ width: '75px' }}
             />
             <AutocompleteInput 
               placeholder="Used in..." 
               value={usedInFilter} 
               onChange={setUsedInFilter} 
               options={uniqueUsedIn}
               style={{ width: '70px' }}
             />
           </div>
        </div>

        <div className="nav-divider"></div>

        <button 
          className="btn-icon"
          title="Calendar"
          onClick={onOpenCalendar}
          style={{ background: 'transparent', border: 'none', color: 'var(--primary-color)', cursor: 'pointer' }}
        >
          <Calendar size={16} />
        </button>

        <div className="nav-divider"></div>

        {(userRole === 'super_admin' || userRole === 'admin') && (
          <div className="settings-dropdown-container" ref={dropdownRef}>
            <button 
              className={`btn-icon ${showDropdown ? 'active' : ''}`}
              title="Settings"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <SettingsIcon size={16} />
            </button>
            
            {showDropdown && (
              <div className="settings-dropdown-menu">
                <button 
                  className="dropdown-item" 
                  onClick={() => {
                    navigate('/admin');
                    setShowDropdown(false);
                  }}
                >
                  <LayoutDashboard size={14} /> 
                  {userRole === 'super_admin' ? 'Super Admin Dashboard' : 'Admin Dashboard'}
                </button>
              </div>
            )}
          </div>
        )}

        {userName && (
          <>
            <div className="nav-divider"></div>
            <div className="nav-user" title={`${userName}${roleLabel ? ` (${roleLabel})` : ''}`}>
              <div className="nav-user-avatar">{userName.charAt(0).toUpperCase()}</div>
              <div className="nav-user-meta">
                <span className="nav-user-name">{userName}</span>
                {roleLabel && <span className="nav-user-role">{roleLabel}</span>}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TopNavigation;
