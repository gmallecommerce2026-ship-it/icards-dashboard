// AdminTrainData/AdminFE/Pages/AdminLogin/AdminLoginPage.js

import React, { useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../AdminDashboard/AdminDashboard'; // Import AuthContext
import './AdminLoginPage.css';

const AdminLoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useContext(AuthContext); // Lấy hàm login từ context

    // Lấy đường dẫn trang trước đó, nếu không có thì mặc định là /dashboard
    const from = location.state?.from?.pathname || "/dashboard";

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(username, password);
            navigate(from, { replace: true });
        } catch (err) {
            const message = err.response?.data?.message || 'Username hoặc mật khẩu không chính xác.';
            setError(message); 
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-login-container">
            <div className="admin-login-box">
                <h2>Đăng Nhập Trang Quản Trị iCard</h2>
                <form onSubmit={handleLogin}>
                    <div className="input-group">
                        <label htmlFor="username">Tên đăng nhập</label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            placeholder="Nhập tên đăng nhập của admin"
                        />
                    </div>
                    <div className="input-group">
                        <label htmlFor="password">Mật khẩu</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="Nhập mật khẩu"
                        />
                    </div>
                    {error && <p className="error-message">{error}</p>}
                    <button type="submit" className="login-button" disabled={loading}>
                        {loading ? 'Đang xử lý...' : 'Đăng Nhập'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminLoginPage;