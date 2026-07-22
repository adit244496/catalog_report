import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Trash2, Users, Layers, CheckCircle, X } from 'lucide-react';
import api from '../api';
import ImageCropper from '../components/ImageCropper';
import './AdminDashboard.css';

const AdminDashboard = ({ onLogout, userRole }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('materials');

  const [categories, setCategories] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);

  // Material Form State
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [usedIn, setUsedIn] = useState([]);
  const [origin, setOrigin] = useState('');
  const [companyUrl, setCompanyUrl] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [croppedFiles, setCroppedFiles] = useState([]);

  const [editingMaterialId, setEditingMaterialId] = useState(null);
  const [restrictedEditMode, setRestrictedEditMode] = useState(false);
  const [materialEntryMode, setMaterialEntryMode] = useState('single');
  const [excelFile, setExcelFile] = useState(null);
  const [importStatus, setImportStatus] = useState(null);

  // Cropper State
  const [showCropper, setShowCropper] = useState(false);
  const [pendingImageQueue, setPendingImageQueue] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  // Dynamic parameters
  const [param1Value, setParam1Value] = useState('');
  const [param2Value, setParam2Value] = useState('');
  const [param3Value, setParam3Value] = useState('');
  const [param4Value, setParam4Value] = useState('');
  const [param5Value, setParam5Value] = useState('');

  // User Form State
  const [newUsername, setNewUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('viewer');
  const [editingUserId, setEditingUserId] = useState(null);
  const [userEntryMode, setUserEntryMode] = useState('single');
  const [userExcelFile, setUserExcelFile] = useState(null);
  const [userImportStatus, setUserImportStatus] = useState(null);

  // Category Form State
  const [newCatName, setNewCatName] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');
  const [newCatP1, setNewCatP1] = useState('');
  const [newCatP2, setNewCatP2] = useState('');
  const [newCatP3, setNewCatP3] = useState('');
  const [newCatP4, setNewCatP4] = useState('');
  const [newCatP5, setNewCatP5] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState(null);

  // Project Form State
  const [newProjectName, setNewProjectName] = useState('');
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [projectEntryMode, setProjectEntryMode] = useState('single');
  const [projectExcelFile, setProjectExcelFile] = useState(null);
  const [projectImportStatus, setProjectImportStatus] = useState(null);

  const [status, setStatus] = useState('');

  useEffect(() => {
    fetchData();
    if (userRole === 'super_admin') {
      fetchUsers();
    }
  }, [userRole]);

  useEffect(() => {
    if (materials.length > 0 && location.state?.editMaterialId) {
      const mat = materials.find(m => m.id === location.state.editMaterialId);
      if (mat) {
        setActiveTab('materials');
        handleEditMaterial(mat);
        if (location.state.restrictedMode) {
          setRestrictedEditMode(true);
        }
      }
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [materials, location.state, navigate, location.pathname]);

  const fetchData = async () => {
    try {
      const catRes = await api.get('/categories/');
      setCategories(catRes.data);
      const matRes = await api.get('/materials/');
      setMaterials(matRes.data);
      const projRes = await api.get('/projects/');
      setProjects(projRes.data);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) onLogout();
    }
  };

  const fetchUsers = async () => {
    try {
      const userRes = await api.get('/auth/users');
      setUsers(userRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleImageSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      const newQueue = [];
      let filesProcessed = 0;

      selectedFiles.forEach((f) => {
        const reader = new FileReader();
        reader.addEventListener('load', () => {
          newQueue.push(reader.result);
          filesProcessed++;
          if (filesProcessed === selectedFiles.length) {
            setPendingImageQueue(newQueue);
            setShowCropper(true);
          }
        });
        reader.readAsDataURL(f);
      });
    }
    // Reset input so selecting the same file again works
    e.target.value = '';
  };

  const handleCropComplete = (croppedBlob) => {
    const croppedFile = new File([croppedBlob], `cropped_image_${Date.now()}.jpg`, { type: "image/jpeg" });
    setCroppedFiles(prev => [...prev, croppedFile]);

    const previewUrl = URL.createObjectURL(croppedBlob);
    setImagePreviews(prev => [...prev, previewUrl]);

    const remainingQueue = pendingImageQueue.slice(1);
    if (remainingQueue.length > 0) {
      setPendingImageQueue(remainingQueue);
    } else {
      setShowCropper(false);
      setPendingImageQueue([]);
    }
  };

  const handleEditMaterial = (mat) => {
    setEditingMaterialId(mat.id);
    setName(mat.name || '');
    setCategoryId(mat.category_id || '');
    setUsedIn(mat.used_in ? mat.used_in.split(',').map(s => s.trim()) : []);
    setOrigin(mat.origin || '');
    setCompanyUrl(mat.company_url || '');
    setDescription(mat.description || '');
    setTags(mat.tags ? mat.tags.map(t => t.tag_name).join(', ') : '');
    setParam1Value(mat.param1_value || '');
    setParam2Value(mat.param2_value || '');
    setParam3Value(mat.param3_value || '');
    setParam4Value(mat.param4_value || '');
    setParam5Value(mat.param5_value || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingMaterialId(null);
    setRestrictedEditMode(false);
    setName(''); setCategoryId(''); setUsedIn([]); setOrigin(''); setCompanyUrl('');
    setDescription(''); setTags('');
    setParam1Value(''); setParam2Value(''); setParam3Value(''); setParam4Value(''); setParam5Value('');
    setCroppedFiles([]); setImagePreviews([]);
  };

  const handleMaterialSubmit = async (e) => {
    e.preventDefault();

    if (!editingMaterialId && croppedFiles.length === 0) {
      setStatus('Error: At least one Main Image File is mandatory. Please upload and align an image.');
      return;
    }

    setStatus(editingMaterialId ? 'Updating...' : 'Uploading...');

    const formData = new FormData();
    formData.append('name', name);
    formData.append('category_id', categoryId);
    formData.append('used_in', usedIn ? usedIn.join(',') : '');
    if (origin) formData.append('origin', origin);
    if (companyUrl) formData.append('company_url', companyUrl);
    if (description) formData.append('description', description);

    if (param1Value) formData.append('param1_value', param1Value);
    if (param2Value) formData.append('param2_value', param2Value);
    if (param3Value) formData.append('param3_value', param3Value);
    if (param4Value) formData.append('param4_value', param4Value);
    if (param5Value) formData.append('param5_value', param5Value);

    if (tags) formData.append('tags', tags);
    croppedFiles.forEach(f => formData.append('files', f));

    try {
      if (editingMaterialId) {
        await api.put(`/materials/${editingMaterialId}`, formData);
        setStatus('Successfully updated material!');
      } else {
        await api.post('/materials/', formData);
        setStatus('Successfully uploaded material!');
      }
      handleCancelEdit();
      fetchData();
    } catch (err) {
      console.error(err);
      setStatus('Error uploading material: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleExcelImport = async (e) => {
    e.preventDefault();
    if (!excelFile) return;
    setStatus('Importing materials...');
    setImportStatus(null);
    const formData = new FormData();
    formData.append('file', excelFile);
    try {
      const res = await api.post('/materials/import', formData);
      setStatus(`Import complete. Successfully imported: ${res.data.success_count}`);
      setImportStatus(res.data.errors);
      setExcelFile(null);
      fetchData();
    } catch (err) {
      setStatus('Error importing: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await api.get('/materials/import/template', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'brand_import_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setStatus('Failed to download brand template');
    }
  };

  const handleEditUser = (user) => {
    setEditingUserId(user.id);
    setNewUsername(user.username);
    setNewUserPassword('');
    setNewUserRole(user.role);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEditUser = () => {
    setEditingUserId(null);
    setNewUsername('');
    setNewUserPassword('');
    setNewUserRole('viewer');
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await api.delete(`/auth/users/${id}`);
      fetchUsers();
    } catch (err) {
      console.error("Failed to delete user", err);
    }
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setStatus(editingUserId ? 'Updating user...' : 'Creating user...');
    try {
      if (editingUserId) {
        await api.put(`/auth/users/${editingUserId}`, { username: newUsername, password: newUserPassword, role: newUserRole });
        setStatus('User updated successfully!');
      } else {
        await api.post('/auth/register', { username: newUsername, password: newUserPassword, role: newUserRole });
        setStatus('User created successfully!');
      }
      handleCancelEditUser();
      fetchUsers();
    } catch (err) {
      setStatus(err.response?.data?.detail || 'Error processing user.');
    }
  };

  const handleUserExcelImport = async (e) => {
    e.preventDefault();
    if (!userExcelFile) return;
    setStatus('Importing users...');
    setUserImportStatus(null);
    const formData = new FormData();
    formData.append('file', userExcelFile);
    try {
      const res = await api.post('/auth/users/import', formData);
      setStatus(`Import complete. Successfully imported: ${res.data.success_count}`);
      setUserImportStatus(res.data.errors);
      setUserExcelFile(null);
      fetchUsers();
    } catch (err) {
      setStatus('Error importing users: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleDownloadUserTemplate = async () => {
    try {
      const res = await api.get('/auth/users/import/template', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'user_import_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setStatus('Failed to download user template');
    }
  };

  const handleEditCategory = (cat) => {
    setEditingCategoryId(cat.id);
    setNewCatName(cat.name || '');
    setNewCatSlug(cat.slug || '');
    setNewCatP1(cat.param1_name || '');
    setNewCatP2(cat.param2_name || '');
    setNewCatP3(cat.param3_name || '');
    setNewCatP4(cat.param4_name || '');
    setNewCatP5(cat.param5_name || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEditCategory = () => {
    setEditingCategoryId(null);
    setNewCatName(''); setNewCatSlug('');
    setNewCatP1(''); setNewCatP2(''); setNewCatP3(''); setNewCatP4(''); setNewCatP5('');
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    setStatus(editingCategoryId ? 'Updating category...' : 'Creating category...');
    try {
      const payload = {
        name: newCatName,
        slug: newCatSlug,
        param1_name: newCatP1,
        param2_name: newCatP2,
        param3_name: newCatP3,
        param4_name: newCatP4,
        param5_name: newCatP5
      };

      if (editingCategoryId) {
        await api.put(`/categories/${editingCategoryId}`, payload);
        setStatus('Category updated successfully!');
      } else {
        await api.post('/categories/', payload);
        setStatus('Category created successfully!');
      }
      handleCancelEditCategory();
      fetchData();
    } catch (err) {
      setStatus('Error processing category.');
    }
  };

  const handleEditProject = (proj) => {
    setEditingProjectId(proj.id);
    setNewProjectName(proj.name || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEditProject = () => {
    setEditingProjectId(null);
    setNewProjectName('');
  };

  const handleProjectSubmit = async (e) => {
    e.preventDefault();
    setStatus(editingProjectId ? 'Updating project...' : 'Creating project...');
    try {
      const payload = { name: newProjectName };
      if (editingProjectId) {
        await api.put(`/projects/${editingProjectId}`, payload);
        setStatus('Project updated successfully!');
      } else {
        await api.post('/projects/', payload);
        setStatus('Project created successfully!');
      }
      handleCancelEditProject();
      fetchData();
    } catch (err) {
      setStatus(err.response?.data?.detail || 'Error processing project.');
    }
  };

  const handleProjectExcelImport = async (e) => {
    e.preventDefault();
    if (!projectExcelFile) return;
    setStatus('Importing projects...');
    setProjectImportStatus(null);
    const formData = new FormData();
    formData.append('file', projectExcelFile);
    try {
      const res = await api.post('/projects/import', formData);
      setStatus(`Import complete. Successfully imported: ${res.data.success_count}`);
      setProjectImportStatus(res.data.errors);
      setProjectExcelFile(null);
      fetchData();
    } catch (err) {
      setStatus('Error importing projects: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleDownloadProjectTemplate = async () => {
    try {
      const res = await api.get('/projects/import/template', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'project_import_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setStatus('Failed to download project template');
    }
  };

  const handleDeleteProject = async (id) => {
    if (!window.confirm("Are you sure you want to delete this project?")) return;
    try {
      await api.delete(`/projects/${id}`);
      fetchData();
    } catch (err) {
      console.error("Failed to delete project", err);
    }
  };

  const handleDeleteMaterial = async (id) => {
    if (!window.confirm("Are you sure you want to delete this material?")) return;
    try {
      await api.delete(`/materials/${id}`);
      fetchData();
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };

  const selectedCat = categories.find(c => c.id.toString() === categoryId.toString());

  return (
    <div className="admin-container animate-fade-in">
      <div className="admin-header" onDragStart={(e) => e.preventDefault()}>
        <button className="btn btn-outline" onClick={() => navigate('/')}>
          <ArrowLeft size={18} /> Back to Catalogue
        </button>
        <h2>{userRole === 'super_admin' ? 'Super Admin Dashboard' : 'Admin Dashboard'}</h2>
      </div>

      {showCropper && pendingImageQueue.length > 0 && (
        <ImageCropper
          imageSrc={pendingImageQueue[0]}
          onCropComplete={handleCropComplete}
          onCancel={() => {
            setShowCropper(false);
            setPendingImageQueue([]);
          }}
        />
      )}

      {(userRole === 'super_admin' || userRole === 'admin') && (
        <div className="tab-switcher">
          <button className={`tab-btn ${activeTab === 'materials' ? 'active' : ''}`} onClick={() => setActiveTab('materials')}>Brand</button>
          <button className={`tab-btn ${activeTab === 'categories' ? 'active' : ''}`} onClick={() => setActiveTab('categories')}><Layers size={16} /> Category</button>
          {userRole === 'super_admin' && (
            <>
              <button className={`tab-btn ${activeTab === 'projects' ? 'active' : ''}`} onClick={() => setActiveTab('projects')}><Layers size={16} /> Project</button>
              <button className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}><Users size={16} /> User</button>
            </>
          )}
        </div>
      )}

      {status && <div className="status-message">{status}</div>}

      {activeTab === 'materials' && (
        <div className="admin-grid">
          {/* Upload Form */}
          <div className="admin-panel glass">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>{editingMaterialId ? 'Edit Brand' : 'Add Brand'}</h3>
              {!editingMaterialId && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className={`btn ${materialEntryMode === 'single' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setMaterialEntryMode('single')} style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}>Add Single</button>
                  <button className={`btn ${materialEntryMode === 'bulk' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setMaterialEntryMode('bulk')} style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}>Import from Excel</button>
                </div>
              )}
            </div>

            {materialEntryMode === 'single' || editingMaterialId ? (
              <form onSubmit={handleMaterialSubmit} className="upload-form">
                <div className="form-grid">
                  <div className="form-group"><label className="form-label">Name *</label><input className="form-control" value={name} onChange={e => setName(e.target.value)} required disabled={restrictedEditMode} /></div>
                  <div className="form-group"><label className="form-label">Category *</label>
                    <select className="form-control" value={categoryId} onChange={e => setCategoryId(e.target.value)} required disabled={restrictedEditMode}>
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  <div className="form-group full-width"><label className="form-label">Used In (Projects)</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      {usedIn.map(projName => (
                        <span key={projName} style={{ background: 'var(--primary-color)', color: '#fff', padding: '0.2rem 0.6rem', borderRadius: '50px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          {projName}
                          <button type="button" onClick={() => setUsedIn(usedIn.filter(p => p !== projName))} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: 0, display: 'flex' }}><X size={12} /></button>
                        </span>
                      ))}
                    </div>
                    <select
                      className="form-control"
                      value=""
                      onChange={e => {
                        if (e.target.value && !usedIn.includes(e.target.value)) {
                          setUsedIn([...usedIn, e.target.value]);
                        }
                      }}
                    >
                      <option value="">Select a project to add...</option>
                      {projects.filter(p => !usedIn.includes(p.name)).map(p => (
                        <option key={p.id} value={p.name}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group"><label className="form-label">Origin</label><input className="form-control" value={origin} onChange={e => setOrigin(e.target.value)} disabled={restrictedEditMode} /></div>
                  <div className="form-group"><label className="form-label">Tags (comma separated)</label><input className="form-control" value={tags} onChange={e => setTags(e.target.value)} disabled={restrictedEditMode} /></div>

                  {/* Dynamic Parameters based on Category */}
                  {selectedCat && selectedCat.param1_name && (
                    <div className="form-group"><label className="form-label">{selectedCat.param1_name}</label><input className="form-control" value={param1Value} onChange={e => setParam1Value(e.target.value)} disabled={restrictedEditMode} /></div>
                  )}
                  {selectedCat && selectedCat.param2_name && (
                    <div className="form-group"><label className="form-label">{selectedCat.param2_name}</label><input className="form-control" value={param2Value} onChange={e => setParam2Value(e.target.value)} disabled={restrictedEditMode} /></div>
                  )}
                  {selectedCat && selectedCat.param3_name && (
                    <div className="form-group"><label className="form-label">{selectedCat.param3_name}</label><input className="form-control" value={param3Value} onChange={e => setParam3Value(e.target.value)} disabled={restrictedEditMode} /></div>
                  )}
                  {selectedCat && selectedCat.param4_name && (
                    <div className="form-group"><label className="form-label">{selectedCat.param4_name}</label><input className="form-control" value={param4Value} onChange={e => setParam4Value(e.target.value)} disabled={restrictedEditMode} /></div>
                  )}
                  {selectedCat && selectedCat.param5_name && (
                    <div className="form-group"><label className="form-label">{selectedCat.param5_name}</label><input className="form-control" value={param5Value} onChange={e => setParam5Value(e.target.value)} disabled={restrictedEditMode} /></div>
                  )}

                  <div className="form-group full-width"><label className="form-label">Company URL</label><input className="form-control" type="url" value={companyUrl} onChange={e => setCompanyUrl(e.target.value)} placeholder="e.g. https://www.company.com" disabled={restrictedEditMode} /></div>
                  <div className="form-group full-width"><label className="form-label">Description / Scope Description</label><textarea className="form-control" value={description} onChange={e => setDescription(e.target.value)} rows={2} disabled={restrictedEditMode} /></div>
                  <div className="form-group full-width">
                    <label className="form-label">{editingMaterialId ? 'Update Main Image File(s) (Optional)' : 'Main Image File(s) *'}</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <input type="file" multiple className="form-control" accept="image/*" onChange={handleImageSelect} disabled={restrictedEditMode} />
                      {imagePreviews.length > 0 && (
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', paddingBottom: '10px' }}>
                          {imagePreviews.map((src, i) => (
                            <div key={i} style={{ position: 'relative' }}>
                              <img src={src} alt={`Preview ${i}`} style={{ width: '60px', height: '35px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #e4e4e7' }} />
                              <div style={{ position: 'absolute', bottom: '-15px', left: 0, color: '#28a745', fontSize: '0.65rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                <CheckCircle size={10} /> Aligned
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{editingMaterialId ? 'UPDATE BRAND' : 'UPLOAD BRAND'}</button>
                  {editingMaterialId && (
                    <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={handleCancelEdit}>CANCEL EDIT</button>
                  )}
                </div>
              </form>
            ) : (
              <form onSubmit={handleExcelImport} className="upload-form">
                <div className="form-group full-width">
                  <label className="form-label">Upload Excel File (.xlsx)</label>
                  <input type="file" className="form-control" accept=".xlsx" onChange={e => setExcelFile(e.target.files[0])} required />
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    Images must be added manually by editing the material after import.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={handleDownloadTemplate}>DOWNLOAD TEMPLATE</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={!excelFile}>UPLOAD EXCEL</button>
                </div>

                {importStatus && importStatus.length > 0 && (
                  <div style={{ marginTop: '1rem', padding: '1rem', background: '#fee2e2', borderRadius: '6px', fontSize: '0.85rem' }}>
                    <strong style={{ color: '#b91c1c' }}>Errors ({importStatus.length}):</strong>
                    <ul style={{ color: '#b91c1c', marginTop: '0.5rem', paddingLeft: '1.2rem', maxHeight: '150px', overflowY: 'auto' }}>
                      {importStatus.map((err, i) => <li key={i}>{err}</li>)}
                    </ul>
                  </div>
                )}
              </form>
            )}
          </div>

          <div className="admin-panel glass">
            <h3>Manage Materials</h3>
            <div className="manage-list">
              {materials.map(mat => (
                <div key={mat.id} className="manage-item">
                  <div className="manage-info"><strong>{mat.name}</strong><span className="manage-cat">{categories.find(c => c.id === mat.category_id)?.name}</span></div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn-icon" style={{ color: 'var(--primary-color)' }} onClick={() => handleEditMaterial(mat)}>Edit</button>
                    {userRole === 'super_admin' && (
                      <button className="btn-icon text-danger" onClick={() => handleDeleteMaterial(mat.id)}><Trash2 size={18} /></button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && userRole === 'super_admin' && (
        <div className="admin-grid">
          <div className="admin-panel glass">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>{editingUserId ? 'Edit User' : 'Create New User'}</h3>
              {!editingUserId && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className={`btn ${userEntryMode === 'single' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setUserEntryMode('single')} style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}>Add Single</button>
                  <button className={`btn ${userEntryMode === 'bulk' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setUserEntryMode('bulk')} style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}>Import from Excel</button>
                </div>
              )}
            </div>

            {userEntryMode === 'single' || editingUserId ? (
              <form onSubmit={handleUserSubmit}>
                <div className="form-group"><label className="form-label">Username *</label><input type="text" className="form-control" value={newUsername} onChange={e => setNewUsername(e.target.value)} placeholder="Enter a unique username" required /></div>
                {editingUserId && (
                  <div className="form-group">
                    <label className="form-label">Reset Password</label>
                    <input type="password" className="form-control" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} placeholder="Leave blank to keep current password" autoComplete="new-password" />
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                      Enter a new password to reset it for this user. Leave blank to keep the existing one.
                    </p>
                  </div>
                )}
                <div className="form-group"><label className="form-label">Role *</label>
                  <select className="form-control" value={newUserRole} onChange={e => setNewUserRole(e.target.value)}>
                    <option value="admin">Admin</option>
                    <option value="viewer">Viewer</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
                {!editingUserId && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    New users are created with the default password <strong>Kolkata@123</strong> and prompted to reset it on first login.
                  </p>
                )}
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{editingUserId ? 'UPDATE USER' : 'CREATE USER'}</button>
                  {editingUserId && (
                    <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={handleCancelEditUser}>CANCEL EDIT</button>
                  )}
                </div>
              </form>
            ) : (
              <form onSubmit={handleUserExcelImport} className="upload-form">
                <div className="form-group full-width">
                  <label className="form-label">Upload User Excel File (.xlsx)</label>
                  <input type="file" className="form-control" accept=".xlsx" onChange={e => setUserExcelFile(e.target.files[0])} required />
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    Users will be created with the default password <strong>Kolkata@123</strong> and prompted to reset it.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={handleDownloadUserTemplate}>DOWNLOAD TEMPLATE</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={!userExcelFile}>UPLOAD EXCEL</button>
                </div>

                {userImportStatus && userImportStatus.length > 0 && (
                  <div style={{ marginTop: '1rem', padding: '1rem', background: '#fee2e2', borderRadius: '6px', fontSize: '0.85rem' }}>
                    <strong style={{ color: '#b91c1c' }}>Errors ({userImportStatus.length}):</strong>
                    <ul style={{ color: '#b91c1c', marginTop: '0.5rem', paddingLeft: '1.2rem', maxHeight: '150px', overflowY: 'auto' }}>
                      {userImportStatus.map((err, i) => <li key={i}>{err}</li>)}
                    </ul>
                  </div>
                )}
              </form>
            )}
          </div>

          <div className="admin-panel glass">
            <h3>All Users</h3>
            <div className="manage-list">
              {users.map(u => (
                <div key={u.id} className="manage-item">
                  <div className="manage-info"><strong>{u.username}</strong><span className="manage-cat">Role: {u.role.toUpperCase()}</span></div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn-icon" style={{ color: 'var(--primary-color)' }} onClick={() => handleEditUser(u)}>Edit</button>
                    <button className="btn-icon text-danger" onClick={() => handleDeleteUser(u.id)}><Trash2 size={18} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'categories' && (userRole === 'super_admin' || userRole === 'admin') && (
        <div className="admin-grid">
          <div className="admin-panel glass">
            <h3>{editingCategoryId ? 'Edit Category' : 'Create New Category'}</h3>
            <form onSubmit={handleCategorySubmit}>
              <div className="form-grid">
                <div className="form-group"><label className="form-label">Display Name *</label><input className="form-control" value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="e.g. Stone & Marble" required /></div>
                <div className="form-group"><label className="form-label">Slug (URL friendly) *</label><input className="form-control" value={newCatSlug} onChange={e => setNewCatSlug(e.target.value)} placeholder="e.g. stone-marble" required /></div>

                <div className="full-width" style={{ marginTop: '0.5rem' }}>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Dynamic Parameters (Optional)</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Define up to 5 custom architectural parameters that users can fill out when uploading materials in this category.</p>
                </div>

                <div className="form-group"><label className="form-label">Parameter 1 Name</label><input className="form-control" value={newCatP1} onChange={e => setNewCatP1(e.target.value)} placeholder="e.g. Material" /></div>
                <div className="form-group"><label className="form-label">Parameter 2 Name</label><input className="form-control" value={newCatP2} onChange={e => setNewCatP2(e.target.value)} placeholder="e.g. Thickness Slabs" /></div>
                <div className="form-group"><label className="form-label">Parameter 3 Name</label><input className="form-control" value={newCatP3} onChange={e => setNewCatP3(e.target.value)} placeholder="e.g. Surface Finishes" /></div>
                <div className="form-group"><label className="form-label">Parameter 4 Name</label><input className="form-control" value={newCatP4} onChange={e => setNewCatP4(e.target.value)} placeholder="e.g. Water Absorption" /></div>
                <div className="form-group"><label className="form-label">Parameter 5 Name</label><input className="form-control" value={newCatP5} onChange={e => setNewCatP5(e.target.value)} placeholder="e.g. Best For" /></div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{editingCategoryId ? 'UPDATE CATEGORY' : 'CREATE CATEGORY'}</button>
                {editingCategoryId && (
                  <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={handleCancelEditCategory}>CANCEL EDIT</button>
                )}
              </div>
            </form>
          </div>

          <div className="admin-panel glass">
            <h3>All Categories</h3>
            <div className="manage-list">
              {categories.map(c => (
                <div key={c.id} className="manage-item">
                  <div className="manage-info">
                    <strong>{c.name}</strong>
                    <span className="manage-cat">Slug: {c.slug}</span>
                    {(c.param1_name || c.param2_name || c.param3_name || c.param4_name || c.param5_name) && (
                      <span className="manage-cat" style={{ marginTop: '0.5rem' }}>
                        Parameters: {[c.param1_name, c.param2_name, c.param3_name, c.param4_name, c.param5_name].filter(Boolean).join(', ')}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn-icon" style={{ color: 'var(--primary-color)' }} onClick={() => handleEditCategory(c)}>Edit</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'projects' && userRole === 'super_admin' && (
        <div className="admin-grid">
          <div className="admin-panel glass">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>{editingProjectId ? 'Edit Project' : 'Create New Project'}</h3>
              {!editingProjectId && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className={`btn ${projectEntryMode === 'single' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setProjectEntryMode('single')} style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}>Add Single</button>
                  <button className={`btn ${projectEntryMode === 'bulk' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setProjectEntryMode('bulk')} style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}>Import from Excel</button>
                </div>
              )}
            </div>

            {projectEntryMode === 'single' || editingProjectId ? (
              <form onSubmit={handleProjectSubmit}>
                <div className="form-group"><label className="form-label">Project Name *</label><input type="text" className="form-control" value={newProjectName} onChange={e => setNewProjectName(e.target.value)} placeholder="e.g. City Centre Mall" required /></div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{editingProjectId ? 'UPDATE PROJECT' : 'CREATE PROJECT'}</button>
                  {editingProjectId && (
                    <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={handleCancelEditProject}>CANCEL EDIT</button>
                  )}
                </div>
              </form>
            ) : (
              <form onSubmit={handleProjectExcelImport} className="upload-form">
                <div className="form-group full-width">
                  <label className="form-label">Upload Project Excel File (.xlsx)</label>
                  <input type="file" className="form-control" accept=".xlsx" onChange={e => setProjectExcelFile(e.target.files[0])} required />
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    Upload a list of project names to quickly populate the database.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={handleDownloadProjectTemplate}>DOWNLOAD TEMPLATE</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={!projectExcelFile}>UPLOAD EXCEL</button>
                </div>

                {projectImportStatus && projectImportStatus.length > 0 && (
                  <div style={{ marginTop: '1rem', padding: '1rem', background: '#fee2e2', borderRadius: '6px', fontSize: '0.85rem' }}>
                    <strong style={{ color: '#b91c1c' }}>Errors ({projectImportStatus.length}):</strong>
                    <ul style={{ color: '#b91c1c', marginTop: '0.5rem', paddingLeft: '1.2rem', maxHeight: '150px', overflowY: 'auto' }}>
                      {projectImportStatus.map((err, i) => <li key={i}>{err}</li>)}
                    </ul>
                  </div>
                )}
              </form>
            )}
          </div>

          <div className="admin-panel glass">
            <h3>All Projects</h3>
            <div className="manage-list">
              {projects.map(p => (
                <div key={p.id} className="manage-item">
                  <div className="manage-info"><strong>{p.name}</strong></div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn-icon" style={{ color: 'var(--primary-color)' }} onClick={() => handleEditProject(p)}>Edit</button>
                    <button className="btn-icon text-danger" onClick={() => handleDeleteProject(p.id)}><Trash2 size={18} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
