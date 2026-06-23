import React, { useState, useRef, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import { v4 as uuidv4 } from 'uuid';
import { X, Save, Image as ImageIcon, Trash2, PlusCircle, Layers, Type, User, Lock, Unlock, ArrowUp, ArrowDown, ChevronsUp, ChevronsDown } from 'lucide-react';
import { toast } from 'react-toastify';
import html2canvas from 'html2canvas'; // THÊM IMPORT NÀY

// TÁI SỬ DỤNG SERVICE CÓ SẴN CỦA BẠN
import AuthService from '../../services/auth.service';
import api from '../../services/api';

// ==========================================
// LOGIC TÍNH TOÁN KÍCH THƯỚC
// ==========================================
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
    "Khung tuỳ chỉnh (454x605)": { width: 454, height: 605 },
    "Thiệp Mời - 10 x 15 cm": fitToCanvas(10, 15),
    "Thiệp Mời - 12 x 17 cm": fitToCanvas(12, 17),
    "A4 Dọc - 21 x 29.7 cm": fitToCanvas(21, 29.7),
    "Thiệp Cưới Nhỏ - 8.5 x 12 cm": fitToCanvas(8.5, 12),
    "Thiệp Cưới Dài - 9.5 x 22 cm": fitToCanvas(9.5, 22),
    "Thiệp Cưới Vuông - 15 x 15 cm": fitToCanvas(15, 15),
    "Card Visit - 9 x 5.4 cm": fitToCanvas(9, 5.4),
};

const FONT_FAMILIES = ['Arial', 'Times New Roman', 'Verdana', 'Courier New', 'Garamond', 'Georgia', 'Helvetica', 'Tahoma'];

// ==========================================
// HÀM XỬ LÝ QUERY ẢNH ĐỂ TRÁNH LỖI CORS KHI HTML2CANVAS CHỤP
// ==========================================
const addOriginQueryParam = (url) => {
    if (!url || typeof url !== 'string' || !url.startsWith('http')) return url;
    try {
        const urlObject = new URL(url);
        const hostname = window.location.hostname;
        urlObject.searchParams.delete('site');
        if (hostname.includes('admin')) {
            urlObject.searchParams.set('site', 'admin');
        } else {
            urlObject.searchParams.set('site', 'www');
        }
        return urlObject.toString();
    } catch (e) {
        return url;
    }
};

const QuickCardBuilder = ({ onClose, onSuccess }) => {
    const [selectedSizeKey, setSelectedSizeKey] = useState("Khung tuỳ chỉnh (454x605)");
    const [canvasSize, setCanvasSize] = useState(STANDARD_SIZES["Khung tuỳ chỉnh (454x605)"]);
    const [customFonts, setCustomFonts] = useState([]);
    const [fontFilter, setFontFilter] = useState('All');
    // STATE LƯU TRỮ ẢNH ĐÃ TẢI LÊN TRONG PHIÊN LÀM VIỆC NÀY
    const [userImages, setUserImages] = useState([]);

    const [pages, setPages] = useState([{
        id: uuidv4(),
        name: "Trang 1",
        items: [],
        backgroundColor: "#FFFFFF",
        canvasWidth: canvasSize.width,
        canvasHeight: canvasSize.height
    }]);

    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [selectedItemId, setSelectedItemId] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [copiedItem, setCopiedItem] = useState(null);
    const fileInputRef = useRef(null);
    const currentPage = pages[currentPageIndex];
    const selectedItem = currentPage.items.find(i => i.id === selectedItemId);
    const stateRef = useRef({ pages, currentPageIndex, selectedItemId, copiedItem });
    useEffect(() => {
        stateRef.current = { pages, currentPageIndex, selectedItemId, copiedItem };
    }, [pages, currentPageIndex, selectedItemId, copiedItem]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            // QUAN TRỌNG: Nếu đang gõ chữ trong ô Input / Textarea thì bỏ qua phím tắt
            if (['INPUT', 'TEXTAREA'].includes(e.target.tagName) || e.target.isContentEditable) {
                return;
            }

            const { pages: currentPages, currentPageIndex: currentIndex, selectedItemId: currentSelectedId, copiedItem: currentCopiedItem } = stateRef.current;

            // 1. Phím DELETE hoặc BACKSPACE -> Xoá layer đang chọn
            if ((e.key === 'Delete' || e.key === 'Backspace') && currentSelectedId) {
                e.preventDefault();
                setPages(prevPages => {
                    const newPages = [...prevPages];
                    newPages[currentIndex].items = newPages[currentIndex].items.filter(i => i.id !== currentSelectedId);
                    return newPages;
                });
                setSelectedItemId(null);
            }

            // 2. Phím CTRL + C (hoặc CMD + C trên Mac) -> Copy layer
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c' && currentSelectedId) {
                const itemToCopy = currentPages[currentIndex].items.find(i => i.id === currentSelectedId);
                if (itemToCopy) {
                    setCopiedItem(itemToCopy);
                    toast.success("Đã copy layer");
                }
            }

            // 3. Phím CTRL + V (hoặc CMD + V trên Mac) -> Paste layer
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v' && currentCopiedItem) {
                setPages(prevPages => {
                    const newPages = [...prevPages];
                    const items = newPages[currentIndex].items;

                    let maxZIndex = 5;
                    if (items.length > 0) {
                        maxZIndex = Math.max(...items.map(i => i.zIndex || 5));
                    }

                    // Tạo item mới dựa trên item đã copy, dời tọa độ X/Y đi một chút (20px) để dễ nhìn
                    const newItem = {
                        ...currentCopiedItem,
                        id: uuidv4(), // Phải tạo ID mới để tránh xung đột
                        x: currentCopiedItem.x + 20,
                        y: currentCopiedItem.y + 20,
                        zIndex: maxZIndex + 1
                    };

                    newPages[currentIndex].items.push(newItem);

                    // Tự động focus vào item vừa được paste ra
                    setTimeout(() => setSelectedItemId(newItem.id), 0);

                    return newPages;
                });
            }

            if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowUp' && currentSelectedId) {
                e.preventDefault();
                setPages(prevPages => {
                    const newPages = [...prevPages];
                    const itemIdx = newPages[currentIndex].items.findIndex(i => i.id === currentSelectedId);
                    if (itemIdx > -1) {
                        newPages[currentIndex].items[itemIdx].zIndex = (newPages[currentIndex].items[itemIdx].zIndex || 5) + 1;
                    }
                    return newPages;
                });
            }

            // 5. Phím CTRL + ArrowDown -> Đưa layer xuống 1 lớp
            if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowDown' && currentSelectedId) {
                e.preventDefault();
                setPages(prevPages => {
                    const newPages = [...prevPages];
                    const itemIdx = newPages[currentIndex].items.findIndex(i => i.id === currentSelectedId);
                    if (itemIdx > -1) {
                        newPages[currentIndex].items[itemIdx].zIndex = Math.max(0, (newPages[currentIndex].items[itemIdx].zIndex || 5) - 1);
                    }
                    return newPages;
                });
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);
    // Lấy danh sách Font từ Server khi mở Modal
    useEffect(() => {
        const fetchFonts = async () => {
            try {
                const res = await api.get('/admin/fonts');
                setCustomFonts(res.data?.data || []);
            } catch (err) {
                console.error("Lỗi tải fonts:", err);
            }
        };
        fetchFonts();
    }, []);

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

    // Đảm bảo font đang được sử dụng bởi text hiện tại luôn hiển thị trong dropdown
    if (selectedItem?.type === 'text' && selectedItem.fontFamily && !availableFonts.includes(selectedItem.fontFamily)) {
        availableFonts = [selectedItem.fontFamily, ...availableFonts];
    }
    availableFonts = [...new Set(availableFonts)];
    // ==========================================
    // XỬ LÝ THAY ĐỔI KÍCH THƯỚC THIỆP
    // ==========================================
    const handleSizeChange = (e) => {
        const key = e.target.value;
        setSelectedSizeKey(key);
        const newSize = STANDARD_SIZES[key];
        setCanvasSize(newSize);

        const updatedPages = pages.map(p => ({
            ...p,
            canvasWidth: newSize.width,
            canvasHeight: newSize.height
        }));
        setPages(updatedPages);
    };

    // ==========================================
    // THÊM CHỮ (TEXT) VÀO THIỆP
    // ==========================================
    const handleAddText = (isGuest = false) => {
        const newItem = {
            id: uuidv4(),
            type: "text",
            content: isGuest ? "[Tên Khách Mời]" : "Nhập nội dung...",
            isGuestName: isGuest, // Thuộc tính đồng bộ với hệ thống DesignContent
            x: canvasSize.width / 4,
            y: canvasSize.height / 2,
            width: canvasSize.width / 2,
            height: 50,
            fontSize: 24,
            fontFamily: "Arial",
            color: isGuest ? "#2563eb" : "#333333", // Đặt màu xanh blue mặc định cho khách mời để dễ phân biệt
            textAlign: "center",
            fontWeight: "normal",
            fontStyle: "normal",
            textDecoration: "none",
            rotation: 0,
            opacity: 1,
            visible: true,
            locked: false,
            zIndex: 6
        };

        const newPages = [...pages];
        newPages[currentPageIndex].items.push(newItem);
        setPages(newPages);
        setSelectedItemId(newItem.id);
    };

    // ==========================================
    // XỬ LÝ UPLOAD NHIỀU ẢNH VÀ QUẢN LÝ KHO ẢNH
    // ==========================================
    // ==========================================
    // XỬ LÝ UPLOAD NHIỀU ẢNH VÀ QUẢN LÝ KHO ẢNH
    // ==========================================
    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setIsUploading(true);
        try {
            const uploadPromises = files.map(file => AuthService.uploadMedia(file));
            const responses = await Promise.all(uploadPromises);

            let currentMaxZ = 5;
            if (pages[currentPageIndex].items.length > 0) {
                currentMaxZ = Math.max(...pages[currentPageIndex].items.map(i => i.zIndex || 5));
            }

            const newItemsToLibrary = [];
            const loadCanvasPromises = [];

            responses.forEach((response, index) => {
                const r2Url = response.data?.url || response.url || response.data?.data?.url;
                if (r2Url) {
                    newItemsToLibrary.push({ id: uuidv4(), url: r2Url });

                    // Tạo promise tải ảnh vào bộ nhớ để lấy kích thước thật
                    loadCanvasPromises.push(new Promise((resolve) => {
                        const img = new Image();
                        img.onload = () => {
                            const ratio = img.width / img.height;

                            // Giới hạn chiều rộng tối đa bằng 40% bề ngang của thiệp
                            let newWidth = Math.min(img.width, canvasSize.width * 0.4);
                            let newHeight = newWidth / ratio;

                            // Nếu chiều cao vẫn quá lớn thì bóp theo chiều cao
                            if (newHeight > canvasSize.height * 0.4) {
                                newHeight = canvasSize.height * 0.4;
                                newWidth = newHeight * ratio;
                            }

                            const offset = index * 20;
                            resolve({
                                id: uuidv4(),
                                type: "image",
                                url: r2Url,
                                x: Math.max(0, (canvasSize.width / 2) - (newWidth / 2) + offset),
                                y: Math.max(0, (canvasSize.height / 2) - (newHeight / 2) + offset),
                                width: newWidth,
                                height: newHeight,
                                rotation: 0, opacity: 1, visible: true, locked: false,
                                zIndex: currentMaxZ + 1 + index,
                                imagePosition: { x: 0, y: 0, scale: 1 }
                            });
                        };
                        img.onerror = () => resolve(null);
                        img.src = r2Url;
                    }));
                }
            });

            // Chờ tất cả ảnh tính toán xong kích thước
            const newItemsToCanvas = (await Promise.all(loadCanvasPromises)).filter(item => item !== null);

            if (newItemsToCanvas.length > 0) {
                setUserImages(prev => [...newItemsToLibrary, ...prev]);
                const newPages = [...pages];
                newPages[currentPageIndex].items.push(...newItemsToCanvas);
                setPages(newPages);
                setSelectedItemId(newItemsToCanvas[newItemsToCanvas.length - 1].id);
                toast.success(`Đã thêm ${newItemsToCanvas.length} hình/icon!`);
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Lỗi khi tải file lên R2.");
        } finally {
            setIsUploading(false);
            if (e.target) e.target.value = null;
        }
    };

    const handleAddImageFromSidebar = (url) => {
        let currentMaxZ = 5;
        if (pages[currentPageIndex].items.length > 0) {
            currentMaxZ = Math.max(...pages[currentPageIndex].items.map(i => i.zIndex || 5));
        }

        const img = new Image();
        img.onload = () => {
            const ratio = img.width / img.height;
            let newWidth = Math.min(img.width, canvasSize.width * 0.4);
            let newHeight = newWidth / ratio;

            if (newHeight > canvasSize.height * 0.4) {
                newHeight = canvasSize.height * 0.4;
                newWidth = newHeight * ratio;
            }

            const newItem = {
                id: uuidv4(),
                type: "image",
                url: url,
                x: (canvasSize.width / 2) - (newWidth / 2),
                y: (canvasSize.height / 2) - (newHeight / 2),
                width: newWidth,
                height: newHeight,
                rotation: 0, opacity: 1, visible: true, locked: false,
                zIndex: currentMaxZ + 1,
                imagePosition: { x: 0, y: 0, scale: 1 }
            };

            const newPages = [...pages];
            newPages[currentPageIndex].items.push(newItem);
            setPages(newPages);
            setSelectedItemId(newItem.id);
        };
        img.onerror = () => toast.error("Lỗi khi tải hình ảnh!");
        img.src = url;
    };

    const handleDeleteUserImage = (e, id) => {
        e.stopPropagation();
        setUserImages(prev => prev.filter(img => img.id !== id));
    };

    const updateSelectedItem = (newProps) => {
        if (!selectedItemId) return;
        const newPages = [...pages];
        const itemIdx = newPages[currentPageIndex].items.findIndex(i => i.id === selectedItemId);
        if (itemIdx > -1) {
            newPages[currentPageIndex].items[itemIdx] = { ...newPages[currentPageIndex].items[itemIdx], ...newProps };
            setPages(newPages);
        }
    };

    // ==========================================
    // XỬ LÝ LƯU JSON VÀ TẠO THUMBNAIL (GIỐNG INVITATION DESIGN)
    // ==========================================
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

            const loadingPromises = [];
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
                el.style.opacity = `${item.opacity !== undefined ? item.opacity : 1}`;

                if (item.type === 'text') {
                    el.style.display = 'flex';
                    el.style.alignItems = 'center';
                    if (item.textAlign === 'center') el.style.justifyContent = 'center';
                    else if (item.textAlign === 'right') el.style.justifyContent = 'flex-end';
                    else el.style.justifyContent = 'flex-start';

                    el.style.padding = '10px 5px';
                    el.style.boxSizing = 'border-box';

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
                    el.textContent = item.isGuestName ? '[Tên Khách Mời]' : (item.content || '');
                } else if (item.type === 'image' && item.url) {
                    const img = document.createElement('img');
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

            const originalGetComputedStyle = window.getComputedStyle;
            const originalGetPropertyValue = CSSStyleDeclaration.prototype.getPropertyValue;

            try {
                window.getComputedStyle = function (el, pseudoElt) {
                    const style = originalGetComputedStyle(el, pseudoElt);
                    return new Proxy(style, {
                        get(target, prop) {
                            const value = target[prop];
                            if (typeof value === 'function') {
                                return value.bind(target);
                            }
                            if (typeof value === 'string' && (value.includes('oklch') || value.includes('oklab') || value.includes('color('))) {
                                return 'rgba(0, 0, 0, 0)';
                            }
                            return value;
                        }
                    });
                };

                CSSStyleDeclaration.prototype.getPropertyValue = function (prop) {
                    const value = originalGetPropertyValue.call(this, prop);
                    if (value && typeof value === 'string' && (value.includes('oklch') || value.includes('oklab') || value.includes('color('))) {
                        return 'rgba(0, 0, 0, 0)';
                    }
                    return value;
                };

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
                window.getComputedStyle = originalGetComputedStyle;
                CSSStyleDeclaration.prototype.getPropertyValue = originalGetPropertyValue;

                if (document.body.contains(container)) {
                    document.body.removeChild(container);
                }
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
                const heightCorrectionFactor = 1.025;
                const totalW = page1Canvas.width * (1 + overlapRatioX);
                const totalH = (page1Canvas.height * (1 + verticalShiftRatio)) * heightCorrectionFactor;

                const scale = Math.min(availableWidth / totalW, availableHeight / totalH);
                const scaledPageW = page1Canvas.width * scale;
                const scaledPageH = page1Canvas.height * scale;

                const totalRenderedW = scaledPageW * (1 + overlapRatioX);
                const totalRenderedH = scaledPageH + (scaledPageH * verticalShiftRatio);

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

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // SỬ DỤNG HÀM TẠO THUMBNAIL XỊN CÓ AWAIT ĐỂ LẤY FILE
            const thumbnailFile = await generateThumbnailFile();
            if (!thumbnailFile) {
                setIsSaving(false);
                return;
            }

            const title = "Mẫu thiệp tạo nhanh - " + new Date().toLocaleString('vi-VN');

            let category = 'Thiệp Mời', group = 'Sự kiện', type = 'Khác';
            try {
                const settingsRes = await AuthService.getSettings();
                const navTree = settingsRes?.data?.headerNav || settingsRes?.headerNav || [];
                if (navTree.length > 0) {
                    category = navTree[0].title || category;
                    group = navTree[0].children?.[0]?.title || group;
                    type = navTree[0].children?.[0]?.children?.[0]?.title || type;
                }
            } catch (e) {
                console.warn("Không lấy được taxonomy từ hệ thống, dùng mặc định.");
            }

            const shellFormData = new FormData();
            shellFormData.append('title', title);
            shellFormData.append('category', category);
            shellFormData.append('group', group);
            shellFormData.append('type', type);
            shellFormData.append('description', 'Mẫu được tạo tự động từ Quick Builder');
            shellFormData.append('isActive', true);
            shellFormData.append('templateData', JSON.stringify({ width: canvasSize.width, height: canvasSize.height, pages: [] }));
            shellFormData.append('image', thumbnailFile);

            const createRes = await AuthService.addTemplate(shellFormData);
            const newTemplateId = createRes.data?._id || createRes._id;

            if (!newTemplateId) {
                throw new Error("Tạo mẫu thất bại, không nhận được ID trả về.");
            }

            const finalJSON = {
                width: canvasSize.width,
                height: canvasSize.height,
                pages: pages,
                design: { themeColor: "#ffffff", fontFamily: "Arial" },
                settings: {
                    eventDate: "", groomName: "", brideName: "",
                    events: [], participants: [], loveStory: [],
                    blocksOrder: ["BANNER_CAROUSEL", "EVENT_DESCRIPTION", "COUPLE_INFO", "PARTICIPANTS", "EVENT_SCHEDULE", "COUNTDOWN", "LOVE_STORY", "GALLERY", "VIDEO", "CONTACT_INFO", "QR_CODES", "RSVP", "CUSTOM_HTML"]
                }
            };

            const updateFormData = new FormData();
            updateFormData.append('title', title);
            updateFormData.append('category', category);
            updateFormData.append('group', group);
            updateFormData.append('type', type);
            updateFormData.append('description', 'Mẫu được tạo tự động từ Quick Builder');
            updateFormData.append('isActive', true);
            updateFormData.append('templateData', JSON.stringify(finalJSON));
            updateFormData.append('loveGiftsButton', JSON.stringify({ isEnabled: false, text: '', link: '' }));
            updateFormData.append('generatedThumbnail', thumbnailFile);

            await api.put(`/admin/templates/${newTemplateId}`, updateFormData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast.success('Tạo mẫu thiệp thành công!');
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi lưu mẫu thiệp');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, display: 'flex', backgroundColor: 'rgba(17, 24, 39, 0.7)', backdropFilter: 'blur(4px)' }}>

            {/* Nhúng Font vào DOM để hiển thị ngay trong Editor */}
            <style>
                {customFonts.map(font => `
                    @font-face {
                        font-family: "${font.name}";
                        src: url('${font.url}');
                    }
                `).join('\n')}
            </style>

            <div style={{ width: '95%', height: '95%', margin: 'auto', backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid #e5e7eb' }}>

                {/* HEADER */}
                <div style={{ height: '64px', borderBottom: '1px solid #e5e7eb', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', zIndex: 10 }}>
                    <h2 style={{ fontWeight: 'bold', fontSize: '1.25rem', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                        <Layers color="#2563eb" /> Trình Tạo Mẫu Thiệp Nhanh
                    </h2>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button onClick={handleSave} disabled={isSaving} style={{ backgroundColor: '#2563eb', color: 'white', padding: '8px 20px', borderRadius: '8px', fontWeight: '600', border: 'none', cursor: isSaving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: isSaving ? 0.5 : 1 }}>
                            <Save size={18} /> {isSaving ? 'Đang tạo & lưu...' : 'Lưu Template'}
                        </button>
                        <button onClick={onClose} style={{ backgroundColor: '#f3f4f6', color: '#374151', padding: '8px 20px', borderRadius: '8px', fontWeight: '600', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <X size={18} /> Đóng
                        </button>
                    </div>
                </div>

                {/* WORKSPACE */}
                <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

                    {/* SIDEBAR TRÁI: Size, Nút Công Cụ, Lịch Sử Ảnh, Các Trang */}
                    <div style={{ width: '300px', backgroundColor: '#f9fafb', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', height: '100%' }}>

                        {/* =========================================
                            PHẦN 1: CÔNG CỤ TĨNH (Cố định ở trên) 
                        ========================================= */}
                        <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb', flexShrink: 0 }}>
                            {/* Kích thước Canvas */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#6b7280', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>Kích thước Canvas</label>
                                <select value={selectedSizeKey} onChange={handleSizeChange} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: '#fff', outline: 'none' }}>
                                    {Object.keys(STANDARD_SIZES).map(key => (
                                        <option key={key} value={key}>{key}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Nút thao tác */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                                <button
                                    onClick={() => fileInputRef.current?.click()} disabled={isUploading}
                                    style={{ backgroundColor: '#fff', border: '1px solid #cbd5e1', padding: '12px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', borderRadius: '8px', cursor: 'pointer', color: '#1e293b' }}
                                >
                                    <ImageIcon size={20} color="#3b82f6" />
                                    <span style={{ fontSize: '12px', fontWeight: 'bold', textAlign: 'center' }}>Tải Ảnh/Icon<br />(Chọn nhiều)</span>
                                </button>
                                <input type="file" multiple ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} accept="image/*" />

                                <button
                                    onClick={() => handleAddText(false)}
                                    style={{ backgroundColor: '#fff', border: '1px solid #cbd5e1', padding: '12px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', borderRadius: '8px', cursor: 'pointer', color: '#1e293b' }}
                                >
                                    <Type size={20} color="#10b981" />
                                    <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Thêm Chữ</span>
                                </button>
                            </div>
                            <button
                                onClick={() => handleAddText(true)}
                                style={{ width: '100%', backgroundColor: '#fff', border: '1px dashed #2563eb', padding: '10px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderRadius: '8px', cursor: 'pointer', color: '#2563eb', fontWeight: 'bold', marginBottom: '16px', transition: 'all 0.2s' }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f5ff'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
                            >
                                <User size={18} />
                                <span style={{ fontSize: '12px' }}>Thêm Lớp Tên Khách Mời</span>
                            </button>
                            {/* Background Color - Đưa lên vùng tĩnh để dễ thao tác */}
                            <div>
                                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#6b7280', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>Màu Nền Trang Hiện Tại</label>
                                <input
                                    type="color"
                                    value={currentPage.backgroundColor || '#FFFFFF'}
                                    onChange={(e) => {
                                        const newPages = [...pages];
                                        newPages[currentPageIndex].backgroundColor = e.target.value;
                                        setPages(newPages);
                                    }}
                                    style={{ width: '100%', height: '36px', padding: '2px', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer' }}
                                />
                            </div>
                        </div>

                        {/* =========================================
                            PHẦN 2: CÁC TRANG THIỆP (Tự động co giãn & có cuộn) 
                        ========================================= */}
                        {/* Lưu ý: flex: 1 và minHeight: 0 là trick quan trọng để scroll view hoạt động trong Flex column */}
                        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', borderBottom: userImages.length > 0 ? '1px solid #e5e7eb' : 'none' }}>
                            {/* Header của phần Trang */}
                            <div style={{ padding: '16px 16px 8px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                                <h3 style={{ fontSize: '12px', fontWeight: '800', color: '#6b7280', textTransform: 'uppercase', margin: 0 }}>Các Trang Thiệp</h3>
                                <button onClick={() => setPages([...pages, { id: uuidv4(), name: `Trang ${pages.length + 1}`, items: [], backgroundColor: "#FFFFFF", canvasWidth: canvasSize.width, canvasHeight: canvasSize.height }])} style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} title="Thêm trang">
                                    <PlusCircle size={20} />
                                </button>
                            </div>

                            {/* Vùng Scroll View cho List Trang */}
                            <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {pages.map((page, index) => (
                                    <div
                                        key={page.id}
                                        onClick={() => { setCurrentPageIndex(index); setSelectedItemId(null); }}
                                        style={{
                                            padding: '12px', cursor: 'pointer', borderRadius: '8px', border: '2px solid', transition: 'all 0.2s', fontWeight: '500', fontSize: '14px',
                                            backgroundColor: index === currentPageIndex ? '#fff' : 'transparent',
                                            borderColor: index === currentPageIndex ? '#3b82f6' : 'transparent',
                                            color: index === currentPageIndex ? '#1d4ed8' : '#4b5563',
                                        }}
                                    >
                                        {page.name}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* =========================================
                            PHẦN 3: KHO ẢNH ĐÃ TẢI LÊN (Bố trí ở dưới, có cuộn độc lập) 
                        ========================================= */}
                        {userImages.length > 0 && (
                            <div style={{ height: '35%', minHeight: '220px', display: 'flex', flexDirection: 'column', flexShrink: 0, backgroundColor: '#fff' }}>
                                {/* Header của Kho ảnh */}
                                <div style={{ padding: '12px 16px 8px 16px', flexShrink: 0, borderTop: '1px solid #f3f4f6' }}>
                                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#6b7280', display: 'block', textTransform: 'uppercase' }}>Ảnh đã tải lên ({userImages.length})</label>
                                </div>

                                {/* Vùng Scroll View cho Grid Ảnh */}
                                <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px 16px' }}>
                                    {/* Thêm alignContent: 'start' để ảnh không bị dãn dọc khi chỉ có 1-2 ảnh */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', alignContent: 'start' }}>
                                        {userImages.map(img => (
                                            <div
                                                key={img.id}
                                                style={{ position: 'relative', cursor: 'pointer', border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden', aspectRatio: '1/1', backgroundColor: '#f9fafb' }}
                                                onClick={() => handleAddImageFromSidebar(img.url)}
                                                title="Bấm để thêm vào thiệp"
                                            >
                                                <img src={img.url} alt="Uploaded" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                                <div
                                                    style={{ position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '50%', padding: '2px', display: 'flex', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
                                                    onClick={(e) => handleDeleteUserImage(e, img.id)}
                                                    title="Xóa khỏi kho ảnh"
                                                >
                                                    <Trash2 size={12} color="#dc2626" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* CANVAS TRUNG TÂM */}
                    <div
                        style={{ flex: 1, overflow: 'auto', backgroundColor: '#e5e7eb', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px' }}
                        onClick={() => setSelectedItemId(null)}
                    >
                        <div
                            style={{ width: canvasSize.width, height: canvasSize.height, backgroundColor: currentPage.backgroundColor, position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {currentPage.items.map((item, itemIdx) => (
                                <Rnd
                                    key={item.id}
                                    size={{ width: item.width, height: item.height }}
                                    position={{ x: item.x, y: item.y }}
                                    lockAspectRatio={item.type === 'image' && item.keepRatio !== false}
                                    onDragStart={() => setSelectedItemId(item.id)}
                                    onDragStop={(e, d) => {
                                        const newPages = [...pages];
                                        newPages[currentPageIndex].items[itemIdx].x = d.x;
                                        newPages[currentPageIndex].items[itemIdx].y = d.y;
                                        setPages(newPages);
                                    }}
                                    onResizeStart={() => setSelectedItemId(item.id)}
                                    onResizeStop={(e, dir, ref, delta, position) => {
                                        const newPages = [...pages];
                                        newPages[currentPageIndex].items[itemIdx].width = parseInt(ref.style.width);
                                        newPages[currentPageIndex].items[itemIdx].height = parseInt(ref.style.height);
                                        newPages[currentPageIndex].items[itemIdx].x = position.x;
                                        newPages[currentPageIndex].items[itemIdx].y = position.y;
                                        setPages(newPages);
                                    }}
                                    style={{
                                        zIndex: item.zIndex,
                                        ...(selectedItemId === item.id ? { outline: '2px dashed #3b82f6', cursor: 'move' } : {})
                                    }}
                                    onClick={(e) => { e.stopPropagation(); setSelectedItemId(item.id); }}
                                >
                                    {item.type === 'image' && (
                                        <img src={item.url} alt="layer" style={{ width: '100%', height: '100%', objectFit: 'fill', pointerEvents: 'none', display: 'block' }} />
                                    )}
                                    {item.type === 'text' && (
                                        <div style={{
                                            width: '100%', height: '100%', display: 'flex',
                                            alignItems: 'center', justifyContent: item.textAlign === 'center' ? 'center' : item.textAlign === 'right' ? 'flex-end' : 'flex-start',
                                            fontSize: `${item.fontSize}px`, fontFamily: item.fontFamily, color: item.color,
                                            fontWeight: item.fontWeight, fontStyle: item.fontStyle, textDecoration: item.textDecoration,
                                            textAlign: item.textAlign, wordBreak: 'break-word', userSelect: 'none'
                                        }}>
                                            {item.content}
                                        </div>
                                    )}
                                </Rnd>
                            ))}
                        </div>
                    </div>

                    {/* SIDEBAR PHẢI: Properties Panel */}
                    {/* SIDEBAR PHẢI: Properties Panel */}
                    {selectedItem ? (
                        <div style={{ width: '320px', backgroundColor: '#fff', borderLeft: '1px solid #e5e7eb', padding: '20px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1f2937', marginBottom: '20px', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px', marginTop: 0 }}>
                                Thuộc tính {selectedItem.type === 'text' ? 'Văn bản' : 'Hình ảnh / Icon'}
                            </h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {/* ĐẶC QUYỀN CỦA TEXT LAYER */}
                                {selectedItem.type === 'text' && (
                                    <>
                                        <div>
                                            <label style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '4px', display: 'block' }}>Nội dung chữ</label>
                                            <textarea
                                                rows={3}
                                                disabled={selectedItem.isGuestName}
                                                style={{
                                                    width: '100%', border: '1px solid #d1d5db', borderRadius: '4px', padding: '8px', fontSize: '14px', boxSizing: 'border-box', outline: 'none',
                                                    backgroundColor: selectedItem.isGuestName ? '#f3f4f6' : '#fff', // Làm mờ nếu là Khách mời
                                                    cursor: selectedItem.isGuestName ? 'not-allowed' : 'text'
                                                }}
                                                value={selectedItem.content}
                                                onChange={e => updateSelectedItem({ content: e.target.value })}
                                            />
                                        </div>

                                        {/* BỘ LỌC VÀ DROPDOWN FONT CHỮ */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <div>
                                                <label style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '6px', display: 'block' }}>Lọc Font chữ:</label>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                    {[
                                                        { value: 'All', label: 'Tất cả' },
                                                        { value: 'Wedding', label: 'Cưới' },
                                                        { value: 'Vietnamese', label: 'Tiếng Việt' },
                                                        { value: 'Uppercase', label: 'Viết hoa' },
                                                        { value: 'General', label: 'Khác' }
                                                    ].map(filter => (
                                                        <button
                                                            key={filter.value}
                                                            onClick={() => setFontFilter(filter.value)}
                                                            style={{
                                                                padding: '4px 10px',
                                                                fontSize: '11px',
                                                                borderRadius: '16px',
                                                                border: fontFilter === filter.value ? '1px solid #3b82f6' : '1px solid #cbd5e1',
                                                                backgroundColor: fontFilter === filter.value ? '#3b82f6' : '#f8fafc',
                                                                color: fontFilter === filter.value ? '#ffffff' : '#334155',
                                                                cursor: 'pointer',
                                                                fontWeight: fontFilter === filter.value ? '600' : '400',
                                                                transition: 'all 0.2s ease',
                                                                outline: 'none'
                                                            }}
                                                        >
                                                            {filter.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <label style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '4px', display: 'block' }}>Font chữ</label>
                                                <select
                                                    style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '4px', padding: '8px', fontSize: '14px', outline: 'none', fontFamily: selectedItem.fontFamily }}
                                                    value={selectedItem.fontFamily}
                                                    onChange={e => updateSelectedItem({ fontFamily: e.target.value })}
                                                >
                                                    {availableFonts.length > 0 ? (
                                                        availableFonts.map(font => (
                                                            <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>
                                                        ))
                                                    ) : (
                                                        <option disabled>Không có font phù hợp</option>
                                                    )}
                                                </select>
                                            </div>
                                        </div>

                                        {/* CỠ CHỮ VÀ MÀU SẮC */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                            <div>
                                                <label style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '4px', display: 'block' }}>Cỡ chữ (px)</label>
                                                <input type="number" style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '4px', padding: '8px', fontSize: '14px', boxSizing: 'border-box' }} value={selectedItem.fontSize} onChange={e => updateSelectedItem({ fontSize: parseInt(e.target.value) || 12 })} />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '4px', display: 'block' }}>Màu sắc</label>
                                                <input type="color" style={{ width: '100%', height: '35px', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer', padding: 0 }} value={selectedItem.color} onChange={e => updateSelectedItem({ color: e.target.value })} />
                                            </div>
                                        </div>

                                        <div>
                                            <label style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '4px', display: 'block' }}>Căn lề</label>
                                            <select style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '4px', padding: '8px', fontSize: '14px', outline: 'none' }} value={selectedItem.textAlign} onChange={e => updateSelectedItem({ textAlign: e.target.value })}>
                                                <option value="left">Trái</option>
                                                <option value="center">Giữa</option>
                                                <option value="right">Phải</option>
                                            </select>
                                        </div>

                                        {/* BỘ CHUYỂN ĐỔI TÍNH NĂNG TÊN KHÁCH MỜI */}
                                        <div style={{ marginTop: '4px' }}>
                                            <label style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '6px', display: 'block' }}>Cấu hình hệ thống</label>
                                            <button
                                                type="button"
                                                onClick={() => updateSelectedItem({
                                                    isGuestName: !selectedItem.isGuestName,
                                                    content: !selectedItem.isGuestName ? "[Tên Khách Mời]" : "Nhập nội dung..."
                                                })}
                                                style={{
                                                    width: '100%',
                                                    padding: '10px',
                                                    borderRadius: '6px',
                                                    border: '1px solid #2563eb',
                                                    backgroundColor: selectedItem.isGuestName ? '#2563eb' : 'transparent',
                                                    color: selectedItem.isGuestName ? '#ffffff' : '#2563eb',
                                                    fontWeight: 'bold',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    fontSize: '13px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '6px'
                                                }}
                                            >
                                                <User size={16} />
                                                {selectedItem.isGuestName ? '✓ Đã đặt làm Tên Khách Mời' : 'Đặt làm lớp Tên Khách Mời'}
                                            </button>
                                        </div>
                                    </>
                                )}
                                {/* ĐẶC QUYỀN CỦA IMAGE LAYER */}
                                {selectedItem.type === 'image' && (
                                    <>
                                        <div>
                                            <label style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '6px', display: 'block' }}>Tùy chọn tỷ lệ ảnh</label>
                                            <button
                                                type="button"
                                                onClick={() => updateSelectedItem({ keepRatio: selectedItem.keepRatio === false ? true : false })}
                                                style={{
                                                    width: '100%',
                                                    padding: '10px',
                                                    borderRadius: '6px',
                                                    border: selectedItem.keepRatio !== false ? '1px solid #10b981' : '1px dashed #64748b',
                                                    backgroundColor: selectedItem.keepRatio !== false ? '#10b981' : '#f8fafc',
                                                    color: selectedItem.keepRatio !== false ? '#ffffff' : '#475569',
                                                    fontWeight: 'bold',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    fontSize: '13px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '6px'
                                                }}
                                            >
                                                {selectedItem.keepRatio !== false ? <Lock size={16} /> : <Unlock size={16} />}
                                                {selectedItem.keepRatio !== false ? 'Đang Khóa Tỷ Lệ (Chống méo)' : 'Đã Mở Khóa (Cho phép bóp méo)'}
                                            </button>
                                            <p style={{ fontSize: '11px', color: '#64748b', marginTop: '8px', marginBottom: 0, lineHeight: 1.4 }}>
                                                * Bấm <strong>Mở Khóa</strong> để có thể kéo dãn các cạnh (trên/dưới/trái/phải) và bóp méo hình ảnh tự do theo ý muốn.
                                            </p>
                                        </div>
                                    </>
                                )}
                                <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '8px 0' }} />

                                {/* THUỘC TÍNH CHUNG (X, Y, W, H) */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div>
                                        <label style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '4px', display: 'block' }}>Tọa độ X</label>
                                        <input type="number" readOnly style={{ width: '100%', backgroundColor: '#f9fafb', border: '1px solid #d1d5db', borderRadius: '4px', padding: '8px', fontSize: '14px', boxSizing: 'border-box' }} value={Math.round(selectedItem.x)} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '4px', display: 'block' }}>Tọa độ Y</label>
                                        <input type="number" readOnly style={{ width: '100%', backgroundColor: '#f9fafb', border: '1px solid #d1d5db', borderRadius: '4px', padding: '8px', fontSize: '14px', boxSizing: 'border-box' }} value={Math.round(selectedItem.y)} />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div>
                                        <label style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '4px', display: 'block' }}>Rộng (W)</label>
                                        <input type="number" readOnly style={{ width: '100%', backgroundColor: '#f9fafb', border: '1px solid #d1d5db', borderRadius: '4px', padding: '8px', fontSize: '14px', boxSizing: 'border-box' }} value={Math.round(selectedItem.width)} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '4px', display: 'block' }}>Cao (H)</label>
                                        <input type="number" readOnly style={{ width: '100%', backgroundColor: '#f9fafb', border: '1px solid #d1d5db', borderRadius: '4px', padding: '8px', fontSize: '14px', boxSizing: 'border-box' }} value={Math.round(selectedItem.height)} />
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        const newPages = [...pages];
                                        newPages[currentPageIndex].items = newPages[currentPageIndex].items.filter(i => i.id !== selectedItemId);
                                        setPages(newPages);
                                        setSelectedItemId(null);
                                    }}
                                    style={{ marginTop: '16px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer', transition: 'background-color 0.2s' }}
                                >
                                    <Trash2 size={18} /> Xóa Layer Này
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div style={{ width: '320px', backgroundColor: '#f9fafb', borderLeft: '1px solid #e5e7eb', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: '#9ca3af' }}>
                            <Layers size={48} style={{ marginBottom: '12px', opacity: 0.2 }} />
                            <p style={{ fontSize: '14px', margin: 0 }}>Bấm vào một lớp (ảnh/văn bản) trên thiệp để xem và điều chỉnh.</p>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default QuickCardBuilder;