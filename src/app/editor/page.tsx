'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MarkdownEditor from '@/components/MarkdownEditor';
import { toast, Toaster } from 'react-hot-toast';
import { DocumentData, saveDocument, getDocumentByTitle, downloadDocument } from '@/services/localStorageService';
import { FiSave, FiDownload, FiClock, FiEdit3, FiSettings } from 'react-icons/fi';
import { continueWithAI } from '@/services/aiService';
import { getAPIKey, saveAPIKey, getAISettings } from '@/services/aiSettingsService';
import APIKeyModal from '@/components/APIKeyModal';
import AIContinueModal from '@/components/AIContinueModal';
import Link from 'next/link';

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
  
  // AI续写相关状态
  const [isAILoading, setIsAILoading] = useState<boolean>(false);
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState<boolean>(false);
  const [aiSettingsModalOpen, setAiSettingsModalOpen] = useState<boolean>(false);

  // 会话存储键
  const SESSION_STORAGE_KEY = 'current_editing_document';

  // 从会话存储中恢复编辑状态
  useEffect(() => {
    // 尝试从会话存储中恢复
    try {
      const sessionData = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (sessionData) {
        const parsedData = JSON.parse(sessionData);
        setTitle(parsedData.title);
        setContent(parsedData.content);
        setIsSaved(parsedData.isSaved);
        if (parsedData.lastSavedAt) {
          setLastSavedAt(new Date(parsedData.lastSavedAt));
        }
        
        // 如果URL中没有title参数，但会话中有文档，更新URL
        if (!documentTitle && parsedData.title !== '无标题文档') {
          router.replace(`/editor?title=${encodeURIComponent(parsedData.title)}`);
        }
        return; // 已从会话中恢复，不需要再从localStorage加载
      }
    } catch (error) {
      console.error('从会话存储恢复失败:', error);
    }
    
    // 如果没有会话数据，且URL中有title参数，则从localStorage加载
    if (documentTitle) {
      setIsLoading(true);
      try {
        const doc: DocumentData | null = getDocumentByTitle(documentTitle);
        if (doc) {
          setTitle(doc.title);
          setContent(doc.content);
          setIsSaved(true);
          setLastSavedAt(new Date(doc.lastModified));
          
          // 保存到会话存储
          saveToSessionStorage(doc.title, doc.content, true, doc.lastModified);
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
  }, [documentTitle, router]);

  // 保存当前编辑状态到会话存储
  const saveToSessionStorage = useCallback((
    currentTitle: string, 
    currentContent: string | undefined, 
    currentIsSaved: boolean,
    currentLastSavedAt?: number
  ) => {
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
        title: currentTitle,
        content: currentContent,
        isSaved: currentIsSaved,
        lastSavedAt: currentLastSavedAt || lastSavedAt?.getTime()
      }));
    } catch (error) {
      console.error('保存到会话存储失败:', error);
    }
  }, [lastSavedAt]);

  // 监听编辑状态变化，保存到会话存储
  useEffect(() => {
    if (content) {
      saveToSessionStorage(title, content, isSaved);
    }
  }, [title, content, isSaved, saveToSessionStorage]);

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
      
      // 保存到会话存储
      saveToSessionStorage(title, content, true, savedDoc.lastModified);
      
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
  }, [content, title, documentTitle, router, saveToSessionStorage]);

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
    if (!autoSaveEnabled || !content || isSaved) return;
    
    const timer = setTimeout(() => {
      saveDocumentToStorage();
    }, 30000); // 30秒自动保存
    
    return () => clearTimeout(timer);
  }, [content, title, isSaved, autoSaveEnabled, saveDocumentToStorage]);

  // 切换自动保存
  const toggleAutoSave = () => {
    setAutoSaveEnabled(!autoSaveEnabled);
  };

  // 处理标题变更
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    setIsSaved(false);
  };

  // 处理来自MarkdownEditor的标题变更
  const handleEditorTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    setIsSaved(false);
  };

  // 处理来自MarkdownEditor的内容变更
  const handleEditorContentChange = (newContent: string) => {
    setContent(newContent);
    setIsSaved(false);
  };

  // AI续写
  const handleAIContinue = async (settings: any) => {
    if (!content) return;
    
    const apiKey = getAPIKey();
    if (!apiKey) {
      setApiKeyModalOpen(true);
      return;
    }
    
    setAiSettingsModalOpen(false);
    setIsAILoading(true);
    
    try {
      const continuedText = await continueWithAI(content, settings);
      setContent(prev => prev + continuedText);
      setIsSaved(false);
      
      toast.success('AI续写完成');
    } catch (error) {
      console.error('AI续写错误:', error);
      toast.error('AI续写失败，请检查API密钥和网络连接');
    } finally {
      setIsAILoading(false);
    }
  };

  const handleSaveApiKey = (apiKey: string) => {
    saveAPIKey(apiKey);
    setApiKeyModalOpen(false);
    // 保存API密钥后打开设置对话框
    setAiSettingsModalOpen(true);
  };

  const openAIContinue = () => {
    const apiKey = getAPIKey();
    if (!apiKey) {
      setApiKeyModalOpen(true);
    } else {
      setAiSettingsModalOpen(true);
    }
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
            onClick={openAIContinue}
            disabled={isAILoading}
            className={`btn btn-outline text-blue-600 border-blue-200 hover:bg-blue-50 btn-icon ${
              isAILoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <FiEdit3 />
            {isAILoading ? 'AI生成中...' : 'AI续写'}
          </button>
          
          <Link
            href="/settings"
            className="btn btn-outline text-gray-600 border-gray-200 hover:bg-gray-100 btn-icon"
          >
            <FiSettings />
            设置
          </Link>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <MarkdownEditor 
          title={title}
          content={content}
          onTitleChange={handleEditorTitleChange}
          onContentChange={handleEditorContentChange}
        />
      </div>
      
      <APIKeyModal
        isOpen={apiKeyModalOpen}
        onClose={() => setApiKeyModalOpen(false)}
        onSave={handleSaveApiKey}
      />
      
      <AIContinueModal
        isOpen={aiSettingsModalOpen}
        onClose={() => setAiSettingsModalOpen(false)}
        onContinue={handleAIContinue}
      />
    </div>
  );
}
