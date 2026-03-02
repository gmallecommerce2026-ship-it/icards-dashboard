// AdminFE/Pages/AdminDashboard/PageManagementPage.js

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { PlusCircle, Edit, Trash2, Eye, ToggleLeft, ToggleRight, Settings, Type, ChevronsRight } from 'lucide-react';
// import AuthService from '../../services/auth.service'; // LOẠI BỎ: Import sai
import pageCategoryService from '../../services/pageCategory.service';
import './AdminDashboard.css';
import CustomEditor from '../../components/CustomEditor';
import PageCategoryManagement from './PageCategoryManagement';
import TopicManagement from './TopicManagement';
import api from '../../services/api';
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    Table, TableBody, TableCell, TableHead, TableRow, TableContainer, Paper
} from '@mui/material';

// --- BẮT ĐẦU VÙNG SỬA LỖI ---
// 1. Thêm các import cần thiết từ Material-UI cho multi-select dropdown
import {
    FormControl,
    Select,
    MenuItem,
    Checkbox,
    ListItemText,
    OutlinedInput,
    Box,
    Chip
} from '@mui/material';
import { DragIndicator } from '@mui/icons-material';

// 2. Tạo một đối tượng service cục bộ để thay thế AuthService
// AuthService đã được dùng sai; các API này thuộc về 'pages'
const pageService = {
    getPages: () => api.get('/admin/pages'),
    createPage: (formData) => api.post('/admin/pages', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    updatePage: (id, formData) => api.put(`/admin/pages/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    deletePage: (id) => api.delete(`/admin/pages/${id}`),
    updatePageOrder: (payload) => api.put('/admin/pages/update-order', payload),
};
// --- KẾT THÚC VÙNG SỬA LỖI ---


// --- Reusable Components (Không thay đổi) ---
const AdminHeader = ({ title }) => ( <header className="admin-header"><h1 className="admin-header__title">{title}</h1></header> );
const LoadingSpinner = () => ( <div className="loading-spinner"><div className="loading-spinner__icon"></div></div> );
const Modal = ({ isOpen, onClose, title, children, size = 'large' }) => {
    if (!isOpen) return null;
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className={`modal-content modal-content--${size}`} onClick={e => e.stopPropagation()}>
                <div className="modal-header"><h3 className="modal-title">{title}</h3><button onClick={onClose} className="modal-close-btn">×</button></div>
                {children}
            </div>
        </div>
    );
};

const SortablePageRow = ({ page, onEdit, onDelete, frontendUrl }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: page._id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.7 : 1,
        backgroundColor: isDragging ? 'rgba(0,0,0,0.05)' : 'inherit',
    };

    return (
        <TableRow ref={setNodeRef} style={style} {...attributes}>
            <TableCell sx={{ cursor: 'grab', width: '50px' }} {...listeners}>
                <DragIndicator />
            </TableCell>
            <TableCell>
                {page.title}
                <br />
                <small>
                    {page.isBlog && page.category && page.category.slug && (
                        <>
                            <a href={`${frontendUrl}/blog/category/${page.category.slug}`} target="_blank" rel="noopener noreferrer">
                                {page.category.name}
                            </a>
                            <ChevronsRight size={12} style={{ verticalAlign: 'middle' }} />
                        </>
                    )}
                    <a href={`${frontendUrl}/${page.isBlog ? 'page' : 'page'}/${page.slug}`} target="_blank" rel="noopener noreferrer">
                        /{page.isBlog ? 'page' : 'page'}/{page.slug}
                    </a>
                </small>
            </TableCell>
            <TableCell>{page.isBlog ? 'Blog' : 'Trang'}</TableCell>
            <TableCell><span className={`role-badge ${page.isPublished ? 'role-admin' : 'role-user'}`}>{page.isPublished ? 'Đã xuất bản' : 'Bản nháp'}</span></TableCell>
            <TableCell>{new Date(page.createdAt).toLocaleDateString('vi-VN')}</TableCell>
            <TableCell className="table__actions">
                <a href={`${frontendUrl}/${page.isBlog ? 'page' : 'page'}/${page.slug}`} target="_blank" rel="noopener noreferrer" className="view-btn" title="Xem trước trang"><Eye size={20} /></a>
                <button onClick={() => onEdit(page)} className="edit-btn" title="Chỉnh sửa"><Edit size={20} /></button>
                <button onClick={() => onDelete(page._id)} className="delete-btn" title="Xóa"><Trash2 size={20} /></button>
            </TableCell>
        </TableRow>
    );
};
// --- PageModal ---
const PageModal = ({ isOpen, onClose, onSave, page, categories, topics }) => {
    const [formData, setFormData] = useState({
        title: '', slug: '', content: '', isPublished: false, isBlog: false, category: '', topics: [],
        seo: { metaTitle: '', metaDescription: '' }
    });
    
    // Tạo một Map để tra cứu tên topic từ ID một cách hiệu quả
    const topicMap = new Map(topics.map(topic => [topic._id, topic.name]));

    useEffect(() => {
        if (page && isOpen) {
            const pageContent = Array.isArray(page.content) 
                ? page.content.map(block => block.type === 'text' ? block.content : `<img src="${block.content}" alt="${block.alt || ''}"/>`).join('') 
                : (typeof page.content === 'string' ? page.content : '');

            setFormData({
                title: page.title || '',
                slug: page.slug || '',
                content: pageContent,
                isPublished: page.isPublished || false,
                isBlog: page.isBlog || false,
                category: page.category?._id || '',
                topics: page.topics?.map(t => t._id) || [], 
                seo: { metaTitle: page.seo?.metaTitle || '', metaDescription: page.seo?.metaDescription || '' }
            });
        } else {
            setFormData({ title: '', slug: '', content: '', isPublished: false, isBlog: false, category: '', topics: [], seo: { metaTitle: '', metaDescription: '' } });
        }
    }, [page, isOpen]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name.startsWith('seo.')) {
            const seoField = name.split('.')[1];
            setFormData(prev => ({ ...prev, seo: { ...prev.seo, [seoField]: value } }));
        } else {
            setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
        }
    };
    
    // --- BẮT ĐẦU VÙNG SỬA LỖI ---
    // 3. Cập nhật hàm xử lý cho MUI Select
    const handleTopicChange = (event) => {
        const { target: { value } } = event;
        setFormData(prev => ({
          ...prev,
          topics: typeof value === 'string' ? value.split(',') : value,
        }));
    };
    // --- KẾT THÚC VÙNG SỬA LỖI ---

    const handleContentChange = (data) => {
        setFormData(prev => ({ ...prev, content: data }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.title) {
            toast.warn("Tiêu đề trang là bắt buộc.");
            return;
        }
        
        const dataToSave = new FormData();
        dataToSave.append('title', formData.title);
        dataToSave.append('slug', formData.slug);
        dataToSave.append('isPublished', formData.isPublished);
        dataToSave.append('isBlog', formData.isBlog);
        dataToSave.append('seo', JSON.stringify(formData.seo));
        
        if (!formData.isBlog) {
            dataToSave.append('category', '');
            dataToSave.append('topics', JSON.stringify([]));
        } else {
            dataToSave.append('category', formData.category || '');
            dataToSave.append('topics', JSON.stringify(formData.topics || [])); 
        }
        
        const contentPayload = [{ type: 'text', content: formData.content }];
        dataToSave.append('content', JSON.stringify(contentPayload));
        
        onSave(dataToSave, page ? page._id : null);
    };

    const handleBlogToggle = () => {
        setFormData(prev => {
            const newIsBlog = !prev.isBlog;
            return { ...prev, isBlog: newIsBlog, category: newIsBlog ? prev.category : '', topics: newIsBlog ? prev.topics : [] };
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={page ? 'Chỉnh sửa trang' : 'Tạo trang mới'}>
            <form onSubmit={handleSubmit} className="page-modal-form">
                <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto', paddingRight: '1rem' }}>
                    <div className="page-modal-grid">
                        <div className="page-modal-main">
                            <div className="form-group">
                               <label className="form-label">Tiêu đề trang *</label>
                               <input type="text" name="title" value={formData.title} onChange={handleChange} className="form-control form-control-lg" required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Nội dung</label>
                                <CustomEditor data={formData.content} onChange={handleContentChange} />
                            </div>
                        </div>
                        <div className="page-modal-sidebar">
                            <div className="card settings-card">
                                <h3 className="card__title"><Settings size={20}/> Tùy chọn</h3>
                                <div className="form-group">
                                  <label className="form-label">Đường dẫn (slug)</label>
                                  <input type="text" name="slug" value={formData.slug} onChange={handleChange} className="form-control" placeholder="Tự động tạo nếu để trống"/>
                                </div>
                                <div className="form-group publish-toggle">
                                    <label className="form-label">Trạng thái</label>
                                    <div className="toggle-wrapper">
                                        <span>{formData.isPublished ? 'Đã xuất bản' : 'Bản nháp'}</span>
                                        <button type="button" className={`btn-toggle ${formData.isPublished ? 'active' : ''}`} onClick={() => setFormData(prev => ({...prev, isPublished: !prev.isPublished}))}>
                                            {formData.isPublished ? <ToggleRight size={24}/> : <ToggleLeft size={24}/>}
                                        </button>
                                    </div>
                                </div>
                                <div className="form-group publish-toggle">
                                  <label className="form-label">Đây là bài blog?</label>
                                  <div className="toggle-wrapper">
                                      <span>{formData.isBlog ? 'Phải' : 'Không'}</span>
                                      <button type="button" className={`btn-toggle ${formData.isBlog ? 'active' : ''}`} onClick={handleBlogToggle}>
                                        {formData.isBlog ? <ToggleRight size={24}/> : <ToggleLeft size={24}/>}
                                      </button>
                                  </div>
                                </div>
                                {formData.isBlog && (
                                    <>
                                    <div className="form-group">
                                        <label className="form-label">Danh mục</label>
                                        <select name="category" value={formData.category} onChange={handleChange} className="form-control">
                                            <option value="">-- Chọn danh mục --</option>
                                            {categories.map(cat => (
                                                <option key={cat._id} value={cat._id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    {/* --- BẮT ĐẦU VÙNG SỬA LỖI --- */}
                                    {/* 4. Thay thế <select> cũ bằng MUI Select */}
                                    <div className="form-group">
                                        <label className="form-label">Chủ đề (Topics)</label>
                                        <FormControl fullWidth>
                                            <Select
                                                labelId="topics-select-label"
                                                multiple
                                                value={formData.topics}
                                                onChange={handleTopicChange}
                                                input={<OutlinedInput />}
                                                renderValue={(selected) => (
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                        {selected.map((value) => (
                                                            <Chip key={value} label={topicMap.get(value) || value} size="small" />
                                                        ))}
                                                    </Box>
                                                )}
                                                MenuProps={{ PaperProps: { style: { maxHeight: 224 } } }}
                                            >
                                                {topics.map((topic) => (
                                                    <MenuItem key={topic._id} value={topic._id}>
                                                        <Checkbox checked={formData.topics.indexOf(topic._id) > -1} />
                                                        <ListItemText primary={topic.name} />
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </div>
                                    {/* --- KẾT THÚC VÙNG SỬA LỖI --- */}

                                    </>
                                )}
                            </div>
                             <div className="card settings-card">
                               <h3 className="card__title"><Type size={20} /> Tối ưu SEO</h3>
                               <div className="form-group">
                                   <label className="form-label">Meta Title</label>
                                   <input type="text" name="seo.metaTitle" value={formData.seo.metaTitle} onChange={handleChange} className="form-control" placeholder="Mặc định là tiêu đề trang"/>
                               </div>
                               <div className="form-group">
                                  <label className="form-label">Meta Description</label>
                                  <textarea name="seo.metaDescription" value={formData.seo.metaDescription} onChange={handleChange} className="form-control" rows="4" placeholder="Mô tả ngắn gọn..."/>
                               </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="modal-footer">
                    <button type="button" onClick={onClose} className="btn btn-secondary">Hủy</button>
                    <button type="submit" className="btn btn-primary">Lưu trang</button>
                </div>
            </form>
        </Modal>
    );
};

// --- Component chính PageManagementPage ---
const PageManagementPage = () => {
    const [pages, setPages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPage, setEditingPage] = useState(null);
    const [categories, setCategories] = useState([]);
    const [topics, setTopics] = useState([]);
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } })); // Cảm biến kéo thả

    const fetchTopics = useCallback(async () => {
        try {
            const response = await api.get('/admin/topics'); 
            setTopics(Array.isArray(response.data?.data) ? response.data.data : []);
        } catch (error) {
            toast.error("Không thể tải danh sách chủ đề.");
        }
    }, []);

    const fetchCategories = useCallback(async () => {
        try {
            const response = await pageCategoryService.getAllCategories();
            setCategories(Array.isArray(response.data?.data) ? response.data.data : []);
        } catch (error) {
            toast.error("Không thể tải danh sách danh mục.");
            console.error(error);
        }
    }, []);
    
    const fetchPages = useCallback(async () => {
        setIsLoading(true);
        try {
            // --- BẮT ĐẦU VÙNG SỬA LỖI ---
            // 5. Thay AuthService.getPages() bằng pageService.getPages()
            const response = await pageService.getPages();
            // 6. Truy cập response.data.data theo ghi chú của bạn và phân tích backend
            setPages(Array.isArray(response.data?.data) ? response.data.data : []);
            // --- KẾT THÚC VÙNG SỬA LỖI ---
        } catch (error) {
            console.error("Không thể tải danh sách trang.", error);
            toast.error("Không thể tải danh sách trang/bài viết.");
            setPages([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { 
        fetchPages(); 
        fetchCategories();
        fetchTopics();
    }, [fetchPages, fetchCategories, fetchTopics]);

    const handleOpenModal = (page = null) => { 
        setEditingPage(page); 
        setIsModalOpen(true); 
    };

    const handleSavePage = async (pageFormData, pageId) => {
        try {
            // --- BẮT ĐẦU VÙNG SỬA LỖI ---
            // 7. Thay AuthService bằng pageService
            if (pageId) {
                await pageService.updatePage(pageId, pageFormData);
                toast.success('Cập nhật trang thành công!');
            } else {
                await pageService.createPage(pageFormData);
                toast.success('Tạo trang mới thành công!');
            }
            // --- KẾT THÚC VÙNG SỬA LỖI ---
            fetchPages();
            setIsModalOpen(false);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lưu trang thất bại.');
        }
    };

    const handleDeletePage = async (pageId) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa trang này?')) {
            try {
                // --- BẮT ĐẦU VÙNG SỬA LỖI ---
                // 8. Thay AuthService bằng pageService
                await pageService.deletePage(pageId);
                // --- KẾT THÚC VÙNG SỬA LỖI ---
                toast.success('Xóa trang thành công!');
                fetchPages();
            } catch (error) {
                console.error('Lỗi khi xóa trang:', error);
                toast.error('Xóa trang thất bại.');
            }
        }
    };
    
    const handleDragEnd = async (event) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = pages.findIndex((p) => p._id === active.id);
            const newIndex = pages.findIndex((p) => p._id === over.id);
            const reorderedPages = arrayMove(pages, oldIndex, newIndex);
            setPages(reorderedPages); // Cập nhật UI ngay

            try {
                const pageOrderPayload = reorderedPages.map(p => ({ id: p._id }));
                // --- BẮT ĐẦU VÙNG SỬA LỖI ---
                // 9. Thay AuthService bằng pageService
                await pageService.updatePageOrder({ pages: pageOrderPayload });
                // --- KẾT THÚC VÙNG SỬA LỖI ---
                toast.success('Thứ tự trang đã được cập nhật!');
            } catch (error) {
                toast.error('Lỗi khi cập nhật thứ tự.');
                fetchPages(); // Hoàn tác nếu có lỗi
            }
        }
    };
    
    const frontendUrl = process.env.REACT_APP_FRONTEND_URL || 'http://localhost:3001';

    if (isLoading) return <LoadingSpinner />;
    
    return (
        <div>
            <AdminHeader title="Quản lý Trang & Bài viết" />
            <div className="page-header-actions">
                <button onClick={() => handleOpenModal()} className="btn btn-primary"><PlusCircle size={20} /> Tạo trang/bài viết mới</button>
            </div>
            <TableContainer component={Paper} sx={{ mt: 2 }}>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ width: '50px' }}></TableCell>
                                <TableCell>Tiêu đề</TableCell>
                                <TableCell>Loại trang</TableCell>
                                <TableCell>Trạng thái</TableCell>
                                <TableCell>Ngày tạo</TableCell>
                                <TableCell align="right">Hành động</TableCell>
                            </TableRow>
                        </TableHead>
                        <SortableContext items={pages.map(p => p._id)} strategy={verticalListSortingStrategy}>
                            <TableBody>
                                {pages.map(page => (
                                    <SortablePageRow
                                        key={page._id}
                                        page={page}
                                        onEdit={handleOpenModal}
                                        onDelete={handleDeletePage}
                                        frontendUrl={frontendUrl}
                                    />
                                ))}
                            </TableBody>
                        </SortableContext>
                    </Table>
                </DndContext>
            </TableContainer>
            <PageCategoryManagement onCategoriesUpdate={fetchCategories} />
            <TopicManagement onTopicsUpdate={fetchTopics} /> 
            
            
            <PageModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSave={handleSavePage} 
                page={editingPage}
                categories={categories}
                topics={topics}
            />
        </div>
    );
};

export default PageManagementPage;