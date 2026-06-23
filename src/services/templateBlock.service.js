// AdminDashboardFrontend/services/templateBlock.service.js
import api from './api';

const templateBlockService = {
  getBlocks: () => api.get('/admin/template-blocks'),
  getBlockById: (id) => api.get(`/admin/template-blocks/${id}`),
  createBlock: (data) => api.post('/admin/template-blocks', data),
  updateBlock: (id, data) => api.put(`/admin/template-blocks/${id}`, data),
  deleteBlock: (id) => api.delete(`/admin/template-blocks/${id}`),
  // Cập nhật thứ tự các khối hiển thị trên trang chủ
  updateOrder: (blocks) => api.put('/admin/template-blocks/reorder', { blocks }),
};

export default templateBlockService;