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
  (response) => response, // Nếu thành công, không làm gì cả
  (error) => {
    let errorMessage = 'Đã có lỗi không mong muốn xảy ra. Vui lòng thử lại sau.';
    
    if (error.response && error.response.status === 401) {
      // 1. Xóa token rác trong cookie
      Cookies.remove('token'); 
      
      // 2. Thông báo cho người dùng
      toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      
      // 3. Đá văng ra trang đăng nhập
      // (Dùng window.location.href vì file này nằm ngoài React Router)
      window.location.href = '/login-admin'; 
      
      return Promise.reject(error); // Dừng luồng lỗi tại đây
    }
    if (error.response) {
      // Lỗi do server trả về (status code 4xx, 5xx)
      // Sử dụng message từ errorHandler của Backend
      errorMessage = error.response.data.message || errorMessage;
    } else if (error.request) {
      // Lỗi mạng, request đã gửi đi nhưng không nhận được phản hồi
      errorMessage = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng của bạn.';
    } else {
      // Lỗi khi thiết lập request
      errorMessage = error.message;
    }

    // Hiển thị thông báo lỗi bằng react-toastify
    toast.error(errorMessage);

    // Trả về một Promise bị từ chối để các lệnh .catch() trong component vẫn có thể hoạt động nếu cần
    return Promise.reject(error);
  }
);


export default api;