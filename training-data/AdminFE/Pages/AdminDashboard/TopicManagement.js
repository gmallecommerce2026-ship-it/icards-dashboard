// AdminFE/Pages/AdminDashboard/TopicManagement.js
import React, { useState, useEffect, useCallback } from 'react';
import topicService from '../../services/topic.service';
import { toast } from 'react-toastify';
import { Paper, Typography, TextField, Button, Table, TableBody, TableCell, TableHead, TableRow, IconButton, TableContainer } from '@mui/material';
import { Edit, Delete, DragIndicator } from '@mui/icons-material';
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
            <TableCell>{topic.name}</TableCell>
            <TableCell>/{topic.slug}</TableCell>
            <TableCell align="right">
                <IconButton size="small" onClick={() => onEdit(topic)}><Edit /></IconButton>
                <IconButton size="small" onClick={() => onDelete(topic._id)}><Delete /></IconButton>
            </TableCell>
        </TableRow>
    );
};

const TopicManagement = ({ onTopicsUpdate }) => {
    const [topics, setTopics] = useState([]);
    const [currentTopic, setCurrentTopic] = useState({ name: '', slug: '' });
    const [editingId, setEditingId] = useState(null);
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));


    const fetchTopics = useCallback(async () => {
        try {
            const response = await topicService.getAllTopics();
            const fetchedTopics = response.data.data || [];
            setTopics(fetchedTopics);
            if(onTopicsUpdate) onTopicsUpdate(fetchedTopics);
        } catch (error) { toast.error("Lỗi khi tải chủ đề!"); }
    }, [onTopicsUpdate]);

    useEffect(() => { fetchTopics(); }, [fetchTopics]);

    const handleInputChange = (e) => setCurrentTopic({ ...currentTopic, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await topicService.updateTopic(editingId, currentTopic);
                toast.success("Cập nhật chủ đề thành công!");
            } else {
                await topicService.createTopic(currentTopic);
                toast.success("Thêm chủ đề thành công!");
            }
            resetForm();
            fetchTopics();
        } catch (error) { toast.error(error.response?.data?.message || "Thao tác thất bại!"); }
    };

    const handleEdit = (topic) => { setEditingId(topic._id); setCurrentTopic({ name: topic.name, slug: topic.slug }); };

    const handleDelete = async (id) => {
        if (window.confirm('Bạn có chắc muốn xóa chủ đề này?')) {
            try {
                await topicService.deleteTopic(id);
                toast.success("Xóa chủ đề thành công!");
                fetchTopics();
            } catch (error) { toast.error("Lỗi khi xóa chủ đề!"); }
        }
    };

    const resetForm = () => { setEditingId(null); setCurrentTopic({ name: '', slug: '' }); };

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = topics.findIndex((t) => t._id === active.id);
            const newIndex = topics.findIndex((t) => t._id === over.id);
            const reorderedTopics = arrayMove(topics, oldIndex, newIndex);
            setTopics(reorderedTopics);
            try {
                const topicOrderPayload = reorderedTopics.map(t => ({ id: t._id }));
                await topicService.updateTopicOrder({ topics: topicOrderPayload });
                toast.success('Thứ tự chủ đề đã được cập nhật!');
                if (onTopicsUpdate) onTopicsUpdate(reorderedTopics);
            } catch (error) {
                toast.error('Lỗi khi cập nhật thứ tự.');
                fetchTopics();
            }
        }
    };

    return (
        <Paper sx={{ p: 2, mt: 2 }}>
            <Typography variant="h6" component="h3" gutterBottom>Quản lý Chủ đề (Topics)</Typography>
            <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
                <TextField label="Tên chủ đề" name="name" value={currentTopic.name} onChange={handleInputChange} fullWidth required sx={{ mb: 2 }} variant="outlined" size="small" />
                <TextField label="Đường dẫn (slug)" name="slug" value={currentTopic.slug} onChange={handleInputChange} fullWidth sx={{ mb: 2 }} helperText="Để trống sẽ tự động tạo từ tên" variant="outlined" size="small" />
                <Button type="submit" variant="contained">{editingId ? 'Cập nhật' : 'Thêm mới'}</Button>
                {editingId && <Button onClick={resetForm} sx={{ ml: 1 }}>Hủy</Button>}
            </form>

            <TableContainer component={Paper}>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <Table><TableHead><TableRow><TableCell sx={{width: '50px'}}></TableCell><TableCell>Tên chủ đề</TableCell><TableCell>Slug</TableCell><TableCell align="right">Hành động</TableCell></TableRow></TableHead>
                        <SortableContext items={topics.map(t => t._id)} strategy={verticalListSortingStrategy}>
                            <TableBody>{topics.map((topic) => (<SortableTopicRow key={topic._id} topic={topic} onEdit={handleEdit} onDelete={handleDelete} />))}</TableBody>
                        </SortableContext>
                    </Table>
                </DndContext>
            </TableContainer>
        </Paper>
    );
};

export default TopicManagement;