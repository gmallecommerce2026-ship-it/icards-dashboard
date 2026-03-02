// src/Pages/AdminDashboard/AdminDashboard.js
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Routes, Route, NavLink, Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Home, ShoppingBag, LayoutTemplate, Settings, Search, Upload, Palette, Trash2, Edit, PlusCircle, Type, Image as ImageIcon, ChevronDown, Link as LinkIcon, Save, Columns, Eye, ToggleLeft, ToggleRight, ChevronsLeft, ChevronsRight, FileText, LogOut, Users, GripVertical, ListTree, ChevronUp, Video as VideoIcon } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import InvitationDesign from '../InvitationDesign/InvitationDesign'
import './AdminDashboard.css'
import AuthService from '../../services/auth.service';
import DesignAssetManagementPage from './DesignAssetManagementPage';
import UserManagementPage from './UserManagementPage';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import { Download } from '@mui/icons-material';
import { Checkbox, FormControlLabel } from '@mui/material';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import _ from 'lodash';
import SeoManagementPage from './SeoManagementPage';
import PageManagementPage from './PageManagementPage';
import CustomEditor from '../../components/CustomEditor';
import TaxonomyManagementPage from './TaxonomyManagementPage';
import FontManagementPage from './FontManagementPage';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import BulkDeleteModal from './BulkDeleteModal';
import { Select } from 'antd';
const { Option } = Select;
const CM_TO_PX = 37.795;
const MAX_DIMENSION_PX = 800;

const dataURLtoFile = (dataurl, filename) => {
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) return null;
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
};


// 2. Hàm chuyển đổi và giới hạn kích thước
const fitToCanvas = (widthCm, heightCm) => {
    let widthPx = widthCm * CM_TO_PX;
    let heightPx = heightCm * CM_TO_PX;
    const ratio = widthPx / heightPx;

    if (widthPx > MAX_DIMENSION_PX) {
        widthPx = MAX_DIMENSION_PX;
        heightPx = MAX_DIMENSION_PX / ratio;
    }
    if (heightPx > MAX_DIMENSION_PX) {
        heightPx = MAX_DIMENSION_PX;
        widthPx = MAX_DIMENSION_PX * ratio;
    }
    return { width: Math.round(widthPx), height: Math.round(heightPx) };
};

// 3. Định nghĩa các kích thước tiêu chuẩn
const STANDARD_SIZES = {
    "Thiệp Mời Sự Kiện": {
        "10 x 15 cm": fitToCanvas(10, 15),
        "12 x 17 cm": fitToCanvas(12, 17),
        "15 x 21 cm (A5)": fitToCanvas(14.8, 21),
        "A4 Dọc (21 x 29.7 cm)": fitToCanvas(21, 29.7),
    },
    "Thiệp Cưới": {
        "Nhỏ (8.5 x 12 cm)": fitToCanvas(8.5, 12),
        "Dài (9.5 x 22 cm)": fitToCanvas(9.5, 22),
        "Truyền thống (12 x 17 cm)": fitToCanvas(12, 17),
        "Vuông (15 x 15 cm)": fitToCanvas(15, 15),
    },
    "Thiệp Chúc Mừng & Cảm Ơn": {
        "Card Visit (9 x 5.4 cm)": fitToCanvas(9, 5.4),
        "Nhỏ (7 x 14 cm)": fitToCanvas(7, 14),
        "Trung bình (10 x 15 cm)": fitToCanvas(10, 15),
    },
};
// --- KẾT THÚC LOGIC KÍCH THƯỚC ---

const BulkTemplateModal = ({ isOpen, onClose, onSave }) => {
    const [file, setFile] = useState(null);
    const [fileName, setFileName] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && (selectedFile.name.toLowerCase().endsWith('.zip') || selectedFile.type === 'application/zip' || selectedFile.type === 'application/x-zip-compressed')) {
            setFile(selectedFile);
            setFileName(selectedFile.name);
        } else {
            toast.warn("Vui lòng chỉ chọn file .zip");
        }
    };

    const handleDownloadTemplate = async () => {
        setIsGenerating(true);
        toast.info("Đang tạo file mẫu, vui lòng chờ...");
        try {
            // 1. Lấy dữ liệu headerNav mới nhất từ backend
            const settings = await AuthService.getSettings();
            const headerNav = settings?.headerNav || [];

            if (headerNav.length === 0) {
                toast.error("Không có dữ liệu danh mục để tạo file mẫu. Vui lòng cấu hình trong 'Tuỳ chỉnh Giao diện > Điều hướng Header'.");
                return;
            }

            const zip = new JSZip();
            const workbook = XLSX.utils.book_new();

            // 2. Tạo các tổ hợp Category/Group/Type từ dữ liệu đã fetch
            const categoryCombinations = [];
            headerNav.forEach(category => {
                if (category.children && category.children.length > 0) {
                    category.children.forEach(group => {
                        if (group.children && group.children.length > 0) {
                            group.children.forEach(type => {
                                categoryCombinations.push({
                                    category: category.title,
                                    group: group.title,
                                    type: type.title
                                });
                            });
                        }
                    });
                }
            });
            
            if (categoryCombinations.length === 0) {
                toast.error("Dữ liệu danh mục không đầy đủ (thiếu Group hoặc Type). Vui lòng kiểm tra lại cấu trúc.");
                return;
            }

            // 3. Phần còn lại của logic tạo file giữ nguyên...
            const getCanvasSizeForCategory = (categoryTitle) => {
                let sizeKey;
                switch (categoryTitle) {
                    case "Thiệp Mời":
                    case "Thiệp Kinh Doanh":
                    case "Thiệp Theo Mùa":
                        sizeKey = "Thiệp Cưới";
                        break;
                    case "Thiệp Chúc Mừng":
                        sizeKey = "Thiệp Chúc Mừng & Cảm Ơn";
                        break;
                    default:
                        sizeKey = "Thiệp Mời Sự Kiện";
                        break;
                }
                const availableSizes = STANDARD_SIZES[sizeKey] || STANDARD_SIZES["Thiệp Mời Sự Kiện"];
                const sizeNames = Object.keys(availableSizes);
                const randomSizeName = sizeNames[Math.floor(Math.random() * sizeNames.length)];
                return availableSizes[randomSizeName];
            };

            const templatesData = [];
            for (let i = 1; i <= 50; i++) {
                const combination = categoryCombinations[i % categoryCombinations.length];
                const title = `Mẫu Thiệp ${combination.category} - ${combination.group} - ${combination.type} ${i}`;
                const canvasSize = getCanvasSizeForCategory(combination.category);

                for (let j = 1; j <= 4; j++) {
                    templatesData.push({
                        title: title,
                        category: combination.category,
                        group: combination.group,
                        type: combination.type,
                        description: `Mô tả chi tiết cho mẫu thiệp ${title}.`,
                        canvasWidth: canvasSize.width,
                        canvasHeight: canvasSize.height,
                        pageName: `Trang ${j}`,
                        pageBackgroundColor: j % 2 === 0 ? '#F8F9FA' : '#E9ECEF',
                        pageBackgroundImageName: `background_${i}_${j}.jpg`,
                        thumbnailName: `thumbnail_${i}.jpg`,
                        item1_type: 'text',
                        item1_content: j === 1 ? `Trân trọng kính mời` : `Save the Date`,
                        item1_position: 'top-center',
                        item1_font: 'Garamond',
                        item1_fontSize: 36,
                        item1_color: '#343a40',
                        item2_type: 'text',
                        item2_content: j === 1 ? `Bạn đến chung vui cùng gia đình chúng tôi` : `Ngày ${i % 28 + 1} tháng ${i % 12 + 1} năm 2026`,
                        item2_position: 'middle-center',
                        item2_font: 'Helvetica',
                        item2_fontSize: 18,
                        item2_color: '#6c757d',
                        item3_type: 'image',
                        item3_imageName: `decoration_${i}_${j}.png`,
                        item3_position: 'bottom-center',
                        item3_width: 150,
                        item3_height: 150,
                    });
                }
            }

            const worksheet = XLSX.utils.json_to_sheet(templatesData);
            XLSX.utils.book_append_sheet(workbook, worksheet, "data");
            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            zip.file("data.xlsx", new Blob([excelBuffer]));

            const imagesFolder = zip.folder("images");
            const placeholderImageUrl = 'https://placehold.co/800x1200/E9ECEF/333?text=Sample+Image';
            
            const response = await fetch(placeholderImageUrl);
            const imageBlob = await response.blob();

            const imageNames = new Set();
            templatesData.forEach(row => {
                if (row.pageBackgroundImageName) imageNames.add(row.pageBackgroundImageName);
                if (row.thumbnailName) imageNames.add(row.thumbnailName);
                if (row.item3_imageName) imageNames.add(row.item3_imageName);
            });

            imageNames.forEach(name => {
                imagesFolder.file(name, imageBlob);
            });

            const zipBlob = await zip.generateAsync({ type: "blob" });
            saveAs(zipBlob, "Mau_Nhap_Thiep_Hang_Loat.zip");
            toast.success("Đã tạo file mẫu thành công!");
        } catch (error) {
            console.error("Lỗi khi tạo file mẫu:", error);
            toast.error(error.response?.data?.message || "Không thể tạo file mẫu, vui lòng thử lại.");
        } finally {
            setIsGenerating(false);
        }
    };


    const handleSubmit = () => {
        if (!file) {
            toast.warn("Vui lòng chọn một file .zip.");
            return;
        }
        onSave(file);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Thêm hàng loạt Mẫu thiệp từ File Zip">
            <div className="modal-body">
                <p className="settings-item__description" style={{ marginBottom: '1.5rem', marginLeft: 0 }}>
                    Tải lên file .zip chứa file <strong>data.xlsx</strong> và thư mục <strong>images/</strong> để tạo nhanh nhiều mẫu thiệp.
                    Hệ thống sẽ tự động liên kết ảnh từ thư mục images dựa vào tên file được khai báo trong Excel.
                </p>
                <div className="form-group">
                    <label className="form-label">Tải file .zip của bạn</label>
                    <div className="file-upload-area">
                        <Upload size={24} />
                        <label htmlFor="zip-upload" className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                            Chọn File .zip
                        </label>
                        <input id="zip-upload" type="file" accept=".zip,application/zip,application/x-zip,application/x-zip-compressed" hidden onChange={handleFileChange} />
                        {fileName && <span style={{ marginLeft: '1rem' }}>{fileName}</span>}
                    </div>
                </div>

                <div className="settings-item__description" style={{ marginTop: '1.5rem', marginLeft: 0 }}>
                    <strong>Lưu ý:</strong> Cấu trúc file <strong>data.xlsx</strong> cần phải đúng theo mẫu.
                    Tất cả các ảnh được tham chiếu trong Excel phải có mặt trong thư mục <strong>images/</strong>.
                </div>
            </div>
            <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
                <button type="button" onClick={handleDownloadTemplate} className="btn btn-secondary" disabled={isGenerating}>
                    <Download size={18} /> {isGenerating ? 'Đang tạo...' : 'Tải file mẫu (.zip)'}
                </button>
                <div>
                    <button type="button" onClick={onClose} className="btn btn-secondary" style={{ marginRight: '0.5rem' }}>Hủy</button>
                    <button type="button" onClick={handleSubmit} className="btn btn-primary">Bắt đầu nhập</button>
                </div>
            </div>
        </Modal>
    );
};

const DragHandle = ({ ...props }) => (
    <div className="template-card__drag-handle" {...props}>
        <GripVertical size={24} color="#6B7280" />
    </div>
);

const SortableTemplateCard = ({ template, onEdit, onDelete, onStatusChange, onOrderChange }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: template._id });
    const navigate = useNavigate();
    const [order, setOrder] = useState(template.displayOrder);

    useEffect(() => {
        setOrder(template.displayOrder);
    }, [template.displayOrder]);


    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const handleOrderInputBlur = () => {
        const newOrder = parseInt(order, 10);
        if (!isNaN(newOrder) && newOrder !== template.displayOrder) {
            onOrderChange(template._id, newOrder);
        } else {
            // Hoàn tác lại giá trị cũ nếu input không hợp lệ hoặc không thay đổi
            setOrder(template.displayOrder);
        }
    };

    const handleOrderInputChange = (e) => {
        setOrder(e.target.value);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleOrderInputBlur();
            e.target.blur(); // Bỏ focus khỏi input
        }
    }


    return (
        <div ref={setNodeRef} style={style} className="template-card">
            {/* Tay nắm kéo thả riêng biệt */}
            <DragHandle {...attributes} {...listeners} />
            
            {/* SỬA LỖI: Đã loại bỏ onClick khỏi div này */}
            <div className="template-card__image-wrapper">
                <img src={template.imgSrc} alt={template.title} className="template-card__image" />
                <div className="template-card__overlay">
                    {/* Thêm e.stopPropagation() để đảm bảo an toàn */}
                    <button onClick={(e) => {e.stopPropagation(); navigate(`/dashboard/templates/design/${template._id}`)}} className="template-card__action-btn" title="Chỉnh sửa thiết kế"><Palette size={24} /></button>
                    <button onClick={(e) => {e.stopPropagation(); onEdit(template)}} className="template-card__action-btn" title="Chỉnh sửa thông tin"><Edit size={24} /></button>
                    <button onClick={(e) => {e.stopPropagation(); onDelete(template._id)}} className="template-card__action-btn" title="Xóa mẫu"><Trash2 size={24} /></button>
                </div>
            </div>
            <div className="template-card__info">
                {/* THAY ĐỔI: Thêm thuộc tính title */}
                <h4 className="template-card__name" title={template.title}>{template.title}</h4>
                <p className="template-card__category">{template.category}</p>
                 <div className="template-card__footer">
                    <div className="template-card__order-input-wrapper">
                        <label htmlFor={`order-${template._id}`}>Thứ tự:</label>
                        <input
                            id={`order-${template._id}`}
                            type="number"
                            value={order}
                            onChange={handleOrderInputChange}
                            onBlur={handleOrderInputBlur}
                            onKeyPress={handleKeyPress}
                            onClick={(e) => e.stopPropagation()} // Ngăn sự kiện click của card
                            className="template-card__order-input"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

// THÊM MỚI: Component Modal để xem trước website
const WebsiteReviewModal = ({ url, isOpen, onClose }) => {
    const modalRef = React.useRef(null);
    React.useEffect(() => {
        const handleEscape = (e) => e.key === 'Escape' && onClose();
        const handleClickOutside = (e) => {
            if (modalRef.current && !modalRef.current.contains(e.target)) onClose();
        };
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            document.addEventListener('keydown', handleEscape);
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.body.style.overflow = 'unset';
            document.removeEventListener('keydown', handleEscape);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="review-modal-overlay">
            <div className="review-modal-content" ref={modalRef}>
                <div className="review-modal-header">
                    <h3>Xem trước Trang web</h3>
                    <a href={url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">Mở trong tab mới</a>
                    <button onClick={onClose} className="review-modal-close" aria-label="Close modal">×</button>
                </div>
                <div className="review-modal-body">
                    <iframe
                        src={url}
                        title="Website Live Review"
                        className="review-iframe"
                        allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
                        sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
                    />
                </div>
            </div>
        </div>
    );
};


//================================================================================
// Authentication Components
//================================================================================
export const AuthContext = React.createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const validateSession = async () => {
            // Danh sách các vai trò được phép truy cập trang quản trị
            const allowedRoles = ['admin', 'designer', 'marketing'];
            try {
                const response = await AuthService.getMe();
                // Kiểm tra xem người dùng có tồn tại và vai trò có được phép không
                if (response.success && response.data && allowedRoles.includes(response.data.role)) {
                    setUser(response.data);
                    setIsAuthenticated(true);
                } else {
                    setUser(null);
                    setIsAuthenticated(false);
                }
            } catch (error) {
                console.error("Session validation failed:", error);
                setUser(null);
                setIsAuthenticated(false);
            } finally {
                setLoading(false);
            }
        };

        validateSession();
    }, []);

    const login = async (username, password) => {
        const data = await AuthService.login(username, password);
        // Danh sách các vai trò được phép truy cập trang quản trị
        const allowedRoles = ['admin', 'designer', 'marketing'];

        // Kiểm tra xem vai trò của người dùng có nằm trong danh sách được phép không
        if (data && data.user && allowedRoles.includes(data.user.role)) {
            setUser(data.user);
            setIsAuthenticated(true);
            return data;
        } else if (data && data.user) { // Người dùng có tài khoản nhưng không có quyền
            logout();
            throw new Error('Tài khoản này không có quyền truy cập vào trang quản trị.');
        }
        // Các trường hợp khác (sai mật khẩu, user không tồn tại) sẽ được AuthService xử lý
        return data;
    };

    const logout = async () => {
        await AuthService.logout();
        setUser(null);
        setIsAuthenticated(false);
    };

    const value = { user, isAuthenticated, login, logout, loading };

    if (loading) {
        return <div className="loading-spinner"><div className="loading-spinner__icon"></div></div>;
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};


export const useAuth = () => {
  return useContext(AuthContext);
};

const AdminRoute = ({ children, roles }) => {
    const { user, isAuthenticated, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <div className="loading-spinner"><div className="loading-spinner__icon"></div></div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login-admin" state={{ from: location }} replace />;
    }

    if (roles && !roles.includes(user.role)) {
        return <Navigate to="/dashboard" state={{ from: location }} replace />;
    }

    return children;
};


//================================================================================
// Admin Layout Components
//================================================================================
const Sidebar = ({ isCollapsed, toggleSidebar }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const allNavItems = [
        // Vai trò: 'admin'
        { to: "/dashboard", icon: <Home size={20} />, text: "Dashboard", roles: ['admin'] },
        { to: "/dashboard/users", icon: <Users size={20} />, text: "Quản lý Người dùng", roles: ['admin'] },

        // Vai trò: 'admin', 'marketing'
        { to: "/dashboard/categories", icon: <ListTree size={20} />, text: "Quản lý Danh mục", roles: ['admin', 'marketing'] }, // Route mới
        { to: "/dashboard/pages", icon: <FileText size={20} />, text: "Quản lý bài viết", roles: ['admin', 'marketing'] },
        { to: "/dashboard/fonts", icon: <Type size={20} />, text: "Quản lý Fonts", roles: ['admin', 'designer'] },

        // Vai trò: 'admin', 'designer'
        { to: "/dashboard/products", icon: <ShoppingBag size={20} />, text: "Quản lý Sản phẩm", roles: ['admin', 'designer'] },
        { to: "/dashboard/templates", icon: <LayoutTemplate size={20} />, text: "Quản lý Mẫu thiệp", roles: ['admin', 'designer'] },
        { to: "/dashboard/design-assets", icon: <Palette size={20} />, text: "Tài sản Thiết kế", roles: ['admin', 'designer'] },

        // Vai trò: 'admin', 'marketing'
        { to: "/dashboard/settings", icon: <Settings size={20} />, text: "Tuỳ chỉnh Giao diện", roles: ['admin', 'marketing'] },
        { to: "/dashboard/seo", icon: <Search size={20} />, text: "Quản lý SEO", roles: ['admin', 'marketing'] },
    ];

    const navItems = allNavItems.filter(item => user && item.roles.includes(user.role));

    const handleLogout = async () => { await logout(); navigate('/login-admin', { replace: true }); };

    return (
        <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header"><span className="logo-text">iCards</span></div>
            <nav className="sidebar__nav">
                <ul className="sidebar__nav-list">
                    {navItems.map((item) => (
                        <li key={item.to}>
                            <NavLink
                                to={item.to}
                                end
                                className={({ isActive }) => `sidebar__nav-link ${isActive ? "active" : ""}`}
                                title={item.text}
                            >
                                <span className="sidebar__nav-icon">{item.icon}</span>
                                {!isCollapsed && <span className="sidebar__nav-text">{item.text}</span>}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>
            <div className="sidebar-footer">
                <button onClick={handleLogout} className="sidebar__nav-link logout-btn" title="Đăng xuất"><span className="sidebar__nav-icon"><LogOut size={20} /></span>{!isCollapsed && <span className="sidebar__nav-text">Đăng xuất</span>}</button>
                <div className="sidebar-toggle-wrapper"><button onClick={toggleSidebar} className="sidebar-toggle">{isCollapsed ? <ChevronsRight size={20} /> : <ChevronsLeft size={20} />}</button></div>
            </div>
        </aside>
    );
};


const AdminHeader = ({ title }) => (
    <header className="admin-header">
        <h1 className="admin-header__title">{title}</h1>
    </header>
);

const AdminLayout = () => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
    const toggleSidebar = () => setIsSidebarCollapsed(prev => !prev);

    return (
        <div className={`admin-layout ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
            <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
            <main className="main-content">
                <div className="main-content__page">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

//================================================================================
// Reusable UI Components
//================================================================================
const StatsCard = ({ title, value, icon, color }) => (
    <div className="stats-card">
        <div className={`stats-card__icon-wrapper stats-card__icon-wrapper--${color}`}>
            {React.cloneElement(icon, { color: 'white' })}
        </div>
        <div>
            <p className="stats-card__title">{title}</p>
            <p className="stats-card__value">{value}</p>
        </div>
    </div>
);

const LoadingSpinner = () => (
    <div className="loading-spinner"><div className="loading-spinner__icon"></div></div>
);

const Modal = ({ isOpen, onClose, title, children, size = 'default' }) => {
    if (!isOpen) return null;
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className={`modal-content modal-content--${size}`} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">{title}</h3>
                    <button onClick={onClose} className="modal-close-btn">×</button>
                </div>
                {children}
            </div>
        </div>
    );
};

//================================================================================
// Admin Pages
//================================================================================

// --- BẮT ĐẦU THAY ĐỔI ---
// Loại bỏ logic tab khỏi DashboardPage
const DashboardPage = () => {
    const [stats, setStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const response = await AuthService.getDashboardData();
                setStats(response.stats);
            } catch (error) {
                console.error("Lỗi khi tải dữ liệu dashboard:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    if (isLoading) return <LoadingSpinner />;

    return (
        <div>
            <AdminHeader title="Dashboard" />
            <div className="dashboard__grid dashboard__grid--stats" style={{marginTop: '1.5rem'}}>
                <StatsCard title="Lượng truy cập (hôm nay)" value={stats?.dailyVisitors?.length > 0 ? stats.dailyVisitors[stats.dailyVisitors.length - 1].uv : 0} icon={<Eye />} color="blue" />
                <StatsCard title="Tổng sản phẩm" value={stats?.totalProducts ?? 0} icon={<ShoppingBag />} color="green" />
                <StatsCard title="Tổng mẫu thiệp" value={stats?.totalTemplates ?? 0} icon={<LayoutTemplate />} color="yellow" />
                <StatsCard title="Tổng người dùng" value={stats?.totalUsers ?? 0} icon={<Users />} color="purple" />
            </div>
        </div>
    );
};

const ProductManagementPage = () => {
    const [products, setProducts] = React.useState([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [editingProduct, setEditingProduct] = React.useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');

    const productCategories = ['Phụ kiện trang trí', 'Quà tặng', 'Shop - Service', 'Tổ chức sự kiện'];

    const fetchProducts = React.useCallback(async () => {
        setIsLoading(true);
        try {
            // Chúng ta sẽ lấy tất cả sản phẩm khớp với từ khóa tìm kiếm
            const data = await AuthService.getProducts(searchTerm);
            setProducts(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(`Lỗi tải sản phẩm: ${error.message}`);
        }
        setIsLoading(false);
    }, [searchTerm]);

    React.useEffect(() => {
        const debounceTimer = setTimeout(() => {
            fetchProducts();
        }, 500);
        return () => clearTimeout(debounceTimer);
    }, [fetchProducts]);

    // *** ĐÂY LÀ PHẦN QUAN TRỌNG NHẤT ĐỂ SỬA LỖI ***
    // Sử dụng useMemo để lọc danh sách sản phẩm mỗi khi bộ lọc thay đổi
    const filteredProducts = useMemo(() => {
        return products
            .filter(product => {
                // Lọc theo danh mục
                if (categoryFilter === 'all') return true;
                return product.category === categoryFilter;
            })
            .filter(product => {
                // Lọc theo khoảng giá
                const price = product.price;
                // Nếu không nhập minPrice, coi như min là 0
                const min = minPrice ? parseFloat(minPrice) : 0;
                // Nếu không nhập maxPrice, coi như max là vô cùng
                const max = maxPrice ? parseFloat(maxPrice) : Infinity;
                return price >= min && price <= max;
            });
    }, [products, categoryFilter, minPrice, maxPrice]);
    // *** KẾT THÚC PHẦN SỬA LỖI ***

    const handleOpenModal = (product = null) => { setEditingProduct(product); setIsModalOpen(true); };
    const handleCloseModal = () => { setIsModalOpen(false); setEditingProduct(null); };

    const handleSaveProduct = async (productData) => {
        const formData = new FormData();

        // Thêm các trường văn bản
        formData.append('title', productData.title);
        formData.append('price', productData.price);
        formData.append('category', productData.category);
        formData.append('description', productData.description); // Thêm mô tả

        // Thêm ảnh đại diện và thư viện ảnh
        if (productData.imgSrc && productData.imgSrc instanceof File) {
             formData.append('image', productData.imgSrc);
        }
        if (productData.images && Array.isArray(productData.images)) {
             productData.images.forEach(file => {
                if (file instanceof File) {
                    formData.append('images', file);
                }
             });
        }

        try {
            if (editingProduct) {
                // ... (logic cập nhật)
                await AuthService.updateProduct({ ...productData, id: editingProduct._id });
                toast.success('Cập nhật sản phẩm thành công!');
            } else {
                // ... (logic thêm mới)
                await AuthService.addProduct(productData);
                toast.success('Thêm sản phẩm mới thành công!');
            }
            fetchProducts();
            handleCloseModal();
        } catch (error) {
            console.error(error.response?.data?.message || 'Lưu sản phẩm thất bại.');
        }
    };


    const handleDeleteProduct = async (productId) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
            try {
                await AuthService.deleteProduct(productId);
                toast.success('Xóa sản phẩm thành công!');
                fetchProducts();
            } catch (error) {
                console.error(error.response?.data?.message || 'Xóa sản phẩm thất bại.');
            }
        }
    };

    return (
        <div>
            <AdminHeader title="Quản lý Sản phẩm" />
            <div className="page-header-actions">
                <div className="search-and-filter">
                    <div className="search-box">
                       <Search size={20} className="search-box__icon" />
                       <input
                           type="text"
                           placeholder="Tìm kiếm theo tên..."
                           className="form-control"
                           value={searchTerm}
                           onChange={(e) => setSearchTerm(e.target.value)}
                       />
                    </div>
                     <select
                        className="form-control"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                        <option value="all">Tất cả danh mục</option>
                        {productCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    <input
                        type="number"
                        placeholder="Giá thấp nhất"
                        className="form-control"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        style={{width: '150px'}}
                    />
                     <input
                        type="number"
                        placeholder="Giá cao nhất"
                        className="form-control"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        style={{width: '150px'}}
                    />
                </div>
                <button onClick={() => handleOpenModal()} className="btn btn-primary"><PlusCircle size={20} /> Thêm sản phẩm</button>
            </div>
            <div className="table-container">
                {isLoading ? <LoadingSpinner /> : (
                    <table className="table">
                        <thead><tr><th>Ảnh</th><th>Tiêu đề sản phẩm</th><th>Giá</th><th>Danh mục</th><th>Hành động</th></tr></thead>
                        <tbody>
                            {/* Thay đổi ở đây: dùng filteredProducts */}
                            {filteredProducts.map(p => (
                                <tr key={p._id}>
                                    <td><img src={p.imgSrc} alt={p.title} className="table__image" /></td>
                                    <td>{p.title}</td>
                                    <td>{p.price.toLocaleString()} VNĐ</td>
                                    <td>{p.category}</td>
                                    <td className="table__actions">
                                        <button onClick={() => handleOpenModal(p)} className="edit-btn" title="Chỉnh sửa"><Edit size={20} /></button>
                                        <button onClick={() => handleDeleteProduct(p._id)} className="delete-btn" title="Xóa"><Trash2 size={20} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
            <ProductModal isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSaveProduct} product={editingProduct} />
        </div>
    );
};

const ProductModal = ({ isOpen, onClose, onSave, product }) => {
    const [formData, setFormData] = React.useState({ title: '', price: '', category: '', description: '', imgSrc: null, images: [] });
    const [previews, setPreviews] = React.useState({ imgSrc: '', images: [] });

    React.useEffect(() => {
        if (product) {
            setFormData({ title: product.title || '', price: product.price || '', category: product.category || '', description: product.description || '', imgSrc: product.imgSrc || null, images: product.images || [] });
            setPreviews({ imgSrc: product.imgSrc || '', images: product.images || [] });
        } else {
            setFormData({ title: '', price: '', category: 'Phụ kiện trang trí', description: '', imgSrc: null, images: [] });
            setPreviews({ imgSrc: '', images: [] });
        }
    }, [product, isOpen]);

    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleMainImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFormData(prev => ({ ...prev, imgSrc: file }));
            setPreviews(prev => ({ ...prev, imgSrc: URL.createObjectURL(file) }));
        }
    };

    const handleGalleryImagesChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files);
            setFormData(prev => ({ ...prev, images: [...prev.images, ...files] }));
            const newPreviews = files.map(file => URL.createObjectURL(file));
            setPreviews(prev => ({ ...prev, images: [...prev.images, ...newPreviews] }));
        }
    };

    const removeGalleryImage = (indexToRemove) => {
        setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== indexToRemove) }));
        setPreviews(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== indexToRemove) }));
    };
    
    const handleSubmit = (e) => { e.preventDefault(); onSave(formData); };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={product ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}>
            <form onSubmit={handleSubmit}>
                {/* Áp dụng CSS overflow-y: auto cho class này */}
                <div className="modal-body">
                    <div className="form-grid-2-col">
                        {/* Cột 1: Thông tin chính */}
                        <div>
                            <div className="form-group">
                                <label className="form-label">Tiêu đề sản phẩm</label>
                                <input type="text" name="title" value={formData.title} onChange={handleChange} className="form-control" required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Mô tả</label>
                                <CustomEditor
                                    data={formData.description || ""}
                                    onChange={(data) => {
                                        setFormData(prev => ({ ...prev, description: data }));
                                    }}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Giá (VNĐ)</label>
                                <input type="number" name="price" value={formData.price} onChange={handleChange} className="form-control" required />
                            </div>
                        </div>

                        {/* Cột 2: Danh mục và Ảnh */}
                        <div>
                            <div className="form-group">
                                <label className="form-label">Danh mục</label>
                                <select name="category" value={formData.category} onChange={handleChange} className="form-control" required>
                                    <option value="Phụ kiện trang trí">Phụ kiện trang trí</option>
                                    <option value="Quà tặng">Quà tặng</option>
                                    <option value="Shop - Service">Shop - Service</option>
                                    <option value="Tổ chức sự kiện">Tổ chức sự kiện</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Ảnh đại diện</label>
                                <div className="image-upload-preview single">
                                    {previews.imgSrc && <img src={previews.imgSrc} alt="Preview"/>}
                                    <label className="btn btn-secondary btn-sm"><Upload size={16}/> {previews.imgSrc ? 'Thay đổi' : 'Tải lên'}<input type="file" accept="image/*" hidden onChange={handleMainImageChange}/></label>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Thư viện ảnh</label>
                                <div className="gallery-upload-container">
                                    {previews.images.map((imgUrl, index) => (
                                        <div key={index} className="gallery-image-item">
                                            <img src={imgUrl} alt={`Gallery item ${index + 1}`}/>
                                            <button type="button" onClick={() => removeGalleryImage(index)} className="delete-btn-overlay">×</button>
                                        </div>
                                    ))}
                                    <label className="gallery-add-btn"><PlusCircle size={24}/><span>Thêm ảnh</span><input type="file" accept="image/*" multiple hidden onChange={handleGalleryImagesChange}/></label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Phần footer này sẽ luôn hiển thị đúng vị trí sau khi sửa CSS */}
                <div className="modal-footer">
                    <button type="button" onClick={onClose} className="btn btn-secondary">Hủy</button>
                    <button type="submit" className="btn btn-primary">Lưu sản phẩm</button>
                </div>
            </form>
        </Modal>
    );
};


const TemplateManagementPage = () => {
    const [templates, setTemplates] = React.useState([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [editingTemplate, setEditingTemplate] = React.useState(null);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const navigate = useNavigate();
    const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
    const [filtersForDeletion, setFiltersForDeletion] = useState({});

    const [categories, setCategories] = useState([]);
    const [groups, setGroups] = useState([]);
    const [types, setTypes] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedGroup, setSelectedGroup] = useState('all');
    const [selectedType, setSelectedType] = useState('all');

    const fetchTemplates = React.useCallback(async (currentSearchTerm, category, group, type) => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (currentSearchTerm) params.append('search', currentSearchTerm);
            if (category && category !== 'all') params.append('category', category);
            if (group && group !== 'all') params.append('group', group);
            if (type && type !== 'all') params.append('type', type);

            const responseData = await AuthService.getTemplates(params.toString());
            const templatesWithOrder = (responseData.data || []).map((template, index) => ({
                ...template,
                displayOrder: index + 1
            }));
            setTemplates(templatesWithOrder);
        } catch (error) {
            console.error("Lỗi khi tải mẫu thiệp.");
            setTemplates([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleBulkSave = async (file) => {
        setIsLoading(true);
        try {
            await AuthService.bulkAddTemplates(file);
            toast.success("Đã thêm các mẫu thiệp từ file zip thành công!");
            fetchTemplates(searchTerm, selectedCategory, selectedGroup, selectedType);
            setIsBulkModalOpen(false);
        } catch (error) {
            console.error("Lỗi khi nhập file zip:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusChange = async (templateId, newIsActiveStatus) => {
        try {
            const formData = new FormData();
            formData.append('id', templateId);
            formData.append('isActive', newIsActiveStatus);

            await AuthService.updateTemplate(formData);

            toast.success("Cập nhật trạng thái thành công!");
            setTemplates(prevTemplates =>
                prevTemplates.map(t =>
                    t._id === templateId ? { ...t, isActive: newIsActiveStatus } : t
                )
            );
        } catch (error) {
            console.error(error.response?.data?.message || "Cập nhật trạng thái thất bại.");
        }
    };


    useEffect(() => {
        const fetchInitialCategories = async () => {
            try {
                const response = await AuthService.getTemplateCategories();
                if (response.status === 'success') {
                    setCategories(response.data);
                }
            } catch (error) {
                console.error("Không thể tải danh sách danh mục.");
            }
        };
        fetchInitialCategories();
    }, []);

    useEffect(() => {
        const fetchGroupsForCategory = async () => {
            if (selectedCategory && selectedCategory !== 'all') {
                try {
                    const response = await AuthService.getTemplateGroups(selectedCategory);
                    if (response.status === 'success') setGroups(response.data);
                } catch (error) {
                    console.error("Không thể tải danh sách nhóm.");
                }
            }
        };
        setGroups([]);
        setSelectedGroup('all');
        setTypes([]);
        setSelectedType('all');
        fetchGroupsForCategory();
    }, [selectedCategory]);

    useEffect(() => {
        const fetchTypesForGroup = async () => {
            if (selectedGroup && selectedGroup !== 'all' && groups.length > 0) {
                try {
                    const response = await AuthService.getTemplateTypesForGroup(selectedCategory, selectedGroup);
                    if (response.status === 'success') setTypes(response.data);
                } catch (error) {
                    console.error("Không thể tải danh sách loại.");
                }
            }
        };
        setTypes([]);
        setSelectedType('all');
        fetchTypesForGroup();
    }, [selectedGroup, selectedCategory, groups]);

    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            fetchTemplates(searchTerm, selectedCategory, selectedGroup, selectedType);
        }, 300);
        return () => clearTimeout(debounceTimer);
    }, [searchTerm, selectedCategory, selectedGroup, selectedType, fetchTemplates]);


    const handleOpenModal = (template = null) => { setEditingTemplate(template); setIsModalOpen(true); };
    const handleCloseModal = () => { setIsModalOpen(false); setEditingTemplate(null); };

    // ++ START: SỬA LỖI & CẬP NHẬT LOGIC LƯU MẪU ++
    const handleSaveTemplate = async (templateDataObject) => {
        const formData = new FormData();
    
        // Lặp qua tất cả các thuộc tính trong object dữ liệu và thêm vào FormData
        for (const key in templateDataObject) {
            const value = templateDataObject[key];
            if (key === 'loveGiftsButton' && value !== null) {
                formData.append(key, JSON.stringify(value));
            } else if (key === 'imgSrc' && value instanceof File) {
                formData.append('image', value);
            } else {
                formData.append(key, value);
            }
        }
    
        try {
            if (editingTemplate) {
                formData.append('id', editingTemplate._id);
                await AuthService.updateTemplate(formData);
                toast.success("Cập nhật mẫu thành công!");
            } else {
                const response = await AuthService.addTemplate(formData);
                toast.success("Thêm mẫu mới thành công! Chuyển đến trang thiết kế...");
                navigate(`/dashboard/templates/design/${response.data._id}`);
            }
            fetchTemplates(searchTerm, selectedCategory, selectedGroup, selectedType);
            handleCloseModal();
        } catch(error) {
            const errorMessage = error.response?.data?.message || "Lưu mẫu thất bại.";
            toast.error(errorMessage);
            console.error(errorMessage);
        }
    };
    // ++ END: SỬA LỖI & CẬP NHẬT LOGIC LƯU MẪU ++

    const handleDeleteTemplate = async (templateId) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa mẫu này?')) {
            try {
                await AuthService.deleteTemplate(templateId);
                toast.success("Xóa mẫu thành công!");
                fetchTemplates(searchTerm, selectedCategory, selectedGroup, selectedType);
            } catch (error) {
                console.error(error.response?.data?.message || "Xóa mẫu thất bại.");
            }
        }
    };

    const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            const oldIndex = templates.findIndex(t => t._id === active.id);
            const newIndex = templates.findIndex(t => t._id === over.id);

            const reorderedTemplates = arrayMove(templates, oldIndex, newIndex);
            const updatedTemplatesForUI = reorderedTemplates.map((template, index) => ({
                ...template,
                displayOrder: index + 1,
            }));
            setTemplates(updatedTemplatesForUI);

            const templateIds = updatedTemplatesForUI.map(t => t._id);
            try {
                await AuthService.reorderTemplates(templateIds);
                toast.success("Cập nhật thứ tự thành công!");
            } catch (error) {
                console.error("Cập nhật thứ tự thất bại. Đang hoàn tác...");
                setTemplates(templates);
            }
        }
    };

    const handleOrderChange = async (templateId, newOrder) => {
        const updatedTemplates = templates.map(t =>
            t._id === templateId ? { ...t, displayOrder: (newOrder - 1) } : t
        );

        const sortedTemplates = [...updatedTemplates].sort((a, b) => a.displayOrder - b.displayOrder);

        const finalTemplatesForUI = sortedTemplates.map((template, index) => ({
            ...template,
            displayOrder: index + 1,
        }));
        setTemplates(finalTemplatesForUI);

        const templateIds = finalTemplatesForUI.map(t => t._id);

        try {
            await AuthService.reorderTemplates(templateIds);
            toast.success("Cập nhật thứ tự thành công!");
        } catch (error) {
            console.error("Cập nhật thứ tự thất bại. Đang hoàn tác...");
            toast.error("Lỗi: Không thể cập nhật thứ tự.");
            setTemplates(templates);
        }
    };

    const handleOpenBulkDeleteModal = () => {
        const filters = {
            category: selectedCategory !== 'all' ? selectedCategory : null,
            group: selectedGroup !== 'all' ? selectedGroup : null,
            type: selectedType !== 'all' ? selectedType : null,
        };
        if (Object.values(filters).every(v => v === null)) {
            toast.warn('Vui lòng chọn ít nhất một bộ lọc (Danh mục, Nhóm, hoặc Loại) để thực hiện xóa hàng loạt.');
            return;
        }
        setFiltersForDeletion(filters);
        setIsBulkDeleteModalOpen(true);
    };

    return (
        <div>
            <AdminHeader title="Quản lý Mẫu thiệp" />
            <div className="template-filter-container">
                <div className="card template-category-filter">
                    <div className="taxonomy-selector-grid">
                        <div className="taxonomy-selector-column">
                            <div
                                className={`taxonomy-selector-item ${selectedCategory === 'all' ? 'selected' : ''}`}
                                onClick={() => setSelectedCategory('all')}
                            >
                                Tất cả Danh mục
                            </div>
                            {categories.map(cat => (
                                <div
                                    key={cat}
                                    className={`taxonomy-selector-item ${selectedCategory === cat ? 'selected' : ''}`}
                                    onClick={() => setSelectedCategory(cat)}
                                >
                                    {cat}
                                </div>
                            ))}
                        </div>
                        <div className="taxonomy-selector-column">
                            {selectedCategory !== 'all' ? (
                                <>
                                    <div
                                        className={`taxonomy-selector-item ${selectedGroup === 'all' ? 'selected' : ''}`}
                                        onClick={() => setSelectedGroup('all')}
                                    >
                                        Tất cả Nhóm
                                    </div>
                                    {groups.map(grp => (
                                        <div
                                            key={grp}
                                            className={`taxonomy-selector-item ${selectedGroup === grp ? 'selected' : ''}`}
                                            onClick={() => setSelectedGroup(grp)}
                                        >
                                            {grp}
                                        </div>
                                    ))}
                                </>
                            ) : (
                                <div className="taxonomy-selector-placeholder">
                                    <span>Chọn một danh mục để xem các nhóm</span>
                                </div>
                            )}
                        </div>
                        <div className="taxonomy-selector-column">
                            {selectedGroup !== 'all' && selectedCategory !== 'all' ? (
                                <>
                                    <div
                                        className={`taxonomy-selector-item ${selectedType === 'all' ? 'selected' : ''}`}
                                        onClick={() => setSelectedType('all')}
                                    >
                                        Tất cả Loại
                                    </div>
                                    {types.map(type => (
                                        <div
                                            key={type}
                                            className={`taxonomy-selector-item ${selectedType === type ? 'selected' : ''}`}
                                            onClick={() => setSelectedType(type)}
                                        >
                                            {type}
                                        </div>
                                    ))}
                                </>
                            ) : (
                                <div className="taxonomy-selector-placeholder">
                                    <span>Chọn một nhóm để xem các loại</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="template-filter-actions">
                    <div className="search-box">
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo tên..."
                            className="form-control"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="action-buttons-group">
                        <button onClick={() => setIsBulkModalOpen(true)} className="btn btn-green">
                            <Upload size={18} /> Thêm hàng loạt (.zip)
                        </button>
                        <button onClick={() => handleOpenModal()} className="btn btn-primary">
                            <PlusCircle size={18} /> Thêm mẫu mới
                        </button>
                        <button onClick={handleOpenBulkDeleteModal} className="btn btn-danger">
                            <Trash2 size={18} /> Xóa hàng loạt theo bộ lọc
                        </button>
                    </div>
                </div>

            </div>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={templates.map(t => t._id)} strategy={verticalListSortingStrategy}>
                    <div className="template-grid">
                        {isLoading ? <LoadingSpinner /> : templates.map(template => (
                            <SortableTemplateCard
                                key={template._id}
                                template={template}
                                onEdit={handleOpenModal}
                                onDelete={handleDeleteTemplate}
                                onStatusChange={handleStatusChange}
                                onOrderChange={handleOrderChange}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
            <TemplateModal isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSaveTemplate} template={editingTemplate} />
            <BulkTemplateModal isOpen={isBulkModalOpen} onClose={() => setIsBulkModalOpen(false)} onSave={handleBulkSave} />
            <BulkDeleteModal
                visible={isBulkDeleteModalOpen}
                onCancel={(isSuccess) => {
                    setIsBulkDeleteModalOpen(false);
                    if (isSuccess) {
                        fetchTemplates(searchTerm, selectedCategory, selectedGroup, selectedType);
                    }
                }}
                filters={filtersForDeletion}
            />
        </div>
    );
};

// ================================================================================
// START: TEMPLATE MODAL REFACTOR (UI AND LOGIC UPDATED)
// ================================================================================
const TemplateModal = ({ isOpen, onClose, onSave, template }) => {
    const [formData, setFormData] = useState({
        title: '',
        category: '',
        group: '',
        type: '',
        description: '',
        templateData: '',
        isActive: true,
        loveGiftsButton_isEnabled: false,
        loveGiftsButton_text: '',
        loveGiftsButton_link: '',
    });

    const [categories, setCategories] = useState([]);
    const [groups, setGroups] = useState([]);
    const [types, setTypes] = useState([]);

    useEffect(() => {
        const fetchCategories = async () => {
            if (isOpen) {
                try {
                    const response = await AuthService.getTemplateCategories();
                    if (response.status === 'success') setCategories(response.data);
                } catch (error) { toast.error("Không thể tải danh sách danh mục."); }
            }
        };
        fetchCategories();
    }, [isOpen]);

    useEffect(() => {
        const fetchGroups = async () => {
            if (isOpen && formData.category) {
                try {
                    const response = await AuthService.getTemplateGroups(formData.category);
                    if (response.status === 'success') setGroups(response.data);
                } catch (error) { toast.error("Không thể tải danh sách nhóm."); setGroups([]); }
            } else { setGroups([]); }
        };
        fetchGroups();
    }, [formData.category, isOpen]);

    useEffect(() => {
        const fetchTypes = async () => {
            if (isOpen && formData.category && formData.group) {
                try {
                    const response = await AuthService.getTemplateTypesForGroup(formData.category, formData.group);
                    if (response.status === 'success') setTypes(response.data);
                } catch (error) { toast.error("Không thể tải danh sách loại."); setTypes([]); }
            } else { setTypes([]); }
        };
        fetchTypes();
    }, [formData.group, formData.category, isOpen]);
    
    useEffect(() => {
        if (isOpen) {
            if (template) {
                const giftButtonConfig = template.loveGiftsButton || { isEnabled: false, text: '', link: '' };
                setFormData({
                    title: template.title || '',
                    category: template.category || '',
                    group: template.group || '',
                    type: template.type || '',
                    description: template.description || '',
                    templateData: JSON.stringify(template.templateData, null, 2) || '',
                    isActive: template.isActive,
                    loveGiftsButton_isEnabled: giftButtonConfig.isEnabled,
                    loveGiftsButton_text: giftButtonConfig.text || '',
                    loveGiftsButton_link: giftButtonConfig.link || '',
                });
            } else {
                setFormData({
                    title: '', category: '', group: '', type: '', description: '',
                    templateData: '{\n  "width": 800,\n  "height": 600,\n  "pages": []\n}',
                    isActive: true, loveGiftsButton_isEnabled: false, loveGiftsButton_text: '', loveGiftsButton_link: '',
                });
            }
        }
    }, [template, isOpen]);

    const handleCategorySelect = (field, value) => {
        if (formData[field] === value) return;
        if (field === 'category') setFormData(prev => ({ ...prev, category: value, group: '', type: '' }));
        else if (field === 'group') setFormData(prev => ({ ...prev, group: value, type: '' }));
        else setFormData(prev => ({ ...prev, [field]: value }));
    };
    
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.category || !formData.group || !formData.type) {
            toast.warn('Vui lòng chọn đầy đủ Danh mục, Nhóm và Loại.');
            return;
        }

        const saveData = { ...formData };
        saveData.loveGiftsButton = formData.loveGiftsButton_isEnabled
            ? { isEnabled: true, text: formData.loveGiftsButton_text, link: formData.loveGiftsButton_link }
            : null;
        
        delete saveData.loveGiftsButton_isEnabled;
        delete saveData.loveGiftsButton_text;
        delete saveData.loveGiftsButton_link;

        // CHỈ tự động tạo ảnh khi TẠO MỚI
        if (!template) {
            toast.info("Đang tạo ảnh đại diện tạm thời...");

            const canvas = document.createElement('canvas');
                canvas.width = 400;
                canvas.height = 600;
                const ctx = canvas.getContext('2d');


            ctx.fillStyle = '#f0f2f5';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#6c757d';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            ctx.font = 'bold 28px Arial';
            const title = formData.title || 'Mẫu Thiệp Mới';
            const words = title.split(' ');
            let line = '';
            let y = canvas.height / 2 - 20;
            for(let n = 0; n < words.length; n++) {
                let testLine = line + words[n] + ' ';
                let testWidth = ctx.measureText(testLine).width;
                if (testWidth > canvas.width - 40 && n > 0) {
                    ctx.fillText(line.trim(), canvas.width / 2, y);
                    line = words[n] + ' ';
                    y += 35;
                } else {
                    line = testLine;
                }
            }
            ctx.fillText(line.trim(), canvas.width / 2, y);
            
            ctx.font = '16px Arial';
            ctx.fillText('(Ảnh đại diện tạm thời)', canvas.width / 2, y + 40);

            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                const generatedFile = dataURLtoFile(dataUrl, 'placeholder_thumbnail.jpg');

                if (generatedFile) {
                    saveData.imgSrc = generatedFile; // Gán ảnh đã tạo để gửi đi
                } else {
                    toast.error("Không thể tạo ảnh đại diện. Vui lòng thử lại.");
                    return; 
                }


        }
        
        onSave(saveData);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={template ? 'Chỉnh sửa Mẫu thiệp' : 'Thêm Mẫu thiệp mới'} size="large">
            <div className="modal-body">
                <form onSubmit={handleSubmit}>
                    <div className="form-grid-2-col">
                        <div>
                            <div className="form-group"><label className="form-label">Tiêu đề Mẫu *</label><input type="text" name="title" value={formData.title} onChange={handleChange} className="form-control" required /></div>
                            
                            <div className="form-group">
                                <label className="form-label">Phân loại *</label>
                                <div className="taxonomy-selector-grid">
                                    <div className="taxonomy-selector-column">
                                        {categories.map(cat => (
                                            <div key={cat} className={`taxonomy-selector-item ${formData.category === cat ? 'selected' : ''}`} onClick={() => handleCategorySelect('category', cat)}>{cat}</div>
                                        ))}
                                    </div>
                                    <div className="taxonomy-selector-column">
                                        {formData.category && groups.length > 0 ? (
                                            groups.map(grp => (
                                                <div key={grp} className={`taxonomy-selector-item ${formData.group === grp ? 'selected' : ''}`} onClick={() => handleCategorySelect('group', grp)}>{grp}</div>
                                            ))
                                        ) : ( <div className="taxonomy-selector-placeholder"><span>Chọn danh mục...</span></div> )}
                                    </div>
                                    <div className="taxonomy-selector-column">
                                        {formData.group && types.length > 0 ? (
                                            types.map(typ => (
                                                <div key={typ} className={`taxonomy-selector-item ${formData.type === typ ? 'selected' : ''}`} onClick={() => handleCategorySelect('type', typ)}>{typ}</div>
                                            ))
                                        ) : ( <div className="taxonomy-selector-placeholder"><span>Chọn nhóm...</span></div> )}
                                    </div>
                                </div>
                            </div>

                            <div className="form-group"><label className="form-label">Mô tả</label>
                                <CustomEditor data={formData.description || ""} onChange={(data) => { handleChange({ target: { name: 'description', value: data } }); }} />
                            </div>
                        </div>
                        <div>
                            <div className="form-group">
                                <label className="form-label">Trạng thái</label>
                                <div className="publish-toggle">
                                    <div className="toggle-wrapper">
                                        <span style={{ color: formData.isActive ? '#027A48' : '#667085' }}>{formData.isActive ? 'Đang hiển thị' : 'Chưa hiển thị'}</span>
                                        <label className="switch"><input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} /><span className="slider round"></span></label>
                                    </div>
                                </div>
                            </div>
                            
                            <p className="settings-item__description" style={{ marginLeft: 0, marginTop: '1rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                                <ImageIcon size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }}/>
                                Ảnh đại diện sẽ được hệ thống tự động tạo khi lưu mẫu thiệp mới. Bạn có thể thay đổi nó sau trong phần chỉnh sửa chi tiết.
                            </p>
                        </div>
                    </div>
                  
                    <div className="form-group"><label className="form-label">Dữ liệu Template (JSON)</label><textarea name="templateData" value={formData.templateData} onChange={handleChange} className="form-control code-editor" rows="8"></textarea></div>
                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="btn btn-secondary">Hủy</button>
                        <button type="submit" className="btn btn-primary">{template ? 'Lưu thay đổi' : 'Tiếp theo'}</button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};
// ================================================================================
// END: TEMPLATE MODAL REFACTOR
// ================================================================================


const SortableBannerItem = ({ banner, index, onUpdate, onRemove, onFileChange }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: banner.id });
    const [isExpanded, setIsExpanded] = useState(false);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const handleBannerChange = (field, value) => {
        const newBanner = { ...banner, [field]: value };
        // Nếu đổi loại media, reset URL của loại cũ
        if (field === 'mediaType') {
            if (value === 'image') newBanner.videoUrl = '';
            if (value === 'video') newBanner.imageUrl = '';
        }
        onUpdate(index, newBanner);
    };

    const handleBannerFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const isVideo = banner.mediaType === 'video';
            const fieldName = isVideo ? `banners__${index}__videoUrl` : `banners__${index}__imageUrl`;
            onFileChange(fieldName, file);

            const newUrl = URL.createObjectURL(file);
            const newBanner = { ...banner };
            if (isVideo) {
                newBanner.videoUrl = newUrl;
            } else {
                newBanner.imageUrl = newUrl;
            }
            onUpdate(index, newBanner);
        }
    };
    
    // Xác định mediaType, mặc định là 'image' nếu chưa có
    const mediaType = banner.mediaType || 'image';

    return (
        <div ref={setNodeRef} style={style} className="banner-editor-item">
            <div className="banner-editor-header">
                <div className="drag-handle" {...attributes} {...listeners}>
                    <GripVertical size={20} />
                </div>
                <strong className="banner-title" onClick={() => setIsExpanded(!isExpanded)}>
                    {banner.name || `Banner ${index + 1}`} ({mediaType === 'video' ? 'Video' : 'Ảnh'})
                </strong>
                <div className="banner-header-actions">
                     <div className="publish-toggle">
                        <div className="toggle-wrapper">
                            <span>{banner.isEnabled ? 'Đang hiển thị' : 'Đã tắt'}</span>
                            <button type="button" className={`btn-toggle ${banner.isEnabled ? 'active' : ''}`} onClick={() => handleBannerChange('isEnabled', !banner.isEnabled)}>
                                {banner.isEnabled ? <ToggleRight size={24}/> : <ToggleLeft size={24}/>}
                            </button>
                        </div>
                    </div>
                    <button onClick={() => onRemove(index)} className="btn-danger-icon" title="Xóa Banner"><Trash2 size={16}/></button>
                    <button onClick={() => setIsExpanded(!isExpanded)} className="expand-button">
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                </div>
            </div>
            {isExpanded && (
                <div className="banner-editor-content">
                    <div className="form-group">
                        <label className="form-label">Tên Banner (để quản lý)</label>
                        <input type="text" className="form-control" value={banner.name} onChange={(e) => handleBannerChange('name', e.target.value)} placeholder="Vd: Banner chính trang chủ" />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Loại Banner</label>
                        <Select
                            value={mediaType}
                            onChange={(value) => handleBannerChange('mediaType', value)}
                            style={{ width: '100%' }}
                        >
                            <Option value="image"><ImageIcon size={16} style={{ marginRight: 8 }}/> Ảnh</Option>
                            <Option value="video"><VideoIcon size={16} style={{ marginRight: 8 }}/> Video MP4</Option>
                        </Select>
                    </div>

                     <div className="form-group">
                        <label className="form-label">{mediaType === 'video' ? 'Video Banner (.mp4)' : 'Ảnh Banner'}</label>
                        <div className="image-upload-preview single">
                            {mediaType === 'video' ? (
                                banner.videoUrl && <video src={banner.videoUrl} autoPlay loop muted style={{height: '100px', width: 'auto', objectFit: 'contain'}} />
                            ) : (
                                banner.imageUrl && <img src={banner.imageUrl} alt="Banner Preview" className="logo-preview" style={{height: '100px', width: 'auto', objectFit: 'contain'}}/>
                            )}
                            <label className="btn btn-secondary">
                                <Upload size={16}/> { (mediaType === 'video' ? banner.videoUrl : banner.imageUrl) ? 'Thay đổi' : 'Tải lên'}
                                <input type="file" accept={mediaType === 'video' ? 'video/mp4' : 'image/*'} hidden onChange={handleBannerFileChange}/>
                            </label>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Tiêu đề (hiển thị trên banner)</label>
                        <input type="text" className="form-control" value={banner.title || ''} onChange={(e) => handleBannerChange('title', e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Tiêu đề phụ (hiển thị trên banner)</label>
                        <input type="text" className="form-control" value={banner.subtitle || ''} onChange={(e) => handleBannerChange('subtitle', e.target.value)} />
                    </div>
                   
                    <div className="form-group">
                        <label className="form-label">Hoặc dùng Nội dung HTML (sẽ ghi đè lên media và tiêu đề)</label>
                        <CustomEditor
                            data={banner.htmlContent || ""}
                            onChange={(data) => handleBannerChange('htmlContent', data)}
                        />
                    </div>
                     <div className="form-group">
                        <label className="form-label">Hiển thị ở trang</label>
                        <select className="form-control" value={banner.displayPage || 'all'} onChange={(e) => handleBannerChange('displayPage', e.target.value)}>
                            <option value="all">Tất cả các trang</option>
                            <option value="home">Trang chủ</option>
                            <option value="shop">Cửa hàng</option>
                            <option value="professional">Chuyên nghiệp</option>
                            <option value="invitations">Mẫu thiệp</option>
                        </select>
                    </div>
                    {/* START: Add Link Field */}
                    <div className="form-group">
                        <label className="form-label">Đường dẫn (Link)</label>
                        <input
                            type="text"
                            className="form-control"
                            value={banner.link || ''}
                            onChange={(e) => handleBannerChange('link', e.target.value)}
                            placeholder="VD: /shop/san-pham-moi hoặc https://..."
                        />
                    </div>
                    {/* END: Add Link Field */}
                </div>
            )}
        </div>
    );
};



const BannerEditor = ({ banners, onUpdate, onFileChange }) => {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = banners.findIndex((b) => b.id === active.id);
            const newIndex = banners.findIndex((b) => b.id === over.id);
            onUpdate('banners', arrayMove(banners, oldIndex, newIndex));
        }
    };
    
    const handleUpdateBanner = (index, newBannerData) => {
        const newBanners = [...banners];
        newBanners[index] = newBannerData;
        onUpdate('banners', newBanners);
    };

    const addBanner = () => {
        const newBanner = {
            id: uuidv4(),
            name: 'Banner Mới',
            displayPage: 'home',
            isEnabled: true,
            mediaType: 'image', // Mặc định là ảnh
            imageUrl: '',
            videoUrl: '',
            title: '',
            subtitle: '',
            htmlContent: '<p>Nội dung HTML cho banner...</p>',
            link: ''
        };
        onUpdate('banners', [...(banners || []), newBanner]);
    };

    const removeBanner = (index) => {
        if (window.confirm('Bạn có chắc muốn xóa banner này không?')) {
            const newBanners = banners.filter((_, i) => i !== index);
            onUpdate('banners', newBanners);
        }
    };

    return (
        <div className="card settings-card">
            <h3 className="card__title"><Columns size={24} /> Quản lý Banner</h3>
            <p className="settings-description">
                Thêm, sửa, xóa và sắp xếp lại các banner. Banner có thể là ảnh (với tiêu đề) hoặc nội dung HTML tùy chỉnh.
            </p>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={(banners || []).map(b => b.id)} strategy={verticalListSortingStrategy}>
                    <div className="all-banners-container">
                        {(banners || []).map((banner, index) => (
                           <SortableBannerItem
                                key={banner.id}
                                banner={banner}
                                index={index}
                                onUpdate={(idx, data) => handleUpdateBanner(idx, data)}
                                onRemove={() => removeBanner(index)}
                                onFileChange={onFileChange}
                           />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
            <button onClick={addBanner} className="btn btn-secondary" style={{marginTop: '1.5rem'}}>
                <PlusCircle size={18} /> Thêm Banner mới
            </button>
        </div>
    );
};
// ================================================================================
// MỞ RỘNG: Trang Tùy Chỉnh Giao Diện
// ================================================================================
const SettingsPage = () => {
    const [settings, setSettings] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [filesToUpload, setFilesToUpload] = useState({});
    
    // --- BẮT ĐẦU SỬA LỖI: LOGIC CHÍNH NẰM Ở ĐÂY ---
    useEffect(() => {
        const fetchAndSyncData = async () => {
            setIsLoading(true);
            try {
                const settingsResponse = await AuthService.getSettings();
                let currentSettings = settingsResponse || {};

                // **LOGIC CHUYỂN ĐỔI DỮ LIỆU BANNER**
                // Kiểm tra xem 'banners' có phải là một object (định dạng cũ) và không phải là mảng không.
                if (currentSettings.banners && typeof currentSettings.banners === 'object' && !Array.isArray(currentSettings.banners)) {
                    console.log("Phát hiện định dạng banner cũ, đang chuyển đổi...");
                    // Chuyển đổi object cũ thành mảng mới
                    currentSettings.banners = Object.entries(currentSettings.banners).map(([key, value]) => {
                        // value ở đây là object con, ví dụ: { imageUrl: "..." }
                        return {
                            id: key, // Sử dụng key của object cũ làm ID
                            name: _.startCase(key.replace(/_/g, ' ')), // Tạo tên dễ đọc từ key
                            isEnabled: value.isEnabled !== undefined ? value.isEnabled : true,
                            displayPage: value.displayPage || 'all',
                            htmlContent: value.htmlContent || '',
                            imageUrl: value.imageUrl || '',
                        };
                    });
                }
                // **KẾT THÚC LOGIC CHUYỂN ĐỔI**

                // Khởi tạo các giá trị mặc định để tránh lỗi
                _.defaultsDeep(currentSettings, {
                    theme: {
                        announcementBar: { text: '', isEnabled: false, backgroundImage: '' },
                        logoUrl: null
                    },
                    banners: [], // Đảm bảo banners luôn là một mảng
                    footer: {
                        socialLinks: [],
                        columns: [],
                        legalLinks: [],
                        textContent: { title: '', blocks: [] }
                    },
                    headerNav: []
                });
                
                if (Array.isArray(currentSettings.footer.socialLinks)) {
                    currentSettings.footer.socialLinks = currentSettings.footer.socialLinks
                        .map(link => (link && link.id && link.name) ? link : null)
                        .filter(Boolean);
                } else {
                    currentSettings.footer.socialLinks = [];
                }

                setSettings(currentSettings);
            } catch (error) {
                toast.error("Không thể tải dữ liệu cài đặt. Vui lòng thử lại.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchAndSyncData();
    }, []);
    // --- KẾT THÚC SỬA LỖI ---

    const handleInputChange = (path, value) => {
        setSettings(prevSettings => {
            const newSettings = _.cloneDeep(prevSettings);
            _.set(newSettings, path, value);
            return newSettings;
        });
    };

    const handleFileChange = useCallback((fieldName, file) => {
        if (file) {
            // Cập nhật state filesToUpload để chuẩn bị cho việc tải lên
            setFilesToUpload(prev => ({ ...prev, [fieldName]: file }));

            // Cập nhật state `settings` để hiển thị ảnh preview ngay lập tức
            setSettings(prev => {
                const newSettings = _.cloneDeep(prev);
                // Tạo một URL tạm thời cho file ảnh để hiển thị
                _.set(newSettings, fieldName, URL.createObjectURL(file));
                return newSettings;
            });
        }
    }, []);


    const handleUpdate = useCallback((field, value) => {
        setSettings(prev => _.set(_.cloneDeep(prev), field, value));
    }, []);

    const handleSaveChanges = async () => {
        setIsLoading(true);
        try {
            const formData = new FormData();
            // Deep clone để tránh thay đổi state gốc khi xóa các thuộc tính
            const settingsPayload = _.cloneDeep(settings);

            // Xử lý tất cả các file cần upload trong state `filesToUpload`
            for (const [key, file] of Object.entries(filesToUpload)) {
                formData.append(key, file);
                
                // Xóa URL object tạm thời (blob:...) khỏi payload gửi đi
                // Backend sẽ điền URL thật sau khi upload xong
                const path = key.replace(/__/g, '.');
                _.set(settingsPayload, path, null); // Đặt là null hoặc xóa đi
            }

            // Chuyển object settings thành chuỗi JSON
            formData.append('settings', JSON.stringify(settingsPayload));
            
            const response = await AuthService.updateSettings(formData);
            
            setSettings(response.data);
            setFilesToUpload({}); // Reset danh sách file sau khi lưu thành công
            toast.success('Cài đặt đã được lưu thành công!');

        } catch (error) {
            console.error("Failed to save settings:", error);
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi lưu cài đặt.');
        } finally {
            setIsLoading(false);
        }
    };


    
    // ... (Giữ nguyên các hàm add/remove cho footer và social links) ...
    const addFooterColumn = () => {
        const newColumns = [...(settings.footer.columns || []), { id: uuidv4(), title: 'Cột Mới', links: [] }];
        handleInputChange('footer.columns', newColumns);
    };
    const addFooterLink = (colIndex) => {
        const newLink = { id: uuidv4(), text: 'Liên kết mới', url: '#' };
        const newColumns = JSON.parse(JSON.stringify(settings.footer.columns));
        newColumns[colIndex].links.push(newLink);
        handleInputChange('footer.columns', newColumns);
    };
    const removeFooterColumn = (colIndex) => {
        const newColumns = settings.footer.columns.filter((_, index) => index !== colIndex);
        handleInputChange('footer.columns', newColumns);
    };
    const removeFooterLink = (colIndex, linkIndex) => {
        const newColumns = JSON.parse(JSON.stringify(settings.footer.columns));
        newColumns[colIndex].links = newColumns[colIndex].links.filter((_, index) => index !== linkIndex);
        handleInputChange('footer.columns', newColumns);
    };
    const addSocialLink = () => {
        const newLinks = [...(settings.footer.socialLinks || []), { id: uuidv4(), name: '', url: '', icon: null }];
        handleInputChange('footer.socialLinks', newLinks);
    };
    const removeSocialLink = (index) => {
        const newLinks = settings.footer.socialLinks.filter((_, i) => i !== index);
        handleInputChange('footer.socialLinks', newLinks);
    };
     const addLegalLink = () => {
        const newLinks = [...(settings.footer.legalLinks || []), { id: uuidv4(), text: 'Liên kết mới', url: '#' }];
        handleInputChange('footer.legalLinks', newLinks);
    };

    const removeLegalLink = (index) => {
        const newLinks = settings.footer.legalLinks.filter((_, i) => i !== index);
        handleInputChange('footer.legalLinks', newLinks);
    };

    if (isLoading || !settings) return <LoadingSpinner />;
    
    const getPreviewUrl = (value) => {
        if (value instanceof File) return URL.createObjectURL(value);
        return value || '';
    };

    const logoPreview = getPreviewUrl(settings.theme?.logoUrl);
    const isMarqueeEnabled = settings.theme?.announcementBar?.isMarquee || false;

    return (
        <div>
            {/* ... (Giữ nguyên phần JSX của WebsiteReviewModal và AdminHeader) ... */}
            <WebsiteReviewModal url={"https://icards.com.vn"} isOpen={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)} />
            <AdminHeader title="Tuỳ chỉnh Giao diện" />
            <div className="page-header-actions" style={{ position: 'absolute', top: '1.25rem', right: '2rem' }}>
                <button onClick={() => setIsReviewModalOpen(true)} className="btn btn-secondary"><Eye size={20} /> Xem trước</button>
            </div>
            <div className="settings-container">
                {/* ... (Giữ nguyên JSX cho General Info & Branding) ... */}
                <div className="card settings-card">
                    <h3 className="card__title"><ImageIcon size={24} /> Thông tin chung & Branding</h3>
                     <div className="settings-item">
                        <div className="settings-item__info">
                            <ImageIcon size={40} className="settings-item__icon" />
                            <div>
                                <h4 className="settings-item__title">Logo</h4>
                                <p className="settings-item__description">Tải lên logo của bạn (sử dụng ở Header và Footer).</p>
                            </div>
                        </div>
                        <div className="settings-item__control">
                            <img src={logoPreview || 'https://placehold.co/150x50/eaecf0/98a2b3?text=Logo'} alt="Logo Preview" className="logo-preview" />
                            <label className="btn btn-secondary">
                                Thay đổi <input type="file" accept="image/*" hidden onChange={(e) => handleFileChange('theme.logoUrl', e.target.files[0])} />
                            </label>
                        </div>
                    </div>
                    <div className="form-group"><label className="form-label">Tên công ty</label><input type="text" className="form-control" value={settings.theme.companyName || ''} onChange={(e) => handleInputChange('theme.companyName', e.target.value)} /></div>
                     <div className="form-group"><label className="form-label">Địa chỉ</label><input type="text" className="form-control" value={settings.theme.address || ''} onChange={(e) => handleInputChange('theme.address', e.target.value)} /></div>
                     <div className="form-group"><label className="form-label">Số điện thoại (Hotline)</label><input type="text" className="form-control" value={settings.theme.phone || ''} onChange={(e) => handleInputChange('theme.phone', e.target.value)} /></div>
                    <div className="settings-item">
                        <div className="settings-item__info"><Type size={40} className="settings-item__icon" /><div><h4 className="settings-item__title">Thanh thông báo</h4><p className="settings-item__description">Bật/tắt và chỉnh sửa nội dung.</p></div></div>
                        <div className="settings-item__control" style={{flexDirection: 'column', alignItems: 'flex-end', gap: '1rem', width: '60%'}}>
                            <input type="text" className="form-control" placeholder="Nhập nội dung..." value={settings.theme.announcementBar.text} onChange={(e) => handleInputChange('theme.announcementBar.text', e.target.value)} />
                            <input type="text" className="form-control" placeholder="Đường dẫn (VD: /shop)" value={settings.theme.announcementBar.link || ''} onChange={(e) => handleInputChange('theme.announcementBar.link', e.target.value)} />
                             <div style={{display: 'flex', gap: '1rem', width: '100%', alignItems: 'center'}}>
                                <label className="form-label" style={{marginBottom: 0, whiteSpace: 'nowrap'}}>Màu nền:</label>
                                <input type="color" className="form-control" title="Chọn màu nền" value={settings.theme.announcementBar.backgroundColor || '#333333'} onChange={(e) => handleInputChange('theme.announcementBar.backgroundColor', e.target.value)} style={{height: '40px'}}/>
                                <label className="form-label" style={{marginBottom: 0, whiteSpace: 'nowrap'}}>Màu chữ:</label>
                                <input type="color" className="form-control" title="Chọn màu chữ" value={settings.theme.announcementBar.textColor || '#ffffff'} onChange={(e) => handleInputChange('theme.announcementBar.textColor', e.target.value)} style={{height: '40px'}} />
                            </div>
                            <div className="form-group" style={{width: '100%'}}>
                                <label className="form-label">Ảnh nền (Tùy chọn)</label>
                                <div className="image-upload-preview single">
                                    <img 
                                        src={getPreviewUrl(settings.theme?.announcementBar?.backgroundImage) || 'https://placehold.co/200x50/F8F9FA/B0C7EE?text=Ảnh+nền'} 
                                        alt="Preview" 
                                        style={{height: '50px', width: 'auto', objectFit: 'cover'}}
                                    />
                                    <label className="btn btn-secondary btn-sm">
                                        <Upload size={16}/> {getPreviewUrl(settings.theme?.announcementBar?.backgroundImage) ? 'Thay đổi' : 'Tải lên'}
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            hidden 
                                            onChange={(e) => handleFileChange('theme.announcementBar.backgroundImage', e.target.files[0])}
                                        />
                                    </label>
                                    {(getPreviewUrl(settings.theme?.announcementBar?.backgroundImage)) && 
                                        <button 
                                            type="button" 
                                            onClick={() => handleInputChange('theme.announcementBar.backgroundImage', '')} 
                                            className="delete-btn" 
                                            title="Xóa ảnh">
                                            <Trash2 size={16}/>
                                        </button>
                                    }
                                </div>
                            </div>

                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={isMarqueeEnabled}
                                        onChange={(e) => handleInputChange('theme.announcementBar.isMarquee', e.target.checked)}
                                        name="isMarquee"
                                    />
                                }
                                label="Bật hiệu ứng chữ chạy"
                                sx={{ alignSelf: 'flex-start', color: 'var(--admin-text-primary)' }}
                            />
                            <button className={`btn-toggle ${settings.theme.announcementBar.isEnabled ? 'active' : ''}`} onClick={() => handleInputChange('theme.announcementBar.isEnabled', !settings.theme.announcementBar.isEnabled)}>
                                {settings.theme.announcementBar.isEnabled ? <ToggleRight size={24}/> : <ToggleLeft size={24}/>}
                                <span>{settings.theme.announcementBar.isEnabled ? 'Đang bật' : 'Đang tắt'}</span>
                            </button>
                        </div>
                    </div>
                </div>
                {/* START MODIFICATION: Upgraded Banner Management */}
                <BannerEditor
                    banners={settings.banners || []}
                    onUpdate={handleUpdate}
                    onFileChange={handleFileChange}
                />
                {/* END MODIFICATION */}
                
                {/* ... (Giữ nguyên JSX cho Footer Management) ... */}
                 <div className="card settings-card">
                    <h3 className="card__title"><LinkIcon size={24} /> Quản lý Footer</h3>
                    <div className="footer-section-divider">
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                            <h4 className="footer-section-title">Liên kết Mạng xã hội</h4>
                            <button onClick={addSocialLink} className="btn btn-green"><PlusCircle size={18}/> Thêm liên kết</button>
                        </div>
                        <div className="footer-links-editor">
                             {(settings.footer?.socialLinks || []).map((link, index) => (
                                 <div key={link.id} className="social-link-item">
                                     <div className="social-icon-uploader">
                                         {getPreviewUrl(link.icon) ? (
                                            <img src={getPreviewUrl(link.icon)} alt="Preview" className="icon-preview" />
                                         ) : (
                                            <div className="icon-placeholder"><ImageIcon size={24}/></div>
                                         )}
                                         <input
                                            type="file"
                                            id={`social-icon-upload-${index}`}
                                            style={{display: 'none'}}
                                            accept="image/png, image/jpeg, image/svg+xml"
                                            onChange={e => handleFileChange(`footer.socialLinks[${index}].icon`, e.target.files[0])}
                                         />
                                         <label htmlFor={`social-icon-upload-${index}`} className="btn btn-secondary btn-upload">
                                              Tải icon
                                         </label>
                                     </div>
                                     <div className="social-link-inputs">
                                        <div className="form-group">
                                            <label className="form-label">Tên nền tảng</label>
                                            <input type="text" value={link.name} onChange={e => handleInputChange(`footer.socialLinks[${index}].name`, e.target.value)} placeholder="VD: Facebook" className="form-control" />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">URL</label>
                                            <input type="text" value={link.url} onChange={e => handleInputChange(`footer.socialLinks[${index}].url`, e.target.value)} placeholder="https://..." className="form-control" />
                                        </div>
                                     </div>
                                     <button onClick={() => removeSocialLink(index)} className="delete-btn"><Trash2 size={20} /></button>
                                 </div>
                             ))}
                        </div>
                    </div>

                    <div className="footer-section-divider">
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}><h4 className="footer-section-title">Các Cột trong Footer</h4><button onClick={addFooterColumn} className="btn btn-green"><PlusCircle size={18}/> Thêm Cột</button></div>
                        <div>
                            <p>*Tạo trang bên tab quản lí bài viết, sau đó dán đường dẫn vào các danh mục tương ứng</p>
                        </div>
                        <div className="footer-columns-editor">
                            {(settings.footer.columns || []).map((col, colIndex) => (
                                <div key={col.id} className="footer-column-editor">
                                    <div className="footer-column-header">
                                        <input type="text" value={col.title} onChange={(e) => handleInputChange(`footer.columns[${colIndex}].title`, e.target.value)} placeholder="Tiêu đề cột" className="form-control" />
                                        <button onClick={() => removeFooterColumn(colIndex)} className="delete-btn"><Trash2 size={20} /></button>
                                    </div>
                                    <div className="footer-links-editor">
                                        {(col.links || []).map((link, linkIndex) => (
                                            <div key={link.id} className="footer-link-item">
                                                <input type="text" value={link.text} onChange={e => handleInputChange(`footer.columns[${colIndex}].links[${linkIndex}].text`, e.target.value)} placeholder="Tiêu đề" className="form-control" />
                                                <input type="text" value={link.url} onChange={e => handleInputChange(`footer.columns[${colIndex}].links[${linkIndex}].url`, e.target.value)} placeholder="URL" className="form-control" />
                                                <button onClick={() => removeFooterLink(colIndex, linkIndex)} className="delete-btn"><Trash2 size={16} /></button>
                                            </div>
                                        ))}
                                    </div>
                                    <button onClick={() => addFooterLink(colIndex)} className="btn btn-secondary btn-add-link"><PlusCircle size={16}/> Thêm liên kết</button>
                                </div>
                            ))}
                        </div>

                    </div>

                    <div className="footer-section-divider">
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                            <h4 className="footer-section-title">Liên kết Pháp lý (Chân trang)</h4>
                            <button onClick={addLegalLink} className="btn btn-green"><PlusCircle size={18}/> Thêm liên kết</button>
                        </div>
                        <div className="footer-links-editor">
                            {(settings.footer?.legalLinks || []).map((link, index) => (
                                <div key={link.id} className="footer-link-item">
                                    <input type="text" value={link.text} onChange={e => handleInputChange(`footer.legalLinks[${index}].text`, e.target.value)} placeholder="Tiêu đề" className="form-control" />
                                    <input type="text" value={link.url} onChange={e => handleInputChange(`footer.legalLinks[${index}].url`, e.target.value)} placeholder="URL" className="form-control" />
                                    <button onClick={() => removeLegalLink(index)} className="delete-btn"><Trash2 size={16} /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            <div className="page-footer-actions">
                <button onClick={handleSaveChanges} className="btn btn-primary" disabled={isLoading}>
                    <Save size={20} /> {isLoading ? 'Đang lưu...' : 'Lưu tất cả thay đổi'}
                </button>
            </div>
        </div>
    );
};


//================================================================================
// Main AdminDashboard Component (UPDATED WITH NEW ROUTES)
//================================================================================
export const AdminDashboard = () => {
  return (
    <Routes>
        <Route path="/" element={<AdminRoute><AdminLayout /></AdminRoute>}>
            <Route index element={<DashboardPage />} />
            <Route path="users" element={<UserManagementPage />} />
            <Route path="products" element={<ProductManagementPage />} />
            <Route path="templates" element={<TemplateManagementPage />} />
            <Route path="design-assets" element={<DesignAssetManagementPage />} />
            <Route path="templates/design/:templateId?" element={<InvitationDesign />} />
            <Route path="categories" element={<TaxonomyManagementPage />} /> {/* Route mới */}
            <Route path="pages" element={<PageManagementPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="seo" element={<SeoManagementPage />} />
            <Route path="fonts" element={<FontManagementPage />} />
        </Route>
    </Routes>
  );
};