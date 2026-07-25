import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

const GmallProductModal = ({ onClose, onSelect }) => {
    const [keyword, setKeyword] = useState('');
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchProducts = async (searchQuery = '') => {
        setLoading(true);
        try {
            const url = `https://atm-elder-tag-celebrities.trycloudflare.com/store/products?limit=30&sort=sales${searchQuery ? `&keyword=${searchQuery}` : ''}`;
            const response = await fetch(url);
            const result = await response.json();
            setProducts(result.data || []);
        } catch (error) {
            console.error("Lỗi tải sản phẩm:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts(); // Tải sản phẩm bán chạy nhất lúc vừa mở Modal
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchProducts(keyword);
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', zIndex: 99999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ backgroundColor: '#ffffff', borderRadius: '4px', width: '600px', maxWidth: '95%', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
                
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>Chèn Sản Phẩm G-Mall</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20}/></button>
                </div>
                
                {/* Search Bar */}
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
                    <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px' }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: '#94a3b8' }} />
                            <input 
                                type="text" 
                                value={keyword} 
                                onChange={e => setKeyword(e.target.value)} 
                                placeholder="Tìm kiếm tên sản phẩm..."
                                style={{ width: '100%', padding: '8px 12px 8px 36px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '14px', outline: 'none' }}
                            />
                        </div>
                        <button type="submit" disabled={loading} style={{ padding: '8px 16px', backgroundColor: '#0f172a', color: '#ffffff', border: 'none', borderRadius: '4px', fontSize: '14px', cursor: 'pointer' }}>
                            Tìm kiếm
                        </button>
                    </form>
                </div>

                {/* Danh sách sản phẩm */}
                <div style={{ padding: '12px 20px', overflowY: 'auto', flex: 1, backgroundColor: '#f8fafc' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>Đang tải dữ liệu...</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {products.map(prod => (
                                <div 
                                    key={prod.id} 
                                    onClick={() => onSelect(prod)} 
                                    style={{ display: 'flex', gap: '16px', padding: '12px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    <img 
                                        src={prod.images?.[0] || 'https://via.placeholder.com/60'} 
                                        alt={prod.name} 
                                        style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #f1f5f9' }} 
                                    />
                                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                        <div style={{ fontSize: '14px', fontWeight: 500, color: '#1e293b', marginBottom: '4px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {prod.name}
                                        </div>
                                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#ef4444' }}>
                                            {new Intl.NumberFormat('vi-VN').format(prod.price)} đ
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {products.length === 0 && <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>Không có sản phẩm nào.</div>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GmallProductModal;