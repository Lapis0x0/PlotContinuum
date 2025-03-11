'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MarkdownEditor from '@/components/MarkdownEditor';
import { toast, Toaster } from 'react-hot-toast';
import { saveDocument, getDocumentByTitle, downloadDocument, DocumentData } from '@/services/localStorageService';
import { FiSave, FiDownload, FiClock, FiEdit3 } from 'react-icons/fi';

export default function EditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const documentTitle = searchParams.get('title');
  
  const [content, setContent] = useState<string | undefined>('# 开始你的写作\n\n在这里输入你的内容...');
  const [title, setTitle] = useState<string>('无标题文档');
  const [isSaved, setIsSaved] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState<boolean>(true);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  // 加载文档
  useEffect(() => {
    if (documentTitle) {
      setIsLoading(true);
      try {
        const doc: DocumentData | null = getDocumentByTitle(documentTitle);
        if (doc) {
          setTitle(doc.title);
          setContent(doc.content);
          setIsSaved(true);
          setLastSavedAt(new Date(doc.lastModified));
        } else {
          toast.error('找不到文档');
        }
      } catch (error) {
        console.error('加载文档错误:', error);
        toast.error('无法加载文档');
      } finally {
        setIsLoading(false);
      }
    }
  }, [documentTitle]);

  // 保存文档
  const saveDocumentToStorage = useCallback(async () => {
    if (!content) return;
    
    try {
      setIsLoading(true);
      const savedDoc: DocumentData = saveDocument({
        title,
        content
      });
      
      setIsSaved(true);
      setLastSavedAt(new Date(savedDoc.lastModified));
      toast.success('文档已保存到浏览器');
      
      // 如果是新文档，更新URL
      if (!documentTitle || documentTitle !== title) {
        router.push(`/editor?title=${encodeURIComponent(title)}`);
      }
    } catch (error) {
      console.error('保存文档错误:', error);
      toast.error('保存文档失败');
    } finally {
      setIsLoading(false);
    }
  }, [content, title, documentTitle, router]);

  // 下载文档
  const handleDownload = useCallback(() => {
    if (!content) return;
    
    try {
      downloadDocument({
        id: Date.now().toString(),
        title,
        content,
        lastModified: Date.now()
      });
      toast.success('文档已下载');
    } catch (error) {
      console.error('下载文档错误:', error);
      toast.error('下载文档失败');
    }
  }, [content, title]);

  // 自动保存
  useEffect(() => {
    if (!autoSaveEnabled || isSaved || isLoading) return;
    
    const autoSaveTimer = setTimeout(() => {
      saveDocumentToStorage();
    }, 30000); // 30秒自动保存
    
    return () => clearTimeout(autoSaveTimer);
  }, [autoSaveEnabled, content, isSaved, isLoading, saveDocumentToStorage]);

  const handleContentChange = (newContent?: string) => {
    setContent(newContent);
    setIsSaved(false);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    setIsSaved(false);
  };

  const toggleAutoSave = () => {
    setAutoSaveEnabled(!autoSaveEnabled);
    toast.success(autoSaveEnabled ? '已关闭自动保存' : '已开启自动保存');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <Toaster position="top-right" />
      
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center">
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            className="doc-title-input"
            placeholder="输入标题..."
          />
          <div className="ml-2 flex items-center space-x-2">
            {isSaved ? (
              <span className="status-badge status-saved">已保存</span>
            ) : (
              <span className="status-badge status-unsaved">未保存</span>
            )}
            {lastSavedAt && (
              <span className="hidden sm:flex items-center text-xs text-gray-500">
                <FiClock className="mr-1" />
                {lastSavedAt.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={toggleAutoSave}
            className={`btn btn-sm btn-outline ${
              autoSaveEnabled 
                ? 'text-green-600 border-green-200 bg-green-50 hover:bg-green-100' 
                : 'text-gray-600 border-gray-200 hover:bg-gray-100'
            }`}
          >
            {autoSaveEnabled ? '自动保存: 开' : '自动保存: 关'}
          </button>
          
          <button
            onClick={saveDocumentToStorage}
            disabled={isLoading || isSaved}
            className={`btn btn-primary btn-icon ${
              (isLoading || isSaved) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <FiSave />
            {isLoading ? '保存中...' : '保存'}
          </button>
          
          <button
            onClick={handleDownload}
            className="btn btn-success btn-icon"
          >
            <FiDownload />
            下载
          </button>
          
          <button
            className="btn btn-outline text-gray-600 border-gray-200 hover:bg-gray-100 btn-icon"
            disabled
          >
            <FiEdit3 />
            AI续写
          </button>
        </div>
      </div>
      
      {isLoading && !content ? (
        <div className="editor-container flex items-center justify-center">
          <div className="flex flex-col items-center p-10">
            <div className="w-12 h-12 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-500">加载中...</p>
          </div>
        </div>
      ) : (
        <div className="editor-container">
          <MarkdownEditor initialValue={content} onChange={handleContentChange} />
        </div>
      )}
      
      <div className="mt-4 text-sm text-gray-500 flex justify-between items-center">
        <p>提示: 使用Markdown语法来格式化你的文本。</p>
        {autoSaveEnabled && (
          <p className="text-green-600 text-xs font-medium">自动保存已开启 (每30秒)</p>
        )}
      </div>
    </div>
  );
}
