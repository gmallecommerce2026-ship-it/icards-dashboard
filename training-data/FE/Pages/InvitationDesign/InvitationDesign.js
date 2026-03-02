// src/Pages/InvitationDesign/InvitationDesign.js
import DesignContent from './Components/Content/DesignContent';
import { ThemeProvider, createTheme, alpha } from '@mui/material/styles';
import './InvitationDesign.css';

// --- THEME MỚI: TỐI GIẢN VÀ HIỆN ĐẠI ---
// Một bảng màu mới, gọn gàng hơn với các tông màu trung tính và một màu nhấn hiện đại.
// Font chữ 'Inter' được chọn vì sự sạch sẽ và dễ đọc.
const minimalistTheme = createTheme({
    palette: {
        primary: {
            main: '#3B82F6', // Xanh dương nhẹ, hiện đại
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#E5E7EB', // Xám nhạt cho nền phụ
            contrastText: '#1F2937', // Xám đậm cho văn bản
        },
        background: {
            default: '#F9FAFB', // Nền chính rất nhạt
            paper: '#FFFFFF',   // Nền cho các component như Card, Sidebar
        },
        text: {
            primary: '#111827',   // Màu chữ chính (đen gần)
            secondary: '#6B7280', // Màu chữ phụ (xám)
        },
        divider: '#E5E7EB', // Màu đường kẻ phân cách
        success: {
            main: '#10B981', // Xanh lá cây cho nút thành công
        },
        error: {
            main: '#EF4444', // Đỏ cho thông báo lỗi
        }
    },
    typography: {
        fontFamily: "'Inter', sans-serif", // Font chữ hiện đại, sạch sẽ
        h6: {
            fontWeight: 600, // Tăng độ đậm cho tiêu đề
        },
        button: {
            textTransform: 'none',
            fontWeight: 600,
        },
    },
    components: {
        // Tùy chỉnh cho các component của Material-UI để phù hợp với theme
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8, // Bo tròn góc nhẹ
                },
                containedPrimary: {
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: 'none',
                        backgroundColor: alpha('#3B82F6', 0.9),
                    }
                },
            }
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    border: '1px solid #E5E7EB', // Thêm viền nhẹ cho Paper
                },
                elevation1: {
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', // Đổ bóng nhẹ
                },
                elevation2: {
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
                }
            }
        },
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    border: 'none',
                }
            }
        },
        MuiSlider: {
            styleOverrides: {
                root: {
                    color: '#3B82F6',
                }
            }
        },
        MuiTooltip: {
            styleOverrides: {
                tooltip: {
                    backgroundColor: '#1F2937',
                    borderRadius: 4,
                    fontSize: '0.75rem',
                }
            }
        }
    }
});


export default function Design() {
    return (
        <>
            <ThemeProvider theme={minimalistTheme}>
                <DesignContent />
            </ThemeProvider>
        </>
    )
}