'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { toast, Toaster } from 'react-hot-toast';
import { FiSave, FiDownload, FiSettings, FiZap, FiEdit } from 'react-icons/fi';
import { DocumentData, saveDocument, getDocumentById, downloadDocument } from '@/services/localStorageService';
import { continueWithAI, editWithAI } from '@/services/aiService';
import { getAPIKey } from '@/services/aiSettingsService';
import AIContinueModal from '@/components/AIContinueModal';
import AIEditModal from '@/components/AIEditModal';
import APIKeyModal from '@/components/APIKeyModal';

// 动态导入Markdown编辑器，避免SSR问题
const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default),
  { ssr: false }
);

// 编辑器组件属性
interface MarkdownEditorProps {
  documentId?: string;
  title?: string; 
  onTitleChange?: (title: string) => void; 
  content?: string; 
  onContentChange?: (content: string) => void; 
}

// 自动保存间隔（毫秒）
const AUTO_SAVE_INTERVAL = 10000; // 10秒

// 保存文档到localStorage
const saveDocumentToStorage = (title: string, content: string, isAutoSave: boolean = true) => {
  if (content.trim() === '') return null;
  
  try {
    const savedDoc = saveDocument({
      title: title.trim() || '无标题文档',
      content
    });
    
    if (!isAutoSave) {
      toast.success('文档已保存');
    }
    
    return savedDoc;
  } catch (error) {
    console.error('保存文档错误:', error);
    if (!isAutoSave) {
      toast.error('保存文档失败');
    }
    return null;
  }
};

export default function MarkdownEditor({ 
  documentId,
  title: externalTitle,
  onTitleChange,
  content: externalContent,
  onContentChange
}: MarkdownEditorProps) {
  // 状态管理
  const [value, setValue] = useState<string>(externalContent || '');
  const [title, setTitle] = useState<string>(externalTitle || '');
  const [isAIContinueModalOpen, setIsAIContinueModalOpen] = useState(false);
  const [isAIEditModalOpen, setIsAIEditModalOpen] = useState(false);
  const [isAPIKeyModalOpen, setIsAPIKeyModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiProgress, setAiProgress] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const lastSavedContentRef = useRef<string>('');
  const lastSavedTitleRef = useRef<string>('');
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasLoadedDocRef = useRef<boolean>(false);
  const router = useRouter();

  // 同步外部标题
  useEffect(() => {
    if (externalTitle !== undefined && externalTitle !== title) {
      setTitle(externalTitle);
    }
  }, [externalTitle]);

  // 同步外部内容
  useEffect(() => {
    if (externalContent !== undefined && externalContent !== value) {
      setValue(externalContent);
    }
  }, [externalContent]);

  // 加载文档
  useEffect(() => {
    if (hasLoadedDocRef.current) {
      return; // 防止重复加载
    }
    
    if (documentId) {
      // 尝试加载文档
      const doc = getDocumentById(documentId);
      if (doc) {
        setValue(doc.content);
        setTitle(doc.title);
        // 通知父组件
        if (onContentChange) onContentChange(doc.content);
        if (onTitleChange) onTitleChange(doc.title);
        
        lastSavedContentRef.current = doc.content;
        lastSavedTitleRef.current = doc.title;
        hasLoadedDocRef.current = true;
      } else {
        toast.error('无法加载文档');
        router.push('/documents');
      }
    } else {
      // 设置为已加载，防止后续重复检查
      hasLoadedDocRef.current = true;
    }
  }, [documentId, router, onContentChange, onTitleChange]);

  // 设置自动保存
  useEffect(() => {
    // 确保已经完成初始加载
    if (!hasLoadedDocRef.current) {
      return;
    }
    
    // 启动自动保存定时器
    autoSaveTimerRef.current = setInterval(() => {
      const contentChanged = value !== lastSavedContentRef.current;
      const titleChanged = title !== lastSavedTitleRef.current;
      
      if ((contentChanged || titleChanged) && value.trim() !== '') {
        const savedDoc = saveDocumentToStorage(title, value, true);
        if (savedDoc) {
          lastSavedContentRef.current = value;
          lastSavedTitleRef.current = title;
        }
      }
    }, AUTO_SAVE_INTERVAL);

    // 清理定时器
    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [value, title, hasLoadedDocRef.current]);

  // 页面卸载前保存
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (value.trim() !== '') {
        saveDocumentToStorage(title, value, true);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [value, title]);

  // 手动保存文档
  const handleSave = async () => {
    if (title.trim() === '') {
      toast.error('请输入标题');
      return;
    }

    setIsSaving(true);
    try {
      const savedDoc = saveDocumentToStorage(title, value, false);
      lastSavedContentRef.current = value;
      lastSavedTitleRef.current = title;

      // 如果是新文档，重定向到编辑页面
      if (!documentId && savedDoc) {
        router.push(`/editor?id=${savedDoc.id}`);
      }
    } catch (error) {
      console.error('保存文档错误:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // 下载文档
  const handleDownload = () => {
    if (title.trim() === '') {
      toast.error('请输入标题');
      return;
    }

    try {
      downloadDocument({
        id: Date.now().toString(),
        title,
        content: value,
        lastModified: Date.now()
      });
      
      toast.success('文档已下载');
    } catch (error) {
      console.error('下载文档错误:', error);
      toast.error('下载文档失败');
    }
  };

  // 处理AI续写
  const handleAIContinue = async (settings: any) => {
    const apiKey = getAPIKey();
    if (!apiKey) {
      setIsAPIKeyModalOpen(true);
      return;
    }

    // 保存当前文档
    saveDocumentToStorage(title, value, true);

    setIsAIContinueModalOpen(false);
    setIsProcessing(true);
    setShowProgress(true);
    setAiProgress(0);
    
    try {
      let continuedText = '';
      
      // 使用流式传输
      await continueWithAI(value, {
        ...settings,
        onStream: (chunk) => {
          continuedText += chunk;
          // 使用函数式更新来避免闭包问题
          setValue(prev => {
            const newValue = prev + chunk;
            // 使用setTimeout来避免在渲染过程中更新父组件状态
            setTimeout(() => {
              if (onContentChange) onContentChange(newValue);
            }, 0);
            return newValue;
          });
        },
        onProgress: (progress) => {
          setAiProgress(progress);
        }
      });
      
      toast.success('AI续写完成');
    } catch (error) {
      console.error('AI续写错误:', error);
      toast.error('AI续写失败，请检查API密钥和网络连接');
    } finally {
      setIsProcessing(false);
      // 延迟隐藏进度条，让用户看到100%
      setTimeout(() => {
        setShowProgress(false);
        setAiProgress(0);
      }, 1000);
    }
  };

  // 处理AI编辑
  const handleAIEdit = async (instruction: string, settings: any) => {
    const apiKey = getAPIKey();
    if (!apiKey) {
      setIsAPIKeyModalOpen(true);
      return;
    }

    // 保存当前文档
    saveDocumentToStorage(title, value, true);

    setIsAIEditModalOpen(false);
    setIsProcessing(true);
    setShowProgress(true);
    setAiProgress(0);
    
    try {
      let editedText = '';
      
      // 使用流式传输
      editedText = await editWithAI(value, instruction, {
        ...settings,
        onStream: (chunk) => {
          // 对于编辑，我们不实时更新，而是等待完整结果
          editedText += chunk;
        },
        onProgress: (progress) => {
          setAiProgress(progress);
        }
      });
      
      // 编辑完成后更新内容
      setValue(editedText);
      // 使用setTimeout来避免在渲染过程中更新父组件状态
      setTimeout(() => {
        if (onContentChange) onContentChange(editedText);
      }, 0);
      toast.success('AI编辑完成');
    } catch (error) {
      console.error('AI编辑错误:', error);
      toast.error('AI编辑失败，请检查API密钥和网络连接');
    } finally {
      setIsProcessing(false);
      // 延迟隐藏进度条，让用户看到100%
      setTimeout(() => {
        setShowProgress(false);
        setAiProgress(0);
      }, 1000);
    }
  };

  // 处理内容变化
  const handleContentChange = (newValue: string | undefined) => {
    const content = newValue || '';
    setValue(content);
    
    // 使用setTimeout来避免在渲染过程中更新父组件状态
    setTimeout(() => {
      if (onContentChange) onContentChange(content);
    }, 0);
  };

  // 处理标题变化
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    
    // 使用setTimeout来避免在渲染过程中更新父组件状态
    setTimeout(() => {
      if (onTitleChange) onTitleChange(newTitle);
    }, 0);
  };

  return (
    <div className="flex flex-col h-full">
      <Toaster position="top-right" />
      
      {/* 标题和工具栏 */}
      <div className="flex items-center justify-between p-4 border-b">
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="请输入标题..."
          className="flex-1 text-xl font-bold border-none outline-none"
        />
        
        <div className="flex space-x-2">
          <button
            onClick={() => router.push('/settings')}
            className="flex items-center px-3 py-1 text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
            title="设置"
          >
            <FiSettings className="mr-1" />
            设置
          </button>
          
          <button
            onClick={() => setIsAIEditModalOpen(true)}
            disabled={isProcessing}
            className="flex items-center px-3 py-1 text-indigo-600 bg-indigo-100 rounded hover:bg-indigo-200 disabled:opacity-50"
            title="AI编辑"
          >
            <FiEdit className="mr-1" />
            AI编辑
          </button>
          
          <button
            onClick={() => setIsAIContinueModalOpen(true)}
            disabled={isProcessing}
            className="flex items-center px-3 py-1 text-purple-600 bg-purple-100 rounded hover:bg-purple-200 disabled:opacity-50"
            title="AI续写"
          >
            <FiZap className="mr-1" />
            AI续写
          </button>
          
          <button
            onClick={handleDownload}
            className="flex items-center px-3 py-1 text-green-600 bg-green-100 rounded hover:bg-green-200"
            title="下载"
          >
            <FiDownload className="mr-1" />
            下载
          </button>
          
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center px-3 py-1 text-blue-600 bg-blue-100 rounded hover:bg-blue-200 disabled:opacity-50"
            title="保存到浏览器"
          >
            <FiSave className="mr-1" />
            {isSaving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
      
      {/* 进度条 */}
      {showProgress && (
        <div className="relative w-full h-1 bg-gray-200">
          <div 
            className="absolute top-0 left-0 h-1 bg-blue-500 transition-all duration-300"
            style={{ width: `${aiProgress}%` }}
          ></div>
        </div>
      )}
      
      {/* Markdown编辑器 */}
      <div className="flex-1 overflow-auto">
        <div data-color-mode="light">
          <MDEditor
            value={value}
            onChange={handleContentChange}
            height="100%"
            preview="edit"
            className="w-full h-full"
          />
        </div>
      </div>
      
      {/* AI续写设置模态框 */}
      <AIContinueModal
        isOpen={isAIContinueModalOpen}
        onClose={() => setIsAIContinueModalOpen(false)}
        onContinue={handleAIContinue}
      />
      
      {/* AI编辑设置模态框 */}
      <AIEditModal
        isOpen={isAIEditModalOpen}
        onClose={() => setIsAIEditModalOpen(false)}
        onEdit={handleAIEdit}
      />
      
      {/* API密钥设置模态框 */}
      <APIKeyModal
        isOpen={isAPIKeyModalOpen}
        onClose={() => setIsAPIKeyModalOpen(false)}
      />
    </div>
  );
}
