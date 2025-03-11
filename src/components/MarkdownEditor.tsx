'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';

// 动态导入编辑器组件，避免SSR问题
const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default),
  { ssr: false }
);

interface MarkdownEditorProps {
  initialValue?: string;
  onChange?: (value: string | undefined) => void;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ 
  initialValue = '# 开始你的写作\n\n在这里输入你的内容...',
  onChange 
}) => {
  const [value, setValue] = useState<string | undefined>(initialValue);
  const [mounted, setMounted] = useState(false);

  // 避免水合作用不匹配
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleChange = (newValue?: string) => {
    setValue(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };

  if (!mounted) {
    return <div className="h-96 border rounded-md bg-gray-50"></div>;
  }

  return (
    <div className="editor-container">
      <MDEditor
        value={value}
        onChange={handleChange}
        height={500}
        preview="edit"
        visibleDragbar={false}
      />
    </div>
  );
};

export default MarkdownEditor;
