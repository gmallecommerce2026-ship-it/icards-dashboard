import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { Save, GripVertical, ListOrdered, Plus, Trash2, Eye, EyeOff, ArrowUp, ArrowDown } from 'lucide-react';
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- HÀM TẠO SLUG TỰ ĐỘNG ---
const generateSlug = (str) => {
    if (!str) return '';
    return str.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, 'd')
        .replace(/([^0-9a-z-\s])/g, '')
        .replace(/(\s+)/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
};

// --- COMPONENT: KÉO THẢ ITEM BÊN TRONG SECTION ---
const SortableItemRow = ({ item, index, onRemove }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.key });
    
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.9 : 1,
        backgroundColor: isDragging ? '#f8f9fa' : 'inherit',
        boxShadow: isDragging ? '0 5px 15px rgba(0,0,0,0.05)' : 'none',
        position: isDragging ? 'relative' : 'static',
        zIndex: isDragging ? 999 : 'auto',
    };

    return (
        <tr ref={setNodeRef} style={style} className={`draggable-table-row ${isDragging ? 'is-dragging' : ''}`}>
            <td style={{ width: '50px', textAlign: 'center' }}>
                <div className="drag-handle-wrapper" {...attributes} {...listeners} style={{ cursor: 'grab' }}>
                    <GripVertical size={18} color="#98a2b3" />
                </div>
            </td>
            <td style={{ width: '60px', textAlign: 'center' }}>{index + 1}</td>
            <td style={{ width: '70px' }}>
                <img 
                    src={item.imgSrc || 'https://placehold.co/100'} 
                    alt="thumb" 
                    style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: '6px', border: '1px solid #eaecf0' }} 
                />
            </td>
            <td>
                <div style={{ fontWeight: 600, color: '#101828', fontSize: '0.95rem' }}>{item.title}</div>
                <div style={{ color: '#667085', fontSize: '0.8rem' }}>{item.key}</div>
            </td>
            <td style={{ width: '80px', textAlign: 'center' }}>
                <button className="btn btn-sm" onClick={() => onRemove(item.key)} style={{ color: '#d92d20', padding: '4px' }}>
                    <Trash2 size={16} />
                </button>
            </td>
        </tr>
    );
};

const OccasionOrderManager = () => {
    const [sections, setSections] = useState([]);
    const [availableTemplates, setAvailableTemplates] = useState([]);
    const [activeSectionId, setActiveSectionId] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    
    // Form thêm
    const [newSectionTitle, setNewSectionTitle] = useState('');
    const [selectedTemplateToAdd, setSelectedTemplateToAdd] = useState('');

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    useEffect(() => {
        fetchDataAndSettings();
    }, []);

    const fetchDataAndSettings = async () => {
        try {
            const [templatesRes, settingsRes] = await Promise.all([
                api.get('/invitation-templates?limit=1000'), 
                api.get('/admin/settings') 
            ]);

            const allTemplates = templatesRes.data.data || [];
            const currentSettings = settingsRes.data.data || {};
            
            // 1. Tạo danh sách template source (lọc trùng)
            const uniqueMap = new Map();
            allTemplates.forEach(t => {
                const category = t.category || '';
                const group = t.group || '';
                const type = t.type || '';
                const key = `${category.trim()}-${group.trim()}-${type.trim()}`;
                
                if (category && !uniqueMap.has(key)) {
                    uniqueMap.set(key, { key, title: `${category} ${type}`.trim(), imgSrc: t.imgSrc });
                }
            });
            const templatesArray = Array.from(uniqueMap.values());
            setAvailableTemplates(templatesArray);

            // 2. Map data section từ DB
            let dbSections = currentSettings.occasionSections || [];
            
            // Fallback: Nếu backend chưa có block mới, tự migrate list cũ thành block mặc định
            if (dbSections.length === 0 && currentSettings.occasionOrder?.length > 0) {
                dbSections = [{
                    id: `sec_${Date.now()}`,
                    title: "Khối nổi bật (Mặc định)",
                    slug: "khoi-noi-bat",
                    isVisible: true,
                    order: 0,
                    items: currentSettings.occasionOrder.map(k => ({ key: k }))
                }];
            }

            // Đưa data chi tiết (title, imgSrc) vào items của section dựa trên availableTemplates
            const mappedSections = dbSections.sort((a, b) => a.order - b.order).map(sec => ({
                ...sec,
                // Fix lỗi fallback thiếu mảng items
                items: (sec.items || []).map(item => {
                    const found = uniqueMap.get(item.key);
                    return found ? { ...item, ...found } : item;
                }).filter(item => item.title) // Bỏ qua item không tồn tại
            }));

            setSections(mappedSections);
            if (mappedSections.length > 0) setActiveSectionId(mappedSections[0].id);

        } catch (error) {
            toast.error("Lỗi khi tải dữ liệu dịp lễ!");
        }
    };

    // --- XỬ LÝ SECTION ---
    const handleAddSection = () => {
        if (!newSectionTitle.trim()) return toast.warning("Vui lòng nhập tên khối!");
        const newSec = {
            id: `sec_${Date.now()}`,
            title: newSectionTitle,
            slug: generateSlug(newSectionTitle), // ĐÃ FIX LỖI THIẾU SLUG TẠI ĐÂY
            isVisible: true,
            order: sections.length,
            items: []
        };
        setSections([...sections, newSec]);
        setNewSectionTitle('');
        setActiveSectionId(newSec.id);
    };

    const handleUpdateSection = (id, field, value) => {
        setSections(sections.map(s => {
            if (s.id === id) {
                const updated = { ...s, [field]: value };
                // Nếu sửa title, tự update lại slug cho chuẩn
                if (field === 'title') updated.slug = generateSlug(value);
                return updated;
            }
            return s;
        }));
    };

    const handleRemoveSection = (id) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa khối này?")) {
            const updated = sections.filter(s => s.id !== id);
            setSections(updated);
            if (activeSectionId === id) setActiveSectionId(updated[0]?.id || null);
        }
    };

    const handleMoveSection = (index, direction) => {
        const newSections = [...sections];
        if (direction === 'up' && index > 0) {
            [newSections[index - 1], newSections[index]] = [newSections[index], newSections[index - 1]];
        } else if (direction === 'down' && index < newSections.length - 1) {
            [newSections[index + 1], newSections[index]] = [newSections[index], newSections[index + 1]];
        }
        // Cập nhật lại order field
        const reordered = newSections.map((s, i) => ({ ...s, order: i }));
        setSections(reordered);
    };

    // --- XỬ LÝ ITEM TRONG SECTION ĐANG ACTIVE ---
    const activeSection = sections.find(s => s.id === activeSectionId);

    const handleAddItemToSection = () => {
        if (!selectedTemplateToAdd || !activeSection) return;
        
        const isExist = activeSection.items.some(i => i.key === selectedTemplateToAdd);
        if (isExist) return toast.warning("Mẫu này đã tồn tại trong khối!");

        const templateData = availableTemplates.find(t => t.key === selectedTemplateToAdd);
        
        const updatedSections = sections.map(s => {
            if (s.id === activeSectionId) {
                return { ...s, items: [...s.items, { key: templateData.key, title: templateData.title, imgSrc: templateData.imgSrc }] };
            }
            return s;
        });
        setSections(updatedSections);
        setSelectedTemplateToAdd('');
    };

    const handleRemoveItem = (itemKey) => {
        setSections(sections.map(s => {
            if (s.id === activeSectionId) {
                return { ...s, items: s.items.filter(i => i.key !== itemKey) };
            }
            return s;
        }));
    };

    const handleDragItemEnd = (event) => {
        const { active, over } = event;
        if (over && active.id !== over.id && activeSection) {
            const oldIndex = activeSection.items.findIndex(item => item.key === active.id);
            const newIndex = activeSection.items.findIndex(item => item.key === over.id);
            
            const updatedItems = arrayMove(activeSection.items, oldIndex, newIndex);
            setSections(sections.map(s => s.id === activeSectionId ? { ...s, items: updatedItems } : s));
        }
    };

    // --- LƯU LÊN SERVER ---
    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Chuẩn hóa dữ liệu trước khi lưu theo đúng Backend Schema
            const payload = sections.map(sec => ({
                id: sec.id,
                title: sec.title,
                slug: sec.slug || generateSlug(sec.title), // ĐẢM BẢO LUÔN CÓ SLUG
                isVisible: sec.isVisible,
                order: sec.order,
                items: sec.items.map(item => ({ key: item.key })) // ĐẢM BẢO CÓ ITEMS
            }));

            const formData = new FormData();
            formData.append('settings', JSON.stringify({ occasionSections: payload }));
            
            await api.put('/admin/settings', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            toast.success('Đã lưu cấu trúc hiển thị trang chủ thành công!');
        } catch (error) {
            console.error("Lỗi lưu settings:", error);
            toast.error('Có lỗi xảy ra khi lưu thiết lập.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="card settings-card" style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                    <h3 className="card__title" style={{ marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ListOrdered size={24} /> Quản lý "Khối Lan Toả Niềm Vui"
                    </h3>
                    <p className="settings-description" style={{ margin: 0 }}>
                        Phân loại, gom nhóm và tùy chỉnh thứ tự các template hiển thị trên trang chủ.
                    </p>
                </div>
                <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
                    <Save size={18} style={{ marginRight: '8px' }} /> 
                    {isSaving ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
            </div>

            <div style={{ display: 'flex', gap: '2rem', marginTop: '2rem' }}>
                
                {/* --- CỘT TRÁI: DANH SÁCH SECTION --- */}
                <div style={{ flex: '0 0 35%', borderRight: '1px solid #eaecf0', paddingRight: '1rem' }}>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
                        <input 
                            type="text" 
                            className="form-control" 
                            placeholder="Tên khối mới (vd: Thiệp Cưới)" 
                            value={newSectionTitle}
                            onChange={(e) => setNewSectionTitle(e.target.value)}
                        />
                        <button className="btn btn-secondary" onClick={handleAddSection}>
                            <Plus size={18} />
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {sections.map((sec, idx) => (
                            <div 
                                key={sec.id} 
                                onClick={() => setActiveSectionId(sec.id)}
                                style={{
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: `1px solid ${activeSectionId === sec.id ? '#0a58ca' : '#eaecf0'}`,
                                    backgroundColor: activeSectionId === sec.id ? '#f8fbff' : '#fff',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '8px'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <input 
                                        type="text" 
                                        value={sec.title}
                                        onChange={(e) => handleUpdateSection(sec.id, 'title', e.target.value)}
                                        style={{ border: 'none', background: 'transparent', fontWeight: 600, width: '100%', outline: 'none' }}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); handleUpdateSection(sec.id, 'isVisible', !sec.isVisible); }}>
                                            {sec.isVisible ? <Eye size={16} color="#0a58ca"/> : <EyeOff size={16} color="#98a2b3"/>}
                                        </button>
                                        <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); handleRemoveSection(sec.id); }}>
                                            <Trash2 size={16} color="#d92d20"/>
                                        </button>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#667085' }}>
                                    <span>{(sec.items || []).length} templates (slug: {sec.slug})</span>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <button className="btn btn-sm" disabled={idx === 0} onClick={(e) => { e.stopPropagation(); handleMoveSection(idx, 'up'); }}><ArrowUp size={14}/></button>
                                        <button className="btn btn-sm" disabled={idx === sections.length - 1} onClick={(e) => { e.stopPropagation(); handleMoveSection(idx, 'down'); }}><ArrowDown size={14}/></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {sections.length === 0 && <div style={{ color: '#667085', fontSize: '0.9rem', textAlign: 'center', padding: '1rem' }}>Chưa có khối nào. Hãy tạo mới.</div>}
                    </div>
                </div>

                {/* --- CỘT PHẢI: QUẢN LÝ ITEM CỦA SECTION --- */}
                <div style={{ flex: '1' }}>
                    {activeSection ? (
                        <>
                            <h4 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: '#101828' }}>
                                Cấu hình khối: <span style={{ color: '#0a58ca' }}>{activeSection.title}</span>
                            </h4>
                            
                            {/* Dropdown thêm Template vào khối */}
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '1rem' }}>
                                <select 
                                    className="form-select" 
                                    value={selectedTemplateToAdd}
                                    onChange={(e) => setSelectedTemplateToAdd(e.target.value)}
                                >
                                    <option value="">-- Chọn Chủ Đề Thiệp để thêm vào khối này --</option>
                                    {availableTemplates.map(t => (
                                        <option key={t.key} value={t.key}>{t.title} ({t.key})</option>
                                    ))}
                                </select>
                                <button className="btn btn-secondary" onClick={handleAddItemToSection} disabled={!selectedTemplateToAdd}>
                                    Thêm vào khối
                                </button>
                            </div>

                            {/* Bảng kéo thả Item */}
                            <div className="table-container" style={{ border: '1px solid #eaecf0', borderRadius: '8px' }}>
                                {(activeSection.items || []).length > 0 ? (
                                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragItemEnd}>
                                        <table className="table" style={{ margin: 0 }}>
                                            <thead style={{ backgroundColor: '#fcfcfd' }}>
                                                <tr>
                                                    <th style={{ width: '50px', textAlign: 'center' }}>Kéo</th>
                                                    <th style={{ width: '60px', textAlign: 'center' }}>Thứ tự</th>
                                                    <th style={{ width: '70px' }}>Hình ảnh</th>
                                                    <th>Thông tin hiển thị</th>
                                                    <th style={{ width: '80px', textAlign: 'center' }}>Xóa</th>
                                                </tr>
                                            </thead>
                                            <SortableContext items={(activeSection.items || []).map(i => i.key)} strategy={verticalListSortingStrategy}>
                                                <tbody>
                                                    {(activeSection.items || []).map((item, index) => (
                                                        <SortableItemRow 
                                                            key={item.key} 
                                                            item={item} 
                                                            index={index} 
                                                            onRemove={handleRemoveItem} 
                                                        />
                                                    ))}
                                                </tbody>
                                            </SortableContext>
                                        </table>
                                    </DndContext>
                                ) : (
                                    <div style={{ padding: '2rem', textAlign: 'center', color: '#667085' }}>
                                        Khối này chưa có thiệp nào. Vui lòng chọn ở danh sách bên trên và bấm "Thêm vào khối".
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div style={{ padding: '3rem', textAlign: 'center', color: '#98a2b3', border: '1px dashed #eaecf0', borderRadius: '8px' }}>
                            <p style={{ margin: 0 }}>Vui lòng chọn một Khối ở bên trái để bắt đầu cấu hình.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default OccasionOrderManager;