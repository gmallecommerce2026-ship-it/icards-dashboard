import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Save, ArrowLeft, Image as ImageIcon, LayoutTemplate, 
    Settings, Search, Tag, Globe, FileText, Eye,
    Package, X, Check, ChevronDown, ChevronUp 
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../services/api'; 
import CustomEditor from '../../components/CustomEditor'; 
import './PageEditPage.css';

const PageEditPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = Boolean(id);

    // --- STATE ---
    const [loadingData, setLoadingData] = useState(true);
    const [saving, setSaving] = useState(false);
    
    const [categories, setCategories] = useState([]);
    // const [templates, setTemplates] = useState([]); 

    const [allProducts, setAllProducts] = useState([]);
    const [productSearch, setProductSearch] = useState('');
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [isProductListExpanded, setIsProductListExpanded] = useState(false);

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

    // --- FETCH DATA ---
    useEffect(() => {
        const initData = async () => {
            setLoadingData(true);
            try {
                const [catRes, prodRes] = await Promise.all([
                    api.get('/admin/page-categories'),
                    // api.get('/admin/templates'),
                    api.get('/admin/products') 
                ]);

                if (catRes.data?.data) setCategories(catRes.data.data);
                // if (tempRes.data?.data) setTemplates(tempRes.data.data);
                
                // Xử lý response sản phẩm linh hoạt
                const pData = prodRes.data?.data || prodRes.data;
                if (Array.isArray(pData)) setAllProducts(pData);

                if (isEditMode) {
                    const pageRes = await api.get(`/admin/pages/${id}`);
                    const page = pageRes.data.data;
                    
                    if (page) {
                        let initialContent = page.content || '';
                        // Parse JSON content nếu cần
                        if (typeof initialContent === 'string' && initialContent.startsWith('"')) {
                            try { initialContent = JSON.parse(initialContent); } catch (e) {}
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

                        if (page.relatedProducts && Array.isArray(page.relatedProducts)) {
                            // Logic: Nếu mảng chứa String (ID), ta tìm object tương ứng trong pData
                            // Nếu mảng đã chứa Object (do backend sửa), ta giữ nguyên
                            const mappedProducts = page.relatedProducts.map(item => {
                                if (typeof item === 'string') {
                                    // Tìm trong danh sách allProducts đã tải
                                    return pData.find(p => p._id === item);
                                }
                                return item;
                            }).filter(item => item !== undefined); // Lọc bỏ các item null/undefined nếu không tìm thấy

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

                    {/* Widget: Product Selector */}
                    <div className="pe-card">
                        <div className="pe-card-header">
                            <Package size={18} className="icon-orange"/>
                            <span>Sản phẩm gợi ý ({relatedProducts.length} đã chọn)</span>
                        </div>
                        <div className="pe-card-body">
                            <div className="pe-search-wrapper">
                                <Search size={16} className="pe-search-icon" />
                                <input 
                                    type="text" className="pe-search-input"
                                    placeholder="Tìm kiếm sản phẩm để thêm..."
                                    value={productSearch} onChange={(e) => setProductSearch(e.target.value)}
                                />
                            </div>

                            <div className="pe-product-list">
                                {displayProducts.length > 0 ? (
                                    displayProducts.map(prod => {
                                        const isChecked = relatedProducts.some(p => p._id === prod._id);
                                        return (
                                            <div 
                                                key={prod._id} 
                                                className={`pe-product-item ${isChecked ? 'active' : ''}`}
                                                onClick={() => handleToggleProduct(prod)}
                                            >
                                                <div className="pe-product-info">
                                                    <div className={`pe-checkbox ${isChecked ? 'checked' : ''}`}>
                                                        {isChecked && <Check size={12} />}
                                                    </div>
                                                    <img src={getProdImage(prod)} className="pe-product-thumb" alt="" />
                                                    <div>
                                                        <div className="pe-product-name">{getProdName(prod)}</div>
                                                        <div className="pe-product-price">{prod.price?.toLocaleString()}đ</div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="pe-empty-state">Không tìm thấy sản phẩm nào</div>
                                )}
                            </div>

                            {filteredProducts.length > 5 && (
                                <div className="pe-load-more">
                                    <button type="button" onClick={() => setIsProductListExpanded(!isProductListExpanded)}>
                                        {isProductListExpanded ? 
                                            <><span className="mr-1">Thu gọn</span> <ChevronUp size={16} /></> : 
                                            <><span className="mr-1">Xem thêm {filteredProducts.length - 5} sản phẩm</span> <ChevronDown size={16} /></>
                                        }
                                    </button>
                                </div>
                            )}

                            {/* Selected Summary */}
                            {relatedProducts.length > 0 && (
                                <div className="pe-selected-summary">
                                    <div className="pe-summary-header">
                                        <span>Đã chọn ({relatedProducts.length})</span>
                                        <small>Click 'X' để bỏ chọn</small>
                                    </div>
                                    <div className="pe-selected-list">
                                        {relatedProducts.map(prod => (
                                            <div key={prod._id} className="pe-selected-item">
                                                <div className="pe-selected-info">
                                                    <img src={getProdImage(prod)} alt="" />
                                                    <span title={getProdName(prod)}>{getProdName(prod)}</span>
                                                </div>
                                                <button type="button" onClick={() => handleRemoveProduct(prod._id)} className="pe-btn-remove">
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* SEO Config */}
                    <div className="pe-card">
                        <div className="pe-card-header">
                            <Search size={18} className="icon-blue"/>
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
                                    onClick={() => setFormData(p => ({...p, isBlog: true}))}
                                >
                                    <FileText size={16}/> Blog
                                </button>
                                <button 
                                    type="button" 
                                    className={`pe-type-select ${!formData.isBlog ? 'active' : ''}`} 
                                    // SỬA TẠI ĐÂY: Thêm category: '' để reset danh mục khi chọn Page
                                    onClick={() => setFormData(p => ({...p, isBlog: false, category: ''}))}
                                >
                                    <LayoutTemplate size={16}/> Page
                                </button>
                            </div>
                            
                            {/* Đoạn này giữ nguyên: Chỉ hiển thị chọn danh mục khi isBlog = true */}
                            {formData.isBlog && (
                                <div className="form-group">
                                    <label className="pe-label">Danh mục bài viết</label>
                                    <div className="pe-select-wrapper">
                                        <select name="category" className="pe-select" value={formData.category} onChange={handleChange}>
                                            <option value="">-- Chọn danh mục --</option>
                                            {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                                        </select>
                                        <ChevronDown size={14} className="pe-select-arrow"/>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* <div className="pe-card">
                        <div className="pe-card-header bg-indigo-light">
                            <LayoutTemplate size={18} className="icon-indigo"/>
                            <span className="text-indigo">Gắn mẫu thiệp (Optional)</span>
                        </div>
                        <div className="pe-card-body">
                             <div className="pe-select-wrapper">
                                <select name="relatedTemplate" className="pe-select pe-select-indigo" value={formData.relatedTemplate} onChange={handleChange}>
                                    <option value="">-- Không đính kèm --</option>
                                    {templates.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                                </select>
                                <ChevronDown size={14} className="pe-select-arrow"/>
                            </div>
                        </div>
                    </div> */}

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
                                <button type="button" className="pe-btn-text-danger" onClick={() => setFormData(p => ({...p, thumbnail: null, thumbnailUrl: ''}))}>
                                    Xóa ảnh
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );
};

export default PageEditPage;