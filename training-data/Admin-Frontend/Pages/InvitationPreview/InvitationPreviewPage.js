// AdminFE/Pages/InvitationDesign/InvitationPreviewPage.js
import React, { useEffect, useState } from 'react';
import FullInvitationPreview from '../InvitationDesign/Components/Content/FullInvitationPreview';
import { Box, Typography, CircularProgress } from '@mui/material';


const InvitationPreviewPage = () => {
    const [previewData, setPreviewData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Đọc dữ liệu thiệp mời từ localStorage khi trang được tải
        try {
            const data = localStorage.getItem('invitationPreviewData');
            if (data) {
                setPreviewData(JSON.parse(data));
            }
        } catch (error) {
            console.error("Lỗi khi đọc dữ liệu xem trước:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
    }

    if (!previewData) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Typography variant="h5">Không tìm thấy dữ liệu xem trước.</Typography>
            </Box>
        );
    }

    return (
        <FullInvitationPreview
            pages={previewData.pages}
            invitationSettings={previewData.invitationSettings}
        />
    );
};

export default InvitationPreviewPage;