// AdminTrainData/AdminFE/Pages/AdminDashboard/DesignAssetManagementPage.js

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// THÊM MỚI: Thêm icon Download
import { PlusCircle, Trash2, Upload, Box, Tag, Image as ImageIcon, UploadCloud, Download } from 'lucide-react';
import AuthService from '../../services/auth.service';
import { toast } from 'react-toastify';
import './AdminDashboard.css'; // Tái sử dụng CSS từ dashboard
// THÊM MỚI: Import thư viện nén file
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

// Component con cho Modal thêm mới (Không thay đổi)
const AddAssetModal = ({ isOpen, onClose, onSave, assetType }) => {
    const [name, setName] = useState('');
    const [category, setCategory] = useState('General');
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState('');

    useEffect(() => {
        if (!isOpen) {
            // Reset form khi modal đóng
            setName('');
            setCategory('General');
            setImage(null);
            setPreview('');
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
            alert('Vui lòng nhập tên và chọn một file ảnh.');
            return;
        }
        onSave({ name, category, image, assetType });
    };

    return (
        <div className={`modal-overlay ${isOpen ? '' : 'hidden'}`} style={{ display: isOpen ? 'flex' : 'none' }}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">Thêm {assetType} mới</h3>
                    <button onClick={onClose} className="modal-close-btn">×</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label className="form-label">Tên tài sản</label>
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="form-control" required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Danh mục (tùy chọn)</label>
                            <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} className="form-control" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">File ảnh</label>
                            <div className="image-upload-preview single">
                                {preview && <img src={preview} alt="Preview" />}
                                <label className="btn btn-secondary">
                                    <Upload size={16} /> {preview ? 'Thay đổi' : 'Tải lên'}
                                    <input type="file" accept="image/*" hidden onChange={handleImageChange} required />
                                 </label>
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="btn btn-secondary">Hủy</button>
                        <button type="submit" className="btn btn-primary">Lưu</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Component Modal Thêm Hàng Loạt (Không thay đổi)
const BulkAddAssetModal = ({ isOpen, onClose, onSave, assetType }) => {
    const [files, setFiles] = useState([]); // Lưu trữ { id, file, preview, name, category }

    useEffect(() => {
        if (!isOpen) setFiles([]);
    }, [isOpen]);

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
            alert('Vui lòng chọn ít nhất một file.');
            return;
        }
        const metadata = files.map(({ name, category }) => ({ name, category, assetType }));
        onSave(files, metadata);
    };

    return (
        <div className={`modal-overlay ${isOpen ? '' : 'hidden'}`} style={{ display: isOpen ? 'flex' : 'none' }}>
            <div className="modal-content modal-content--large" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">Thêm hàng loạt {assetType}</h3>
                    <button onClick={onClose} className="modal-close-btn">×</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                        <div className="form-group">
                            <label className="btn btn-secondary">
                                <Upload size={16} /> Chọn nhiều ảnh
                                <input type="file" accept="image/*" multiple hidden onChange={handleFileChange} />
                            </label>
                        </div>
                        <div className="table-container minimal-table" style={{ marginTop: '1rem' }}>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Xem trước</th>
                                        <th>Tên tài sản *</th>
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
                    </div>
                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="btn btn-secondary">Hủy</button>
                        <button type="submit" className="btn btn-primary">Lưu tất cả</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// CẬP NHẬT: Component AssetSection
const AssetSection = ({ title, icon, assets, onAdd, onDelete, onBulkAdd, selectedAssets, onSelectionChange, onDownloadAll, disabled }) => {
    const handleSelectAll = (e) => {
        const allIds = assets.map(a => a._id);
        const newSelected = { ...selectedAssets };
        if (e.target.checked) {
            allIds.forEach(id => newSelected[id] = true);
        } else {
            allIds.forEach(id => delete newSelected[id]);
        }
        onSelectionChange(newSelected);
    };

    const isAllSelected = assets.length > 0 && assets.every(a => selectedAssets[a._id]);

    return (
        <div className="card settings-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h3 className="card__title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {icon} {title}
                    {assets.length > 0 && (
                        <label style={{ display: 'flex', alignItems: 'center', fontSize: '0.9rem', fontWeight: 'normal', marginLeft: '1rem', cursor: 'pointer' }}>
                            <input type="checkbox" checked={isAllSelected} onChange={handleSelectAll} style={{ marginRight: '0.5rem' }} />
                            Chọn tất cả
                        </label>
                    )}
                </h3>
                {/* CẬP NHẬT: Thêm nút Tải về và thuộc tính disabled */}
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={onDownloadAll} className="btn btn-green" disabled={disabled || assets.length === 0}>
                        <Download size={20} /> Tải tất cả
                    </button>
                    <button onClick={onBulkAdd} className="btn btn-secondary" disabled={disabled}>
                        <UploadCloud size={20} /> Thêm hàng loạt
                    </button>
                    <button onClick={onAdd} className="btn btn-primary" disabled={disabled}>
                        <PlusCircle size={20} /> Thêm {title}
                    </button>
                </div>
            </div>
            <div className="template-grid">
                {assets.length === 0 && <p>Chưa có tài sản nào.</p>}
                {assets.map(asset => (
                    <div key={asset._id} className="template-card" style={{ border: selectedAssets[asset._id] ? '2px solid var(--admin-blue)' : '' }}>
                        <input
                            type="checkbox"
                            checked={!!selectedAssets[asset._id]}
                            onChange={() => {
                                const newSelected = { ...selectedAssets };
                                if (newSelected[asset._id]) {
                                    delete newSelected[asset._id];
                                } else {
                                    newSelected[asset._id] = true;
                                }
                                onSelectionChange(newSelected);
                            }}
                            style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 10, transform: 'scale(1.5)' }}
                        />
                        <div className="template-card__image-wrapper">
                            <img src={asset.imgSrc} alt={asset.name} className="template-card__image" style={{ objectFit: 'contain', padding: '0.5rem' }} />
                            <div className="template-card__overlay">
                                <button onClick={() => onDelete(asset._id)} className="template-card__action-btn" title="Xóa"><Trash2 size={24} /></button>
                            </div>
                        </div>
                        <div className="template-card__info"><h4 className="template-card__name">{asset.name}</h4><p className="template-card__category">{asset.category}</p></div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// CẬP NHẬT: Component chính
const DesignAssetManagementPage = () => {
    const [assets, setAssets] = useState({ icons: [], components: [], tags: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentAssetType, setCurrentAssetType] = useState('');
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [bulkAssetType, setBulkAssetType] = useState('');
    const [selectedAssets, setSelectedAssets] = useState({});
    const [isDownloading, setIsDownloading] = useState(false); // THÊM MỚI: State cho việc tải
    const selectedCount = Object.keys(selectedAssets).length;

    const handleBulkDelete = async () => {
        if (selectedCount === 0) return;
        if (window.confirm(`Bạn có chắc chắn muốn xóa ${selectedCount} tài sản đã chọn không?`)) {
            try {
                const idsToDelete = Object.keys(selectedAssets);
                await AuthService.bulkDeleteAssets(idsToDelete);
                fetchAssets();
                setSelectedAssets({}); // Reset lựa chọn
            } catch (error) {
                console.error("Lỗi khi xóa hàng loạt:", error);
                alert(`Xóa hàng loạt thất bại: ${error.response?.data?.message || error.message}`);
            }
        }
    };
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
            alert("Không thể tải danh sách tài sản.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAssets();
    }, [fetchAssets]);

    const handleOpenModal = (assetType) => {
        setCurrentAssetType(assetType);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentAssetType('');
    };
    
    const handleOpenBulkModal = (assetType) => {
        setBulkAssetType(assetType);
        setIsBulkModalOpen(true);
    };

    const handleCloseBulkModal = () => {
        setIsBulkModalOpen(false);
        setBulkAssetType('');
    };

    const handleSaveBulkAssets = async (files, metadata) => {
        try {
            await AuthService.bulkAddAssets(files, metadata);
            handleCloseBulkModal();
            fetchAssets();
        } catch (error) {
            console.error("Lỗi khi thêm hàng loạt:", error);
            alert(`Thêm hàng loạt thất bại: ${error.response?.data?.message || error.message}`);
        }
    };

    const handleSaveAsset = async (assetData) => {
        try {
            await AuthService.addDesignAsset(assetData);
            toast.success('Thêm tài sản thành công!'); 
            handleCloseModal();
            fetchAssets();
        } catch (error) {
            console.error("Lỗi khi thêm tài sản:", error);
        }
    };


    const handleDeleteAsset = async (assetId) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa tài sản này không? Hành động này không thể hoàn tác.')) {
            try {
                await AuthService.deleteDesignAsset(assetId);
                fetchAssets(); // Tải lại danh sách
            } catch (error) {
                console.error("Lỗi khi xóa tài sản:", error);
                alert(`Xóa tài sản thất bại: ${error.response?.data?.message || error.message}`);
            }
        }
    };

    // THÊM MỚI: Hàm xử lý tải xuống tất cả
    const handleDownloadAll = async (assetType, assetsToDownload) => {
        if (!assetsToDownload || assetsToDownload.length === 0) {
            toast.warn(`Không có tài sản nào thuộc loại ${assetType} để tải.`);
            return;
        }
        
        setIsDownloading(true);
        toast.info(`Đang bắt đầu nén ${assetsToDownload.length} file... Vui lòng chờ.`);

        try {
            const zip = new JSZip();
            const folder = zip.folder(assetType);

            const downloadPromises = assetsToDownload.map(async (asset) => {
                try {
                    // Sử dụng cors-anywhere hoặc proxy nếu có lỗi CORS
                    const response = await fetch(asset.imgSrc); 
                    if (!response.ok) {
                        console.warn(`Không thể tải: ${asset.imgSrc} (Status: ${response.status})`);
                        return; // Bỏ qua file lỗi
                    }
                    const blob = await response.blob();
                    
                    // Lấy phần mở rộng file
                    let extension = 'png'; // Mặc định
                    const urlParts = asset.imgSrc.split('?')[0].split('.');
                    if (urlParts.length > 1) {
                        const ext = urlParts.pop().toLowerCase();
                        if (['png', 'jpg', 'jpeg', 'svg', 'gif'].includes(ext)) {
                            extension = ext;
                        }
                    }
                    // Lấy tên file an toàn
                    const safeName = asset.name.replace(/[^a-z0-9_-\s]/gi, '').trim() || `file_${asset._id}`;
                    
                    folder.file(`${safeName}.${extension}`, blob);
                } catch (err) {
                    console.error(`Lỗi khi xử lý file ${asset.name} (URL: ${asset.imgSrc}):`, err);
                }
            });

            await Promise.all(downloadPromises);

            const zipBlob = await zip.generateAsync({ type: "blob" });
            saveAs(zipBlob, `icards_assets_${assetType}.zip`);
            toast.success("Đã nén và tải về thành công!");

        } catch (error) {
            console.error("Lỗi khi tạo file zip:", error);
            toast.error("Đã xảy ra lỗi khi nén file.");
        } finally {
            setIsDownloading(false);
        }
    };

    if (isLoading) {
        return <div className="loading-spinner"><div className="loading-spinner__icon"></div></div>;
    }

    return (
        <div>
            <div className="admin-header">
                <h1 className="admin-header__title">Quản lý Tài sản Thiết kế</h1>
            </div>
            
            <div className="settings-container">
                {/* CẬP NHẬT: Truyền prop onDownloadAll và disabled */}
                <AssetSection
                    title="Icon"
                    icon={<ImageIcon size={24} />}
                    assets={assets.icons}
                    onAdd={() => handleOpenModal('icon')}
                    onDelete={handleDeleteAsset}
                    onBulkAdd={() => handleOpenBulkModal('icon')}
                    selectedAssets={selectedAssets}
                    onSelectionChange={setSelectedAssets}
                    onDownloadAll={() => handleDownloadAll('icons', assets.icons)}
                    disabled={isDownloading}
                />
                <AssetSection
                    title="Thành phần"
                    icon={<Box size={24} />}
                    assets={assets.components}
                    onAdd={() => handleOpenModal('component')}
                    onDelete={handleDeleteAsset}
                    onBulkAdd={() => handleOpenBulkModal('component')}
                    selectedAssets={selectedAssets}
                    onSelectionChange={setSelectedAssets}
                    onDownloadAll={() => handleDownloadAll('components', assets.components)}
                    disabled={isDownloading}
                />
                <AssetSection
                    title="Tag/Khung"
                    icon={<Tag size={24} />}
                    assets={assets.tags}
                    onAdd={() => handleOpenModal('tag')}
                    onDelete={handleDeleteAsset}
                    onBulkAdd={() => handleOpenBulkModal('tag')}
                    selectedAssets={selectedAssets}
                    onSelectionChange={setSelectedAssets}
                    onDownloadAll={() => handleDownloadAll('tags', assets.tags)}
                    disabled={isDownloading}
                />
            </div>
            <AddAssetModal isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSaveAsset} assetType={currentAssetType} />
            <BulkAddAssetModal isOpen={isBulkModalOpen} onClose={handleCloseBulkModal} onSave={handleSaveBulkAssets} assetType={bulkAssetType} />
       
            <AnimatePresence>
                {selectedCount > 0 && (
                    <motion.div
                        className="bulk-action-bar"
                        initial={{ y: "120%", opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: "120%", opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 40 }}
                    >
                        <span style={{fontWeight: 500}}>Đã chọn: {selectedCount}</span>
                        <button onClick={handleBulkDelete} className="btn btn-danger" disabled={isDownloading}>
                            <Trash2 size={20} /> Xóa các mục đã chọn
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};


export default DesignAssetManagementPage;