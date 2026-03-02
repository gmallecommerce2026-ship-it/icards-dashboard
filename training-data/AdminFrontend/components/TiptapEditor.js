// src/components/TiptapEditor.js
import React, { useCallback, useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import './CustomEditor.css';
import api from '../services/api';
import { toast } from 'react-toastify';
import {
    Bold, Italic, Strikethrough, Underline as UnderlineIcon, Pilcrow,
    Heading1, Heading2, Heading3, List, ListOrdered,
    Quote, Code, Minus, Link2, Image as ImageIcon,
    AlignLeft, AlignCenter, AlignRight, AlignJustify,
    PaintBucket, Highlighter, Undo, Redo, Code2,
    PanelLeft, PanelRight, AlignCenterHorizontal
} from 'lucide-react';

// 1. Mở rộng Extension Image để hỗ trợ căn lề float và kích thước
const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: { default: '100%' },
      height: { default: 'auto' },
      'data-float': {
        default: null,
        renderHTML: attributes => ({ 'data-float': attributes['data-float'] }),
        parseHTML: element => element.getAttribute('data-float'),
      }
    };
  },
});

// 2. Component Menu tùy chỉnh cho ảnh
const ImageActionMenu = ({ editor, menuPosition, onUpdate, onHide }) => {
    const menuRef = useRef(null);

    // Xử lý click ra ngoài để ẩn menu
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                onHide();
            }
        };
        if (menuPosition.visible) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [menuPosition.visible, onHide]);

    if (!editor || !menuPosition.visible) return null;

    const handleSetWidth = (e) => {
        const width = e.target.value;
        onUpdate({ width: `${width}%` });
    };

    const currentWidth = editor.getAttributes('image').width?.replace('%', '') || 100;
    const currentFloat = editor.getAttributes('image')['data-float'];

    return (
        <div
            ref={menuRef}
            className="image-action-menu"
            style={{ top: menuPosition.top, left: menuPosition.left }}
        >
            <button type="button" onClick={() => onUpdate({ 'data-float': 'left' })} className={currentFloat === 'left' ? 'is-active' : ''} title="Căn trái, chữ bao quanh">
                <PanelLeft size={18} />
            </button>
            <button type="button" onClick={() => onUpdate({ 'data-float': null })} className={!currentFloat ? 'is-active' : ''} title="Ở giữa (Mặc định)">
                <AlignCenterHorizontal size={18} />
            </button>
            <button type="button" onClick={() => onUpdate({ 'data-float': 'right' })} className={currentFloat === 'right' ? 'is-active' : ''} title="Căn phải, chữ bao quanh">
                <PanelRight size={18} />
            </button>
            <div className="divider"></div>
            <input
                type="range"
                min="20"
                max="100"
                value={currentWidth}
                onChange={handleSetWidth}
                className="image-width-slider"
                title={`Kích thước: ${currentWidth}%`}
            />
        </div>
    );
};


const MenuBar = ({ editor, onHtmlToggle, isHtmlMode }) => {
    const fileInputRef = useRef(null);

    const handleFileSelect = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('upload', file);

        const toastId = toast.loading("Đang tải ảnh lên...");
        try {
            const response = await api.post('/admin/pages/upload-image', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (response.data && response.data.url) {
                // Chèn ảnh với kích thước mặc định là 50%
                editor.chain().focus().setImage({ src: response.data.url, width: '50%' }).run();
                toast.update(toastId, { render: "Tải ảnh thành công!", type: "success", isLoading: false, autoClose: 3000 });
            } else {
                 toast.update(toastId, { render: "Server không trả về URL ảnh.", type: "error", isLoading: false, autoClose: 5000 });
            }
        } catch (error) {
            console.error("Lỗi tải ảnh:", error);
            toast.update(toastId, { render: `Lỗi: ${error.message || 'Không thể tải ảnh'}`, type: "error", isLoading: false, autoClose: 5000 });
        } finally {
            if(fileInputRef.current) fileInputRef.current.value = '';
        }
    };
    
    const addImage = () => fileInputRef.current?.click();

    const setLink = useCallback(() => {
        if (!editor) return;
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('URL', previousUrl);
        if (url === null) return;
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }, [editor]);

    if (!editor) return null;

    return (
        <div className="tiptap-menubar">
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} style={{ display: 'none' }} accept="image/*" />
            
            <button type="button" onClick={onHtmlToggle} className={isHtmlMode ? 'is-active' : ''} title="HTML Source"><Code2 size={16} /></button>
            <div className="divider"></div>
            <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'is-active' : ''} title="Bold"><Bold size={16} /></button>
            <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'is-active' : ''} title="Italic"><Italic size={16} /></button>
            <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={editor.isActive('underline') ? 'is-active' : ''} title="Underline"><UnderlineIcon size={16} /></button>
            <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={editor.isActive('strike') ? 'is-active' : ''} title="Strikethrough"><Strikethrough size={16} /></button>
            <div className="divider"></div>
            <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''} title="Heading 1"><Heading1 size={16} /></button>
            <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''} title="Heading 2"><Heading2 size={16} /></button>
            <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''} title="Heading 3"><Heading3 size={16} /></button>
            <button type="button" onClick={() => editor.chain().focus().setParagraph().run()} className={editor.isActive('paragraph') ? 'is-active' : ''} title="Paragraph"><Pilcrow size={16} /></button>
            <div className="divider"></div>
            <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'is-active' : ''} title="Bullet List"><List size={16} /></button>
            <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? 'is-active' : ''} title="Ordered List"><ListOrdered size={16} /></button>
            <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={editor.isActive('blockquote') ? 'is-active' : ''} title="Blockquote"><Quote size={16} /></button>
            <button type="button" onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={editor.isActive('codeBlock') ? 'is-active' : ''} title="Code Block"><Code size={16} /></button>
            <div className="divider"></div>
            <button type="button" onClick={() => editor.chain().focus().setTextAlign('left').run()} className={editor.isActive({ textAlign: 'left' }) ? 'is-active' : ''} title="Align Left"><AlignLeft size={16} /></button>
            <button type="button" onClick={() => editor.chain().focus().setTextAlign('center').run()} className={editor.isActive({ textAlign: 'center' }) ? 'is-active' : ''} title="Align Center"><AlignCenter size={16} /></button>
            <button type="button" onClick={() => editor.chain().focus().setTextAlign('right').run()} className={editor.isActive({ textAlign: 'right' }) ? 'is-active' : ''} title="Align Right"><AlignRight size={16} /></button>
            <button type="button" onClick={() => editor.chain().focus().setTextAlign('justify').run()} className={editor.isActive({ textAlign: 'justify' }) ? 'is-active' : ''} title="Align Justify"><AlignJustify size={16} /></button>
            <div className="divider"></div>
            <button type="button" onClick={setLink} className={editor.isActive('link') ? 'is-active' : ''} title="Add Link"><Link2 size={16} /></button>
            <button type="button" onClick={addImage} title="Add Image from computer"><ImageIcon size={16} /></button>
            <div className="divider"></div>
            <div className="color-picker-wrapper" title="Text Color">
                <PaintBucket size={16}/>
                <input type="color" onInput={event => editor.chain().focus().setColor(event.target.value).run()} value={editor.getAttributes('textStyle').color || '#000000'} />
            </div>
             <button type="button" onClick={() => editor.chain().focus().toggleHighlight().run()} className={editor.isActive('highlight') ? 'is-active' : ''} title="Highlight"><Highlighter size={16}/></button>
            <div className="divider"></div>
            <button type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Rule"><Minus size={16} /></button>
            <div className="divider"></div>
            <button type="button" onClick={() => editor.chain().focus().undo().run()} title="Undo"><Undo size={16} /></button>
            <button type="button" onClick={() => editor.chain().focus().redo().run()} title="Redo"><Redo size={16} /></button>
        </div>
    );
};

const TiptapEditor = ({ data, onChange }) => {
    const [isHtmlMode, setIsHtmlMode] = useState(false);
    const [htmlContent, setHtmlContent] = useState(data || '');
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, visible: false });

    const editor = useEditor({
        extensions: [
            StarterKit, Underline, TextAlign.configure({ types: ['heading', 'paragraph', 'image'] }),
            TextStyle, Color, Highlight.configure({ multicolor: true }), Link.configure({ openOnClick: false }),
            CustomImage.configure({ inline: false, allowBase64: true }),
        ],
        content: data,
        onUpdate: ({ editor }) => {
            const newHtml = editor.getHTML();
            setHtmlContent(newHtml);
            if (onChange) onChange(newHtml);
        },
        onSelectionUpdate: ({ editor }) => {
            const { selection } = editor.state;
            const node = selection.node;

            if (node && node.type.name === 'image') {
                const { view } = editor;
                const nodeView = view.nodeDOM(selection.from); 
                if (nodeView) {
                    const rect = nodeView.getBoundingClientRect();
                    setMenuPosition({
                        // Vị trí menu bên dưới ảnh
                        top: rect.bottom + window.scrollY + 5, 
                        // Căn giữa menu theo chiều rộng của ảnh
                        left: rect.left + window.scrollX + rect.width / 2, 
                        visible: true
                    });
                }
            } else {
                setMenuPosition(prev => ({ ...prev, visible: false }));
            }
        },
    });

    // Đồng bộ nội dung từ props vào editor
    useEffect(() => {
      if (editor && !isHtmlMode && editor.getHTML() !== data) {
          editor.commands.setContent(data, false);
          setHtmlContent(data);
      }
    }, [data, editor, isHtmlMode]);

    const handleHtmlChange = (e) => {
        setHtmlContent(e.target.value);
        if (onChange) onChange(e.target.value);
    };
    
    const toggleHtmlMode = () => {
        if (!isHtmlMode) { 
            setHtmlContent(editor.getHTML());
        } else { 
            editor.commands.setContent(htmlContent);
        }
        setIsHtmlMode(!isHtmlMode);
    };
    
    useEffect(() => {
        return () => {
            if (editor) editor.destroy();
        };
    }, [editor]);

    return (
        <div className="tiptap-wrapper">
            {editor && <MenuBar editor={editor} onHtmlToggle={toggleHtmlMode} isHtmlMode={isHtmlMode} />}
            {editor && <ImageActionMenu
                editor={editor}
                menuPosition={menuPosition}
                onUpdate={(attrs) => {
                    // --- ĐÂY LÀ PHẦN SỬA LỖI QUAN TRỌNG ---
                    // 1. Lấy tất cả các thuộc tính hiện tại của ảnh
                    const currentAttributes = editor.getAttributes('image');
                    // 2. Hợp nhất thuộc tính cũ và mới, sau đó cập nhật
                    editor.chain().focus().updateAttributes('image', { ...currentAttributes, ...attrs }).run();
                }}
                onHide={() => setMenuPosition(prev => ({ ...prev, visible: false }))}
            />}
            {isHtmlMode ? (
                <textarea
                    className="tiptap-html-editor"
                    value={htmlContent}
                    onChange={handleHtmlChange}
                />
            ) : (
                <EditorContent editor={editor} />
            )}
        </div>
    );
};

export default TiptapEditor;