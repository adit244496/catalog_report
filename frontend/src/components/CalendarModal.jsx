import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../api';
import { Calendar, ChevronLeft, ChevronRight, X, Circle, Package } from 'lucide-react';

const CalendarModal = ({ userRole, categories = [], onClose, onOpenMaterial }) => {
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchMaterials = async () => {
            try {
                // Fetch all materials to populate the calendar
                const response = await api.get('/materials/?limit=500'); 
                setMaterials(response.data);
                setLoading(false);
            } catch (err) {
                console.error("Failed to load materials for calendar", err);
                setLoading(false);
            }
        };
        fetchMaterials();
    }, []);

    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const changeMonth = (offset) => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
        setSelectedDate(null);
    };

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    const formatStr = (d, m, y) => {
        const dd = String(d).padStart(2, '0');
        const mm = String(m + 1).padStart(2, '0');
        return `${y}-${mm}-${dd}`; // Match standard ISO YYYY-MM-DD for easier matching with created_at
    };

    const getMaterialsForDay = (day) => {
        if (!day) return [];
        const dateStr = formatStr(day, month, year);
        return materials.filter(m => {
            if (!m.created_at || !String(m.created_at).startsWith(dateStr)) return false;
            
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const catName = categories.find(c => c.id === m.category_id)?.name?.toLowerCase() || '';
                const compName = (m.name || '').toLowerCase();
                const usedInStr = (m.used_in || '').toLowerCase();
                
                if (!catName.includes(query) && !compName.includes(query) && !usedInStr.includes(query)) {
                    return false;
                }
            }
            return true;
        });
    };

    const handleDayClick = (day) => {
        if (day) {
            setSelectedDate(day);
        }
    };

    const selectedMaterials = getMaterialsForDay(selectedDate);

    const modalContent = (
        <div className="glass-overlay" style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(4px)'
        }}>
            <div className="glass-modal animate-fade-in" style={{
                width: '750px', maxWidth: '90vw', height: '550px',
                display: 'flex', flexDirection: 'column',
                borderRadius: '16px', overflow: 'hidden', position: 'relative',
                backgroundColor: '#ffffff',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}>
                <div style={{
                    padding: '16px 24px', borderBottom: `1px solid var(--border-color)`,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <h2 style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-color)' }}>
                        <Calendar size={18} color="var(--primary-color)" /> Material Upload Calendar
                    </h2>
                    <button onClick={onClose} style={{
                        background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)'
                    }}>
                        <X size={20} />
                    </button>
                </div>

                <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                    {/* Left: Calendar View */}
                    <div style={{ flex: '1', padding: '24px', borderRight: `1px solid var(--border-color)`, display: 'flex', flexDirection: 'column' }}>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <button onClick={() => changeMonth(-1)} className="btn-icon"><ChevronLeft size={20} /></button>
                            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: 'var(--primary-color)' }}>
                                {currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                            </h3>
                            <button onClick={() => changeMonth(1)} className="btn-icon"><ChevronRight size={20} /></button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', textAlign: 'center', marginBottom: '8px', fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)' }}>
                            <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', flex: 1 }}>
                            {days.map((day, idx) => {
                                const dayMaterials = getMaterialsForDay(day);
                                const hasMaterials = dayMaterials.length > 0;
                                const isSelected = selectedDate === day;

                                return (
                                    <div
                                        key={idx}
                                        onClick={() => handleDayClick(day)}
                                        style={{
                                            padding: '8px 4px',
                                            borderRadius: '8px',
                                            cursor: day ? 'pointer' : 'default',
                                            backgroundColor: isSelected ? 'var(--primary-color)' : (day ? '#f8fafc' : 'transparent'),
                                            border: `1px solid ${isSelected ? 'var(--primary-color)' : (day ? 'var(--border-color)' : 'transparent')}`,
                                            color: isSelected ? '#fff' : (day ? 'var(--primary-color)' : 'transparent'),
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
                                            transition: 'all 0.2s',
                                            minHeight: '45px'
                                        }}
                                        onMouseOver={(e) => { if (day && !isSelected) { e.currentTarget.style.borderColor = 'var(--primary-color)'; } }}
                                        onMouseOut={(e) => { if (day && !isSelected) { e.currentTarget.style.borderColor = 'var(--border-color)'; } }}
                                    >
                                        <span style={{ fontSize: '13px', fontWeight: isSelected ? 'bold' : 'normal' }}>{day}</span>
                                        <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                                            {hasMaterials && <Circle size={6} fill="#10b981" color="#10b981" title="Materials uploaded on this day" />}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                        
                        <div style={{ display: 'flex', gap: '16px', marginTop: '16px', justifyContent: 'center', fontSize: '10px', color: 'var(--text-muted)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Circle size={8} fill="#10b981" color="#10b981" /> Materials Uploaded</div>
                        </div>

                    </div>

                    {/* Right: Material Details */}
                    <div style={{ width: '320px', padding: '24px', backgroundColor: 'var(--card-bg)', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ marginBottom: '16px' }}>
                            <input 
                                type="text" 
                                placeholder="Search by type, company, or project..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    width: '100%', padding: '8px 12px', borderRadius: '6px',
                                    border: '1px solid var(--border-color)', outline: 'none',
                                    fontSize: '13px'
                                }}
                            />
                        </div>
                        {!selectedDate ? (
                            <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '50px', fontSize: '12px' }}>
                                <Calendar size={32} style={{ marginBottom: '16px', opacity: 0.5, margin: '0 auto' }} />
                                <p>Select a date on the calendar to view uploaded materials.</p>
                            </div>
                        ) : loading ? (
                            <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '50px', fontSize: '12px' }}>Loading...</div>
                        ) : (selectedMaterials.length === 0) ? (
                            <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '50px', fontSize: '12px' }}>
                                No materials uploaded on this date.
                            </div>
                        ) : (
                            <div>
                                <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', borderBottom: `1px solid var(--border-color)`, paddingBottom: '8px', color: 'var(--primary-color)' }}>
                                    {currentDate.toLocaleString('default', { month: 'short' })} {selectedDate}, {year}
                                </h3>

                                <h4 style={{ fontSize: '11px', color: '#10b981', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Package size={12} /> Materials Uploaded ({selectedMaterials.length})
                                </h4>
                                
                                {selectedMaterials.map(m => {
                                    const handleMaterialClick = () => {
                                        onClose();
                                        onOpenMaterial(m);
                                    };
                                    return (
                                    <div key={m.id} onClick={handleMaterialClick} style={{ 
                                        padding: '12px', backgroundColor: '#ffffff', 
                                        border: `1px solid var(--border-color)`, borderRadius: '6px', marginBottom: '8px', cursor: 'pointer',
                                        transition: 'all 0.2s', boxShadow: 'var(--shadow-sm)'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'}
                                    onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}>
                                        <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--primary-color)', marginBottom: '4px' }}>{m.name}</div>
                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                                            <span>{categories.find(c => c.id === m.category_id)?.name || 'Unknown Type'}</span>
                                        </div>
                                    </div>
                                )})}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default CalendarModal;
