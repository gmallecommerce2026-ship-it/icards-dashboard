import React, { useState } from 'react';
import api from '../../services/api'; // Đường dẫn tới axios instance của Admin
import { showSuccessToast, showErrorToast } from '../../Utils/toastHelper';

const AdminTemplateCard = ({ template, onTemplateUpdated }) => {
    const [isApproving, setIsApproving] = useState(false);

    // Hàm gọi API duyệt mẫu thiệp
    const handleApprove = async (e) => {
        e.stopPropagation(); // Ngăn chặn sự kiện click lan ra ngoài card
        setIsApproving(true);
        try {
            // Gọi API Update (sử dụng controller updateTemplate đã có sẵn của bạn)
            const response = await api.put(`/admin/invitation-templates/${template._id}`, { 
                isActive: true 
            });
            
            showSuccessToast('Đã duyệt mẫu thiệp thành công!');
            // Báo cho component cha biết để update lại list mà không cần reload trang
            if(onTemplateUpdated) onTemplateUpdated(response.data.data);
            
        } catch (error) {
            showErrorToast('Lỗi khi duyệt mẫu thiệp!');
            console.error(error);
        } finally {
            setIsApproving(false);
        }
    };

    return (
        <div className="template-card-container" style={{ position: 'relative', overflow: 'hidden', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', backgroundColor: '#fff', transition: 'all 0.3s' }}>
            
            {/* LỚP OVERLAY TRẠNG THÁI (Chỉ hiện khi isActive === false) */}
            {!template.isActive && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.45)', // Nền tối làm nổi bật nút
                    zIndex: 10, display: 'flex', flexDirection: 'column', 
                    justifyContent: 'flex-start', alignItems: 'flex-end', padding: '12px'
                }}>
                    {/* Huy hiệu (Badge) Trạng Thái */}
                    <div style={{
                        backgroundColor: '#FFFBEB', color: '#D97706', padding: '4px 12px',
                        borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                        ● Đang ẩn (Chưa duyệt)
                    </div>

                    {/* Nút DUYỆT NGAY tinh tế */}
                    <button 
                        onClick={handleApprove}
                        disabled={isApproving}
                        style={{
                            backgroundColor: '#27548A', color: '#fff', border: 'none',
                            padding: '8px 16px', borderRadius: '6px', cursor: 'pointer',
                            fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px',
                            opacity: isApproving ? 0.7 : 1, transition: 'all 0.2s',
                            boxShadow: '0 4px 6px rgba(39, 84, 138, 0.3)'
                        }}
                    >
                        {isApproving ? 'Đang duyệt...' : '✓ Duyệt ngay'}
                    </button>
                </div>
            )}

            {/* ẢNH THUMBNAIL CỦA THIỆP */}
            <img 
                src={template.imgSrc || 'https://placehold.co/400x300?text=No+Image'} 
                alt={template.title}
                style={{ width: '100%', height: '220px', objectFit: 'cover', display: 'block' }}
            />

            {/* THÔNG TIN THIỆP */}
            <div style={{ padding: '16px' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#333', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {template.title}
                </h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#666' }}>
                    <span>{template.category}</span>
                    <span style={{ color: template.isActive ? '#10B981' : '#666', fontWeight: template.isActive ? 'bold' : 'normal' }}>
                        {template.isActive ? 'Đang hiển thị' : 'Đang ẩn'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default AdminTemplateCard;