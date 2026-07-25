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
import { Edit, Delete, DragIndicator, Sync } from '@mui/icons-material';
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// =====================================
// HELPER: Chuyển Tree thành mảng phẳng để render Table & Dropdown
// =====================================
const flattenTopics = (topics, depth = 0) => {
    let flatList = [];
    topics.forEach(topic => {
        flatList.push({ ...topic, depth });
        if (topic.children && topic.children.length > 0) {
            flatList = [...flatList, ...flattenTopics(topic.children, depth + 1)];
        }
    });
    return flatList;
};

// =====================================
// COMPONENT RENDER DÒNG KÉO THẢ
// =====================================
const SortableTopicRow = ({ topic, onEdit, onDelete }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: topic._id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.8 : 1,
        backgroundColor: isDragging ? 'action.hover' : 'inherit',
    };

    return (
        <TableRow ref={setNodeRef} style={style} {...attributes}>
            <TableCell sx={{ cursor: 'grab', width: '50px' }} {...listeners}><DragIndicator /></TableCell>
            {/* Hiển thị phân cấp bằng cách thụt lề (paddingLeft) */}
            <TableCell sx={{ paddingLeft: `${16 + topic.depth * 30}px`, fontWeight: topic.depth === 0 ? 'bold' : 'normal' }}>
                {topic.depth > 0 && '— '} {topic.name}
            </TableCell>
            <TableCell>/{topic.slug}</TableCell>
            <TableCell align="right">
                <IconButton size="small" onClick={() => onEdit(topic)}><Edit color="primary" /></IconButton>
                <IconButton size="small" onClick={() => onDelete(topic._id)}><Delete color="error" /></IconButton>
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
    const [currentTopic, setCurrentTopic] = useState({ name: '', slug: '', parentId: '' });
    const [editingId, setEditingId] = useState(null);
    const [isSeeding, setIsSeeding] = useState(false);

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    const fetchTopics = useCallback(async () => {
        try {
            const response = await topicService.getAllTopics();
            const fetchedTree = response.data.data || [];
            const flattened = flattenTopics(fetchedTree);

            setRawTreeTopics(fetchedTree);
            setFlatTopics(flattened);
            if (onTopicsUpdate) onTopicsUpdate(fetchedTree);
        } catch (error) {
            toast.error("Lỗi khi tải chủ đề!");
        }
    }, [onTopicsUpdate]);

    useEffect(() => { fetchTopics(); }, [fetchTopics]);

    const handleInputChange = (e) => setCurrentTopic({ ...currentTopic, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let finalSlug = currentTopic.slug?.trim();
            const payload = {
                ...currentTopic,
                // Chuyển string rỗng thành null để BE xử lý thành cấp 1
                parentId: currentTopic.parentId === '' ? null : currentTopic.parentId
            };

            // NẾU CÓ NHẬP SLUG THÌ GỬI, KHÔNG THÌ XÓA ĐI ĐỂ BACKEND TỰ SINH
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
                // Gọi trực tiếp qua api instance giống style bình thường của bạn
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
            const oldIndex = flatTopics.findIndex((t) => t._id === active.id);
            const newIndex = flatTopics.findIndex((t) => t._id === over.id);
            const reorderedTopics = arrayMove(flatTopics, oldIndex, newIndex);
            setFlatTopics(reorderedTopics);

            try {
                // Tạo một mảng (Array) chứa thứ tự mới
                const topicOrderPayload = reorderedTopics.map(t => ({
                    _id: t._id,
                    parentId: t.parentId || null
                }));

                // ❌ CODE LỖI BỌC 2 LẦN: 
                // await topicService.updateTopicOrder({ topics: topicOrderPayload });

                // ✅ CODE ĐÚNG: CHỈ TRUYỀN MẢNG VÀO
                await topicService.updateTopicOrder(topicOrderPayload);

                toast.success('Thứ tự chủ đề đã được cập nhật!');
                fetchTopics();
            } catch (error) {
                toast.error('Lỗi khi cập nhật thứ tự.');
                fetchTopics();
            }
        }
    };

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
                        <Button type="submit" variant="contained" color="primary">
                            {editingId ? 'Cập nhật Chủ đề' : 'Thêm Chủ đề'}
                        </Button>
                        {editingId && <Button onClick={resetForm} sx={{ ml: 1 }} color="inherit">Hủy sửa</Button>}
                    </Box>
                </form>
            </Paper>

            <TableContainer component={Paper} elevation={1} sx={{ border: '1px solid #e2e8f0' }}>
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
                        <SortableContext items={flatTopics.map(t => t._id)} strategy={verticalListSortingStrategy}>
                            <TableBody>
                                {flatTopics.length > 0 ? flatTopics.map((topic) => (
                                    <SortableTopicRow
                                        key={topic._id}
                                        topic={topic}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
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