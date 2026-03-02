// src/components/CustomEditor.js
import React from 'react';
import TiptapEditor from './TiptapEditor'; // Import component mới

function CustomEditor(props) {
    return <TiptapEditor {...props} />;
}

export default CustomEditor;