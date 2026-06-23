// AdminFE/Pages/AdminDashboard/PageCategoryManagement.js
import React, { useState, useEffect, useCallback } from 'react';
import pageCategoryService from '../../services/pageCategory.service';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { 
    Button, TextField, Table, TableBody, TableCell, TableHead, TableRow, 
    Paper, IconButton, TableContainer, Typography, Box, FormControl, 
    InputLabel, Select, MenuItem 
} from '@mui/material';
import { Edit, Delete, DragIndicator, Sync } from '@mui/icons-material';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// =====================================
// HELPER: Lấy ID an toàn
// =====================================
const getItemId = (item) => item._id || item.id;

// =====================================
// HELPER: Chuyển Tree thành mảng phẳng để render Table & Dropdown
// (Phòng trường hợp Backend chưa trả về cây, bạn có thể tự viết hàm buildTree bọc ngoài)
// =====================================
const flattenCategories = (categories, depth = 0) => {
    let flatList = [];
    categories.forEach(category => {
        flatList.push({ ...category, depth });
        if (category.children && category.children.length > 0) {
            flatList = [...flatList, ...flattenCategories(category.children, depth + 1)];
        }
    });
    return flatList;
};

// =====================================
// COMPONENT RENDER DÒNG KÉO THẢ
// =====================================
const SortableCategoryRow = ({ category, onEdit, onDelete }) => {
    const id = getItemId(category);
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

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
            {/* Hiển thị phân cấp bằng cách thụt lề */}
            <TableCell sx={{ paddingLeft: `${16 + category.depth * 30}px`, fontWeight: category.depth === 0 ? 'bold' : 'normal' }}>
                {category.depth > 0 && '— '} {category.name}
            </TableCell>
            <TableCell sx={{ color: 'text.secondary' }}>/{category.slug}</TableCell>
            <TableCell align="right">
                <IconButton size="small" color="primary" onClick={() => onEdit(category)}>
                    <Edit fontSize="small" />
                </IconButton>
                <IconButton size="small" color="error" onClick={() => onDelete(id)}>
                    <Delete fontSize="small" />
                </IconButton>
            </TableCell>
        </TableRow>
    );
};

const generateUuidSlug = (name) => {
    if (!name) return '';
    const baseSlug = name.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').replace(/([^a-z0-9\s])/g, '').replace(/\s+/g, '-');
    const uuid = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    return `${baseSlug}-${uuid}`;
};

// =====================================
// COMPONENT CHÍNH
// =====================================
const PageCategoryManagement = ({ onCategoriesUpdate }) => {
    const [rawTreeCategories, setRawTreeCategories] = useState([]);
    const [flatCategories, setFlatCategories] = useState([]);
    const [currentCategory, setCurrentCategory] = useState({ name: '', slug: '', parent: '' });
    const [editingId, setEditingId] = useState(null);
    const [isSeeding, setIsSeeding] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const fetchCategories = useCallback(async () => {
        try {
            const response = await pageCategoryService.getAllCategories();
            const responseData = response?.data?.data || response?.data || response;
            
            // LƯU Ý: Giả định Backend đã trả về cấu trúc cây (có mảng children).
            // Nếu BE trả về mảng phẳng, bạn cần viết thêm 1 hàm buildTree() ở đây.
            const fetchedTree = Array.isArray(responseData) ? responseData : [];
            const flattened = flattenCategories(fetchedTree);
            
            setRawTreeCategories(fetchedTree);
            setFlatCategories(flattened);
            if(onCategoriesUpdate) onCategoriesUpdate(fetchedTree);
        } catch (error) {
            console.error(error);
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
            let finalSlug = (currentCategory.slug || '').trim();
            if (!finalSlug) {
                finalSlug = generateUuidSlug(currentCategory.name);
            }

            const payload = { 
                ...currentCategory, 
                slug: finalSlug,
                // Chuyển string rỗng thành null để BE xử lý thành Cấp 1
                parent: currentCategory.parent === '' ? null : currentCategory.parent 
            };

            if (editingId) {
                if (payload.parent === editingId) {
                    return toast.warning("Không thể chọn chính nó làm danh mục cha!");
                }
                await pageCategoryService.updateCategory(editingId, payload);
                toast.success("Cập nhật danh mục thành công!");
            } else {
                await pageCategoryService.createCategory(payload);
                toast.success("Thêm danh mục thành công!");
            }
            resetForm();
            fetchCategories();
        } catch (error) {
            toast.error(error.response?.data?.message || "Thao tác thất bại!");
        }
    };

    const handleEdit = (category) => {
        setEditingId(getItemId(category));
        setCurrentCategory({ 
            name: category.name, 
            slug: category.slug,
            // Xử lý khi parent được populate là object hoặc string ID
            parent: category.parent ? (category.parent._id || category.parent) : '' 
        });
    };

    const handleDelete = async (id) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa danh mục này? Các danh mục con sẽ bị ảnh hưởng.')) {
            try {
                await pageCategoryService.deleteCategory(id);
                toast.success("Xóa danh mục thành công!");
                fetchCategories();
            } catch (error) {
                toast.error("Lỗi khi xóa danh mục!");
            }
        }
    };

    const handleSeedData = async () => {
        if (window.confirm('Bạn có muốn clone/đồng bộ dữ liệu danh mục ngay bây giờ?')) {
            setIsSeeding(true);
            try {
                // TODO: Hãy tạo route tương ứng ở Backend: router.post('/seed', categoryController.seedCategories)
                const res = await api.post('/admin/page-categories/seed');
                toast.success(res.data?.message || "Đồng bộ thành công!");
                fetchCategories();
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
        setCurrentCategory({ name: '', slug: '', parent: '' });
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = flatCategories.findIndex((c) => getItemId(c) === active.id);
            const newIndex = flatCategories.findIndex((c) => getItemId(c) === over.id);
            
            const reorderedCategories = arrayMove(flatCategories, oldIndex, newIndex);
            setFlatCategories(reorderedCategories);

            try {
                const categoryOrderPayload = reorderedCategories.map(cat => ({ 
                    id: getItemId(cat),
                    parent: cat.parent // Truyền thêm parent để đảm bảo không bị mất cấu trúc khi sắp xếp
                }));
                await pageCategoryService.updateCategoryOrder({ categories: categoryOrderPayload });
                toast.success('Thứ tự danh mục đã được cập nhật!');
                fetchCategories(); // Fetch lại để Backend tính lại cây mới
            } catch (error) {
                toast.error('Lỗi khi cập nhật thứ tự.');
                fetchCategories(); 
            }
        }
    };

    return (
        <Paper sx={{ p: 3, mt: 2, borderRadius: 2, boxShadow: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" component="h3" fontWeight="bold">
                    Quản lý Danh mục (Cấu trúc cây)
                </Typography>
                <Button
                    variant="outlined"
                    color="secondary"
                    startIcon={<Sync />}
                    onClick={handleSeedData}
                    disabled={isSeeding}
                >
                    {isSeeding ? 'Đang xử lý...' : 'Clone/Đồng bộ Danh mục'}
                </Button>
            </Box>

            <Paper sx={{ p: 2, mb: 3, backgroundColor: '#f8fafc' }} elevation={0}>
                <form onSubmit={handleSubmit}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2, mb: 2 }}>
                        <TextField 
                            label="Tên danh mục" 
                            name="name" 
                            value={currentCategory.name} 
                            onChange={handleInputChange} 
                            required 
                            variant="outlined" 
                            size="small" 
                        />
                        <TextField 
                            label="Đường dẫn (slug)" 
                            name="slug" 
                            value={currentCategory.slug} 
                            onChange={handleInputChange} 
                            helperText="Để trống hệ thống sẽ tự động tạo từ tên" 
                            variant="outlined" 
                            size="small" 
                        />
                        <FormControl size="small" variant="outlined">
                            <InputLabel id="parent-category-label">Danh mục cha</InputLabel>
                            <Select
                                labelId="parent-category-label"
                                name="parent"
                                value={currentCategory.parent}
                                onChange={handleInputChange}
                                label="Danh mục cha"
                            >
                                <MenuItem value=""><em>-- Không có (Cấp 1) --</em></MenuItem>
                                {flatCategories.filter(c => getItemId(c) !== editingId).map(category => (
                                    <MenuItem key={getItemId(category)} value={getItemId(category)}>
                                        {Array(category.depth).fill('— ').join('')} {category.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                    <Box>
                        <Button type="submit" variant="contained" disableElevation>
                            {editingId ? 'Cập nhật danh mục' : 'Thêm mới danh mục'}
                        </Button>
                        {editingId && (
                            <Button onClick={resetForm} sx={{ ml: 1 }} variant="outlined">
                                Hủy sửa
                            </Button>
                        )}
                    </Box>
                </form>
            </Paper>
            
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, border: '1px solid #e2e8f0' }}>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <Table size="small">
                        <TableHead sx={{ backgroundColor: '#f1f5f9' }}>
                            <TableRow>
                                <TableCell sx={{ width: '50px' }}></TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Tên phân cấp</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Slug</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Hành động</TableCell>
                            </TableRow>
                        </TableHead>
                        <SortableContext items={flatCategories.map(c => getItemId(c))} strategy={verticalListSortingStrategy}>
                            <TableBody>
                                {flatCategories.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                            Chưa có danh mục nào.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    flatCategories.map((cat) => (
                                        <SortableCategoryRow
                                            key={getItemId(cat)}
                                            category={cat}
                                            onEdit={handleEdit}
                                            onDelete={handleDelete}
                                        />
                                    ))
                                )}
                            </TableBody>
                        </SortableContext>
                    </Table>
                </DndContext>
            </TableContainer>
        </Paper>
    );
};

export default PageCategoryManagement;