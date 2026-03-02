// TrainData/AdminFE/Pages/AdminDashboard/SeoManagementPage.js
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
// --- THAY ĐỔI: Thêm icon Upload ---
import { FileText, Code, Share2, Repeat, Save, PlusCircle, Trash2, Upload } from 'lucide-react';
import AuthService from '../../services/auth.service';
import './AdminDashboard.css';
import _ from 'lodash';
import CustomEditor from '../../components/CustomEditor';

// ... (Các component con PageMetadataEditor, AdvancedTools, SchemaMarkupEditor giữ nguyên)
// --- BẮT ĐẦU: Chỉnh sửa lại các component con để nhận props từ state thật ---
const frontendUrl = process.env.REACT_APP_FRONTEND_URL !== "" ? process.env.REACT_APP_FRONTEND_URL : 'http://localhost:3001'; // Thay bằng URL thật của FE

const PageMetadataEditor = ({ pageKey, pageData, onUpdate, onFileChange }) => {
    // ... (Giữ nguyên nội dung component này)
    const handleInputChange = (field, value) => {
        onUpdate(`pages.${pageKey}.${field}`, value);
    };

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files[0]) {
            onFileChange(`pages_${pageKey}_social_ogImage`, e.target.files[0]);
        }
    };
    
    const ogImagePreview = pageData.social?.ogImage instanceof File 
        ? URL.createObjectURL(pageData.social.ogImage) 
        : pageData.social?.ogImage;

    return (
        <div className="editor-grid">
            <div className="editor-column">
                <div className="card settings-card">
                    <h3 className="card__title"><FileText size={20}/> Metadata Cơ bản</h3>
                    <div className="form-group">
                        <label className="form-label">Meta Title ({pageData.title?.length || 0} / 60)</label>
                        <input type="text" value={pageData.title || ''} onChange={e => handleInputChange('title', e.target.value)} className="form-control" maxLength="60" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Meta Description ({pageData.description?.length || 0} / 160)</label>
                        <CustomEditor
                            data={pageData.description || ""}
                            onChange={(data) => {
                                handleInputChange('description', data);
                            }}
                        />                  
                        </div>
                     <div className="form-group">
                        <label className="form-label">Keywords (cách nhau bởi dấu phẩy)</label>
                        <input type="text" value={pageData.keywords || ''} onChange={e => handleInputChange('keywords', e.target.value)} className="form-control" />
                    </div>
                </div>
                 <div className="card settings-card">
                    <h3 className="card__title"><Share2 size={20}/> Chia sẻ Mạng xã hội (Open Graph)</h3>
                     <div className="form-group">
                        <label className="form-label">Social Title</label>
                        <input type="text" value={pageData.social?.ogTitle || ''} onChange={e => handleInputChange('social.ogTitle', e.target.value)} className="form-control" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Social Description</label>
                        <textarea value={pageData.social?.ogDescription || ''} onChange={e => handleInputChange('social.ogDescription', e.target.value)} className="form-control" rows="3"></textarea>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Social Image (1200x630px)</label>
                        <div className="image-upload-preview single">
                            {ogImagePreview && <img src={ogImagePreview} alt="Social Preview"/>}
                            <label className="btn btn-secondary">
                                <Upload size={16}/> {ogImagePreview ? 'Thay đổi' : 'Tải lên'}
                                <input type="file" accept="image/*" hidden onChange={handleFileSelect}/>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
            <div className="preview-column">
                <h4 className="preview-heading">Xem trước trên Google</h4>
                <div className="google-preview">
                    <div className="google-preview-url">{`${frontendUrl}${pageKey === 'home' ? '' : pageKey}`}</div>
                    <div className="google-preview-title">{pageData.title || 'Tiêu đề trang của bạn'}</div>
                    <div className="google-preview-description">{pageData.description || 'Đây là mô tả sẽ xuất hiện trên Google...'}</div>
                </div>
                 <h4 className="preview-heading">Xem trước trên Facebook</h4>
                 <div className="facebook-preview">
                     <div className="facebook-preview-image" style={{backgroundImage: `url(${ogImagePreview || 'https://placehold.co/1200x630/27548A/ffffff?text=iCards'})`}}></div>
                     <div className="facebook-preview-content">
                         <div className="facebook-preview-domain">ICARDS.COM.VN</div>
                         <div className="facebook-preview-title">{pageData.social?.ogTitle || pageData.title || 'Tiêu đề Social'}</div>
                         <div className="facebook-preview-description">{pageData.social?.ogDescription || pageData.description || 'Mô tả Social...'}</div>
                     </div>
                 </div>
            </div>
        </div>
    );
};

const AdvancedTools = ({ globalData, redirects, onUpdate }) => {
    // ... (Giữ nguyên)
    const addRedirect = () => {
        const newRedirects = [...(redirects || []), { id: `redirect_${Date.now()}`, source: '', destination: '', type: '301' }];
        onUpdate('redirects', newRedirects);
    };

    const updateRedirect = (index, field, value) => {
        const newRedirects = [...redirects];
        newRedirects[index][field] = value;
        onUpdate('redirects', newRedirects);
    };

    const removeRedirect = (id) => {
        onUpdate('redirects', redirects.filter(r => r.id !== id));
    };

    return (
        <div className="advanced-tools">
             <div className="card settings-card">
                 <h3 className="card__title">Trình chỉnh sửa robots.txt</h3>
                 <textarea className="form-control code-editor" rows="10" value={globalData?.robotsTxt || ''} onChange={e => onUpdate('global.robotsTxt', e.target.value)}></textarea>
            </div>
            <div className="card settings-card">
                <div style={{display:'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                     <h3 className="card__title" style={{marginBottom:0}}>Quản lý Chuyển hướng (Redirects)</h3>
                     <button onClick={addRedirect} className="btn btn-green"><PlusCircle size={18}/> Thêm</button>
                 </div>
                 <div className="table-container minimal-table">
                     <table className="table">
                         <thead><tr><th>URL Nguồn</th><th>URL Đích</th><th>Loại</th><th>Hành động</th></tr></thead>
                         <tbody>
                             {(redirects || []).map((r, index) => (
                                 <tr key={r.id}>
                                     <td><input type="text" className="form-control" placeholder="/old-path" value={r.source} onChange={e => updateRedirect(index, 'source', e.target.value)} /></td>
                                     <td><input type="text" className="form-control" placeholder="/new-path" value={r.destination} onChange={e => updateRedirect(index, 'destination', e.target.value)} /></td>
                                     <td>
                                         <select className="form-control" value={r.type} onChange={e => updateRedirect(index, 'type', e.target.value)}>
                                             <option value="301">301 (Vĩnh viễn)</option>
                                             <option value="302">302 (Tạm thời)</option>
                                         </select>
                                     </td>
                                     <td><button onClick={() => removeRedirect(r.id)} className="delete-btn"><Trash2 size={20}/></button></td>
                                 </tr>
                             ))}
                         </tbody>
                     </table>
                 </div>
            </div>
        </div>
    );
};

const SchemaMarkupEditor = ({ globalData, onUpdate }) => {
    // ... (Giữ nguyên)
    return (
        <div className="schema-editor">
             <div className="card settings-card">
                 <h3 className="card__title">Schema Tổ chức (Hiển thị trên toàn trang)</h3>
                 <div className="form-grid-2">
                     <div className="form-group">
                         <label className="form-label">Tên Tổ chức</label>
                         <input type="text" className="form-control" value={globalData?.organizationSchema?.name || ''} onChange={e => onUpdate('global.organizationSchema.name', e.target.value)}/>
                    </div>
                     <div className="form-group">
                         <label className="form-label">URL Trang web</label>
                         <input type="text" className="form-control" value={globalData?.organizationSchema?.url || ''} onChange={e => onUpdate('global.organizationSchema.url', e.target.value)}/>
                    </div>
                     <div className="form-group">
                         <label className="form-label">URL Logo</label>
                         <input type="text" className="form-control" value={globalData?.organizationSchema?.logo || ''} onChange={e => onUpdate('global.organizationSchema.logo', e.target.value)}/>
                    </div>
                     <div className="form-group">
                         <label className="form-label">Số điện thoại</label>
                         <input type="text" className="form-control" value={globalData?.organizationSchema?.contactPoint?.telephone || ''} onChange={e => onUpdate('global.organizationSchema.contactPoint.telephone', e.target.value)}/>
                    </div>
                 </div>
            </div>
        </div>
    );
};
// --- KẾT THÚC: Chỉnh sửa component con ---

// --- THAY ĐỔI: Component chính sử dụng API thật ---
const SeoManagementPage = () => {
    const [settings, setSettings] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('metadata');
    const [activePage, setActivePage] = useState('home');

    useEffect(() => {
        const fetchSettings = async () => {
            setIsLoading(true);
            try {
                const data = await AuthService.getSettings();
                // Khởi tạo các giá trị mặc định nếu chúng không tồn tại
                const initialSeo = {
                    pages: { 
                        home: { title: '', description: '', keywords: '', social: { ogTitle: '', ogDescription: '', ogImage: '' } }, 
                        products: { title: '', description: '', keywords: '', social: { ogTitle: '', ogDescription: '', ogImage: '' } },
                        invitations: { title: '', description: '', keywords: '', social: { ogTitle: '', ogDescription: '', ogImage: '' } }
                    },
                    global: { organizationSchema: { contactPoint: {} } },
                    redirects: []
                };
                data.seo = _.merge(initialSeo, data.seo);
                setSettings(data);
            } catch (error) {
                console.error("Không thể tải cài đặt SEO.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleUpdate = (path, value) => {
        setSettings(prev => {
            const newSettings = _.cloneDeep(prev);
            _.set(newSettings.seo, path, value);
            return newSettings;
        });
    };
    
    const handleFileChange = (fieldName, file) => {
        const seoPath = fieldName.replace(/_/g, '.').replace('pages.', 'seo.pages.');
        setSettings(prev => {
            const newSettings = _.cloneDeep(prev);
            _.set(newSettings, seoPath, file);
            return newSettings;
        });
    };

    const handleSaveChanges = async () => {
        setIsLoading(true);
        try {
            const formData = new FormData();
            const settingsPayload = _.cloneDeep(settings);

            // Xử lý các file ảnh đã được chọn
            _.forEach(settingsPayload.seo.pages, (pageData, pageKey) => {
                if (pageData.social.ogImage instanceof File) {
                    const fieldName = `pages_${pageKey}_social_ogImage`;
                    formData.append(fieldName, pageData.social.ogImage);
                    // Xóa file khỏi payload để chỉ gửi URL
                    delete pageData.social.ogImage; 
                }
            });

            formData.append('settings', JSON.stringify(settingsPayload));

            const response = await AuthService.updateSettings(formData);
            setSettings(response.data); // Cập nhật lại state với dữ liệu mới từ server
            toast.success('Cài đặt SEO đã được lưu thành công!');
        } catch (error) {
            console.error('Lưu cài đặt thất bại.');
        } finally {
            setIsLoading(false);
        }
    };
    
    if (isLoading || !settings) return <div>Đang tải...</div>;

    const currentPageData = settings.seo.pages[activePage] || { title: '', description: '', social: {} };

    return (
        <div>
            <div className="admin-header">
                <h1 className="admin-header__title">Quản lý SEO</h1>
            </div>
            <div className="settings-container">
                <div className="tabs">
                    <button className={`tab-item ${activeTab === 'metadata' ? 'active' : ''}`} onClick={() => setActiveTab('metadata')}><FileText size={16}/> Metadata Trang</button>
                    <button className={`tab-item ${activeTab === 'schema' ? 'active' : ''}`} onClick={() => setActiveTab('schema')}><Code size={16}/> Schema Markup</button>
                    <button className={`tab-item ${activeTab === 'advanced' ? 'active' : ''}`} onClick={() => setActiveTab('advanced')}><Repeat size={16}/> Công cụ Nâng cao</button>
                </div>

                <div className="tab-content">
                    {activeTab === 'metadata' && (
                        <div className="page-metadata-editor">
                            <div className="page-selector">
                                <label htmlFor="page-select">Chỉnh sửa trang:</label>
                                <select id="page-select" value={activePage} onChange={e => setActivePage(e.target.value)} className="form-control">
                                    {Object.keys(settings.seo.pages).map(key => (
                                        <option key={key} value={key}>{key.charAt(0).toUpperCase() + key.slice(1)}</option>
                                    ))}
                                </select>
                            </div>
                            <PageMetadataEditor 
                                pageKey={activePage} 
                                pageData={currentPageData} 
                                onUpdate={handleUpdate}
                                onFileChange={handleFileChange}
                            />
                        </div>
                    )}
                    {activeTab === 'schema' && <SchemaMarkupEditor globalData={settings.seo.global} onUpdate={handleUpdate}/>}
                    {activeTab === 'advanced' && <AdvancedTools globalData={settings.seo.global} redirects={settings.seo.redirects} onUpdate={handleUpdate} />}
                </div>

                 <div className="page-footer-actions">
                    <button onClick={handleSaveChanges} className="btn btn-primary" disabled={isLoading}>
                        <Save size={20} /> {isLoading ? 'Đang lưu...' : 'Lưu tất cả thay đổi'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SeoManagementPage;