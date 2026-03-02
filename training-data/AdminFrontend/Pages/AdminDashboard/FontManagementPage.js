// TrainData/AdminFE/Pages/AdminDashboard/FontManagementPage.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import { PlusCircle, Trash2, UploadCloud, Search, Edit, Save, X, AlertTriangle, CheckCircle, SkipForward } from 'lucide-react';
import AuthService from '../../services/auth.service';
import './AdminDashboard.css';

const FONT_CATEGORIES = [
    { id: 'all', label: 'Tất cả' },
    { id: 'Wedding', label: 'Font cưới' },
    { id: 'Uppercase', label: 'Font viết hoa' },
    { id: 'Vietnamese', label: 'Font tiếng Việt' },
    { id: 'General', label: 'Khác' }
];
// ... (Modal BulkAddFontModal Giữ nguyên code cũ của bạn ở đoạn này) ...
const BulkAddFontModal = ({ isOpen, onClose, onSave }) => {
    const [files, setFiles] = useState([]);

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
                    category: 'General'
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
                                <UploadCloud size={16} /> Chọn nhiều file font
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
                                            {/* THÊM MỚI: Chọn category cho từng file */}
                                            <td>
                                                <select value={f.category} onChange={(e) => handleUpdate(f.id, 'category', e.target.value)} className="form-control">
                                                    <option value="Wedding">Cưới</option>
                                                    <option value="Uppercase">Viết hoa</option>
                                                    <option value="Vietnamese">Tiếng Việt</option>
                                                    <option value="General">Khác</option>
                                                </select>
                                            </td>
                                            <td><button type="button" onClick={() => handleRemove(f.id)} className="delete-btn"><Trash2 size={20} /></button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="btn btn-secondary">Hủy</button>
                        <button type="submit" className="btn btn-primary">Tải lên</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// === COMPONENT MODAL GIẢI QUYẾT XUNG ĐỘT (MỚI) ===
const ConflictResolveModal = ({ conflictData, onOverwrite, onSkip, onCancel }) => {
    if (!conflictData) return null;

    return (
        <div className="modal-overlay" style={{ display: 'flex', zIndex: 1100 }}>
            <div className="modal-content" style={{ maxWidth: '600px', width: '90%' }}>
                <div className="modal-header" style={{ borderBottom: '1px solid #ffcc00', backgroundColor: '#fffbe6' }}>
                    <h3 className="modal-title" style={{ color: '#d48806', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <AlertTriangle size={24} /> Phát hiện trùng lặp Font
                    </h3>
                    <button onClick={onCancel} className="modal-close-btn">×</button>
                </div>
                <div className="modal-body">
                    <p style={{ marginBottom: '1rem' }}>
                        Hệ thống phát hiện <strong>{conflictData.duplicates.length}</strong> font có tên đã tồn tại trong hệ thống:
                    </p>
                    <div style={{ 
                        backgroundColor: '#f5f5f5', 
                        padding: '10px', 
                        borderRadius: '6px', 
                        maxHeight: '200px', 
                        overflowY: 'auto',
                        marginBottom: '1.5rem',
                        border: '1px solid #e0e0e0'
                    }}>
                        <ul style={{ paddingLeft: '20px', margin: 0 }}>
                            {conflictData.duplicates.map((name, idx) => (
                                <li key={idx} style={{ marginBottom: '4px', color: '#d9363e', fontWeight: 500 }}>{name}</li>
                            ))}
                        </ul>
                    </div>
                    <p>Bạn muốn xử lý như thế nào?</p>
                </div>
                <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
                    <button onClick={onCancel} className="btn btn-secondary">Hủy bỏ</button>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={onSkip} className="btn btn-outline-primary" style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                            <SkipForward size={16} /> Bỏ qua font trùng
                        </button>
                        <button onClick={onOverwrite} className="btn btn-danger" style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                            <CheckCircle size={16} /> Ghi đè tất cả
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// === COMPONENT CHÍNH ===
const FontManagementPage = () => {
    const [fonts, setFonts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newFontName, setNewFontName] = useState('');
    const [newFontFile, setNewFontFile] = useState(null);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

    // State cho tìm kiếm & edit
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFonts, setSelectedFonts] = useState({});
    const [editingFontId, setEditingFontId] = useState(null);
    const [editingFontName, setEditingFontName] = useState('');

    // State mới: Lưu trữ thông tin khi gặp lỗi trùng lặp
    const [conflictData, setConflictData] = useState(null); // { files, metadata, duplicates }

    const [activeTab, setActiveTab] = useState('all');
    const [newFontCategory, setNewFontCategory] = useState('General');
    const [editingCategory, setEditingCategory] = useState('');


    const handleBulkUpdateCategory = async () => {
        // Lấy danh sách ID các font đang được tick chọn
        const ids = Object.keys(selectedFonts);
        if (!ids.length) return toast.warn("Chưa chọn font nào để cập nhật.");

        // Lấy giá trị category mới từ thẻ <select>
        const selectElement = document.getElementById('bulk-category-select');
        const newCategory = selectElement ? selectElement.value : null;

        if (!newCategory) return toast.warn("Vui lòng chọn loại font mới.");

        if (window.confirm(`Bạn có chắc muốn đổi loại thành "${newCategory}" cho ${ids.length} font đã chọn?`)) {
            try {
                // Gọi API cập nhật
                await AuthService.bulkUpdateFontCategory(ids, newCategory);
                
                toast.success("Cập nhật phân loại thành công.");
                setSelectedFonts({}); // Bỏ chọn các checkbox
                fetchFonts();         // Tải lại danh sách
            } catch (error) {
                toast.error(error.response?.data?.message || "Lỗi cập nhật phân loại.");
            }
        }
    };
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

    const filteredFonts = useMemo(() =>
    fonts.filter(font => {
        const matchesSearch = font.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTab = activeTab === 'all' || font.category === activeTab;
        return matchesSearch && matchesTab;
    }), [fonts, searchTerm, activeTab]);

    // ... (Các hàm handleSelectFont, handleSelectAll, handleBulkDelete, handleEdit giữ nguyên) ...
    // Để tiết kiệm không gian, tôi giả định bạn giữ nguyên các hàm xử lý cơ bản (delete, edit, select)
    // Nếu cần chép lại toàn bộ hãy báo tôi. Dưới đây là các hàm logic chính cần thay đổi:

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
            // SỬA LỖI: Truyền newFontCategory thay vì 'Custom'
            await AuthService.addFont({ 
                name: newFontName, 
                fontFile: newFontFile, 
                category: newFontCategory // <--- Thay đổi ở đây
            });
            toast.success("Thêm font mới thành công!");
            setNewFontName('');
            setNewFontFile(null);
            setNewFontCategory('General'); // Reset lại category mặc định
            document.getElementById('font-file-input').value = '';
            fetchFonts();
        } catch (error) {
            if (error.response?.status === 409) {
                toast.error("Tên font đã tồn tại!");
            } else {
                toast.error("Thêm font thất bại!");
            }
        }
    };

    // --- LOGIC XỬ LÝ UPLOAD HÀNG LOẠT & XUNG ĐỘT ---

    // 1. Hàm gọi API gốc
    const processBulkUpload = async (files, metadata, overwrite) => {
        // Bật loading toàn trang (hoặc bảng) để user biết đang xử lý
        setIsLoading(true); 

        try {
            const res = await AuthService.bulkAddFonts(files, metadata, overwrite);
            toast.success(res.message || "Xử lý thành công!");
            
            // setIsBulkModalOpen(false); // <-- XÓA DÒNG NÀY (Vì đã đóng ở hàm trên rồi)
            setConflictData(null); 
            
            // Tải lại danh sách sau khi xong
            await fetchFonts(); 
        } catch (error) {
            // Bắt lỗi 409 từ Backend trả về
            if (error.response && error.response.status === 409 && error.response.data.code === 'DUPLICATE_FONTS') {
                setConflictData({
                    files,
                    metadata,
                    duplicates: error.response.data.duplicates
                });
                // Lưu ý: Lúc này isLoading sẽ tắt (ở finally), 
                // Modal Conflict sẽ hiện lên đè lên danh sách font.
            } else {
                toast.error(error.response?.data?.message || "Thêm hàng loạt thất bại.");
            }
        } finally {
            // Tắt loading dù thành công hay thất bại để hiển thị lại danh sách hoặc Modal Conflict
            setIsLoading(false); 
        }
    };

    // 2. Handler khi nhấn Save ở Modal thêm file (Lần đầu, mặc định overwrite = false)
    const handleSaveBulkFonts = (files, metadata) => {
        setIsBulkModalOpen(false);
        processBulkUpload(files, metadata, false);
    };

    // 3. Handler: Người dùng chọn "Ghi đè tất cả"
    const handleOverwriteAll = () => {
        if (!conflictData) return;
        // Gọi lại API với cờ overwrite = true
        processBulkUpload(conflictData.files, conflictData.metadata, true);
    };

    // 4. Handler: Người dùng chọn "Bỏ qua font trùng"
    const handleSkipDuplicates = () => {
        if (!conflictData) return;
        
        const { files, metadata, duplicates } = conflictData;

        // Lọc ra những file KHÔNG nằm trong danh sách duplicates
        // Chúng ta cần lọc cả mảng files và mảng metadata tương ứng (chúng cùng index)
        const newFiles = [];
        const newMetadata = [];

        metadata.forEach((meta, index) => {
            if (!duplicates.includes(meta.name)) {
                newFiles.push(files[index]);
                newMetadata.push(meta);
            }
        });

        if (newFiles.length === 0) {
            toast.info("Tất cả font đã chọn đều bị trùng. Không có gì để tải lên.");
            setConflictData(null);
            return;
        }

        // Tiến hành upload danh sách đã lọc (với overwrite = false, dù true cũng không sao vì ko còn trùng)
        processBulkUpload(newFiles, newMetadata, false);
    };

    // --- KẾT THÚC LOGIC MỚI ---
    
    // ... (Giữ nguyên phần handleStartEdit, handleSaveEdit, handleBulkDelete...) ...
    const handleSelectFont = (fontId) => {
        setSelectedFonts(prev => {
            const newSelected = { ...prev };
            if (newSelected[fontId]) delete newSelected[fontId];
            else newSelected[fontId] = true;
            return newSelected;
        });
    };
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allIds = filteredFonts.reduce((acc, f) => ({ ...acc, [f._id]: true }), {});
            setSelectedFonts(allIds);
        } else setSelectedFonts({});
    };
    const handleBulkDelete = async () => {
        const ids = Object.keys(selectedFonts);
        if(!ids.length) return toast.warn("Chưa chọn font nào.");
        if(window.confirm(`Xóa ${ids.length} font?`)) {
            try {
                await AuthService.bulkDeleteFonts(ids);
                toast.success("Đã xóa.");
                setSelectedFonts({});
                fetchFonts();
            } catch(e) { toast.error("Lỗi xóa font."); }
        }
    };
    const handleStartEdit = (font) => {
        setEditingFontId(font._id);
        setEditingFontName(font.name);
        
        // Kiểm tra xem category của font có nằm trong danh sách hợp lệ không, nếu không ép về 'General'
        const validCategories = FONT_CATEGORIES.map(c => c.id);
        const safeCategory = validCategories.includes(font.category) ? font.category : 'General';
        
        setEditingCategory(safeCategory); 
    };
    const handleCancelEdit = () => { setEditingFontId(null); setEditingFontName(''); };
    const handleSaveEdit = async (fontId) => {
        try {
            // SỬA LỖI: Bổ sung thêm editingCategory vào payload
            await AuthService.updateFont(fontId, { 
                name: editingFontName,
                category: editingCategory // <--- Thêm dòng này
            });
            toast.success("Cập nhật thành công");
            handleCancelEdit();
            fetchFonts();
        } catch(e) { 
            // Lỗi đã được api.js handle, hoặc bắt log thêm nếu cần
            console.error("Lỗi cập nhật", e);
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
                        <label className="form-label">Loại Font</label>
                        <select className="form-control" value={newFontCategory} onChange={(e) => setNewFontCategory(e.target.value)}>
                            <option value="Wedding">Font cưới</option>
                            <option value="Uppercase">Font viết hoa</option>
                            <option value="Vietnamese">Font tiếng Việt</option>
                            <option value="General">Khác</option>
                        </select>
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

            <div className="tabs-container" style={{ marginBottom: '1rem', display: 'flex', gap: '8px' }}>
                {FONT_CATEGORIES.map(tab => (
                    <button
                        key={tab.id}
                        className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => setActiveTab(tab.id)}
                        style={{ borderRadius: '20px', padding: '5px 15px', fontSize: '14px' }}
                    >
                        {tab.label}
                    </button>
                ))}
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
                    <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                        <select id="bulk-category-select" className="form-control" style={{width: '150px'}}>
                            <option value="Wedding">Font cưới</option>
                            <option value="Uppercase">Font viết hoa</option>
                            <option value="Vietnamese">Tiếng Việt</option>
                        </select>
                        <button onClick={handleBulkUpdateCategory} className="btn btn-secondary">Cập nhật loại</button>
                        <button onClick={handleBulkDelete} className="btn btn-danger">Xóa</button>
                    </div>
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
                                            <div style={{display: 'flex', flexDirection: 'column', gap: '5px'}}>
                                                <input 
                                                    type="text" 
                                                    value={editingFontName} 
                                                    onChange={(e) => setEditingFontName(e.target.value)}
                                                    className="form-control"
                                                />
                                                <select 
                                                    value={editingCategory} 
                                                    onChange={(e) => setEditingCategory(e.target.value)}
                                                    className="form-control"
                                                >
                                                    {FONT_CATEGORIES.filter(c => c.id !== 'all').map(c => (
                                                        <option key={c.id} value={c.id}>{c.label}</option>
                                                    ))}
                                                </select>
                                                <div style={{display: 'flex', gap: '5px'}}>
                                                    <button onClick={() => handleSaveEdit(font._id)} className="btn btn-sm btn-primary"><Save size={14}/> Lưu</button>
                                                    <button onClick={handleCancelEdit} className="btn btn-sm btn-secondary"><X size={14}/> Hủy</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div>
                                                <strong>{font.name}</strong>
                                                <div style={{fontSize: '11px', color: '#666'}}>Loại: {font.category}</div>
                                            </div>
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

            {/* Modal Thêm Hàng Loạt */}
            <BulkAddFontModal 
                isOpen={isBulkModalOpen} 
                onClose={() => setIsBulkModalOpen(false)} 
                onSave={handleSaveBulkFonts} 
            />

            {/* Modal Xử Lý Xung Đột (Mới) */}
            <ConflictResolveModal 
                conflictData={conflictData}
                onOverwrite={handleOverwriteAll}
                onSkip={handleSkipDuplicates}
                onCancel={() => setConflictData(null)}
            />
        </div>
    );
};

export default FontManagementPage;