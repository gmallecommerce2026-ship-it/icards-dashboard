import { useDraggable } from '@dnd-kit/core';

function DraggableSidebarItem({ data, children }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `draggable-${data.id}`,
        data: data,
    });

    const style = {
        opacity: isDragging ? 0.5 : 1,
        transition: 'opacity 0.2s ease',
        cursor: 'grab',
    };

    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
            {children}
        </div>
    );
}

export default DraggableSidebarItem;