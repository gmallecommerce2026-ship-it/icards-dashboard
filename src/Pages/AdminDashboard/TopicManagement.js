// AdminFE/Pages/AdminDashboard/TopicManagement.js
import React, { useState, useEffect, useCallback } from 'react';
import topicService from '../../services/topic.service';
import { toast } from 'react-toastify';
import api from '../../services/api'; // Đảm bảo bạn đã import api ở đầu file
import {
    Paper, Typography, TextField, Button, Table, TableBody, TableCell,
    TableHead, TableRow, IconButton, TableContainer, FormControl,
    InputLabel, Select, MenuItem, Box
} from '@mui/material';
import { 
    Edit, Delete, DragIndicator, Sync,
    KeyboardArrowRight, KeyboardArrowDown // Thêm Icon
} from '@mui/icons-material';
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// =====================================
// HELPER: Chuyển Tree thành mảng phẳng có trạng thái Expand/Collapse
// =====================================
const flattenTopics = (topics, collapsedIds, depth = 0, isParentVisible = true) => {
    let flatList = [];
    topics.forEach(topic => {
        const id = topic._id;
        const hasChildren = topic.children && topic.children.length > 0;
        const isCollapsed = collapsedIds.has(id);
        const isVisible = isParentVisible;

        flatList.push({
            ...topic,
            depth,
            hasChildren,
            isExpanded: !isCollapsed,
            isVisible
        });

        if (hasChildren) {
            // Con chỉ hiển thị nếu Cha hiển thị VÀ Cha không bị thu gọn
            const childrenVisible = isVisible && !isCollapsed;
            flatList = [...flatList, ...flattenTopics(topic.children, collapsedIds, depth + 1, childrenVisible)];
        }
    });
    return flatList;
};

// =====================================
// COMPONENT RENDER DÒNG KÉO THẢ
// =====================================
const SortableTopicRow = ({ topic, onEdit, onDelete, onToggleCollapse }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: topic._id });
    
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.9 : 1,
        backgroundColor: isDragging ? '#f8f9fa' : 'inherit',
        boxShadow: isDragging ? '0 5px 15px rgba(0,0,0,0.1)' : 'none',
        position: isDragging ? 'relative' : 'static',
        zIndex: isDragging ? 9999 : 'auto',
    };

    return (
        <TableRow ref={setNodeRef} style={style} {...attributes}>
            <TableCell sx={{ cursor: 'grab', width: '50px' }} {...listeners}>
                <DragIndicator color={isDragging ? "primary" : "action"} />
            </TableCell>
            <TableCell>
                <Box sx={{ paddingLeft: `${topic.depth * 30}px`, display: 'flex', alignItems: 'center', fontWeight: topic.depth === 0 ? 'bold' : 'normal' }}>
                    {/* Nút Thu gọn / Mở rộng */}
                    {topic.hasChildren ? (
                        <IconButton 
                            size="small" 
                            onClick={(e) => { e.stopPropagation(); onToggleCollapse(topic._id); }} 
                            sx={{ p: 0.5, mr: 0.5 }}
                        >
                            {topic.isExpanded ? <KeyboardArrowDown fontSize="small" /> : <KeyboardArrowRight fontSize="small" />}
                        </IconButton>
                    ) : (
                        <Box component="span" sx={{ width: '28px', mr: 0.5, display: 'inline-block', textAlign: 'center', color: 'text.secondary' }}>
                            {topic.depth > 0 ? '—' : ''}
                        </Box>
                    )}
                    {topic.name}
                </Box>
            </TableCell>
            <TableCell sx={{ color: 'text.secondary' }}>/{topic.slug}</TableCell>
            <TableCell align="right">
                <IconButton size="small" onClick={() => onEdit(topic)}><Edit color="primary" fontSize="small" /></IconButton>
                <IconButton size="small" onClick={() => onDelete(topic._id)}><Delete color="error" fontSize="small" /></IconButton>
            </TableCell>
        </TableRow>
    );
};

// =====================================
// COMPONENT CHÍNH
// =====================================
const TopicManagement = ({ onTopicsUpdate }) => {
    const [rawTreeTopics, setRawTreeTopics] = useState([]); // Giữ nguyên dạng cây gốc
    const [flatTopics, setFlatTopics] = useState([]); // Mảng phẳng để render
    const [collapsedIds, setCollapsedIds] = useState(new Set()); // STATE MỚI: Quản lý ẩn/hiện
    const [currentTopic, setCurrentTopic] = useState({ name: '', slug: '', parentId: '' });
    const [editingId, setEditingId] = useState(null);
    const [isSeeding, setIsSeeding] = useState(false);

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    const fetchTopics = useCallback(async () => {
        try {
            const response = await topicService.getAllTopics();
            const fetchedTree = response.data.data || [];
            
            setRawTreeTopics(fetchedTree);
            if (onTopicsUpdate) onTopicsUpdate(fetchedTree);
        } catch (error) {
            toast.error("Lỗi khi tải chủ đề!");
        }
    }, [onTopicsUpdate]);

    useEffect(() => { 
        fetchTopics(); 
    }, [fetchTopics]);

    // Lắng nghe sự thay đổi của Data gốc hoặc trạng thái Thu gọn để build lại mảng phẳng
    useEffect(() => {
        if (rawTreeTopics.length > 0) {
            setFlatTopics(flattenTopics(rawTreeTopics, collapsedIds));
        } else {
            setFlatTopics([]);
        }
    }, [rawTreeTopics, collapsedIds]);

    const toggleCollapse = (id) => {
        setCollapsedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    };

    const handleInputChange = (e) => setCurrentTopic({ ...currentTopic, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let finalSlug = currentTopic.slug?.trim();
            const payload = {
                ...currentTopic,
                parentId: currentTopic.parentId === '' ? null : currentTopic.parentId
            };

            if (finalSlug) {
                payload.slug = finalSlug;
            } else {
                delete payload.slug;
            }

            if (editingId) {
                if (payload.parentId === editingId) {
                    return toast.warning("Không thể chọn chính nó làm danh mục cha!");
                }
                await topicService.updateTopic(editingId, payload);
                toast.success("Cập nhật chủ đề thành công!");
            } else {
                await topicService.createTopic(payload);
                toast.success("Thêm chủ đề thành công!");
            }
            resetForm();
            fetchTopics();
        } catch (error) {
            toast.error(error.response?.data?.message || "Thao tác thất bại!");
        }
    };

    const handleEdit = (topic) => {
        setEditingId(topic._id);
        setCurrentTopic({
            name: topic.name,
            slug: topic.slug,
            parentId: topic.parentId || ''
        });
    };

    const handleDelete = async (id) => {
        if (window.confirm('Bạn có chắc muốn xóa chủ đề này? Các bài viết và danh mục con bên trong sẽ bị ảnh hưởng.')) {
            try {
                await topicService.deleteTopic(id);
                toast.success("Xóa chủ đề thành công!");
                fetchTopics();
            } catch (error) { toast.error("Lỗi khi xóa chủ đề!"); }
        }
    };

    const handleSeedData = async () => {
        if (window.confirm('Hành động này sẽ copy toàn bộ danh mục từ PageCategory sang Blog Topic. Bạn có muốn tiếp tục?')) {
            setIsSeeding(true);
            try {
                const res = await api.post('/admin/topics/seed');
                toast.success(res.data?.message || "Đồng bộ thành công!");
                fetchTopics();
            } catch (error) {
                console.error("Lỗi seed:", error);
                toast.error(error.response?.data?.message || "Lỗi khi đồng bộ dữ liệu!");
            } finally {
                setIsSeeding(false);
            }
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setCurrentTopic({ name: '', slug: '', parentId: '' });
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            // 1. Chỉ lấy những item ĐANG HIỂN THỊ để tính UI
            const visibleTopics = flatTopics.filter(t => t.isVisible);
            const oldVisibleIndex = visibleTopics.findIndex(t => t._id === active.id);
            const newVisibleIndex = visibleTopics.findIndex(t => t._id === over.id);

            // 2. Tìm khối dữ liệu thực tế (Cha + Con)
            const activeIndexFlat = flatTopics.findIndex(t => t._id === active.id);
            const activeItem = flatTopics[activeIndexFlat];

            let descendantCount = 0;
            for (let i = activeIndexFlat + 1; i < flatTopics.length; i++) {
                if (flatTopics[i].depth > activeItem.depth) descendantCount++;
                else break;
            }

            const blockToMove = flatTopics.slice(activeIndexFlat, activeIndexFlat + 1 + descendantCount);
            let remainingFlat = flatTopics.filter((_, idx) => idx < activeIndexFlat || idx > activeIndexFlat + descendantCount);

            // 3. Tìm vị trí chèn
            let insertIndexFlat = remainingFlat.findIndex(t => t._id === over.id);

            if (newVisibleIndex > oldVisibleIndex) {
                const overItem = remainingFlat[insertIndexFlat];
                let overDescendantCount = 0;
                for (let i = insertIndexFlat + 1; i < remainingFlat.length; i++) {
                    if (remainingFlat[i].depth > overItem.depth) overDescendantCount++;
                    else break;
                }
                insertIndexFlat += overDescendantCount + 1;
            }

            // 4. Lắp ráp lại mảng
            const newFlatTopics = [
                ...remainingFlat.slice(0, insertIndexFlat),
                ...blockToMove,
                ...remainingFlat.slice(insertIndexFlat)
            ];

            setFlatTopics(newFlatTopics);

            // 5. Gọi API
            try {
                const topicOrderPayload = newFlatTopics.map(t => ({
                    _id: t._id,
                    parentId: t.parentId || null
                }));

                await topicService.updateTopicOrder(topicOrderPayload);
                toast.success('Thứ tự chủ đề đã được cập nhật!');
            } catch (error) {
                toast.error('Lỗi khi cập nhật thứ tự.');
                fetchTopics(); // Rollback nếu lỗi
            }
        }
    };

    // Lọc ra các item đang thực sự hiển thị
    const visibleTopics = flatTopics.filter(t => t.isVisible);

    return (
        <Paper sx={{ p: 3, mt: 2, borderRadius: 2, boxShadow: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" component="h3" fontWeight="bold">Quản lý Cấu trúc Chủ đề Blog</Typography>
                <Button
                    variant="outlined"
                    color="secondary"
                    startIcon={<Sync />}
                    onClick={handleSeedData}
                    disabled={isSeeding}
                >
                    {isSeeding ? 'Đang đồng bộ...' : 'Đồng bộ từ Danh mục'}
                </Button>
            </Box>

            <Paper sx={{ p: 2, mb: 3, backgroundColor: '#f8fafc' }} elevation={0}>
                <form onSubmit={handleSubmit}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2, mb: 2 }}>
                        <TextField
                            label="Tên chủ đề"
                            name="name"
                            value={currentTopic.name}
                            onChange={handleInputChange}
                            required
                            variant="outlined"
                            size="small"
                        />
                        <TextField
                            label="Đường dẫn (slug)"
                            name="slug"
                            value={currentTopic.slug}
                            onChange={handleInputChange}
                            helperText="Để trống sẽ tự động tạo từ tên"
                            variant="outlined"
                            size="small"
                        />
                        <FormControl size="small" variant="outlined">
                            <InputLabel id="parent-topic-label">Danh mục cha</InputLabel>
                            <Select
                                labelId="parent-topic-label"
                                name="parentId"
                                value={currentTopic.parentId}
                                onChange={handleInputChange}
                                label="Danh mục cha"
                            >
                                <MenuItem value=""><em>-- Không có (Cấp 1) --</em></MenuItem>
                                {/* Tránh việc tự chọn chính mình làm cha */}
                                {flatTopics.filter(t => t._id !== editingId).map(topic => (
                                    <MenuItem key={topic._id} value={topic._id}>
                                        {Array(topic.depth).fill('— ').join('')} {topic.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                    <Box>
                        <Button type="submit" variant="contained" color="primary" disableElevation>
                            {editingId ? 'Cập nhật Chủ đề' : 'Thêm Chủ đề'}
                        </Button>
                        {editingId && <Button onClick={resetForm} sx={{ ml: 1 }} variant="outlined">Hủy sửa</Button>}
                    </Box>
                </form>
            </Paper>

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <Table size="small">
                        <TableHead sx={{ backgroundColor: '#f1f5f9' }}>
                            <TableRow>
                                <TableCell sx={{ width: '50px' }}></TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Tên phân cấp</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Đường dẫn</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Hành động</TableCell>
                            </TableRow>
                        </TableHead>
                        <SortableContext items={visibleTopics.map(t => t._id)} strategy={verticalListSortingStrategy}>
                            <TableBody>
                                {visibleTopics.length > 0 ? visibleTopics.map((topic) => (
                                    <SortableTopicRow
                                        key={topic._id}
                                        topic={topic}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                        onToggleCollapse={toggleCollapse}
                                    />
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                            Chưa có chủ đề nào. Hãy thêm mới hoặc đồng bộ.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </SortableContext>
                    </Table>
                </DndContext>
            </TableContainer>
        </Paper>
    );
};

export default TopicManagement;