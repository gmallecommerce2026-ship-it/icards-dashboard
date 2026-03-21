import axios from 'axios';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';
// Lấy URL của API từ biến môi trường, nếu không có thì mặc định là localhost
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Can thiệp vào mỗi yêu cầu (request) trước khi nó được gửi đi
// Ở đây, chúng ta sẽ đính kèm token xác thực vào header nếu người dùng đã đăng nhập
// LƯU Ý: Với httpOnly cookie, trình duyệt sẽ tự động đính kèm cookie,
// nên việc thêm header 'Authorization' có thể không cần thiết nữa,
// nhưng vẫn giữ lại để tương thích với các phương thức xác thực khác.
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token'); // Lấy token từ cookie
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response, 
  (error) => {
    let errorMessage = 'Đã có lỗi không mong muốn xảy ra. Vui lòng thử lại sau.';

    // Xử lý lỗi 401 (Hết hạn Token)
    if (error.response && error.response.status === 401) {
      // 1. Luôn xóa token
      Cookies.remove('token'); 
      
      // 2. KIỂM TRA ĐIỀU KIỆN: Chỉ xử lý chuyển hướng nếu CHƯA ở trang login
      if (window.location.pathname !== '/login-admin') {
        toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        window.location.href = '/login-admin'; 
      }
      
      return Promise.reject(error); 
    }

    if (error.response) {
      errorMessage = error.response.data.message || errorMessage;
    } else if (error.request) {
      errorMessage = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng của bạn.';
    } else {
      errorMessage = error.message;
    }

    // Tránh hiển thị toast lỗi 401 lặp lại nếu đang ở trang login
    if (error.response && error.response.status !== 401) {
        toast.error(errorMessage);
    } else if (!error.response || window.location.pathname !== '/login-admin') {
        // Chỉ hiện toast nếu không phải lỗi 401, hoặc là lỗi 401 nhưng không nằm ở trang login
        toast.error(errorMessage);
    }

    return Promise.reject(error);
  }
);


export default api;