// AdminTrainData/AdminFE/Pages/AdminDashboard/UserManagementPage.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import AuthService from '../../services/auth.service';
import { ShieldCheck, User, PlusCircle, Trash2, Edit, Search, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { toast } from 'react-toastify';
import './AdminDashboard.css';

// --- Reusable Components ---
const AdminHeader = ({ title }) => (
    <header className="admin-header">
        <h1 className="admin-header__title">{title}</h1>
    </header>
);

const LoadingSpinner = () => (
    <div className="loading-spinner"><div className="loading-spinner__icon"></div></div>
);

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">{title}</h3>
                    <button onClick={onClose} className="modal-close-btn">×</button>
                </div>
                <div className="modal-body">{children}</div>
            </div>
        </div>
    );
};

// --- User Modal for Add/Edit ---
const UserModal = ({ isOpen, onClose, onSave, user }) => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phone: '',
        role: 'user',
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (user) {
            setFormData({
                username: user.username || '',
                email: user.email || '',
                password: '', // Không hiển thị password cũ
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                phone: user.phone || '',
                role: user.role || 'user',
            });
        } else {
            setFormData({
                username: '', email: '', password: '',
                firstName: '', lastName: '', phone: '', role: 'user'
            });
        }
        setErrors({}); // Reset lỗi khi mở modal
    }, [user, isOpen]);

    const validate = () => {
        const newErrors = {};
        if (!formData.username) newErrors.username = "Tên đăng nhập là bắt buộc.";
        if (!formData.email.match(/^([\w.%+-]+)@([\w-]+\.)+([\w]{2,})$/i)) newErrors.email = "Email không hợp lệ.";
        if (!user && !formData.password) newErrors.password = "Mật khẩu là bắt buộc khi tạo mới.";
        if (formData.password && formData.password.length < 6) newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự.";
        return newErrors;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }
        onSave(formData);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={user ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}>
            <form onSubmit={handleSubmit} className="user-modal-form">
                <div className="form-group">
                    <label className="form-label">Tên đăng nhập *</label>
                    <input type="text" name="username" value={formData.username} onChange={handleChange} className="form-control" required disabled={!!user} />
                     {errors.username && <p className="form-error">{errors.username}</p>}
                </div>
                <div className="form-group">
                    <label className="form-label">Email *</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="form-control" required />
                     {errors.email && <p className="form-error">{errors.email}</p>}
                </div>
                 <div className="form-group">
                    <label className="form-label">Mật khẩu { !user && '*'}</label>
                    <input type="password" name="password" value={formData.password} onChange={handleChange} className="form-control" placeholder={user ? 'Để trống nếu không đổi' : ''} />
                     {errors.password && <p className="form-error">{errors.password}</p>}
                </div>
                <div className="form-grid-2">
                    <div className="form-group">
                        <label className="form-label">Họ</label>
                        <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="form-control" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Tên</label>
                        <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="form-control" />
                    </div>
                </div>
                <div className="form-group">
                    <label className="form-label">Số điện thoại</label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="form-control" />
                </div>
                 <div className="form-group">
                    <label className="form-label">Vai trò</label>
                    <select name="role" value={formData.role} onChange={handleChange} className="form-control">
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                        <option value="designer">Designer</option>
                        <option value="marketing">Marketing</option>
                    </select>
                </div>

                <div className="modal-footer">
                    <button type="button" onClick={onClose} className="btn btn-secondary">Hủy</button>
                    <button type="submit" className="btn btn-primary">Lưu</button>
                </div>
            </form>
        </Modal>
    );
};


// --- Main Page Component ---
const UserManagementPage = () => {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    
    // State for new features
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const usersPerPage = 10;

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const response = await AuthService.getUsers();
            if (response && Array.isArray(response)) {
                setUsers(response.sort((a, b) => a.username.localeCompare(b.username))); // Sắp xếp theo tên
            } else {
                 setError('Dữ liệu người dùng trả về không hợp lệ.');
            }
        } catch (err) {
            console.error("Không thể tải danh sách người dùng:", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // --- Event Handlers ---
    const handleOpenModal = (user = null) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
    };

    const handleSaveUser = async (userData) => {
        try {
            // ++ SỬA LỖI: Chỉ gửi mật khẩu nếu nó được nhập vào ++
            const dataToSend = { ...userData };
            if (!dataToSend.password) {
                delete dataToSend.password; // Không gửi trường password nếu rỗng
            }

            if (editingUser) {
                // Đảm bảo không gửi username khi cập nhật
                delete dataToSend.username;
                await AuthService.updateUser(editingUser._id, dataToSend);
                alert('Cập nhật người dùng thành công!');
            } else {
                await AuthService.addUser(dataToSend);
                alert('Thêm người dùng thành công!');
            }
            fetchUsers(); // Tải lại danh sách
            handleCloseModal();
        } catch (err) {
            alert(`Lỗi: ${err.response?.data?.message || err.message}`);
        }
    };

    const handleDeleteUser = async (userId, username) => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa người dùng "${username}"?`)) {
            try {
                await AuthService.deleteUser(userId);
                toast.success('Xóa người dùng thành công!'); 
                fetchUsers();
            } catch (err) {
                console.error("Lỗi khi xóa người dùng:", err);
            }
        }
    };

    
    // --- Filtering and Pagination Logic ---
    const filteredUsers = useMemo(() => {
        return users
            .filter(user => {
                const term = searchTerm.toLowerCase();
                const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
                return (
                    user.username.toLowerCase().includes(term) ||
                    user.email.toLowerCase().includes(term) ||
                    fullName.includes(term)
                );
            })
            .filter(user => {
                return roleFilter === 'all' || user.role === roleFilter;
            });
    }, [users, searchTerm, roleFilter]);

    const paginatedUsers = useMemo(() => {
        const startIndex = (currentPage - 1) * usersPerPage;
        return filteredUsers.slice(startIndex, startIndex + usersPerPage);
    }, [filteredUsers, currentPage, usersPerPage]);

    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);


    return (
        <div>
            <AdminHeader title="Quản lý Người dùng" />
            
            {/* Action Bar */}
            <div className="page-header-actions">
                <div className="search-and-filter">
                    <div className="search-box">
                       <Search size={20} className="search-box__icon" />
                       <input
                           type="text"
                           placeholder="Tìm kiếm theo tên, email..."
                           className="form-control"
                           value={searchTerm}
                           onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                       />
                    </div>
                    <select
                        className="form-control"
                        value={roleFilter}
                        onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
                    >
                        <option value="all">Tất cả vai trò</option>
                        <option value="admin">Admin</option>
                        <option value="user">User</option>
                        <option value="designer">Designer</option>
                        <option value="marketing">Marketing</option>
                    </select>
                </div>
                <button onClick={() => handleOpenModal()} className="btn btn-primary">
                    <PlusCircle size={20} /> Thêm người dùng
                </button>
            </div>
            
            {/* User Table */}
            <div className="table-container">
                {isLoading ? <LoadingSpinner /> : error ? <p className="error-message">{error}</p> : (
                    <>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Avatar</th>
                                <th>Tên đăng nhập</th>
                                <th>Email</th>
                                <th>Họ và Tên</th>
                                <th>Vai trò</th>
                                <th>Số điện thoại</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedUsers.map(user => (
                                <tr key={user._id}>
                                    <td>
                                        <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=random`} alt={user.username} className="table__image" style={{ borderRadius: '50%' }} />
                                    </td>
                                    <td>{user.username}</td>
                                    <td>{user.email}</td>
                                    <td>{`${user.lastName || ''} ${user.firstName || ''}`}</td>
                                    <td>
                                        <span className={`role-badge role-${user.role}`}>
                                            {user.role === 'admin' ? <ShieldCheck size={16} /> : <User size={16} />}
                                            {user.role}
                                        </span>
                                    </td>
                                    <td>{user.phone || 'N/A'}</td>
                                    <td className="table__actions">
                                        <button onClick={() => handleOpenModal(user)} className="edit-btn" title="Chỉnh sửa"><Edit size={20} /></button>
                                        <button onClick={() => handleDeleteUser(user._id, user.username)} className="delete-btn" title="Xóa"><Trash2 size={20} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="pagination-controls">
                             <span>Trang {currentPage} / {totalPages}</span>
                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                                <ChevronsLeft size={20}/>
                            </button>
                            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                               <ChevronsRight size={20}/>
                            </button>
                        </div>
                    )}
                    </>
                )}
            </div>
            
            <UserModal 
                isOpen={isModalOpen} 
                onClose={handleCloseModal} 
                onSave={handleSaveUser} 
                user={editingUser} 
            />
        </div>
    );
};

export default UserManagementPage;