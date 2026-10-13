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
import { 
    Edit, Delete, DragIndicator, Sync, 
    KeyboardArrowRight, KeyboardArrowDown 
} from '@mui/icons-material';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// =====================================
// HELPER: Lấy ID an toàn
// =====================================
const getItemId = (item) => item._id || item.id;

// =====================================
// HELPER: Chuyển Tree thành mảng phẳng có trạng thái Expand/Collapse
// =====================================
const flattenCategories = (categories, collapsedIds, depth = 0, isParentVisible = true) => {
    let flatList = [];
    categories.forEach(category => {
        const id = getItemId(category);
        const hasChildren = category.children && category.children.length > 0;
        const isCollapsed = collapsedIds.has(id);
        const isVisible = isParentVisible;

        flatList.push({
            ...category,
            depth,
            hasChildren,
            isExpanded: !isCollapsed,
            isVisible
        });

        if (hasChildren) {
            // Danh mục con chỉ hiển thị nếu cha của nó đang hiển thị VÀ không bị thu gọn
            const childrenVisible = isVisible && !isCollapsed;
            flatList = [...flatList, ...flattenCategories(category.children, collapsedIds, depth + 1, childrenVisible)];
        }
    });
    return flatList;
};

// =====================================
// COMPONENT RENDER DÒNG KÉO THẢ
// =====================================
const SortableCategoryRow = ({ category, onEdit, onDelete, onToggleCollapse }) => {
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
            <TableCell>
                <Box sx={{ paddingLeft: `${category.depth * 30}px`, display: 'flex', alignItems: 'center', fontWeight: category.depth === 0 ? 'bold' : 'normal' }}>
                    {/* Nút Thu gọn / Mở rộng */}
                    {category.hasChildren ? (
                        <IconButton 
                            size="small" 
                            onClick={(e) => { e.stopPropagation(); onToggleCollapse(id); }} 
                            sx={{ p: 0.5, mr: 0.5 }}
                        >
                            {category.isExpanded ? <KeyboardArrowDown fontSize="small" /> : <KeyboardArrowRight fontSize="small" />}
                        </IconButton>
                    ) : (
                        <Box component="span" sx={{ width: '28px', mr: 0.5, display: 'inline-block', textAlign: 'center', color: 'text.secondary' }}>
                            {category.depth > 0 ? '—' : ''}
                        </Box>
                    )}
                    {category.name}
                </Box>
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
    const [collapsedIds, setCollapsedIds] = useState(new Set()); // STATE MỚI: Lưu ID các danh mục bị thu gọn
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
            const fetchedTree = Array.isArray(responseData) ? responseData : [];
            
            setRawTreeCategories(fetchedTree);
            if (onCategoriesUpdate) onCategoriesUpdate(fetchedTree);
        } catch (error) {
            console.error(error);
            toast.error("Lỗi khi tải danh mục!");
        }
    }, [onCategoriesUpdate]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    // Cập nhật mảng phẳng mỗi khi Dữ liệu gốc hoặc Trạng thái Thu gọn thay đổi
    useEffect(() => {
        if (rawTreeCategories.length > 0) {
            setFlatCategories(flattenCategories(rawTreeCategories, collapsedIds));
        } else {
            setFlatCategories([]);
        }
    }, [rawTreeCategories, collapsedIds]);

    const toggleCollapse = (id) => {
        setCollapsedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    };

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
                const res = await api.post('/admin/page-categories/seed');
                toast.success(res.data?.message || "Đồng bộ thành công!");
                fetchCategories();
            } catch (error) {
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
            // 1. Chỉ lấy những item ĐANG HIỂN THỊ để tính toán vị trí kéo thả trực quan
            const visibleCategories = flatCategories.filter(c => c.isVisible);
            const oldVisibleIndex = visibleCategories.findIndex((c) => getItemId(c) === active.id);
            const newVisibleIndex = visibleCategories.findIndex((c) => getItemId(c) === over.id);

            // 2. Tìm khối dữ liệu thực tế (Cha + TẤT CẢ các con đang ẩn/hiện) trong mảng phẳng tổng
            const activeIndexFlat = flatCategories.findIndex((c) => getItemId(c) === active.id);
            const activeItem = flatCategories[activeIndexFlat];

            let descendantCount = 0;
            for (let i = activeIndexFlat + 1; i < flatCategories.length; i++) {
                if (flatCategories[i].depth > activeItem.depth) descendantCount++;
                else break;
            }

            // Tách khối đang được kéo ra khỏi mảng
            const blockToMove = flatCategories.slice(activeIndexFlat, activeIndexFlat + 1 + descendantCount);
            let remainingFlat = flatCategories.filter((_, idx) => idx < activeIndexFlat || idx > activeIndexFlat + descendantCount);

            // 3. Tìm vị trí cần chèn vào dựa trên item bị ghi đè (over)
            let insertIndexFlat = remainingFlat.findIndex(c => getItemId(c) === over.id);

            // Nếu kéo xuống dưới, cần chèn vào SAU khối của item bị ghi đè
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
            const newFlatCategories = [
                ...remainingFlat.slice(0, insertIndexFlat),
                ...blockToMove,
                ...remainingFlat.slice(insertIndexFlat)
            ];

            setFlatCategories(newFlatCategories);

            // 5. Cập nhật lên Server
            try {
                const categoryOrderPayload = newFlatCategories.map(cat => ({
                    _id: getItemId(cat),
                    parent: cat.parent ? (cat.parent._id || cat.parent) : null
                }));

                await pageCategoryService.updateCategoryOrder(categoryOrderPayload);
                toast.success('Thứ tự danh mục đã được cập nhật!');
            } catch (error) {
                toast.error('Lỗi khi cập nhật thứ tự.');
                fetchCategories(); // Rollback nếu lỗi
            }
        }
    };

    // Lọc ra các item thực sự được hiển thị trên màn hình
    const visibleCategories = flatCategories.filter(c => c.isVisible);

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
                        <SortableContext items={visibleCategories.map(c => getItemId(c))} strategy={verticalListSortingStrategy}>
                            <TableBody>
                                {visibleCategories.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                            Chưa có danh mục nào.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    visibleCategories.map((cat) => (
                                        <SortableCategoryRow
                                            key={getItemId(cat)}
                                            category={cat}
                                            onEdit={handleEdit}
                                            onDelete={handleDelete}
                                            onToggleCollapse={toggleCollapse}
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