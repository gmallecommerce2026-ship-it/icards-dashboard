// AdminFE/Pages/AdminDashboard/PageCategoryManagement.js
import React, { useState, useEffect, useCallback } from 'react';
import pageCategoryService from '../../services/pageCategory.service';
import { toast } from 'react-toastify';
import { Button, TextField, Table, TableBody, TableCell, TableHead, TableRow, Paper, IconButton, TableContainer, Typography } from '@mui/material';
import { Edit, Delete, DragIndicator } from '@mui/icons-material';
// THAY ĐỔI: Import từ @dnd-kit thay vì react-beautiful-dnd
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';


// THAY ĐỔI: Tạo một component con có thể sắp xếp bằng @dnd-kit
const SortableCategoryRow = ({ category, onEdit, onDelete }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: category._id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.8 : 1,
        backgroundColor: isDragging ? 'action.hover' : 'inherit',
    };

    return (
        <TableRow
            ref={setNodeRef}
            style={style}
            {...attributes}
        >
            <TableCell sx={{ cursor: 'grab', width: '50px' }} {...listeners}>
                <DragIndicator />
            </TableCell>
            <TableCell>{category.name}</TableCell>
            <TableCell>/{category.slug}</TableCell>
            <TableCell align="right">
                <IconButton size="small" onClick={() => onEdit(category)}><Edit /></IconButton>
                <IconButton size="small" onClick={() => onDelete(category._id)}><Delete /></IconButton>
            </TableCell>
        </TableRow>
    );
};


const PageCategoryManagement = ({ onCategoriesUpdate }) => {
    const [categories, setCategories] = useState([]);
    const [currentCategory, setCurrentCategory] = useState({ name: '', slug: '' });
    const [editingId, setEditingId] = useState(null);

    // THAY ĐỔI: Khai báo sensors cho @dnd-kit
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), // Kích hoạt kéo sau khi di chuyển 5px
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );


    const fetchCategories = useCallback(async () => {
        try {
            const response = await pageCategoryService.getAllCategories();
            const fetchedCategories = response.data.data || [];
            setCategories(fetchedCategories);
            if(onCategoriesUpdate) onCategoriesUpdate(fetchedCategories);
        } catch (error) {
            toast.error("Lỗi khi tải danh mục!");
        }
    }, [onCategoriesUpdate]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCurrentCategory(prevState => ({ ...prevState, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await pageCategoryService.updateCategory(editingId, currentCategory);
                toast.success("Cập nhật danh mục thành công!");
            } else {
                await pageCategoryService.createCategory(currentCategory);
                toast.success("Thêm danh mục thành công!");
            }
            resetForm();
            fetchCategories();
        } catch (error) {
            toast.error(error.response?.data?.message || "Thao tác thất bại!");
        }
    };

    const handleEdit = (category) => {
        setEditingId(category._id);
        setCurrentCategory({ name: category.name, slug: category.slug });
    };

    const handleDelete = async (id) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa danh mục này? Các bài viết liên quan sẽ không bị xóa.')) {
            try {
                await pageCategoryService.deleteCategory(id);
                toast.success("Xóa danh mục thành công!");
                fetchCategories();
            } catch (error) {
                toast.error("Lỗi khi xóa danh mục!");
            }
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setCurrentCategory({ name: '', slug: '' });
    };

    // THAY ĐỔI: Cập nhật hàm xử lý kéo thả cho @dnd-kit
    const handleDragEnd = async (event) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = categories.findIndex((c) => c._id === active.id);
            const newIndex = categories.findIndex((c) => c._id === over.id);
            
            const reorderedCategories = arrayMove(categories, oldIndex, newIndex);
            setCategories(reorderedCategories); // Cập nhật UI ngay lập tức

            try {
                const categoryOrderPayload = reorderedCategories.map(cat => ({ id: cat._id }));
                await pageCategoryService.updateCategoryOrder({ categories: categoryOrderPayload });
                toast.success('Thứ tự danh mục đã được cập nhật!');
                if (onCategoriesUpdate) onCategoriesUpdate(reorderedCategories);
            } catch (error) {
                toast.error('Lỗi khi cập nhật thứ tự.');
                fetchCategories(); // Hoàn tác lại nếu có lỗi
            }
        }
    };

    return (
        <Paper sx={{ p: 2, mt: 4 }}>
            <Typography variant="h6" component="h3" gutterBottom>Quản lý Danh mục Bài viết</Typography>
            <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
                <TextField label="Tên danh mục" name="name" value={currentCategory.name} onChange={handleInputChange} fullWidth required sx={{ mb: 2 }} variant="outlined" size="small" />
                <TextField label="Đường dẫn (slug)" name="slug" value={currentCategory.slug} onChange={handleInputChange} fullWidth sx={{ mb: 2 }} helperText="Để trống sẽ tự động tạo từ tên" variant="outlined" size="small" />
                <Button type="submit" variant="contained">{editingId ? 'Cập nhật' : 'Thêm mới'}</Button>
                {editingId && <Button onClick={resetForm} sx={{ ml: 1 }}>Hủy</Button>}
            </form>
            
            <TableContainer component={Paper}>
                {/* THAY ĐỔI: Sử dụng DndContext và SortableContext của @dnd-kit */}
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ width: '50px' }}></TableCell>
                                <TableCell>Tên danh mục</TableCell>
                                <TableCell>Slug</TableCell>
                                <TableCell align="right">Hành động</TableCell>
                            </TableRow>
                        </TableHead>
                        <SortableContext items={categories.map(c => c._id)} strategy={verticalListSortingStrategy}>
                            <TableBody>
                                {categories.map((cat) => (
                                    <SortableCategoryRow
                                        key={cat._id}
                                        category={cat}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                    />
                                ))}
                            </TableBody>
                        </SortableContext>
                    </Table>
                </DndContext>
            </TableContainer>
        </Paper>
    );
};

export default PageCategoryManagement;