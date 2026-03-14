import React, { useState, useEffect } from 'react';
import {
  Plus, Edit2, Trash2, Search, Filter, Eye,
  CheckCircle, XCircle, FileText, Globe, AlertTriangle,
  Layout, Layers, Hash // Đã thêm icon cho Tab Menu mới
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';
import './PageManagementPage.css';

// Import các component quản lý con
import PageCategoryManagement from './PageCategoryManagement';
import TopicManagement from './TopicManagement';

const PageManagementPage = () => {
  const navigate = useNavigate();
  
  // --- NEW STATE: Quản lý Tab hiển thị chính ---
  const [currentView, setCurrentView] = useState('content'); // 'content' | 'categories' | 'topics'

  // --- ORIGINAL DATA STATES ---
  const [pages, setPages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // --- ORIGINAL FILTER STATES ---
  const [activeTab, setActiveTab] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // --- ORIGINAL PAGINATION STATES ---
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  // --- ORIGINAL DELETE MODAL STATE ---
  const [deleteModal, setDeleteModal] = useState({
      isOpen: false,
      id: null,
      isDeleting: false
  });

  // 1. Fetch Categories Init
  useEffect(() => {
      fetchCategories();
  }, []);

  const fetchCategories = async () => {
      try {
          const res = await api.get('/admin/page-categories');
          if (res.data?.data) setCategories(res.data.data);
      } catch (err) {
          console.error("Load Categories Error", err);
      }
  };

  // Helper: Cập nhật lại danh mục khi thao tác bên Tab quản lý danh mục
  const handleCategoriesUpdate = (updatedCategories) => {
    setCategories(updatedCategories);
  };

  // 2. Fetch Pages (Chỉ gọi khi đang ở Tab 'content')
  useEffect(() => {
    if (currentView === 'content') {
        fetchPages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, activeTab, statusFilter, categoryFilter, searchQuery, currentView]);

  const fetchPages = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        sort: '-createdAt',
        search: searchQuery,
        status: statusFilter,
        category: categoryFilter,
        type: activeTab
      };

      const res = await api.get('/admin/pages', { params });
      
      if (res.data) {
        setPages(res.data.data || []);
        setTotalPages(res.data.totalPages || 1);
        setTotalResults(res.data.totalResults || 0);
      }
    } catch (error) {
      console.error("Fetch Pages Error:", error);
      toast.error("Không thể tải danh sách trang.");
    } finally {
      setLoading(false);
    }
  };

  // --- LOGIC XÓA (Giữ nguyên từ code của bạn) ---
  const openDeleteModal = (id) => {
    setDeleteModal({ isOpen: true, id: id, isDeleting: false });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, id: null, isDeleting: false });
  };

  const confirmDelete = async () => {
    if (!deleteModal.id) return;

    try {
      setDeleteModal(prev => ({ ...prev, isDeleting: true }));
      await api.delete(`/admin/pages/${deleteModal.id}`);
      
      toast.success("Đã xóa thành công.");
      fetchPages(); 
      closeDeleteModal(); 
    } catch (error) {
      toast.error("Lỗi khi xóa trang.");
      setDeleteModal(prev => ({ ...prev, isDeleting: false }));
    }
  };

  // Helper: Toggle Status (Giữ nguyên)
  const handleToggleStatus = async (page) => {
    try {
      const newStatus = !page.isPublished;
      await api.patch(`/admin/pages/${page._id}`, {
        isPublished: newStatus
      });
      toast.success(`Đã ${newStatus ? 'xuất bản' : 'gỡ bỏ'} bài viết.`);
      setPages(prev => prev.map(p => p._id === page._id ? { ...p, isPublished: newStatus } : p));
    } catch (error) {
      toast.error("Không thể cập nhật trạng thái.");
    }
  };

  // Helper: Get Thumbnail (Giữ nguyên)
  const getThumbnail = (content) => {
      if (Array.isArray(content)) {
          const imgBlock = content.find(b => b.type === 'image');
          return imgBlock ? imgBlock.content : 'https://via.placeholder.com/150?text=No+Image';
      }
      if (typeof content === 'string') {
          const match = content.match(/<img[^>]+src="([^">]+)"/);
          if (match && match[1]) {
              return match[1]; 
          }
      }
      return 'https://via.placeholder.com/150?text=No+Image';
  };

  return (
    <div className="pmp-container">
      {/* Header & Stats */}
      <div className="pmp-header">
        <div>
            <h1 className="pmp-title">Quản lý CMS</h1>
            <p className="pmp-subtitle">Hệ thống quản lý nội dung, danh mục và chủ đề tập trung.</p>
        </div>
        
        {/* Chỉ hiện nút tạo mới khi ở tab Content */}
        {currentView === 'content' && (
            <Link to="/dashboard/pages/create" className="pmp-btn-primary">
            <Plus size={18} /> Tạo bài viết mới
            </Link>
        )}
      </div>

      {/* --- MAIN NAVIGATION TABS (MỚI THÊM) --- */}
      <div className="pmp-main-nav">
        <button 
            className={`pmp-main-nav-item ${currentView === 'content' ? 'active' : ''}`}
            onClick={() => setCurrentView('content')}
        >
            <Layout size={18} /> Quản lý Bài viết
        </button>
        <button 
            className={`pmp-main-nav-item ${currentView === 'categories' ? 'active' : ''}`}
            onClick={() => setCurrentView('categories')}
        >
            <Layers size={18} /> Danh mục (Categories)
        </button>
        <button 
            className={`pmp-main-nav-item ${currentView === 'topics' ? 'active' : ''}`}
            onClick={() => setCurrentView('topics')}
        >
            <Hash size={18} /> Chủ đề (Topics)
        </button>
      </div>

      {/* --- PHẦN 1: CONTENT VIEW (Mã cũ của bạn nằm trong block này) --- */}
      {currentView === 'content' && (
          <div className="fade-in">
              {/* Tabs Control */}
              <div className="pmp-tabs">
                  <button 
                    className={`pmp-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('all'); setCurrentPage(1); }}
                  >
                    Tất cả
                  </button>
                  <button 
                    className={`pmp-tab-btn ${activeTab === 'blog' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('blog'); setCurrentPage(1); }}
                  >
                    <FileText size={16} /> Bài viết (Blog)
                  </button>
                  <button 
                    className={`pmp-tab-btn ${activeTab === 'page' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('page'); setCurrentPage(1); }}
                  >
                    <Globe size={16} /> Trang tĩnh
                  </button>
              </div>

              {/* Toolbar */}
              <div className="pmp-toolbar">
                <div className="pmp-search">
                  <Search size={18} className="pmp-search-icon" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm theo tiêu đề..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <div className="pmp-filters-group">
                    <div className="pmp-select-wrap">
                        <Filter size={16} />
                        <select 
                            value={categoryFilter} 
                            onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
                        >
                            <option value="all">Tất cả danh mục</option>
                            {categories.map(cat => (
                                <option key={cat._id} value={cat._id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="pmp-select-wrap">
                        <CheckCircle size={16} />
                        <select 
                            value={statusFilter} 
                            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                        >
                            <option value="all">Tất cả trạng thái</option>
                            <option value="true">Đã xuất bản</option>
                            <option value="false">Bản nháp</option>
                        </select>
                    </div>
                </div>
              </div>

              {/* Table */}
              <div className="pmp-table-wrapper">
                <table className="pmp-table">
                  <thead>
                    <tr>
                      <th width="40%">Tiêu đề / Thông tin</th>
                      <th>Danh mục</th>
                      <th>Tác giả</th>
                      <th>Trạng thái</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan="5" className="text-center py-8">Đang tải dữ liệu...</td></tr>
                    ) : pages.length === 0 ? (
                      <tr><td colSpan="5" className="text-center py-8 text-gray-500">Không tìm thấy bài viết nào.</td></tr>
                    ) : (
                      pages.map(page => (
                        <tr key={page._id}>
                          <td>
                            <div className="pmp-item-flex">
                              <div className="pmp-thumb">
                                  <img src={getThumbnail(page.content)} alt="thumb" />
                              </div>
                              <div className="pmp-item-info">
                                  <span className="pmp-item-title">{page.title}</span>
                                  <div className="pmp-item-meta">
                                      <span className={`pmp-type-badge ${page.isBlog ? 'is-blog' : 'is-page'}`}>
                                          {page.isBlog ? 'Blog' : 'Page'}
                                      </span>
                                      <span className="pmp-slug">/{page.slug}</span>
                                  </div>
                              </div>
                            </div>
                          </td>
                          <td>{page.category?.name || '---'}</td>
                          <td>
                              <div className="pmp-author">
                                  {page.author?.name || 'Admin'}
                                  <span className="text-xs text-gray-400 block">
                                      {new Date(page.createdAt).toLocaleDateString('vi-VN')}
                                  </span>
                              </div>
                          </td>
                          <td>
                            <button 
                              className={`pmp-status-pill ${page.isPublished ? 'published' : 'draft'}`}
                              onClick={() => handleToggleStatus(page)}
                            >
                              {page.isPublished ? <CheckCircle size={14}/> : <XCircle size={14}/>}
                              {page.isPublished ? 'Published' : 'Draft'}
                            </button>
                          </td>
                          <td>
                            <div className="pmp-actions">
                              <button 
                                className="pmp-action-btn edit"
                                onClick={() => navigate(`/dashboard/pages/edit/${page._id}`)} 
                                title="Chỉnh sửa"
                            >
                                <Edit2 size={18} />
                            </button>
                              <button 
                                className="pmp-action-btn delete"
                                onClick={() => openDeleteModal(page._id)} 
                                title="Xóa"
                              >
                                <Trash2 size={18} />
                              </button>
                              <a 
                                href={`/page/${page.slug}`} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="pmp-action-btn view"
                              >
                                <Eye size={18} />
                              </a>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              <div className="pmp-footer">
                  <span className="pmp-results-count">Hiển thị {pages.length} / {totalResults} kết quả</span>
                  <div className="pmp-pagination">
                      <button 
                        disabled={currentPage === 1} 
                        onClick={() => setCurrentPage(p => p - 1)}
                        className="pmp-pg-btn"
                      >
                        Trước
                      </button>
                      <span className="pmp-pg-info">Trang {currentPage} / {totalPages}</span>
                      <button 
                        disabled={currentPage === totalPages || totalPages === 0} 
                        onClick={() => setCurrentPage(p => p + 1)}
                        className="pmp-pg-btn"
                      >
                        Sau
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* --- PHẦN 2: CATEGORY VIEW (Mới) --- */}
      {currentView === 'categories' && (
          <div className="fade-in">
              <PageCategoryManagement onCategoriesUpdate={handleCategoriesUpdate} />
          </div>
      )}

      {/* --- PHẦN 3: TOPIC VIEW (Mới) --- */}
      {currentView === 'topics' && (
          <div className="fade-in">
              <TopicManagement />
          </div>
      )}

      {/* --- CUSTOM DELETE MODAL (Dùng chung) --- */}
      {deleteModal.isOpen && (
        <div className="custom-modal-overlay">
          <div className="custom-modal-content">
            <div className="custom-modal-icon">
              <AlertTriangle size={48} color="#ef4444" />
            </div>
            <h3 className="custom-modal-title">Bạn chắc chắn chứ?</h3>
            <p className="custom-modal-desc">
              Hành động này sẽ xóa vĩnh viễn trang này và không thể hoàn tác.
            </p>
            <div className="custom-modal-actions">
              <button 
                className="custom-btn-cancel" 
                onClick={closeDeleteModal}
                disabled={deleteModal.isDeleting}
              >
                Hủy bỏ
              </button>
              <button 
                className="custom-btn-confirm" 
                onClick={confirmDelete}
                disabled={deleteModal.isDeleting}
              >
                {deleteModal.isDeleting ? 'Đang xóa...' : 'Xóa ngay'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PageManagementPage;