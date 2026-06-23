import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Search, PlusCircle, Edit, Trash2, GripVertical, X } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import templateBlockService from '../../services/templateBlock.service';
import AuthService from '../../services/auth.service'; // Lấy template gốc
import './AdminDashboard.css'; // Dùng chung CSS hiện tại

// Component item để kéo thả template bên TRONG Khối
const SortableSelectedTemplate = ({ template, onRemove }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: template._id });
    const style = { transform: CSS.Transform.toString(transform), transition };

    return (
        <div ref={setNodeRef} style={style} className="selected-template-item flex items-center justify-between p-2 mb-2 bg-gray-50 border rounded">
            <div className="flex items-center gap-3">
                <div {...attributes} {...listeners} className="cursor-grab"><GripVertical size={16} /></div>
                <img src={template.imgSrc || 'placeholder.jpg'} alt="thumb" className="w-10 h-10 object-cover rounded" />
                <span className="font-medium text-sm">{template.title}</span>
            </div>
            <button type="button" onClick={() => onRemove(template._id)} className="text-red-500 hover:text-red-700"><X size={16}/></button>
        </div>
    );
};

const TemplateBlockManagement = () => {
    const [blocks, setBlocks] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // State cho Modal
    const [editingBlock, setEditingBlock] = useState(null);
    const [formData, setFormData] = useState({ title: '', slug: '', isActive: true });
    
    // State quản lý việc Pick Template
    const [allTemplates, setAllTemplates] = useState([]);
    const [searchTemplate, setSearchTemplate] = useState('');
    const [selectedTemplates, setSelectedTemplates] = useState([]); // Mảng chứa các object template đã chọn

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
            setAllTemplates(res.data || []);
        } catch (error) { console.error("Lỗi tải template picker"); }
    };

    const openModal = (block = null) => {
        if (block) {
            setEditingBlock(block);
            setFormData({ title: block.title, slug: block.slug, isActive: block.isActive });
            // Gắn danh sách template đã chọn (cần backend populate dữ liệu template)
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
                templates: selectedTemplates.map(t => t._id) // Chỉ gửi array ID lên backend
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

    // Logic chọn / bỏ chọn template
    const handleAddTemplate = (template) => {
        if (!selectedTemplates.find(t => t._id === template._id)) {
            setSelectedTemplates([...selectedTemplates, template]);
        }
    };
    const handleRemoveTemplate = (id) => {
        setSelectedTemplates(selectedTemplates.filter(t => t._id !== id));
    };

    // Logic kéo thả để sắp xếp template trong khối
    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = selectedTemplates.findIndex(t => t._id === active.id);
            const newIndex = selectedTemplates.findIndex(t => t._id === over.id);
            setSelectedTemplates(arrayMove(selectedTemplates, oldIndex, newIndex));
        }
    };

    const filteredAvailableTemplates = allTemplates.filter(t => 
        t.title.toLowerCase().includes(searchTemplate.toLowerCase()) &&
        !selectedTemplates.find(selected => selected._id === t._id) // Ẩn những cái đã chọn
    );

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2>Quản lý Khối (Collections) Hiển thị</h2>
                <button onClick={() => openModal()} className="btn btn-primary"><PlusCircle size={18} /> Thêm Khối mới</button>
            </div>

            <table className="table">
                <thead><tr><th>Tên Khối</th><th>Đường dẫn (Slug)</th><th>Số Template</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
                <tbody>
                    {blocks.map(block => (
                        <tr key={block._id}>
                            <td><strong>{block.title}</strong></td>
                            <td>/{block.slug}</td>
                            <td>{block.templates?.length || 0}</td>
                            <td>{block.isActive ? 'Đang bật' : 'Đã tắt'}</td>
                            <td className="table__actions">
                                <button onClick={() => openModal(block)} className="edit-btn"><Edit size={20}/></button>
                                <button className="delete-btn"><Trash2 size={20}/></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* MODAL TẠO/SỬA KHỐI & CHỌN TEMPLATE */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content modal-content--xlarge">
                        <div className="modal-header"><h3>{editingBlock ? 'Sửa Khối' : 'Tạo Khối mới'}</h3><button onClick={() => setIsModalOpen(false)}>×</button></div>
                        <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                            
                            {/* Cột trái: Thông tin & Tìm kiếm để thêm */}
                            <div>
                                <div className="form-group">
                                    <label>Tên Khối (VD: Top Thiệp Cưới)</label>
                                    <input type="text" className="form-control" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
                                </div>
                                <div className="form-group">
                                    <label>Đường dẫn (Slug)</label>
                                    <input type="text" className="form-control" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} placeholder="top-thiep-cuoi" required />
                                </div>

                                <hr className="my-4"/>
                                <label className="font-bold mb-2 block">Tìm & Chọn Template để đưa vào Khối:</label>
                                <div className="search-box mb-3">
                                    <Search size={18} className="search-box__icon" />
                                    <input type="text" className="form-control" placeholder="Tìm theo tên template..." value={searchTemplate} onChange={(e) => setSearchTemplate(e.target.value)} />
                                </div>
                                
                                <div className="border rounded h-64 overflow-y-auto p-2">
                                    {filteredAvailableTemplates.slice(0, 20).map(t => (
                                        <div key={t._id} className="flex justify-between items-center p-2 hover:bg-gray-100 cursor-pointer border-b" onClick={() => handleAddTemplate(t)}>
                                            <div className="flex items-center gap-2">
                                                <img src={t.imgSrc} alt="" className="w-8 h-8 rounded" />
                                                <span className="text-sm">{t.title}</span>
                                            </div>
                                            <PlusCircle size={16} className="text-green-600"/>
                                        </div>
                                    ))}
                                    {filteredAvailableTemplates.length === 0 && <p className="text-center text-gray-400 mt-4">Không tìm thấy hoặc đã chọn hết.</p>}
                                </div>
                            </div>

                            {/* Cột phải: Danh sách Template đã chọn (Kéo thả được) */}
                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="font-bold block text-green-700">Template trong Khối ({selectedTemplates.length})</label>
                                </div>
                                <p className="text-xs text-gray-500 mb-4">Kéo thả để sắp xếp thứ tự hiển thị trên website.</p>
                                
                                <div className="border rounded h-96 overflow-y-auto p-2 bg-gray-50">
                                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                        <SortableContext items={selectedTemplates.map(t => t._id)} strategy={verticalListSortingStrategy}>
                                            {selectedTemplates.map((template) => (
                                                <SortableSelectedTemplate key={template._id} template={template} onRemove={handleRemoveTemplate} />
                                            ))}
                                        </SortableContext>
                                    </DndContext>
                                    {selectedTemplates.length === 0 && <p className="text-center text-gray-400 mt-10">Chưa có template nào được chọn.</p>}
                                </div>
                            </div>

                        </div>
                        <div className="modal-footer">
                            <button onClick={() => setIsModalOpen(false)} className="btn btn-secondary">Hủy</button>
                            <button onClick={handleSubmit} className="btn btn-primary">Lưu Khối</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TemplateBlockManagement;