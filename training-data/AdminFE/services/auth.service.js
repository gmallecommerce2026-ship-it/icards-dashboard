// AdminTrainData/AdminFE/services/auth.service.js

import api from './api';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';

const AuthService = {
    // === Authentication ===
    login: async (username, password) => {
        try {
            const response = await api.post('/admin/auth/login', { login: username, password });
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : new Error('Lỗi mạng hoặc server không phản hồi');
        }
    },
    logout: async () => {
        try {
            await api.post('/admin/auth/logout');
        } catch (error) {
            console.error("Lỗi khi gọi API logout:", error);
        } finally {
            Cookies.remove('token'); 
        }
    },
    getMe: async () => {
        try {
            const response = await api.get('/admin/users/me');
            return { success: true, data: response.data };
        } catch (error) {
            throw error.response ? error.response.data : new Error('Token không hợp lệ');
        }
    },

    // === User Management ===
    getUsers: async () => {
        const response = await api.get('/admin/users');
        return response.data;
    },
    addUser: async (userData) => {
        const response = await api.post('/admin/users', userData);
        return response.data;
    },
    updateUser: async (userId, userData) => {
        const response = await api.put(`/admin/users/${userId}`, userData);
        return response.data;
    },
    deleteUser: async (userId) => {
        const response = await api.delete(`/admin/users/${userId}`);
        return response.data;
    },
    
    // === Dashboard ===
    getDashboardData: async () => {
        const response = await api.get('/admin/dashboard');
        const mockData = {
            dailyVisitors: [{ name: 'T2', uv: 4000, pv: 2400 },{ name: 'T3', uv: 3000, pv: 1398 },{ name: 'T4', uv: 2000, pv: 9800 },{ name: 'T5', uv: 2780, pv: 3908 },{ name: 'T6', uv: 1890, pv: 4800 },{ name: 'T7', uv: 2390, pv: 3800 },{ name: 'CN', uv: 3490, pv: 4300 }],
            hotProducts: [{ id: 1, name: 'Bộ thiệp cưới "Rustic Charm"', clicks: 2345 },{ id: 2, name: 'Thiệp sinh nhật "Watercolor Dreams"', clicks: 1987 },{ id: 3, name: 'Thiệp thôi nôi "Baby Safari"', clicks: 1567 },{ id: 4, name: 'Thiệp tân gia "Modern Home"', clicks: 1234 },{ id: 5, name: 'Bộ thiệp "Vintage Floral"', clicks: 987 }]
        };
        return { ...response.data, ...mockData };
    },

    // === Products ===
    getProducts: async (searchTerm = '') => {
        const response = await api.get(`/admin/products?search=${searchTerm}`);
        return response.data.data;
    },
    addProduct: async (productData) => {
        const formData = new FormData();
        formData.append('title', productData.title);
        formData.append('price', productData.price);
        formData.append('category', productData.category);
        formData.append('description', productData.description);
        if (productData.imgSrc && productData.imgSrc instanceof File) {
            formData.append('image', productData.imgSrc);
        }
        if (productData.images && Array.isArray(productData.images)) {
            productData.images.forEach(file => {
                if (file instanceof File) {
                    formData.append('images', file);
                }
            });
        }
        const response = await api.post('/admin/products', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    updateProduct: async (productData) => {
        const formData = new FormData();
        formData.append('title', productData.title);
        formData.append('price', productData.price);
        formData.append('category', productData.category);
        formData.append('description', productData.description);
        if (productData.imgSrc && productData.imgSrc instanceof File) {
            formData.append('image', productData.imgSrc);
        }
        const existingImageUrls = [];
        if (productData.images && Array.isArray(productData.images)) {
            productData.images.forEach(img => {
                if (img instanceof File) {
                    formData.append('images', img);
                } else if (typeof img === 'string') {
                    existingImageUrls.push(img);
                }
            });
        }
        formData.append('existingImages', JSON.stringify(existingImageUrls));
        const response = await api.put(`/admin/products/${productData.id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    deleteProduct: async (id) => {
        const response = await api.delete(`/admin/products/${id}`);
        return response.data;
    },

    // === Templates ===
    getTemplates: async (queryParams = '') => { 
        const response = await api.get(`/admin/templates?${queryParams}`);
        return response.data; 
    },
    getTemplateCategories: async () => {
        const response = await api.get('/admin/templates/categories');
        return response.data;
    },
    getTemplateGroups: async (category) => {
        if (!category) return { status: 'success', data: [] };
        const response = await api.get(`/admin/templates/groups?category=${encodeURIComponent(category)}`);
        return response.data;
    },
    getTemplateTypesForGroup: async (category, group) => {
        if (!category || !group) return { status: 'success', data: [] };
        const response = await api.get(`/admin/templates/types?category=${encodeURIComponent(category)}&group=${encodeURIComponent(group)}`);
        return response.data;
    },
    bulkAddTemplates: async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/admin/templates/bulk-import', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    bulkDeleteTemplatesByFilter: async (filters) => {
        try {
            const response = await api.delete('/admin/templates/bulk-delete-by-filter', { data: filters });
            toast.success(response.data.message || 'Xóa mẫu thiệp hàng loạt thành công!');
            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || 'Xóa mẫu thiệp hàng loạt thất bại.';
            toast.error(message);
            throw error;
        }
    },
    getTemplateById: async (id) => {
        const response = await api.get(`/admin/templates/${id}`);
        return response.data;
    },
    addTemplate: async (templateFormData) => {
        const response = await api.post('/admin/templates', templateFormData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    updateTemplate: async (templateFormData) => {
        const templateId = templateFormData.get('id');
        const response = await api.put(`/admin/templates/${templateId}`, templateFormData);
        return response.data;
    },
    deleteTemplate: async (id) => {
        const response = await api.delete(`/admin/templates/${id}`);
        return response.data;
    },
    saveTemplateDesign: async (id, templateData) => {
        const response = await api.put(`/api/templates/design/${id}`, { templateData });
        return response.data;
    },
    reorderTemplates: async (templateIds) => {
        const response = await api.post('/admin/templates/reorder', { templateIds });
        return response.data;
    },

    // === Design Assets ===
    getDesignAssets: async (type = '') => {
        const response = await api.get(`/design-assets?type=${type}`);
        return response.data.data;
    },
    addDesignAsset: async (assetData) => {
        const formData = new FormData();
        formData.append('name', assetData.name);
        formData.append('assetType', assetData.assetType);
        formData.append('category', assetData.category);
        if (assetData.image instanceof File) {
            formData.append('image', assetData.image);
        }
        const response = await api.post('/design-assets', formData);
        return response.data;
    },
    deleteDesignAsset: async (id) => {
        await api.delete(`/design-assets/${id}`);
    },
    bulkAddAssets: async (files, metadata) => {
        const formData = new FormData();
        files.forEach(file => {
            formData.append('images', file.file); 
        });
        formData.append('metadata', JSON.stringify(metadata));

        const response = await api.post('/design-assets/bulk-import', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    bulkDeleteAssets: async (ids) => {
        const response = await api.delete('/design-assets/bulk-delete', {
            data: { ids }
        });
        return response.data;
    },

    // === Settings & SEO ===
    getSettings: async () => {
        const response = await api.get('/admin/settings');
        return response.data;
    },
    updateSettings: async (formData) => {
        const response = await api.put('/admin/settings', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    // === Page Management ===
    getPages: async () => {
        const response = await api.get('/admin/pages');
        return response.data;
    },
    createPage: async (pageData) => {
        const response = await api.post('/admin/pages', pageData);
        return response.data;
    },
    updatePage: async (pageId, pageData) => {
        const response = await api.put(`/admin/pages/${pageId}`, pageData);
        return response.data;
    },
    deletePage: async (pageId) => {
        const response = await api.delete(`/admin/pages/${pageId}`);
        return response.data;
    },
    updatePageOrder: async (pages) => {
        // === SỬA LỖI TẠI ĐÂY: Gửi thẳng đối tượng `pages` mà không gói lại ===
        return api.put('/admin/pages/update-order', pages);
    },
    // === BẮT ĐẦU SỬA LỖI: Chuyển hàm này sang file service riêng ===
    // Xóa hàm getPageCategories khỏi đây
    // === KẾT THÚC SỬA LỖI ===

    // === Fonts Management ===
    getFonts: async () => {
        const response = await api.get('/admin/fonts');
        return response.data.data;
    },
    addFont: async (fontData) => {
        const formData = new FormData();
        formData.append('name', fontData.name);
        formData.append('category', fontData.category);
        formData.append('font', fontData.fontFile); 
        const response = await api.post('/admin/fonts', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    deleteFont: async (fontId) => {
        await api.delete(`/admin/fonts/${fontId}`);
    },
    bulkAddFonts: async (files, metadata, overwrite = false) => {
        const formData = new FormData();
        
        // Append danh sách file
        files.forEach(file => {
            formData.append('fonts', file.file);
        });
        
        // Append metadata
        formData.append('metadata', JSON.stringify(metadata));
        
        // Append cờ overwrite (chuyển sang string để gửi qua FormData)
        formData.append('overwrite', overwrite.toString());

        const response = await api.post('/admin/fonts/bulk-upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    updateFont: async (fontId, data) => {
        const response = await api.put(`/admin/fonts/${fontId}`, data);
        return response.data;
    },
    bulkDeleteFonts: async (ids) => {
        const response = await api.delete('/admin/fonts/bulk-delete', {
            data: { ids } 
        });
        return response.data;
    },
    bulkUpdateFontCategory: async (ids, newCategory) => {
        // Gửi mảng ids và category mới lên server
        const response = await api.put('/admin/fonts/bulk-category', { ids, category: newCategory });
        return response.data;
    }
};

export default AuthService;