// src/Pages/AdminDashboard/MediaManagementPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Upload, Trash2, Image as ImageIcon, Copy, ExternalLink } from 'lucide-react';
import { toast } from 'react-toastify';
import AuthService from '../../services/auth.service';
import './MediaManagementPage.css';

const MediaManagementPage = () => {
    const [mediaList, setMediaList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);

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
        // Chuyển FileList thành Array để dễ xử lý
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setIsUploading(true);
        let successCount = 0;
        let errorCount = 0;

        try {
            // Sử dụng Promise.all để upload song song nhiều file cùng lúc
            await Promise.all(files.map(async (file) => {
                try {
                    await AuthService.uploadMedia(file);
                    successCount++;
                } catch (error) {
                    console.error(`Lỗi khi tải ảnh ${file.name}:`, error);
                    errorCount++;
                }
            }));

            // Thông báo kết quả tổng hợp
            if (successCount > 0) {
                toast.success(`Đã tải lên thành công ${successCount} hình ảnh!`);
                fetchMedia(); // Chỉ fetch lại list 1 lần sau khi hoàn tất tất cả
            }
            if (errorCount > 0) {
                toast.error(`Có ${errorCount} hình ảnh tải lên thất bại.`);
            }
            
        } catch (error) {
            toast.error("Đã xảy ra lỗi trong quá trình tải ảnh.");
        } finally {
            setIsUploading(false);
            e.target.value = null; // Reset input để có thể chọn lại file vừa chọn
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa hình ảnh này vĩnh viễn khỏi R2?")) {
            try {
                await AuthService.deleteMedia(id);
                toast.success("Đã xóa hình ảnh.");
                fetchMedia();
            } catch (error) {
                toast.error("Lỗi khi xóa hình ảnh.");
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
                        multiple /* MỚI THÊM: Cho phép chọn nhiều file */
                        hidden 
                        onChange={handleFileUpload} 
                        disabled={isUploading}
                    />
                </label>
            </div>

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
                    
                    {mediaList.map(media => (
                        <div key={media._id} className="media-card">
                            <div className="media-card__image-wrapper">
                                <img 
                                    src={media.url} 
                                    alt={media.name} 
                                    className="media-card__image"
                                />
                                <div className="media-card__overlay">
                                    <button onClick={() => window.open(media.url, '_blank')} className="media-action-btn" title="Xem ảnh gốc">
                                        <ExternalLink size={18} />
                                    </button>
                                    <button onClick={() => copyToClipboard(media.url)} className="media-action-btn" title="Copy đường dẫn">
                                        <Copy size={18} />
                                    </button>
                                    <button onClick={() => handleDelete(media._id)} className="media-action-btn delete" title="Xóa vĩnh viễn">
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
                    ))}
                </div>
            )}
        </div>
    );
};

export default MediaManagementPage;