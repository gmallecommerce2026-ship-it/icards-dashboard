// FE/utils/toastHelper.js
import { toast } from 'react-toastify';

// Tùy chọn chung cho tất cả thông báo
const toastOptions = {
  position: "bottom-right",
  autoClose: 4000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  theme: "light",
};

/**
 * Hiển thị thông báo thành công.
 * @param {string} message - Nội dung thông báo.
 */
export const showSuccessToast = (message) => {
  toast.success(message, toastOptions);
};

/**
 * Hiển thị thông báo lỗi.
 * @param {string} message - Nội dung thông báo.
 */
export const showErrorToast = (message) => {
  toast.error(message, toastOptions);
};

/**
 * Hiển thị thông báo thông tin.
 * @param {string} message - Nội dung thông báo.
 */
export const showInfoToast = (message) => {
  toast.info(message, toastOptions);
};

/**
 * Xử lý và hiển thị thông báo cho một promise (hành động bất đồng bộ).
 * @param {Promise} promise - Promise cần xử lý.
 * @param {object} messages - Các thông điệp cho trạng thái pending, success, error.
 * @returns {Promise}
 */
export const handlePromiseToast = (promise, messages) => {
    return toast.promise(
        promise,
        {
            pending: messages.pending || 'Đang xử lý...',
            success: messages.success || 'Thành công!',
            error: {
                render({data}){
                    // Ưu tiên hiển thị lỗi validation từ server
                    if (data.response?.data?.errors) {
                        return data.response.data.errors[0].msg;
                    }
                    // Hiển thị lỗi chung từ server hoặc một message mặc định
                    return data.response?.data?.message || messages.error || 'Có lỗi xảy ra!';
                }
            }
        },
        toastOptions
    );
};