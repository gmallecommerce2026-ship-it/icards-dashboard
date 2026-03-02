import React, { useState, useMemo } from 'react';
import { Modal, Button, Input, Typography, Alert, Space } from 'antd';
import authService from '../../services/auth.service';

const { Text, Paragraph } = Typography;

const BulkDeleteModal = ({ visible, onCancel, filters }) => {
    const [confirmText, setConfirmText] = useState('');
    const [loading, setLoading] = useState(false);

    // Tạo câu xác nhận và thông điệp cảnh báo dựa trên bộ lọc
    const { confirmationPhrase, alertMessage } = useMemo(() => {
        if (!filters || Object.keys(filters).every(k => !filters[k])) {
            return { confirmationPhrase: '', alertMessage: '' };
        }

        const { category, group, type } = filters;
        let phrase = 'xoá';
        let alert = 'Bạn sắp xóa TẤT CẢ thiệp mời';

        if (type) {
            phrase += ` loại ${type}`;
            alert += ` thuộc loại "${type}"`;
        }
        if (group) {
            phrase += ` trong nhóm ${group}`;
            alert += `, trong nhóm "${group}"`;
        }
        if (category) {
            phrase += ` thuộc danh mục ${category}`;
            alert += `, thuộc danh mục "${category}"`;
        }
        
        return { confirmationPhrase: phrase, alertMessage: alert + '.' };
    }, [filters]);

    const isConfirmationValid = confirmText === confirmationPhrase;

    const handleOk = async () => {
        setLoading(true);
        try {
            await authService.bulkDeleteTemplatesByFilter(filters);
            onCancel(true); // Đóng modal và báo hiệu thành công
        } catch (error) {
            console.error("Lỗi xóa hàng loạt:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setConfirmText('');
        onCancel();
    };

    return (
        <Modal
            title="XÁC NHẬN HÀNH ĐỘNG NGUY HIỂM"
            visible={visible}
            onCancel={handleCancel}
            footer={[
                <Button key="back" onClick={handleCancel} disabled={loading}>
                    Hủy
                </Button>,
                <Button
                    key="submit"
                    type="primary"
                    danger
                    loading={loading}
                    onClick={handleOk}
                    disabled={!isConfirmationValid}
                >
                    Tôi hiểu rủi ro, Xác nhận xóa
                </Button>,
            ]}
        >
            <Space direction="vertical" style={{ width: '100%' }}>
                <Alert
                    message="Cảnh báo!"
                    description={alertMessage}
                    type="error"
                    showIcon
                />
                <Paragraph>
                    Hành động này <Text strong>KHÔNG THỂ HOÀN TÁC</Text>. Để tiếp tục, vui lòng nhập chính xác câu sau vào ô bên dưới:
                </Paragraph>
                <Paragraph strong code>
                    {confirmationPhrase}
                </Paragraph>
                <Input
                    placeholder="Nhập câu xác nhận tại đây"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    disabled={loading}
                />
            </Space>
        </Modal>
    );
};

export default BulkDeleteModal;