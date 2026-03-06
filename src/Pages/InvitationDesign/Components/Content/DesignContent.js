import React, { useState, useRef, useEffect, useCallback, useLayoutEffect, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import api from "../../../../services/api";
import {
    Box, Typography, Card, CardContent, CardMedia, Grid, IconButton, Select, MenuItem, InputLabel, FormControl, Slider, Tooltip, Divider, useMediaQuery, List, ListItem, ListItemText, ListItemIcon, CircularProgress, Paper, ButtonGroup, ListItemButton,
    ToggleButtonGroup, ToggleButton,
    Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Checkbox
} from '@mui/material';
import { useTheme, alpha, styled } from '@mui/material/styles';
import {
    TextFields as TextFieldsIcon,
    Delete as DeleteIcon,
    ZoomIn as ZoomInIcon,
    ZoomOut as ZoomOutIcon,
    FlipToFront as FlipToFrontIcon,
    FlipToBack as FlipToBackIcon,
    Opacity as OpacityIcon,
    CloudUpload as CloudUploadIcon,
    PhotoLibrary as PhotoLibraryIcon,
    Image as ImageIcon,
    FilterVintage as FilterVintageIcon,
    CropFree as CropFreeIcon,
    ArrowBack as ArrowBackIcon,
    NavigateNext as NavigateNextIcon,
    Style as StyleIcon,
    Category as CategoryIcon,
    Label as LabelIcon,
    AddCircleOutline as AddCircleOutlineIcon,
    Menu as MenuIcon,
    Undo as UndoIcon,
    Redo as RedoIcon,
    ContentCopy as ContentCopyIcon,
    ContentPaste as ContentPasteIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
    Lock as LockIcon,
    LockOpen as LockOpenIcon,
    Add as AddIcon,
    CenterFocusStrong as CenterFocusStrongIcon,
    ViewModule as ViewModuleIcon,
    ViewCarousel as ViewCarouselIcon,
    Favorite as HeartIcon,
    People as PeopleIcon,
    CalendarToday as CalendarTodayIcon,
    Phone as PhoneIcon,
    DataObject as DataObjectIcon,
    CheckBox as CheckBoxIcon,
    Edit as EditIcon,
    DragIndicator as DragIndicatorIcon,
    BrokenImage as BrokenImageIcon,
    FormatBold as FormatBoldIcon,
    FormatItalic as FormatItalicIcon,
    FormatUnderlined as FormatUnderlinedIcon,
    FormatAlignCenter as FormatAlignCenterIcon,
    FormatAlignLeft as FormatAlignLeftIcon,
    FormatAlignRight as FormatAlignRightIcon,
    FileCopy as FileCopyIcon,
    Palette as PaletteIcon,
    Brush
} from '@mui/icons-material';
// import { toast } from 'react-toastify';
import { showErrorToast } from '../../../../Utils/toastHelper';
import _ from 'lodash';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    useDroppable,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Helmet } from 'react-helmet';
import html2canvas from 'html2canvas';
import "./EventSettingsPreview.css"
import { SketchPicker } from 'react-color';
import { Save } from 'lucide-react';
import DraggableSidebarItem from "./DraggableSidebarItem";
import CustomEditor from '../../../../components/CustomEditor';
import "./customeditor.css"
import { toast } from 'react-toastify';
const EDIT_SCALE = 1.0;
const addOriginQueryParam = (url) => {
    // Bỏ qua nếu không phải URL hợp lệ (ví dụ: blob, data:image)
    if (!url || typeof url !== 'string' || !url.startsWith('http')) {
        return url;
    }
    
    try {
        const urlObject = new URL(url);
        const hostname = window.location.hostname; // Lấy tên miền hiện tại

        // Xóa tham số 'site' cũ nếu có để tránh trùng lặp
        urlObject.searchParams.delete('site');

        // Thêm tham số mới dựa trên tên miền
        if (hostname.includes('admin')) {
            urlObject.searchParams.set('site', 'admin');
        } else {
            urlObject.searchParams.set('site', 'www');
        }
        return urlObject.toString();
    } catch (e) {
        // Trả về URL gốc nếu có lỗi (ví dụ URL không hợp lệ)
        console.error("Lỗi khi xử lý URL:", e);
        return url;
    }
};

const RsvpPreview = ({ settings, onSelectField, selectedFieldKey }) => (
    <Box className="section-container" sx={{ textAlign: 'center' }}>
        <SectionHeader
            title={settings.rsvpTitle || 'Xác Nhận Tham Dự'}
            subtitle={settings.rsvpSubtitle || 'Sự hiện diện của bạn là niềm vinh hạnh cho gia đình chúng tôi.'}
            onSelectField={onSelectField}
            selectedFieldKey={selectedFieldKey}
            titleKey="rsvpTitle"
            subtitleKey="rsvpSubtitle"
            titleStyle={settings.rsvpTitleStyle}
            subtitleStyle={settings.rsvpSubtitleStyle}
        />
        <Button variant="contained" size="large" sx={{ mt: 2 }}>
            Xác Nhận Tham Dự
        </Button>
    </Box>
);

const DroppablePage = ({ page, viewScale, children }) => {
    const { setNodeRef, isOver } = useDroppable({
        id: `page-drop-area-${page.id}`,
    });

    return (
        <motion.div
            ref={setNodeRef} // Gán ref từ useDroppable
            id={`page-container-${page.id}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{
                width: page.canvasWidth * viewScale,
                height: page.canvasHeight * viewScale,
                flexShrink: 0,
                position: 'relative',
                scrollSnapAlign: 'center',
                // Hiệu ứng viền xanh để người dùng biết đây là vùng thả
                outline: isOver ? `2px dashed #3B82F6` : 'none',
                outlineOffset: '4px',
                transition: 'outline 0.1s ease-in-out',
            }}
        >
            {/* Nội dung bên trong không thay đổi */}
            <motion.div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    scale: viewScale,
                    transformOrigin: 'top left',
                }}
            >
                {children}
            </motion.div>
        </motion.div>
    );
};


const IntegratedSidebarPanel = ({
    pages,
    currentPageId,
    currentItems,
    selectedItemId,
    currentBackgroundColor,
    onSelectPage,
    onDeletePage,
    onReorderPages,
    onAddPage,
    onSelectItem,
    onToggleVisibility,
    onToggleLock,
    onBackgroundColorChange,
    onBackgroundImageChange,
    onRemoveBackgroundImage,
    onReorderItems,
}) => {
    const fileInputRef = useRef(null);
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );
    const handleDragEndPages = (event) => {
        const { active, over } = event;
        if (active && over && active.id !== over.id) {
            onReorderPages(active.id, over.id);
        }
    };
    const handleDragEndItems = (event) => {
        const { active, over } = event;
        if (active && over && active.id !== over.id) {
            onReorderItems(active.id, over.id);
        }
    };
    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            onBackgroundImageChange(file);
        }
        if (event.currentTarget) {
           event.currentTarget.value = null;
        }
    };
    return (
        <Box sx={{ px: 2, pt: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom>Quản lý Trang</Typography>
            <Box sx={{ flexShrink: 0 }}>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndPages}>
                    <SortableContext items={pages.map(p => p.id)} strategy={verticalListSortingStrategy}>
                        <Box sx={{ maxHeight: 'calc(40vh - 120px)', overflowY: 'auto' }}>
                            {pages.map((page) => (
                                <SortablePageItem
                                    key={page.id}
                                    id={page.id}
                                    page={page}
                                    isSelected={page.id === currentPageId}
                                    onSelect={onSelectPage}
                                    onRemove={onDeletePage}
                                />
                            ))}
                        </Box>
                    </SortableContext>
                </DndContext>
                <Button
                    variant="contained"
                    startIcon={<AddCircleOutlineIcon />}
                    onClick={onAddPage}
                    fullWidth
                    sx={{ mt: 1, mb: 2 }}
                    disabled={pages.length === 0}
                >
                    Thêm trang mới
                </Button>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Typography variant="h6" gutterBottom>Thuộc tính Trang</Typography>
            {currentPageId && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
                    <TextField
                        label="Màu nền"
                        type="color"
                        value={currentBackgroundColor}
                        onChange={(e) => onBackgroundColorChange(e.target.value)}
                        fullWidth
                        size="small"
                        variant="outlined"
                        sx={{ '& input[type=color]': { height: '40px', padding: '4px' } }}
                    />
                    <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                    />
                    <Button
                        variant="outlined"
                        startIcon={<CloudUploadIcon />}
                        onClick={() => fileInputRef.current.click()}
                    >
                        Tải ảnh nền
                    </Button>
                    <Button
                        variant="text"
                        color="error"
                        size="small"
                        onClick={onRemoveBackgroundImage}
                    >
                        Xóa ảnh nền
                    </Button>
                </Box>
            )}
            <Typography variant="h6" gutterBottom>Các Lớp</Typography>
            <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
                {currentPageId && currentItems.length > 0 ? (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndItems}>
                        <SortableContext items={currentItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
                             <LayersPanel
                                items={currentItems}
                                selectedItemId={selectedItemId}
                                onSelectItem={onSelectItem}
                                onToggleVisibility={onToggleVisibility}
                                onToggleLock={onToggleLock}
                            />
                        </SortableContext>
                    </DndContext>
                ) : (
                    <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', mt: 2 }}>
                        Trang này không có đối tượng nào.
                    </Typography>
                )}
            </Box>
        </Box>
    );
};

const CustomHtmlPreview = ({ settings, onSelectField, selectedFieldKey }) => (
    <Box className="section-container">
        <SectionHeader
            title={settings.customHtmlTitle || 'Nội dung tùy chỉnh'}
            onSelectField={onSelectField}
            selectedFieldKey={selectedFieldKey}
            titleKey="customHtmlTitle"
        />
        <EditableWrapper
            fieldKey="customHtmlContent"
            onSelectField={onSelectField}
            selectedFieldKey={selectedFieldKey}
        >
            <Box
                className="tiptap-content1" 
                dangerouslySetInnerHTML={{ __html: settings.customHtmlContent || '<p>Nhấp để thêm nội dung của bạn...</p>' }}
                sx={{
                    padding: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    minHeight: '100px'
                }}
            />
        </EditableWrapper>
    </Box>
);
const AVAILABLE_BLOCKS = {
    BANNER_CAROUSEL: { key: 'bannerImages', label: 'Banner Carousel', description: 'Trình chiếu slide ảnh nổi bật ở vị trí đầu trang.', icon: <ViewCarouselIcon />, required: true, isList: true },
    EVENT_DESCRIPTION: { key: 'eventDescription', label: 'Câu chuyện / Lời mời', description: 'Đoạn văn bản ngắn gửi gắm cảm xúc và lời mời chân thành.', icon: <TextFieldsIcon /> },
    COUPLE_INFO: { key: 'coupleInfo', label: 'Thông tin Cô dâu & Chú rể', description: 'Hình ảnh, tên và đôi nét giới thiệu về hai nhân vật chính.', icon: <HeartIcon />, relatedFields: ['groomName', 'groomInfo', 'groomImageUrl', 'brideName', 'brideInfo', 'brideImageUrl'], titleKey: 'coupleTitle', subtitleKey: 'coupleSubtitle' },
    PARTICIPANTS: { key: 'participants', label: 'Thành viên tham gia', description: 'Giới thiệu những người quan trọng (Bố mẹ, phù dâu, phù rể...).', icon: <PeopleIcon />, isList: true, titleKey: 'participantsTitle' },
    EVENT_SCHEDULE: { key: 'events', label: 'Lịch trình sự kiện', description: 'Thời gian và địa điểm cụ thể của các hoạt động trong sự kiện.', icon: <CalendarTodayIcon />, isList: true, titleKey: 'eventsTitle' },
    COUNTDOWN: { key: 'eventDate', label: 'Đếm ngược thời gian', description: 'Đồng hồ đếm ngược sinh động đến ngày tổ chức.', icon: <CalendarTodayIcon />, titleKey: 'countdownTitle' },
    LOVE_STORY: { key: 'loveStory', label: 'Chuyện tình yêu', description: 'Dòng thời gian (Timeline) kể lại các cột mốc đáng nhớ.', icon: <FilterVintageIcon />, isList: true, titleKey: 'loveStoryTitle' },
    GALLERY: { key: 'galleryImages', label: 'Bộ sưu tập ảnh', description: 'Lưới hình ảnh (Grid) trưng bày những khoảnh khắc đẹp nhất.', icon: <PhotoLibraryIcon />, isList: true, titleKey: 'galleryTitle' },
    VIDEO: { key: 'videoUrl', label: 'Video sự kiện', description: 'Nhúng video trực tiếp từ YouTube để khách mời cùng xem.', icon: <ImageIcon />, titleKey: 'videoTitle' },
    CONTACT_INFO: { key: 'contactInfo', label: 'Thông tin liên hệ', description: 'Số điện thoại hỗ trợ của đại diện nhà trai và nhà gái.', icon: <PhoneIcon />, relatedFields: ['contactGroom', 'contactBride'], titleKey: 'contactTitle' },
    QR_CODES: { key: 'qrCodes', label: 'Mã QR mừng cưới', description: 'Mã QR tài khoản ngân hàng để khách mời tiện gửi quà mừng.', icon: <DataObjectIcon />, isList: true, titleKey: 'qrCodeTitle' },
    RSVP: { key: 'rsvp', label: 'Xác Nhận Tham Dự (RSVP)', description: 'Biểu mẫu giúp khách mời phản hồi khả năng tham dự.', icon: <CheckBoxIcon />, titleKey: 'rsvpTitle', subtitleKey: 'rsvpSubtitle' },
    CUSTOM_HTML: { key: 'customHtmlContent', label: 'Khối tuỳ chỉnh', description: 'Tự do sáng tạo nội dung với trình soạn thảo văn bản đa dạng.', icon: <Brush />, titleKey: 'customHtmlTitle' },
};
const SortableBlockWrapper = ({ id, blockType, children, onSelectBlock, onRemoveBlock, isSelected }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
    const isBanner = blockType === 'BANNER_CAROUSEL';
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        border: `2px dashed ${isSelected ? '#3B82F6' : 'transparent'}`,
        backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
        borderRadius: isBanner ? '0px' : '12px',
        position: 'relative',
        padding: isBanner ? '0' : '16px',
        marginBottom: '16px',
    };
    const blockConfig = AVAILABLE_BLOCKS[blockType] || {};
    const isRemovable = !blockConfig.required;
    const isListBlock = blockConfig.isList;
    return (
        <Box ref={setNodeRef} style={style}>
            <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 10, display: 'flex', gap: 0.5, alignItems: 'center', backgroundColor: 'white', borderRadius: '20px', padding: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                {isRemovable && (
                    <Tooltip title="Xóa khối này">
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); onRemoveBlock(id); }}>
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                )}
                <Tooltip title={isListBlock ? "Chỉnh sửa danh sách" : "Chọn để chỉnh sửa"}>
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); onSelectBlock(blockType); }}>
                        <EditIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Kéo để di chuyển">
                    <Box {...attributes} {...listeners} sx={{ cursor: 'grab', display: 'flex', alignItems: 'center' }}>
                        <DragIndicatorIcon fontSize="small" />
                    </Box>
                </Tooltip>
            </Box>
            {children}
        </Box>
    );
};
const EditableWrapper = ({ fieldKey, onSelectField, selectedFieldKey, children, sx = {}, itemData, onDeleteItem }) => {
    const isSelected = selectedFieldKey === fieldKey;
    const wrapperSx = {
        border: `2px dashed ${isSelected ? '#3B82F6' : 'transparent'}`,
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        position: 'relative',
        p: 1,
        ...sx,
        '&:hover': {
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59, 130, 246, 0.05)',
        },
        '& .delete-button': {
            opacity: 0,
        },
        '&:hover .delete-button': {
            opacity: 1,
        },
    };

    return (
        <Box
            onClick={(e) => { e.stopPropagation(); onSelectField(fieldKey); }}
            sx={wrapperSx}
        >
            {children}
            {isSelected && !onDeleteItem && <EditIcon sx={{ position: 'absolute', top: 8, right: 8, color: 'primary.main', fontSize: 16, background: 'white', borderRadius: '50%', p: 0.5, zIndex: 10 }} />}
            {onDeleteItem && (
                 <Tooltip title="Xóa mục này">
                    <IconButton
                        className="delete-button"
                        size="small"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDeleteItem(itemData);
                        }}
                        sx={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            zIndex: 11,
                            bgcolor: 'white',
                            transition: 'opacity 0.2s',
                            '&:hover': { bgcolor: 'error.light', color: 'white' }
                        }}
                    >
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            )}
        </Box>
    );
};
const SectionHeader = ({ title, subtitle, onSelectField, selectedFieldKey, titleKey, subtitleKey, titleStyle, subtitleStyle }) => (
    <Box className="modern-section-header" sx={{ mb: 4 }}>
        <EditableWrapper fieldKey={titleKey} onSelectField={onSelectField} selectedFieldKey={selectedFieldKey}>
            <Typography variant="h2" className="section-title" sx={titleStyle}>{title}</Typography>
        </EditableWrapper>
        {subtitle && (
            <EditableWrapper fieldKey={subtitleKey} onSelectField={onSelectField} selectedFieldKey={selectedFieldKey}>
                <Typography variant="body1" className="section-subtitle" sx={subtitleStyle}>{subtitle}</Typography>
            </EditableWrapper>
        )}
    </Box>
);
const BannerCarouselPreview = ({ settings, onSelectField, selectedFieldKey }) => {
    const images = settings.bannerImages || [];

    // Hàm an toàn để lấy URL, tránh lỗi
    const getImageUrl = (image) => {
        if (!image) return '';
        // 1. Ảnh đã có URL từ server
        if (typeof image.url === 'string' && image.url) return image.url;
        // 2. Ảnh mới tải lên đã có URL xem trước (preview)
        if (typeof image.preview === 'string' && image.preview) return image.preview;
        // 3. Ảnh mới tải lên là một đối tượng File
        if (image.file instanceof File) return URL.createObjectURL(image.file);
        // 4. Trường hợp dữ liệu chỉ là một chuỗi URL
        if (typeof image === 'string') return image;
        // Nếu không có nguồn hợp lệ, trả về chuỗi rỗng
        return '';
    };

    const firstImage = images.length > 0 ? images[0] : null;
    const finalImageUrl = getImageUrl(firstImage);

    return (
        <EditableWrapper fieldKey="bannerImages" onSelectField={onSelectField} selectedFieldKey={selectedFieldKey} sx={{ p: 0, border: 'none' }}>
            <Box className="modern-banner" sx={{ height: '300px', position: 'relative' }}>
                {finalImageUrl ? (
                    <Box
                        sx={{
                            width: '100%',
                            height: '100%',
                            backgroundImage: `url(${finalImageUrl})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        }}
                    >
                        <Box className="modern-slide-overlay" />
                    </Box>
                ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', bgcolor: 'grey.200' }}>
                        <Typography color="text.secondary">Chưa có ảnh banner. Nhấp để thêm.</Typography>
                    </Box>
                )}
            </Box>
        </EditableWrapper>
    );
};

const EventDescriptionPreview = ({ settings, onSelectField, selectedFieldKey }) => (
    <Box className="section-container event-description">
        <EditableWrapper fieldKey="eventDescription" onSelectField={onSelectField} selectedFieldKey={selectedFieldKey}>
            <Box className="content-wrapper-narrow">
                <Typography className="event-description-text" sx={{ ...settings.eventDescriptionStyle, minHeight: '50px' }}>
                    {settings.eventDescription || "Nhấp để thêm câu chuyện của bạn..."}
                </Typography>
            </Box>
        </EditableWrapper>
    </Box>
);
const CoupleInfoPreview = ({ settings, onSelectField, selectedFieldKey, onUpdateSetting }) => {
    // Helper để update position vào settings
    // Lưu ý: Bạn cần đảm bảo hàm cha truyền prop `setEventSettings` hoặc tạo hàm update ở đây
    // Ở đoạn code gốc DesignContent, component cha quản lý state settings.
    // Chúng ta cần inject khả năng update settings con vào đây.
    
    // Giả sử DesignContent truyền prop updateSetting hoặc chúng ta dùng cơ chế onSelectField để trigger update
    // Tuy nhiên, cách tốt nhất là DesignContent nên truyền hàm setSettings xuống.
    // Ở đây tôi sẽ giả định props được truyền xuống bao gồm setSettings (xem Bước 3).
    
    const handleUpdatePos = (type, newPos) => {
         // type: 'groom' | 'bride'
         const key = `${type}ImagePosition`;
         // Gọi hàm update settings từ cha (chúng ta sẽ sửa cha sau)
         onUpdateSetting(key, newPos);
    };

    const [editingTarget, setEditingTarget] = useState(null); // 'groom' | 'bride' | null

    return (
        <Box className="section-container">
            <SectionHeader
                title={settings.coupleTitle || 'Cô Dâu & Chú Rể'}
                subtitle={settings.coupleSubtitle || '... và hai trái tim cùng chung một nhịp đập ...'}
                onSelectField={onSelectField}
                selectedFieldKey={selectedFieldKey}
                titleKey="coupleTitle"
                subtitleKey="coupleSubtitle"
                titleStyle={settings.coupleTitleStyle}
                subtitleStyle={settings.coupleSubtitleStyle}
            />
            <Box className="modern-couple-container">
                {/* --- CHÚ RỂ --- */}
                <Box className="modern-couple-card">
                    <EditableWrapper fieldKey="groomImageUrl" onSelectField={onSelectField} selectedFieldKey={selectedFieldKey}>
                        <ImageCropper 
                            imageSrc={settings.groomImageUrl instanceof File ? URL.createObjectURL(settings.groomImageUrl) : (settings.groomImageUrl || 'https://placehold.co/180x180/EBF1FB/B0C7EE?text=Ảnh+CR')}
                            position={settings.groomImagePosition}
                            isEditing={editingTarget === 'groom'}
                            onToggleEdit={() => setEditingTarget(editingTarget === 'groom' ? null : 'groom')}
                            onUpdate={(newPos) => handleUpdatePos('groom', newPos)}
                        />
                    </EditableWrapper>
                    <EditableWrapper fieldKey="groomName" onSelectField={onSelectField} selectedFieldKey={selectedFieldKey}>
                        <Typography className="couple-name" sx={{ ...settings.groomNameStyle, minHeight: '30px' }}>{settings.groomName || 'Tên chú rể'}</Typography>
                    </EditableWrapper>
                    <EditableWrapper fieldKey="groomInfo" onSelectField={onSelectField} selectedFieldKey={selectedFieldKey}>
                        <Typography className="couple-info" sx={{ ...settings.groomInfoStyle, minHeight: '40px' }}>{settings.groomInfo || 'Thông tin chú rể'}</Typography>
                    </EditableWrapper>
                </Box>

                <Box className="modern-separator"><Box className="heart-wrapper"><HeartIcon sx={{ color: 'var(--color-primary)' }} /></Box></Box>

                {/* --- CÔ DÂU --- */}
                <Box className="modern-couple-card">
                    <EditableWrapper fieldKey="brideImageUrl" onSelectField={onSelectField} selectedFieldKey={selectedFieldKey}>
                         <ImageCropper 
                            imageSrc={settings.brideImageUrl instanceof File ? URL.createObjectURL(settings.brideImageUrl) : (settings.brideImageUrl || 'https://placehold.co/180x180/EBF1FB/B0C7EE?text=Ảnh+CD')}
                            position={settings.brideImagePosition}
                            isEditing={editingTarget === 'bride'}
                            onToggleEdit={() => setEditingTarget(editingTarget === 'bride' ? null : 'bride')}
                            onUpdate={(newPos) => handleUpdatePos('bride', newPos)}
                        />
                    </EditableWrapper>
                    <EditableWrapper fieldKey="brideName" onSelectField={onSelectField} selectedFieldKey={selectedFieldKey}>
                        <Typography className="couple-name" sx={{ ...settings.brideNameStyle, minHeight: '30px' }}>{settings.brideName || 'Tên cô dâu'}</Typography>
                    </EditableWrapper>
                    <EditableWrapper fieldKey="brideInfo" onSelectField={onSelectField} selectedFieldKey={selectedFieldKey}>
                        <Typography className="couple-info" sx={{ ...settings.brideInfoStyle, minHeight: '40px' }}>{settings.brideInfo || 'Thông tin cô dâu'}</Typography>
                    </EditableWrapper>
                </Box>
            </Box>
        </Box>
    );
};
const ParticipantsPreview = ({ settings, onEditItem, onSelectField, selectedFieldKey }) => (
    <Box className="section-container">
        <SectionHeader
            title={settings.participantsTitle || "Thành Viên Tham Gia"}
            onSelectField={onSelectField}
            selectedFieldKey={selectedFieldKey}
            titleKey="participantsTitle"
            titleStyle={settings.participantsTitleStyle}
        />
        <Box className="participants-grid">
            {(settings.participants && settings.participants.length > 0) && settings.participants.map((p) => (
                <Box key={p.id} className="participant-card clickable-card" onClick={() => onEditItem({ type: 'participants', data: p })}>
                    <img src={p.imageUrl instanceof File ? URL.createObjectURL(p.imageUrl) : (p.imageUrl || 'https://placehold.co/100x100/EEE/31343C?text=Ảnh')} alt={p.title} className="participant-image" />
                    <Box className="participant-info">
                        <Typography variant="h3" className="participant-title">{p.title}</Typography>
                        <Typography className="participant-content">{p.content}</Typography>
                    </Box>
                </Box>
            ))}
            <Box className="add-new-card" onClick={() => onEditItem({ type: 'participants', data: { id: uuidv4(), title: '', content: '', imageUrl: null }, isNew: true })}>
                <AddCircleOutlineIcon />
                <Typography>Thêm thành viên</Typography>
            </Box>
        </Box>
    </Box>
);
const EventSchedulePreview = ({ settings, onEditItem, onSelectField, selectedFieldKey }) => (
    <Box className="section-container">
        <SectionHeader
            title={settings.eventsTitle || "Sự Kiện Cưới"}
            onSelectField={onSelectField}
            selectedFieldKey={selectedFieldKey}
            titleKey="eventsTitle"
            titleStyle={settings.eventsTitleStyle}
        />
        <Box className="event-schedule-grid">
            {(settings.events && settings.events.length > 0) && settings.events.map((event) => (
                <Box key={event.id} className="event-card clickable-card" onClick={() => onEditItem({ type: 'events', data: event })}>
                    <Box className="event-card-image-wrapper">
                        <img src={event.imageUrl instanceof File ? URL.createObjectURL(event.imageUrl) : (event.imageUrl || 'https://placehold.co/400x200/EEE/31343C?text=Event')} alt={event.title} />
                    </Box>
                    <Box className="event-card-content">
                        <Typography variant="h3" className="event-card-title">{event.title}</Typography>
                        <Typography>{event.time} | {event.date}</Typography>
                        <Typography>{event.address}</Typography>
                    </Box>
                </Box>
            ))}
            <Box className="add-new-card" onClick={() => onEditItem({ type: 'events', data: { id: uuidv4(), title: '', date: new Date().toISOString().split('T')[0], time: '12:00', address: '', mapUrl: '', imageUrl: '', dressCode: [] }, isNew: true })}>
                <AddCircleOutlineIcon />
                <Typography>Thêm sự kiện</Typography>
            </Box>
        </Box>
    </Box>
);
const PannableImageFrame = ({ item, onUpdateItem, onSelectItem }) => {
  // 1. Refs & State
  const frameRef = useRef(null);
  const imageRef = useRef(null);
  const [position, setPosition] = useState(item.imagePosition || { x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const pointerIdRef = useRef(null);
  const dragStartRef = useRef({ startX: 0, startY: 0, startPosX: 0, startPosY: 0 });

  const isEditing = item.isEditing && !item.locked;
  
  // 2. Effects
  
  /**
   * Đồng bộ state 'position' nội bộ nếu 'item.imagePosition' thay đổi từ bên ngoài.
   */
  useEffect(() => {
    if (!isDraggingRef.current) {
      setPosition(item.imagePosition || { x: 0, y: 0 });
    }
  }, [item.imagePosition]);

  // 4. Logic tính toán (Clamping) - Đã bọc trong useCallback
  /**
   * Hàm tính toán giới hạn kéo (clamp)
   */
  const clampPosition = useCallback((newX, newY) => {
    if (!frameRef.current || !imageRef.current || !imageRef.current.naturalWidth) {
      return { x: newX, y: newY };
    }

    const frameW = frameRef.current.clientWidth;
    const frameH = frameRef.current.clientHeight;
    const naturalW = imageRef.current.naturalWidth;
    const naturalH = imageRef.current.naturalHeight;
    const frameRatio = frameW / frameH;
    const naturalRatio = naturalW / naturalH;

    let coveredImgWidth, coveredImgHeight;
    
    if (naturalRatio > frameRatio) {
      coveredImgHeight = frameH;
      coveredImgWidth = frameH * naturalRatio;
    } else {
      coveredImgWidth = frameW;
      coveredImgHeight = frameW / naturalRatio;
    }

    const scaledImgW = coveredImgWidth * EDIT_SCALE;
    const scaledImgH = coveredImgHeight * EDIT_SCALE;

    const maxOffsetX = Math.max(0, (scaledImgW - frameW) / 2);
    const maxOffsetY = Math.max(0, (scaledImgH - frameH) / 2);

    const clampedX = Math.max(-maxOffsetX, Math.min(maxOffsetX, newX));
    const clampedY = Math.max(-maxOffsetY, Math.min(maxOffsetY, newY));

    return { x: clampedX, y: clampedY };
  }, []); // Refs là stable, không cần đưa vào dependency array

  // 3. Event Handlers (ĐÃ SỬA LỖI)

  // --- HÀM POINTER MOVE (Đã di chuyển ra ngoài và bọc bằng useCallback) ---
  const handlePointerMove = useCallback((e) => {
    if (!isDraggingRef.current || e.pointerId !== pointerIdRef.current) return;

    const dx = e.clientX - dragStartRef.current.startX;
    const dy = e.clientY - dragStartRef.current.startY;
    const newX = dragStartRef.current.startPosX + dx;
    const newY = dragStartRef.current.startPosY + dy;

    const clampedPos = clampPosition(newX, newY);
    setPosition(clampedPos);
  }, [clampPosition]); // Phụ thuộc vào clampPosition

  // --- HÀM POINTER UP (Đã di chuyển ra ngoài và bọc bằng useCallback) ---
  const handlePointerUp = useCallback((e) => {
    if (!isDraggingRef.current || (e.pointerId !== pointerIdRef.current && e.type !== 'pointercancel')) return;

    isDraggingRef.current = false;
    
    try {
      // Thêm kiểm tra 'e.target' và 'releasePointerCapture'
      if (e.target && typeof e.target.releasePointerCapture === 'function') {
        e.target.releasePointerCapture(pointerIdRef.current);
      }
    } catch (err) {
      // Bỏ qua lỗi (ví dụ: capture đã bị mất)
    }
    
    pointerIdRef.current = null;
    
    // Gỡ bỏ listener khỏi window
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
    window.removeEventListener('pointercancel', handlePointerUp);
  }, [handlePointerMove]); // Phụ thuộc vào handlePointerMove

  // --- UseEffect ĐÃ SỬA LẠI (Chỉ dùng để cleanup khi unmount) ---
  useEffect(() => {
    // Effect này chỉ dùng để dọn dẹp listener nếu component bị unmount
    // TRONG KHI đang kéo (isDraggingRef.current === true).
    return () => {
      if (isDraggingRef.current) {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
        window.removeEventListener('pointercancel', handlePointerUp);
      }
    };
  }, [handlePointerMove, handlePointerUp]); // Phụ thuộc vào các hàm callback đã định nghĩa ở trên

  /**
   * Xử lý double-click: Bật/Tắt Edit Mode
   */
  const handleDoubleClick = (e) => {
    e.stopPropagation();
    if (item.locked) return;

    const newIsEditing = !item.isEditing;

    if (newIsEditing) {
      onUpdateItem(item.id, { isEditing: true }, false);
    } else {
      onUpdateItem(item.id, { imagePosition: position, isEditing: false }, true);
    }
  };

  /**
   * Xử lý Pointer Down: Bắt đầu hành động kéo (pan) ảnh
   */
  const handlePointerDown = (e) => {
    if (!isEditing) return;
    
    e.preventDefault();
    e.stopPropagation(); 

    isDraggingRef.current = true;
    pointerIdRef.current = e.pointerId;
    e.target.setPointerCapture(e.pointerId);

    dragStartRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startPosX: position.x,
        startPosY: position.y,
    };

    // Gắn listener vào window (Giờ đã hợp lệ vì các hàm đã ở trong scope)
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
  };

  // 5. Render Logic (Giữ nguyên)
  const scale = isEditing ? EDIT_SCALE : 1;
  const displayPosition = isEditing ? position : (item.imagePosition || { x: 0, y: 0 });

  const frameStyles = {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    borderRadius: item.shape === 'circle' ? '50%' : '0',
    position: 'relative',
    cursor: item.locked ? 'not-allowed' : (isEditing ? 'grab' : 'inherit'),
    '&:active': {
      cursor: item.locked ? 'not-allowed' : (isEditing ? 'grabbing' : 'inherit'),
    }
  };

  const imageStyles = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    userSelect: 'none',
    pointerEvents: isEditing ? 'auto' : 'none', 
    touchAction: 'none',
    transform: `scale(${scale}) translate3d(${displayPosition.x}px, ${displayPosition.y}px, 0)`,
    transformOrigin: 'center center',
    transition: isDraggingRef.current ? 'none' : 'transform 0.3s ease',
    filter: `brightness(${item.brightness ?? 1}) contrast(${item.contrast ?? 1}) grayscale(${item.grayscale ?? 0})`,
  };

  return (
    <Tooltip 
      title={item.locked ? "Bị khóa" : (isEditing ? "Kéo để điều chỉnh. Double-click để hoàn tất." : "Double-click để chỉnh sửa vị trí ảnh.")} 
      arrow 
      placement="top"
    >
      <Box
        ref={frameRef}
        sx={frameStyles}
        onDoubleClick={handleDoubleClick}
        onClick={(e) => {
          if (!isEditing) {
            e.stopPropagation();
            onSelectItem(item.id);
          }
        }}
        onMouseDown={(e) => { if (isEditing) e.stopPropagation(); }}
      >
        {isEditing && (
          <Box sx={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 10,
            boxShadow: 'inset 0 0 0 3px rgba(59, 130, 246, 0.7)', 
            background: 'rgba(59, 130, 246, 0.1)', 
            pointerEvents: 'none',
            borderRadius: item.shape === 'circle' ? '50%' : '0',
          }} />
        )}

        {item.locked && (
            <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 20, color: 'white', background: 'rgba(0,0,0,0.5)', borderRadius: '50%', p: 0.5, pointerEvents: 'none' }}>
                <LockIcon fontSize="small" />
            </Box>
        )}

        <img
          ref={imageRef}
          src={item.url}
          alt="Đối tượng hình ảnh có thể kéo"
          style={imageStyles}
          onPointerDown={handlePointerDown}
          onDragStart={(e) => e.preventDefault()}
        />
      </Box>
    </Tooltip>
  );
};

const LoveStoryPreview = ({ settings, onEditItem, onSelectField, selectedFieldKey }) => (
    <Box className="section-container">
        <SectionHeader
            title={settings.loveStoryTitle || "Chuyện Tình Yêu"}
            onSelectField={onSelectField}
            selectedFieldKey={selectedFieldKey}
            titleKey="loveStoryTitle"
            titleStyle={settings.loveStoryTitleStyle}
        />
        <Box className="love-story-timeline">
            {(settings.loveStory && settings.loveStory.length > 0) ? settings.loveStory.map((story, index) => (
                <Box key={story.id} className={`story-item ${index % 2 === 0 ? 'left' : 'right'}`} onClick={() => onEditItem({ type: 'loveStory', data: story })}>
                    <Box className="story-content clickable-card">

                        {/* === BẮT ĐẦU PHẦN THÊM MỚI === */}
                        {/* Logic này kiểm tra và hiển thị ảnh, 
                            dùng URL.createObjectURL nếu là file đang được chỉnh sửa, 
                            hoặc dùng url string nếu đã được lưu. */}
                        {story.imageUrl && (
                            <img 
                                src={story.imageUrl instanceof File ? URL.createObjectURL(story.imageUrl) : story.imageUrl} 
                                alt={story.title || "Cột mốc"} 
                                className="story-image" 
                                // Ngăn sự kiện click vào ảnh kích hoạt onEditItem
                                onClick={(e) => e.stopPropagation()} 
                            />
                        )}
                        {/* === KẾT THÚC PHẦN THÊM MỚI === */}

                        <Typography variant="h3" className="story-title">{story.title}</Typography>
                        <Typography className="story-date">{story.date}</Typography>
                        <Typography className="story-description">{story.description}</Typography>
                    </Box>
                </Box>
            )) : <Typography sx={{ textAlign: 'center', color: 'text.secondary' }}>Chưa có câu chuyện nào. Nhấp vào nút bên dưới để thêm.</Typography>}
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Button
                variant="outlined"
                startIcon={<AddCircleOutlineIcon />}
                onClick={() => onEditItem({ type: 'loveStory', data: { id: uuidv4(), title: '', date: '', description: '', imageUrl: null }, isNew: true })}
            >
                Thêm cột mốc
            </Button>
        </Box>
    </Box>
);

const ImageCropper = ({ 
    imageSrc, 
    position, 
    onUpdatePosition, 
    onImageChange, // Hàm callback để thay ảnh
    isEditing, 
    onToggleEdit 
}) => {
    const imgRef = useRef(null);
    const fileInputRef = useRef(null);
    const isDragging = useRef(false);
    const startPos = useRef({ x: 0, y: 0 });

    // Lấy giá trị hiện tại hoặc mặc định
    const x = position?.x || 0;
    const y = position?.y || 0;
    const scale = position?.scale || 1;

    // --- XỬ LÝ KÉO THẢ (PAN) ---
    const handleMouseDown = (e) => {
        if (!isEditing) return;
        e.preventDefault();
        e.stopPropagation(); // Ngăn chặn nổi bọt sự kiện
        isDragging.current = true;
        startPos.current = { x: e.clientX - x, y: e.clientY - y };
        
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = (e) => {
        if (!isDragging.current) return;
        e.preventDefault();
        const newX = e.clientX - startPos.current.x;
        const newY = e.clientY - startPos.current.y;
        
        // Cập nhật vị trí realtime
        onUpdatePosition({ x: newX, y: newY, scale });
    };

    const handleMouseUp = () => {
        isDragging.current = false;
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };

    // --- XỬ LÝ ZOOM (SCALE) ---
    const handleZoomChange = (e, newValue) => {
        // Giữ nguyên vị trí x, y, chỉ thay đổi scale
        onUpdatePosition({ x, y, scale: newValue });
    };

    // --- XỬ LÝ ĐỔI ẢNH ---
    const handleTriggerUpload = (e) => {
        e.stopPropagation();
        fileInputRef.current?.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && onImageChange) {
            onImageChange(file);
        }
        // Reset input để chọn lại cùng file nếu muốn
        e.target.value = null; 
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, width: '100%' }}>
            {/* Input file ẩn */}
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                style={{ display: 'none' }} 
            />

            <Box 
                className="modern-couple-image" 
                sx={{ 
                    position: 'relative', 
                    overflow: 'hidden', 
                    cursor: isEditing ? 'grab' : 'pointer',
                    border: isEditing ? '2px dashed #3B82F6' : 'none',
                    touchAction: 'none',
                    // Đảm bảo khung hình tròn hoặc vuông theo style cũ
                    borderRadius: '50%', // Hoặc bỏ dòng này nếu style class modern-couple-image đã có
                    width: '180px', // Kích thước cố định hoặc theo container
                    height: '180px',
                    '&:active': {
                        cursor: isEditing ? 'grabbing' : 'pointer'
                    }
                }}
                onMouseDown={handleMouseDown}
                // Khi click vào ảnh lúc KHÔNG edit -> Bật chế độ edit hoặc trigger logic khác
                onClick={(e) => {
                    if (!isEditing) {
                        // Nếu bạn muốn click vào là Edit luôn thì bỏ comment dòng dưới
                        // onToggleEdit(); 
                    }
                }}
            >
                {/* ẢNH CHÍNH */}
                <img
                    ref={imgRef}
                    src={imageSrc}
                    alt="Croppable"
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        // Logic transform
                        transform: `scale(${scale}) translate(${x / scale}px, ${y / scale}px)`,
                        transformOrigin: 'center center',
                        pointerEvents: 'none',
                        userSelect: 'none',
                        transition: isDragging.current ? 'none' : 'transform 0.1s linear' // Mượt mà hơn
                    }}
                />
                
                {/* OVERLAY KHI KHÔNG EDIT (Hiển thị nút thao tác) */}
                {!isEditing && (
                    <Box sx={{
                        position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.4)', 
                        opacity: 0, transition: 'opacity 0.2s', display: 'flex', 
                        flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center', gap: 1,
                        '&:hover': { opacity: 1 }
                    }}>
                        <Button 
                            variant="contained" 
                            size="small" 
                            onClick={handleTriggerUpload}
                            sx={{ fontSize: '10px', minWidth: '80px', py: 0.5, bgcolor: 'white', color: 'black', '&:hover': { bgcolor: '#f5f5f5' } }}
                        >
                            Đổi ảnh
                        </Button>
                        <Button 
                            variant="contained" 
                            size="small" 
                            onClick={(e) => { e.stopPropagation(); onToggleEdit(); }}
                            sx={{ fontSize: '10px', minWidth: '80px', py: 0.5 }}
                        >
                            Căn chỉnh
                        </Button>
                    </Box>
                )}
            </Box>

            {/* THANH CÔNG CỤ EDIT (Chỉ hiện khi đang Edit) */}
            {isEditing && (
                <Paper elevation={3} sx={{ 
                    p: 1, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1.5, 
                    zIndex: 10,
                    borderRadius: 2,
                    mt: -1 // Đẩy lên gần ảnh hơn chút
                }} onClick={(e) => e.stopPropagation()}>
                    
                    <Tooltip title="Thu nhỏ">
                        <ZoomOutIcon fontSize="small" color="action" />
                    </Tooltip>
                    
                    {/* SLIDER SCALE: Đã chỉnh step nhỏ để mượt */}
                    <Slider 
                        size="small"
                        min={1} 
                        max={3} 
                        step={0.02} // <--- QUAN TRỌNG: Step nhỏ giúp scale mượt
                        value={scale} 
                        onChange={handleZoomChange}
                        sx={{ width: 100 }}
                    />
                    
                    <Tooltip title="Phóng to">
                        <ZoomInIcon fontSize="small" color="action" />
                    </Tooltip>

                    <Divider orientation="vertical" flexItem />

                    <Button 
                        size="small" 
                        variant="contained" 
                        onClick={(e) => { e.stopPropagation(); onToggleEdit(); }}
                        sx={{ minWidth: 'auto', px: 2 }}
                    >
                        Xong
                    </Button>
                </Paper>
            )}
        </Box>
    );
};

const ContactInfoPreview = ({ settings, onSelectField, selectedFieldKey }) => (
    <Box className="section-container">
        <SectionHeader
            title={settings.contactTitle || "Thông Tin Liên Hệ"}
            onSelectField={onSelectField}
            selectedFieldKey={selectedFieldKey}
            titleKey="contactTitle"
            titleStyle={settings.contactTitleStyle}
        />
        <Box className="modern-contact-section">
            <EditableWrapper fieldKey="contactGroom" onSelectField={onSelectField} selectedFieldKey={selectedFieldKey} sx={{ p: 0 }}>
                <Box className="modern-contact-card">
                    <Box className="contact-icon"><PhoneIcon /></Box>
                    <Box className="contact-info">
                        <Typography component="h4" sx={settings.contactCardHeaderStyle}>Nhà trai</Typography>
                        <Typography component="span" sx={settings.contactCardNameStyle}>{settings.groomName || 'Chú rể'}</Typography>
                        <p style={settings.contactGroomStyle}>{settings.contactGroom || 'SĐT Chú rể'}</p>
                    </Box>
                </Box>
            </EditableWrapper>
            <EditableWrapper fieldKey="contactBride" onSelectField={onSelectField} selectedFieldKey={selectedFieldKey} sx={{ p: 0 }}>
                <Box className="modern-contact-card">
                    <Box className="contact-icon"><PhoneIcon /></Box>
                    <Box className="contact-info">
                        <Typography component="h4" sx={settings.contactCardHeaderStyle}>Nhà gái</Typography>
                        <Typography component="span" sx={settings.contactCardNameStyle}>{settings.brideName || 'Cô dâu'}</Typography>
                        <p style={settings.contactBrideStyle}>{settings.contactBride || 'SĐT Cô dâu'}</p>
                    </Box>
                </Box>
            </EditableWrapper>
        </Box>
    </Box>
);
const GalleryPreview = ({ settings, onSelectField, selectedFieldKey }) => (
    <EditableWrapper fieldKey="galleryImages" onSelectField={onSelectField} selectedFieldKey={selectedFieldKey} sx={{ p: 0, border: 'none', '&:hover': { backgroundColor: 'transparent' } }}>
        <Box className="section-container">
            <SectionHeader
                title={settings.galleryTitle || "Bộ Sưu Tập Ảnh"}
                onSelectField={onSelectField}
                selectedFieldKey={selectedFieldKey}
                titleKey="galleryTitle"
            />
            <Box className="modern-gallery" sx={{ columnCount: settings.galleryImages && settings.galleryImages.length > 0 ? 4 : 0  + "!important" }}>
                {(settings.galleryImages && settings.galleryImages.length > 0) ? settings.galleryImages.map((img, index) => (
                    <img key={index} src={img instanceof File ? URL.createObjectURL(img) : img} alt={`Gallery ${index}`} />
                )) : <Typography sx={{ textAlign: 'center !important', color: 'text.secondary' }}>Chưa có ảnh nào. Nhấp vào biểu tượng bút chì ở trên để thêm.</Typography>}
            </Box>
        </Box>
    </EditableWrapper>
);
const VideoPreview = ({ settings, onSelectField, selectedFieldKey }) => (
    <EditableWrapper fieldKey="videoUrl" onSelectField={onSelectField} selectedFieldKey={selectedFieldKey} sx={{ p: 0, border: 'none', '&:hover': { backgroundColor: 'transparent' } }}>
        <Box className="section-container">
            <SectionHeader
                title={settings.videoTitle || "Video Sự Kiện"}
                onSelectField={onSelectField}
                selectedFieldKey={selectedFieldKey}
                titleKey="videoTitle"
                titleStyle={settings.videoTitleStyle}
            />
            <Box className="video-wrapper">
                {settings.videoUrl ? <Typography>Đã có video.</Typography> : <Typography sx={{ textAlign: 'center', color: 'text.secondary' }}>Chưa có video. Nhấp vào biểu tượng bút chì để thêm.</Typography>}
            </Box>
        </Box>
    </EditableWrapper>
);
const QrCodesPreview = ({ settings, onSelectField, selectedFieldKey }) => (
    <EditableWrapper fieldKey="qrCodes" onSelectField={onSelectField} selectedFieldKey={selectedFieldKey} sx={{ p: 0, border: 'none', '&:hover': { backgroundColor: 'transparent' } }}>
        <Box className="section-container">
            <SectionHeader
                title={settings.qrCodeTitle || "Mã QR Mừng Cưới"}
                onSelectField={onSelectField}
                selectedFieldKey={selectedFieldKey}
                titleKey="qrCodeTitle"
            />
            <Box className="modern-qr-container">
                {(settings.qrCodes && settings.qrCodes.length > 0) ? settings.qrCodes.map((qr, index) => (
                    <img key={index} src={qr.url instanceof File ? URL.createObjectURL(qr.url) : qr.url} alt={qr.title} />
                )) : <Typography sx={{ textAlign: 'center', color: 'text.secondary' }}>Chưa có mã QR nào. Nhấp vào biểu tượng bút chì ở trên để thêm.</Typography>}
            </Box>
        </Box>
    </EditableWrapper>
);
const CountdownPreview = ({ settings, onSelectField, selectedFieldKey }) => {
    const calculateTimeLeft = useCallback(() => {
        const targetDate = settings.eventDate;
        if (!targetDate) return null;
        const difference = +new Date(targetDate) - +new Date();
        if (difference <= 0) return null;
        return {
            Ngày: Math.floor(difference / (1000 * 60 * 60 * 24)),
            Giờ: Math.floor((difference / (1000 * 60 * 60)) % 24),
            Phút: Math.floor((difference / 1000 / 60) % 60),
            Giây: Math.floor((difference / 1000) % 60),
        };
    }, [settings.eventDate]);
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
    useEffect(() => {
        setTimeLeft(calculateTimeLeft());
    }, [settings.eventDate, calculateTimeLeft]);
    useEffect(() => {
        if (!timeLeft) return;
        const timerId = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
        return () => clearInterval(timerId);
    }, [timeLeft, calculateTimeLeft]);
    return (
        <EditableWrapper fieldKey="eventDate" onSelectField={onSelectField} selectedFieldKey={selectedFieldKey} sx={{ p: 0, border: 'none', '&:hover': { backgroundColor: 'transparent' } }}>
            <Box className="section-container">
                <SectionHeader
                    title={settings.countdownTitle || "Sự kiện trọng đại sẽ diễn ra trong"}
                    onSelectField={onSelectField}
                    selectedFieldKey={selectedFieldKey}
                    titleKey="countdownTitle"
                    titleStyle={settings.countdownTitleStyle}
                />
                {!settings.eventDate ? (
                    <Typography sx={{ textAlign: 'center', color: 'text.secondary' }}>Chưa đặt ngày sự kiện. Nhấp vào để đặt ngày.</Typography>
                ) : !timeLeft ? (
                    <Box className="countdown-ended" sx={{ textAlign: 'center' }}>
                        <Typography component="span" sx={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-primary)' }}>Sự kiện đã diễn ra!</Typography>
                    </Box>
                ) : (
                    <Box className="modern-countdown">
                        {Object.entries(timeLeft).map(([interval, value]) => (
                            <Box key={interval} className="modern-countdown-item">
                                <Box className="countdown-card">
                                    <Typography component="span" className="countdown-value" sx={settings.countdownValueStyle}>{String(value).padStart(2, '0')}</Typography>
                                    <Typography component="span" className="countdown-label" sx={settings.countdownLabelStyle}>{interval}</Typography>
                                </Box>
                            </Box>
                        ))}
                    </Box>
                )}
            </Box>
        </EditableWrapper>
    );
};
const blockComponentMap = {
    BANNER_CAROUSEL: BannerCarouselPreview,
    EVENT_DESCRIPTION: EventDescriptionPreview,
    COUPLE_INFO: CoupleInfoPreview,
    PARTICIPANTS: ParticipantsPreview,
    EVENT_SCHEDULE: EventSchedulePreview,
    LOVE_STORY: LoveStoryPreview,
    GALLERY: GalleryPreview,
    VIDEO: VideoPreview,
    CONTACT_INFO: ContactInfoPreview,
    QR_CODES: QrCodesPreview,
    COUNTDOWN: CountdownPreview,
    RSVP: RsvpPreview,
    CUSTOM_HTML: CustomHtmlPreview,
};
const EventSettingsPreview = ({ settings, onSelectField, selectedFieldKey, eventBlocks, onSelectBlock, onRemoveBlock, onReorderBlocks, onEditItem, onUpdateSetting }) => {
    const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            onReorderBlocks(active.id, over.id);
        }
    };
    return (
        <Box className="event-settings-preview-container">
            <Box className="modern-content">
                <Box className="modern-container">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={eventBlocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                            {eventBlocks.map(block => {
                                const Component = blockComponentMap[block.type];
                                if (!Component) return null;
                                const isSelected = Object.values(AVAILABLE_BLOCKS).find(b => b.key === selectedFieldKey || b.relatedFields?.includes(selectedFieldKey) || b.titleKey === selectedFieldKey || b.subtitleKey === selectedFieldKey)?.key === AVAILABLE_BLOCKS[block.type].key;
                                return (
                                    <SortableBlockWrapper
                                        key={block.id}
                                        id={block.id}
                                        blockType={block.type}
                                        onSelectBlock={onSelectBlock}
                                        onRemoveBlock={onRemoveBlock}
                                        isSelected={isSelected}
                                    >
                                        <Component
                                            settings={settings}
                                            onSelectField={onSelectField}
                                            selectedFieldKey={selectedFieldKey}
                                            onEditItem={onEditItem}
                                            onUpdateSetting={onUpdateSetting}
                                        />
                                    </SortableBlockWrapper>
                                );
                            })}
                        </SortableContext>
                    </DndContext>
                </Box>
            </Box>
        </Box>
    );
};
const VisualSettingsEditor = ({ settings, onSelectField, selectedFieldKey, eventBlocks, onSelectBlock, onRemoveBlock, onReorderBlocks, onEditItem, onUpdateSetting }) => {
    return (
        <Box sx={{
            p: { xs: 1, md: 2 },
            bgcolor: 'background.paper',
            mt: 4,
            borderRadius: 2
        }}>
            <EventSettingsPreview
                settings={settings}
                onSelectField={onSelectField}
                selectedFieldKey={selectedFieldKey}
                eventBlocks={eventBlocks}
                onSelectBlock={onSelectBlock}
                onRemoveBlock={onRemoveBlock}
                onReorderBlocks={onReorderBlocks}
                onEditItem={onEditItem}
                onUpdateSetting={onUpdateSetting}
            />
        </Box>
    );
};
const ParticipantForm = ({ itemData, setItemData, onSave, onCancel, onRemove }) => {
    const fileInputRef = useRef(null);
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setItemData(prev => ({ ...prev, imageUrl: file }));
        }
    };
    const previewUrl = itemData.imageUrl instanceof File
        ? URL.createObjectURL(itemData.imageUrl)
        : itemData.imageUrl;
    return (
        <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, mt: 1 }}>
            <Grid container spacing={2} sx={{ alignItems: 'center' }}>
                <Grid item xs={12} sm={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <img
                        src={previewUrl || 'https://placehold.co/120x120/EEE/31343C?text=Ảnh'}
                        alt="Avatar"
                        style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
                    <Button size="small" onClick={() => fileInputRef.current.click()}>Đổi ảnh</Button>
                </Grid>
                <Grid item xs={12} sm={8} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                        label="Tên thành viên"
                        value={itemData.title || ''}
                        onChange={(e) => setItemData(prev => ({ ...prev, title: e.target.value }))}
                        fullWidth
                    />
                    <TextField
                        label="Mô tả"
                        value={itemData.content || ''}
                        onChange={(e) => setItemData(prev => ({ ...prev, content: e.target.value }))}
                        fullWidth multiline rows={3}
                    />
                </Grid>
            </Grid>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
                {onRemove && <Button onClick={onRemove} color="error" sx={{ mr: 'auto' }}>Xóa</Button>}
                <Button onClick={onCancel}>Hủy</Button>
                <Button onClick={onSave} variant="contained">Lưu</Button>
            </Box>
        </Box>
    );
};
const SidebarListEditor = ({ items, onUpdate, FormComponent, defaultNewItem, renderListItem, initialItemToEdit, onCloseEditor }) => {
    const [editingItem, setEditingItem] = useState(null);
    useEffect(() => {
        if (initialItemToEdit) {
            setEditingItem({ ...initialItemToEdit.data, isNew: initialItemToEdit.isNew });
        } else {
            setEditingItem(null);
        }
    }, [initialItemToEdit]);
    const handleEdit = (item) => {
        setEditingItem({ ...item });
    };
    const handleAddNew = () => {
        setEditingItem({ ...defaultNewItem, id: uuidv4(), isNew: true });
    };
    const handleCancel = () => {
        setEditingItem(null);
        if (onCloseEditor) onCloseEditor();
    };
    const handleSave = () => {
        if (!editingItem) return;
        const { isNew, ...dataToSave } = editingItem;
        let newItems;
        if (isNew) {
            newItems = [...(items || []), dataToSave];
        } else {
            newItems = (items || []).map(item => item.id === dataToSave.id ? dataToSave : item);
        }
        onUpdate(newItems);
        setEditingItem(null);
        if (onCloseEditor) onCloseEditor();
    };
    const handleRemove = () => {
        if (window.confirm('Bạn có chắc chắn muốn xóa mục này không?')) {
            const newItems = items.filter(item => item.id !== editingItem.id);
            onUpdate(newItems);
            setEditingItem(null);
            if (onCloseEditor) onCloseEditor();
        }
    };
    return (
        <Box>
            {!editingItem ? (
                <>
                    <List>
                        {(items || []).map(item => (
                            <ListItemButton key={item.id} onClick={() => handleEdit(item)}>
                                {renderListItem(item)}
                            </ListItemButton>
                        ))}
                    </List>
                    <Button onClick={handleAddNew} startIcon={<AddIcon />} variant="outlined" fullWidth>
                        Thêm mới
                    </Button>
                </>
            ) : (
                <FormComponent
                    itemData={editingItem}
                    setItemData={setEditingItem}
                    onSave={handleSave}
                    onCancel={handleCancel}
                    onRemove={editingItem.isNew ? null : handleRemove}
                />
            )}
        </Box>
    );
};
const LoveStoryForm = ({ itemData, setItemData, onSave, onCancel, onRemove }) => {
    return (
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
                label="Tiêu đề cột mốc"
                value={itemData.title || ''}
                onChange={(e) => setItemData(prev => ({ ...prev, title: e.target.value }))}
                fullWidth
            />
            <TextField
                label="Thời gian (ví dụ: Ngày 12 tháng 12, 2022)"
                value={itemData.date || ''}
                onChange={(e) => setItemData(prev => ({ ...prev, date: e.target.value }))}
                fullWidth
            />
            <TextField
                label="Mô tả câu chuyện"
                value={itemData.description || ''}
                onChange={(e) => setItemData(prev => ({ ...prev, description: e.target.value }))}
                fullWidth multiline rows={4}
            />


            <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: '500', mb: -1, mt: 1 }}>
                Ảnh minh họa (Tùy chọn)
            </Typography>
            {/* Sử dụng component ImageUploadField đã có sẵn trong file này */}
            <ImageUploadField
                value={itemData.imageUrl}
                // Khi chọn file, setItemData với file object
                onFileSelect={(file) => setItemData(prev => ({ ...prev, imageUrl: file }))}
                // Khi xóa ảnh, set imageUrl về null
                onFileClear={() => setItemData(prev => ({...prev, imageUrl: null}))}
            />
            
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
                {onRemove && <Button onClick={onRemove} color="error" sx={{ mr: 'auto' }}>Xóa</Button>}
                <Button onClick={onCancel}>Hủy</Button>
                <Button onClick={onSave} variant="contained">Lưu</Button>
            </Box>
        </Box>
    );
};
const EventForm = ({ itemData, setItemData, onSave, onCancel, onRemove }) => {
    const theme = useTheme();
    const handleDressCodeAdd = () => {
        const newDressCode = [...(itemData.dressCode || []), { color: '#FFFFFF' }];
        setItemData(prev => ({ ...prev, dressCode: newDressCode }));
    };
    const handleDressCodeChange = (index, color) => {
        const newDressCode = itemData.dressCode.map((item, i) => (i === index ? { color } : item));
        setItemData(prev => ({ ...prev, dressCode: newDressCode }));
    };
    const handleDressCodeRemove = (index) => {
        const newDressCode = itemData.dressCode.filter((_, i) => i !== index);
        setItemData(prev => ({ ...prev, dressCode: newDressCode }));
    };
    return (
        <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, mt: 1 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField label="Tiêu đề sự kiện" value={itemData.title || ''} onChange={(e) => setItemData(prev => ({ ...prev, title: e.target.value }))} fullWidth />
                <ImageUploadField value={itemData.imageUrl} onFileSelect={(file) => setItemData(prev => ({ ...prev, imageUrl: file }))} />
                <Grid container spacing={2}>
                    <Grid item xs={6}>
                        <TextField label="Ngày" type="date" value={itemData.date ? itemData.date.split('T')[0] : ''} onChange={(e) => setItemData(prev => ({ ...prev, date: e.target.value }))} fullWidth InputLabelProps={{ shrink: true }} />
                    </Grid>
                    <Grid item xs={6}>
                        <TextField label="Giờ" type="time" value={itemData.time || ''} onChange={(e) => setItemData(prev => ({ ...prev, time: e.target.value }))} fullWidth InputLabelProps={{ shrink: true }} />
                    </Grid>
                </Grid>
                <TextField label="Địa chỉ" value={itemData.address || ''} onChange={(e) => setItemData(prev => ({ ...prev, address: e.target.value }))} fullWidth multiline rows={2} />
                <TextField label="Link Google Maps" value={itemData.mapUrl || ''} onChange={(e) => setItemData(prev => ({ ...prev, mapUrl: e.target.value }))} fullWidth placeholder="Dán link Google Maps vào đây" />
                <Box>
                    <Typography variant="subtitle2" gutterBottom>Dress Code</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                        {(itemData.dressCode || []).map((item, index) => (
                            <Box key={index} sx={{ position: 'relative', '&:hover .remove-btn': { opacity: 1 } }}>
                                <input type="color" value={item.color} onChange={(e) => handleDressCodeChange(index, e.target.value)} style={{ width: 32, height: 32, border: `1px solid ${theme.palette.divider}`, borderRadius: '50%', cursor: 'pointer' }} />
                                <IconButton size="small" className="remove-btn" onClick={() => handleDressCodeRemove(index)} sx={{ position: 'absolute', top: -10, right: -10, bgcolor: 'background.paper', opacity: 0, transition: 'opacity 0.2s', '&:hover': { bgcolor: 'error.light' } }}>
                                    <DeleteIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                            </Box>
                        ))}
                        <Tooltip title="Thêm màu">
                            <IconButton onClick={handleDressCodeAdd} size="small"><AddCircleOutlineIcon /></IconButton>
                        </Tooltip>
                    </Box>
                </Box>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
                {onRemove && <Button onClick={onRemove} color="error" sx={{ mr: 'auto' }}>Xóa</Button>}
                <Button onClick={onCancel}>Hủy</Button>
                <Button onClick={onSave} variant="contained">Lưu</Button>
            </Box>
        </Box>
    );
};
const SimplifiedStoryEditor = ({ fieldKey, settings, onUpdate, customFonts }) => {
    const theme = useTheme();
    // Thêm state filter
    const [fontFilter, setFontFilter] = useState('All');

    const item = {
        id: fieldKey,
        content: _.get(settings, fieldKey, ''),
        ..._.get(settings, `${fieldKey}Style`, {})
    };
    const handleUpdate = (updates) => {
        onUpdate(fieldKey, updates);
    };
    const toggleStyle = (property, value, defaultValue) => {
        handleUpdate({ [property]: item[property] === value ? defaultValue : value });
    };
    
    // Logic filter tương tự
    const filteredCustomFonts = customFonts.filter(f => {
        if (fontFilter === 'All') return true;
        if (fontFilter === 'General') return !f.category || f.category === 'General';
        return f.category === fontFilter;
    });

    const showSystemFonts = fontFilter === 'All' || fontFilter === 'General';
    let availableFonts = [
        ...(showSystemFonts ? FONT_FAMILIES : []),
        ...filteredCustomFonts.map(f => f.name)
    ];

    if (item.fontFamily && !availableFonts.includes(item.fontFamily)) {
        availableFonts = [item.fontFamily, ...availableFonts];
    }
    availableFonts = [...new Set(availableFonts)];

    const selectedButtonStyle = {
        bgcolor: alpha(theme.palette.primary.main, 0.1),
        color: 'primary.main',
    };
    const previewStyle = {
        fontFamily: item.fontFamily || 'Arial',
        fontSize: `${item.fontSize || 16}px`,
        fontWeight: item.fontWeight || 'normal',
        fontStyle: item.fontStyle || 'normal',
        textDecoration: item.textDecoration || 'none',
        color: item.color || '#333',
        textAlign: 'left',
        lineHeight: 1.6,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 1,
        padding: '16px',
        minHeight: '100px',
        marginTop: '16px',
        backgroundColor: theme.palette.background.default
    };
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
                label="Nội dung"
                value={item.content}
                onChange={(e) => handleUpdate({ content: e.target.value })}
                fullWidth
                multiline
                rows={4}
            />

            <ButtonGroup size="small" variant="outlined" aria-label="text formatting">
                <Tooltip title="In Đậm"><IconButton onClick={() => toggleStyle('fontWeight', 'bold', 'normal')} sx={item.fontWeight === 'bold' ? selectedButtonStyle : {}}><FormatBoldIcon /></IconButton></Tooltip>
                <Tooltip title="In Nghiêng"><IconButton onClick={() => toggleStyle('fontStyle', 'italic', 'normal')} sx={item.fontStyle === 'italic' ? selectedButtonStyle : {}}><FormatItalicIcon /></IconButton></Tooltip>
                <Tooltip title="Gạch Chân"><IconButton onClick={() => toggleStyle('textDecoration', 'underline', 'none')} sx={item.textDecoration === 'underline' ? selectedButtonStyle : {}}><FormatUnderlinedIcon /></IconButton></Tooltip>
            </ButtonGroup>

            {/* Thêm UI Filter */}
            <Box>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Lọc Font chữ:</Typography>
                <ToggleButtonGroup
                    value={fontFilter}
                    exclusive
                    onChange={(e, newVal) => { if(newVal) setFontFilter(newVal); }}
                    size="small"
                    sx={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: 0.5,
                        '& .MuiToggleButtonGroup-grouped': {
                            border: `1px solid ${theme.palette.divider} !important`,
                            borderRadius: '16px !important',
                            textTransform: 'none',
                            px: 1,
                            py: 0.25,
                            '&.Mui-selected': {
                                bgcolor: 'primary.main',
                                color: 'white',
                                '&:hover': { bgcolor: 'primary.dark' }
                            }
                        }
                    }}
                >
                    <ToggleButton value="All">Tất cả</ToggleButton>
                    <ToggleButton value="Wedding">Cưới</ToggleButton>
                    <ToggleButton value="Vietnamese">Tiếng Việt</ToggleButton>
                    <ToggleButton value="Uppercase">Viết hoa</ToggleButton>
                    <ToggleButton value="General">Chung</ToggleButton>
                </ToggleButtonGroup>
            </Box>

            <Grid container spacing={2}>
                <Grid item xs={8}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Font</InputLabel>
                        <Select
                            value={item.fontFamily || 'Arial'}
                            label="Font"
                            onChange={(e) => handleUpdate({ fontFamily: e.target.value })}
                            MenuProps={{ PaperProps: { style: { maxHeight: 300 } } }}
                        >
                            {availableFonts.length > 0 ? availableFonts.map(font => (
                                <MenuItem key={font} value={font} style={{ fontFamily: font }}>{font}</MenuItem>
                            )) : (
                                <MenuItem disabled>Không có font</MenuItem>
                            )}
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={4}>
                    <TextField
                        label="Cỡ chữ"
                        type="number"
                        size="small"
                        value={item.fontSize || 16}
                        onChange={(e) => handleUpdate({ fontSize: Math.max(8, parseInt(e.target.value, 10) || 16) })}
                        fullWidth
                    />
                </Grid>
            </Grid>
            <Divider sx={{ my: 1 }} />
            <Typography variant="overline" color="text.secondary">Xem trước</Typography>
            <Box sx={previewStyle}>
                {item.content || "Nội dung xem trước sẽ hiển thị ở đây."}
            </Box>
        </Box>
    );
};
const SETTINGS_META = {
    invitationType: { label: 'Loại thiệp mời', type: 'select', required: true, options: ['Thiệp cưới', 'Thiệp sự kiện chung', 'Thiệp cảm ơn', 'Thiệp chúc mừng'], description: 'Chọn loại thiệp phù hợp với sự kiện của bạn.' },
    eventDate: { label: 'Ngày giờ diễn ra sự kiện', type: 'datetime', required: false, description: 'Thời gian chính thức bắt đầu sự kiện.' },
    eventDescription: { label: 'Câu chuyện', type: 'story-text', required: true, description: 'Chia sẻ một vài dòng về câu chuyện hoặc sự kiện của bạn.' },
    groomName: { label: 'Tên chú rể', type: 'story-text' },
    groomInfo: { label: 'Thông tin chú rể', type: 'story-text' },
    contactGroom: { label: 'Liên hệ chú rể', type: 'story-text' },
    groomImageUrl: { label: 'Ảnh chú rể', type: 'image' },
    brideName: { label: 'Tên cô dâu', type: 'story-text' },
    brideInfo: { label: 'Thông tin cô dâu', type: 'story-text' },
    contactBride: { label: 'Liên hệ cô dâu', type: 'story-text' },
    brideImageUrl: { label: 'Ảnh cô dâu', type: 'image' },
    bannerImages: { label: 'Ảnh Banner Carousel', type: 'image-dnd-list', description: 'Tải lên, sắp xếp và xóa ảnh cho carousel banner.' },
    galleryImages: { label: 'Bộ sưu tập ảnh', type: 'image-grid', description: 'Những khoảnh khắc đẹp nhất để chia sẻ với khách mời.' },
    qrCodes: { label: 'Mã QR Chuyển Khoản', type: 'qr-code-editor', description: 'Tải lên các mã QR để khách mời gửi quà mừng.' },
    musicUrl: { label: 'Âm thanh sự kiện', type: 'text', description: 'Dán URL nhạc nền (Youtube, Zing MP3...).' },
    videoUrl: { label: 'Video Sự kiện', type: 'text', description: 'Dán URL video Youtube để hiển thị trên trang.' },
    events: { label: 'Danh sách Sự kiện cưới', type: 'event-list', description: 'Thêm các sự kiện như lễ ăn hỏi, lễ cưới, tiệc đãi khách...' },
    participants: { label: 'Thành viên tham gia', type: 'participants-editor', description: 'Giới thiệu các thành viên quan trọng trong sự kiện của bạn.' },
    loveStory: { label: 'Câu chuyện tình yêu', type: 'love-story-editor', description: 'Kể lại những cột mốc đáng nhớ trong hành trình của bạn.' },
    countdownTitle: { label: 'Tiêu đề Đếm ngược', type: 'story-text' },
    coupleTitle: { label: 'Tiêu đề Cô dâu & Chú rể', type: 'story-text' },
    coupleSubtitle: { label: 'Tiêu đề phụ Cô dâu & Chú rể', type: 'story-text' },
    participantsTitle: { label: 'Tiêu đề Thành viên tham gia', type: 'story-text' },
    eventsTitle: { label: 'Tiêu đề Lịch trình', type: 'story-text' },
    loveStoryTitle: { label: 'Tiêu đề Chuyện tình yêu', type: 'story-text' },
    galleryTitle: { label: 'Tiêu đề Bộ sưu tập ảnh', type: 'story-text' },
    videoTitle: { label: 'Tiêu đề Video', type: 'story-text' },
    contactTitle: { label: 'Tiêu đề Liên hệ', type: 'story-text' },
    qrCodeTitle: { label: 'Tiêu đề Mã QR', type: 'story-text' },
    rsvpTitle: { label: 'Tiêu đề RSVP', type: 'story-text' },
    rsvpSubtitle: { label: 'Tiêu đề phụ RSVP', type: 'story-text' },
    customHtmlContent: { label: 'Nội dung HTML tùy chỉnh', type: 'custom-html', description: 'Sử dụng trình soạn thảo bên dưới để tạo nội dung độc đáo cho riêng bạn.' },
    customHtmlTitle: { label: 'Tiêu đề khối tùy chỉnh', type: 'story-text' },
};
const StyledTextPropertyEditor = ({ fieldKey, settings, onUpdate, customFonts }) => {
    const item = {
        id: fieldKey,
        content: _.get(settings, fieldKey, ''),
        ..._.get(settings, `${fieldKey}Style`, {})
    };
    const handleItemUpdate = (id, updates) => {
        onUpdate(id, updates);
    };
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextToolbar item={item} onUpdate={handleItemUpdate} />
            <TextPropertyEditor item={item} onUpdate={handleItemUpdate} customFonts={customFonts} />
        </Box>
    );
};
const ImageUploadField = ({ value, onFileSelect }) => {
    const fileInputRef = useRef(null);
    const [preview, setPreview] = useState(value);
    useEffect(() => {
        if (value instanceof File) {
            const objectUrl = URL.createObjectURL(value);
            setPreview(objectUrl);
            return () => URL.revokeObjectURL(objectUrl);
        } else {
            setPreview(value);
        }
    }, [value]);
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            onFileSelect(file);
        }
    };
    return (
        <Box>
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 1.5,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                bgcolor: 'background.default',
            }}>
                <Box
                    sx={{
                        width: 80,
                        height: 80,
                        borderRadius: 1.5,
                        overflow: 'hidden',
                        border: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'background.paper',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    {preview ? (
                        <img src={preview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <ImageIcon sx={{ color: 'text.secondary' }} />
                    )}
                </Box>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
                <Button variant="outlined" onClick={() => fileInputRef.current.click()}>
                    Chọn ảnh
                </Button>
            </Box>
        </Box>
    );
};
const QrCodeEditor = ({ value = [], onUpdate }) => {
    const fileInputRef = useRef(null);
    const handleFilesChange = (event) => {
        const files = Array.from(event.target.files);
        if (files.length > 0) {
            const newQRs = files.map(file => ({
                id: `new-${uuidv4()}`,
                title: file.name.split('.').slice(0, -1).join('.'),
                url: file
            }));
            onUpdate([...value, ...newQRs]);
        }
        if (event.currentTarget) {
            event.currentTarget.value = null;
        }
    };
    const handleRemoveImage = (indexToRemove) => {
        onUpdate(value.filter((_, index) => index !== indexToRemove));
    };
    const handleTitleChange = (index, newTitle) => {
        const updatedQRs = value.map((item, i) => i === index ? { ...item, title: newTitle } : item);
        onUpdate(updatedQRs);
    };
    return (
        <Box>
            <Grid container spacing={1.5} sx={{ mb: 2 }}>
                {value.map((qr, index) => {
                    const key = qr.id || `qr-${index}`;
                    const previewUrl = qr.url instanceof File ? URL.createObjectURL(qr.url) : qr.url;
                    return (
                        <Grid item key={key} xs={6}>
                            <Box sx={{ position: 'relative', aspectRatio: '1', borderRadius: 1.5, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                                <img src={previewUrl} alt={`Preview ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                <IconButton size="small" onClick={() => handleRemoveImage(index)} sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: 'error.main', color: 'white' } }}>
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </Box>
                            <TextField
                                fullWidth
                                label="Tiêu đề QR"
                                variant="outlined"
                                size="small"
                                value={qr.title || ''}
                                onChange={(e) => handleTitleChange(index, e.target.value)}
                                sx={{ mt: 1 }}
                            />
                        </Grid>
                    );
                })}
            </Grid>
            <input type="file" multiple accept="image/*" ref={fileInputRef} onChange={handleFilesChange} style={{ display: 'none' }} />
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => fileInputRef.current.click()} fullWidth>
                Thêm mã QR
            </Button>
        </Box>
    );
};
const ImageGridEditor = ({ value = [], onUpdate }) => {
    const fileInputRef = useRef(null);
    const handleFilesChange = (event) => {
        const files = Array.from(event.target.files);
        if (files.length > 0) {
            onUpdate([...value, ...files]);
        }
    };
    const handleRemoveImage = (indexToRemove) => {
        onUpdate(value.filter((_, index) => index !== indexToRemove));
    };
    return (
        <Box>
            <Grid container spacing={1.5} sx={{ mb: 2 }}>
                {value.map((img, index) => {
                    const previewUrl = img instanceof File ? URL.createObjectURL(img) : img;
                    return (
                        <Grid item key={index} xs={6}>
                            <Box sx={{ position: 'relative', aspectRatio: '1', borderRadius: 1.5, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                                <img src={previewUrl} alt={`Preview ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <IconButton size="small" onClick={() => handleRemoveImage(index)} sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: 'error.main', color: 'white' } }}>
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        </Grid>
                    );
                })}
            </Grid>
            <input type="file" multiple accept="image/*" ref={fileInputRef} onChange={handleFilesChange} style={{ display: 'none' }} />
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => fileInputRef.current.click()} fullWidth>
                Thêm ảnh
            </Button>
        </Box>
    );
};
function SortableBannerItem({ id, image, index, removeBannerImage }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
    const style = { transform: CSS.Transform.toString(transform), transition };
    const imageUrl = typeof image === 'string' ? image : image.preview;
    return (
        <Box ref={setNodeRef} style={style} {...attributes} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'background.paper', '&:hover': { borderColor: 'grey.400' } }}>
            <Box {...listeners} sx={{ color: 'text.secondary', cursor: 'grab', '&:active': { cursor: 'grabbing' } }}><MenuIcon /></Box>
            <img src={imageUrl} alt={`Banner ${index + 1}`} style={{ width: 80, height: 48, objectFit: 'cover', borderRadius: 1 }} />
            <Typography variant="body2" sx={{ flexGrow: 1, color: 'text.secondary' }}>Ảnh banner {index + 1}</Typography>
            <IconButton size="small" onClick={() => removeBannerImage(id)}><DeleteIcon fontSize="small" /></IconButton>
        </Box>
    );
}
const BannerDndListEditor = ({ value = [], onUpdate }) => {
    const fileInputRef = useRef(null);
    const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
    const handleAddImages = (event) => {
        const files = Array.from(event.target.files);
        if (files.length === 0) return;
        const newFilesArray = files.map(file => ({ id: `new-${uuidv4()}`, file: file, preview: URL.createObjectURL(file) }));
        onUpdate([...value, ...newFilesArray]);
    };
    const handleRemoveImage = (idToRemove) => {
        const imageToRemove = value.find(img => img.id === idToRemove);
        if (imageToRemove && imageToRemove.preview) {
            URL.revokeObjectURL(imageToRemove.preview);
        }
        onUpdate(value.filter(img => img.id !== idToRemove));
    };
    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            const oldIndex = value.findIndex(img => img.id === active.id);
            const newIndex = value.findIndex(img => img.id === over.id);
            onUpdate(arrayMove(value, oldIndex, newIndex));
        }
    }
    return (
        <Box>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={value} strategy={verticalListSortingStrategy}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
                        {value.map((image, index) => (
                            <SortableBannerItem key={image.id} id={image.id} image={image.url || image} index={index} removeBannerImage={handleRemoveImage} />
                        ))}
                    </Box>
                </SortableContext>
            </DndContext>
            <input type="file" multiple accept="image/*" ref={fileInputRef} onChange={handleAddImages} style={{ display: 'none' }} />
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => fileInputRef.current.click()} fullWidth>Thêm ảnh Banner</Button>
        </Box>
    );
};
const SettingsPropertyEditor = ({ selectedKey, settings, setSettings, customFonts, itemToEdit, setItemToEdit }) => {
    if (!selectedKey) return null;
    const meta = SETTINGS_META[selectedKey];
    const value = _.get(settings, selectedKey, '');
    const handleUpdate = (fieldIdOrValue, updates) => {
        if (['image-grid', 'image-dnd-list', 'qr-code-editor', 'event-list', 'participants-editor', 'love-story-editor'].includes(meta.type)) {
            setSettings(prev => ({
                ...prev,
                [selectedKey]: fieldIdOrValue
            }));
            return;
        }
        setSettings(prev => {
            const newSettings = { ...prev };
            if (meta.type === 'text' || meta.type === 'datetime' || meta.type === 'select') {
                 _.set(newSettings, fieldIdOrValue, updates.content);
                 return newSettings;
            }
            const { content, ...styleUpdates } = updates;
            if (content !== undefined) {
                _.set(newSettings, fieldIdOrValue, content);
            }
            if (Object.keys(styleUpdates).length > 0) {
                const styleKey = `${fieldIdOrValue}Style`; 
                const currentStyles = _.get(prev, styleKey, {}); 
                const newStyles = { ...currentStyles, ...styleUpdates }; 
                _.set(newSettings, styleKey, newStyles); 
            }
            
            return newSettings;
        });
    };
    const renderEditor = () => {
        switch (meta.type) {
            case 'text':
            case 'textarea':
                return <TextField
                    fullWidth
                    label={meta.label}
                    multiline={meta.type === 'textarea'}
                    rows={meta.type === 'textarea' ? 4 : 1}
                    value={value}
                    onChange={(e) => handleUpdate(selectedKey, { content: e.target.value })}
                />;
            case 'select':
                return <FormControl fullWidth>
                    <Select
                        value={value}
                        onChange={(e) => handleUpdate(selectedKey, { content: e.target.value })}
                    >
                        {meta.options.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                    </Select>
                </FormControl>;
            case 'datetime':
                return <TextField
                    type="datetime-local"
                    value={value}
                    onChange={(e) => handleUpdate(selectedKey, { content: e.target.value })}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                />;
            case 'image':
                return <ImageUploadField
                    value={value}
                    onFileSelect={(file) => handleUpdate(selectedKey, { content: file })}
                />;

            case 'image-grid':
                return <ImageGridEditor
                    value={value || []}
                    onUpdate={handleUpdate}
                />;
            case 'image-dnd-list':
                return <BannerDndListEditor
                    value={value || []}
                    onUpdate={handleUpdate}
                />;
            case 'qr-code-editor':
                return <QrCodeEditor
                    value={value || []}
                    onUpdate={handleUpdate}
                />;
            case 'event-list':
                return <SidebarListEditor
                    title="Sự kiện"
                    items={value || []}
                    onUpdate={handleUpdate}
                    FormComponent={EventForm}
                    defaultNewItem={{ title: 'Sự kiện mới', date: new Date().toISOString().split('T')[0], time: '12:00', address: '', mapUrl: '', imageUrl: '', dressCode: [] }}
                    renderListItem={(item) => <ListItemText primary={item.title} secondary={`${item.date} - ${item.time}`} />}
                    initialItemToEdit={itemToEdit?.type === 'events' ? itemToEdit : null}
                    onCloseEditor={() => setItemToEdit(null)}
                />;
            case 'participants-editor':
                return <SidebarListEditor
                    title="Thành viên"
                    items={value || []}
                    onUpdate={handleUpdate}
                    FormComponent={ParticipantForm}
                    defaultNewItem={{ title: 'Tên thành viên', content: 'Mô tả ngắn...', imageUrl: null }}
                    renderListItem={(item) => <ListItemText primary={item.title} secondary={item.content} />}
                    initialItemToEdit={itemToEdit?.type === 'participants' ? itemToEdit : null}
                    onCloseEditor={() => setItemToEdit(null)}
                />;
            case 'love-story-editor':
                return <SidebarListEditor
                    title="Cột mốc"
                    items={value || []}
                    onUpdate={handleUpdate}
                    FormComponent={LoveStoryForm}
                    defaultNewItem={{ title: 'Cột mốc mới', date: '', description: 'Kể câu chuyện của bạn ở đây...', imageUrl: null }}
                    renderListItem={(item) => <ListItemText primary={item.title} secondary={item.date} />}
                    initialItemToEdit={itemToEdit?.type === 'loveStory' ? itemToEdit : null}
                    onCloseEditor={() => setItemToEdit(null)}
                />;
            case 'story-text':
                return <SimplifiedStoryEditor
                    fieldKey={selectedKey}
                    settings={settings}
                    onUpdate={handleUpdate}
                    customFonts={customFonts}
                />;
            case 'styled-text':
                return <StyledTextPropertyEditor
                    fieldKey={selectedKey}
                    settings={settings}
                    onUpdate={handleUpdate}
                    customFonts={customFonts}
                />;
            case 'custom-html':
                return (
                    <CustomEditor
                        data={value || ''}
                        onChange={(content) => handleUpdate(selectedKey, { content })}
                    />
                );
            default:
                return <Typography color="text.secondary">Không có trình chỉnh sửa cho loại này.</Typography>;
        }
    };
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {meta.description && <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{meta.description}</Typography>}
            {renderEditor()}
        </Box>
    );
};

const FONT_FAMILIES = ['Arial', 'Times New Roman', 'Verdana', 'Courier New', 'Garamond', 'Georgia', 'Helvetica', 'Tahoma'];
const BASE_Z_INDEX = 5;
const MAX_TEXT_LENGTH = 1000;
const defaultItemProps = {
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    brightness: 1,
    contrast: 1,
    grayscale: 0,
    fontWeight: 'normal',
    fontStyle: 'normal',
    textDecoration: 'none',
    textAlign: 'center',
    shape: 'square',
    isGuestName: false,
    imagePosition: { x: 0, y: 0 },
};
const MIN_ITEM_WIDTH = 20;
const MIN_ITEM_HEIGHT = 20;
const HANDLE_SIZE = 8;
const HANDLE_OFFSET = HANDLE_SIZE / 2;
const BORDER_COLOR = '#3B82F6';
const ZOOM_STEP = 0.1;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 3.0;
const LEFT_PRIMARY_SIDEBAR_WIDTH = 100;
const LEFT_SECONDARY_SIDEBAR_WIDTH = 340;
const DEFAULT_CANVAS_WIDTH = 800;
const DEFAULT_CANVAS_HEIGHT = 600;
const ROTATION_SNAP_ANGLE = 15;
const SNAP_THRESHOLD = 6;
const CM_TO_PX = 37.795;
const MAX_DIMENSION_PX = 800;
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
const CanvasWrapper = styled(Box)({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    boxSizing: 'border-box',
    overflow: 'auto',
    touchAction: 'none'
});
const CanvasContainer = styled(Box)(({ theme }) => ({
    position: 'relative',
    backgroundColor: '#ffffff',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    overflow: 'hidden',
    border: `1px solid ${theme.palette.divider}`
}));
const StyledCanvas = styled('canvas')({
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none'
});
const DraggableItem = styled(motion.div)({
    position: 'absolute',
    cursor: 'grab',
    '&:active': {
        cursor: 'grabbing'
    },
    boxSizing: 'border-box',
    transformStyle: 'preserve-3d',
    backfaceVisibility: 'hidden',
});
const MinimalHandleStyle = {
    position: 'absolute',
    width: `${HANDLE_SIZE}px`,
    height: `${HANDLE_SIZE}px`,
    borderRadius: '50%',
    backgroundColor: '#FFFFFF',
    border: `1.5px solid ${BORDER_COLOR}`,
    zIndex: 20000,
    boxSizing: 'border-box',
};
const RotateHandleStyle = {
    ...MinimalHandleStyle,
    cursor: 'alias',
    top: `-${HANDLE_OFFSET + 20}px`, 
    left: `calc(50% - ${HANDLE_OFFSET}px)`,
};
const RotateLine = styled('div')({
    position: 'absolute',
    width: '1.5px',
    height: '18px', 
    backgroundColor: BORDER_COLOR,
    left: 'calc(50% - 0.75px)',
    bottom: `calc(100% + ${HANDLE_OFFSET}px)`,
    zIndex: 19999,
});
const calculateSnapping = (draggedItem, allItems, zoomLevel) => {
    const otherItems = allItems.filter(it => it.id !== draggedItem.id && it.visible !== false);
    let finalX = draggedItem.x;
    let finalY = draggedItem.y;
    const guidesToShow = [];
    const draggedGeom = {
        left: draggedItem.x,
        center: draggedItem.x + draggedItem.width / 2,
        right: draggedItem.x + draggedItem.width,
        top: draggedItem.y,
        middle: draggedItem.y + draggedItem.height / 2,
        bottom: draggedItem.y + draggedItem.height,
    };
    let bestVSnap = { dist: Infinity, guide: 0, newPos: 0, item: null };
    let bestHSnap = { dist: Infinity, guide: 0, newPos: 0, item: null };
    for (const staticItem of otherItems) {
        const staticGeom = {
            left: staticItem.x,
            center: staticItem.x + staticItem.width / 2,
            right: staticItem.x + staticItem.width,
            top: staticItem.y,
            middle: staticItem.y + staticItem.height / 2,
            bottom: staticItem.y + staticItem.height,
        };
        const vPoints = ['left', 'center', 'right'];
        const hPoints = ['top', 'middle', 'bottom'];
        for (const dPoint of vPoints) {
            for (const sPoint of vPoints) { // Dòng 1744 (đã sửa) - Không còn lỗi
                const dist = Math.abs(draggedGeom[dPoint] - staticGeom[sPoint]);
                if (dist < bestVSnap.dist) {
                    bestVSnap = {
                        dist,
                        guide: staticGeom[sPoint],
                        newPos: staticGeom[sPoint] - (draggedGeom[dPoint] - draggedGeom.left),
                        item: staticItem
                    };
                }
            }
        }
        for (const dPoint of hPoints) {
            for (const sPoint of hPoints) { // Dòng 1758 (đã sửa) - Không còn lỗi
                const dist = Math.abs(draggedGeom[dPoint] - staticGeom[sPoint]);
                if (dist < bestHSnap.dist) {
                    bestHSnap = {
                        dist,
                        guide: staticGeom[sPoint],
                        newPos: staticGeom[sPoint] - (draggedGeom[dPoint] - draggedGeom.top),
                        item: staticItem
                    };
                }
            }
        }
    }
    if (bestVSnap.dist * zoomLevel < SNAP_THRESHOLD) {
        finalX = bestVSnap.newPos;
        const top = Math.min(draggedGeom.top, bestVSnap.item.y);
        const bottom = Math.max(draggedGeom.bottom, bestVSnap.item.y + bestVSnap.item.height);
        guidesToShow.push({
            type: 'v',
            x: bestVSnap.guide,
            y1: top,
            y2: bottom
        });
    }
    if (bestHSnap.dist * zoomLevel < SNAP_THRESHOLD) {
        finalY = bestHSnap.newPos;
        const left = Math.min(draggedGeom.left, bestHSnap.item.x);
        const right = Math.max(draggedGeom.right, bestHSnap.item.x + bestHSnap.item.width);
        guidesToShow.push({
            type: 'h',
            y: bestHSnap.guide,
            x1: left,
            x2: right
        });
    }
    return {
        snappedX: finalX,
        snappedY: finalY,
        guides: guidesToShow
    };
};
const GenericImagePicker = ({ images, onItemClick, title }) => (
    <Box>
        <Typography variant="h6" gutterBottom>{title}</Typography>
        <Box sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)', // <<< TẠO RA 3 CỘT BẰNG NHAU
            gap: 1.5,
            pt: 1,
            maxHeight: 'calc(100vh - 120px)',
            overflowY: 'auto'
        }}>
            {images.length === 0 ? (
                <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                </Grid>
            ) : (
                images.map(image => (
                    <DraggableSidebarItem data={{ id: image.id, url: image.url, type: 'image' }}>
                        <Card
                            onClick={() => onItemClick && onItemClick({ type: 'image', url: image.url })}
                            sx={{
                                cursor: 'pointer',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                '&:hover': { transform: 'scale(1.04)', boxShadow: 3 },
                                aspectRatio: '1 / 1',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <CardMedia component="img" image={image.url} alt={image.name}
                                sx={{ objectFit: 'contain', p: 1, maxHeight: '100%', maxWidth: '100%' }}
                                onError={(e) => {
                                    const target = e.target; target.onerror = null;
                                    target.src = `https://placehold.co/100x100/EBF1FB/B0C7EE?text=Lỗi`;
                                }} />
                        </Card>
                    </DraggableSidebarItem>
                ))
            )}
        </Box>
    </Box>
);
const UserImageManager = ({ userImages, onItemClick, onImageUploaded, isUploading, onDeleteImages }) => {
    const fileInputRef = useRef(null);
    const [selectedImages, setSelectedImages] = useState([]);

    const handleUploadButtonClick = () => fileInputRef.current?.click();

    const handleFileChange = (event) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            onImageUploaded(files);
        }
        event.currentTarget.value = null;
    };

    const toggleSelectImage = (e, id) => {
        e.stopPropagation(); // Ngăn sự kiện click lan ra ngoài (không tự động thêm ảnh vào canvas)
        setSelectedImages(prev => 
            prev.includes(id) ? prev.filter(imgId => imgId !== id) : [...prev, id]
        );
    };

    const handleDeleteSelected = () => {
        if (onDeleteImages) {
            onDeleteImages(selectedImages);
        }
        setSelectedImages([]); // Reset lại danh sách đã chọn
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom>Ảnh của bạn</Typography>
            
            {/* Hiển thị Nút Upload hoặc Nút Xoá tuỳ thuộc vào việc có ảnh nào được chọn hay không */}
            {selectedImages.length > 0 ? (
                <Box sx={{ display: 'flex', gap: 1, mb: 2.5 }}>
                    <Button
                        variant="outlined"
                        color="error"
                        onClick={handleDeleteSelected}
                        startIcon={<DeleteIcon />}
                        sx={{ flexGrow: 1 }}
                        size="small"
                    >
                        Xóa ({selectedImages.length})
                    </Button>
                    <Button
                        variant="text"
                        onClick={() => setSelectedImages([])}
                        size="small"
                    >
                        Hủy
                    </Button>
                </Box>
            ) : (
                <Button
                    variant="contained"
                    onClick={handleUploadButtonClick}
                    startIcon={isUploading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
                    sx={{ mb: 2.5, width: '100%' }}
                    size="large"
                    disabled={isUploading}
                >
                    {isUploading ? 'Đang tải lên...' : 'Tải ảnh lên'}
                </Button>
            )}

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                style={{ display: 'none' }}
                multiple
            />
            
            <Box sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 1.5,
                maxHeight: 'calc(100vh - 220px)',
                overflowY: 'auto',
                pb: 2
            }}>
                {userImages.length === 0 && !isUploading && (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 4, fontStyle: 'italic', width: '100%', gridColumn: 'span 3' }}>
                        Bạn chưa tải ảnh nào lên.
                    </Typography>
                )}
                {userImages.map((img) => {
                    const isSelected = selectedImages.includes(img.id);
                    return (
                        <DraggableSidebarItem key={img.id} data={{ id: img.id, url: img.url, type: 'image' }}>
                            <Card
                                onClick={() => onItemClick({ id: img.id, url: img.url, type: 'image' })}
                                sx={{
                                    cursor: 'pointer', 
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    '&:hover': { 
                                        transform: 'scale(1.04)', 
                                        boxShadow: 3,
                                        '& .checkbox-container': {
                                            opacity: 1,
                                            transform: 'translateY(0)' // Hiệu ứng trượt từ trên xuống khi hover
                                        }
                                    },
                                    aspectRatio: '1 / 1',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    position: 'relative',
                                    border: isSelected ? '2px solid #3B82F6' : '1px solid transparent',
                                    overflow: 'visible'
                                }}
                            >
                                {/* Nút Checkbox Góc Trên Bên Phải */}
                                <Box
                                    className="checkbox-container"
                                    onClick={(e) => toggleSelectImage(e, img.id)}
                                    sx={{
                                        position: 'absolute',
                                        top: 6,
                                        right: 6,
                                        opacity: isSelected ? 1 : 0, // Ẩn khi chưa chọn và không hover
                                        transform: isSelected ? 'translateY(0)' : 'translateY(-10px)',
                                        transition: 'all 0.2s ease-out',
                                        zIndex: 10,
                                    }}
                                >
                                    {isSelected ? (
                                        <CheckBoxIcon color="primary" sx={{ bgcolor: 'white', borderRadius: '4px' }} />
                                    ) : (
                                        <Box sx={{ width: 20, height: 20, border: '2px solid #999', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.8)' }} />
                                    )}
                                </Box>

                                <CardMedia component="img" image={img.url} alt={img.name}
                                    sx={{
                                        objectFit: 'contain', p: 1, maxHeight: '100%', maxWidth: '100%',
                                        pointerEvents: 'none' 
                                    }}
                                    onError={(e) => {
                                        const target = e.target; target.onerror = null;
                                        target.src = `https://placehold.co/120x120/EBF1FB/B0C7EE?text=Lỗi`;
                                    }} />
                            </Card>
                        </DraggableSidebarItem>
                    );
                })}
            </Box>
        </Box>
    );
};


const DraggableItemComponent = React.memo(({ item, onUpdateItem, isSelected, onSelectItem, zoomLevel, snapToGrid, gridSize, allItems, onSetSnapLines, snapToObject, children, canvasRef }) => {
    const itemRef = useRef(null);
    const isLocked = item.locked;
    const [isTransforming, setIsTransforming] = useState(false);
    const dragStartPos = useRef({ x: 0, y: 0 });

    const motionX = useMotionValue(item.x);
    const motionY = useMotionValue(item.y);
    // --- FIX: Sử dụng motion value cho rotation để xoay mượt hơn ---
    const motionRotate = useMotionValue(item.rotation || 0);

    // useEffect(() => {
    //     motionX.set(item.x);
    //     motionY.set(item.y);
    //     // --- FIX: Đồng bộ motionRotate với state của item khi có thay đổi từ bên ngoài ---
    //     motionRotate.set(item.rotation || 0);
    // }, [item.x, item.y, item.rotation, motionX, motionY, motionRotate]);

    const handleDragStart = (e, info) => {
        if (isLocked || isTransforming) return;
        dragStartPos.current = { x: item.x, y: item.y };
        onSelectItem(item.id);
    };

    const handleDrag = (e, info) => {
        if (isLocked || isTransforming) return;
        let newX = dragStartPos.current.x + info.offset.x / zoomLevel;
        let newY = dragStartPos.current.y + info.offset.y / zoomLevel;
        let guides = [];
        if (snapToObject) {
            const snapResult = calculateSnapping({ ...item, x: newX, y: newY }, allItems, zoomLevel);
            newX = snapResult.snappedX;
            newY = snapResult.snappedY;
            guides = snapResult.guides;
        }
        motionX.set(newX);
        motionY.set(newY);
        onSetSnapLines(guides);
    };

    const handleDragEnd = (e, info) => {
        if (isLocked || isTransforming) return;
        let finalX = dragStartPos.current.x + info.offset.x / zoomLevel;
        let finalY = dragStartPos.current.y + info.offset.y / zoomLevel;
        const snapResult = calculateSnapping({ ...item, x: finalX, y: finalY }, allItems, zoomLevel);
        if (snapResult.guides.length > 0 && snapToObject) {
            finalX = snapResult.snappedX;
            finalY = snapResult.snappedY;
        } else if (snapToGrid && gridSize > 0) {
            finalX = Math.round(finalX / gridSize) * gridSize;
            finalY = Math.round(finalY / gridSize) * gridSize;
        }
        onSetSnapLines([]);
        onUpdateItem(item.id, { x: finalX, y: finalY }, true);
    };

    const createResizeHandler = (handleName) => (e) => {
        e.stopPropagation();
        setIsTransforming(true);
        onSelectItem(item.id);
        const startItem = { ...item };
        const angleRad = (startItem.rotation || 0) * (Math.PI / 180);
        const cos = Math.cos(angleRad);
        const sin = Math.sin(angleRad);
        const aspectRatio = startItem.width / startItem.height;
        const startMouseX = e.clientX;
        const startMouseY = e.clientY;
        const handleMove = (moveEvent) => {
            const isProportional = moveEvent.shiftKey;
            const mouseDx = (moveEvent.clientX - startMouseX) / zoomLevel;
            const mouseDy = (moveEvent.clientY - startMouseY) / zoomLevel;
            const localDx = mouseDx * cos + mouseDy * sin;
            const localDy = -mouseDx * sin + mouseDy * cos;
            let dw = 0;
            let dh = 0;
            if (handleName.includes('right')) dw = localDx;
            if (handleName.includes('left')) dw = -localDx;
            if (handleName.includes('bottom')) dh = localDy;
            if (handleName.includes('top')) dh = -localDy;
            if (isProportional) {
                const isCorner = handleName.includes('-');
                if (isCorner) {
                    if (Math.abs(localDx) > Math.abs(localDy)) {
                        dh = dw / aspectRatio;
                    } else {
                        dw = dh * aspectRatio;
                    }
                } else {
                    if (handleName.includes('left') || handleName.includes('right')) {
                        dh = dw / aspectRatio;
                    } else {
                        dw = dh * aspectRatio;
                    }
                }
            }
            let newWidth = startItem.width + dw;
            let newHeight = startItem.height + dh;
            if (newWidth < MIN_ITEM_WIDTH) {
                newWidth = MIN_ITEM_WIDTH;
                if (isProportional) newHeight = newWidth / aspectRatio;
            }
            if (newHeight < MIN_ITEM_HEIGHT) {
                newHeight = MIN_ITEM_HEIGHT;
                if (isProportional) newWidth = newHeight * aspectRatio;
            }
            const finalDw = newWidth - startItem.width;
            const finalDh = newHeight - startItem.height;
            let deltaCenterX = finalDw / 2;
            let deltaCenterY = finalDh / 2;
            if (handleName.includes('left')) deltaCenterX = -finalDw / 2;
            if (handleName.includes('top')) deltaCenterY = -finalDh / 2;
            if (handleName === 'left' || handleName === 'right') deltaCenterY = 0;
            if (handleName === 'top' || handleName === 'bottom') deltaCenterX = 0;
            const rotatedShiftX = deltaCenterX * cos - deltaCenterY * sin;
            const rotatedShiftY = deltaCenterX * sin + deltaCenterY * cos;
            const startCenterX = startItem.x + startItem.width / 2;
            const startCenterY = startItem.y + startItem.height / 2;
            const newCenterX = startCenterX + rotatedShiftX;
            const newCenterY = startCenterY + rotatedShiftY;
            const newX = newCenterX - newWidth / 2;
            const newY = newCenterY - newHeight / 2;
            const newProps = {
                width: newWidth,
                height: newHeight,
                x: newX,
                y: newY,
            };
            onUpdateItem(item.id, newProps, false);
        };
        const handleEnd = () => {
            window.removeEventListener('pointermove', handleMove);
            window.removeEventListener('pointerup', handleEnd);
            onUpdateItem(item.id, {}, true);
            setTimeout(() => { setIsTransforming(false); }, 0);
        };
        window.addEventListener('pointermove', handleMove);
        window.addEventListener('pointerup', handleEnd);
    };

    const handleRotateStart = (e) => {
        e.stopPropagation();
        setIsTransforming(true);
        onSelectItem(item.id);
        if (!itemRef.current) return;

        // Lấy vị trí và kích thước của item
        const rect = itemRef.current.getBoundingClientRect();
        // Tính toán tâm của item
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Tính toán góc ban đầu của con trỏ so với tâm item
        const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
        
        // Lấy góc xoay ban đầu của item
        const initialRotation = motionRotate.get();

        const handleRotateMove = (moveEvent) => {
            // Vị trí hiện tại của con trỏ
            const currentX = moveEvent.clientX;
            const currentY = moveEvent.clientY;

            // Tính toán góc hiện tại của con trỏ so với tâm item
            const currentAngle = Math.atan2(currentY - centerY, currentX - centerX);
            
            // Tính sự thay đổi về góc (đổi từ radian sang độ)
            const angleDiff = (currentAngle - startAngle) * (180 / Math.PI);
            
            let newRotation = initialRotation + angleDiff;

            // Làm tròn góc nếu bật chế độ snap
            if (snapToGrid || snapToObject) {
                newRotation = Math.round(newRotation / ROTATION_SNAP_ANGLE) * ROTATION_SNAP_ANGLE;
            }
            
            motionRotate.set(newRotation);
        };

        const handleRotateEnd = () => {
            window.removeEventListener('pointermove', handleRotateMove);
            window.removeEventListener('pointerup', handleRotateEnd);
            onUpdateItem(item.id, { rotation: motionRotate.get() }, true);
            setTimeout(() => {
                setIsTransforming(false);
            }, 0);
        };

        window.addEventListener('pointermove', handleRotateMove);
        window.addEventListener('pointerup', handleRotateEnd);
    };


    return (
        <DraggableItem
            ref={itemRef}
            className="draggable-item-class"
            drag={!isLocked && !isTransforming && !item.isEditing}
            dragMomentum={false}
            onDragStart={handleDragStart}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            onPointerDown={(e) => {
                if (e.target === itemRef.current) {
                    onSelectItem(item.id);
                }
            }}
            style={{
                x: motionX,
                y: motionY,
                // --- FIX: Gán motionRotate vào thuộc tính rotate ---
                rotate: motionRotate,
                zIndex: isSelected ? item.zIndex + 1000 : item.zIndex,
                width: item.width,
                height: item.height,
                border: isSelected ? `1.5px solid ${BORDER_COLOR}` : `1.5px solid transparent`,
                transformOrigin: 'center center',
                opacity: item.opacity,
                cursor: isLocked ? 'not-allowed' : 'grab',
            }}
        >
            {children}
            {isSelected && !isLocked && (
                <>
                    <div style={{ ...MinimalHandleStyle, top: `-${HANDLE_OFFSET}px`, left: `-${HANDLE_OFFSET}px`, cursor: 'nwse-resize' }} onPointerDown={createResizeHandler('top-left')} />
                    <div style={{ ...MinimalHandleStyle, top: `-${HANDLE_OFFSET}px`, right: `-${HANDLE_OFFSET}px`, cursor: 'nesw-resize' }} onPointerDown={createResizeHandler('top-right')} />
                    <div style={{ ...MinimalHandleStyle, bottom: `-${HANDLE_OFFSET}px`, left: `-${HANDLE_OFFSET}px`, cursor: 'nesw-resize' }} onPointerDown={createResizeHandler('bottom-left')} />
                    <div style={{ ...MinimalHandleStyle, bottom: `-${HANDLE_OFFSET}px`, right: `-${HANDLE_OFFSET}px`, cursor: 'nwse-resize' }} onPointerDown={createResizeHandler('bottom-right')} />
                    <div style={{ ...MinimalHandleStyle, top: `calc(50% - ${HANDLE_OFFSET}px)`, left: `-${HANDLE_OFFSET}px`, cursor: 'ew-resize' }} onPointerDown={createResizeHandler('left')} />
                    <div style={{ ...MinimalHandleStyle, top: `calc(50% - ${HANDLE_OFFSET}px)`, right: `-${HANDLE_OFFSET}px`, cursor: 'ew-resize' }} onPointerDown={createResizeHandler('right')} />
                    <div style={{ ...MinimalHandleStyle, top: `-${HANDLE_OFFSET}px`, left: `calc(50% - ${HANDLE_OFFSET}px)`, cursor: 'ns-resize' }} onPointerDown={createResizeHandler('top')} />
                    <div style={{ ...MinimalHandleStyle, bottom: `-${HANDLE_OFFSET}px`, left: `calc(50% - ${HANDLE_OFFSET}px)`, cursor: 'ns-resize' }} onPointerDown={createResizeHandler('bottom')} />
                    <RotateLine />
                    <div style={RotateHandleStyle} onPointerDown={handleRotateStart} />
                </>
            )}
        </DraggableItem>
    );
});


const TextEditor = (props) => {
    const { item, onUpdateItem, onSelectItem } = props;
    const inputRef = useRef(null);
    const isLocked = item.locked;
    const textStyle = {
        fontSize: `${item.fontSize || 16}px`,
        fontFamily: item.fontFamily || 'Arial',
        color: item.color || '#000000',
        fontWeight: item.fontWeight || 'normal',
        fontStyle: item.fontStyle || 'normal',
        textDecoration: item.textDecoration || 'none',
        textAlign: item.textAlign || 'center',
        lineHeight: 1.4,
        padding: '5px',
        boxSizing: 'border-box',
        width: '100%',
        height: '100%',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        backgroundColor: 'transparent',
    };
    const handleBlur = () => onUpdateItem(item.id, { isEditing: false }, true);
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleBlur();
        }
    };
    useLayoutEffect(() => {
        if (!item.isEditing && inputRef.current) {
            const scrollHeight = inputRef.current.scrollHeight;
            if (Math.abs(scrollHeight - item.height) > 2) {
                onUpdateItem(item.id, { height: scrollHeight }, false);
            }
        }
    }, [item.content, item.fontSize, item.fontFamily, item.width, item.isEditing, item.fontWeight, item.fontStyle, item.textAlign, item.height, onUpdateItem, item.id]);
    return (
        <DraggableItemComponent {...props}>
            {item.isEditing && !isLocked ? (
                <textarea
                    ref={inputRef}
                    value={item.content}
                    onChange={(e) => onUpdateItem(item.id, { content: e.target.value.slice(0, MAX_TEXT_LENGTH) }, false)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        ...textStyle,
                        resize: 'none',
                        border: 'none',
                        outline: 'none',
                        overflow: 'hidden'
                    }}
                    autoFocus
                />
            ) : (
                <Box
                    sx={{
                        ...textStyle,
                        userSelect: 'none',
                        cursor: 'inherit',
                        display: 'flex', // Changed
                        alignItems: 'center', // Changed
                        justifyContent: 'center',
                        padding: '10px 5px',
                    }}
                    onDoubleClick={(e) => { if (!isLocked) { e.stopPropagation(); onUpdateItem(item.id, { isEditing: true }, true); } }}
                    onClick={(e) => { if (!item.isEditing) { e.stopPropagation(); onSelectItem(item.id); } }}
                >
                    {item.content || "Văn bản"}
                </Box>
            )}
        </DraggableItemComponent>
    );
};
const ImageEditor = React.memo((props) => {
    const { item, onSelectItem, onUpdateItem } = props; // Lấy thêm onUpdateItem

    // Giữ lại placeholder của bạn
    const placeholder = (
        <Box
            style={{ 
                width: '100%', 
                height: '100%', 
                backgroundColor: '#f0f0f0', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: '#888', 
                cursor: 'pointer', 
                textAlign: 'center', 
                padding: '10px', 
                boxSizing: 'border-box',
                // Đảm bảo placeholder cũng có hình dạng đúng
                borderRadius: item.shape === 'circle' ? '50%' : '0' 
            }}
            onClick={(e) => {
                e.stopPropagation();
                onSelectItem(item.id);
            }}
        >
            <Box sx={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1}}>
                <BrokenImageIcon />
                Chọn ảnh
            </Box>
        </Box>
    );

    return (
        <DraggableItemComponent {...props}>
            {item.url ? (
                // Dùng component mới khi có ảnh
                <PannableImageFrame 
                    item={item} 
                    onUpdateItem={onUpdateItem} 
                    onSelectItem={onSelectItem}
                />
            ) : (
                // Dùng placeholder khi không có ảnh
                placeholder
            )}
        </DraggableItemComponent>
    );
});


const TextPropertyEditor = ({ item, onUpdate, customFonts }) => {
    const theme = useTheme();
    const [displayColorPicker, setDisplayColorPicker] = useState(false);
    
    // Thêm state quản lý filter font
    const [fontFilter, setFontFilter] = useState('All');

    // Cập nhật Live (kéo thanh màu thì đổi màu ngay nhưng KHÔNG lưu vào lịch sử Undo)
    const handleColorChangeLive = (color) => {
        // Hỗ trợ cả mã HEX và RGBA (nếu có độ trong suốt)
        const colorValue = color.rgb.a !== 1 
            ? `rgba(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}, ${color.rgb.a})` 
            : color.hex;
        onUpdate(item.id, { color: colorValue }, false); 
    };

    // Khi thả chuột ra mới chính thức lưu vào lịch sử Undo/Redo
    const handleColorChangeComplete = (color) => {
        const colorValue = color.rgb.a !== 1 
            ? `rgba(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}, ${color.rgb.a})` 
            : color.hex;
        onUpdate(item.id, { color: colorValue }, true); 
    };

    // Hàm riêng cho các nút bấm màu nhanh bên ngoài
    const handleQuickColorSelect = (colorHex) => {
        onUpdate(item.id, { color: colorHex }, true);
    };

    const PRESET_COLORS = ['#000000', '#FFFFFF', '#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];
    
    // Dải màu mở rộng cho bảng chọn nâng cao
    const EXTENDED_PRESET_COLORS = [
        '#D0021B', '#F5A623', '#F8E71C', '#8B572A', '#7ED321', '#417505',
        '#BD10E0', '#9013FE', '#4A90E2', '#50E3C2', '#B8E986', '#000000',
        '#4A4A4A', '#9B9B9B', '#FFFFFF', '#3B82F6', '#10B981', '#EF4444'
    ];
    
    // Xử lý logic filter font
    const filteredCustomFonts = customFonts.filter(f => {
        if (fontFilter === 'All') return true;
        if (fontFilter === 'General') return !f.category || f.category === 'General';
        return f.category === fontFilter;
    });

    const showSystemFonts = fontFilter === 'All' || fontFilter === 'General';
    let availableFonts = [
        ...(showSystemFonts ? FONT_FAMILIES : []),
        ...filteredCustomFonts.map(f => f.name)
    ];

    if (item.fontFamily && !availableFonts.includes(item.fontFamily)) {
        availableFonts = [item.fontFamily, ...availableFonts];
    }
    availableFonts = [...new Set(availableFonts)]; 

    return (
        <Box component="form" noValidate autoComplete="off" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
                label="Nội dung"
                value={item.content}
                onChange={(e) => onUpdate(item.id, { content: e.target.value.slice(0, MAX_TEXT_LENGTH) }, false)}
                onBlur={() => onUpdate(item.id, {}, true)}
                fullWidth margin="none" size="small" variant="outlined" multiline rows={3}
                inputProps={{ maxLength: MAX_TEXT_LENGTH }}
            />
            <Grid container spacing={2}>
                <Grid item xs={6}>
                    <TextField label="Rộng (px)" type="number" value={Math.round(item.width)} onChange={(e) => onUpdate(item.id, { width: parseInt(e.target.value, 10) || MIN_ITEM_WIDTH }, false)} onBlur={() => onUpdate(item.id, {}, true)} fullWidth margin="none" size="small" variant="outlined" InputProps={{ inputProps: { min: MIN_ITEM_WIDTH } }} />
                </Grid>
                <Grid item xs={6}>
                    <TextField label="Cao (px)" type="number" value={Math.round(item.height)} onChange={(e) => onUpdate(item.id, { height: parseInt(e.target.value, 10) || MIN_ITEM_HEIGHT }, false)} onBlur={() => onUpdate(item.id, {}, true)} fullWidth margin="none" size="small" variant="outlined" InputProps={{ inputProps: { min: MIN_ITEM_HEIGHT } }} />
                </Grid>
            </Grid>
            
            <Box>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Lọc Font chữ:</Typography>
                <ToggleButtonGroup
                    value={fontFilter}
                    exclusive
                    onChange={(e, newVal) => { if(newVal) setFontFilter(newVal); }}
                    size="small"
                    sx={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: 0.5,
                        '& .MuiToggleButtonGroup-grouped': {
                            border: `1px solid ${theme.palette.divider} !important`,
                            borderRadius: '16px !important',
                            textTransform: 'none',
                            px: 1.5,
                            py: 0.25,
                            '&.Mui-selected': {
                                bgcolor: 'primary.main',
                                color: 'white',
                                '&:hover': { bgcolor: 'primary.dark' }
                            }
                        }
                    }}
                >
                    <ToggleButton value="All">Tất cả</ToggleButton>
                    <ToggleButton value="Wedding">Cưới</ToggleButton>
                    <ToggleButton value="Vietnamese">Tiếng Việt</ToggleButton>
                    <ToggleButton value="Uppercase">Viết hoa</ToggleButton>
                    <ToggleButton value="General">Khác</ToggleButton>
                </ToggleButtonGroup>
            </Box>

            <FormControl fullWidth margin="none" size="small">
                <InputLabel id="font-family-label">Font</InputLabel>
                <Select
                    labelId="font-family-label"
                    value={item.fontFamily}
                    label="Font"
                    onChange={(e) => onUpdate(item.id, { fontFamily: e.target.value }, true)}
                    MenuProps={{ PaperProps: { style: { maxHeight: 300 } } }}
                >
                    {availableFonts.length > 0 ? availableFonts.map(font => (
                        <MenuItem key={font} value={font} style={{ fontFamily: font }}>
                            {font}
                        </MenuItem>
                    )) : (
                        <MenuItem disabled>Không có font phù hợp</MenuItem>
                    )}
                </Select>
            </FormControl>
            <Grid container spacing={2}>
                <Grid item xs={6}>
                    <TextField
                        label="Cỡ chữ"
                        type="number"
                        value={item.fontSize}
                        onChange={(e) => {
                            const newSize = Math.max(8, Math.min(200, parseInt(e.target.value, 10) || 12));
                            onUpdate(item.id, { fontSize: newSize }, false);
                        }}
                        onBlur={() => onUpdate(item.id, {}, true)}
                        fullWidth margin="none" size="small" variant="outlined"
                        InputProps={{ inputProps: { min: 8, max: 200 } }}
                    />
                </Grid>
                <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Màu chữ</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                        {PRESET_COLORS.map(color => (
                            <Tooltip key={color} title={color}>
                                <IconButton
                                    onClick={() => handleQuickColorSelect(color)}
                                    sx={{
                                        width: 28, height: 28, bgcolor: color,
                                        border: `2px solid ${item.color === color ? theme.palette.primary.main : 'transparent'}`,
                                        '&:hover': { bgcolor: color, opacity: 0.8 }
                                    }}
                                />
                            </Tooltip>
                        ))}
                        
                        <Tooltip title="Bảng màu nâng cao">
                            <IconButton onClick={() => setDisplayColorPicker(true)} sx={{ border: '1px dashed', borderColor: 'divider', width: 28, height: 28 }}>
                                <PaletteIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>

                        {/* Thay thế Dropdown cũ bằng Dialog Modal ở giữa màn hình */}
                        <Dialog 
                            open={displayColorPicker} 
                            onClose={() => setDisplayColorPicker(false)}
                            maxWidth="xs"
                            fullWidth
                            PaperProps={{
                                sx: {
                                    borderRadius: 3, 
                                    p: 1
                                }
                            }}
                        >
                            <DialogTitle sx={{ pb: 1, fontWeight: '700', fontSize: '1.1rem', color: 'text.primary' }}>
                                Tùy chỉnh màu sắc
                            </DialogTitle>
                            <DialogContent sx={{ display: 'flex', justifyContent: 'center', pb: 2, pt: '10px !important' }}>
                                <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                                    <SketchPicker 
                                        color={item.color || '#000000'} 
                                        onChange={handleColorChangeLive} 
                                        onChangeComplete={handleColorChangeComplete}
                                        width="100%"
                                        presetColors={EXTENDED_PRESET_COLORS}
                                        disableAlpha={false} // Cho phép chỉnh độ mờ (opacity)
                                        style={{ boxShadow: 'none' }}
                                    />
                                </Box>
                            </DialogContent>
                            <DialogActions sx={{ px: 3, pb: 2 }}>
                                <Button onClick={() => setDisplayColorPicker(false)} variant="outlined" color="inherit" sx={{ fontWeight: 600 }}>
                                    Đóng
                                </Button>
                                <Button onClick={() => setDisplayColorPicker(false)} variant="contained" color="primary" sx={{ fontWeight: 600 }}>
                                    Hoàn tất
                                </Button>
                            </DialogActions>
                        </Dialog>
                    </Box>
                </Grid>
            </Grid>
            <Box>
                <Typography gutterBottom variant="body2" color="text.secondary">Xoay (độ)</Typography>
                <Slider value={item.rotation || 0} onChange={(_e, newValue) => onUpdate(item.id, { rotation: newValue }, false)} onChangeCommitted={() => onUpdate(item.id, {}, true)} aria-labelledby="rotation-slider" valueLabelDisplay="auto" step={1} marks min={-180} max={180} size="small" />
            </Box>
            <Divider sx={{ my: 1 }} />
            <Button
                variant={item.isGuestName ? 'contained' : 'outlined'}
                color="primary"
                onClick={() => onUpdate(item.id, { isGuestName: !item.isGuestName }, true)}
                fullWidth
            >
                {item.isGuestName ? 'Đã đặt làm Tên Khách Mời' : 'Đặt làm Tên Khách Mời'}
            </Button>
        </Box>
    );
}
const ImagePropertyEditor = ({ item, onUpdate, onScaleToCanvas }) => {
    const [liveBrightness, setLiveBrightness] = useState(item.brightness ?? 1);
    const [liveContrast, setLiveContrast] = useState(item.contrast ?? 1);
    const [liveGrayscale, setLiveGrayscale] = useState(item.grayscale ?? 0);
    useEffect(() => {
        setLiveBrightness(item.brightness ?? 1);
        setLiveContrast(item.contrast ?? 1);
        setLiveGrayscale(item.grayscale ?? 0);
    }, [item.id, item.brightness, item.contrast, item.grayscale]);
    const handleBrightnessCommit = () => onUpdate(item.id, { brightness: liveBrightness }, true);
    const handleContrastCommit = () => onUpdate(item.id, { contrast: liveContrast }, true);
    const handleGrayscaleCommit = () => onUpdate(item.id, { grayscale: liveGrayscale }, true);
    return (
        <Box component="form" noValidate autoComplete="off" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Grid container spacing={2}>
                <Grid item xs={6}>
                    <TextField label="Rộng (px)" type="number" value={Math.round(item.width)} onChange={(e) => onUpdate(item.id, { width: parseInt(e.target.value, 10) || MIN_ITEM_WIDTH }, false)} onBlur={() => onUpdate(item.id, {}, true)} fullWidth margin="none" size="small" variant="outlined" InputProps={{ inputProps: { min: MIN_ITEM_WIDTH } }} />
                </Grid>
                <Grid item xs={6}>
                    <TextField label="Cao (px)" type="number" value={Math.round(item.height)} onChange={(e) => onUpdate(item.id, { height: parseInt(e.target.value, 10) || MIN_ITEM_HEIGHT }, false)} onBlur={() => onUpdate(item.id, {}, true)} fullWidth margin="none" size="small" variant="outlined" InputProps={{ inputProps: { min: MIN_ITEM_HEIGHT } }} />
                </Grid>
            </Grid>
            <Box>
                <Typography gutterBottom variant="body2" color="text.secondary">
                    Hình dạng Khung
                </Typography>
                <ToggleButtonGroup
                    value={item.shape || 'square'}
                    exclusive
                    onChange={(_e, newShape) => {
                        if (newShape) onUpdate(item.id, { shape: newShape }, true);
                    }}
                    aria-label="shape"
                    size="small"
                    fullWidth
                >
                    <ToggleButton value="square" aria-label="vuông" sx={{flex: 1}}>
                        Hình Vuông
                    </ToggleButton>
                    <ToggleButton value="circle" aria-label="tròn" sx={{flex: 1}}>
                        Hình Tròn
                    </ToggleButton>
                </ToggleButtonGroup>
            </Box>
            <Box>
                <Typography gutterBottom variant="body2" color="text.secondary">Xoay (độ)</Typography>
                <Slider value={item.rotation || 0} onChange={(_e, newValue) => onUpdate(item.id, { rotation: newValue }, false)} onChangeCommitted={() => onUpdate(item.id, {}, true)} aria-labelledby="rotation-slider" valueLabelDisplay="auto" step={1} marks min={-180} max={180} size="small" />
            </Box>
            <Divider sx={{ my: 1 }} />
            <Button
                variant="outlined"
                startIcon={<CropFreeIcon />}
                onClick={() => onScaleToCanvas(item.id)}
                disabled={!item.url || item.locked}
                fullWidth
                size="medium"
            >
                Vừa với Canvas
            </Button>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle1" gutterBottom fontWeight="500">Hiệu ứng</Typography>
            <Box>
                <Typography gutterBottom variant="body2" color="text.secondary">Độ sáng</Typography>
                <Slider value={liveBrightness} onChange={(_e, val) => { setLiveBrightness(val); onUpdate(item.id, { brightness: val }, false); }} onChangeCommitted={handleBrightnessCommit} min={0} max={2} step={0.05} size="small" />
            </Box>
            <Box>
                <Typography gutterBottom variant="body2" color="text.secondary">Tương phản</Typography>
                <Slider value={liveContrast} onChange={(_e, val) => { setLiveContrast(val); onUpdate(item.id, { contrast: val }, false); }} onChangeCommitted={handleContrastCommit} min={0} max={2} step={0.05} size="small" />
            </Box>
            <Box>
                <Typography gutterBottom variant="body2" color="text.secondary">Trắng đen</Typography>
                <Slider value={liveGrayscale} onChange={(_e, val) => { setLiveGrayscale(val); onUpdate(item.id, { grayscale: val }, false); }} onChangeCommitted={handleGrayscaleCommit} min={0} max={1} step={0.05} size="small" />
            </Box>
        </Box>
    );
};
const TextToolbar = ({ item, onUpdate }) => {
    const theme = useTheme();
    const toggleStyle = (property, value, defaultValue) => {
        onUpdate(item.id, { [property]: item[property] === value ? defaultValue : value }, true);
    };
    const selectedButtonStyle = {
        bgcolor: alpha(theme.palette.primary.main, 0.1),
        color: 'primary.main',
    };
    return (
        <Paper elevation={0} sx={{ p: 1, mb: 2, display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap', border: `1px solid ${theme.palette.divider}` }}>
            <ButtonGroup size="small" variant="outlined" aria-label="text formatting">
                <Tooltip title="In Đậm (Ctrl+B)">
                    <IconButton onClick={() => toggleStyle('fontWeight', 'bold', 'normal')} sx={item.fontWeight === 'bold' ? selectedButtonStyle : {}}>
                        <FormatBoldIcon />
                    </IconButton>
                </Tooltip>
                <Tooltip title="In Nghiêng (Ctrl+I)">
                    <IconButton onClick={() => toggleStyle('fontStyle', 'italic', 'normal')} sx={item.fontStyle === 'italic' ? selectedButtonStyle : {}}>
                        <FormatItalicIcon />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Gạch Chân (Ctrl+U)">
                    <IconButton onClick={() => toggleStyle('textDecoration', 'underline', 'none')} sx={item.textDecoration === 'underline' ? selectedButtonStyle : {}}>
                        <FormatUnderlinedIcon />
                    </IconButton>
                </Tooltip>
            </ButtonGroup>
            <Divider orientation="vertical" flexItem />
            <ButtonGroup size="small" variant="outlined" aria-label="text alignment">
                <Tooltip title="Căn Trái">
                    <IconButton onClick={() => onUpdate(item.id, { textAlign: 'left' }, true)} sx={item.textAlign === 'left' ? selectedButtonStyle : {}}>
                        <FormatAlignLeftIcon />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Căn Giữa">
                    <IconButton onClick={() => onUpdate(item.id, { textAlign: 'center' }, true)} sx={item.textAlign === 'center' ? selectedButtonStyle : {}}>
                        <FormatAlignCenterIcon />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Căn Phải">
                    <IconButton onClick={() => onUpdate(item.id, { textAlign: 'right' }, true)} sx={item.textAlign === 'right' ? selectedButtonStyle : {}}>
                        <FormatAlignRightIcon />
                    </IconButton>
                </Tooltip>
            </ButtonGroup>
        </Paper>
    );
};
const BlankCanvasCreator = ({ onCreate }) => {
    const [category, setCategory] = useState(Object.keys(STANDARD_SIZES)[0]);
    const [sizeKey, setSizeKey] = useState(Object.keys(STANDARD_SIZES[Object.keys(STANDARD_SIZES)[0]])[0]);
    const [isCustomSize, setIsCustomSize] = useState(false);
    const [customWidth, setCustomWidth] = useState(10);
    const [customHeight, setCustomHeight] = useState(15);
    const [backgroundType, setBackgroundType] = useState('color');
    const [backgroundColor, setBackgroundColor] = useState('#FFFFFF');
    const [backgroundImageFile, setBackgroundImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const fileInputRef = useRef(null);

    const handleCategoryChange = (event) => {
        const newCategory = event.target.value;
        setCategory(newCategory);
        setSizeKey(Object.keys(STANDARD_SIZES[newCategory])[0]);
        setIsCustomSize(false);
    };

    const handleSizeChange = (event) => {
        const value = event.target.value;
        if (value === 'custom') {
            setIsCustomSize(true);
        } else {
            setIsCustomSize(false);
            setSizeKey(value);
        }
    };
    
    const handleCustomDimChange = (setter) => (event) => {
        let value = event.target.value;
        if (value === '') {
            setter('');
            return;
        }
        let numValue = parseFloat(value);
        if (numValue < 3) numValue = 3;
        if (numValue > 30) numValue = 30;
        setter(numValue);
    };


    const handleBackgroundTypeChange = (event, newType) => {
        if (newType !== null) {
            setBackgroundType(newType);
        }
    };

    const handleImageFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setBackgroundImageFile(file);
            const previewUrl = URL.createObjectURL(file);
            setImagePreview(previewUrl);
        }
    };

    const handleCreateClick = () => {
        let dimensions;
        if (isCustomSize) {
            if (customWidth < 3 || customWidth > 30 || customHeight < 3 || customHeight > 30) {
                toast.warn('Kích thước tùy chỉnh phải nằm trong khoảng từ 3cm đến 30cm.');
                return;
            }
            dimensions = fitToCanvas(customWidth, customHeight);
        } else {
            dimensions = STANDARD_SIZES[category][sizeKey];
        }

        const background = {
            type: backgroundType,
            value: backgroundType === 'color' ? backgroundColor : backgroundImageFile,
        };
        onCreate(dimensions.width, dimensions.height, background);
    };

    useEffect(() => {
        return () => {
            if (imagePreview) {
                URL.revokeObjectURL(imagePreview);
            }
        };
    }, [imagePreview]);

    return (
        <Paper variant="outlined" sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2, bgcolor: 'transparent', borderStyle: 'dashed' }}>
            <Typography variant="subtitle1" fontWeight="600" color="text.primary">Tạo mới từ đầu</Typography>
            <FormControl fullWidth size="small">
                <InputLabel>Loại thiệp</InputLabel>
                <Select value={category} label="Loại thiệp" onChange={handleCategoryChange}>
                    {Object.keys(STANDARD_SIZES).map(cat => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
                </Select>
            </FormControl>
            <FormControl fullWidth size="small">
                <InputLabel>Kích thước</InputLabel>
                <Select value={isCustomSize ? 'custom' : sizeKey} label="Kích thước" onChange={handleSizeChange}>
                    {Object.keys(STANDARD_SIZES[category]).map(key => <MenuItem key={key} value={key}>{key}</MenuItem>)}
                    <MenuItem value="custom">Tùy chỉnh kích thước...</MenuItem>
                </Select>
            </FormControl>

            {isCustomSize && (
                 <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                    <Grid container spacing={2} sx={{ alignItems: 'center', mt: 1 }}>
                        <Grid item xs={6}>
                            <TextField
                                label="Rộng (cm)"
                                type="number"
                                value={customWidth}
                                onChange={handleCustomDimChange(setCustomWidth)}
                                fullWidth
                                size="small"
                                inputProps={{ min: 3, max: 30, step: 0.1 }}
                            />
                        </Grid>
                        <Grid item xs={6}>
                             <TextField
                                label="Cao (cm)"
                                type="number"
                                value={customHeight}
                                onChange={handleCustomDimChange(setCustomHeight)}
                                fullWidth
                                size="small"
                                inputProps={{ min: 3, max: 30, step: 0.1 }}
                            />
                        </Grid>
                    </Grid>
                </motion.div>
            )}

            <Divider />
            <Typography variant="subtitle2" fontWeight="500">Nền trang</Typography>
            <ToggleButtonGroup
                color="primary"
                value={backgroundType}
                exclusive
                onChange={handleBackgroundTypeChange}
                aria-label="Background Type"
                fullWidth
                size="small"
            >
                <ToggleButton value="color">Màu sắc</ToggleButton>
                <ToggleButton value="image">Ảnh nền</ToggleButton>
            </ToggleButtonGroup>
            {backgroundType === 'color' ? (
                <TextField
                    label="Màu nền"
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    fullWidth
                    size="small"
                    variant="outlined"
                    sx={{ '& input[type=color]': { height: '40px', padding: '4px' } }}
                />
            ) : (
                <Box>
                    <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleImageFileChange}
                        style={{ display: 'none' }}
                    />
                    <Button
                        variant="outlined"
                        onClick={() => fileInputRef.current.click()}
                        fullWidth
                    >
                        Chọn ảnh nền
                    </Button>
                    {imagePreview && (
                        <Box
                            mt={2}
                            sx={{
                                height: 100,
                                borderRadius: 1,
                                border: '1px dashed',
                                borderColor: 'divider',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                backgroundImage: `url(${imagePreview})`,
                            }}
                        />
                    )}
                </Box>
            )}
            <Divider />
            <Button onClick={handleCreateClick} variant="contained" startIcon={<AddIcon />} size="large">
                Tạo thiệp mới
            </Button>
        </Paper>
    );
};

const SortableLayerItem = ({ id, item, selectedItemId, onSelectItem, onToggleVisibility, onToggleLock }) => {
    const theme = useTheme();
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <ListItem
            ref={setNodeRef}
            style={style}
            onClick={() => onSelectItem(item.id)}
            sx={{
                bgcolor: selectedItemId === item.id ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                border: `1px solid ${selectedItemId === item.id ? theme.palette.primary.main : theme.palette.divider}`,
                borderRadius: 1.5,
                mb: 1,
                transition: 'background-color 0.2s, border-color 0.2s',
                cursor: 'pointer',
                p: 0.5,
                '&:hover': {
                    bgcolor: selectedItemId !== item.id ? alpha(theme.palette.text.secondary, 0.05) : undefined,
                }
            }}
            secondaryAction={
                <Box>
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); onToggleLock(item.id); }}>
                        {item.locked ? <LockIcon fontSize="small" color="primary" /> : <LockOpenIcon fontSize="small" />}
                    </IconButton>
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); onToggleVisibility(item.id); }}>
                        {item.visible === false ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                    </IconButton>
                </Box>
            }
        >
            <Box {...attributes} {...listeners} sx={{ cursor: 'grab', display: 'flex', alignItems: 'center', px: 1, color: 'text.secondary' }}>
                <DragIndicatorIcon fontSize="small" />
            </Box>
            <ListItemIcon sx={{ minWidth: 24, mr: 1, color: 'text.secondary' }}>
                {item.type === 'text' ? <TextFieldsIcon fontSize="small" /> : <ImageIcon fontSize="small" />}
            </ListItemIcon>
            <ListItemText
                primary={item.type === 'text' ? (item.content || "Văn bản trống") : 'Hình ảnh'}
                primaryTypographyProps={{ noWrap: true, sx: { opacity: item.visible === false ? 0.5 : 1, fontWeight: selectedItemId === item.id ? '500' : '400' } }}
            />
        </ListItem>
    );
};
const LayersPanel = ({ items, selectedItemId, onSelectItem, onToggleVisibility, onToggleLock }) => {
    const reversedItems = [...items].reverse();
    return (
        <List dense sx={{ p: 0 }}>
            {reversedItems.map((item) => (
                <SortableLayerItem
                    key={item.id}
                    id={item.id}
                    item={item}
                    selectedItemId={selectedItemId}
                    onSelectItem={onSelectItem}
                    onToggleVisibility={onToggleVisibility}
                    onToggleLock={onToggleLock}
                />
            ))}
        </List>
    );
};
const processTemplate = (templateData) => {
    if (!templateData || !templateData.pages) return [];
    return templateData.pages.map(page => ({
        ...page,
        id: uuidv4(),
        canvasWidth: templateData.width || page.canvasWidth,
        canvasHeight: templateData.height || page.canvasHeight,
        items: page.items.map(item => ({
            ...defaultItemProps,
            ...item,
            id: uuidv4(),
        }))
    }));
};
const TemplatePickerIntegrated = ({ templates, onSelectTemplate }) => (
    <Box>
        <Typography variant="h6" gutterBottom>Chọn mẫu thiệp</Typography>
        <Grid container spacing={2} sx={{ pt: 1, maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}>
            {templates.length === 0 && (<Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Grid>)}
            {templates.map(template => (
                <Grid item key={template._id} xs={12}>
                    <Card onClick={() => onSelectTemplate(template._id)} sx={{ cursor: 'pointer', '&:hover': { boxShadow: 4, transform: 'scale(1.02)' }, transition: 'all 0.2s ease' }}>
                        <CardMedia component="img" height="150" image={template.imgSrc || 'https://placehold.co/400x400/EBF1FB/B0C7EE?text=No+Image'} alt={template.title} sx={{ objectFit: 'cover' }} />
                        <CardContent sx={{ p: 1.5 }}>
                            <Typography variant="body2" fontWeight="500">{template.title}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            ))}
        </Grid>
    </Box>
);
const SortablePageItem = ({ id, page, isSelected, onSelect, onRemove }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        cursor: 'pointer',
    };
    return (
        <Paper
            ref={setNodeRef}
            style={style}
            variant="outlined"
            onClick={() => onSelect(id)}
            sx={{
                p: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                mb: 1.5,
                borderColor: isSelected ? 'primary.main' : 'divider',
                borderWidth: isSelected ? '2px' : '1px',
                bgcolor: isSelected ? alpha('#3B82F6', 0.05) : 'transparent',
            }}
        >
            <Box {...attributes} {...listeners} sx={{ cursor: 'grab', color: 'text.secondary', display: 'flex', alignItems: 'center' }}>
                <DragIndicatorIcon />
            </Box>
            <Box
                sx={{
                    width: 60,
                    height: 45,
                    flexShrink: 0,
                    borderRadius: 1,
                    bgcolor: page.backgroundColor || '#FFFFFF',
                    backgroundImage: page.backgroundImage ? `url(${page.backgroundImage})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    border: '1px solid',
                    borderColor: 'divider',
                }}
            />
            <ListItemText
                primary={page.name || `Trang`}
                primaryTypographyProps={{ noWrap: true, fontWeight: isSelected ? '600' : '400' }}
            />
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); onRemove(id); }}>
                <DeleteIcon fontSize="small" />
            </IconButton>
        </Paper>
    );
};
function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}
const WeddingInvitationEditor = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const navigate = useNavigate();
    const { templateId, invitationId } = useParams();
    // BẮT ĐẦU SỬA LỖI: Thêm state để lưu trữ dữ liệu template gốc
    const [originalTemplate, setOriginalTemplate] = useState(null);
    // KẾT THÚC SỬA LỖI
    const [customFonts, setCustomFonts] = useState([]);
    const [backendTemplates, setBackendTemplates] = useState([]);
    const [iconImages, setIconImages] = useState([]);
    const [componentImages, setComponentImages] = useState([]);
    const [tagImages, setTagImages] = useState([]);
    const [userUploadedImages, setUserUploadedImages] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [history, setHistory] = useState({ stack: [], index: -1 });
    const pages = useMemo(() => history.stack[history.index] || [], [history.stack, history.index]);
    const [currentPageId, setCurrentPageId] = useState(null);
    const [clipboard, setClipboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTool, setActiveTool] = useState('pages');
    const [selectedItemId, setSelectedItemId] = useState(null);
    const [selectedSettingField, setSelectedSettingField] = useState(null);
    const [itemToEdit, setItemToEdit] = useState(null);
    const [localItemData, setLocalItemData] = useState(null); 
    const prevItemToEdit = usePrevious(itemToEdit);
    const handleUpdateSetting = useCallback((key, value) => {
        setEventSettings(prev => ({
            ...prev,
            [key]: value
        }));
    }, []);
    const handleNavigateBack = () => {
        // history.index > 0 nghĩa là đã có thay đổi chưa lưu
        if (history.index > 0 && !saving) {
            setShowExitConfirm(true); // Mở Dialog thay vì navigate
        } else {
            // Không có gì thay đổi, đi về
            navigate('/dashboard/templates');
        }
    };

    const [zoomLevel, setZoomLevel] = useState(1);
    const [viewScale, setViewScale] = useState(1);
    const showGrid = false;
    const snapToGrid = true;
    const gridSize = 20;
    const snapToObject = true;
    const [snapLines, setSnapLines] = useState([]);
    const [slug, setSlug] = useState('');
    const design = { themeColor: '#ffffff', fontFamily: 'Arial' };
    const [isScrolledToSettings, setIsScrolledToSettings] = useState(false);
    const [showSettingsPanel, setShowSettingsPanel] = useState(false);
    const [eventBlocks, setEventBlocks] = useState([]);
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const [activeDragItem, setActiveDragItem] = useState(null); // Thêm state này
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    ); 
    const [eventSettings, setEventSettings] = useState({
        eventDate: '', groomName: '', brideName: '', groomInfo: '', brideInfo: '', groomImageUrl: '', brideImageUrl: '',
        heroImages: { main: '', sub1: '', sub2: '' }, galleryImages: [],
        bannerImages: [], contactGroom: '', contactBride: '',
        eventLocation: { lat: 21.028511, lng: 105.804817, address: '' },
        musicUrl: '',
        qrCodeImageUrls: [], videoUrl: '',
        invitationType: 'Thiệp cưới',
        eventDescription: '',
        groomNameStyle: { fontFamily: 'Playfair Display', fontSize: 28, color: '#4a4a68', fontWeight: '600' },
        brideNameStyle: { fontFamily: 'Playfair Display', fontSize: 28, color: '#4a4a68', fontWeight: '600' },
        eventDescriptionStyle: { fontFamily: 'Inter', fontSize: 18, color: '#555555', textAlign: 'center' },
        groomInfoStyle: { fontFamily: 'Inter', fontSize: 16, color: '#555555', textAlign: 'center' },
        brideInfoStyle: { fontFamily: 'Inter', fontSize: 16, color: '#555555', textAlign: 'center' },
        groomImagePosition: { x: 0, y: 0, scale: 1 }, // THÊM
        brideImagePosition: { x: 0, y: 0, scale: 1 }, // THÊM
        contactGroomStyle: { fontFamily: 'Inter', fontSize: 15, color: '#777777', textAlign: 'center' },
        contactBrideStyle: { fontFamily: 'Inter', fontSize: 15, color: '#777777', textAlign: 'center' },
        countdownTitleStyle: { fontFamily: 'Playfair Display', fontSize: 44, color: '#4a4a68', fontWeight: '600' },
        coupleTitleStyle: { fontFamily: 'Playfair Display', fontSize: 44, color: '#4a4a68', fontWeight: '600' },
        coupleSubtitleStyle: { fontFamily: 'Inter', fontSize: 18, color: '#777777', fontStyle: 'italic' },
        participantsTitleStyle: { fontFamily: 'Playfair Display', fontSize: 44, color: '#4a4a68', fontWeight: '600' },
        eventsTitleStyle: { fontFamily: 'Playfair Display', fontSize: 44, color: '#4a4a68', fontWeight: '600' },
        loveStoryTitleStyle: { fontFamily: 'Playfair Display', fontSize: 44, color: '#4a4a68', fontWeight: '600' },
        galleryTitleStyle: { fontFamily: 'Playfair Display', fontSize: 44, color: '#4a4a68', fontWeight: '600' },
        videoTitleStyle: { fontFamily: 'Playfair Display', fontSize: 44, color: '#4a4a68', fontWeight: '600' },
        contactTitleStyle: { fontFamily: 'Playfair Display', fontSize: 44, color: '#4a4a68', fontWeight: '600' },
        qrCodeTitleStyle: { fontFamily: 'Playfair Display', fontSize: 44, color: '#4a4a68', fontWeight: '600' },
        participantTitleStyle: { fontFamily: 'Playfair Display', fontSize: 20, color: '#4a4a68' },
        participantContentStyle: { fontFamily: 'Inter', fontSize: 15, color: '#555555' },
        eventCardTitleStyle: { fontFamily: 'Playfair Display', fontSize: 24, color: '#4a4a68' },
        eventCardInfoStyle: { fontFamily: 'Inter', fontSize: 16, color: '#555555' },
        loveStoryItemTitleStyle: { fontFamily: 'Playfair Display', fontSize: 36, color: '#4a4a68' },
        loveStoryItemDateStyle: { fontFamily: 'Inter', fontSize: 15, color: '#777777' },
        loveStoryItemDescStyle: { fontFamily: 'Inter', fontSize: 16, color: '#555555' },
        contactCardHeaderStyle: { fontFamily: 'Inter', fontSize: 18, color: '#4a4a68', fontWeight: '600', textTransform: 'uppercase' },
        contactCardNameStyle: { fontFamily: 'Inter', fontSize: 16, color: '#333333', fontWeight: '500' },
        qrCodeCaptionStyle: { fontFamily: 'Inter', fontSize: 14, color: '#555555', marginTop: '8px' },
        countdownValueStyle: { fontFamily: 'Playfair Display', fontSize: 40, color: '#4a4a68', fontWeight: '700' },
        countdownLabelStyle: { fontFamily: 'Inter', fontSize: 14, color: '#777777', textTransform: 'uppercase', fontWeight: '500' },
        events: [],
        participants: [],
        loveStory: [],
        blocksOrder: [],
        countdownTitle: 'Sự kiện trọng đại sẽ diễn ra trong',
        coupleTitle: 'Cô Dâu & Chú Rể',
        coupleSubtitle: '... và hai trái tim cùng chung một nhịp đập ...',
        participantsTitle: 'Thành Viên Tham Gia',
        eventsTitle: 'Sự Kiện Cưới',
        loveStoryTitle: 'Chuyện Tình Yêu',
        galleryTitle: 'Bộ Sưu Tập Ảnh',
        videoTitle: 'Video Sự Kiện',
        contactTitle: 'Thông Tin Liên Hệ',
        qrCodeTitle: 'Mã QR Mừng Cưới',
        rsvpTitle: 'Xác Nhận Tham Dự',
        rsvpSubtitle: 'Sự hiện diện của bạn là niềm vinh hạnh cho gia đình chúng tôi.',
        rsvpTitleStyle: { fontFamily: 'Playfair Display', fontSize: 44, color: '#4a4a68', fontWeight: '600' },
        rsvpSubtitleStyle: { fontFamily: 'Inter', fontSize: 18, color: '#555555', textAlign: 'center' },
     });
    const settingsPanelRef = useRef(null);
    const centralColumnRef = useRef(null); // Ref for the scrolling container
    const canvasContainerRef = useRef(null);
    const canvasWrapperRef = useRef(null);
    const isPanning = useRef(false);
    const panStart = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const newBlocksOrder = eventBlocks.map(block => block.type);
        if (!_.isEqual(newBlocksOrder, eventSettings.blocksOrder)) {
            setEventSettings(prev => ({
                ...prev,
                blocksOrder: newBlocksOrder,
            }));
        }
    }, [eventBlocks, eventSettings.blocksOrder]);
    useLayoutEffect(() => {
        const calculateScale = () => {
            if (canvasWrapperRef.current && pages.length > 0) {
                const firstPage = pages[0];
                const wrapper = canvasWrapperRef.current;
                
                const wrapperWidth = wrapper.clientWidth;
                const wrapperHeight = wrapper.clientHeight;
                const padding = 60;

                const availableWidth = wrapperWidth - padding;
                
                // Ưu tiên tính scale để page có chiều cao bằng 80% wrapper
                const scaleToMeetHeightConstraint = (wrapperHeight * 0.8) / firstPage.canvasHeight;
                
                // Kiểm tra xem với scale này, chiều rộng có bị vượt quá không
                const projectedWidth = firstPage.canvasWidth * scaleToMeetHeightConstraint;

                let newScale;

                if (projectedWidth > availableWidth) {
                    // Nếu chiều rộng bị vượt, ta phải tính lại scale để vừa với chiều rộng
                    newScale = availableWidth / firstPage.canvasWidth;
                } else {
                    // Nếu không, scale theo chiều cao là hợp lệ
                    newScale = scaleToMeetHeightConstraint;
                }

                // --- FIX: Bỏ giới hạn Math.min(1.0, ...) để cho phép phóng to ---
                setViewScale(newScale);
            }
        };
        calculateScale();
        window.addEventListener('resize', calculateScale);
        return () => window.removeEventListener('resize', calculateScale);
    }, [pages]);


    
    useEffect(() => {
        const centralColumn = centralColumnRef.current;
        if (!centralColumn) return;
        const handleScroll = () => {
            const settingsPanel = settingsPanelRef.current;
            if (showSettingsPanel && settingsPanel) {
                const { top } = settingsPanel.getBoundingClientRect();
                const centralColumnTop = centralColumn.getBoundingClientRect().top;

                if (top <= centralColumnTop + 10) {
                    setIsScrolledToSettings(true);
                } else {
                    setIsScrolledToSettings(false);
                }
            } else {
                setIsScrolledToSettings(false);
            }
        };
        centralColumn.addEventListener('scroll', handleScroll);
        return () => {
            centralColumn.removeEventListener('scroll', handleScroll);
        };
    }, [showSettingsPanel]);
    useEffect(() => {
        const fetchInitialAssets = async () => {
            try {
                const [iconsRes, componentsRes, tagsRes] = await Promise.all([
                    api.get('/design-assets?type=icon'),
                    api.get('/design-assets?type=component'),
                    api.get('/design-assets?type=tag')
                ]);
                const mapData = (item) => ({ id: item._id, name: item.name, url: item.imgSrc });
                setIconImages(iconsRes.data.data.map(mapData));
                setComponentImages(componentsRes.data.data.map(mapData));
                setTagImages(tagsRes.data.data.map(mapData));
                const fontsRes = await api.get('/admin/fonts');
                setCustomFonts(fontsRes.data.data || []);
                const templatesRes = await api.get('/invitation-templates');
                setBackendTemplates(templatesRes.data.data || []);
            } catch (err) {
                console.error("Lỗi khi tải tài nguyên thiết kế ban đầu:", err);
                showErrorToast("Không thể tải một số tài nguyên thiết kế.");
            }
        };
        fetchInitialAssets();
    }, []);
    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            try {
                let invitationData;
                if (invitationId) {
                    const { data } = await api.get(`/invitations/${invitationId}`);
                    invitationData = data.data;
                    if (!invitationData) throw new Error("Không tìm thấy thiệp mời.");
                }
                else if (templateId) {
                    const { data } = await api.get(`/invitation-templates/${templateId}`);
                    const template = data.data;
                    if (!template || !template.templateData) {
                        throw new Error("Dữ liệu mẫu không hợp lệ.");
                    }
                    // BẮT ĐẦU SỬA LỖI: Lưu template gốc vào state
                    setOriginalTemplate(template);
                    // KẾT THÚC SỬA LỖI
                    const processedPages = processTemplate(template.templateData);
                    const suggestedSlug = template.title;
                    invitationData = {
                        content: processedPages,
                        design: template.templateData.design || { themeColor: '#ffffff', fontFamily: 'Arial' },
                        slug: suggestedSlug,
                        settings: template.templateData.settings || {}
                    };
                }
                else if (backendTemplates.length > 0) {
                    navigate(`/canvas/template/${backendTemplates[0]._id}`, { replace: true });
                    return;
                } else {
                    setLoading(false);
                    return;
                }
                const contentWithDefaults = (invitationData.content || []).map(page => ({
                    ...page,
                    items: (page.items || []).map(item => ({ ...defaultItemProps, ...item }))
                }));
                if (contentWithDefaults.length === 0) {
                    console.warn("Dữ liệu không có trang nào. Hiển thị canvas trống.");
                }
                setHistory({ stack: [contentWithDefaults], index: 0 });
                setCurrentPageId(contentWithDefaults[0]?.id || null);
                setSlug(invitationData.slug || '');
                
                if (invitationData.settings) {
                    const normalizedBanners = (invitationData.settings.bannerImages || []).map(img =>
                        typeof img === 'string' ? { id: img, url: img } : img
                    );
                    const formattedEventDate = invitationData.settings.eventDate
                        ? new Date(invitationData.settings.eventDate).toISOString().slice(0, 16)
                        : '';
                    
                    setEventSettings(prevState => ({
                        ...prevState, // Bắt đầu với default
                        ...invitationData.settings, // Ghi đè bằng dữ liệu đã lưu
                        bannerImages: normalizedBanners,
                        eventDate: formattedEventDate,
                    }));

                    // =======================================================
                    // === THÊM ĐOẠN MÃ NÀY VÀO ĐÂY ĐỂ KHỞI TẠO eventBlocks ===
                    // =======================================================
                    // const defaultOrder = [
                    //     'BANNER_CAROUSEL', 'EVENT_DESCRIPTION', 'COUPLE_INFO',
                    //     'PARTICIPANTS', 'EVENT_SCHEDULE', 'COUNTDOWN',
                    //     'LOVE_STORY', 'GALLERY', 'VIDEO', 'CONTACT_INFO', 'QR_CODES', 'RSVP', 'CUSTOM_HTML'
                    // ];
                    // let applicableBlockTypes = defaultOrder;
                    // if (invitationType && invitationType !== 'Thiệp cưới') { 
                    //     applicableBlockTypes = [
                    //         'EVENT_DESCRIPTION',
                    //         'GALLERY',
                    //         'VIDEO',
                    //     ];
                    // }
                    
                    // =======================================================
                    // === KẾT THÚC PHẦN MÃ CẦN THÊM ===
                    // =======================================================
                }
            } catch (err) {
                console.error("Lỗi khi tải dữ liệu:", err);
                setHistory({ stack: [], index: -1 });
            } finally {
                setLoading(false);
            }
        };
        if (templateId || invitationId || backendTemplates.length > 0) {
            loadInitialData();
        } else {
            setLoading(true);
        }
    }, [invitationId, templateId, backendTemplates, navigate]);
    const { blocksOrder, invitationType } = eventSettings;
    useEffect(() => {
        const initializeBlocks = () => {
            const order = blocksOrder || []; // Đảm bảo order là mảng
            const defaultOrder = [
                'BANNER_CAROUSEL', 'EVENT_DESCRIPTION', 'COUPLE_INFO',
                'PARTICIPANTS', 'EVENT_SCHEDULE', 'COUNTDOWN',
                'LOVE_STORY', 'GALLERY', 'VIDEO', 'CONTACT_INFO', 'QR_CODES', 'RSVP', 'CUSTOM_HTML'
            ];
            let applicableBlockTypes = defaultOrder;

            if (invitationType && invitationType !== 'Thiệp cưới') { 
                applicableBlockTypes = [
                    'EVENT_DESCRIPTION',
                    'GALLERY',
                    'VIDEO',
                ];
            }
            
            let initialBlocks;
            if (order && order.length > 0) {
                // Lọc các block từ `order` dựa trên `applicableBlockTypes`
                initialBlocks = order
                    .filter(type => applicableBlockTypes.includes(type))
                    .map(type => ({ id: uuidv4(), type }));

                // Thêm bất kỳ block nào còn thiếu mà không có trong `order`
                applicableBlockTypes.forEach(type => {
                    if (!order.includes(type)) {
                        initialBlocks.push({ id: uuidv4(), type });
                    }
                });

            } else {
                // Nếu không có `order` (ví dụ: dữ liệu cũ), dùng `applicableBlockTypes`
                initialBlocks = applicableBlockTypes.map(type => ({ id: uuidv4(), type }));
            }

            setEventBlocks(initialBlocks);
        };

        initializeBlocks();
    }, [blocksOrder, invitationType]);

    // --- START: SCROLL FOCUS LOGIC ---
    const handleScrollFocus = useCallback(() => {
        const container = canvasWrapperRef.current;
        if (!container || pages.length === 0) return;

        const scrollCenter = container.scrollTop + container.clientHeight / 2;

        let closestPageId = null;
        let minDistance = Infinity;

        pages.forEach(page => {
            const pageElement = document.getElementById(`page-container-${page.id}`);
            if (pageElement) {
                const pageTop = pageElement.offsetTop;
                const pageHeight = pageElement.offsetHeight;
                const pageCenter = pageTop + pageHeight / 2;
                const distance = Math.abs(scrollCenter - pageCenter);

                if (distance < minDistance) {
                    minDistance = distance;
                    closestPageId = page.id;
                }
            }
        });

        if (closestPageId && closestPageId !== currentPageId) {
            setCurrentPageId(closestPageId);
        }
    }, [pages, currentPageId]);

    const debouncedScrollHandler = useMemo(
        () => _.debounce(handleScrollFocus, 150),
        [handleScrollFocus]
    );

    useEffect(() => {
        const container = canvasWrapperRef.current;
        if (container) {
            container.addEventListener('scroll', debouncedScrollHandler);
        }
        return () => {
            if (container) {
                container.removeEventListener('scroll', debouncedScrollHandler);
            }
            debouncedScrollHandler.cancel();
        };
    }, [debouncedScrollHandler]);
    // --- END: SCROLL FOCUS LOGIC ---


    const scrollToPage = useCallback((pageId) => {
        const pageElement = document.getElementById(`page-container-${pageId}`);
        if (pageElement && canvasWrapperRef.current) {
            canvasWrapperRef.current.scrollTo({
                top: pageElement.offsetTop, 
                behavior: 'smooth',
            });
        }
    }, []);

    const setPages = useCallback((updater, recordHistory = true) => {
        setHistory(prev => {
            const currentPages = prev.stack[prev.index] || [];
            const newPages = typeof updater === 'function' ? updater(currentPages) : updater;

            if (_.isEqual(currentPages, newPages)) {
                return prev;
            }

            if (recordHistory) {
                const newStack = prev.stack.slice(0, prev.index + 1);
                newStack.push(newPages);
                return {
                    stack: newStack,
                    index: newStack.length - 1,
                };
            } else {
                const newStack = [...prev.stack];
                if (prev.index >= 0) {
                    newStack[prev.index] = newPages;
                }
                return {
                    ...prev,
                    stack: newStack,
                };
            }
        });
    }, []);
    const handleUndo = useCallback(() => {
        setHistory(prev => ({ ...prev, index: Math.max(-1, prev.index - 1) }));
    }, []);
    const handleRedo = useCallback(() => {
        setHistory(prev => ({ ...prev, index: Math.min(prev.stack.length - 1, prev.index + 1) }));
    }, []);

    const generateThumbnailFile = async () => {
        if (!pages || pages.length === 0) {
            toast.warn("Không có trang nào để tạo thumbnail.");
            return null;
        }

        const capturePageAsCanvas = async (pageId) => {
            const pageToCapture = pages.find(p => p.id === pageId);
            if (!pageToCapture) return null;

            await document.fonts.ready;

            const container = document.createElement('div');
            container.style.position = 'absolute';
            container.style.left = '-9999px';
            container.style.top = '0px';
            container.style.width = `${pageToCapture.canvasWidth}px`;
            container.style.height = `${pageToCapture.canvasHeight}px`;
            container.style.backgroundColor = pageToCapture.backgroundColor || '#FFFFFF';
            container.style.overflow = 'hidden';
            container.style.fontFamily = "'Inter', sans-serif";

            const loadingPromises = [];

            if (pageToCapture.backgroundImage) {
                const bgImg = document.createElement('img');
                if (!pageToCapture.backgroundImage.startsWith('blob:') && !pageToCapture.backgroundImage.startsWith('data:')) {
                    bgImg.crossOrigin = "anonymous";
                }
                bgImg.src = addOriginQueryParam(pageToCapture.backgroundImage);
                bgImg.style.position = 'absolute';
                bgImg.style.top = '0';
                bgImg.style.left = '0';
                bgImg.style.width = '100%';
                bgImg.style.height = '100%';
                bgImg.style.objectFit = 'cover';
                container.appendChild(bgImg);
                loadingPromises.push(new Promise(resolve => {
                    bgImg.onload = resolve;
                    bgImg.onerror = resolve;
                }));
            }
            
            const sortedItems = [...pageToCapture.items].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

            for (const item of sortedItems) {
                if (item.visible === false) continue;

                const el = document.createElement('div');
                el.style.position = 'absolute';
                el.style.left = `${item.x}px`;
                el.style.top = `${item.y}px`;
                el.style.width = `${item.width}px`;
                el.style.height = `${item.height}px`;
                el.style.transform = `rotate(${item.rotation || 0}deg)`;
                el.style.opacity = `${item.opacity || 1}`;
                
                // =================================================================
                // START OF CHANGE: Updated text rendering logic for 100% accuracy
                // =================================================================
                if (item.type === 'text') {
                    // Apply flexbox centering to match the live canvas EXACTLY.
                    el.style.display = 'flex';
                    el.style.alignItems = 'center';
                    el.style.justifyContent = 'center';
                    el.style.padding = '10px 5px';
                    el.style.boxSizing = 'border-box';
                    
                    // Apply all text styles directly to the element.
                    el.style.fontFamily = item.fontFamily || 'Arial';
                    el.style.fontSize = `${item.fontSize || 16}px`;
                    el.style.color = item.color || '#000000';
                    el.style.fontWeight = item.fontWeight || 'normal';
                    el.style.fontStyle = item.fontStyle || 'normal';
                    el.style.textDecoration = item.textDecoration || 'none';
                    el.style.textAlign = item.textAlign || 'center';
                    el.style.lineHeight = '1.4';
                    el.style.whiteSpace = 'pre-wrap';
                    el.style.wordBreak = 'break-word';

                    el.textContent = item.content || '';

                } else if (item.type === 'image' && item.url) {
                // =================================================================
                // END OF CHANGE
                // =================================================================
                    const img = document.createElement('img');
                    // CHỈNH SỬA
                    if (!item.url.startsWith('blob:') && !item.url.startsWith('data:')) {
                        img.crossOrigin = "anonymous";
                    }
                    img.src = addOriginQueryParam(item.url);
                    img.style.width = '100%';
                    img.style.height = '100%';
                    img.style.filter = `brightness(${item.brightness ?? 1}) contrast(${item.contrast ?? 1}) grayscale(${item.grayscale ?? 0})`;
                    el.appendChild(img);
                    loadingPromises.push(new Promise(resolve => {
                        img.onload = resolve;
                        img.onerror = resolve;
                    }));
                }
                
                container.appendChild(el);
            }
            
            document.body.appendChild(container);
            await Promise.all(loadingPromises);
            await new Promise(resolve => setTimeout(resolve, 200));

            let capturedCanvas = null;
            try {
                capturedCanvas = await html2canvas(container, {
                    scale: 2,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: null,
                    logging: false,
                });
            } catch (error) {
                console.error("Lỗi khi chụp ảnh thumbnail:", error);
            } finally {
                document.body.removeChild(container);
            }

            return capturedCanvas;
        };

        try {
            const page1Canvas = await capturePageAsCanvas(pages[0].id);
            if (!page1Canvas) throw new Error("Không thể chụp ảnh trang đầu tiên.");

            const THUMBNAIL_WIDTH = 600;
            const THUMBNAIL_HEIGHT = 400;
            const PADDING = 40;

            const finalCanvas = document.createElement('canvas');
            finalCanvas.width = THUMBNAIL_WIDTH;
            finalCanvas.height = THUMBNAIL_HEIGHT;
            const ctx = finalCanvas.getContext('2d');
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT);
            
            ctx.imageSmoothingQuality = "high";

            const availableWidth = THUMBNAIL_WIDTH - PADDING;
            const availableHeight = THUMBNAIL_HEIGHT - PADDING;

            if (pages.length === 1) {
                const scale = Math.min(availableWidth / page1Canvas.width, availableHeight / page1Canvas.height);
                const scaledW = page1Canvas.width * scale;
                const scaledH = page1Canvas.height * scale;
                const x = (THUMBNAIL_WIDTH - scaledW) / 2;
                const y = (THUMBNAIL_HEIGHT - scaledH) / 2;
                ctx.drawImage(page1Canvas, x, y, scaledW, scaledH);
            } else {
                const page2Canvas = await capturePageAsCanvas(pages[1].id);
                if (!page2Canvas) throw new Error("Không thể chụp ảnh trang thứ hai.");

                const overlapRatioX = 0.85; 
                const verticalShiftRatio = 0.10;

                // ✨ BẮT ĐẦU SỬA LỖI & TÁI CẤU TRÚC ✨
                const heightCorrectionFactor = 1.025; 
                const totalW = page1Canvas.width * (1 + overlapRatioX);
                const totalH = (page1Canvas.height * (1 + verticalShiftRatio)) * heightCorrectionFactor;
                
                // Di chuyển phép tính scale và định nghĩa các biến lên trước khi sử dụng
                const scale = Math.min(availableWidth / totalW, availableHeight / totalH);
                const scaledPageW = page1Canvas.width * scale;
                const scaledPageH = page1Canvas.height * scale;
                
                const totalRenderedW = scaledPageW * (1 + overlapRatioX);
                const totalRenderedH = scaledPageH + (scaledPageH * verticalShiftRatio);
                // ✨ KẾT THÚC SỬA LỖI & TÁI CẤU TRÚC ✨
                
                const x_base = (THUMBNAIL_WIDTH - totalRenderedW) / 2;
                const y_base = (THUMBNAIL_HEIGHT - totalRenderedH) / 2;
                
                const page1_x = x_base;
                const page1_y = y_base;

                const page2_x = x_base + (scaledPageW * overlapRatioX);
                const page2_y = y_base + (scaledPageH * verticalShiftRatio);
                
                ctx.shadowColor = 'rgba(0, 0, 0, 0.12)';
                ctx.shadowBlur = 8;
                ctx.shadowOffsetY = 3;

                ctx.drawImage(page2Canvas, page2_x, page2_y, scaledPageW, scaledPageH);
                ctx.drawImage(page1Canvas, page1_x, page1_y, scaledPageW, scaledPageH);
            }

            const blob = await new Promise(resolve => finalCanvas.toBlob(resolve, 'image/webp', 0.95));
            return new File([blob], "thumbnail.webp", { type: "image/webp" });

        } catch (error) {
            console.error("Lỗi khi tạo thumbnail:", error);
            toast.error("Không thể tạo thumbnail tự động. Vui lòng thử lại.");
            return null;
        }
    };





    // File: AdminFE/Pages/InvitationDesign/Components/Content/DesignContent.js

    const executeSaveChanges = async () => {
        if (!pages || pages.length === 0) {
            showErrorToast("Không có nội dung để lưu.");
            return;
        }
        setSaving(true);

        try {
            // =======================================================================
            // BƯỚC MỚI: TẠO THUMBNAIL TỪ TRÌNH DUYỆT TRƯỚC TIÊN
            // =======================================================================
            const thumbnailFile = await generateThumbnailFile();
            if (!thumbnailFile) {
                // Nếu tạo thumbnail thất bại, dừng quá trình lưu
                setSaving(false);
                return;
            }

            // =======================================================================
            // BƯỚC CŨ 1: TÌM VÀ THU THẬP TẤT CẢ CÁC FILE ẢNH MỚI (TỪ PAGES VÀ SETTINGS)
            // =======================================================================
            const newImagesFormData = new FormData();
            const pagesClone = _.cloneDeep(pages);
            const settingsClone = _.cloneDeep(eventSettings);
            let imageCounter = 0;

            const blobUrlToFile = async (blobUrl, fileName) => {
                const response = await fetch(blobUrl);
                const blob = await response.blob();
                return new File([blob], fileName, { type: blob.type || 'image/png' });
            };
            
            // Lặp qua pages để tìm ảnh mới
            const blobUrlToFileMap = new Map();
            for (const page of pages) {
                // Chỉ thêm vào bản đồ nếu trang đó có cả blob URL và File object tương ứng
                if (page.backgroundImage && page.backgroundImage.startsWith('blob:') && page.backgroundImageFile instanceof File) {
                    blobUrlToFileMap.set(page.backgroundImage, page.backgroundImageFile);
                }
            }

            // Lặp qua pages để tìm ảnh mới
            for (const page of pagesClone) {
                let fileToUpload = null;

                // Kịch bản 1: Trang này có đối tượng File của riêng nó (thường là trang gốc đã tải ảnh lên)
                if (page.backgroundImageFile instanceof File) {
                    fileToUpload = page.backgroundImageFile;
                } 
                // Kịch bản 2: Trang này chỉ có blob URL (trang được sao chép), tìm File gốc trong bản đồ
                else if (page.backgroundImage && page.backgroundImage.startsWith('blob:')) {
                    fileToUpload = blobUrlToFileMap.get(page.backgroundImage);
                }

                // Nếu tìm thấy file cần tải lên cho trang này
                if (fileToUpload) {
                    const placeholderId = `new_page_bg_${page.id}`;
                    newImagesFormData.append(placeholderId, fileToUpload);
                    page.backgroundImage = placeholderId; // Thay thế blob URL bằng placeholder để xử lý ở backend
                    imageCounter++;
                }

                // Đoạn mã xử lý ảnh trong item giữ nguyên
                for (const item of page.items) {
                    if (item.type === 'image' && item.url && item.url.startsWith('blob:')) {
                        const file = await blobUrlToFile(item.url, `item_${item.id}.png`);
                        const placeholderId = `new_item_img_${item.id}`;
                        newImagesFormData.append(placeholderId, file);
                        item.url = placeholderId;
                        imageCounter++;
                    }
                }
            }            
            // Lặp qua settings để tìm ảnh mới
            const settingImageFields = ['groomImageUrl', 'brideImageUrl', 'heroImages.main', 'heroImages.sub1', 'heroImages.sub2'];
            for (const fieldPath of settingImageFields) {
                const file = _.get(settingsClone, fieldPath);
                if (file instanceof File) {
                    const placeholderId = `new_setting_${fieldPath.replace(/\./g, '_')}`;
                    newImagesFormData.append(placeholderId, file);
                    _.set(settingsClone, fieldPath, placeholderId);
                    imageCounter++;
                }
            }
            
            const settingArrayImageFields = [{ path: 'galleryImages', fieldName: null }, { path: 'events', fieldName: 'imageUrl' }, { path: 'participants', fieldName: 'imageUrl' }, { path: 'loveStory', fieldName: 'imageUrl' }, { path: 'qrCodes', fieldName: 'url' }, { path: 'bannerImages', fieldName: 'file' }];
            for (const { path, fieldName } of settingArrayImageFields) {
                const items = _.get(settingsClone, path, []);
                for (let i = 0; i < items.length; i++) {
                    const file = fieldName ? items[i][fieldName] : items[i];
                    if (file instanceof File) {
                        const placeholderId = `new_setting_${path}_${i}`;
                        newImagesFormData.append(placeholderId, file);
                        if (fieldName) { items[i][fieldName] = placeholderId; } else { items[i] = placeholderId; }
                        imageCounter++;
                    }
                }
            }

            // =======================================================================
            // BƯỚC CŨ 2: TẢI TẤT CẢ ẢNH MỚI LÊN SERVER TRƯỚC (NẾU CÓ)
            // =======================================================================
            let imageUrlMap = {};
            if (imageCounter > 0) {
                const uploadResponse = await api.post('/admin/assets/upload-batch', newImagesFormData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                imageUrlMap = uploadResponse.data.urls;
            }

            // =======================================================================
            // BƯỚC CŨ 3: CẬP NHẬT LẠI DỮ LIỆU THIỆP VỚI CÁC URL THẬT TỪ SERVER
            // =======================================================================
            for (const page of pagesClone) {
                if (imageUrlMap[page.backgroundImage]) { page.backgroundImage = imageUrlMap[page.backgroundImage]; }
                for (const item of page.items) {
                    if (imageUrlMap[item.url]) { item.url = imageUrlMap[item.url]; }
                }
            }
            for (const fieldPath of settingImageFields) {
                const placeholder = _.get(settingsClone, fieldPath);
                if (imageUrlMap[placeholder]) { _.set(settingsClone, fieldPath, imageUrlMap[placeholder]); }
            }
            for (const { path, fieldName } of settingArrayImageFields) {
                const items = _.get(settingsClone, path, []);
                for (let i = 0; i < items.length; i++) {
                    const placeholder = fieldName ? items[i][fieldName] : items[i];
                    if (imageUrlMap[placeholder]) {
                        if (fieldName) {
                            items[i][fieldName] = imageUrlMap[placeholder];
                            if (fieldName === 'file') {
                                items[i].url = imageUrlMap[placeholder];
                                delete items[i].file;
                                delete items[i].preview;
                            }
                        } else { items[i] = imageUrlMap[placeholder]; }
                    }
                }
                if (path === 'bannerImages') { _.set(settingsClone, path, items.filter(item => item.url)); }
            }
            
            // =======================================================================
            // BƯỚC CŨ 4: XÂY DỰNG FORMDATA CUỐI CÙNG VÀ GỬI ĐI
            // =======================================================================
            if (!originalTemplate) {
                throw new Error("Không tìm thấy dữ liệu mẫu gốc để cập nhật.");
            }

             const finalFormData = new FormData();
            
            const cleanPages = pagesClone.map(page => _.omit(page, ['backgroundImageFile', 'items.isEditing']));
            
            const finalSettings = { ...settingsClone, blocksOrder: eventBlocks.map(block => block.type) };

            const templateDataPayload = {
                width: currentCanvasWidth,
                height: currentCanvasHeight,
                pages: cleanPages,
                design: design,
                settings: finalSettings,
            };

            finalFormData.append('title', originalTemplate.title);
            finalFormData.append('category', originalTemplate.category);
            finalFormData.append('group', originalTemplate.group);
            finalFormData.append('type', originalTemplate.type);
            finalFormData.append('description', originalTemplate.description || '');
            finalFormData.append('isActive', originalTemplate.isActive);
            finalFormData.append('templateData', JSON.stringify(templateDataPayload));
            finalFormData.append('loveGiftsButton', JSON.stringify(originalTemplate.loveGiftsButton));

            // **TÍCH HỢP**: Thêm file thumbnail đã tạo từ bước mới
            finalFormData.append('generatedThumbnail', thumbnailFile);

            // Gửi request
            await api.put(`/admin/templates/${templateId}`, finalFormData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast.success('Cập nhật thiết kế mẫu thành công!');
            navigate('/dashboard/templates');

        } catch (error) {
            console.error("Lỗi khi lưu thiết kế mẫu:", error.response?.data || error);
            const serverMessage = error.response?.data?.message || 'Lỗi không xác định';
            toast.error(`Lưu thất bại: ${serverMessage}`);
        } finally {
            setSaving(false);
        }
    };
    const handlePreviewInNewTab = () => {
        try {
            const settingsForPreview = _.cloneDeep(eventSettings);

            settingsForPreview.blocksOrder = eventBlocks.map(block => block.type);
            
            if (settingsForPreview.groomImageUrl instanceof File) {
                settingsForPreview.groomImageUrl = URL.createObjectURL(settingsForPreview.groomImageUrl);
            }
            if (settingsForPreview.brideImageUrl instanceof File) {
                settingsForPreview.brideImageUrl = URL.createObjectURL(settingsForPreview.brideImageUrl);
            }

            const imageArrayFields = ['galleryImages', 'bannerImages', 'qrCodes', 'participants', 'events', 'loveStory'];
            imageArrayFields.forEach(field => {
                if (Array.isArray(settingsForPreview[field])) {
                    settingsForPreview[field] = settingsForPreview[field].map(item => {
                        if (field === 'galleryImages' && item instanceof File) {
                             return URL.createObjectURL(item);
                        }
                        if (typeof item === 'object' && item !== null) {
                            const newItem = { ...item };
                            if (newItem.imageUrl && newItem.imageUrl instanceof File) {
                                newItem.imageUrl = URL.createObjectURL(newItem.imageUrl);
                            }
                            if (newItem.url && newItem.url instanceof File) {
                                newItem.url = URL.createObjectURL(newItem.url);
                            }
                             if (newItem.file && newItem.file instanceof File) {
                                newItem.url = URL.createObjectURL(newItem.file); // Banner dùng 'file'
                                delete newItem.file;
                                delete newItem.preview;
                            }
                            return newItem;
                        }
                        return item;
                    });
                }
            });


            const previewData = {
                pages: pages,
                invitationSettings: settingsForPreview, // Dùng dữ liệu đã qua xử lý
            };

            localStorage.setItem('invitationPreviewData', JSON.stringify(previewData));
            window.open('/template/preview', '_blank');
        } catch (error) {
            console.error("Không thể lưu dữ liệu xem trước:", error);
            toast.error("Có lỗi khi chuẩn bị xem trước.");
        }
    };



    const handleNextButtonClick = () => {
        if (!showSettingsPanel) {
            setShowSettingsPanel(true);
            // Cuộn xuống khu vực cài đặt
            setTimeout(() => {
                settingsPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    };


    useEffect(() => {
        if (showSettingsPanel) {
            setTimeout(() => {
                settingsPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    }, [showSettingsPanel]);
    const currentPage = pages.find(p => p.id === currentPageId);
    const currentItems = useMemo(() => currentPage ? [...currentPage.items].sort((a, b) => a.zIndex - b.zIndex) : [], [currentPage]);
    const currentBackgroundColor = currentPage ? currentPage.backgroundColor : '#FFFFFF';
    const currentBackgroundImage = currentPage ? currentPage.backgroundImage : null;
    const currentCanvasWidth = currentPage ? currentPage.canvasWidth : DEFAULT_CANVAS_WIDTH;
    const currentCanvasHeight = currentPage ? currentPage.canvasHeight : DEFAULT_CANVAS_HEIGHT;
    const calculateFitZoom = useCallback(() => {
        if (!canvasWrapperRef.current || !currentCanvasWidth || !currentCanvasHeight) return 1;
        const wrapperRect = canvasWrapperRef.current.getBoundingClientRect();
        const padding = 40;
        const availableWidth = wrapperRect.width - padding;
        const availableHeight = wrapperRect.height - padding;
        const widthScale = availableWidth / currentCanvasWidth;
        const heightScale = availableHeight / currentCanvasHeight;
        return Math.min(widthScale, heightScale, MAX_ZOOM);
    }, [currentCanvasWidth, currentCanvasHeight]);
    const fitToScreen = useCallback(() => {
        const newZoom = calculateFitZoom();
        setZoomLevel(newZoom);
    }, [calculateFitZoom]);
    useLayoutEffect(() => { if (currentPage) fitToScreen(); }, [currentPageId, fitToScreen, currentPage]);
    useEffect(() => { window.addEventListener('resize', fitToScreen); return () => window.removeEventListener('resize', fitToScreen); }, [fitToScreen]);
    const handleZoomIn = () => setZoomLevel(prevZoom => Math.min(MAX_ZOOM, prevZoom + ZOOM_STEP));
    const handleZoomOut = () => setZoomLevel(prevZoom => Math.max(MIN_ZOOM, prevZoom - ZOOM_STEP));
    const handleZoomSliderChange = (_event, newValue) => setZoomLevel(newValue);
    const handleSelectItem = useCallback((id) => {
        if (id !== selectedItemId) {
            setSelectedItemId(id);
            if(selectedSettingField) setSelectedSettingField(null);
        }
        const item = currentItems.find(i => i.id === id);
        if (item?.locked) return;
        if (id !== null && currentPageId) {
            const updater = (currentPages) => currentPages.map(page =>
                page.id === currentPageId
                    ? { ...page, items: page.items.map(item => (item.type === 'text' && item.id !== id && item.isEditing) ? { ...item, isEditing: false } : item) }
                    : page
            );
            setPages(updater, false);
        }
    }, [currentPageId, currentItems, selectedItemId, setPages, selectedSettingField]);
    const handleSetActiveTool = (tool) => {
        setSelectedItemId(null);
        setSelectedSettingField(null);
        setItemToEdit(null);
        setActiveTool(prevTool => prevTool === tool ? 'default' : tool);
    };
    useEffect(() => {
        if (prevItemToEdit && !itemToEdit && localItemData) {
            const { type, isNew } = prevItemToEdit;
            const listKey = type;
            setEventSettings(prev => {
                const list = prev[listKey] || [];
                let newList;
                const itemExists = list.some(item => item.id === localItemData.id);
                if (isNew && !itemExists) {
                    newList = [...list, localItemData];
                } else {
                     newList = list.map(item => item.id === localItemData.id ? localItemData : item);
                }
                return { ...prev, [listKey]: newList };
            });
            setLocalItemData(null);
        }
    }, [itemToEdit, prevItemToEdit, localItemData, setEventSettings]);
    const handleSelectSettingField = (key) => {
        setSelectedItemId(null);
        setItemToEdit(null); 
        setSelectedSettingField(prevKey => (prevKey === key ? null : key));
    };
    const handleSelectBlock = (blockType) => {
        const blockConfig = AVAILABLE_BLOCKS[blockType];
        if (blockConfig) {
            const keyToSelect = blockConfig.titleKey || blockConfig.key || (blockConfig.relatedFields && blockConfig.relatedFields[0]);
            if (keyToSelect) {
                handleSelectSettingField(keyToSelect);
            }
        }
    };
    const handleRemoveBlock = (blockId) => {
        let newBlocksOrder = [];
        setEventBlocks(prevBlocks => {
            const newBlocks = prevBlocks.filter(b => b.id !== blockId);
            newBlocksOrder = newBlocks.map(b => b.type);
            return newBlocks;
        });
        setEventSettings(prevSettings => ({
            ...prevSettings,
            blocksOrder: newBlocksOrder
        }));
        toast.success("Đã xóa khối thành công.");
    };


    const handleAddBlock = (blockType) => {
        const newBlock = { id: uuidv4(), type: blockType };

        // Cập nhật danh sách các khối để hiển thị
        setEventBlocks(prevBlocks => [...prevBlocks, newBlock]);

        // Cập nhật cài đặt sự kiện để cung cấp dữ liệu mặc định cho khối mới
        setEventSettings(prevSettings => {
            const newBlocksOrder = [...(prevSettings.blocksOrder || []), blockType];
            
            const newSettings = {
                ...prevSettings,
                blocksOrder: newBlocksOrder
            };

            // Khởi tạo dữ liệu mặc định cho từng loại khối
            switch (blockType) {
                case 'EVENT_DESCRIPTION':
                    newSettings.eventDescription = "Nhấp để thêm câu chuyện của bạn...";
                    break;
                case 'COUPLE_INFO':
                    newSettings.coupleTitle = 'Cô Dâu & Chú Rể';
                    newSettings.coupleSubtitle = '... và hai trái tim cùng chung một nhịp đập ...';
                    break;
                case 'PARTICIPANTS':
                    newSettings.participantsTitle = "Thành Viên Tham Gia";
                    if (!newSettings.participants) newSettings.participants = [];
                    break;
                case 'EVENT_SCHEDULE':
                    newSettings.eventsTitle = "Sự Kiện Cưới";
                    if (!newSettings.events) newSettings.events = [];
                    break;
                case 'LOVE_STORY':
                    newSettings.loveStoryTitle = "Chuyện Tình Yêu";
                    if (!newSettings.loveStory) newSettings.loveStory = [];
                    break;
                case 'GALLERY':
                    newSettings.galleryTitle = "Bộ Sưu Tập Ảnh";
                    if (!newSettings.galleryImages) newSettings.galleryImages = [];
                    break;
                case 'VIDEO':
                    newSettings.videoTitle = "Video Sự Kiện";
                    newSettings.videoUrl = "";
                    break;
                case 'CONTACT_INFO':
                    newSettings.contactTitle = "Thông Tin Liên Hệ";
                    break;
                case 'QR_CODES':
                    newSettings.qrCodeTitle = "Mã QR Mừng Cưới";
                    if (!newSettings.qrCodes) newSettings.qrCodes = [];
                    break;
                case 'COUNTDOWN':
                    newSettings.countdownTitle = "Sự kiện trọng đại sẽ diễn ra trong";
                    break;
                case 'RSVP':
                    newSettings.rsvpTitle = 'Xác Nhận Tham Dự';
                    newSettings.rsvpSubtitle = 'Sự hiện diện của bạn là niềm vinh hạnh cho gia đình chúng tôi.';
                    break;
                case 'CUSTOM_HTML':
                    newSettings.customHtmlContent = '<p>Đây là nội dung tùy chỉnh của bạn. Hãy nhấp vào để chỉnh sửa!</p>';
                    newSettings.customHtmlTitle = 'Tiêu đề khối tùy chỉnh';
                    break;
                default:
                    break;
            }
            
            return newSettings;
        });

        toast.success("Đã thêm khối mới thành công!");
    };







    const handleReorderBlocks = (activeId, overId) => {
        setEventBlocks(items => {
            const oldIndex = items.findIndex(item => item.id === activeId);
            const newIndex = items.findIndex(item => item.id === overId);
            return arrayMove(items, oldIndex, newIndex);
        });
    };
    const handleEditItem = (item) => {
        const listKeyMap = {
            events: 'events',
            participants: 'participants',
            loveStory: 'loveStory',
        };
        const key = listKeyMap[item.type];
        if (key) {
            setSelectedSettingField(key); 
            setItemToEdit(item);        
        } else {
            console.warn("Unknown item type for editing:", item.type);
        }
    };
    const handleCanvasWrapperMouseDown = (event) => {
        if (event.button === 1 || (event.button === 0 && (event.ctrlKey || event.metaKey))) {
            event.preventDefault();
            isPanning.current = true;
            panStart.current = { x: event.clientX, y: event.clientY };
            if (canvasWrapperRef.current) {
                canvasWrapperRef.current.style.cursor = 'grabbing';
            }
            const handleMove = (e) => {
                if (!isPanning.current) return;
                panStart.current = { x: e.clientX, y: e.clientY };
            };
            const handleUp = () => {
                isPanning.current = false;
                if (canvasWrapperRef.current) {
                    canvasWrapperRef.current.style.cursor = 'grab';
                }
                window.removeEventListener('pointermove', handleMove);
                window.removeEventListener('pointerup', handleUp);
            };

            window.addEventListener('pointermove', handleMove);
            window.addEventListener('pointerup', handleUp);
            return;
        }
        if (event.button === 0) {
            const target = event.target;
            const isClickOnItem = target.closest('.draggable-item-class');
            if (!isClickOnItem) {
                handleSelectItem(null);
            }
            if (selectedItemId) {
                const item = currentItems.find(i => i.id === selectedItemId);
                if (item?.isEditing) {
                    const updater = (currentPages) => currentPages.map(page =>
                        page.id === currentPageId
                            ? { ...page, items: page.items.map(i => (i.isEditing ? { ...i, isEditing: false } : i)) }
                            : page
                    );
                    setPages(updater, true);
                }
            }
        }
    };
    const handleCanvasWrapperContextMenu = (event) => event.preventDefault();
    const getNextZIndex = useCallback(() => {
        if (!currentPage || currentItems.length === 0) return BASE_Z_INDEX;
        return Math.max(...currentItems.map(item => item.zIndex), BASE_Z_INDEX) + 1;
    }, [currentItems, currentPage]);
    const handleSelectTemplate = useCallback((id) => {
        if (!id) return;
        setActiveTool('default');
        navigate(`/canvas/template/${id}`);
    }, [navigate]);
    const handleCreateBlankCanvas = (width, height, background) => {
        const newPage = {
            id: uuidv4(),
            name: `Trang 1`,
            items: [],
            backgroundColor: '#FFFFFF',
            backgroundImage: '',
            canvasWidth: width,
            canvasHeight: height
        };
        if (background.type === 'color') {
            newPage.backgroundColor = background.value;
        } else if (background.type === 'image' && background.value) {
            newPage.backgroundImage = URL.createObjectURL(background.value);
            // DÒNG ĐƯỢC THÊM VÀO ĐỂ SỬA LỖI
            newPage.backgroundImageFile = background.value;
        }
        setPages([newPage], true);
        setCurrentPageId(newPage.id);
        setSelectedItemId(null);
        setActiveTool('default');
    };

    const handleAddPage = useCallback(() => {
        if (!currentPage) {
            toast.warn("Vui lòng tạo hoặc chọn một trang trước khi thêm trang mới.");
            return;
        }
        const newPage = {
            id: uuidv4(),
            name: `Trang ${pages.length + 1}`,
            items: [],
            backgroundColor: currentPage.backgroundColor || '#FFFFFF',
            backgroundImage: currentPage.backgroundImage || '',
            backgroundImageFile: currentPage.backgroundImageFile || null,
            canvasWidth: currentPage?.canvasWidth || DEFAULT_CANVAS_WIDTH,
            canvasHeight: currentPage?.canvasHeight || DEFAULT_CANVAS_HEIGHT
        };
        const newPages = [...pages, newPage];
        setPages(newPages, true);
        setCurrentPageId(newPage.id);
        setSelectedItemId(null);

        setTimeout(() => {
            scrollToPage(newPage.id);
        }, 100);
    }, [currentPage, pages, setPages, scrollToPage]);


    const handleDeletePage = useCallback((id) => {
        if (!id || pages.length <= 1) { toast.warn("Không thể xóa trang cuối cùng."); return; }
        if (window.confirm(`Bạn có chắc muốn xóa trang "${pages.find(p => p.id === id)?.name}"?`)) {
            const newPages = pages.filter(p => p.id !== id);
            const newPageIndex = Math.max(0, pages.findIndex(p => p.id === id) - 1);
            const newCurrentPageId = newPages[newPageIndex].id;
            setCurrentPageId(newCurrentPageId);
            setPages(newPages, true);
            toast.success("Đã xóa trang!");
            setTimeout(() => scrollToPage(newCurrentPageId), 100);
        }
    }, [pages, setPages, scrollToPage]);

    const handleReorderPages = useCallback((activeId, overId) => {
        setPages(currentPages => {
            const oldIndex = currentPages.findIndex(p => p.id === activeId);
            const newIndex = currentPages.findIndex(p => p.id === overId);
            return arrayMove(currentPages, oldIndex, newIndex);
        }, true);
    }, [setPages]);
    
    useEffect(() => { if (pages.length > 0 && !pages.find(p => p.id === currentPageId)) setCurrentPageId(pages[0]?.id || null); }, [currentPageId, pages]);
    

    
    const handleBackgroundColorChange = (color) => { if (!currentPageId) return; setPages(pages.map(p => p.id === currentPageId ? { ...p, backgroundColor: color } : p), true); };
    
    const handleBackgroundImageChange = (file) => {
        if (!currentPageId || !file) return;
        const imageUrl = URL.createObjectURL(file); // URL tạm thời để hiển thị
        setPages(currentPages =>
            currentPages.map(p =>
                p.id === currentPageId ? { ...p, backgroundImage: imageUrl, backgroundImageFile: file } : p
            ), true
        );
    };


    const handleRemoveBackgroundImage = () => {
        if (!currentPageId) return;
        setPages(currentPages =>
            currentPages.map(p =>
                p.id === currentPageId ? { ...p, backgroundImage: null } : p
            ), true
        );
    };
    const addImageToCanvas = useCallback((url, targetPageId = currentPageId) => {
        const pageForAdding = pages.find(p => p.id === targetPageId);
        if (!pageForAdding) {
            toast.warn("Vui lòng chọn hoặc tạo một trang trước khi thêm ảnh!");
            return;
        }

        setActiveTool('default');
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            const ratio = img.width / img.height;
            let newWidth = Math.min(img.width, pageForAdding.canvasWidth * 0.25);
            let newHeight = newWidth / ratio;
            if (newHeight > pageForAdding.canvasHeight * 0.25) {
                newHeight = pageForAdding.canvasHeight * 0.25;
                newWidth = newHeight * ratio;
            }
            const newImageItem = { ...defaultItemProps, id: uuidv4(), url, x: pageForAdding.canvasWidth / 2 - newWidth / 2, y: pageForAdding.canvasHeight / 2 - newHeight / 2, width: newWidth, height: newHeight, type: 'image', zIndex: getNextZIndex() };
            
            setPages(currentPages => currentPages.map(page =>
                page.id === targetPageId ? { ...page, items: [...page.items, newImageItem] } : page
            ), true);
            setSelectedItemId(newImageItem.id);
        };
        img.onerror = () => toast.error(`Không thể tải hình ảnh từ: ${url}`);
        img.src = url;
    }, [pages, getNextZIndex, setPages, currentPageId]);
    const handleUserImageFileUpload = useCallback(async (files) => {
    if (!files || files.length === 0) return;

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
        formData.append(`file_${i}`, files[i]);
    }

    setIsUploading(true);
    try {
        const response = await api.post('/admin/assets/upload-batch', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });

        const urlMap = response.data.urls;
        const newImages = Object.values(urlMap).map(url => ({
            id: uuidv4(),
            name: url.split('/').pop(),
            url: url
        }));

        // 1. Cập nhật danh sách ảnh ở Sidebar (Giữ nguyên logic cũ)
        setUserUploadedImages(prev => [...newImages, ...prev]);
        
        // 2. === LOGIC MỚI: Tự động thêm ảnh vào Canvas ===
        if (currentPageId && newImages.length > 0) {
            newImages.forEach(img => {
                // Gọi hàm thêm ảnh vào canvas cho từng ảnh vừa upload
                addImageToCanvas(img.url, currentPageId);
            });
            toast.success(`Đã tải lên và thêm ${newImages.length} ảnh vào thiết kế.`);
        } else {
            toast.success(`Đã tải lên thành công ${newImages.length} ảnh (Vui lòng chọn trang để thêm ảnh).`);
        }

    } catch (error) {
        console.error("Lỗi khi tải ảnh lên:", error.response || error);
        toast.error(error.response?.data?.message || 'Tải ảnh lên thất bại.');
    } finally {
        setIsUploading(false);
    }
}, [currentPageId, addImageToCanvas]);
    const handleDeleteUserImages = useCallback((imageIdsToDelete) => {
        setUserUploadedImages(prev => prev.filter(img => !imageIdsToDelete.includes(img.id)));
        toast.success(`Đã xóa ${imageIdsToDelete.length} ảnh khỏi danh sách.`);
    }, []);

    const handleUpdateItem = useCallback((id, updates, record) => {
        if (!currentPageId) return;
        const updater = (currentPages) => currentPages.map(p =>
            p.id === currentPageId
                ? { ...p, items: p.items.map(i => i.id === id ? { ...i, ...updates } : i) }
                : p
        );
        setPages(updater, record);
    }, [currentPageId, setPages]);
    const handleDeleteItem = useCallback((id) => { if (!currentPageId || !id) return; setPages(pages.map(p => p.id === currentPageId ? { ...p, items: p.items.filter(i => i.id !== id) } : p), true); if (selectedItemId === id) setSelectedItemId(null); }, [currentPageId, selectedItemId, pages, setPages]);
    
    const handleBringToFront = useCallback((id) => {
        if (!currentPageId || !id) return;
        setPages(currentPages => currentPages.map(page => {
            if (page.id !== currentPageId) return page;
            const maxZ = (page.items.length > 0 ? Math.max(...page.items.map(i => i.zIndex)) : BASE_Z_INDEX);
            return {
                ...page,
                items: page.items.map(i => i.id === id ? { ...i, zIndex: maxZ + 1 } : i)
            };
        }), true);
    }, [currentPageId, setPages]);

    const handleSendToBack = useCallback((id) => {
        if (!currentPageId || !id) return;
        setPages(currentPages => currentPages.map(page => {
            if (page.id !== currentPageId) return page;
            const minZ = (page.items.length > 0 ? Math.min(...page.items.map(i => i.zIndex)) : BASE_Z_INDEX);
            return {
                ...page,
                items: page.items.map(i => i.id === id ? { ...i, zIndex: minZ - 1 } : i)
            };
        }), true);
    }, [currentPageId, setPages]);
    
    const handleReorderItems = useCallback((activeId, overId) => {
        setPages(currentPages => currentPages.map(page => {
            if (page.id !== currentPageId) return page;
            
            const reversedItems = [...page.items].sort((a, b) => a.zIndex - b.zIndex).reverse();
            const oldIndex = reversedItems.findIndex(i => i.id === activeId);
            const newIndex = reversedItems.findIndex(i => i.id === overId);
            
            const reorderedReversed = arrayMove(reversedItems, oldIndex, newIndex);
            
            const finalOrderedItems = reorderedReversed.reverse();
            const idToZIndexMap = new Map();
            finalOrderedItems.forEach((item, index) => {
                idToZIndexMap.set(item.id, BASE_Z_INDEX + index);
            });

            const newItems = page.items.map(item => ({
                ...item,
                zIndex: idToZIndexMap.get(item.id) ?? item.zIndex
            }));

            return { ...page, items: newItems };
        }), true);
    }, [currentPageId, setPages]);


    const handleCopy = useCallback(() => { if (!selectedItemId || !currentPage) return; const item = currentPage.items.find(i => i.id === selectedItemId); if (item) setClipboard(item); }, [selectedItemId, currentPage]);
    const handlePaste = useCallback(() => { if (!clipboard || !currentPage) return; const newItem = { ...clipboard, id: uuidv4(), x: clipboard.x + 20, y: clipboard.y + 20, zIndex: getNextZIndex(), isEditing: false, locked: false }; setPages(pages.map(p => p.id === currentPageId ? { ...p, items: [...p.items, newItem] } : p), true); setSelectedItemId(newItem.id); }, [clipboard, currentPage, currentPageId, getNextZIndex, pages, setPages]);
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            const meta = e.ctrlKey || e.metaKey;
            if (meta && e.key === 'z') { e.preventDefault(); handleUndo(); }
            if (meta && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) { e.preventDefault(); handleRedo(); }
            if (meta && e.key === 'c') { e.preventDefault(); handleCopy(); }
            if (meta && e.key === 'v') { e.preventDefault(); handlePaste(); }
            if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); if (selectedItemId) handleDeleteItem(selectedItemId); }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleUndo, handleRedo, handleCopy, handlePaste, handleDeleteItem, selectedItemId]);
    useEffect(() => {
        const bgCanvas = document.getElementById(`background-canvas-${currentPage?.id}`);
        if (!bgCanvas || !currentPage) return;
        const bgCtx = bgCanvas.getContext('2d');
        bgCanvas.width = currentCanvasWidth;
        bgCanvas.height = currentCanvasHeight;
        bgCtx.clearRect(0, 0, currentCanvasWidth, currentCanvasHeight);
        bgCtx.fillStyle = currentBackgroundColor || '#FFFFFF';
        bgCtx.fillRect(0, 0, currentCanvasWidth, currentCanvasHeight);
        if (currentBackgroundImage) {
            const finalUrl = addOriginQueryParam(currentBackgroundImage);
            const img = new Image();
            if (!finalUrl.startsWith('blob:') && !finalUrl.startsWith('data:')) {
                img.crossOrigin = "anonymous";
            }
            img.onload = () => bgCtx.drawImage(img, 0, 0, currentCanvasWidth, currentCanvasHeight);
            img.onerror = () => console.error(`Không thể tải ảnh nền: ${finalUrl}`);
            img.src = finalUrl;
        }
    }, [currentBackgroundImage, currentBackgroundColor, currentCanvasWidth, currentCanvasHeight, currentPage]);
    useEffect(() => {
        const gridCanvas = document.getElementById(`grid-canvas-${currentPage?.id}`); if (!gridCanvas || !currentPage) return; const gridCtx = gridCanvas.getContext('2d');
        gridCanvas.width = currentCanvasWidth; gridCanvas.height = currentCanvasHeight; gridCtx.clearRect(0, 0, currentCanvasWidth, currentCanvasHeight);
        if (showGrid && gridSize > 0) {
            gridCtx.strokeStyle = 'rgba(0, 0, 0, 0.1)'; gridCtx.lineWidth = Math.max(0.5, 0.5 / zoomLevel); gridCtx.beginPath();
            for (let x = gridSize; x < currentCanvasWidth; x += gridSize) { gridCtx.moveTo(x, 0); gridCtx.lineTo(x, currentCanvasHeight); }
            for (let y = gridSize; y < currentCanvasHeight; y += gridSize) { gridCtx.moveTo(0, y); gridCtx.lineTo(currentCanvasWidth, y); }
            gridCtx.stroke();
        }
    }, [showGrid, gridSize, currentCanvasWidth, currentCanvasHeight, zoomLevel, currentPage]);
    useEffect(() => {
        const snapCanvas = document.getElementById(`snap-lines-canvas-${currentPage?.id}`);
        if (!snapCanvas || !currentPage) return;
        const snapCtx = snapCanvas.getContext('2d');
        snapCanvas.width = currentCanvasWidth;
        snapCanvas.height = currentCanvasHeight;
        snapCtx.clearRect(0, 0, currentCanvasWidth, currentCanvasHeight);
        if (snapLines.length > 0) {
            snapCtx.strokeStyle = 'rgba(6, 86, 161, 0.9)';
            snapCtx.lineWidth = 1 / zoomLevel;
            snapCtx.setLineDash([4 / zoomLevel, 2 / zoomLevel]);
            snapCtx.beginPath();
            snapLines.forEach(line => {
                if (line.type === 'v') {
                    snapCtx.moveTo(line.x, line.y1);
                    snapCtx.lineTo(line.x, line.y2);
                } else {
                    snapCtx.moveTo(line.x1, line.y);
                    snapCtx.lineTo(line.x2, line.y);
                }
            });
            snapCtx.stroke();
            snapCtx.setLineDash([]);
        }
    }, [snapLines, currentCanvasWidth, currentCanvasHeight, zoomLevel, currentPage]);
    useEffect(() => { if (canvasWrapperRef.current) canvasWrapperRef.current.style.cursor = isPanning.current ? 'grabbing' : 'grab'; });
    const handleToggleLayerVisibility = (id) => { const i = currentItems.find(it => it.id === id); if (i) handleUpdateItem(id, { visible: !(i.visible ?? true) }, true); };
    const handleToggleLayerLock = (id) => { const i = currentItems.find(it => it.id === id); if (i) handleUpdateItem(id, { locked: !i.locked }, true); };
    const handleScaleImageToFit = useCallback((id) => {
        const page = pages.find(p => p.id === currentPageId);
        if (!page || !id) return;

        const item = page.items.find(i => i.id === id);
        if (!item || item.type !== 'image' || !item.url) return;

        const cw = page.canvasWidth;
        const ch = page.canvasHeight;
        
        handleUpdateItem(id, {
            width: cw,
            height: ch,
            x: 0,
            y: 0,
        }, true);

    }, [pages, currentPageId, handleUpdateItem]);

    const handleDragStart = (event) => {
        setActiveDragItem(event.active.data.current);
    };

    const handleDragEnd = (event) => {
        const { over, active } = event;
        setActiveDragItem(null);

        if (!over || !active.data.current || !String(over.id).startsWith('page-drop-area-')) {
            return; 
        }
        
        const itemData = active.data.current;
        const prefix = 'page-drop-area-';
        const targetPageId = String(over.id).substring(prefix.length);

        if (itemData.type === 'image') {
            addImageToCanvas(itemData.url, targetPageId); 
        } else if (itemData.type === 'text') {
            addTextToCanvas(itemData.content, targetPageId);
        }
    };

    const addTextToCanvas = useCallback((content, targetPageId) => {
        const pageForAdding = pages.find(p => p.id === targetPageId);
        if (!pageForAdding) return;
        
        const newTextItem = { 
            ...defaultItemProps, 
            id: uuidv4(), 
            content, 
            x: (pageForAdding.canvasWidth / 2) - 125, 
            y: (pageForAdding.canvasHeight / 2) - 25, 
            width: 250, 
            height: 50, 
            fontSize: 24, 
            type: 'text', 
            zIndex: getNextZIndex() 
        };

        setPages(currentPages => currentPages.map(page => 
            page.id === targetPageId ? { ...page, items: [...page.items, newTextItem] } : page
        ), true);
        setSelectedItemId(newTextItem.id);
        setActiveTool('default');
    }, [pages, getNextZIndex, setPages]);

    

    const handleSidebarItemClick = useCallback((itemData) => {
        if (!currentPageId) {
            toast.warn("Vui lòng chọn hoặc tạo một trang trước khi thêm đối tượng!");
            return;
        }

        if (itemData.type === 'image' && itemData.url) {
            addImageToCanvas(itemData.url, currentPageId);
        } else if (itemData.type === 'text' && itemData.content) {
            // Sử dụng lại logic từ hàm handleAddText cũ
            const newTextItem = { ...defaultItemProps, id: uuidv4(), content: itemData.content, x: currentPage.canvasWidth / 2 - 125, y: currentPage.canvasHeight / 2 - 25, width: 250, height: 50, fontFamily: 'Arial', fontSize: 24, color: '#333333', isEditing: true, type: 'text', zIndex: getNextZIndex() };
            setPages(currentPages => currentPages.map(page => page.id === currentPageId ? { ...page, items: [...page.items, newTextItem] } : page), true);
            setSelectedItemId(newTextItem.id);
            setActiveTool('default');
        }
    }, [currentPageId, currentPage, addImageToCanvas, getNextZIndex, setPages]);


    const activeItem = currentPage ? currentItems.find(i => i.id === selectedItemId) : null;
    if (isMobile) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', p: 3, textAlign: 'center', bgcolor: 'background.default' }}>
                <Paper sx={{ p: 4 }}>
                    <Typography variant="h5" color="text.primary" gutterBottom>Trình chỉnh sửa không hỗ trợ trên di động</Typography>
                    <Typography variant="body1" color="text.secondary">Vui lòng sử dụng trên máy tính để có trải nghiệm tốt nhất.</Typography>
                </Paper>
            </Box>
        );
    }
    const renderPageContent = (page, isActive) => {
        if (!page) return null;
        return (
            <CanvasContainer
                id={`canvas-content-${page.id}`}
                className="canvas-content-wrapper"
                theme={theme}
                ref={canvasContainerRef}
                style={{ width: page.canvasWidth, height: page.canvasHeight }} >
                <StyledCanvas id={`background-canvas-${page.id}`} style={{ zIndex: 1, backgroundColor: page.backgroundColor || '#FFFFFF' }} />
                <StyledCanvas id={`grid-canvas-${page.id}`} style={{ zIndex: 2 }} />
                <StyledCanvas id={`snap-lines-canvas-${page.id}`} style={{ zIndex: 9999 }} />
                <AnimatePresence>
                    {(page.items || []).filter(item => item.visible !== false).sort((a, b) => a.zIndex - b.zIndex).map(item => {
                        const EditorComponent = item.type === 'text' ? TextEditor : ImageEditor;
                        const isItemSelected = isActive && selectedItemId === item.id;
                        return <EditorComponent
                            key={item.id} item={item} onUpdateItem={handleUpdateItem}
                            isSelected={isItemSelected} onSelectItem={handleSelectItem}
                            canvasRef={canvasContainerRef} zoomLevel={viewScale} 
                            snapToGrid={snapToGrid}
                            gridSize={gridSize} allItems={page.items} onSetSnapLines={setSnapLines}
                            snapToObject={snapToObject} />;
                    })}
                </AnimatePresence>
            </CanvasContainer>
        );
    };

    const renderSecondarySidebar = () => {
        if (isScrolledToSettings) {
            if (selectedSettingField && selectedSettingField !== 'invitationType') { // Cập nhật điều kiện
                return (
                    <Box sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>{SETTINGS_META[selectedSettingField]?.label || 'Chỉnh sửa'}</Typography>
                        <SettingsPropertyEditor
                            selectedKey={selectedSettingField}
                            settings={eventSettings}
                            setSettings={setEventSettings}
                            customFonts={customFonts}
                            itemToEdit={itemToEdit}
                            setItemToEdit={setItemToEdit}
                            localItemData={localItemData}
                            setLocalItemData={setLocalItemData}
                        />
                    </Box>
                );
            }
            const currentBlockTypes = new Set(eventBlocks.map(b => b.type));
            const allToggleableBlocks = Object.entries(AVAILABLE_BLOCKS).filter(([type, config]) => !config.required);

            return (
                <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Box>
                        <Typography variant="h6" gutterBottom sx={{ mb: 1.5 }}>{SETTINGS_META['invitationType'].label}</Typography>
                        <SettingsPropertyEditor
                            selectedKey="invitationType"
                            settings={eventSettings}
                            setSettings={setEventSettings}
                            customFonts={customFonts}
                            itemToEdit={itemToEdit}
                            setItemToEdit={setItemToEdit}
                        />
                    </Box>
                    <Divider />

                    <Box>
                        <Typography variant="h6" gutterBottom>Quản lý Khối</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Thêm hoặc xóa các khối nội dung cho trang sự kiện của bạn.
                        </Typography>
                        <List>
                            {allToggleableBlocks.map(([type, config]) => {
                                // Kiểm tra xem khối này đã được thêm vào canvas/settings chưa
                                const isSelected = currentBlockTypes.has(type);

                                return (
                                    <ListItemButton 
                                        key={type} 
                                        onClick={() => {
                                            if (isSelected) {
                                                // Nếu ĐÃ CHỌN -> Tìm ID của khối đó và Xóa
                                                const blockToRemove = eventBlocks.find(b => b.type === type);
                                                if (blockToRemove) handleRemoveBlock(blockToRemove.id);
                                            } else {
                                                // Nếu CHƯA CHỌN -> Thêm mới
                                                handleAddBlock(type);
                                            }
                                        }}
                                        sx={{ 
                                            alignItems: 'flex-start', 
                                            py: 1.5,
                                            pr: 5, // Thêm padding-right để text không bị đè bởi checkbox
                                            borderRadius: 1.5, // Bo góc mượt hơn
                                            mb: 1,
                                            position: 'relative', // Quan trọng: Để định vị absolute cho Checkbox
                                            border: '1px solid',
                                            borderColor: isSelected ? 'primary.main' : 'divider', // Đổi màu viền nếu được chọn
                                            backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.05)' : 'transparent', // Nền xanh nhạt nếu được chọn
                                            transition: 'all 0.2s ease',
                                            '&:hover': {
                                                backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'action.hover',
                                            }
                                        }}
                                    >
                                        <ListItemIcon sx={{ mt: 0.5, minWidth: 40, color: isSelected ? 'primary.main' : 'inherit' }}>
                                            {config.icon}
                                        </ListItemIcon>
                                        <ListItemText 
                                            primary={config.label} 
                                            secondary={config.description}
                                            primaryTypographyProps={{ 
                                                variant: 'subtitle2', 
                                                fontWeight: 600,
                                                color: isSelected ? 'primary.main' : 'text.primary' // Đổi màu chữ nếu chọn
                                            }}
                                            secondaryTypographyProps={{ 
                                                variant: 'caption', 
                                                color: 'text.secondary',
                                                sx: { display: 'block', mt: 0.5, lineHeight: 1.4 } 
                                            }}
                                        />
                                        
                                        {/* Checkbox ở góc trên bên phải */}
                                        <Checkbox
                                            checked={isSelected}
                                            size="small"
                                            disableRipple
                                            sx={{
                                                position: 'absolute',
                                                top: 8,
                                                right: 8,
                                                p: 0.5,
                                                '&.Mui-checked': {
                                                    color: 'primary.main',
                                                }
                                            }}
                                            // Không cần onchange vì sự kiện click đã được bắt bởi ListItemButton bọc ngoài
                                        />
                                    </ListItemButton>
                                );
                            })}
                        </List>
                        {/* Đã xóa dòng "Tất cả các khối đã được thêm" vì bây giờ danh sách luôn hiển thị */}
                    </Box>
                </Box>
            );
        }
        if (activeItem) {
            return (
                <Box sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>Thuộc tính</Typography>
                    {activeItem.type === 'text' && <TextToolbar item={activeItem} onUpdate={handleUpdateItem} />}
                    {activeItem.type === 'text' && <TextPropertyEditor item={activeItem} onUpdate={handleUpdateItem} customFonts={customFonts} />}
                    {activeItem.type === 'image' && <ImagePropertyEditor item={activeItem} onUpdate={handleUpdateItem} onScaleToCanvas={handleScaleImageToFit} />}
                </Box>
            );
        }
        if (selectedSettingField) {
            return (
                <Box sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>{SETTINGS_META[selectedSettingField]?.label || 'Chỉnh sửa'}</Typography>
                    <SettingsPropertyEditor
                        selectedKey={selectedSettingField}
                        settings={eventSettings}
                        setSettings={setEventSettings}
                        customFonts={customFonts}
                        itemToEdit={itemToEdit}
                        setItemToEdit={setItemToEdit}
                        localItemData={localItemData}
                        setLocalItemData={setLocalItemData}
                    />
                </Box>
            );
        }
        switch (activeTool) {
            case 'templates':
                return <Box sx={{ p: 2 }}><TemplatePickerIntegrated templates={backendTemplates} onSelectTemplate={handleSelectTemplate} /></Box>;
            case 'user-images':
                return <Box sx={{ p: 2 }}><UserImageManager userImages={userUploadedImages} onItemClick={handleSidebarItemClick} onImageUploaded={handleUserImageFileUpload} isUploading={isUploading} onDeleteImages={handleDeleteUserImages} /></Box>;
            case 'icons':
                return <Box sx={{ p: 2 }}><GenericImagePicker images={iconImages} onItemClick={handleSidebarItemClick} title="Chọn Icon" /></Box>;
            case 'components':
                return <Box sx={{ p: 2 }}><GenericImagePicker images={componentImages} onItemClick={handleSidebarItemClick} title="Chọn Thành Phần" /></Box>;
            case 'tags':
                return <Box sx={{ p: 2 }}><GenericImagePicker images={tagImages} onItemClick={handleSidebarItemClick} title="Chọn Tag/Khung" /></Box>;
            case 'create-new':
                return <Box sx={{ p: 2 }}><BlankCanvasCreator onCreate={handleCreateBlankCanvas} /></Box>;
            default:
                return (
                    <IntegratedSidebarPanel
                        pages={pages}
                        currentPageId={currentPageId}
                        currentItems={currentItems}
                        selectedItemId={selectedItemId}
                        currentBackgroundColor={currentBackgroundColor}
                        onSelectPage={(pageId) => {
                            setCurrentPageId(pageId);
                            scrollToPage(pageId);
                        }}
                        onDeletePage={handleDeletePage}
                        onReorderPages={handleReorderPages}
                        onAddPage={handleAddPage}
                        onSelectItem={handleSelectItem}
                        onToggleVisibility={handleToggleLayerVisibility}
                        onToggleLock={handleToggleLayerLock}
                        onBackgroundColorChange={handleBackgroundColorChange}
                        onBackgroundImageChange={handleBackgroundImageChange}
                        onRemoveBackgroundImage={handleRemoveBackgroundImage}
                        onReorderItems={handleReorderItems}
                    />
                );
        }
    };


    return (
        <>
            <Helmet>
                <style>
                    {customFonts.map(font => `
                        @font-face {
                            font-family: "${font.name}";
                            src: url('${font.url}');
                        }
                    `).join('\n')}
                </style>
            </Helmet>
            <DndContext 
                onDragStart={handleDragStart} 
                onDragEnd={handleDragEnd}
                sensors={sensors}
            >
                <Box sx={{ display: 'flex', height: '100vh', flexDirection: 'column', bgcolor: 'background.default' }}>                            
                    <Paper square elevation={0} sx={{ display: 'flex', alignItems: 'center', p: '8px 16px', flexShrink: 0, height: 64, zIndex: (theme) => theme.zIndex.drawer + 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
                        <Tooltip title="Quay về trang quản lý">
                            <IconButton onClick={handleNavigateBack} sx={{ mr: 1.5 }}>
                                <ArrowBackIcon />
                            </IconButton>
                        </Tooltip>
                        <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', mr: 2 }}>
                            {templateId ? 'Chỉnh sửa mẫu' : 'Tạo mẫu mới'}
                        </Typography>
                        <TextField 
                            label="Tên thiệp" 
                            variant="outlined" 
                            size="small" 
                            value={slug} 
                            onChange={(e) => setSlug(e.target.value)} 
                            sx={{ ml: 'auto', mr: 2, minWidth: '300px' }} 
                        />

                        {/* Logic hiển thị nút mới */}
                        {!showSettingsPanel ? (
                            // CHỈ HIỂN THỊ NÚT "TIẾP THEO" KHI CHƯA CUỘN XUỐNG
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleNextButtonClick}
                                size="medium"
                                startIcon={<NavigateNextIcon />}
                                disabled={saving || loading}
                            >
                                Tiếp theo
                            </Button>
                        ) : (
                            // HIỂN THỊ CÁC NÚT CÒN LẠI SAU KHI ĐÃ NHẤN "TIẾP THEO"
                            <>
                                <Button
                                    variant="outlined"
                                    color="primary"
                                    onClick={handlePreviewInNewTab}
                                    size="medium"
                                    startIcon={<VisibilityIcon />}
                                    disabled={saving || loading}
                                >
                                    Xem trước
                                </Button>

                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={executeSaveChanges}
                                    size="medium"
                                    startIcon={<Save />}
                                    sx={{ ml: 1.5 }}
                                    disabled={saving || loading}
                                >
                                    {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                                </Button>
                            </>
                        )}
                    </Paper>

                    <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
                        <Box sx={{ display: 'flex', flexShrink: 0, height: 'calc(100vh - 64px)' }}>
                            <Paper
                                square
                                elevation={0}
                                sx={{
                                    width: LEFT_PRIMARY_SIDEBAR_WIDTH,
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    py: 2,
                                    borderRight: `1px solid ${theme.palette.divider}`
                                }}
                            >
                                <List sx={{ width: '100%' }}>
                                    {isScrolledToSettings ? (
                                        <>
                                            <ListItemButton selected={!selectedSettingField} onClick={() => handleSelectSettingField(null)} sx={{ flexDirection: 'column', px: 1, mb: 1 }}>
                                                <ViewModuleIcon />
                                                <ListItemText primary="Các Khối" primaryTypographyProps={{ variant: 'caption' }} />
                                            </ListItemButton>
                                        </>
                                    ) : (
                                        <>
                                            <ListItemButton selected={activeTool === 'pages'} onClick={() => handleSetActiveTool('pages')} sx={{ flexDirection: 'column', px: 1, mb: 1 }}><FileCopyIcon /><ListItemText primary="Trang" primaryTypographyProps={{ variant: 'caption' }} /></ListItemButton>
                                            <ListItemButton selected={activeTool === 'templates'} onClick={() => handleSetActiveTool('templates')} sx={{ flexDirection: 'column', px: 1, mb: 1 }}><StyleIcon /><ListItemText primary="Mẫu" primaryTypographyProps={{ variant: 'caption' }} /></ListItemButton>
                                            <ListItemButton selected={activeTool === 'create-new'} onClick={() => handleSetActiveTool('create-new')} sx={{ flexDirection: 'column', px: 1, mb: 1 }}>
                                                <AddCircleOutlineIcon />
                                                <ListItemText primary="Tạo mới" primaryTypographyProps={{ variant: 'caption' }} />
                                            </ListItemButton>
                                            <DraggableSidebarItem data={{ id: 'sidebar-text-item', type: 'text', content: 'Nội dung mới' }}>
                                                <ListItemButton 
                                                    onClick={() => handleSidebarItemClick({ type: 'text', content: 'Nội dung mới' })} 
                                                    sx={{ flexDirection: 'column', px: 1, mb: 1, cursor: 'grab' }} 
                                                    component="div"
                                                >
                                                    <TextFieldsIcon />
                                                    <ListItemText primary="Văn bản" primaryTypographyProps={{ variant: 'caption' }} />
                                                </ListItemButton>
                                            </DraggableSidebarItem>                                          
                                            <ListItemButton selected={activeTool === 'user-images'} onClick={() => handleSetActiveTool('user-images')} sx={{ flexDirection: 'column', px: 1, mb: 1 }}><CloudUploadIcon /><ListItemText primary="Tải lên" primaryTypographyProps={{ variant: 'caption' }} /></ListItemButton>
                                            <ListItemButton selected={activeTool === 'icons'} onClick={() => handleSetActiveTool('icons')} sx={{ flexDirection: 'column', px: 1, mb: 1 }}><ImageIcon /><ListItemText primary="Icon" primaryTypographyProps={{ variant: 'caption' }} /></ListItemButton>
                                            <ListItemButton selected={activeTool === 'components'} onClick={() => handleSetActiveTool('components')} sx={{ flexDirection: 'column', px: 1, mb: 1 }}><CategoryIcon /><ListItemText primary="Thành phần" primaryTypographyProps={{ variant: 'caption' }} /></ListItemButton>
                                            <ListItemButton selected={activeTool === 'tags'} onClick={() => handleSetActiveTool('tags')} sx={{ flexDirection: 'column', px: 1, mb: 1 }}><LabelIcon /><ListItemText primary="Tag/Khung" primaryTypographyProps={{ variant: 'caption' }} /></ListItemButton>
                                        </>
                                    )}
                                </List>
                            </Paper>
                            <Paper
                                square
                                elevation={0}
                                sx={{
                                    width: LEFT_SECONDARY_SIDEBAR_WIDTH,
                                    height: '100%',
                                    borderRight: `1px solid ${theme.palette.divider}`,
                                    overflowY: 'auto'
                                }}
                            >
                                {renderSecondarySidebar()}
                            </Paper>
                        </Box>
                        <Box ref={centralColumnRef} sx={{ flexGrow: 1, height: 'calc(100vh - 64px)', overflowY: 'auto', bgcolor: 'background.default' }}>
                            <Box sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                height: '100%',
                                p: 2
                            }}>
                                <Paper elevation={0} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, gap: 1, flexShrink: 0, flexWrap: 'wrap', mb: 2, borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <Tooltip title="Hoàn tác (Ctrl+Z)"><IconButton size="small" onClick={handleUndo} disabled={history.index < 0}><UndoIcon /></IconButton></Tooltip>
                                        <Tooltip title="Làm lại (Ctrl+Y)"><IconButton size="small" onClick={handleRedo} disabled={history.index >= history.stack.length - 1}><RedoIcon /></IconButton></Tooltip>
                                        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
                                        <Tooltip title="Sao chép (Ctrl+C)"><IconButton size="small" onClick={handleCopy} disabled={!activeItem}><ContentCopyIcon /></IconButton></Tooltip>
                                        <Tooltip title="Dán (Ctrl+V)"><IconButton size="small" onClick={handlePaste} disabled={!clipboard}><ContentPasteIcon /></IconButton></Tooltip>
                                    </Box>
                                    {activeItem && !activeItem.locked && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Tooltip title="Độ mờ"><OpacityIcon fontSize="small" sx={{ color: 'text.secondary' }} /></Tooltip>
                                            <Slider value={activeItem.opacity} onChange={(_e, val) => handleUpdateItem(selectedItemId, { opacity: val }, false)} onChangeCommitted={() => handleUpdateItem(selectedItemId, {}, true)} min={0} max={1} step={0.01} sx={{ width: 100 }} size="small" />
                                            <Divider orientation="vertical" flexItem />
                                            <Tooltip title="Đưa lên trên"><IconButton size="small" onClick={() => handleBringToFront(selectedItemId)}><FlipToFrontIcon /></IconButton></Tooltip>
                                            <Tooltip title="Đưa xuống dưới"><IconButton size="small" onClick={() => handleSendToBack(selectedItemId)}><FlipToBackIcon /></IconButton></Tooltip>
                                            <Tooltip title="Xóa đối tượng"><IconButton size="small" color="error" onClick={() => handleDeleteItem(selectedItemId)}><DeleteIcon /></IconButton></Tooltip>
                                        </Box>
                                    )}
                                </Paper>
                                <Box sx={{ flexGrow: 1, position: 'relative' }}>
                                    <CanvasWrapper
                                        ref={canvasWrapperRef}
                                        onMouseDown={handleCanvasWrapperMouseDown}
                                        onContextMenu={handleCanvasWrapperContextMenu}
                                        sx={{
                                            borderRadius: 2,
                                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                            display: 'block',
                                            overflowY: 'auto',
                                            scrollSnapType: 'y mandatory',
                                            padding: '20px 0',
                                        }}
                                    >
                                        {pages.length > 0 ? (
                                            <Box sx={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                gap: `40px`,
                                            }}>
                                                {pages.map((page) => (
                                                    <DroppablePage key={page.id} page={page} viewScale={viewScale}>
                                                        {renderPageContent(page, page.id === currentPageId)}
                                                    </DroppablePage>
                                                ))}
                                            </Box>
                                        ) : (
                                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                                <Paper sx={{ p: 4, textAlign: 'center', flexShrink: 0 }}>
                                                    <Typography variant="h5" color="text.secondary">Bắt đầu thiết kế</Typography>
                                                    <Typography color="text.secondary">Chọn hoặc tạo mẫu thiệp mới.</Typography>
                                                </Paper>
                                            </Box>
                                        )}
                                    </CanvasWrapper>
                                </Box>
                                <Paper elevation={0} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1, p: 1, flexShrink: 0, borderRadius: 2, mt: 2, border: `1px solid ${theme.palette.divider}` }}>
                                    <IconButton onClick={handleZoomOut} disabled={zoomLevel <= MIN_ZOOM || !currentPageId} size="small"><ZoomOutIcon /></IconButton>
                                    <Slider value={zoomLevel} onChange={handleZoomSliderChange} min={MIN_ZOOM} max={MAX_ZOOM} step={0.01} sx={{ width: 150, mx: 1 }} size="small" disabled={!currentPageId} />
                                    <Typography variant="body2" sx={{ minWidth: '50px', textAlign: 'center', color: 'text.secondary' }}>{currentPageId ? `${Math.round(zoomLevel * 100)}%` : '0%'}</Typography>
                                    <IconButton onClick={handleZoomIn} disabled={zoomLevel >= MAX_ZOOM || !currentPageId} size="small"><ZoomInIcon /></IconButton>
                                    <Tooltip title="Vừa với màn hình"><IconButton onClick={fitToScreen} disabled={!currentPageId} size="small"><CenterFocusStrongIcon /></IconButton></Tooltip>
                                </Paper>
                            </Box>
                            {showSettingsPanel && (
                                <motion.div
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, ease: "easeOut" }}
                                >
                                    <Box ref={settingsPanelRef} sx={{ px: 2, pb: 2 }}>
                                        <VisualSettingsEditor
                                            settings={eventSettings}
                                            onSelectField={handleSelectSettingField}
                                            selectedFieldKey={selectedSettingField}
                                            eventBlocks={eventBlocks}
                                            onSelectBlock={handleSelectBlock}
                                            onRemoveBlock={handleRemoveBlock}
                                            onReorderBlocks={handleReorderBlocks}
                                            onEditItem={handleEditItem}
                                            onUpdateSetting={handleUpdateSetting}
                                        />
                                    </Box>
                                </motion.div>
                            )}
                        </Box>
                    </Box>
                </Box>
                <DragOverlay>
                    {activeDragItem ? (
                        activeDragItem.type === 'image' ? (
                            <Card sx={{ width: 150, height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <CardMedia component="img" image={activeDragItem.url} sx={{ objectFit: 'contain', p: 1 }} />
                            </Card>
                        ) : (
                            <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <TextFieldsIcon />
                                <Typography>{activeDragItem.content}</Typography>
                            </Paper>
                        )
                    ) : null}
                </DragOverlay>
            </DndContext>
            <Dialog
                open={showExitConfirm}
                onClose={() => setShowExitConfirm(false)}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">
                    {"Bạn có thay đổi chưa lưu"}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        Bạn có muốn lưu lại các thay đổi của mình trước khi thoát không?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowExitConfirm(false)} color="primary">
                        Hủy
                    </Button>
                    <Button onClick={() => {
                        setShowExitConfirm(false);
                        navigate('/dashboard/templates');
                    }} color="error">
                        Thoát (Không lưu)
                    </Button>
                    <Button onClick={() => {
                        setShowExitConfirm(false);
                        executeSaveChanges(); // Hàm này đã bao gồm navigate sau khi lưu thành công
                    }} color="primary" variant="contained" autoFocus>
                        Lưu và Thoát
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};
const DesignContent = () => {
    return <WeddingInvitationEditor />;
};

export default DesignContent;