// src/Pages/AdminDashboard/DesignAssetManagementPage.js

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusCircle, Trash2, Upload, Box, Tag, Image as ImageIcon, UploadCloud, Download, Layers } from 'lucide-react';
import AuthService from '../../services/auth.service';
import { toast } from 'react-toastify';
import './AdminDashboard.css';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

// --- 1. MODAL COMPONENT (Giữ nguyên logic, chỉ làm gọn code nếu cần) ---
const AddAssetModal = ({ isOpen, onClose, onSave, assetType }) => {
    const [name, setName] = useState('');
    const [category, setCategory] = useState('General');
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState('');

    useEffect(() => {
        if (!isOpen) {
            setName(''); setCategory('General'); setImage(null); setPreview('');
        }
    }, [isOpen]);

    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImage(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name || !image) {
            toast.warn('Vui lòng nhập tên và chọn một file ảnh.');
            return;
        }
        onSave({ name, category, image, assetType });
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">Thêm {assetType} mới</h3>
                    <button onClick={onClose} className="modal-close-btn">×</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label className="form-label">Tên tài sản <span style={{color:'red'}}>*</span></label>
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="form-control" required placeholder="Ví dụ: Icon trái tim" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Danh mục</label>
                            <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} className="form-control" placeholder="Mặc định: General" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">File ảnh <span style={{color:'red'}}>*</span></label>
                            <div className="image-upload-preview single">
                                {preview && <img src={preview} alt="Preview" />}
                                <label className="btn btn-secondary" style={{cursor: 'pointer'}}>
                                    <Upload size={16} /> {preview ? 'Thay đổi ảnh' : 'Tải ảnh lên'}
                                    <input type="file" accept="image/*" hidden onChange={handleImageChange} required />
                                 </label>
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="btn btn-secondary">Hủy</button>
                        <button type="submit" className="btn btn-primary">Lưu tài sản</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- 2. BULK ADD MODAL (Giữ nguyên) ---
const BulkAddAssetModal = ({ isOpen, onClose, onSave, assetType }) => {
    const [files, setFiles] = useState([]);

    useEffect(() => { if (!isOpen) setFiles([]); }, [isOpen]);

    const handleFileChange = (e) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files).map(file => {
                const nameWithoutExtension = file.name.split('.').slice(0, -1).join('.');
                return {
                    id: `${file.name}-${file.lastModified}`,
                    file: file,
                    preview: URL.createObjectURL(file),
                    name: nameWithoutExtension,
                    category: 'General'
                };
            });
            setFiles(prev => [...prev, ...newFiles]);
        }
    };

    const handleUpdate = (id, field, value) => {
        setFiles(prev => prev.map(f => f.id === id ? { ...f, [field]: value } : f));
    };

    const handleRemove = (id) => {
        setFiles(prev => prev.filter(f => f.id !== id));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (files.length === 0) {
            toast.warn('Vui lòng chọn ít nhất một file.');
            return;
        }
        const metadata = files.map(({ name, category }) => ({ name, category, assetType }));
        onSave(files, metadata);
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content modal-content--large" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">Thêm hàng loạt {assetType}</h3>
                    <button onClick={onClose} className="modal-close-btn">×</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                        <div className="form-group" style={{textAlign: 'center', padding: '2rem', border: '2px dashed #ccc', borderRadius: '8px'}}>
                            <label className="btn btn-primary" style={{cursor: 'pointer'}}>
                                <Upload size={16} /> Chọn nhiều ảnh từ máy tính
                                <input type="file" accept="image/*" multiple hidden onChange={handleFileChange} />
                            </label>
                            <p style={{marginTop: '0.5rem', color: '#666'}}>Hỗ trợ JPG, PNG, SVG</p>
                        </div>
                        {files.length > 0 && (
                            <div className="table-container minimal-table" style={{ marginTop: '1rem' }}>
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Xem trước</th>
                                            <th>Tên tài sản <span style={{color:'red'}}>*</span></th>
                                            <th>Danh mục</th>
                                            <th>Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {files.map(f => (
                                            <tr key={f.id}>
                                                <td><img src={f.preview} alt="preview" className="table__image" style={{ width: '50px', height: '50px', objectFit: 'contain' }} /></td>
                                                <td><input type="text" value={f.name} onChange={(e) => handleUpdate(f.id, 'name', e.target.value)} className="form-control" required /></td>
                                                <td><input type="text" value={f.category} onChange={(e) => handleUpdate(f.id, 'category', e.target.value)} className="form-control" /></td>
                                                <td><button type="button" onClick={() => handleRemove(f.id)} className="delete-btn" title="Xóa"><Trash2 size={20} /></button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="btn btn-secondary">Hủy</button>
                        <button type="submit" className="btn btn-primary">Lưu tất cả ({files.length})</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- 3. ASSET SECTION (Đã tinh chỉnh cho Tabs) ---
const AssetSection = ({ title, assets, onAdd, onDelete, onBulkAdd, selectedAssets, onSelectionChange, onDownloadAll, disabled }) => {
    
    // Xử lý chọn tất cả chỉ trong phạm vi assets hiện tại
    const handleSelectAll = (e) => {
        const newSelected = { ...selectedAssets };
        if (e.target.checked) {
            assets.forEach(a => newSelected[a._id] = true);
        } else {
            assets.forEach(a => delete newSelected[a._id]);
        }
        onSelectionChange(newSelected);
    };

    // Kiểm tra xem tất cả asset hiện tại có được chọn chưa
    const isAllSelected = assets.length > 0 && assets.every(a => selectedAssets[a._id]);

    return (
        <div className="card settings-card tab-content-wrapper">
            {/* Header của Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <h3 className="card__title" style={{ margin: 0 }}>
                        Danh sách {title} ({assets.length})
                    </h3>
                    {assets.length > 0 && (
                        <label className="btn btn-secondary" style={{ padding: '0.3rem 0.8rem', fontSize: '0.9rem', background: '#fff', color: '#333', border: '1px solid #ccc' }}>
                            <input 
                                type="checkbox" 
                                checked={isAllSelected} 
                                onChange={handleSelectAll} 
                                style={{ marginRight: '0.5rem', cursor: 'pointer' }} 
                            />
                            {isAllSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                        </label>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={onDownloadAll} className="btn btn-green" disabled={disabled || assets.length === 0} title="Tải xuống tất cả tài sản trong tab này">
                        <Download size={18} /> Tải về
                    </button>
                    <button onClick={onBulkAdd} className="btn btn-secondary" disabled={disabled} title="Tải lên nhiều file cùng lúc">
                        <UploadCloud size={18} /> Tải hàng loạt
                    </button>
                    <button onClick={onAdd} className="btn btn-primary" disabled={disabled}>
                        <PlusCircle size={18} /> Thêm mới
                    </button>
                </div>
            </div>

            {/* Grid hiển thị tài sản */}
            <div className="template-grid">
                {assets.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: '#888', background: '#f8f9fa', borderRadius: '8px', border: '2px dashed #dee2e6' }}>
                        <ImageIcon size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                        <p>Chưa có tài sản nào trong mục này.</p>
                        <button onClick={onAdd} className="btn btn-primary" style={{marginTop: '0.5rem'}}>Thêm ngay</button>
                    </div>
                )}
                
                {assets.map(asset => (
                    <motion.div 
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        key={asset._id} 
                        className="template-card" 
                        style={{ 
                            border: selectedAssets[asset._id] ? '2px solid var(--admin-blue)' : '1px solid transparent',
                            boxShadow: selectedAssets[asset._id] ? '0 0 0 4px rgba(13, 110, 253, 0.1)' : '' 
                        }}
                    >
                        <div className="template-card__checkbox-area" style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 10 }}>
                            <input
                                type="checkbox"
                                checked={!!selectedAssets[asset._id]}
                                onChange={() => {
                                    const newSelected = { ...selectedAssets };
                                    if (newSelected[asset._id]) delete newSelected[asset._id];
                                    else newSelected[asset._id] = true;
                                    onSelectionChange(newSelected);
                                }}
                                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--admin-blue)' }}
                            />
                        </div>
                        
                        <div className="template-card__image-wrapper" style={{background: '#fff'}}>
                            <img src={asset.imgSrc} alt={asset.name} className="template-card__image" loading="lazy" />
                            <div className="template-card__overlay">
                                <button onClick={() => onDelete(asset._id)} className="template-card__action-btn" title="Xóa tài sản này">
                                    <Trash2 size={20} color="var(--admin-red)" />
                                </button>
                            </div>
                        </div>
                        <div className="template-card__info">
                            <h4 className="template-card__name" title={asset.name}>{asset.name}</h4>
                            <p className="template-card__category">{asset.category || 'Chưa phân loại'}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

// --- 4. MAIN PAGE COMPONENT ---
const DesignAssetManagementPage = () => {
    // State quản lý tab
    const [activeTab, setActiveTab] = useState('icon'); // 'icon' | 'component' | 'tag'
    
    // State dữ liệu
    const [assets, setAssets] = useState({ icons: [], components: [], tags: [] });
    const [isLoading, setIsLoading] = useState(true);
    
    // State Modal & Actions
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentAssetType, setCurrentAssetType] = useState('');
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [bulkAssetType, setBulkAssetType] = useState('');
    const [selectedAssets, setSelectedAssets] = useState({});
    const [isDownloading, setIsDownloading] = useState(false);

    const selectedCount = Object.keys(selectedAssets).length;

    // Fetch dữ liệu
    const fetchAssets = useCallback(async () => {
        setIsLoading(true);
        try {
            const [icons, components, tags] = await Promise.all([
                AuthService.getDesignAssets('icon'),
                AuthService.getDesignAssets('component'),
                AuthService.getDesignAssets('tag')
            ]);
            setAssets({ icons, components, tags });
        } catch (error) {
            console.error("Lỗi khi tải tài sản:", error);
            toast.error("Không thể tải danh sách tài sản.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAssets();
    }, [fetchAssets]);

    // Xử lý Modal
    const handleOpenModal = (assetType) => { setCurrentAssetType(assetType); setIsModalOpen(true); };
    const handleCloseModal = () => { setIsModalOpen(false); setCurrentAssetType(''); };
    const handleOpenBulkModal = (assetType) => { setBulkAssetType(assetType); setIsBulkModalOpen(true); };
    const handleCloseBulkModal = () => { setIsBulkModalOpen(false); setBulkAssetType(''); };

    // Xử lý API Actions
    const handleSaveAsset = async (assetData) => {
        try {
            await AuthService.addDesignAsset(assetData);
            toast.success('Thêm tài sản thành công!'); 
            handleCloseModal();
            fetchAssets();
        } catch (error) {
            console.error("Lỗi:", error);
            toast.error("Thêm thất bại");
        }
    };

    const handleSaveBulkAssets = async (files, metadata) => {
        try {
            await AuthService.bulkAddAssets(files, metadata);
            toast.success(`Đã thêm ${files.length} tài sản!`);
            handleCloseBulkModal();
            fetchAssets();
        } catch (error) {
            toast.error(`Lỗi: ${error.response?.data?.message || error.message}`);
        }
    };

    const handleDeleteAsset = async (assetId) => {
        if (window.confirm('Bạn chắc chắn muốn xóa?')) {
            try {
                await AuthService.deleteDesignAsset(assetId);
                toast.success("Đã xóa tài sản");
                fetchAssets();
            } catch (error) {
                toast.error("Xóa thất bại");
            }
        }
    };

    const handleBulkDelete = async () => {
        if (selectedCount === 0) return;
        if (window.confirm(`Xóa vĩnh viễn ${selectedCount} tài sản đã chọn?`)) {
            try {
                await AuthService.bulkDeleteAssets(Object.keys(selectedAssets));
                toast.success("Xóa hàng loạt thành công");
                fetchAssets();
                setSelectedAssets({});
            } catch (error) {
                toast.error("Lỗi khi xóa hàng loạt");
            }
        }
    };

    const handleDownloadAll = async (assetType, assetsToDownload) => {
        if (!assetsToDownload || assetsToDownload.length === 0) {
            toast.warn('Chưa có dữ liệu để tải.');
            return;
        }
        setIsDownloading(true);
        toast.info(`Đang nén ${assetsToDownload.length} file...`);
        try {
            const zip = new JSZip();
            const folder = zip.folder(assetType);
            const downloadPromises = assetsToDownload.map(async (asset) => {
                try {
                    const response = await fetch(asset.imgSrc); 
                    if (!response.ok) return;
                    const blob = await response.blob();
                    let extension = 'png';
                    const urlParts = asset.imgSrc.split('?')[0].split('.');
                    if (urlParts.length > 1) {
                        const ext = urlParts.pop().toLowerCase();
                        if (['png', 'jpg', 'jpeg', 'svg', 'gif'].includes(ext)) extension = ext;
                    }
                    const safeName = asset.name.replace(/[^a-z0-9_-\s]/gi, '').trim() || `file_${asset._id}`;
                    folder.file(`${safeName}.${extension}`, blob);
                } catch (err) { console.error(err); }
            });
            await Promise.all(downloadPromises);
            const zipBlob = await zip.generateAsync({ type: "blob" });
            saveAs(zipBlob, `icards_${assetType}_assets.zip`);
            toast.success("Tải xuống thành công!");
        } catch (error) {
            toast.error("Lỗi khi nén file.");
        } finally {
            setIsDownloading(false);
        }
    };

    // Configuration cho Tabs để render động
    const tabsConfig = useMemo(() => ({
        icon: {
            id: 'icon',
            title: 'Icon',
            data: assets.icons,
            icon: <ImageIcon size={20} />,
            color: '#0d6efd'
        },
        component: {
            id: 'component',
            title: 'Thành phần',
            data: assets.components,
            icon: <Box size={20} />,
            color: '#6f42c1'
        },
        tag: {
            id: 'tag',
            title: 'Tag & Khung',
            data: assets.tags,
            icon: <Tag size={20} />,
            color: '#198754'
        }
    }), [assets]);

    // Lấy config hiện tại dựa trên activeTab
    const currentTab = tabsConfig[activeTab];

    if (isLoading) return <div className="loading-spinner"><div className="loading-spinner__icon"></div></div>;

    return (
        <div>
            <div className="admin-header">
                <h1 className="admin-header__title">Quản lý Tài sản Thiết kế</h1>
                <p style={{margin: '0.5rem 0 0 0', color: '#6c757d'}}>Quản lý kho tài nguyên hình ảnh cho trình thiết kế thiệp</p>
            </div>
            
            <div className="settings-container" style={{ marginTop: '1rem' }}>
                {/* --- UI TAB NAVIGATION MỚI --- */}
                <div className="asset-tabs-container">
                    {Object.values(tabsConfig).map((tab) => (
                        <button 
                            key={tab.id}
                            className={`asset-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.icon}
                            {tab.title}
                            <span className="asset-count-badge">{tab.data.length}</span>
                        </button>
                    ))}
                </div>

                {/* --- RENDER CONTENT DỰA TRÊN TAB --- */}
                <AssetSection
                    key={currentTab.id} // Key giúp React reset state khi đổi tab
                    title={currentTab.title}
                    assets={currentTab.data}
                    onAdd={() => handleOpenModal(currentTab.id)}
                    onDelete={handleDeleteAsset}
                    onBulkAdd={() => handleOpenBulkModal(currentTab.id)}
                    selectedAssets={selectedAssets}
                    onSelectionChange={setSelectedAssets}
                    onDownloadAll={() => handleDownloadAll(currentTab.id + 's', currentTab.data)}
                    disabled={isDownloading}
                />
            </div>

            {/* Modals */}
            <AddAssetModal isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSaveAsset} assetType={currentAssetType} />
            <BulkAddAssetModal isOpen={isBulkModalOpen} onClose={handleCloseBulkModal} onSave={handleSaveBulkAssets} assetType={bulkAssetType} />
       
            {/* Floating Bulk Action Bar */}
            <AnimatePresence>
                {selectedCount > 0 && (
                    <motion.div
                        className="bulk-action-bar"
                        initial={{ y: "150%", opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: "150%", opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 40 }}
                    >
                        <span style={{fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                            <Layers size={20} /> Đã chọn: {selectedCount} mục
                        </span>
                        <div style={{height: '20px', width: '1px', background: 'rgba(255,255,255,0.3)'}}></div>
                        <button onClick={() => setSelectedAssets({})} className="btn btn-secondary" style={{borderRadius: '30px', padding: '0.4rem 1rem'}}>
                            Bỏ chọn
                        </button>
                        <button onClick={handleBulkDelete} className="btn btn-danger" disabled={isDownloading}>
                            <Trash2 size={18} /> Xóa đã chọn
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DesignAssetManagementPage;