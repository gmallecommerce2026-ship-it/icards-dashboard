import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

const GmallProductPickerModal = ({ isOpen, onClose, onConfirm }) => {
    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetch('https://atm-elder-tag-celebrities.trycloudflare.com/store/products?limit=30&sort=sales')
                .then(res => res.json())
                .then(res => setProducts(res.data || []))
                .catch(err => console.error(err));
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="pe-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="pe-modal-content" style={{ background: '#fff', width: '500px', padding: '20px', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                    <h3>Chọn sản phẩm G-Mall</h3>
                    <button onClick={onClose}><X /></button>
                </div>
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {products.map(p => (
                        <div key={p.id} onClick={() => onConfirm(p)} style={{ display: 'flex', gap: '10px', padding: '10px', cursor: 'pointer', borderBottom: '1px solid #eee' }}>
                            <img src={p.images?.[0]} style={{ width: '50px', height: '50px', objectFit: 'cover' }} />
                            <div>
                                <div>{p.name}</div>
                                <div style={{ color: 'red' }}>{p.price.toLocaleString()}đ</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
export default GmallProductPickerModal;