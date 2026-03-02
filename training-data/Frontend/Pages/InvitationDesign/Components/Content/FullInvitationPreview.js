import React, { useRef, useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { Box, Typography, useMediaQuery, IconButton } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import HTMLFlipBook from 'react-pageflip';
import { ChevronLeft, ChevronRight, MapPin, Heart, Phone } from 'lucide-react';

// Import CSS
import './FullInvitationPreview.css';
import './EventSettingsPreview.css'; 
import './customeditor.css';

// ===============================================================================================
// HELPER COMPONENTS (Tái tạo & đơn giản hóa từ DesignContent cho mục đích Preview)
// ===============================================================================================
const SectionHeader = ({ title, subtitle }) => (
    <Box className="modern-section-header" sx={{ mb: 4 }}>
        {title && <Typography variant="h2" className="section-title">{title}</Typography>}
        {subtitle && <Typography variant="body1" className="section-subtitle">{subtitle}</Typography>}
    </Box>
);

// Component Canvas giữ nguyên
const PageCanvas = React.memo(React.forwardRef(({ page, originalWidth }, ref) => {
    const canvasRef = useRef(null);
    const wrapText = (context, text, maxWidth) => {
        if (!text) return [];
        const paragraphs = text.split('\n');
        let allLines = [];
        paragraphs.forEach(paragraph => {
            if (paragraph === '') { allLines.push(''); return; }
            let words = paragraph.split(' ');
            let currentLine = words[0] || '';
            for (let i = 1; i < words.length; i++) {
                const word = words[i];
                const width = context.measureText(currentLine + " " + word).width;
                if (width < maxWidth) { currentLine += " " + word; }
                else { allLines.push(currentLine); currentLine = word; }
            }
            allLines.push(currentLine);
        });
        return allLines;
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !page || !originalWidth) return;

        const { canvasWidth, canvasHeight, items, backgroundImage, backgroundColor } = page;
        const dpr = window.devicePixelRatio || 1;

        canvas.width = canvasWidth * dpr;
        canvas.height = canvasHeight * dpr;
        canvas.style.width = `${canvasWidth}px`;
        canvas.style.height = `${canvasHeight}px`;
        ctx.scale(dpr, dpr);

        const scale = originalWidth > 0 ? canvasWidth / originalWidth : 1;

        const renderAll = async () => {
            ctx.fillStyle = backgroundColor || '#FFFFFF';
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);

            if (backgroundImage) {
                const bgImg = new Image();
                if (!backgroundImage.startsWith('blob:')) {
                    bgImg.crossOrigin = "anonymous";
                }
                try {
                    await new Promise((resolve, reject) => {
                        bgImg.onload = resolve;
                        bgImg.onerror = reject;
                        bgImg.src = backgroundImage;
                    });
                    ctx.drawImage(bgImg, 0, 0, canvasWidth, canvasHeight);
                } catch (e) { console.error("Lỗi tải ảnh nền:", e); }
            }

            const sortedItems = [...(items || [])].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
            for (const item of sortedItems) {
                if (item.visible === false) continue;
                ctx.save();
                ctx.globalAlpha = item.opacity || 1;

                const scaledX = item.x * scale;
                const scaledY = item.y * scale;
                const scaledWidth = item.width * scale;
                const scaledHeight = item.height * scale;

                ctx.translate(scaledX + scaledWidth / 2, scaledY + scaledHeight / 2);
                ctx.rotate((item.rotation || 0) * Math.PI / 180);

                if (item.type === 'text' && item.content) {
                    const scaledFontSize = (item.fontSize || 16) * scale;
                    ctx.font = `${item.fontStyle || 'normal'} ${item.fontWeight || 'normal'} ${scaledFontSize}px "${item.fontFamily || 'Arial'}"`;
                    ctx.fillStyle = item.color || '#000000';
                    ctx.textAlign = item.textAlign || 'center';
                    ctx.textBaseline = 'middle';

                    const lines = wrapText(ctx, item.content, scaledWidth);
                    const lineHeight = scaledFontSize * 1.3;
                    const totalHeight = lines.length * lineHeight;
                    const startY = - (totalHeight / 2) + (lineHeight / 2);

                    lines.forEach((line, index) => {
                        ctx.fillText(line, 0, startY + (index * lineHeight));
                    });
                } else if (item.type === 'image' && item.url) {
                    const itemImg = new Image();
                    if (!item.url.startsWith('blob:')) {
                       itemImg.crossOrigin = "anonymous";
                    }
                    try {
                        await new Promise((resolve, reject) => {
                            itemImg.onload = resolve; itemImg.onerror = reject;
                            itemImg.src = item.url;
                        });
                        const filterString = `brightness(${item.brightness ?? 1}) contrast(${item.contrast ?? 1}) grayscale(${item.grayscale ?? 0})`;
                        ctx.filter = filterString;
                        ctx.drawImage(itemImg, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
                    } catch (e) { console.error("Lỗi tải ảnh item:", e); }
                }
                ctx.restore();
            }
        };
        renderAll();
    }, [page, originalWidth]);

    return (
        <div className="page" ref={ref}>
            <div className="page-content">
                <canvas ref={canvasRef} className="modern-canvas" />
            </div>
        </div>
    );
}));

// ===============================================================================================
// PREVIEW COMPONENTS FOR EVENT SETTINGS (Non-editable versions)
// ===============================================================================================

const BannerCarouselPreview = ({ settings }) => {
    const images = settings.bannerImages || [];
    const getImageUrl = (image) => {
        if (!image) return '';
        if (typeof image.url === 'string' && image.url) return image.url;
        if (image.file instanceof File) return URL.createObjectURL(image.file);
        if (typeof image === 'string') return image;
        return '';
    };
    const firstImage = images.length > 0 ? images[0] : null;
    const finalImageUrl = getImageUrl(firstImage);
    if (!finalImageUrl) return null;
    return (
        <Box className="modern-banner" sx={{ height: '100vh', position: 'relative' }}>
            <Box sx={{ width: '100%', height: '100%', backgroundImage: `url(${finalImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                <Box className="modern-slide-overlay" />
            </Box>
        </Box>
    );
};

const EventDescriptionPreview = ({ settings }) => {
    if (!settings.eventDescription) return null;
    return (
        <Box className="section-container event-description">
            <Box className="content-wrapper-narrow">
                <Typography className="event-description-text" sx={settings.eventDescriptionStyle}>{settings.eventDescription}</Typography>
            </Box>
        </Box>
    );
};

const CoupleInfoPreview = ({ settings }) => (
    <Box className="section-container">
        <SectionHeader title={settings.coupleTitle || 'Cô Dâu & Chú Rể'} subtitle={settings.coupleSubtitle} />
        <Box className="modern-couple-container">
            <Box className="modern-couple-card">
                <img src={settings.groomImageUrl instanceof File ? URL.createObjectURL(settings.groomImageUrl) : (settings.groomImageUrl || 'https://placehold.co/180x180/EBF1FB/B0C7EE?text=Ảnh+CR')} alt={settings.groomName} className="modern-couple-image" />
                <Typography className="couple-name" sx={settings.groomNameStyle}>{settings.groomName || 'Tên chú rể'}</Typography>
                <Typography className="couple-info" sx={settings.groomInfoStyle}>{settings.groomInfo || 'Thông tin chú rể'}</Typography>
            </Box>
            <Box className="modern-separator"><Box className="heart-wrapper"><Heart sx={{ color: 'var(--color-primary)' }} /></Box></Box>
            <Box className="modern-couple-card">
                <img src={settings.brideImageUrl instanceof File ? URL.createObjectURL(settings.brideImageUrl) : (settings.brideImageUrl || 'https://placehold.co/180x180/EBF1FB/B0C7EE?text=Ảnh+CD')} alt={settings.brideName} className="modern-couple-image" />
                <Typography className="couple-name" sx={settings.brideNameStyle}>{settings.brideName || 'Tên cô dâu'}</Typography>
                <Typography className="couple-info" sx={settings.brideInfoStyle}>{settings.brideInfo || 'Thông tin cô dâu'}</Typography>
            </Box>
        </Box>
    </Box>
);

const ParticipantsPreview = ({ settings }) => {
    if (!settings.participants || settings.participants.length === 0) return null;
    return (
        <Box className="section-container">
            <SectionHeader title={settings.participantsTitle || "Thành Viên Tham Gia"} />
            <Box className="participants-grid">
                {settings.participants.map((p) => (
                    <Box key={p.id} className="participant-card">
                        <img src={p.imageUrl instanceof File ? URL.createObjectURL(p.imageUrl) : (p.imageUrl || 'https://placehold.co/100x100/EEE/31343C?text=Ảnh')} alt={p.title} className="participant-image" />
                        <Box className="participant-info">
                            <Typography variant="h3" className="participant-title">{p.title}</Typography>
                            <Typography className="participant-content">{p.content}</Typography>
                        </Box>
                    </Box>
                ))}
            </Box>
        </Box>
    );
};


const EventSchedulePreview = ({ settings }) => {
    if (!settings.events || settings.events.length === 0) return null;
    return (
        <Box className="section-container">
            <SectionHeader title={settings.eventsTitle || "Sự Kiện Cưới"} />
            <Box className="event-schedule-grid">
                {settings.events.map((event) => (
                    <Box key={event.id} className="event-card">
                        <Box className="event-card-image-wrapper">
                            <img src={event.imageUrl instanceof File ? URL.createObjectURL(event.imageUrl) : (event.imageUrl || 'https://placehold.co/400x200/EEE/31343C?text=Event')} alt={event.title} />
                        </Box>
                        <Box className="event-card-content">
                            <Typography variant="h3" className="event-card-title">{event.title}</Typography>
                            <Typography>{event.time} | {event.date}</Typography>
                            <Typography>{event.address}</Typography>
                            <Box className="event-card-actions">
                                {event.mapUrl && (
                                    <a href={event.mapUrl} target="_blank" rel="noopener noreferrer" className="event-btn map-btn">
                                        <MapPin size={14} /> Xem bản đồ
                                    </a>
                                )}
                            </Box>
                        </Box>
                    </Box>
                ))}
            </Box>
        </Box>
    );
};

const LoveStoryPreview = ({ settings }) => {
    if (!settings.loveStory || settings.loveStory.length === 0) return null;
    return (
        <Box className="section-container">
            <SectionHeader title={settings.loveStoryTitle || "Chuyện Tình Yêu"} />
            <Box className="love-story-timeline">
                {settings.loveStory.map((story, index) => (
                    <Box key={story.id} className={`story-item ${index % 2 === 0 ? 'left' : 'right'}`}>
                        <Box className="story-content">
                            <Typography variant="h3" className="story-title">{story.title}</Typography>
                            <Typography className="story-date">{story.date}</Typography>
                            <Typography className="story-description">{story.description}</Typography>
                        </Box>
                    </Box>
                ))}
            </Box>
        </Box>
    );
};

const CountdownPreview = ({ settings }) => {
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
        if (!timeLeft) return;
        const timerId = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
        return () => clearInterval(timerId);
    }, [timeLeft, calculateTimeLeft]);
    if (!settings.eventDate) return null;
    return (
        <Box className="section-container">
            <SectionHeader title={settings.countdownTitle || "Sự kiện trọng đại sẽ diễn ra trong"} />
            {!timeLeft ? (
                <Box className="countdown-ended"><span>Sự kiện đã diễn ra!</span></Box>
            ) : (
                <Box className="modern-countdown">
                    {Object.entries(timeLeft).map(([interval, value]) => (
                        <Box key={interval} className="modern-countdown-item">
                            <Box className="countdown-card">
                                <span className="countdown-value">{String(value).padStart(2, '0')}</span>
                                <span className="countdown-label">{interval}</span>
                            </Box>
                        </Box>
                    ))}
                </Box>
            )}
        </Box>
    );
};

const GalleryPreview = ({ settings }) => {
    if (!settings.galleryImages || settings.galleryImages.length === 0) return null;

    // *** BẮT ĐẦU SỬA LỖI ***
    // Helper function để lấy URL ảnh một cách an toàn và linh hoạt
    const getImageUrl = (image) => {
        if (!image) return '';
        // 1. Ảnh là đối tượng File (mới tải lên trong editor)
        if (image instanceof File) {
            return URL.createObjectURL(image);
        }
        // 2. Ảnh là một chuỗi URL (đã lưu từ server hoặc là blob URL từ localStorage)
        if (typeof image === 'string') {
            return image;
        }
        // 3. Ảnh là một đối tượng chứa thuộc tính 'url' (có thể là từ dữ liệu cũ)
        if (typeof image === 'object' && image !== null && typeof image.url === 'string') {
            return image.url;
        }
        // Trả về chuỗi rỗng nếu không xác định được nguồn ảnh
        return '';
    };
    // *** KẾT THÚC SỬA LỖI ***

    return (
        <Box className="section-container">
            <SectionHeader title={settings.galleryTitle || "Bộ Sưu Tập Ảnh"} />
            <Box className="modern-gallery">
                {settings.galleryImages.map((img, index) => {
                    // *** SỬA LỖI: Sử dụng helper function mới ***
                    const imageUrl = getImageUrl(img);
                    // Chỉ render thẻ img nếu có URL hợp lệ
                    if (!imageUrl) return null;
                    return <img key={index} src={imageUrl} alt={`Gallery ${index}`} />;
                })}
            </Box>
        </Box>
    );
};


const VideoPreview = ({ settings }) => {
    if (!settings.videoUrl) return null;
    const getEmbedUrl = (url) => {
        try {
            const urlObj = new URL(url);
            if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
                const videoId = urlObj.searchParams.get('v') || urlObj.pathname.split('/').pop();
                return `https://www.youtube.com/embed/${videoId}`;
            }
        } catch (e) { console.error("Invalid video URL", e); }
        return null;
    };
    const embedUrl = getEmbedUrl(settings.videoUrl);
    if (!embedUrl) return null;
    return (
        <Box className="section-container">
            <SectionHeader title={settings.videoTitle || "Video Sự Kiện"} />
            <Box className="video-wrapper">
                 <Box className="modern-video-container">
                    <iframe src={embedUrl} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title="Event Video"></iframe>
                </Box>
            </Box>
        </Box>
    );
};


const ContactInfoPreview = ({ settings }) => {
     if (!settings.contactGroom && !settings.contactBride) return null;
    return (
        <Box className="section-container">
            <SectionHeader title={settings.contactTitle || "Thông Tin Liên Hệ"} />
            <Box className="modern-contact-section">
                {settings.contactGroom && (
                     <Box className="modern-contact-card">
                        <Box className="contact-icon"><Phone /></Box>
                        <Box className="contact-info">
                            <h4>Nhà trai</h4>
                            <span>{settings.groomName || 'Chú rể'}</span>
                            <p>{settings.contactGroom}</p>
                        </Box>
                    </Box>
                )}
                 {settings.contactBride && (
                     <Box className="modern-contact-card">
                        <Box className="contact-icon"><Phone /></Box>
                        <Box className="contact-info">
                            <h4>Nhà gái</h4>
                            <span>{settings.brideName || 'Cô dâu'}</span>
                            <p>{settings.contactBride}</p>
                        </Box>
                    </Box>
                )}
            </Box>
        </Box>
    );
};

const QrCodesPreview = ({ settings }) => {
    if (!settings.qrCodes || settings.qrCodes.length === 0) return null;
    return (
        <Box className="section-container">
            <SectionHeader title={settings.qrCodeTitle || "Mã QR Mừng Cưới"} />
            <Box className="modern-qr-container">
                {settings.qrCodes.map((qr, index) => (
                     <Box key={qr.id || index} className="modern-qr-item">
                        <img src={qr.url instanceof File ? URL.createObjectURL(qr.url) : qr.url} alt={qr.title} />
                        <Typography variant="caption" className="qr-title-text" sx={{ mt: 1 }}>{qr.title}</Typography>
                    </Box>
                ))}
            </Box>
        </Box>
    );
};



const RsvpPreview = ({ settings }) => {
    if (!settings.rsvp) return null;
    return (
        <Box className="section-container" sx={{ textAlign: 'center' }}>
            <SectionHeader title={settings.rsvpTitle || 'Xác Nhận Tham Dự'} subtitle={settings.rsvpSubtitle} />
            <div className="rsvp-trigger">
                <button className="modern-btn-primary">Xác Nhận Tham Dự</button>
            </div>
        </Box>
    );
};



const CustomHtmlPreview = ({ settings }) => {
    if (!settings.customHtmlContent) return null;
    return (
        <Box className="section-container">
            <SectionHeader title={settings.customHtmlTitle || "Nội dung tùy chỉnh"} />
            <Box
                className="tiptap-content1" 
                dangerouslySetInnerHTML={{ __html: settings.customHtmlContent }}
            />
        </Box>
    );
};

// ===============================================================================================
// MAIN PREVIEW COMPONENT
// ===============================================================================================

const FullInvitationPreview = ({ pages = [], invitationSettings = {} }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const flipBook = useRef(null);
    const containerRef = useRef(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    
    // *** BẮT ĐẦU SỬA LỖI ***
    // Đảm bảo invitationSettings là một object trước khi destructuring
    const { blocksOrder = [] } = invitationSettings || {};
    // *** KẾT THÚC SỬA LỖI ***

    const originalWidth = pages?.[0]?.canvasWidth || 500;
    const originalHeight = pages?.[0]?.canvasHeight || 700;
    
    useLayoutEffect(() => {
        const updateDimensions = () => {
            const parent = containerRef.current;
            if (!parent || !originalWidth || !originalHeight) return;
            const vh = window.innerHeight;
            const parentWidth = parent.clientWidth;
            const padding = isMobile ? 20 : 40;
            const availableWidth = parentWidth - padding;
            const availableHeight = vh * (isMobile ? 0.5 : 0.6); 
            const effectiveOriginalWidth = isMobile ? originalWidth : originalWidth * 2;
            const ratio = effectiveOriginalWidth / originalHeight;
            let newHeight = availableHeight;
            let newWidth = newHeight * ratio;
            if (newWidth > availableWidth) {
                newWidth = availableWidth;
                newHeight = newWidth / ratio;
            }
            const finalPageWidth = isMobile ? newWidth : newWidth / 2;
            const finalPageHeight = newHeight;
            setDimensions({ width: Math.floor(finalPageWidth), height: Math.floor(finalPageHeight) });
        };
        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, [originalWidth, originalHeight, isMobile]);

    const onPage = useCallback((e) => setCurrentPage(e.data), []);
    const handleNext = useCallback(() => flipBook.current?.pageFlip().flipNext(), []);
    const handlePrev = useCallback(() => flipBook.current?.pageFlip().flipPrev(), []);

    const pageIndicatorText = isMobile 
        ? `${currentPage + 1} / ${pages.length}` 
        : `${currentPage === 0 || currentPage >= pages.length - 1 ? currentPage + 1 : `${currentPage}-${currentPage + 1}`} / ${pages.length}`;

    const blockComponentMap = {
        BANNER_CAROUSEL: <BannerCarouselPreview settings={invitationSettings} />,
        EVENT_DESCRIPTION: <EventDescriptionPreview settings={invitationSettings} />,
        COUPLE_INFO: <CoupleInfoPreview settings={invitationSettings} />,
        PARTICIPANTS: <ParticipantsPreview settings={invitationSettings} />,
        EVENT_SCHEDULE: <EventSchedulePreview settings={invitationSettings} />,
        LOVE_STORY: <LoveStoryPreview settings={invitationSettings} />,
        GALLERY: <GalleryPreview settings={invitationSettings} />,
        VIDEO: <VideoPreview settings={invitationSettings} />,
        CONTACT_INFO: <ContactInfoPreview settings={invitationSettings} />,
        QR_CODES: <QrCodesPreview settings={invitationSettings} />,
        COUNTDOWN: <CountdownPreview settings={invitationSettings} />,
        RSVP: <RsvpPreview settings={invitationSettings} />,
        CUSTOM_HTML: <CustomHtmlPreview settings={invitationSettings} />, 
    };
    
    // Hàm kiểm tra xem một khối có dữ liệu để hiển thị hay không
    const hasData = (blockType) => {
        const settings = invitationSettings;
        if (!settings) return false;
        switch(blockType) {
            case 'EVENT_DESCRIPTION': return !!settings.eventDescription;
            case 'COUPLE_INFO': return settings.invitationType === 'Thiệp cưới';
            case 'PARTICIPANTS': return Array.isArray(settings.participants) && settings.participants.length > 0;
            case 'EVENT_SCHEDULE': return Array.isArray(settings.events) && settings.events.length > 0;
            case 'COUNTDOWN': return !!settings.eventDate;
            case 'LOVE_STORY': return Array.isArray(settings.loveStory) && settings.loveStory.length > 0;
            case 'GALLERY': return Array.isArray(settings.galleryImages) && settings.galleryImages.length > 0;
            case 'VIDEO': return !!settings.videoUrl;
            case 'CONTACT_INFO': return settings.invitationType === 'Thiệp cưới' && (settings.contactGroom || settings.contactBride);
            case 'QR_CODES': return Array.isArray(settings.qrCodes) && settings.qrCodes.length > 0;
            case 'RSVP': return !!settings.rsvpTitle;
            case 'CUSTOM_HTML': return !!settings.customHtmlContent;
            case 'BANNER_CAROUSEL': return Array.isArray(settings.bannerImages) && settings.bannerImages.length > 0;
            default: return false;
        }
    };
    
    // Ưu tiên sử dụng `blocksOrder` từ props. Nếu không có, dùng mảng mặc định.
    const orderedBlocks = blocksOrder || [];
    // *** KẾT THÚC SỬA LỖI ***

    return (
        <Box className="modern-invitation-container" ref={containerRef}>
            
            {/* *** SỬA LỖI: Chỉ hiển thị banner nếu nó có trong danh sách được sắp xếp và có dữ liệu *** */}
            {orderedBlocks.includes('BANNER_CAROUSEL') && hasData('BANNER_CAROUSEL') && blockComponentMap['BANNER_CAROUSEL']}

            <Box className="modern-canvas-wrapper fullscreen">
                {dimensions.width > 0 && (
                     <div className={`flipbook-container ${isMobile ? 'single-page-view' : 'double-page-view'}`} style={{ width: isMobile ? dimensions.width : dimensions.width * 2, height: dimensions.height }}>
                        <HTMLFlipBook width={dimensions.width} height={dimensions.height} size="fixed" minWidth={dimensions.width} maxWidth={dimensions.width} minHeight={dimensions.height} maxHeight={dimensions.height} maxShadowOpacity={0.5} showCover={!isMobile} mobileScrollSupport={true} onFlip={onPage} ref={flipBook} className="invitation-flipbook">
                            {pages.map((page, index) => (
                                <PageCanvas key={page.id || index} page={{...page, canvasWidth: dimensions.width, canvasHeight: dimensions.height }} originalWidth={originalWidth} />
                            ))}
                        </HTMLFlipBook>
                    </div>
                )}
                <div className="navigation-controls">
                    <IconButton className="modern-nav-btn prev" onClick={handlePrev} disabled={currentPage === 0}><ChevronLeft /></IconButton>
                    <Typography className="page-indicator">Trang {pageIndicatorText}</Typography>
                    <IconButton className="modern-nav-btn next" onClick={handleNext} disabled={currentPage >= pages.length - 1}><ChevronRight /></IconButton>
                </div>
            </Box>

            <Box className="modern-content visible">
                <Box className="modern-container">
                    {/* *** SỬA LỖI: Lặp qua các khối đã được sắp xếp và lọc, bỏ qua banner vì đã hiển thị ở trên *** */}
                    {orderedBlocks.map(blockType => (
                        blockType !== 'BANNER_CAROUSEL' && hasData(blockType) && (
                            <React.Fragment key={blockType}>
                                {blockComponentMap[blockType]}
                            </React.Fragment>
                        )
                    ))}
                </Box>
            </Box>

        </Box>
    );
};


export default FullInvitationPreview;