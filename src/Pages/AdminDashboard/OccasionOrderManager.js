import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { Paper, Typography, Button, Table, TableBody, TableCell, TableHead, TableRow, Box, TableContainer } from '@mui/material';
import { DragIndicator, Save } from '@mui/icons-material';
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Component cho từng dòng có thể kéo thả
const SortableOccasionRow = ({ item }) => {
    // id truyền vào bắt buộc là string (ở đây là item.key)
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.key });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.9 : 1,
        backgroundColor: isDragging ? '#f5f9ff' : 'inherit',
        boxShadow: isDragging ? '0 5px 15px rgba(0,0,0,0.1)' : 'none',
        zIndex: isDragging ? 1000 : 1,
    };

    return (
        <TableRow ref={setNodeRef} style={style} {...attributes}>
            <TableCell sx={{ cursor: 'grab', width: '50px' }} {...listeners}>
                <DragIndicator color="action" />
            </TableCell>
            <TableCell>
                <img src={item.imgSrc || 'https://placehold.co/100'} alt="thumb" style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: '8px' }} />
            </TableCell>
            <TableCell sx={{ fontWeight: 500 }}>{item.title}</TableCell>
            <TableCell sx={{ color: 'text.secondary', fontSize: '13px' }}>{item.key}</TableCell>
        </TableRow>
    );
};

const OccasionOrderManager = () => {
    const [occasions, setOccasions] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    
    // Sensor quy định kéo xa 5px mới bắt đầu tính (tránh click nhầm)
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    useEffect(() => {
        fetchDataAndSettings();
    }, []);

    const fetchDataAndSettings = async () => {
        try {
            // Lấy cả templates (giống client) và settings hiện tại
            const [templatesRes, settingsRes] = await Promise.all([
                api.get('/invitation-templates?limit=50'),
                api.get('/admin/settings') // API lấy cấu hình chung của bạn
            ]);

            const allTemplates = templatesRes.data.data || [];
            const currentSettings = settingsRes.data.data || {};
            const savedOrder = currentSettings.occasionOrder || [];

            // 1. Dùng thuật toán gom nhóm giống hệt Client
            const uniqueMap = new Map();
            allTemplates.forEach(t => {
                const category = t.category || '';
                const group = t.group || '';
                const type = t.type || '';
                const key = `${category.trim()}-${group.trim()}-${type.trim()}`;
                
                if (category && !uniqueMap.has(key)) {
                    uniqueMap.set(key, {
                        key, // Thêm key để dnd-kit dùng làm ID
                        title: `${category} ${type}`.trim(),
                        imgSrc: t.imgSrc
                    });
                }
            });

            let processed = Array.from(uniqueMap.values());

            // 2. Sắp xếp lại danh sách trên Admin dựa theo settings cũ đang có
            if (savedOrder.length > 0) {
                processed.sort((a, b) => {
                    let idxA = savedOrder.indexOf(a.key);
                    let idxB = savedOrder.indexOf(b.key);
                    if (idxA === -1) idxA = 9999;
                    if (idxB === -1) idxB = 9999;
                    return idxA - idxB;
                });
            }

            setOccasions(processed);
        } catch (error) {
            toast.error("Lỗi khi tải dữ liệu dịp lễ!");
        }
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = occasions.findIndex((item) => item.key === active.id);
            const newIndex = occasions.findIndex((item) => item.key === over.id);
            // Cập nhật UI ngay lập tức
            setOccasions(arrayMove(occasions, oldIndex, newIndex));
        }
    };

    const handleSaveOrder = async () => {
        setIsSaving(true);
        try {
            const orderedKeys = occasions.map(item => item.key);
            
            const formData = new FormData();
            const settingsPayload = { occasionOrder: orderedKeys };
            formData.append('settings', JSON.stringify(settingsPayload));
            
            // === SỬA TẠI ĐÂY: Đổi api.patch thành api.put và thêm /admin ===
            await api.put('/admin/settings', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            toast.success('Đã lưu thứ tự hiển thị thành công!');
        } catch (error) {
            console.error("Lỗi lưu settings:", error);
            toast.error('Có lỗi xảy ra khi lưu thiết lập.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Paper sx={{ p: 3, mt: 3, border: '1px solid #eee' }} elevation={0}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" component="h3">
                    Sắp xếp "Những dịp lan toả niềm vui"
                </Typography>
                <Button 
                    variant="contained" 
                    color="primary" 
                    startIcon={<Save />} 
                    onClick={handleSaveOrder}
                    disabled={isSaving}
                >
                    {isSaving ? 'Đang lưu...' : 'Lưu Thứ Tự'}
                </Button>
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Kéo thả các hàng để thay đổi thứ tự hiển thị trên trang chủ. Những chủ đề mới tự động sinh ra sẽ được đẩy xuống cuối cùng.
            </Typography>

            <TableContainer sx={{ border: '1px solid #f0f0f0', borderRadius: '8px' }}>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <Table>
                        <TableHead sx={{ bgcolor: '#f9fafb' }}>
                            <TableRow>
                                <TableCell></TableCell>
                                <TableCell>Hình ảnh</TableCell>
                                <TableCell>Tên hiển thị</TableCell>
                                <TableCell>Mã định danh (Key)</TableCell>
                            </TableRow>
                        </TableHead>
                        {/* Lưu ý items truyền vào phải là mảng các string ID */}
                        <SortableContext items={occasions.map(o => o.key)} strategy={verticalListSortingStrategy}>
                            <TableBody>
                                {occasions.map((item) => (
                                    <SortableOccasionRow key={item.key} item={item} />
                                ))}
                            </TableBody>
                        </SortableContext>
                    </Table>
                </DndContext>
            </TableContainer>
        </Paper>
    );
};

export default OccasionOrderManager;