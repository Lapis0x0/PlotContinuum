'use client';

import React, { useState } from 'react';
import MarkdownEditor from '@/components/MarkdownEditor';

export default function EditorPage() {
  const [content, setContent] = useState<string | undefined>('# 开始你的写作\n\n在这里输入你的内容...');
  const [title, setTitle] = useState<string>('无标题文档');
  const [isSaved, setIsSaved] = useState<boolean>(true);

  const handleContentChange = (newContent?: string) => {
    setContent(newContent);
    setIsSaved(false);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    setIsSaved(false);
  };

  const handleSave = () => {
    // 这里将来会实现保存功能
    console.log('保存文档:', { title, content });
    setIsSaved(true);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            className="text-2xl font-bold border-none focus:outline-none focus:ring-2 focus:ring-blue-500 px-2 py-1 rounded"
            placeholder="输入标题..."
          />
          <span className="ml-2 text-sm text-gray-500">
            {isSaved ? '已保存' : '未保存'}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            保存
          </button>
          <button
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
            disabled
          >
            AI续写 (即将推出)
          </button>
        </div>
      </div>
      
      <MarkdownEditor initialValue={content} onChange={handleContentChange} />
      
      <div className="mt-4 text-sm text-gray-500">
        <p>提示: 使用Markdown语法来格式化你的文本。</p>
      </div>
    </div>
  );
}
