// src/Pages/AdminDashboard/MediaManagementPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Upload, Trash2, Image as ImageIcon, Copy, ExternalLink, CheckSquare } from 'lucide-react';
import { toast } from 'react-toastify';
import AuthService from '../../services/auth.service';
import './MediaManagementPage.css';

const MediaManagementPage = () => {
    const [mediaList, setMediaList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    
    // 1. State lưu danh sách ID các item được chọn
    const [selectedMediaIds, setSelectedMediaIds] = useState([]);

    const fetchMedia = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await AuthService.getMediaList();
            setMediaList(res.data || []);
        } catch (error) {
            toast.error("Không thể tải danh sách hình ảnh.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMedia();
    }, [fetchMedia]);

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setIsUploading(true);
        let successCount = 0;
        let errorCount = 0;

        try {
            await Promise.all(files.map(async (file) => {
                try {
                    await AuthService.uploadMedia(file);
                    successCount++;
                } catch (error) {
                    console.error(`Lỗi khi tải ảnh ${file.name}:`, error);
                    errorCount++;
                }
            }));

            if (successCount > 0) {
                toast.success(`Đã tải lên thành công ${successCount} hình ảnh!`);
                fetchMedia(); 
            }
            if (errorCount > 0) {
                toast.error(`Có ${errorCount} hình ảnh tải lên thất bại.`);
            }
            
        } catch (error) {
            toast.error("Đã xảy ra lỗi trong quá trình tải ảnh.");
        } finally {
            setIsUploading(false);
            e.target.value = null; 
        }
    };

    // 2. Hàm Toggle chọn 1 item
    const handleToggleSelect = (id) => {
        setSelectedMediaIds(prev =>
            prev.includes(id) 
                ? prev.filter(mediaId => mediaId !== id) 
                : [...prev, id]
        );
    };

    // 3. Hàm chọn/Bỏ chọn tất cả
    const handleSelectAll = () => {
        if (selectedMediaIds.length === mediaList.length) {
            setSelectedMediaIds([]); // Bỏ chọn tất cả
        } else {
            setSelectedMediaIds(mediaList.map(m => m._id)); // Chọn tất cả
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa hình ảnh này vĩnh viễn khỏi R2?")) {
            try {
                await AuthService.deleteMedia(id);
                toast.success("Đã xóa hình ảnh.");
                // Loại bỏ khỏi list selected nếu đang được chọn
                setSelectedMediaIds(prev => prev.filter(selectedId => selectedId !== id));
                fetchMedia();
            } catch (error) {
                toast.error("Lỗi khi xóa hình ảnh.");
            }
        }
    };

    // 4. Hàm xử lý xóa hàng loạt
    const handleBulkDelete = async () => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn ${selectedMediaIds.length} hình ảnh đã chọn?`)) {
            try {
                await Promise.all(selectedMediaIds.map(id => AuthService.deleteMedia(id)));
                toast.success(`Đã xóa thành công ${selectedMediaIds.length} hình ảnh.`);
                setSelectedMediaIds([]); // Reset trạng thái
                fetchMedia();
            } catch (error) {
                toast.error("Có lỗi xảy ra khi xóa hàng loạt.");
            }
        }
    };

    const copyToClipboard = (url) => {
        navigator.clipboard.writeText(url);
        toast.info("Đã copy đường dẫn URL!");
    };

    return (
        <div>
            <header className="admin-header media-management-header">
                <h1 className="admin-header__title">Quản lý Hình ảnh (Cloudflare R2)</h1>
            </header>

            <div className="page-header-actions media-management-header">
                <div>
                    <p className="media-management-subtitle">Kho lưu trữ tập trung hình ảnh dùng trong bài viết, banner...</p>
                </div>
                <label className={`btn btn-primary ${isUploading ? 'disabled' : ''}`} style={{ cursor: 'pointer' }}>
                    <Upload size={20} /> {isUploading ? 'Đang tải lên...' : 'Tải lên hình ảnh'}
                    <input 
                        type="file" 
                        accept="image/*" 
                        multiple 
                        hidden 
                        onChange={handleFileUpload} 
                        disabled={isUploading}
                    />
                </label>
            </div>

            {/* 5. Thanh công cụ Bulk Actions */}
            {selectedMediaIds.length > 0 && (
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    padding: '12px 16px', 
                    backgroundColor: '#eff6ff', 
                    borderRadius: '8px',
                    border: '1px solid #bfdbfe',
                    marginBottom: '20px'
                }}>
                    <span style={{ fontWeight: '600', color: '#1e3a8a', flex: 1 }}>
                        Đã chọn {selectedMediaIds.length} hình ảnh
                    </span>
                    <button 
                        onClick={handleSelectAll} 
                        style={{ padding: '8px 16px', background: '#fff', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}
                    >
                        {selectedMediaIds.length === mediaList.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                    </button>
                    <button 
                        onClick={handleBulkDelete} 
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}
                    >
                        <Trash2 size={16} /> Xóa đã chọn
                    </button>
                    <button 
                        onClick={() => setSelectedMediaIds([])} 
                        style={{ padding: '8px 16px', background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer', fontWeight: '500' }}
                    >
                        Hủy
                    </button>
                </div>
            )}

            {isLoading ? (
                 <div className="loading-spinner"><div className="loading-spinner__icon"></div></div>
            ) : (
                <div className="media-grid">
                    {mediaList.length === 0 && (
                        <div className="media-empty-state">
                            <ImageIcon size={48} className="media-empty-icon" />
                            <p>Chưa có hình ảnh nào được tải lên R2.</p>
                        </div>
                    )}
                    
                    {mediaList.map(media => {
                        const isSelected = selectedMediaIds.includes(media._id);
                        
                        return (
                            // Gắn sự kiện onClick vào toàn bộ card để chọn nhanh
                            <div 
                                key={media._id} 
                                className={`media-card ${isSelected ? 'selected' : ''}`}
                                style={{ 
                                    cursor: 'pointer',
                                    border: isSelected ? '2px solid #3b82f6' : '2px solid transparent', // Viền xanh khi chọn
                                    transform: isSelected ? 'translateY(-2px)' : 'none',
                                    transition: 'all 0.2s ease',
                                    boxShadow: isSelected ? '0 4px 12px rgba(59, 130, 246, 0.2)' : 'none'
                                }}
                                onClick={() => handleToggleSelect(media._id)}
                            >
                                <div className="media-card__image-wrapper">
                                    
                                    {/* 6. Checkbox trực quan ở góc */}
                                    <div style={{
                                        position: 'absolute',
                                        top: 8,
                                        left: 8,
                                        zIndex: 10,
                                        backgroundColor: 'rgba(255,255,255,0.9)',
                                        borderRadius: '4px',
                                        padding: '2px',
                                        display: 'flex',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                    }}>
                                        <input 
                                            type="checkbox" 
                                            checked={isSelected} 
                                            readOnly 
                                            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                        />
                                    </div>

                                    <img 
                                        src={media.url} 
                                        alt={media.name} 
                                        className="media-card__image"
                                    />
                                    
                                    {/* 7. Ngăn event lan rộng bằng e.stopPropagation() */}
                                    <div className="media-card__overlay">
                                        <button onClick={(e) => { e.stopPropagation(); window.open(media.url, '_blank') }} className="media-action-btn" title="Xem ảnh gốc">
                                            <ExternalLink size={18} />
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); copyToClipboard(media.url) }} className="media-action-btn" title="Copy đường dẫn">
                                            <Copy size={18} />
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(media._id) }} className="media-action-btn delete" title="Xóa vĩnh viễn">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                                <div className="media-card__info">
                                    <h4 className="media-card__name" title={media.name}>
                                        {media.name}
                                    </h4>
                                    <p className="media-card__size">
                                        {(media.size / 1024).toFixed(1)} KB
                                    </p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    );
};

export default MediaManagementPage;