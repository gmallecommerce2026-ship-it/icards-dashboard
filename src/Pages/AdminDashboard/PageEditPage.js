import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Save, ArrowLeft, Image as ImageIcon, LayoutTemplate,
    Settings, Search, Tag, Globe, FileText, Eye,
    Package, X, Check, ChevronDown, ChevronUp, Plus, Trash2 // Thêm Plus và Trash2
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../services/api';
import CustomEditor from '../../components/CustomEditor';
import './PageEditPage.css';
import { ShoppingBag } from 'lucide-react'; // Thêm icon này
import GmallProductPickerModal from '../../components/GmallProductPickerModal'; // Import Modal chọn SP G-Mall

const PageEditPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = Boolean(id);

    // --- STATE ---
    const [loadingData, setLoadingData] = useState(true);
    const [saving, setSaving] = useState(false);
    // STATE quản lý G-Mall Picker Modal
    const [isGmallModalOpen, setIsGmallModalOpen] = useState(false);
    const [activeGmallBlockIndex, setActiveGmallBlockIndex] = useState(null);
    const [categories, setCategories] = useState([]);

    const [allProducts, setAllProducts] = useState([]);
    const [productSearch, setProductSearch] = useState('');
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [isProductListExpanded, setIsProductListExpanded] = useState(false);

    // STATE MỚI: Quản lý các khối chèn nội tuyến (Injected Blocks)
    const [injectedBlocks, setInjectedBlocks] = useState([]);

    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        content: '',
        isBlog: true,
        category: '',
        relatedTemplate: '',
        thumbnail: null,
        thumbnailUrl: '',
        isPublished: false,
        seo: {
            metaTitle: '',
            metaDescription: '',
            keywords: ''
        }
    });

    // --- HELPER ---
    const createSlug = (text) => {
        if (!text) return '';
        return text.toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d").replace(/Đ/g, "D")
            .replace(/[^a-z0-9\s-]/g, "")
            .trim().replace(/\s+/g, "-");
    };

    const getProdName = (p) => p.title || p.name || 'Sản phẩm không tên';
    const getProdImage = (p) => {
        if (p.imgSrc) return p.imgSrc;
        if (Array.isArray(p.images) && p.images.length > 0) {
            const firstImg = p.images[0];
            return typeof firstImg === 'string' ? firstImg : firstImg.url;
        }
        return p.thumbnail || '/placeholder.png';
    };
    const handleOpenGmallPicker = (index) => {
        setActiveGmallBlockIndex(index);
        setIsGmallModalOpen(true);
    };

    const handleSelectGmallProduct = (product) => {
        if (activeGmallBlockIndex !== null) {
            const newBlocks = [...injectedBlocks];
            newBlocks[activeGmallBlockIndex] = {
                ...newBlocks[activeGmallBlockIndex],
                gmallData: {
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.images?.[0] || '',
                    slug: product.slug || product.id
                }
            };
            setInjectedBlocks(newBlocks);
        }
        setIsGmallModalOpen(false);
        setActiveGmallBlockIndex(null);
    };
    // --- FETCH DATA ---
    useEffect(() => {
        const initData = async () => {
            setLoadingData(true);
            try {
                const [catRes, prodRes] = await Promise.all([
                    api.get('/admin/page-categories'),
                    api.get('/admin/products')
                ]);

                if (catRes.data?.data) setCategories(catRes.data.data);

                const pData = prodRes.data?.data || prodRes.data;
                if (Array.isArray(pData)) setAllProducts(pData);

                if (isEditMode) {
                    const pageRes = await api.get(`/admin/pages/${id}`);
                    const page = pageRes.data.data;

                    if (page) {
                        let initialContent = page.content || '';
                        if (typeof initialContent === 'string' && initialContent.startsWith('"')) {
                            try { initialContent = JSON.parse(initialContent); } catch (e) { }
                        }

                        setFormData({
                            title: page.title || '',
                            slug: page.slug || '',
                            content: initialContent,
                            isBlog: page.isBlog !== undefined ? page.isBlog : true,
                            category: page.category?._id || page.category || '',
                            relatedTemplate: page.relatedTemplate?._id || page.relatedTemplate || '',
                            thumbnail: null,
                            thumbnailUrl: page.thumbnail || '',
                            isPublished: page.isPublished || false,
                            seo: {
                                metaTitle: page.seo?.metaTitle || '',
                                metaDescription: page.seo?.metaDescription || '',
                                keywords: page.seo?.keywords || ''
                            }
                        });

                        // Set dữ liệu injected blocks từ API
                        if (page.injectedBlocks && Array.isArray(page.injectedBlocks)) {
                            setInjectedBlocks(page.injectedBlocks);
                        }

                        if (page.relatedProducts && Array.isArray(page.relatedProducts)) {
                            const mappedProducts = page.relatedProducts.map(item => {
                                if (typeof item === 'string') return pData.find(p => p._id === item);
                                return item;
                            }).filter(item => item !== undefined);
                            setRelatedProducts(mappedProducts);
                        }
                    }
                }
            } catch (error) {
                console.error("Lỗi khởi tạo:", error);
                toast.error("Không thể tải dữ liệu.");
            } finally {
                setLoadingData(false);
            }
        };
        initData();
    }, [id, isEditMode]);

    // --- HANDLERS ---
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name.startsWith('seo.')) {
            const field = name.split('.')[1];
            setFormData(prev => ({ ...prev, seo: { ...prev.seo, [field]: value } }));
        } else {
            setFormData(prev => {
                const newData = { ...prev, [name]: type === 'checkbox' ? checked : value };
                if (name === 'title' && (!isEditMode || !prev.slug)) {
                    newData.slug = createSlug(value);
                }
                return newData;
            });
        }
    };

    const handleManualGenerateSlug = () => {
        setFormData(prev => ({ ...prev, slug: createSlug(prev.title) }));
    };

    const handleContentChange = useCallback((newContent) => {
        setFormData(prev => ({ ...prev, content: newContent }));
    }, []);

    const handleThumbnailChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({ ...prev, thumbnail: file, thumbnailUrl: URL.createObjectURL(file) }));
        }
    };

    const handleToggleProduct = (product) => {
        const isSelected = relatedProducts.find(p => p._id === product._id);
        if (isSelected) {
            setRelatedProducts(prev => prev.filter(p => p._id !== product._id));
        } else {
            setRelatedProducts(prev => [...prev, product]);
        }
    };

    const handleRemoveProduct = (productId) => {
        setRelatedProducts(relatedProducts.filter(p => p._id !== productId));
    };

    // --- INJECTED BLOCKS HANDLERS ---
    const handleAddInjectedBlock = () => {
        setInjectedBlocks([
            ...injectedBlocks,
            { type: 'product', position: 2, productId: '', bannerImg: '', bannerLink: '' }
        ]);
    };

    const handleUpdateInjectedBlock = (index, field, value) => {
        const newBlocks = [...injectedBlocks];
        newBlocks[index][field] = value;
        setInjectedBlocks(newBlocks);
    };

    const handleRemoveInjectedBlock = (index) => {
        const newBlocks = injectedBlocks.filter((_, i) => i !== index);
        setInjectedBlocks(newBlocks);
    };
    const handleUploadBannerImage = async (index, file) => {
        if (!file) return;
        const formData = new FormData();
        formData.append('upload', file); // Tên field 'upload' khớp với API của Editor

        const toastId = toast.loading("Đang tải ảnh Banner lên...");
        try {
            // Dùng chung API upload của Tiptap
            const response = await api.post('/admin/pages/upload-image', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (response.data && response.data.url) {
                handleUpdateInjectedBlock(index, 'bannerImg', response.data.url);
                toast.update(toastId, { render: "Tải ảnh thành công!", type: "success", isLoading: false, autoClose: 2000 });
            }
        } catch (error) {
            toast.update(toastId, { render: "Lỗi khi tải ảnh!", type: "error", isLoading: false, autoClose: 3000 });
        }
    };
    // Filter Products
    const filteredProducts = allProducts.filter(p =>
        (getProdName(p) || '').toLowerCase().includes(productSearch.toLowerCase())
    );
    const displayProducts = isProductListExpanded ? filteredProducts : filteredProducts.slice(0, 5);

    // --- SUBMIT ---
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title.trim()) return toast.warning("Vui lòng nhập tiêu đề!");
        if (!formData.slug.trim()) return toast.warning("Vui lòng tạo đường dẫn (slug)!");

        setSaving(true);
        try {
            const data = new FormData();
            data.append('title', formData.title);
            data.append('slug', formData.slug);
            data.append('isBlog', formData.isBlog);
            data.append('isPublished', formData.isPublished);
            data.append('category', formData.category || '');
            data.append('relatedTemplate', formData.relatedTemplate || '');
            data.append('seo', JSON.stringify(formData.seo));
            data.append('relatedProducts', JSON.stringify(relatedProducts.map(p => p._id)));

            // LƯU Ý MỚI: Đính kèm dữ liệu injectedBlocks vào form
            data.append('injectedBlocks', JSON.stringify(injectedBlocks));

            let contentToSave = formData.content || '';
            if (typeof formData.content === 'object' && formData.content !== null) {
                contentToSave = JSON.stringify(formData.content);
            }
            data.append('content', contentToSave);

            if (formData.thumbnail instanceof File) {
                data.append('thumbnail', formData.thumbnail);
            }

            if (isEditMode) {
                await api.patch(`/admin/pages/${id}`, data);
                toast.success("Cập nhật thành công!");
            } else {
                await api.post('/admin/pages', data);
                toast.success("Tạo mới thành công!");
                navigate('/dashboard/pages');
            }
        } catch (error) {
            console.error("Lỗi lưu:", error);
            const msg = error.response?.data?.message || "Có lỗi xảy ra khi lưu.";
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    if (loadingData) return <div className="pe-loading"><div className="pe-spinner"></div>Đang tải dữ liệu...</div>;

    return (
        <form onSubmit={handleSubmit} className="pe-container">
            {/* Header */}
            <div className="pe-header-sticky">
                <div className="pe-header-left">
                    <button type="button" onClick={() => navigate('/dashboard/pages')} className="pe-back-btn">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="pe-page-title">{isEditMode ? 'Chỉnh sửa bài viết' : 'Thêm bài viết mới'}</h1>
                        <div className="pe-slug-preview">
                            <Globe size={12} />
                            <span>/{formData.slug || 'duong-dan-bai-viet'}</span>
                        </div>
                    </div>
                </div>
                <div className="pe-header-right">
                    {isEditMode && (
                        <a href={`/page/${formData.slug}`} target="_blank" rel="noreferrer" className="pe-btn-view">
                            <Eye size={18} /> Xem thử
                        </a>
                    )}
                    <button type="submit" className="pe-btn-save" disabled={saving}>
                        <Save size={18} />
                        {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                </div>
            </div>

            <div className="pe-grid-layout">
                {/* Main Content Column */}
                <div className="pe-col-main">
                    <div className="pe-card">
                        <div className="form-group">
                            <label className="pe-label">Tiêu đề bài viết <span className="pe-required">*</span></label>
                            <input
                                type="text" name="title" className="pe-input-title"
                                placeholder="Nhập tiêu đề tại đây..."
                                value={formData.title} onChange={handleChange}
                            />
                        </div>
                        <div className="form-group mt-large">
                            <label className="pe-label">Đường dẫn (Slug) <span className="pe-required">*</span></label>
                            <div className="pe-slug-input-group">
                                <span className="pe-domain-prefix">https://site.com/page/</span>
                                <input type="text" name="slug" className="pe-input pe-input-slug" value={formData.slug} onChange={handleChange} />
                                <button type="button" onClick={handleManualGenerateSlug} className="pe-btn-small">Tạo tự động</button>
                            </div>
                        </div>
                    </div>

                    <div className="pe-card">
                        <label className="pe-label mb-medium">Nội dung chi tiết</label>
                        <div className="pe-editor-wrapper">
                            <CustomEditor data={formData.content || ''} onChange={handleContentChange} />
                        </div>
                    </div>

                    {/* WIDGET MỚI: CẤU HÌNH CHÈN NỘI TUYẾN (INJECTED BLOCKS) */}
                    <div className="pe-card" style={{ borderColor: '#bfdbfe' }}>
                        <div className="pe-card-header" style={{ backgroundColor: '#eff6ff', borderBottom: '1px solid #bfdbfe' }}>
                            <LayoutTemplate size={18} className="icon-blue" />
                            <span style={{ color: '#1e3a8a', fontWeight: 600 }}>Chèn nội tuyến (Banner / Sản phẩm)</span>
                            <button
                                type="button"
                                onClick={handleAddInjectedBlock}
                                className="pe-btn-small ml-auto"
                                style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#2563eb', color: '#fff', border: 'none' }}
                            >
                                <Plus size={16} /> Thêm khối
                            </button>
                        </div>
                        <div className="pe-card-body">
                            {injectedBlocks.length === 0 ? (
                                <div className="pe-empty-state" style={{ padding: '2rem', border: '1px dashed #cbd5e1', backgroundColor: '#f8fafc' }}>
                                    <p style={{ color: '#64748b' }}>Chưa có khối nội dung chèn nào. Nhấn "Thêm khối" để chèn banner hoặc sản phẩm xen kẽ vào các đoạn văn của bài viết.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {injectedBlocks.map((block, index) => (
                                        <div key={index} style={{ display: 'flex', gap: '16px', backgroundColor: '#f8fafc', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '6px' }}>

                                            {/* Loại hiển thị */}
                                            <div style={{ flex: '0 0 160px' }}>
                                                <label className="pe-label" style={{ fontSize: '13px', marginBottom: '6px' }}>Loại khối chèn</label>
                                                <div className="pe-select-wrapper">
                                                    <select
                                                        value={block.type}
                                                        onChange={(e) => handleUpdateInjectedBlock(index, 'type', e.target.value)}
                                                        className="pe-select" style={{ fontSize: '13px', padding: '6px 12px' }}
                                                    >
                                                        <option value="product">Sản phẩm hệ thống</option>
                                                        <option value="gmall-product">Sản phẩm G-Mall</option> {/* Thêm dòng này */}
                                                        <option value="banner">Banner Quảng cáo</option>
                                                    </select>
                                                    <ChevronDown size={14} className="pe-select-arrow" />
                                                </div>
                                            </div>

                                            {/* Vị trí chèn */}
                                            <div style={{ flex: '0 0 120px' }}>
                                                <label className="pe-label" style={{ fontSize: '13px', marginBottom: '6px' }}>Sau đoạn văn thứ</label>
                                                <input
                                                    type="number" min="1"
                                                    value={block.position}
                                                    onChange={(e) => handleUpdateInjectedBlock(index, 'position', Number(e.target.value))}
                                                    className="pe-input" style={{ fontSize: '13px', padding: '6px 12px' }}
                                                />
                                            </div>

                                            {/* Cấu hình linh hoạt theo loại */}
                                            <div style={{ flex: '1' }}>
                                                {block.type === 'gmall-product' ? (
                                                    // GIAO DIỆN MỚI CHO G-MALL
                                                    <div>
                                                        <label className="pe-label" style={{ fontSize: '13px', marginBottom: '6px' }}>Chọn sản phẩm G-Mall</label>
                                                        {block.gmallData ? (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '4px', background: '#fff' }}>
                                                                <img src={block.gmallData.image} alt={block.gmallData.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                                    <div style={{ fontSize: '14px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{block.gmallData.name}</div>
                                                                    <div style={{ color: '#ef4444', fontSize: '13px', fontWeight: 600 }}>{block.gmallData.price?.toLocaleString()}đ</div>
                                                                </div>
                                                                <button type="button" onClick={() => handleOpenGmallPicker(index)} className="pe-btn-small" style={{ background: '#f1f5f9', color: '#333', border: '1px solid #cbd5e1' }}>
                                                                    Đổi
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button type="button" onClick={() => handleOpenGmallPicker(index)} className="pe-btn-small" style={{ background: '#f59e0b', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', width: 'fit-content' }}>
                                                                <ShoppingBag size={16} /> Bấm để chọn SP từ G-Mall
                                                            </button>
                                                        )}
                                                    </div>
                                                ) : block.type === 'product' ? (
                                                    // GIAO DIỆN CŨ CỦA PRODUCT HỆ THỐNG
                                                    <div>
                                                        <label className="pe-label" style={{ fontSize: '13px', marginBottom: '6px' }}>Chọn sản phẩm hiển thị</label>
                                                        <div className="pe-select-wrapper">
                                                            <select
                                                                value={typeof block.productId === 'object' ? block.productId?._id : block.productId}
                                                                onChange={(e) => handleUpdateInjectedBlock(index, 'productId', e.target.value)}
                                                                className="pe-select" style={{ fontSize: '13px', padding: '6px 12px' }}
                                                            >
                                                                <option value="">-- Chọn sản phẩm --</option>
                                                                {allProducts.map(prod => (
                                                                    <option key={prod._id} value={prod._id}>
                                                                        {getProdName(prod)} ({prod.price?.toLocaleString()}đ)
                                                                    </option>
                                                                ))}
                                                            </select>
                                                            <ChevronDown size={14} className="pe-select-arrow" />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                        <div>
                                                            <label className="pe-label" style={{ fontSize: '13px', marginBottom: '6px' }}>Ảnh Banner <span className="pe-required">*</span></label>
                                                            {block.bannerImg ? (
                                                                <div style={{ position: 'relative', width: 'fit-content', border: '1px solid #e2e8f0', padding: '4px', borderRadius: '4px', background: '#fff' }}>
                                                                    <img src={block.bannerImg} alt="Banner" style={{ height: '80px', objectFit: 'contain' }} />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleUpdateInjectedBlock(index, 'bannerImg', '')}
                                                                        style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer' }}
                                                                    >
                                                                        ✕
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    onChange={(e) => handleUploadBannerImage(index, e.target.files[0])}
                                                                    className="pe-input"
                                                                    style={{ fontSize: '13px', padding: '6px' }}
                                                                />
                                                            )}
                                                        </div>

                                                        <div>
                                                            <label className="pe-label" style={{ fontSize: '13px', marginBottom: '6px' }}>Đường link khi click vào Banner (Tùy chọn)</label>
                                                            <input
                                                                type="text"
                                                                placeholder="https://..."
                                                                value={block.bannerLink || ''}
                                                                onChange={(e) => handleUpdateInjectedBlock(index, 'bannerLink', e.target.value)}
                                                                className="pe-input"
                                                                style={{ fontSize: '13px', padding: '6px 12px' }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Nút Xóa */}
                                            <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '4px' }}>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveInjectedBlock(index)}
                                                    style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '6px' }}
                                                    title="Xóa khối chèn này"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* SEO Config */}
                    <div className="pe-card">
                        <div className="pe-card-header">
                            <Search size={18} className="icon-blue" />
                            <span>Cấu hình SEO (Google Search)</span>
                        </div>
                        <div className="pe-card-body space-y-medium">
                            <div className="form-group">
                                <label className="pe-label">Meta Title</label>
                                <input type="text" name="seo.metaTitle" className="pe-input" value={formData.seo.metaTitle} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label className="pe-label">Meta Description</label>
                                <textarea name="seo.metaDescription" className="pe-textarea" rows="3" value={formData.seo.metaDescription} onChange={handleChange}></textarea>
                            </div>
                            <div className="form-group">
                                <label className="pe-label">Keywords</label>
                                <input type="text" name="seo.keywords" className="pe-input" value={formData.seo.keywords} onChange={handleChange} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className="pe-col-sidebar">
                    <div className="pe-card">
                        <div className="pe-card-header">
                            <Settings size={18} />
                            <span>Trạng thái</span>
                        </div>
                        <div className="pe-card-body">
                            <div className="pe-toggle-wrapper">
                                <span className="pe-toggle-label">Hiển thị công khai</span>
                                <label className="pe-switch">
                                    <input type="checkbox" name="isPublished" checked={formData.isPublished} onChange={handleChange} />
                                    <span className="pe-slider"></span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="pe-card">
                        <div className="pe-card-header">
                            <Tag size={18} />
                            <span>Phân loại</span>
                        </div>
                        <div className="pe-card-body space-y-medium">
                            <div className="pe-type-group">
                                <button
                                    type="button"
                                    className={`pe-type-select ${formData.isBlog ? 'active' : ''}`}
                                    onClick={() => setFormData(p => ({ ...p, isBlog: true }))}
                                >
                                    <FileText size={16} /> Blog
                                </button>
                                <button
                                    type="button"
                                    className={`pe-type-select ${!formData.isBlog ? 'active' : ''}`}
                                    onClick={() => setFormData(p => ({ ...p, isBlog: false, category: '' }))}
                                >
                                    <LayoutTemplate size={16} /> Page
                                </button>
                            </div>

                            {formData.isBlog && (
                                <div className="form-group">
                                    <label className="pe-label">Danh mục bài viết</label>
                                    <div className="pe-select-wrapper">
                                        <select name="category" className="pe-select" value={formData.category} onChange={handleChange}>
                                            <option value="">-- Chọn danh mục --</option>
                                            {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                                        </select>
                                        <ChevronDown size={14} className="pe-select-arrow" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pe-card">
                        <div className="pe-card-header">
                            <ImageIcon size={18} />
                            <span>Ảnh đại diện</span>
                        </div>
                        <div className="pe-card-body">
                            <div className="pe-thumbnail-preview" onClick={() => document.getElementById('thumbInput').click()} style={{ backgroundImage: formData.thumbnailUrl ? `url(${formData.thumbnailUrl})` : 'none' }}>
                                {!formData.thumbnailUrl && (
                                    <div className="pe-thumb-placeholder">
                                        <ImageIcon size={24} />
                                        <span>Tải ảnh lên</span>
                                    </div>
                                )}
                                <div className="pe-thumb-overlay">
                                    <span>Thay đổi</span>
                                </div>
                            </div>
                            <input id="thumbInput" type="file" hidden accept="image/*" onChange={handleThumbnailChange} />
                            {formData.thumbnailUrl && (
                                <button type="button" className="pe-btn-text-danger" onClick={() => setFormData(p => ({ ...p, thumbnail: null, thumbnailUrl: '' }))}>
                                    Xóa ảnh
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <GmallProductPickerModal
                isOpen={isGmallModalOpen}
                onClose={() => setIsGmallModalOpen(false)}
                onConfirm={handleSelectGmallProduct}
            />
        </form>
    );
};

export default PageEditPage;