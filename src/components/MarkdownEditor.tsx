'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';

// 动态导入编辑器组件以避免SSR问题
const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default),
  { ssr: false }
);

// 创建一个自定义渲染器，以便在客户端使用
const EditorComponent = ({ value, onChange, height }: { value?: string; onChange?: (value?: string) => void; height?: number }) => {
  return (
    <div data-color-mode="light">
      <MDEditor
        value={value}
        onChange={onChange}
        height={height || 500}
        preview="live"
        hideToolbar={false}
        enableScroll={true}
        visibleDragbar={true}
        textareaProps={{
          placeholder: '在这里开始写作...',
        }}
      />
    </div>
  );
};

interface MarkdownEditorProps {
  initialValue?: string;
  onChange?: (value?: string) => void;
  height?: number;
}

export default function MarkdownEditor({ initialValue, onChange, height }: MarkdownEditorProps) {
  const [mounted, setMounted] = useState(false);
  const [value, setValue] = useState(initialValue || '');

  // 仅在客户端渲染
  useEffect(() => {
    setMounted(true);
  }, []);

  // 当初始值变化时更新编辑器内容
  useEffect(() => {
    if (initialValue !== undefined) {
      setValue(initialValue);
    }
  }, [initialValue]);

  const handleChange = (newValue?: string) => {
    setValue(newValue || '');
    if (onChange) {
      onChange(newValue);
    }
  };

  // 在服务器端渲染时显示占位符
  if (!mounted) {
    return (
      <div className="w-full h-[500px] border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">编辑器加载中...</p>
      </div>
    );
  }

  return <EditorComponent value={value} onChange={handleChange} height={height} />;
}
