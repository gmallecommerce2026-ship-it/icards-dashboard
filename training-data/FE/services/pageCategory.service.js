import api from './api';

const getAllCategories = () => {
    // THAY ĐỔI: Route này cần xác thực admin, nên gọi qua /admin
    return api.get('/admin/page-categories');
};

const createCategory = (categoryData) => {
    return api.post('/admin/page-categories', categoryData);
};

const updateCategory = (id, categoryData) => {
    return api.put(`/admin/page-categories/${id}`, categoryData);
};

const deleteCategory = (id) => {
    return api.delete(`/admin/page-categories/${id}`);
};

// THÊM HÀM MỚI
const updateCategoryOrder = (categories) => {
    return api.put('/admin/page-categories/update-order', { categories });
};

const pageCategoryService = {
    getAllCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    updateCategoryOrder, // Export hàm mới
};

export default pageCategoryService;