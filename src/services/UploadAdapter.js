// src/services/UploadAdapter.js (Tạo file mới)
import api from './api'; // Sử dụng instance axios đã cấu hình của bạn

class UploadAdapter {
    constructor(loader) {
        // Trình tải tệp CKEditor giữ tệp để tải lên.
        this.loader = loader;
    }

    // Bắt đầu quá trình tải lên.
    upload() {
        return this.loader.file
            .then(file => new Promise((resolve, reject) => {
                const formData = new FormData();
                // Tên trường 'upload' là mặc định của CKEditor, bạn có thể cần thay đổi
                // tùy theo yêu cầu của API backend.
                formData.append('upload', file);

                // Giả sử bạn có một endpoint là '/upload-image' để xử lý việc tải ảnh.
                // Bạn cần tạo endpoint này ở phía backend.
                api.post('/admin/pages/upload-image', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                })
                .then(response => {
                    // Nếu tải lên thành công, resolve Promise với URL của ảnh.
                    // Backend của bạn phải trả về một đối tượng có thuộc tính 'url'
                    // hoặc 'default'. Ví dụ: { "url": "http://example.com/image.png" }
                    if (response.data && response.data.url) {
                        resolve({
                            default: response.data.url
                        });
                    } else {
                        reject('Phản hồi từ máy chủ không chứa URL ảnh.');
                    }
                })
                .catch(error => {
                    // Xử lý lỗi từ server
                    const message = error.response?.data?.message || 'Không thể tải ảnh lên.';
                    reject(message);
                });
            }));
    }

    // Hủy bỏ quá trình tải lên.
    abort() {
        // Logic để hủy yêu cầu tải lên (nếu API của bạn hỗ trợ).
        // Ví dụ với Axios AbortController.
        console.log('Upload aborted.');
    }
}

export default UploadAdapter;