// InvitationDesign/Components/Content/PreviewModal.js
import React from 'react';
import { Dialog, DialogContent, DialogActions, Button, Box, IconButton, Typography } from '@mui/material';
import { X as CloseIcon } from 'lucide-react';
import FullInvitationPreview from './FullInvitationPreview.js';

const PreviewModal = ({ open, onClose, onConfirm, pages, invitationSettings, saving }) => {
    return (
        <Dialog
            fullScreen
            open={open}
            onClose={onClose}
            PaperProps={{ sx: { background: '#fdfcf9' } }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px', borderBottom: '1px solid #e0e0e0', background: '#fff' }}>
                 <Typography variant="h6">Xem trước & Xác nhận</Typography>
                 <IconButton onClick={onClose}><CloseIcon /></IconButton>
            </Box>
            
            <DialogContent sx={{ p: 0 }}>
                {/* FullInvitationPreview nhận và hiển thị dữ liệu trực tiếp từ props,
                  đảm bảo đây là dữ liệu mới nhất mà người dùng đang chỉnh sửa.
                */}
                <FullInvitationPreview 
                    pages={pages} 
                    invitationSettings={invitationSettings} 
                />
            </DialogContent>
            
            <DialogActions sx={{ padding: '1rem 1.5rem', borderTop: '1px solid #e0e0e0', background: '#fff' }}>
                <Button onClick={onClose} variant="outlined">Chỉnh sửa lại</Button>
                <Button onClick={onConfirm} variant="contained" color="primary" disabled={saving}>
                    {saving ? 'Đang lưu...' : 'Xác nhận & Lưu'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default PreviewModal;