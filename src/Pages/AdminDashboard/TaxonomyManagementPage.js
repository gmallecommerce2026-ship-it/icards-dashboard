import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PlusCircle, Trash2, Edit, Save, X, GripVertical, ChevronDown, ChevronRight, RefreshCw } from 'lucide-react';
import AuthService from '../../services/auth.service';
import './AdminDashboard.css';

const SortableTaxonomyItem = ({ item, onUpdate, onRemove, onAddChild, isExpanded, expandedItems, onToggleExpand }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(item.title);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.7 : 1,
        zIndex: isDragging ? 999 : 1,
        position: isDragging ? 'relative' : 'static',
    };

    const handleSave = () => {
        if (title.trim()) {
            onUpdate(item.id, { title: title.trim() });
            setIsEditing(false);
        } else {
            toast.warn("Tên không được để trống.");
        }
    };
    
    const hasChildren = item.children && item.children.length > 0;

    return (
        <div className={`taxonomy-tree__item taxonomy-tree__item--level-${item.level}`}>
            <div ref={setNodeRef} style={style} className="taxonomy-tree__item-content">
                <div {...attributes} {...listeners} className="drag-handle" style={{ cursor: 'grab' }}>
                    <GripVertical size={18} color="#9ca3af" />
                </div>
                
                <div style={{width: '24px'}}>
                    {hasChildren && (
                        <button onClick={() => onToggleExpand(item.id)} className="expand-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                            {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </button>
                    )}
                </div>

                <div className="taxonomy-tree__item-name-wrapper" style={{ flexGrow: 1 }}>
                    {isEditing ? (
                        <div className="taxonomy-tree__item-name--editing" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input 
                                type="text" 
                                value={title} 
                                onChange={(e) => setTitle(e.target.value)} 
                                className="form-control form-control-sm" 
                                autoFocus 
                                onBlur={handleSave} 
                                onKeyDown={e => e.key === 'Enter' && handleSave()} 
                                style={{ padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db', width: '200px' }} 
                            />
                            <button onClick={handleSave} className="action-btn-icon" title="Lưu" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#10B981', padding: '4px' }}><Save size={18} /></button>
                            <button onClick={() => setIsEditing(false)} className="action-btn-icon" title="Hủy" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: '4px' }}><X size={18} /></button>
                        </div>
                    ) : (
                        <span className="taxonomy-tree__item-name" onDoubleClick={() => setIsEditing(true)} style={{ fontWeight: 500 }}>
                            {item.title}
                        </span>
                    )}
                </div>
                
                <div className="taxonomy-tree__item-actions" style={{ display: 'flex', gap: '4px' }}>
                    {item.level < 2 && (
                        <button onClick={() => onAddChild(item.id)} title="Thêm mục con" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3B82F6', padding: '4px' }}>
                            <PlusCircle size={18} />
                        </button>
                    )}
                    <button onClick={() => setIsEditing(true)} title="Sửa" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: '4px' }}>
                        <Edit size={18} />
                    </button>
                    <button onClick={() => onRemove(item.id)} title="Xóa" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: '4px' }}>
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>

            {hasChildren && isExpanded && (
                <div className="taxonomy-tree__item-children" style={{ paddingLeft: '28px', marginTop: '4px' }}>
                    <RecursiveSortableList
                        items={item.children}
                        onUpdate={onUpdate}
                        onRemove={onRemove}
                        onAddChild={onAddChild}
                        expandedItems={expandedItems}
                        onToggleExpand={onToggleExpand}
                    />
                </div>
            )}
        </div>
    );
};

const RecursiveSortableList = ({ items, onUpdate, onRemove, onAddChild, expandedItems, onToggleExpand }) => {
    return (
        <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
            {items.map(item => (
                <SortableTaxonomyItem
                    key={item.id}
                    item={item}
                    onUpdate={onUpdate}
                    onRemove={onRemove}
                    onAddChild={onAddChild}
                    isExpanded={expandedItems.has(item.id)}
                    expandedItems={expandedItems} 
                    onToggleExpand={onToggleExpand}
                />
            ))}
        </SortableContext>
    );
}

const TaxonomyManagementPage = () => {
    const [navTree, setNavTree] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedItems, setExpandedItems] = useState(new Set());

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

    const handleToggleExpand = (itemId) => {
        setExpandedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(itemId)) newSet.delete(itemId);
            else newSet.add(itemId);
            return newSet;
        });
    };

    const sanitizeTree = useCallback((nodes, level = 0) => {
        return nodes.map(node => ({
            ...node,
            type: node.type || (level === 0 ? 'category' : level === 1 ? 'group' : 'type'),
            level: level,
            children: node.children ? sanitizeTree(node.children, level + 1) : []
        }));
    }, []);
    
    const findAndModify = (nodes, targetId, modification) => {
        let wasModified = false;
        const result = nodes.reduce((acc, node) => {
            if (wasModified) {
                acc.push(node);
                return acc;
            }
            if (node.id === targetId) {
                const modifiedNode = modification(node);
                if (modifiedNode) acc.push(modifiedNode);
                wasModified = true;
                return acc;
            }
            if (node.children) {
                const [newChildren, modifiedInChildren] = findAndModify(node.children, targetId, modification);
                if (modifiedInChildren) {
                    wasModified = true;
                    acc.push({ ...node, children: newChildren });
                    return acc;
                }
            }
            acc.push(node);
            return acc;
        }, []);
        return [result, wasModified];
    };

    // --- FIX LỖI: BÓC TÁCH DỮ LIỆU AN TOÀN TỪ API ---
    const fetchNavTree = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await AuthService.getSettings();
            const settings = response?.data?.data || response?.data || response || {}; // Lấy đúng cấp dữ liệu
            const rawNav = settings.headerNav || [];
            setNavTree(sanitizeTree(rawNav));
        } catch (error) { console.error("Không thể tải cây danh mục."); }
        finally { setIsLoading(false); }
    }, [sanitizeTree]);

    useEffect(() => { fetchNavTree(); }, [fetchNavTree]);

    const handleUpdate = (id, newValues) => {
        const [newTree] = findAndModify(navTree, id, node => ({ ...node, ...newValues }));
        setNavTree(newTree);
    };

    const handleRemove = (id) => {
        if (!window.confirm("Bạn có chắc muốn xóa mục này và tất cả các mục con?")) return;
        const [newTree] = findAndModify(navTree, id, () => null);
        setNavTree(newTree);
    };

    const handleAddChild = (parentId) => {
        const newItemBase = { id: `new_${Date.now()}`, title: "Mục Mới", path: "#", isVisible: true, children: [] };
        if (!parentId) {
            setNavTree(prev => [...prev, { ...newItemBase, type: 'category', level: 0 }]);
        } else {
            const [newTree] = findAndModify(navTree, parentId, parentNode => ({
                ...parentNode,
                children: [...(parentNode.children || []), { ...newItemBase, type: parentNode.level + 1 === 1 ? 'group' : 'type', level: parentNode.level + 1 }]
            }));
            setNavTree(newTree);
            setExpandedItems(prev => new Set(prev).add(parentId));
        }
    };
    
    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const reorderInTree = (nodes) => {
            const activeIndex = nodes.findIndex(n => n.id === active.id);
            const overIndex = nodes.findIndex(n => n.id === over.id);

            if (activeIndex !== -1 && overIndex !== -1) {
                return arrayMove(nodes, activeIndex, overIndex);
            }
            return nodes.map(node => {
                if (node.children && node.children.length > 0) {
                    return { ...node, children: reorderInTree(node.children) };
                }
                return node;
            });
        };

        setNavTree(prev => reorderInTree(prev));
    };

    // --- FIX LỖI: BÓC TÁCH DỮ LIỆU ĐỂ PHỤC HỒI CHẠY ĐƯỢC ---
    const handleRestoreTree = async () => {
        if (!window.confirm("Thao tác này sẽ tự động khôi phục lại cấu trúc cây danh mục dựa trên dữ liệu thiệp mời hiện có. Bạn có chắc chắn?")) return;
        setIsLoading(true);
        try {
            const response = await AuthService.getSettings();
            const settings = response?.data?.data || response?.data || response || {}; // Lấy đúng cấp dữ liệu
            const occasions = settings.occasionOrder || [];
            
            if(occasions.length === 0) {
                toast.warning("Không tìm thấy dữ liệu gốc để khôi phục.");
                return;
            }

            const restoredTree = [];
            
            occasions.forEach(item => {
                const parts = item.split('-');
                const categoryName = parts[0]?.trim();
                const groupName = parts[1]?.trim();
                const typeName = parts[2]?.trim();

                if (!categoryName) return;

                // Level 0: Category
                let catNode = restoredTree.find(c => c.title === categoryName);
                if (!catNode) {
                    catNode = { id: `cat_${Date.now()}_${Math.random().toString(36).substring(2,7)}`, title: categoryName, path: `/category/${categoryName}`, isVisible: true, type: 'category', level: 0, children: [] };
                    restoredTree.push(catNode);
                }

                // Level 1: Group
                if (!groupName) return;
                let groupNode = catNode.children.find(g => g.title === groupName);
                if (!groupNode) {
                    groupNode = { id: `grp_${Date.now()}_${Math.random().toString(36).substring(2,7)}`, title: groupName, path: `/group/${groupName}`, isVisible: true, type: 'group', level: 1, children: [] };
                    catNode.children.push(groupNode);
                }

                // Level 2: Type
                if (!typeName) return;
                let typeNode = groupNode.children.find(t => t.title === typeName);
                if (!typeNode) {
                    typeNode = { id: `typ_${Date.now()}_${Math.random().toString(36).substring(2,7)}`, title: typeName, path: `/type/${typeName}`, isVisible: true, type: 'type', level: 2, children: [] };
                    groupNode.children.push(typeNode);
                }
            });

            setNavTree(restoredTree);
            // Tự động mở rộng tất cả các cấp để bạn dễ nhìn
            const allIds = new Set();
            const extractIds = (nodes) => nodes.forEach(n => { allIds.add(n.id); if(n.children) extractIds(n.children); });
            extractIds(restoredTree);
            setExpandedItems(allIds);

            toast.success("Đã phục hồi cấu trúc thành công! Hãy ấn 'Lưu tất cả thay đổi' để lưu vào Database.");
        } catch (error) {
            console.error(error);
            toast.error("Lỗi khi khôi phục dữ liệu.");
        } finally {
            setIsLoading(false);
        }
    };

    // --- FIX LỖI: BÓC TÁCH DỮ LIỆU ĐỂ LƯU KHÔNG BỊ GHI ĐÈ ---
    const handleSaveChanges = async () => {
        setIsLoading(true);
        try {
            const stripInternalFields = (nodes) => nodes.map(({ level, ...rest }) => ({
                ...rest,
                children: rest.children ? stripInternalFields(rest.children) : []
            }));
            const treeToSave = stripInternalFields(navTree);
            
            const response = await AuthService.getSettings();
            const currentSettings = response?.data?.data || response?.data || response || {}; // Lấy đúng cấp dữ liệu
            
            const newSettings = { ...currentSettings, headerNav: treeToSave };
            const formData = new FormData();
            formData.append('settings', JSON.stringify(newSettings));
            
            await AuthService.updateSettings(formData);
            toast.success("Đã lưu cấu trúc danh mục thành công!");
            fetchNavTree();
        } catch (error) { 
            toast.error("Lưu thất bại."); 
            console.error(error); 
        } finally { 
            setIsLoading(false); 
        }
    };

    return (
        <div>
            <header className="admin-header">
                <h1 className="admin-header__title">Quản lý Danh mục Header Website</h1>
            </header>
            <div className="page-header-actions" style={{ marginBottom: '20px', display: 'flex', gap: '12px' }}>
                <button onClick={() => handleAddChild(null)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px' }}>
                    <PlusCircle size={20} /> Thêm Danh mục Gốc
                </button>
                
                {/* <button onClick={handleRestoreTree} className="btn" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', backgroundColor: '#F59E0B', color: '#fff', border: 'none' }}>
                    <RefreshCw size={20} /> Phục hồi cấu trúc gốc
                </button> */}
            </div>

            <div className="taxonomy-tree-container" style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #eaecf0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                {isLoading ? <p style={{ color: '#6b7280' }}>Đang tải dữ liệu cấu hình Settings...</p> :
                    navTree.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#6b7280', padding: '40px 0' }}>
                            Chưa có danh mục nào. Hãy thêm mới hoặc ấn "Phục hồi cấu trúc gốc".
                        </div>
                    ) : (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <RecursiveSortableList
                            items={navTree}
                            onUpdate={handleUpdate}
                            onRemove={handleRemove}
                            onAddChild={handleAddChild}
                            expandedItems={expandedItems}
                            onToggleExpand={handleToggleExpand}
                        />
                    </DndContext>
                    )
                }
            </div>

            <div className="page-footer-actions" style={{ marginTop: '24px' }}>
                <button onClick={handleSaveChanges} className="btn btn-primary" disabled={isLoading} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '8px', background: '#0a58ca', color: 'white', border: 'none' }}>
                    <Save size={20} /> {isLoading ? 'Đang cập nhật lên Settings...' : 'Lưu tất cả thay đổi'}
                </button>
            </div>
        </div>
    );
};

export default TaxonomyManagementPage;