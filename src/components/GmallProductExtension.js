import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React from 'react';

const ProductComponent = (props) => {
  const { node, deleteNode } = props;
  const { name, price, image, link } = node.attrs;

  return (
    <NodeViewWrapper contentEditable={false}>
      <div style={{
        display: 'flex', 
        border: '1px solid #e2e8f0', 
        borderRadius: '4px', 
        padding: '12px', 
        gap: '16px', 
        backgroundColor: '#ffffff', 
        position: 'relative',
        margin: '16px 0', 
        alignItems: 'center',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
      }}>
        <img 
          src={image || 'https://via.placeholder.com/80'} 
          alt={name} 
          style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #f1f5f9' }} 
        />
        
        <div style={{ flex: 1, paddingRight: '40px' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: 500, color: '#0f172a', lineHeight: '1.4' }}>{name}</h4>
          <p style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: 600, color: '#ef4444' }}>
             {new Intl.NumberFormat('vi-VN').format(price)} đ
          </p>
          <a href={link} target="_blank" rel="noreferrer" style={{ fontSize: '13px', color: '#3b82f6', textDecoration: 'none', fontWeight: 500 }}>
            Xem chi tiết sản phẩm →
          </a>
        </div>

        <button 
          onClick={deleteNode} 
          title="Xóa sản phẩm khỏi bài viết"
          style={{ 
            position: 'absolute', top: '12px', right: '12px', background: '#fef2f2', 
            color: '#ef4444', border: '1px solid #fecaca', borderRadius: '4px', 
            width: '28px', height: '28px', display: 'flex', alignItems: 'center', 
            justifyContent: 'center', cursor: 'pointer'
          }}
        >
          ✕
        </button>
      </div>
    </NodeViewWrapper>
  );
};

export const GmallProductExtension = Node.create({
  name: 'gmallProduct',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      id: { default: null },
      name: { default: 'Tên sản phẩm' },
      price: { default: 0 },
      image: { default: '' },
      link: { default: '' },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="gmall-product"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'gmall-product', class: 'gmall-product-inline' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ProductComponent);
  },
});