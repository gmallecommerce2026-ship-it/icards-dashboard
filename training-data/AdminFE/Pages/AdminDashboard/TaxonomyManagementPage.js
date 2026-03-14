import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PlusCircle, Trash2, Edit, Save, X, GripVertical, ChevronDown, ChevronRight } from 'lucide-react';
import AuthService from '../../services/auth.service';
import './AdminDashboard.css';

// --- SỬA LỖI: Thêm prop `expandedItems` để truyền xuống component con ---
const SortableTaxonomyItem = ({
    item,
    onUpdate,
    onRemove,
    onAddChild,
    onReorder,
    isExpanded,
    expandedItems, // Prop mới được thêm vào
    onToggleExpand
}) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(item.title);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
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
                <div {...attributes} {...listeners} className="drag-handle"><GripVertical size={18} /></div>
                
                <div style={{width: '24px'}}>
                    {hasChildren && (
                        <button onClick={() => onToggleExpand(item.id)} className="expand-btn">
                            {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </button>
                    )}
                </div>

                <div className="taxonomy-tree__item-name-wrapper">
                    {isEditing ? (
                        <div className="taxonomy-tree__item-name--editing">
                            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="form-control--inline" autoFocus onBlur={handleSave} onKeyDown={e => e.key === 'Enter' && handleSave()} />
                            <button onClick={handleSave} className="action-btn-icon" title="Lưu"><Save size={16} /></button>
                            <button onClick={() => setIsEditing(false)} className="action-btn-icon" title="Hủy"><X size={16} /></button>
                        </div>
                    ) : (
                        <span className="taxonomy-tree__item-name" onDoubleClick={() => setIsEditing(true)}>{item.title}</span>
                    )}
                </div>
                
                <div className="taxonomy-tree__item-actions">
                    {item.level < 2 && <button onClick={() => onAddChild(item.id)} title="Thêm mục con"><PlusCircle size={16} /></button>}
                    <button onClick={() => setIsEditing(true)} title="Sửa"><Edit size={16} /></button>
                    <button onClick={() => onRemove(item.id)} title="Xóa"><Trash2 size={16} /></button>
                </div>
            </div>

            {hasChildren && isExpanded && (
                <div className="taxonomy-tree__item-children">
                     <RecursiveSortableList
                        items={item.children}
                        parentId={item.id}
                        onUpdate={onUpdate}
                        onRemove={onRemove}
                        onAddChild={onAddChild}
                        onReorder={onReorder}
                        // --- SỬA LỖI: Truyền xuống object Set `expandedItems`, không phải boolean `isExpanded` ---
                        expandedItems={expandedItems}
                        onToggleExpand={onToggleExpand}
                    />
                </div>
            )}
        </div>
    );
};

const RecursiveSortableList = ({ items, parentId, onUpdate, onRemove, onAddChild, onReorder, expandedItems, onToggleExpand }) => {
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            onReorder(parentId, active.id, over.id);
        }
    };

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                {items.map(item => (
                    <SortableTaxonomyItem
                        key={item.id}
                        item={item}
                        onUpdate={onUpdate}
                        onRemove={onRemove}
                        onAddChild={onAddChild}
                        onReorder={onReorder}
                        isExpanded={expandedItems.has(item.id)}
                        // --- SỬA LỖI: Truyền object Set `expandedItems` vào component con ---
                        expandedItems={expandedItems} 
                        onToggleExpand={onToggleExpand}
                    />
                ))}
            </SortableContext>
        </DndContext>
    );
}


const TaxonomyManagementPage = () => {
    const [navTree, setNavTree] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedItems, setExpandedItems] = useState(new Set());

    const handleToggleExpand = (itemId) => {
        setExpandedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(itemId)) {
                newSet.delete(itemId);
            } else {
                newSet.add(itemId);
            }
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

    const fetchNavTree = useCallback(async () => {
        setIsLoading(true);
        try {
            const settings = await AuthService.getSettings();
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
    
    const handleReorder = (parentId, activeId, overId) => {
        const reorder = (nodes) => {
            const oldIndex = nodes.findIndex(item => item.id === activeId);
            const newIndex = nodes.findIndex(item => item.id === overId);
            return (oldIndex !== -1 && newIndex !== -1) ? arrayMove(nodes, oldIndex, newIndex) : nodes;
        };
        if (!parentId) {
            setNavTree(prev => reorder(prev));
        } else {
            const [newTree] = findAndModify(navTree, parentId, node => ({ ...node, children: reorder(node.children) }));
            setNavTree(newTree);
        }
    };

    const handleSaveChanges = async () => {
        setIsLoading(true);
        try {
            const stripInternalFields = (nodes) => nodes.map(({ level, ...rest }) => ({
                ...rest,
                children: rest.children ? stripInternalFields(rest.children) : []
            }));
            const treeToSave = stripInternalFields(navTree);
            const currentSettings = await AuthService.getSettings();
            const newSettings = { ...currentSettings, headerNav: treeToSave };
            const formData = new FormData();
            formData.append('settings', JSON.stringify(newSettings));
            await AuthService.updateSettings(formData);
            toast.success("Đã lưu cấu trúc danh mục thành công!");
            fetchNavTree();
        } catch (error) { console.error("Lưu thất bại."); }
        finally { setIsLoading(false); }
    };

    return (
        <div>
            <header className="admin-header"><h1 className="admin-header__title">Quản lý Danh mục Header</h1></header>
            <div className="page-header-actions">
                <button onClick={() => handleAddChild(null)} className="btn btn-primary"><PlusCircle size={20} /> Thêm Danh mục Gốc</button>
            </div>
            <div className="taxonomy-tree-container">
                {isLoading ? <p>Đang tải...</p> :
                    <RecursiveSortableList
                        items={navTree}
                        parentId={null}
                        onUpdate={handleUpdate}
                        onRemove={handleRemove}
                        onAddChild={handleAddChild}
                        onReorder={handleReorder}
                        expandedItems={expandedItems}
                        onToggleExpand={handleToggleExpand}
                    />
                }
            </div>
            <div className="page-footer-actions">
                <button onClick={handleSaveChanges} className="btn btn-primary" disabled={isLoading}>
                    <Save size={20} /> {isLoading ? 'Đang lưu...' : 'Lưu tất cả thay đổi'}
                </button>
            </div>
        </div>
    );
};

export default TaxonomyManagementPage;