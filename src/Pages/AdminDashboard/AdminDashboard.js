// src/Pages/AdminDashboard/AdminDashboard.js
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Routes, Route, NavLink, Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Home, ShoppingBag, LayoutTemplate, Settings, Search, Upload, Palette, Trash2, Edit, PlusCircle, Type, Image as ImageIcon, ChevronDown, Link as LinkIcon, Save, Columns, Eye, ToggleLeft, ToggleRight, ChevronsLeft, ChevronsRight, FileText, LogOut, Users, GripVertical, ListTree, ChevronUp, Video as VideoIcon, X, Layout } from 'lucide-react';
import MediaManagementPage from './MediaManagementPage';
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
import PageEditPage from './PageEditPage';
import OccasionOrderManager from './OccasionOrderManager';
import TemplateBlockManagement from './TemplateBlockManagement';
import { Layers } from 'lucide-react';
import templateBlockService from '../../services/templateBlock.service';
import QuickCardBuilder from '../InvitationDesign/QuickCardBuilder';
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
// --- BẮT ĐẦU HELPER BANNER SLOT (KHÔNG ĐỔI ĐỊNH DẠNG LƯU TRỮ) ---
const HOME_SLOT_META = {
    hero: { label: 'Banner Hero (đầu trang)', hint: 'Banner lớn, nổi bật nhất, ngay đầu trang chủ.', fixedName: 'Banner chính trang chủ' },
    footerTop: { label: 'Banner trên (trước Footer)', hint: 'Hiển thị phía trên, ngay trước khối Footer.', fixedName: 'Banner phụ 1 trang chủ' },
    footerBottom: { label: 'Banner dưới (cuối Footer)', hint: 'Hiển thị cuối cùng, sát trước Footer.', fixedName: 'Banner phụ 2 trang chủ' },
};

const OTHER_PAGES = [
    { key: 'shop', label: 'Cửa hàng', fixedName: 'Banner trang Cửa hàng' },
    { key: 'professional', label: 'Chuyên nghiệp', fixedName: 'Banner trang Chuyên nghiệp' },
    { key: 'invitations', label: 'Thiệp mời', fixedName: 'Banner trang Thiệp mời' },
    { key: 'greetings', label: 'Thiệp chúc mừng', fixedName: 'Banner trang Thiệp chúc mừng' },
    { key: 'thanks', label: 'Thiệp cảm ơn', fixedName: 'Banner trang Thiệp cảm ơn' },
    { key: 'others', label: 'Thiệp khác', fixedName: 'Banner trang Thiệp khác' },
];

// Thứ tự CỐ ĐỊNH khi xuất ra mảng để lưu - phải khớp với index dùng cho file upload
const SLOT_ORDER = ['home.hero', 'home.footerTop', 'home.footerBottom', ...OTHER_PAGES.map(p => p.key)];

const EMPTY_BANNER = (displayPage, name) => ({
    id: uuidv4(),
    name,
    displayPage,
    isEnabled: true,
    mediaType: 'image',
    imageUrl: '',
    videoUrl: '',
    title: '',
    subtitle: '',
    htmlContent: '',
    link: '',
    buttonText: '', // THÊM MỚI
    buttonLink: '',
});

// Mảng banner (định dạng cũ, có displayPage) -> object slot để render UI
const bannersArrayToSlots = (bannersInput) => {
    const list = Array.isArray(bannersInput) ? bannersInput : Object.values(bannersInput || {});

    const homeList = list.filter(b => b && (b.displayPage === 'home' || b.displayPage === 'all'));
    let heroIdx = homeList.findIndex(b => b.name?.toLowerCase().includes('chính'));
    if (heroIdx === -1 && homeList.length > 0) heroIdx = 0;

    const hero = heroIdx >= 0 ? homeList[heroIdx] : null;
    const rest = homeList.filter((_, i) => i !== heroIdx);

    const findByPage = (page) => list.find(b => b && b.displayPage === page) || null;

    // Tự động map các page dựa trên OTHER_PAGES
    const slots = {
        home: {
            hero: hero || EMPTY_BANNER('home', HOME_SLOT_META.hero.fixedName),
            footerTop: rest[0] || EMPTY_BANNER('home', HOME_SLOT_META.footerTop.fixedName),
            footerBottom: rest[1] || EMPTY_BANNER('home', HOME_SLOT_META.footerBottom.fixedName),
        }
    };

    OTHER_PAGES.forEach(pageMeta => {
        slots[pageMeta.key] = findByPage(pageMeta.key) || EMPTY_BANNER(pageMeta.key, pageMeta.fixedName);
    });

    return slots;
};

// Object slot -> mảng banner (định dạng cũ) để lưu, LUÔN đúng thứ tự SLOT_ORDER
const slotsToBannersArray = (slots) => {
    const fixName = (banner, fixedName) => ({ ...banner, name: fixedName });

    const arr = [
        { ...fixName(slots.home.hero, HOME_SLOT_META.hero.fixedName), displayPage: 'home' },
        { ...fixName(slots.home.footerTop, HOME_SLOT_META.footerTop.fixedName), displayPage: 'home' },
        { ...fixName(slots.home.footerBottom, HOME_SLOT_META.footerBottom.fixedName), displayPage: 'home' }
    ];

    // Tự động gộp mảng động để gửi lên Backend
    OTHER_PAGES.forEach(pageMeta => {
        if (slots[pageMeta.key]) {
            arr.push({ ...fixName(slots[pageMeta.key], pageMeta.fixedName), displayPage: pageMeta.key });
        }
    });

    return arr;
};
// --- KẾT THÚC HELPER BANNER SLOT ---
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

    // 1. THÊM STATE LOADING CHO NÚT DUYỆT
    const [isApproving, setIsApproving] = useState(false);

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
            setOrder(template.displayOrder);
        }
    };

    const handleOrderInputChange = (e) => {
        setOrder(e.target.value);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleOrderInputBlur();
            e.target.blur();
        }
    }

    // 2. THÊM HÀM XỬ LÝ CLICK "DUYỆT NGAY"
    const handleApproveClick = async (e) => {
        e.stopPropagation(); // Ngăn sự kiện lan ra ngoài
        setIsApproving(true);
        try {
            await onStatusChange(template._id, true);
        } catch (error) {
            console.error("Lỗi khi duyệt:", error);
        } finally {
            setIsApproving(false);
        }
    };

    return (
        <div ref={setNodeRef} style={style} className="template-card">
            <DragHandle {...attributes} {...listeners} />

            <div className="template-card__image-wrapper" style={{ position: 'relative' }}>
                <img src={template.imgSrc} alt={template.title} className="template-card__image" />

                {/* 1. BADGE TRẠNG THÁI: Đưa lên góc trên phải, dùng pointerEvents: 'none' để không chặn chuột */}
                {!template.isActive && (
                    <div style={{
                        position: 'absolute', top: '10px', right: '10px',
                        backgroundColor: '#FFFBEB', color: '#D97706', padding: '4px 12px',
                        borderRadius: '20px', fontSize: '12px', fontWeight: 'bold',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)', zIndex: 3, pointerEvents: 'none'
                    }}>
                        ● Đang ẩn
                    </div>
                )}

                {/* 2. OVERLAY CHỨNG CÁC NÚT THAO TÁC (CÙNG CẤP) */}
                {/* Đổi flexDirection thành column để xếp nút Duyệt xuống dưới 3 nút kia */}
                <div className="template-card__overlay" style={{ flexDirection: 'column', gap: '15px' }}>

                    {/* Nhóm 3 nút cơ bản */}
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/templates/design/${template._id}`) }} className="template-card__action-btn" title="Chỉnh sửa thiết kế">
                            <Palette size={24} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onEdit(template) }} className="template-card__action-btn" title="Chỉnh sửa thông tin">
                            <Edit size={24} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onDelete(template._id) }} className="template-card__action-btn" title="Xóa mẫu">
                            <Trash2 size={24} />
                        </button>
                    </div>

                    {/* Nút Duyệt ngay: Cùng nằm trong Overlay, hiện ra cùng lúc với 3 nút trên */}
                    {!template.isActive && (
                        <button
                            onClick={handleApproveClick}
                            disabled={isApproving}
                            className="template-card__approve-action-btn" /* Thêm class để CSS animation */
                            style={{
                                backgroundColor: '#10B981', color: '#fff', border: 'none',
                                padding: '8px 20px', borderRadius: '8px', cursor: 'pointer',
                                fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px',
                                boxShadow: '0 4px 6px rgba(16, 185, 129, 0.3)',
                                opacity: isApproving ? 0.7 : 1
                            }}
                        >
                            {isApproving ? 'Đang xử lý...' : '✓ Duyệt ngay'}
                        </button>
                    )}
                </div>
            </div>

            <div className="template-card__info">
                <h4 className="template-card__name" title={template.title}>{template.title}</h4>

                {/* 4. CẬP NHẬT GIAO DIỆN CATEGORY KÈM THEO TRẠNG THÁI HIỂN THỊ */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p className="template-card__category" style={{ margin: 0 }}>{template.category}</p>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: template.isActive ? '#10B981' : '#D97706' }}>
                        {template.isActive ? 'Đang hiển thị' : 'Đang ẩn'}
                    </span>
                </div>

                <div className="template-card__footer" style={{ marginTop: '10px' }}>
                    <div className="template-card__order-input-wrapper">
                        <label htmlFor={`order-${template._id}`}>Thứ tự:</label>
                        <input
                            id={`order-${template._id}`}
                            type="number"
                            value={order}
                            onChange={handleOrderInputChange}
                            onBlur={handleOrderInputBlur}
                            onKeyPress={handleKeyPress}
                            onClick={(e) => e.stopPropagation()}
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
        { to: "/dashboard/media", icon: <ImageIcon size={20} />, text: "Quản lý Media", roles: ['admin'] },
        { to: "/dashboard/fonts", icon: <Type size={20} />, text: "Quản lý Fonts", roles: ['admin', 'designer'] },

        // Vai trò: 'admin', 'designer'
        { to: "/dashboard/products", icon: <ShoppingBag size={20} />, text: "Quản lý Sản phẩm", roles: ['admin', 'designer'] },
        { to: "/dashboard/templates", icon: <LayoutTemplate size={20} />, text: "Quản lý Mẫu thiệp", roles: ['admin', 'designer'] },
        { to: "/dashboard/design-assets", icon: <Palette size={20} />, text: "Tài sản Thiết kế", roles: ['admin', 'designer'] },

        // Vai trò: 'admin', 'marketing'
        { to: "/dashboard/settings", icon: <Settings size={20} />, text: "Tuỳ chỉnh Giao diện", roles: ['admin', 'marketing'] },
        // { to: "/dashboard/seo", icon: <Search size={20} />, text: "Quản lý SEO", roles: ['admin', 'marketing'] },
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
            <div className="dashboard__grid dashboard__grid--stats" style={{ marginTop: '1.5rem' }}>
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
                        style={{ width: '150px' }}
                    />
                    <input
                        type="number"
                        placeholder="Giá cao nhất"
                        className="form-control"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        style={{ width: '150px' }}
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
                                    {previews.imgSrc && <img src={previews.imgSrc} alt="Preview" />}
                                    <label className="btn btn-secondary btn-sm"><Upload size={16} /> {previews.imgSrc ? 'Thay đổi' : 'Tải lên'}<input type="file" accept="image/*" hidden onChange={handleMainImageChange} /></label>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Thư viện ảnh</label>
                                <div className="gallery-upload-container">
                                    {previews.images.map((imgUrl, index) => (
                                        <div key={index} className="gallery-image-item">
                                            <img src={imgUrl} alt={`Gallery item ${index + 1}`} />
                                            <button type="button" onClick={() => removeGalleryImage(index)} className="delete-btn-overlay">×</button>
                                        </div>
                                    ))}
                                    <label className="gallery-add-btn"><PlusCircle size={24} /><span>Thêm ảnh</span><input type="file" accept="image/*" multiple hidden onChange={handleGalleryImagesChange} /></label>
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

const SortableSelectedTemplate = ({ template, onRemove }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: template._id });
    const style = { transform: CSS.Transform.toString(transform), transition };

    return (
        <div ref={setNodeRef} style={style} className="selected-template-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', marginBottom: '8px', backgroundColor: '#f8f9fa', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div {...attributes} {...listeners} style={{ cursor: 'grab' }}><GripVertical size={16} color="#6b7280" /></div>
                <img src={template.imgSrc || 'https://placehold.co/40'} alt="thumb" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                <span style={{ fontWeight: '500', fontSize: '14px' }}>{template.title}</span>
            </div>
            <button type="button" onClick={() => onRemove(template._id)} className="delete-btn"><X size={16} /></button>
        </div>
    );
};

// --- COMPONENT CHÍNH ĐỂ NHÚNG VÀO SETTINGS PAGE ---
const HomepageBlockManager = () => {
    const [blocks, setBlocks] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // State Modal
    const [editingBlock, setEditingBlock] = useState(null);
    const [formData, setFormData] = useState({ title: '', slug: '', isActive: true });

    // Pick Template
    const [allTemplates, setAllTemplates] = useState([]);
    const [searchTemplate, setSearchTemplate] = useState('');
    const [selectedTemplates, setSelectedTemplates] = useState([]);

    const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

    useEffect(() => {
        fetchBlocks();
        fetchAllTemplatesForPicker();
    }, []);

    const fetchBlocks = async () => {
        try {
            const res = await templateBlockService.getBlocks();
            setBlocks(res.data?.data || []);
        } catch (error) { toast.error("Lỗi tải danh sách khối"); }
    };

    const fetchAllTemplatesForPicker = async () => {
        try {
            const res = await AuthService.getTemplates();
            // Lấy danh sách template gốc từ API
            setAllTemplates(res.data || []);
        } catch (error) { console.error("Lỗi tải template"); }
    };
    const generateSlug = (text) => {
        if (!text) return '';
        return text.toString().toLowerCase()
            .normalize('NFD') // Tách dấu ra khỏi ký tự
            .replace(/[\u0300-\u036f]/g, '') // Xóa dấu
            .replace(/đ/g, 'd').replace(/Đ/g, 'd') // Thay thế chữ đ
            .replace(/\s+/g, '-') // Thay khoảng trắng bằng dấu gạch ngang
            .replace(/[^\w\-]+/g, '') // Xóa các ký tự đặc biệt
            .replace(/\-\-+/g, '-') // Xóa các dấu gạch ngang liên tiếp
            .replace(/^-+/, '') // Xóa gạch ngang ở đầu
            .replace(/-+$/, ''); // Xóa gạch ngang ở cuối
    };

    // Hàm xử lý khi người dùng nhập Tên khối
    const handleTitleChange = (e) => {
        const newTitle = e.target.value;

        // Nếu đang tạo mới khối (không phải edit), tự động điền slug
        if (!editingBlock) {
            setFormData({
                ...formData,
                title: newTitle,
                slug: generateSlug(newTitle)
            });
        } else {
            // Nếu đang edit thì chỉ đổi tên, giữ nguyên slug (tránh làm hỏng link cũ, trừ khi admin tự gõ sửa slug)
            setFormData({ ...formData, title: newTitle });
        }
    };
    const openModal = (block = null) => {
        if (block) {
            setEditingBlock(block);
            setFormData({ title: block.title, slug: block.slug, isActive: block.isActive });
            setSelectedTemplates(block.templates || []);
        } else {
            setEditingBlock(null);
            setFormData({ title: '', slug: '', isActive: true });
            setSelectedTemplates([]);
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                templates: selectedTemplates.map(t => t._id)
            };

            if (editingBlock) {
                await templateBlockService.updateBlock(editingBlock._id, payload);
                toast.success("Cập nhật Khối thành công!");
            } else {
                await templateBlockService.createBlock(payload);
                toast.success("Tạo Khối thành công!");
            }
            setIsModalOpen(false);
            fetchBlocks();
        } catch (error) { toast.error("Lỗi khi lưu!"); }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Bạn có chắc muốn xóa khối này?')) {
            try {
                await templateBlockService.deleteBlock(id);
                toast.success("Đã xóa khối");
                fetchBlocks();
            } catch (error) { toast.error("Lỗi xóa khối"); }
        }
    }

    const handleAddTemplate = (template) => {
        if (!selectedTemplates.find(t => t._id === template._id)) {
            setSelectedTemplates([...selectedTemplates, template]);
        }
    };
    const handleRemoveTemplate = (id) => {
        setSelectedTemplates(selectedTemplates.filter(t => t._id !== id));
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = selectedTemplates.findIndex(t => t._id === active.id);
            const newIndex = selectedTemplates.findIndex(t => t._id === over.id);
            setSelectedTemplates(arrayMove(selectedTemplates, oldIndex, newIndex));
        }
    };

    const filteredTemplates = allTemplates.filter(t =>
        t.title.toLowerCase().includes(searchTemplate.toLowerCase()) &&
        !selectedTemplates.find(selected => selected._id === t._id)
    );

    return (
        <div className="card settings-card">
            <h3 className="card__title"><Layout size={24} /> Quản lý danh mục Khối Trang Chủ</h3>
            <p className="settings-description">
                Tạo các bộ sưu tập (Blocks) hiển thị ngoài trang chủ. Chọn thủ công các mẫu thiệp cho từng khối để chạy chiến dịch hoặc làm nổi bật.
            </p>

            <div className="table-container" style={{ marginTop: '1rem' }}>
                <table className="table">
                    <thead><tr><th>Tên Khối</th><th>Đường dẫn (Slug)</th><th>Số Template</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
                    <tbody>
                        {blocks.map(block => (
                            <tr key={block._id}>
                                <td><strong>{block.title}</strong></td>
                                <td>/{block.slug}</td>
                                <td>{block.templates?.length || 0}</td>
                                <td>
                                    <span style={{ color: block.isActive ? '#10B981' : '#6B7280', fontWeight: 'bold' }}>
                                        {block.isActive ? 'Đang bật' : 'Đã tắt'}
                                    </span>
                                </td>
                                <td className="table__actions">
                                    <button onClick={() => openModal(block)} className="edit-btn" title="Sửa"><Edit size={20} /></button>
                                    <button onClick={() => handleDelete(block._id)} className="delete-btn" title="Xóa"><Trash2 size={20} /></button>
                                </td>
                            </tr>
                        ))}
                        {blocks.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', color: '#6b7280' }}>Chưa có khối nào.</td></tr>}
                    </tbody>
                </table>
            </div>

            <button onClick={() => openModal()} className="btn btn-secondary" style={{ marginTop: '1.5rem' }}>
                <PlusCircle size={18} /> Thêm Khối mới
            </button>

            {/* MODAL TẠO/SỬA KHỐI & CHỌN TEMPLATE */}
            {isModalOpen && (
                <div className="modal-overlay" style={{ zIndex: 1000 }}>
                    <div className="modal-content modal-content--xlarge" style={{ maxWidth: '1000px' }}>
                        <div className="modal-header">
                            <h3 className="modal-title">{editingBlock ? 'Chỉnh sửa Khối Trang Chủ' : 'Tạo Khối Trang Chủ mới'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="modal-close-btn">×</button>
                        </div>
                        <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>

                            {/* CỘT TRÁI */}
                            <div>
                                <div className="form-group">
                                    <label className="form-label">Tên Khối (VD: Top Thiệp Cưới)</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={formData.title}
                                        onChange={handleTitleChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Đường dẫn (Slug)</label>
                                    <input type="text" className="form-control" value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value })} placeholder="top-thiep-cuoi" required />
                                </div>

                                <div className="publish-toggle" style={{ marginBottom: '1.5rem' }}>
                                    <div className="toggle-wrapper">
                                        <span>{formData.isActive ? 'Đang hiển thị trên Web' : 'Đang ẩn'}</span>
                                        <label className="switch">
                                            <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} />
                                            <span className="slider round"></span>
                                        </label>
                                    </div>
                                </div>

                                <hr style={{ margin: '1.5rem 0', borderColor: '#e5e7eb' }} />

                                <label className="form-label" style={{ fontWeight: 'bold' }}>Tìm & Thêm Template vào Khối:</label>
                                <div className="search-box" style={{ marginBottom: '1rem' }}>
                                    <Search size={18} className="search-box__icon" />
                                    <input type="text" className="form-control" placeholder="Tìm theo tên template..." value={searchTemplate} onChange={(e) => setSearchTemplate(e.target.value)} />
                                </div>

                                <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', height: '350px', overflowY: 'auto', padding: '10px' }}>
                                    {filteredTemplates.slice(0, 30).map(t => (
                                        <div key={t._id} onClick={() => handleAddTemplate(t)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <img src={t.imgSrc} alt="" style={{ width: '32px', height: '32px', borderRadius: '4px', objectFit: 'cover' }} />
                                                <span style={{ fontSize: '14px' }}>{t.title}</span>
                                            </div>
                                            <PlusCircle size={18} color="#10B981" />
                                        </div>
                                    ))}
                                    {filteredTemplates.length === 0 && <p style={{ textAlign: 'center', color: '#9ca3af', marginTop: '20px' }}>Không tìm thấy hoặc đã chọn hết.</p>}
                                </div>
                            </div>

                            {/* CỘT PHẢI: Kéo Thả */}
                            <div>
                                <label className="form-label" style={{ fontWeight: 'bold', color: '#027A48' }}>
                                    Template đã chọn ({selectedTemplates.length})
                                </label>
                                <p className="settings-item__description" style={{ marginBottom: '1rem' }}>
                                    Kéo thả để sắp xếp thứ tự hiển thị của các template trong khối này ngoài website.
                                </p>

                                <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', height: '530px', overflowY: 'auto', padding: '10px', backgroundColor: '#f9fafb' }}>
                                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                        <SortableContext items={selectedTemplates.map(t => t._id)} strategy={verticalListSortingStrategy}>
                                            {selectedTemplates.map((template) => (
                                                <SortableSelectedTemplate key={template._id} template={template} onRemove={handleRemoveTemplate} />
                                            ))}
                                        </SortableContext>
                                    </DndContext>
                                    {selectedTemplates.length === 0 && <p style={{ textAlign: 'center', color: '#9ca3af', marginTop: '40px' }}>Chưa có template nào được chọn.</p>}
                                </div>
                            </div>

                        </div>
                        <div className="modal-footer" style={{ justifyContent: 'flex-end', gap: '10px' }}>
                            <button onClick={() => setIsModalOpen(false)} className="btn btn-secondary">Hủy</button>
                            <button onClick={handleSubmit} className="btn btn-primary">Lưu Khối</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const TemplateManagementPage = () => {
    // 1. State cơ bản
    const [templates, setTemplates] = React.useState([]);
    const [showQuickBuilder, setShowQuickBuilder] = useState(false);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [editingTemplate, setEditingTemplate] = React.useState(null);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const navigate = useNavigate();

    // State cho Modal xóa hàng loạt
    const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
    const [filtersForDeletion, setFiltersForDeletion] = useState({});

    // 2. State cho Bộ lọc Danh mục (Đã sửa đổi để dùng NavTree)
    const [navTree, setNavTree] = useState([]); // Lưu toàn bộ cây danh mục
    const [categories, setCategories] = useState([]);
    const [groups, setGroups] = useState([]);
    const [types, setTypes] = useState([]);

    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedGroup, setSelectedGroup] = useState('all');
    const [selectedType, setSelectedType] = useState('all');

    // 3. Hàm Fetch Templates từ Server
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

    // 4. Effect: Tải cấu trúc danh mục chuẩn (Thay thế logic cũ)
    useEffect(() => {
        const fetchNavTree = async () => {
            try {
                const response = await AuthService.getSettings();
                const settings = response?.data || response || {}; // Bóc tách an toàn phòng trường hợp có wrapper "data"
                const tree = settings.headerNav || [];

                setNavTree(tree);
                // Cấp 1: Categories
                setCategories(tree.map(node => node.title));
            } catch (error) {
                console.error("Không thể tải cấu trúc danh mục chuẩn.", error);
            }
        };
        fetchNavTree();
    }, []);

    // 5. Effect: Tự động cập nhật Groups khi Category thay đổi (Client-side)
    useEffect(() => {
        if (selectedCategory && selectedCategory !== 'all') {
            const catNode = navTree.find(n => n.title === selectedCategory);
            if (catNode && catNode.children) {
                setGroups(catNode.children.map(n => n.title));
            } else {
                setGroups([]);
            }
        } else {
            setGroups([]);
        }
        // Reset cấp con khi cấp cha đổi
        if (selectedCategory === 'all') {
            setSelectedGroup('all');
            setSelectedType('all');
        }
    }, [selectedCategory, navTree]);

    // 6. Effect: Tự động cập nhật Types khi Group thay đổi (Client-side)
    useEffect(() => {
        if (selectedCategory && selectedGroup && selectedGroup !== 'all') {
            const catNode = navTree.find(n => n.title === selectedCategory);
            const groupNode = catNode?.children?.find(n => n.title === selectedGroup);
            if (groupNode && groupNode.children) {
                setTypes(groupNode.children.map(n => n.title));
            } else {
                setTypes([]);
            }
        } else {
            setTypes([]);
        }
        // Reset cấp con khi cấp cha đổi
        if (selectedGroup === 'all') {
            setSelectedType('all');
        }
    }, [selectedGroup, selectedCategory, navTree]);

    // 7. Effect: Debounce tìm kiếm và lọc
    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            fetchTemplates(searchTerm, selectedCategory, selectedGroup, selectedType);
        }, 300);
        return () => clearTimeout(debounceTimer);
    }, [searchTerm, selectedCategory, selectedGroup, selectedType, fetchTemplates]);

    // 8. Các hàm xử lý hành động (Handlers)
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

    const handleOpenModal = (template = null) => { setEditingTemplate(template); setIsModalOpen(true); };
    const handleCloseModal = () => { setIsModalOpen(false); setEditingTemplate(null); };

    // Xử lý lưu template (Create/Update)
    const handleSaveTemplate = async (templateDataObject) => {
        const formData = new FormData();

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
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Lưu mẫu thất bại.";
            toast.error(errorMessage);
            console.error(errorMessage);
        }
    };

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

    // Xử lý kéo thả (Drag and Drop)
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

    // 9. Render UI
    return (
        <div>
            <AdminHeader title="Quản lý Mẫu thiệp" />
            <div className="template-filter-container">
                <div className="card template-category-filter">
                    <div className="taxonomy-selector-grid">
                        {/* Cột 1: Categories */}
                        <div className="taxonomy-selector-column">
                            <div className="taxonomy-header">Danh mục</div>
                            <div
                                className={`taxonomy-selector-item ${selectedCategory === 'all' ? 'selected' : ''}`}
                                onClick={() => {
                                    setSelectedCategory('all');
                                    // Reset cấp con khi chọn All
                                    setSelectedGroup('all');
                                    setSelectedType('all');
                                }}
                            >
                                Tất cả Danh mục
                            </div>
                            {categories.map(cat => (
                                <div
                                    key={cat}
                                    className={`taxonomy-selector-item ${selectedCategory === cat ? 'selected' : ''}`}
                                    onClick={() => {
                                        setSelectedCategory(cat);
                                        // Reset cấp con khi đổi Category
                                        setSelectedGroup('all');
                                        setSelectedType('all');
                                    }}
                                >
                                    {cat}
                                </div>
                            ))}
                        </div>

                        {/* Cột 2: Groups */}
                        <div className="taxonomy-selector-column">
                            <div className="taxonomy-header">Nhóm</div>
                            {selectedCategory !== 'all' ? (
                                <>
                                    <div
                                        className={`taxonomy-selector-item ${selectedGroup === 'all' ? 'selected' : ''}`}
                                        onClick={() => {
                                            setSelectedGroup('all');
                                            setSelectedType('all');
                                        }}
                                    >
                                        Tất cả Nhóm
                                    </div>
                                    {groups.map(grp => (
                                        <div
                                            key={grp}
                                            className={`taxonomy-selector-item ${selectedGroup === grp ? 'selected' : ''}`}
                                            onClick={() => {
                                                setSelectedGroup(grp);
                                                setSelectedType('all');
                                            }}
                                        >
                                            {grp}
                                        </div>
                                    ))}
                                </>
                            ) : (
                                <div className="taxonomy-selector-placeholder">
                                    <span>Chọn một danh mục...</span>
                                </div>
                            )}
                        </div>

                        {/* Cột 3: Types */}
                        <div className="taxonomy-selector-column">
                            <div className="taxonomy-header">Loại</div>
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
                                    <span>Chọn một nhóm...</span>
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
                        <button onClick={() => setShowQuickBuilder(true)} className="btn btn-secondary" style={{ backgroundColor: '#4f46e5', color: 'white', borderColor: '#4f46e5' }}>
                            ✨ Tạo nhanh mẫu mới
                        </button>
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
            {showQuickBuilder && (
                <QuickCardBuilder
                    onClose={() => setShowQuickBuilder(false)}
                    onSuccess={() => fetchTemplates(searchTerm, selectedCategory, selectedGroup, selectedType)}
                />
            )}
        </div>
    );
};
// 1. Khai báo Template trống mặc định
const DEFAULT_EMPTY_TEMPLATE_DATA = {
    width: 800,
    height: 600,
    pages: []
};

// 2. Khai báo Template dành riêng cho Thiệp Cưới
const DEFAULT_WEDDING_TEMPLATE_DATA = {
    width: 800,
    height: 600,
    pages: [],
    settings: {
        "eventDate": "2025-10-31T17:15",
        "groomName": "",
        "brideName": "",
        "groomInfo": "",
        "brideInfo": "",
        "groomImageUrl": "https://r2.icards.com.vn/501f88ddc46c5a60e6ecd91eeb19ae29",
        "brideImageUrl": "https://r2.icards.com.vn/002ee2d17b57824618d24c5a7a58da3f",
        "heroImages": { "main": "", "sub1": "", "sub2": "" },
        "galleryImages": [
            "https://r2.icards.com.vn/2ff12b45bc62fa64dd67b4dd8d0b189a",
            "https://r2.icards.com.vn/25abd5ced1b32b70361cc574a152fc49",
            "https://r2.icards.com.vn/7c4e674b0cb7c75d84bb7b2ea1a77608",
            "https://r2.icards.com.vn/37653f755395c6ac95af87227ae0c41b",
            "https://r2.icards.com.vn/0ee5d9d99c17c8d5712ce445d9837767",
            "https://r2.icards.com.vn/ae2a16a72050fd4b08b0195ebb8fa2bd",
            "https://r2.icards.com.vn/ddd3015fda469752e527f9d7ae5334a5"
        ],
        "bannerImages": [
            { "id": "new-5769ec5c-37b6-4b7a-98f4-49df1c9fd2d1", "url": "https://r2.icards.com.vn/068833f27e99d9e62a2eedcda5151ea0" },
            { "id": "new-7982a715-7eb9-4ec5-964f-129c409e49ae", "url": "https://r2.icards.com.vn/ddf067601b8ce637b66db83d4cd4e509" },
            { "id": "new-52f78db8-b6d6-45f2-a1ce-8abc6fa814af", "url": "https://r2.icards.com.vn/f4543519a31f8cebab99d8fa22f9b749" }
        ],
        "contactGroom": "",
        "contactBride": "",
        "eventLocation": { "lat": 21.028511, "lng": 105.804817, "address": "" },
        "musicUrl": "",
        "qrCodeImageUrls": [],
        "videoUrl": "https://youtu.be/Uha-5D1UpEk",
        "invitationType": "Thiệp cưới",
        "eventDescription": "",
        "groomNameStyle": { "fontFamily": "Playfair Display", "fontSize": 28, "color": "#4a4a68", "fontWeight": "600" },
        "brideNameStyle": { "fontFamily": "Playfair Display", "fontSize": 28, "color": "#4a4a68", "fontWeight": "600" },
        "eventDescriptionStyle": { "fontFamily": "Inter", "fontSize": 18, "color": "#555555", "textAlign": "center" },
        "groomInfoStyle": { "fontFamily": "Inter", "fontSize": 16, "color": "#555555", "textAlign": "center" },
        "brideInfoStyle": { "fontFamily": "Inter", "fontSize": 16, "color": "#555555", "textAlign": "center" },
        "groomImagePosition": { "x": 68, "y": 71, "scale": 1.8 },
        "brideImagePosition": { "x": 0, "y": 0, "scale": 1 },
        "contactGroomStyle": { "fontFamily": "Inter", "fontSize": 15, "color": "#777777", "textAlign": "center" },
        "contactBrideStyle": { "fontFamily": "Inter", "fontSize": 15, "color": "#777777", "textAlign": "center" },
        "countdownTitleStyle": { "fontFamily": "Playfair Display", "fontSize": 44, "color": "#4a4a68", "fontWeight": "600" },
        "coupleTitleStyle": { "fontFamily": "Playfair Display", "fontSize": 44, "color": "#4a4a68", "fontWeight": "600" },
        "coupleSubtitleStyle": { "fontFamily": "Inter", "fontSize": 18, "color": "#777777", "fontStyle": "italic" },
        "participantsTitleStyle": { "fontFamily": "Playfair Display", "fontSize": 44, "color": "#4a4a68", "fontWeight": "600" },
        "eventsTitleStyle": { "fontFamily": "Playfair Display", "fontSize": 44, "color": "#4a4a68", "fontWeight": "600" },
        "loveStoryTitleStyle": { "fontFamily": "Playfair Display", "fontSize": 44, "color": "#4a4a68", "fontWeight": "600" },
        "galleryTitleStyle": { "fontFamily": "Playfair Display", "fontSize": 44, "color": "#4a4a68", "fontWeight": "600" },
        "videoTitleStyle": { "fontFamily": "Playfair Display", "fontSize": 44, "color": "#4a4a68", "fontWeight": "600" },
        "contactTitleStyle": { "fontFamily": "Playfair Display", "fontSize": 44, "color": "#4a4a68", "fontWeight": "600" },
        "qrCodeTitleStyle": { "fontFamily": "Playfair Display", "fontSize": 44, "color": "#4a4a68", "fontWeight": "600" },
        "participantTitleStyle": { "fontFamily": "Playfair Display", "fontSize": 20, "color": "#4a4a68" },
        "participantContentStyle": { "fontFamily": "Inter", "fontSize": 15, "color": "#555555" },
        "eventCardTitleStyle": { "fontFamily": "Playfair Display", "fontSize": 24, "color": "#4a4a68" },
        "eventCardInfoStyle": { "fontFamily": "Inter", "fontSize": 16, "color": "#555555" },
        "loveStoryItemTitleStyle": { "fontFamily": "Playfair Display", "fontSize": 36, "color": "#4a4a68" },
        "loveStoryItemDateStyle": { "fontFamily": "Inter", "fontSize": 15, "color": "#777777" },
        "loveStoryItemDescStyle": { "fontFamily": "Inter", "fontSize": 16, "color": "#555555" },
        "contactCardHeaderStyle": { "fontFamily": "Inter", "fontSize": 18, "color": "#4a4a68", "fontWeight": "600", "textTransform": "uppercase" },
        "contactCardNameStyle": { "fontFamily": "Inter", "fontSize": 16, "color": "#333333", "fontWeight": "500" },
        "qrCodeCaptionStyle": { "fontFamily": "Inter", "fontSize": 14, "color": "#555555", "marginTop": "8px" },
        "countdownValueStyle": { "fontFamily": "Playfair Display", "fontSize": 40, "color": "#4a4a68", "fontWeight": "700" },
        "countdownLabelStyle": { "fontFamily": "Inter", "fontSize": 14, "color": "#777777", "textTransform": "uppercase", "fontWeight": "500" },
        "events": [
            {
                "id": "7d4e68ce-ef1c-444f-9089-3ae609f44135", "title": "", "date": "", "time": "", "address": "",
                "mapUrl": "https://www.google.com/maps/place/St.+Joseph+Cathedral/@21.0287258,105.8485715,21z/data=!4m14!1m7!3m6!1s0x3135ab945034b945:0x90b57620787fd98e!2sSt.+Joseph+Cathedral!8m2!3d21.0286373!4d105.8488331!16s%2Fm%2F02rwkq5!3m5!1s0x3135ab945034b945:0x90b57620787fd98e!8m2!3d21.0286373!4d105.8488331!16s%2Fm%2F02rwkq5?entry=ttu&g_ep=EgoyMDI1MTAyMi4wIKXMDSoASAFQAw%3D%3D", "imageUrl": "https://r2.icards.com.vn/562aee9af4af25303e3c9b384d4be8d9",
                "dressCode": [{ "color": "#000000" }, { "color": "#FFFFFF" }]
            },
            {
                "id": "a381d3c0-0849-462e-8f88-4f39a1d4db22", "title": "", "date": "", "time": "", "address": "",
                "mapUrl": "https://www.google.com/maps/place/St.+Joseph+Cathedral/@21.0287258,105.8485715,21z/data=!4m14!1m7!3m6!1s0x3135ab945034b945:0x90b57620787fd98e!2sSt.+Joseph+Cathedral!8m2!3d21.0286373!4d105.8488331!16s%2Fm%2F02rwkq5!3m5!1s0x3135ab945034b945:0x90b57620787fd98e!8m2!3d21.0286373!4d105.8488331!16s%2Fm%2F02rwkq5?entry=ttu&g_ep=EgoyMDI1MTAyMi4wIKXMDSoASAFQAw%3D%3D", "imageUrl": "https://r2.icards.com.vn/b6221f3477ee43aa29065594df178020",
                "dressCode": [{ "color": "#000000" }, { "color": "#FFFFFF" }]
            }
        ],
        "participants": [
            { "id": "1945135c-c35f-416a-bc7e-a016d6c35d21", "title": "", "content": "", "imageUrl": "https://r2.icards.com.vn/216104106cfe753873c2448213143539" }
        ],
        "loveStory": [
            { "id": "a859942e-509b-4a28-afa3-f5dabe4732d2", "title": "", "date": "", "description": "", "imageUrl": null },
            { "id": "c74f54bf-5eab-4414-8e60-597f15862ec9", "title": "", "date": "", "description": "", "imageUrl": null }
        ],
        "blocksOrder": [
            "BANNER_CAROUSEL", "EVENT_DESCRIPTION", "COUPLE_INFO", "PARTICIPANTS", "EVENT_SCHEDULE", "COUNTDOWN",
            "LOVE_STORY", "GALLERY", "VIDEO", "CONTACT_INFO", "QR_CODES", "RSVP", "CUSTOM_HTML"
        ],
        "countdownTitle": "",
        "coupleTitle": "",
        "coupleSubtitle": "",
        "participantsTitle": "",
        "eventsTitle": "",
        "loveStoryTitle": "",
        "galleryTitle": "",
        "videoTitle": "",
        "contactTitle": "",
        "qrCodeTitle": "",
        "rsvpTitle": "",
        "rsvpSubtitle": "",
        "rsvpTitleStyle": { "fontFamily": "Playfair Display", "fontSize": 44, "color": "#4a4a68", "fontWeight": "600" },
        "rsvpSubtitleStyle": { "fontFamily": "Inter", "fontSize": 18, "color": "#555555", "textAlign": "center" },
        "customHtmlContent": "<p></p>"
    }
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
        isActive: false, // 1. Mặc định trạng thái là chưa hiển thị (false)
        loveGiftsButton_isEnabled: false,
        loveGiftsButton_text: '',
        loveGiftsButton_link: '',
    });

    // State cho cấu trúc danh mục
    const [navTree, setNavTree] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [groups, setGroups] = useState([]);
    const [types, setTypes] = useState([]);

    useEffect(() => {
        const fetchNavTree = async () => {
            if (isOpen) {
                try {
                    const response = await AuthService.getSettings();
                    // SỬA TẠI ĐÂY: Bóc tách data an toàn giống hệt như bộ lọc bên ngoài
                    const settings = response?.data || response || {};
                    const tree = settings.headerNav || [];

                    setNavTree(tree);
                    setCategories(tree.map(node => node.title));
                } catch (error) {
                    console.error("Lỗi tải danh mục:", error);
                }
            }
        };
        fetchNavTree();
    }, [isOpen]);

    // Logic cập nhật Groups/Types tự động dựa trên navTree
    useEffect(() => {
        if (formData.category && navTree.length > 0) {
            const catNode = navTree.find(n => n.title === formData.category);
            setGroups(catNode?.children?.map(n => n.title) || []);
        } else {
            setGroups([]);
        }
    }, [formData.category, navTree]);

    useEffect(() => {
        if (formData.category && formData.group && navTree.length > 0) {
            const catNode = navTree.find(n => n.title === formData.category);
            const groupNode = catNode?.children?.find(n => n.title === formData.group);
            setTypes(groupNode?.children?.map(n => n.title) || []);
        } else {
            setTypes([]);
        }
    }, [formData.group, formData.category, navTree]);

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
                    isActive: false, // Thêm mới luôn là false
                    loveGiftsButton_isEnabled: false, loveGiftsButton_text: '', loveGiftsButton_link: '',
                });
            }
        }
    }, [template, isOpen]);

    const handleCategorySelect = (field, value) => {
        if (formData[field] === value) return;

        setFormData(prev => {
            // 1. Tạo bản sao của state hiện tại
            const newState = { ...prev };

            // 2. Cập nhật lại các cấp danh mục theo logic reset cấp con
            if (field === 'category') {
                newState.category = value;
                newState.group = '';
                newState.type = '';
            } else if (field === 'group') {
                newState.group = value;
                newState.type = '';
            } else {
                newState[field] = value;
            }

            // 3. Xử lý tự động điền JSON (CHỈ áp dụng khi thêm mới - không có template)
            if (!template) {
                const valueLower = value.toLowerCase();

                // Nếu tùy chọn vừa click (ở BẤT KỲ cấp nào) có chứa chữ "cưới"
                if (valueLower.includes('cưới')) {
                    newState.templateData = JSON.stringify(DEFAULT_WEDDING_TEMPLATE_DATA, null, 2);
                }
                // Nếu tùy chọn vừa click có chứa chữ "cảm ơn" hoặc "chúc mừng"
                else if (valueLower.includes('cảm ơn') || valueLower.includes('chúc mừng')) {
                    newState.templateData = JSON.stringify(DEFAULT_EMPTY_TEMPLATE_DATA, null, 2);
                }
                /* Lưu ý: Không có 'else' ở đây. 
                  Điều này giúp bảo toàn data nếu người dùng chọn Danh mục "Thiệp cưới" (đổ data cưới),
                  sau đó chọn tiếp Nhóm "Hiện đại" (chữ "hiện đại" không chứa từ "cưới", nhưng data cưới vẫn được giữ nguyên).
                */
            }

            return newState;
        });
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

        // --- BẮT ĐẦU VÁ TẠM: NGẤM NGẦM TẠO ẢNH ĐẠI DIỆN ---
        // Nếu là thêm mới (không có template)
        if (!template) {
            try {
                // 1. Dùng Canvas vẽ một tấm ảnh placeholder
                const canvas = document.createElement('canvas');
                canvas.width = 400;
                canvas.height = 600;
                const ctx = canvas.getContext('2d');

                // Tô nền xám nhạt
                ctx.fillStyle = '#f8f9fa';
                ctx.fillRect(0, 0, 400, 600);

                // Viết chữ tạm
                ctx.fillStyle = '#adb5bd';
                ctx.font = '20px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Đang khởi tạo ảnh...', 200, 300);

                // 2. Chuyển Canvas thành Data URL
                const dataUrl = canvas.toDataURL('image/jpeg');

                // 3. Gọi hàm dataURLtoFile (có sẵn ở đầu file) để biến thành File object thật
                saveData.imgSrc = dataURLtoFile(dataUrl, `temp-thumb-${Date.now()}.jpg`);
            } catch (err) {
                console.error("Lỗi vá tạm ảnh:", err);
            }
        }
        // --- KẾT THÚC VÁ TẠM ---

        onSave(saveData);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={template ? 'Chỉnh sửa Mẫu thiệp' : 'Thêm Mẫu thiệp mới'} size="xlarge">
            <div className="modal-body template-modal-body-no-scroll">
                <form onSubmit={handleSubmit} className="template-modal-form-wrapper">
                    <div className="template-modal-grid-layout">

                        {/* CỘT TRÁI: Thông tin cơ bản */}
                        <div className="template-col-left">
                            <div className="form-group">
                                <label className="form-label">Tiêu đề Mẫu *</label>
                                <input type="text" name="title" value={formData.title} onChange={handleChange} className="form-control" required />
                            </div>

                            <div className="form-group taxonomy-group-compact">
                                <label className="form-label">Phân loại (Theo cấu trúc Website) *</label>
                                <div className="taxonomy-selector-grid compact-grid">
                                    <div className="taxonomy-selector-column">
                                        <div className="taxonomy-header">Danh mục</div>
                                        {categories.map(cat => (
                                            <div key={cat} className={`taxonomy-selector-item ${formData.category === cat ? 'selected' : ''}`} onClick={() => handleCategorySelect('category', cat)}>{cat}</div>
                                        ))}
                                    </div>
                                    <div className="taxonomy-selector-column">
                                        <div className="taxonomy-header">Nhóm</div>
                                        {formData.category && groups.length > 0 ? (
                                            groups.map(grp => (
                                                <div key={grp} className={`taxonomy-selector-item ${formData.group === grp ? 'selected' : ''}`} onClick={() => handleCategorySelect('group', grp)}>{grp}</div>
                                            ))
                                        ) : (<div className="taxonomy-selector-placeholder"><span>Chọn danh mục...</span></div>)}
                                    </div>
                                    <div className="taxonomy-selector-column">
                                        <div className="taxonomy-header">Loại</div>
                                        {formData.group && types.length > 0 ? (
                                            types.map(typ => (
                                                <div key={typ} className={`taxonomy-selector-item ${formData.type === typ ? 'selected' : ''}`} onClick={() => handleCategorySelect('type', typ)}>{typ}</div>
                                            ))
                                        ) : (<div className="taxonomy-selector-placeholder"><span>Chọn nhóm...</span></div>)}
                                    </div>
                                </div>
                            </div>

                            <div className="form-group flex-grow-editor">
                                <label className="form-label">Mô tả</label>
                                {/* Cần đảm bảo CustomEditor của bạn nhận được chiều cao 100% qua CSS */}
                                <div className="editor-wrapper-compact">
                                    <CustomEditor data={formData.description || ""} onChange={(data) => { handleChange({ target: { name: 'description', value: data } }); }} />
                                </div>
                            </div>
                        </div>

                        {/* CỘT PHẢI: Trạng thái & JSON */}
                        <div className="template-col-right">
                            {template && (
                                <div className="form-group status-group-compact">
                                    <label className="form-label">Trạng thái</label>
                                    <div className="publish-toggle">
                                        <div className="toggle-wrapper">
                                            <span style={{ color: formData.isActive ? '#027A48' : '#667085' }}>{formData.isActive ? 'Đang hiển thị' : 'Chưa hiển thị'}</span>
                                            <label className="switch"><input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} /><span className="slider round"></span></label>
                                        </div>
                                    </div>
                                    <p className="settings-item__description auto-gen-note">
                                        Ảnh đại diện sẽ được tự động tạo khi lưu mẫu.
                                    </p>
                                </div>
                            )}

                            {/* Textarea JSON được ép nở ra lấp đầy chiều cao */}
                            <div className="form-group flex-grow-editor json-editor-group">
                                <label className="form-label">Dữ liệu Template (JSON)</label>
                                <textarea
                                    name="templateData"
                                    value={formData.templateData}
                                    onChange={handleChange}
                                    className="form-control code-editor fill-height"
                                // Loại bỏ rows="8" để CSS flex kiểm soát
                                ></textarea>
                            </div>
                        </div>
                    </div>

                    {/* FOOTER NẰM CỐ ĐỊNH Ở ĐÁY */}
                    <div className="modal-footer sticky-footer">
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
// ================================================================================
// END: TEMPLATE MODAL REFACTOR
// ================================================================================


const BannerSlotEditor = ({ banner, label, hint, fieldPrefix, onUpdate, onFileChange }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const b = banner;

    const update = (field, value) => onUpdate({ ...b, [field]: value });

    const generateHtmlLayout = (bannerData) => {
        const hasVideoUrl = bannerData.videoUrl && bannerData.videoUrl.trim() !== '';
        const mediaTag = hasVideoUrl
            ? `<video src="${bannerData.videoUrl}" autoplay loop muted style="width: 100%; height: 100%; object-fit: cover; display: block;"></video>`
            : `<img src="${bannerData.imageUrl || 'https://placehold.co/1200x400/eaecf0/98a2b3?text=Banner+Nền'}" alt="${bannerData.title || ''}" style="width: 100%; height: 100%; object-fit: cover; display: block;" />`;

        // THÊM: Đoạn HTML của nút bấm
        const buttonHtml = (bannerData.buttonText && bannerData.buttonLink)
            ? `<a href="${bannerData.buttonLink}" style="display: inline-block; padding: 12px 28px; margin-top: 10px; background-color: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; transition: background-color 0.3s; pointer-events: auto;">${bannerData.buttonText}</a>`
            : '';

        return `<div style="position: relative; width: 100vw; left: 50%; right: 50%; margin-left: -50vw; margin-right: -50vw; min-height: 450px; background-color: #f8fafc; overflow: hidden; font-family: sans-serif;">
  <div style="position: absolute; inset: 0; z-index: 1; pointer-events: none;">
    ${mediaTag}
  </div>
  <div style="position: absolute; inset: 0; z-index: 2; background: linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.6) 100%); pointer-events: none;"></div>
  <div style="position: absolute; inset: 0; z-index: 3; display: flex; flex-direction: column; justify-content: center; align-items: flex-start; padding: 40px 5%; max-width: 1200px; margin: 0 auto; pointer-events: none;">
    <h2 style="margin: 0 0 16px 0; font-size: 36px; color: #ffffff; font-weight: 700; line-height: 1.2; text-shadow: 0 2px 4px rgba(0,0,0,0.4);">
      ${bannerData.title || 'Tiêu Đề Banner'}
    </h2>
    <p style="margin: 0 0 16px 0; font-size: 18px; color: rgba(255, 255, 255, 0.95); line-height: 1.5; text-shadow: 0 1px 2px rgba(0,0,0,0.4);">
      ${bannerData.subtitle || 'Tiêu đề phụ hoặc mô tả ngắn gọn.'}
    </p>
    ${buttonHtml}
  </div>
</div>`;
    };

    const handleMediaTypeChange = (newType) => {
        let updated = { ...b, mediaType: newType };
        if (newType === 'html' && (!b.htmlContent || b.htmlContent.trim() === '' || b.htmlContent === '<p></p>')) {
            updated.htmlContent = generateHtmlLayout(b);
        }
        onUpdate(updated);
    };

    const handleForceSyncHtml = () => {
        if (window.confirm('Hành động này sẽ xóa code HTML hiện tại và gen lại toàn bộ từ đầu bằng Ảnh và Tiêu đề cơ bản. Bạn có chắc chắn?')) {
            update('htmlContent', generateHtmlLayout(b));
        }
    };

    const handleBannerFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const isVideo = b.mediaType === 'video';
            const field = isVideo ? 'videoUrl' : 'imageUrl';
            const fieldName = `${fieldPrefix}__${field}`;
            onFileChange(fieldName, file);
            onUpdate({ ...b, [field]: URL.createObjectURL(file) });
        }
    };

    const mediaType = b.mediaType || 'image';

    return (
        <div className="banner-editor-item">
            <div className="banner-editor-header">
                <strong className="banner-title" onClick={() => setIsExpanded(!isExpanded)}>
                    {label} ({mediaType === 'video' ? 'Video' : mediaType === 'html' ? 'Nâng cao (HTML)' : 'Ảnh'})
                </strong>
                <div className="banner-header-actions">
                    <div className="publish-toggle">
                        <div className="toggle-wrapper">
                            <span>{b.isEnabled ? 'Đang hiển thị' : 'Đã tắt'}</span>
                            <button type="button" className={`btn-toggle ${b.isEnabled ? 'active' : ''}`} onClick={() => update('isEnabled', !b.isEnabled)}>
                                {b.isEnabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                            </button>
                        </div>
                    </div>
                    <button onClick={() => setIsExpanded(!isExpanded)} className="expand-button">
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                </div>
            </div>

            {hint && <p className="settings-item__description" style={{ margin: '4px 0 12px 0' }}>{hint}</p>}

            {isExpanded && (
                <div className="banner-editor-content">
                    <div className="form-group">
                        <label className="form-label">Chế độ hiển thị</label>
                        <Select value={mediaType} onChange={handleMediaTypeChange} style={{ width: '100%' }}>
                            <Option value="image"><ImageIcon size={16} style={{ marginRight: 8 }} /> Ảnh cơ bản</Option>
                            <Option value="video"><VideoIcon size={16} style={{ marginRight: 8 }} /> Video MP4</Option>
                            <Option value="html"><Layout size={16} style={{ marginRight: 8 }} /> Tùy chỉnh nâng cao (Sinh code HTML)</Option>
                        </Select>
                    </div>

                    {mediaType !== 'html' && (
                        <>
                            <div className="form-group">
                                <label className="form-label">{mediaType === 'video' ? 'Video Banner (.mp4)' : 'Ảnh Banner'}</label>
                                <div className="image-upload-preview single" style={{ position: 'relative', padding: 0, overflow: 'hidden', border: '1px solid #e2e8f0', minHeight: '220px', backgroundColor: '#f8fafc', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                    {mediaType === 'video' ? (
                                        b.videoUrl && <video src={b.videoUrl} autoPlay loop muted style={{ width: '100%', height: '220px', objectFit: 'cover', display: 'block' }} />
                                    ) : (
                                        b.imageUrl && <img src={b.imageUrl} alt="Banner Preview" style={{ width: '100%', height: '220px', objectFit: 'cover', display: 'block', padding: 0, border: 'none' }} />
                                    )}
                                    <label className="btn" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'rgba(255,255,255,0.95)', color: '#1e293b', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', cursor: 'pointer', zIndex: 10, padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', display: 'flex', gap: '8px', alignItems: 'center', fontWeight: '500' }}>
                                        <Upload size={16} /> {(mediaType === 'video' ? b.videoUrl : b.imageUrl) ? 'Thay đổi' : 'Tải lên'}
                                        <input type="file" accept={mediaType === 'video' ? 'video/mp4' : 'image/*'} hidden onChange={handleBannerFileChange} />
                                    </label>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Tiêu đề (hiển thị trên banner)</label>
                                <input type="text" className="form-control" value={b.title || ''} onChange={(e) => update('title', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Tiêu đề phụ (hiển thị trên banner)</label>
                                <input type="text" className="form-control" value={b.subtitle || ''} onChange={(e) => update('subtitle', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Text nút bấm</label>
                                <input type="text" className="form-control" value={b.buttonText || ''} onChange={(e) => update('buttonText', e.target.value)} placeholder="VD: Khám phá ngay, Mua ngay..." />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Đường dẫn nút bấm (Link)</label>
                                <input type="text" className="form-control" value={b.buttonLink || ''} onChange={(e) => update('buttonLink', e.target.value)} placeholder="VD: /shop hoặc https://..." />
                            </div>
                        </>
                    )}

                    {mediaType === 'html' && (
                        <div className="form-group">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
                                <label className="form-label" style={{ color: '#1e3a8a', fontWeight: 600, margin: 0 }}>Nội dung HTML</label>
                                <button type="button" onClick={handleForceSyncHtml} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#eff6ff', color: '#1e40af', borderColor: '#bfdbfe' }}>
                                    <LayoutTemplate size={14} /> Ghi đè HTML bằng cấu hình Cơ bản
                                </button>
                            </div>
                            <CustomEditor data={b.htmlContent || ''} onChange={(data) => update('htmlContent', data)} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};


const BannerEditor = ({ banners, onUpdate, onFileChange }) => {
    const [activePage, setActivePage] = useState('home');

    // banners = mảng cũ (định dạng gốc) -> chỉ convert để RENDER, không đổi state gốc
    const slots = useMemo(() => bannersArrayToSlots(banners), [banners]);

    // Khi 1 slot thay đổi: build lại toàn bộ slots -> convert ngược về mảng -> gửi lên parent
    const updateSlot = (slotPath, updatedBanner) => {
        const newSlots = _.cloneDeep(slots);
        _.set(newSlots, slotPath, updatedBanner);
        onUpdate('banners', slotsToBannersArray(newSlots));
    };

    const ALL_TABS = [{ key: 'home', label: 'Trang chủ' }, ...OTHER_PAGES];

    return (
        <div className="card settings-card">
            <h3 className="card__title"><Columns size={24} /> Quản lý Banner</h3>
            <p className="settings-description">
                Trang chủ có 3 vị trí cố định: Hero, Banner trên & Banner dưới (trước Footer).
                Mỗi trang còn lại (Cửa hàng, Chuyên nghiệp, Mẫu thiệp) chỉ có đúng 1 banner.
            </p>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '1.25rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px' }}>
                {ALL_TABS.map(p => (
                    <button
                        key={p.key}
                        type="button"
                        onClick={() => setActivePage(p.key)}
                        className={`btn ${activePage === p.key ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ padding: '6px 16px' }}
                    >
                        {p.label}
                    </button>
                ))}
            </div>

            <div className="all-banners-container">
                {activePage === 'home' ? (
                    ['hero', 'footerTop', 'footerBottom'].map(slotKey => (
                        <BannerSlotEditor
                            key={slotKey}
                            banner={slots.home[slotKey]}
                            label={HOME_SLOT_META[slotKey].label}
                            hint={HOME_SLOT_META[slotKey].hint}
                            fieldPrefix={`banners__${SLOT_ORDER.indexOf(`home.${slotKey}`)}`}
                            onUpdate={(updated) => updateSlot(`home.${slotKey}`, updated)}
                            onFileChange={onFileChange}
                        />
                    ))
                ) : (
                    <BannerSlotEditor
                        banner={slots[activePage]}
                        label={`Banner trang ${OTHER_PAGES.find(p => p.key === activePage)?.label}`}
                        fieldPrefix={`banners__${SLOT_ORDER.indexOf(activePage)}`}
                        onUpdate={(updated) => updateSlot(activePage, updated)}
                        onFileChange={onFileChange}
                    />
                )}
            </div>
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
                console.log("=== BẮT ĐẦU DEBUG SETTINGS BẰNG LOG ===");

                // Lấy data từ API
                const response = await AuthService.getSettings();
                console.log("🔴 BƯỚC 1 - Dữ liệu gốc (Raw Response) từ API:", response);

                // 1. BÓC TÁCH DỮ LIỆU AN TOÀN HƠN
                // Thêm trường hợp response?.data?.data để đề phòng Axios bọc 1 lớp 'data' 
                // và backend cũng trả về object có key là 'data'
                const rawSettings = response?.data?.data || response?.data || response || {};
                console.log("🟠 BƯỚC 2 - Dữ liệu sau khi bóc tách (rawSettings):", rawSettings);

                // 2. DEEP CLONE ĐỂ TRÁNH MUTATE
                let currentSettings = _.cloneDeep(rawSettings);

                // **LOGIC CHUYỂN ĐỔI DỮ LIỆU BANNER**
                if (currentSettings.banners && typeof currentSettings.banners === 'object' && !Array.isArray(currentSettings.banners)) {
                    console.log("🟡 BƯỚC 3 - Cấu trúc banner cũ được phát hiện, đang chuyển đổi...");
                    currentSettings.banners = Object.entries(currentSettings.banners).map(([key, value]) => {
                        return {
                            id: key,
                            name: _.startCase(key.replace(/_/g, ' ')),
                            isEnabled: value.isEnabled !== undefined ? value.isEnabled : true,
                            displayPage: value.displayPage || 'all',
                            htmlContent: value.htmlContent || '',
                            imageUrl: value.imageUrl || '',

                            // THÊM CÁC DÒNG NÀY ĐỂ GIỮ NGUYÊN DỮ LIỆU:
                            videoUrl: value.videoUrl || '',
                            title: value.title || '',
                            subtitle: value.subtitle || '',
                            buttonText: value.buttonText || '',
                            buttonLink: value.buttonLink || '',
                            link: value.link || '',
                        };
                    });
                }

                // 3. KHỞI TẠO CẤU TRÚC MẶC ĐỊNH CHUẨN
                _.defaultsDeep(currentSettings, {
                    theme: {
                        companyName: '',
                        address: '',
                        phone: '',
                        announcementBar: { text: '', isEnabled: false, backgroundImage: '', link: '', backgroundColor: '#333333', textColor: '#ffffff' },
                        logoUrl: null
                    },
                    banners: [],
                    footer: {
                        socialLinks: [],
                        columns: [],
                        legalLinks: [],
                        textContent: { title: '', blocks: [] }
                    },
                    headerNav: []
                });

                console.log("🟢 BƯỚC 4 - Dữ liệu sau khi _.defaultsDeep (currentSettings):", currentSettings);

                // 4. SANITIZE DATA
                if (Array.isArray(currentSettings.footer.socialLinks)) {
                    currentSettings.footer.socialLinks = currentSettings.footer.socialLinks
                        .map(link => (link && link.id && link.name) ? link : null)
                        .filter(Boolean);
                } else {
                    currentSettings.footer.socialLinks = [];
                }

                console.log("🔵 BƯỚC 5 - Dữ liệu cuối cùng được đưa vào State (setSettings):", currentSettings);
                setSettings(currentSettings);

            } catch (error) {
                console.error("Fetch settings error:", error);
                toast.error("Không thể tải dữ liệu cài đặt. Vui lòng thử lại.");
            } finally {
                setIsLoading(false);
                console.log("=== KẾT THÚC DEBUG SETTINGS ===");
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
                <button onClick={handleSaveChanges} className="btn btn-primary" disabled={isLoading}>
                    <Save size={20} /> {isLoading ? 'Đang lưu...' : 'Lưu tất cả thay đổi'}
                </button>
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
                        <div className="settings-item__control" style={{ flexDirection: 'column', alignItems: 'flex-end', gap: '1rem', width: '60%' }}>
                            <input type="text" className="form-control" placeholder="Nhập nội dung..." value={settings.theme.announcementBar.text} onChange={(e) => handleInputChange('theme.announcementBar.text', e.target.value)} />
                            <input type="text" className="form-control" placeholder="Đường dẫn (VD: /shop)" value={settings.theme.announcementBar.link || ''} onChange={(e) => handleInputChange('theme.announcementBar.link', e.target.value)} />
                            <div style={{ display: 'flex', gap: '1rem', width: '100%', alignItems: 'center' }}>
                                <label className="form-label" style={{ marginBottom: 0, whiteSpace: 'nowrap' }}>Màu nền:</label>
                                <input type="color" className="form-control" title="Chọn màu nền" value={settings.theme.announcementBar.backgroundColor || '#333333'} onChange={(e) => handleInputChange('theme.announcementBar.backgroundColor', e.target.value)} style={{ height: '40px' }} />
                                <label className="form-label" style={{ marginBottom: 0, whiteSpace: 'nowrap' }}>Màu chữ:</label>
                                <input type="color" className="form-control" title="Chọn màu chữ" value={settings.theme.announcementBar.textColor || '#ffffff'} onChange={(e) => handleInputChange('theme.announcementBar.textColor', e.target.value)} style={{ height: '40px' }} />
                            </div>
                            <div className="form-group" style={{ width: '100%' }}>
                                <label className="form-label">Ảnh nền (Tùy chọn)</label>
                                <div className="image-upload-preview single">
                                    <img
                                        src={getPreviewUrl(settings.theme?.announcementBar?.backgroundImage) || 'https://placehold.co/200x50/F8F9FA/B0C7EE?text=Ảnh+nền'}
                                        alt="Preview"
                                        style={{ height: '50px', width: 'auto', objectFit: 'cover' }}
                                    />
                                    <label className="btn btn-secondary btn-sm">
                                        <Upload size={16} /> {getPreviewUrl(settings.theme?.announcementBar?.backgroundImage) ? 'Thay đổi' : 'Tải lên'}
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
                                            <Trash2 size={16} />
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
                                {settings.theme.announcementBar.isEnabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
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
                <HomepageBlockManager />
                {/* ... (Giữ nguyên JSX cho Footer Management) ... */}
                <div className="card settings-card">
                    <h3 className="card__title"><LinkIcon size={24} /> Quản lý Footer</h3>
                    <div className="footer-section-divider">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h4 className="footer-section-title">Liên kết Mạng xã hội</h4>
                            <button onClick={addSocialLink} className="btn btn-green"><PlusCircle size={18} /> Thêm liên kết</button>
                        </div>
                        <div className="footer-links-editor">
                            {(settings.footer?.socialLinks || []).map((link, index) => (
                                <div key={link.id} className="social-link-item">
                                    <div className="social-icon-uploader">
                                        {getPreviewUrl(link.icon) ? (
                                            <img src={getPreviewUrl(link.icon)} alt="Preview" className="icon-preview" />
                                        ) : (
                                            <div className="icon-placeholder"><ImageIcon size={24} /></div>
                                        )}
                                        <input
                                            type="file"
                                            id={`social-icon-upload-${index}`}
                                            style={{ display: 'none' }}
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><h4 className="footer-section-title">Các Cột trong Footer</h4><button onClick={addFooterColumn} className="btn btn-green"><PlusCircle size={18} /> Thêm Cột</button></div>
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
                                    <button onClick={() => addFooterLink(colIndex)} className="btn btn-secondary btn-add-link"><PlusCircle size={16} /> Thêm liên kết</button>
                                </div>
                            ))}
                        </div>

                    </div>

                    <div className="footer-section-divider">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h4 className="footer-section-title">Liên kết Pháp lý (Chân trang)</h4>
                            <button onClick={addLegalLink} className="btn btn-green"><PlusCircle size={18} /> Thêm liên kết</button>
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
                <Route path="template-blocks" element={<TemplateBlockManagement />} />
                <Route path="design-assets" element={<DesignAssetManagementPage />} />
                <Route path="templates/design/:templateId?" element={<InvitationDesign />} />
                <Route path="categories" element={<TaxonomyManagementPage />} /> {/* Route mới */}
                <Route path="pages" element={<PageManagementPage />} />
                <Route path="pages/create" element={<PageEditPage />} />
                <Route path="pages/edit/:id" element={<PageEditPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="seo" element={<SeoManagementPage />} />
                <Route path="fonts" element={<FontManagementPage />} />
                <Route path="media" element={<MediaManagementPage />} />
            </Route>
        </Routes>
    );
};