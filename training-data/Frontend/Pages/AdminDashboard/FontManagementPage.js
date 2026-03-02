// TrainData/AdminFE/Pages/AdminDashboard/FontManagementPage.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import { PlusCircle, Trash2, Upload, UploadCloud, Search, Edit, Save, X } from 'lucide-react';
import AuthService from '../../services/auth.service';
import './AdminDashboard.css';

// ... (Modal BulkAddFontModal giữ nguyên) ...
const BulkAddFontModal = ({ isOpen, onClose, onSave }) => {
    const [files, setFiles] = useState([]); // Lưu trữ { id, file, name, category }

    useEffect(() => {
        if (!isOpen) setFiles([]);
    }, [isOpen]);

    const handleFileChange = (e) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files).map(file => {
                const nameWithoutExtension = file.name.split('.').slice(0, -1).join('.');
                return {
                    id: `${file.name}-${file.lastModified}`,
                    file: file,
                    name: nameWithoutExtension,
                    category: 'Custom'
                };
            });
            setFiles(prev => [...prev, ...newFiles]);
        }
    };

    const handleUpdate = (id, field, value) => {
        setFiles(prev => prev.map(f => f.id === id ? { ...f, [field]: value } : f));
    };

    const handleRemove = (id) => {
        setFiles(prev => prev.filter(f => f.id !== id));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (files.length === 0) {
            toast.warn('Vui lòng chọn ít nhất một file font.');
            return;
        }
        const metadata = files.map(({ name, category }) => ({ name, category }));
        onSave(files, metadata);
    };

    return (
        <div className={`modal-overlay ${isOpen ? '' : 'hidden'}`} style={{ display: isOpen ? 'flex' : 'none' }}>
            <div className="modal-content modal-content--large" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">Thêm Font hàng loạt</h3>
                    <button onClick={onClose} className="modal-close-btn">×</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                        <div className="form-group">
                            <label className="btn btn-secondary">
                                <Upload size={16} /> Chọn nhiều file font
                                <input type="file" accept=".ttf,.otf,.woff,.woff2" multiple hidden onChange={handleFileChange} />
                            </label>
                        </div>
                        <div className="table-container minimal-table" style={{ marginTop: '1rem' }}>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Tên File</th>
                                        <th>Tên Font sẽ lưu *</th>
                                        <th>Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {files.map(f => (
                                        <tr key={f.id}>
                                            <td>{f.file.name}</td>
                                            <td><input type="text" value={f.name} onChange={(e) => handleUpdate(f.id, 'name', e.target.value)} className="form-control" required /></td>
                                            <td><button type="button" onClick={() => handleRemove(f.id)} className="delete-btn" title="Xóa"><Trash2 size={20} /></button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="btn btn-secondary">Hủy</button>
                        <button type="submit" className="btn btn-primary">Lưu tất cả</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// === BẮT ĐẦU NÂNG CẤP COMPONENT CHÍNH ===

const FontManagementPage = () => {
    const [fonts, setFonts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newFontName, setNewFontName] = useState('');
    const [newFontFile, setNewFontFile] = useState(null);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

    // State mới cho các tính năng nâng cao
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFonts, setSelectedFonts] = useState({});
    const [editingFontId, setEditingFontId] = useState(null);
    const [editingFontName, setEditingFontName] = useState('');

    const fetchFonts = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await AuthService.getFonts();
            setFonts(data);
        } catch (error) {
            toast.error("Không thể tải danh sách font.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFonts();
    }, [fetchFonts]);

    // Lọc font dựa trên searchTerm
    const filteredFonts = useMemo(() =>
        fonts.filter(font =>
            font.name.toLowerCase().includes(searchTerm.toLowerCase())
        ), [fonts, searchTerm]);

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setNewFontFile(e.target.files[0]);
            const fileName = e.target.files[0].name.split('.').slice(0, -1).join('.');
            setNewFontName(fileName);
        }
    };

    const handleAddFont = async (e) => {
        e.preventDefault();
        if (!newFontName || !newFontFile) {
            toast.warn("Vui lòng nhập tên và chọn file font.");
            return;
        }
        try {
            await AuthService.addFont({ name: newFontName, fontFile: newFontFile, category: 'Custom' });
            toast.success("Thêm font mới thành công!");
            setNewFontName('');
            setNewFontFile(null);
            document.getElementById('font-file-input').value = '';
            fetchFonts();
        } catch (error) {
            toast.error(error.response?.data?.message || "Thêm font thất bại.");
        }
    };

    // Xử lý chọn/bỏ chọn một font
    const handleSelectFont = (fontId) => {
        setSelectedFonts(prev => {
            const newSelected = { ...prev };
            if (newSelected[fontId]) {
                delete newSelected[fontId];
            } else {
                newSelected[fontId] = true;
            }
            return newSelected;
        });
    };

    // Xử lý chọn/bỏ chọn tất cả
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allFontIds = filteredFonts.reduce((acc, font) => {
                acc[font._id] = true;
                return acc;
            }, {});
            setSelectedFonts(allFontIds);
        } else {
            setSelectedFonts({});
        }
    };

    // Xử lý xóa hàng loạt
    const handleBulkDelete = async () => {
        const idsToDelete = Object.keys(selectedFonts);
        if (idsToDelete.length === 0) {
            toast.warn("Vui lòng chọn ít nhất một font để xóa.");
            return;
        }
        if (window.confirm(`Bạn có chắc muốn xóa ${idsToDelete.length} font đã chọn không?`)) {
            try {
                await AuthService.bulkDeleteFonts(idsToDelete);
                toast.success(`Đã xóa ${idsToDelete.length} font.`);
                setSelectedFonts({});
                fetchFonts();
            } catch (error) {
                toast.error(error.response?.data?.message || "Xóa hàng loạt thất bại.");
            }
        }
    };

    // Bắt đầu chỉnh sửa tên
    const handleStartEdit = (font) => {
        setEditingFontId(font._id);
        setEditingFontName(font.name);
    };

    // Hủy chỉnh sửa
    const handleCancelEdit = () => {
        setEditingFontId(null);
        setEditingFontName('');
    };

    // Lưu tên mới
    const handleSaveEdit = async (fontId) => {
        if (!editingFontName.trim()) {
            toast.warn("Tên font không được để trống.");
            return;
        }
        try {
            await AuthService.updateFont(fontId, { name: editingFontName });
            toast.success("Cập nhật tên font thành công!");
            handleCancelEdit();
            fetchFonts();
        } catch (error) {
            toast.error(error.response?.data?.message || "Cập nhật thất bại.");
        }
    };


    const handleSaveBulkFonts = async (files, metadata) => {
        try {
            await AuthService.bulkAddFonts(files, metadata);
            toast.success("Thêm các font mới thành công!");
            setIsBulkModalOpen(false);
            fetchFonts();
        } catch (error) {
            toast.error(error.response?.data?.message || "Thêm hàng loạt thất bại.");
        }
    };

    const selectedCount = Object.keys(selectedFonts).length;
    const isAllSelected = filteredFonts.length > 0 && selectedCount === filteredFonts.length;

    return (
        <div>
            <header className="admin-header">
                <h1 className="admin-header__title">Quản lý Font chữ</h1>
            </header>

            <div className="card settings-card" style={{ marginTop: '1.5rem' }}>
                <h3 className="card__title">Thêm Font mới</h3>
                <form onSubmit={handleAddFont} className="form-grid-2-col">
                     <div className="form-group">
                        <label className="form-label">Tên Font</label>
                        <input type="text" className="form-control" value={newFontName} onChange={(e) => setNewFontName(e.target.value)} placeholder="VD: My Awesome Font" required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">File Font (.ttf, .otf, .woff, .woff2)</label>
                        <input id="font-file-input" type="file" className="form-control" onChange={handleFileChange} accept=".ttf,.otf,.woff,.woff2" required />
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <button type="submit" className="btn btn-primary" disabled={isLoading}><PlusCircle size={20} /> Thêm</button>
                        <button type="button" onClick={() => setIsBulkModalOpen(true)} className="btn btn-secondary" style={{ marginTop: '1rem' }}><UploadCloud size={20} /> Thêm hàng loạt</button>
                    </div>
                </form>
            </div>

            <div className="page-header-actions">
                 <div className="search-box" style={{ flexGrow: 1 }}>
                    <Search size={20} className="search-box__icon" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo tên font..."
                        className="form-control"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                {selectedCount > 0 && (
                     <button onClick={handleBulkDelete} className="btn btn-danger">
                        <Trash2 size={20} /> Xóa {selectedCount} mục đã chọn
                    </button>
                )}
            </div>

            <div className="table-container" style={{ marginTop: '1.5rem' }}>
                {isLoading ? <p>Đang tải...</p> : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th style={{width: '50px'}}><input type="checkbox" checked={isAllSelected} onChange={handleSelectAll} /></th>
                                <th>Tên Font</th>
                                <th>Ví dụ</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredFonts.map(font => (
                                <tr key={font._id}>
                                    <td><input type="checkbox" checked={!!selectedFonts[font._id]} onChange={() => handleSelectFont(font._id)} /></td>
                                    <td onDoubleClick={() => handleStartEdit(font)}>
                                        {editingFontId === font._id ? (
                                            <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                                                <input 
                                                    type="text" 
                                                    value={editingFontName} 
                                                    onChange={(e) => setEditingFontName(e.target.value)}
                                                    className="form-control form-control--inline"
                                                    autoFocus
                                                    onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(font._id)}
                                                />
                                                <button onClick={() => handleSaveEdit(font._id)} className="action-btn-icon"><Save size={18}/></button>
                                                <button onClick={handleCancelEdit} className="action-btn-icon"><X size={18}/></button>
                                            </div>
                                        ) : (
                                            <strong>{font.name}</strong>
                                        )}
                                    </td>
                                    <td style={{ fontFamily: `"${font.name}", sans-serif`, fontSize: '1.2rem' }}>
                                        <style>{`
                                            @font-face {
                                                font-family: "${font.name}";
                                                src: url('${font.url}') format('woff2'),
                                                     url('${font.url}') format('woff'),
                                                     url('${font.url}') format('truetype');
                                            }
                                        `}</style>
                                        ABC abc 123
                                    </td>
                                    <td className="table__actions">
                                        <button onClick={() => handleStartEdit(font)} className="edit-btn" title="Sửa tên"><Edit size={20} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <BulkAddFontModal isOpen={isBulkModalOpen} onClose={() => setIsBulkModalOpen(false)} onSave={handleSaveBulkFonts} />
        </div>
    );
};
// === KẾT THÚC NÂNG CẤP ===

export default FontManagementPage;