'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { toast, Toaster } from 'react-hot-toast';
import { FiSave, FiDownload, FiSettings, FiZap, FiEdit } from 'react-icons/fi';
import { saveDocument, getDocument, saveDraftDocument, getDraftDocument, clearDraftDocument } from '@/services/documentService';
import { continueWithAI, editWithAI } from '@/services/aiService';
import { getAPIKey } from '@/services/aiSettingsService';
import AIContinueModal from './AIContinueModal';
import AIEditModal from './AIEditModal';
import APIKeyModal from './APIKeyModal';

// 动态导入Markdown编辑器，避免SSR问题
const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default),
  { ssr: false }
);

// 编辑器组件属性
interface MarkdownEditorProps {
  documentId?: string;
}

// 自动保存间隔（毫秒）
const AUTO_SAVE_INTERVAL = 30000; // 30秒
// 草稿保存间隔（毫秒）
const DRAFT_SAVE_INTERVAL = 3000; // 3秒

export default function MarkdownEditor({ documentId }: MarkdownEditorProps) {
  // 状态管理
  const [value, setValue] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [isAIContinueModalOpen, setIsAIContinueModalOpen] = useState(false);
  const [isAIEditModalOpen, setIsAIEditModalOpen] = useState(false);
  const [isAPIKeyModalOpen, setIsAPIKeyModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiProgress, setAiProgress] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const lastSavedRef = useRef<string>('');
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const draftSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasLoadedDraftRef = useRef<boolean>(false);
  const router = useRouter();

  // 加载文档或草稿
  useEffect(() => {
    if (hasLoadedDraftRef.current) {
      return; // 防止重复加载
    }
    
    if (documentId) {
      // 优先尝试加载草稿
      const draft = getDraftDocument();
      if (draft && draft.id === documentId) {
        setValue(draft.content);
        setTitle(draft.title);
        lastSavedRef.current = '';  // 设置为空，表示有未保存的更改
        toast.success('已加载未保存的草稿');
        hasLoadedDraftRef.current = true;
      } else {
        // 如果没有草稿，加载保存的文档
        const doc = getDocument(documentId);
        if (doc) {
          setValue(doc.content);
          setTitle(doc.title);
          lastSavedRef.current = doc.content;
          hasLoadedDraftRef.current = true;
        } else {
          toast.error('无法加载文档');
          router.push('/documents');
        }
      }
    } else {
      // 新文档，检查是否有未关联ID的草稿
      const draft = getDraftDocument();
      if (draft && !draft.id) {
        setValue(draft.content);
        setTitle(draft.title);
        toast.success('已恢复未保存的草稿');
        hasLoadedDraftRef.current = true;
      } else {
        // 设置为已加载，防止后续重复检查
        hasLoadedDraftRef.current = true;
      }
    }
  }, [documentId, router]);

  // 设置自动保存
  useEffect(() => {
    // 启动自动保存定时器
    autoSaveTimerRef.current = setInterval(() => {
      if (value !== lastSavedRef.current && title.trim() !== '') {
        handleSave(false);
      }
    }, AUTO_SAVE_INTERVAL);

    // 清理定时器
    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [value, title]);

  // 设置草稿自动保存
  useEffect(() => {
    // 确保已经完成初始加载
    if (!hasLoadedDraftRef.current) {
      return;
    }
    
    // 启动草稿保存定时器
    draftSaveTimerRef.current = setInterval(() => {
      if (value.trim() !== '') {
        saveDraftDocument({
          id: documentId,
          title: title.trim() || '无标题文档',
          content: value,
          lastModified: new Date().toISOString()
        });
      }
    }, DRAFT_SAVE_INTERVAL);

    // 清理定时器
    return () => {
      if (draftSaveTimerRef.current) {
        clearInterval(draftSaveTimerRef.current);
      }
    };
  }, [value, title, documentId, hasLoadedDraftRef.current]);

  // 页面卸载前保存草稿
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (value.trim() !== '') {
        saveDraftDocument({
          id: documentId,
          title: title.trim() || '无标题文档',
          content: value,
          lastModified: new Date().toISOString()
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [value, title, documentId]);

  // 保存文档
  const handleSave = async (showToast = true) => {
    if (title.trim() === '') {
      toast.error('请输入标题');
      return;
    }

    setIsSaving(true);
    try {
      const savedId = saveDocument({
        id: documentId,
        title,
        content: value,
        updatedAt: new Date().toISOString(),
      });

      lastSavedRef.current = value;

      if (showToast) {
        toast.success('文档已保存');
      }

      // 如果是新文档，重定向到编辑页面
      if (!documentId && savedId) {
        router.push(`/editor?id=${savedId}`);
      }
    } catch (error) {
      console.error('保存文档错误:', error);
      toast.error('保存文档失败');
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
      // 创建Blob对象
      const blob = new Blob([value], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      
      // 创建下载链接
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title}.md`;
      document.body.appendChild(a);
      a.click();
      
      // 清理
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
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

    // 保存当前草稿
    saveDraftDocument({
      id: documentId,
      title: title.trim() || '无标题文档',
      content: value,
      lastModified: new Date().toISOString()
    });

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
          setValue(prev => prev + chunk);
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

    // 保存当前草稿
    saveDraftDocument({
      id: documentId,
      title: title.trim() || '无标题文档',
      content: value,
      lastModified: new Date().toISOString()
    });

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

  // 处理内容变化，保存草稿
  const handleContentChange = (newValue: string | undefined) => {
    const content = newValue || '';
    setValue(content);
    
    // 确保已经完成初始加载后再保存草稿
    if (hasLoadedDraftRef.current && content.trim() !== '') {
      saveDraftDocument({
        id: documentId,
        title: title.trim() || '无标题文档',
        content,
        lastModified: new Date().toISOString()
      });
    }
  };

  // 处理标题变化，保存草稿
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    
    // 确保已经完成初始加载后再保存草稿
    if (hasLoadedDraftRef.current && value.trim() !== '') {
      saveDraftDocument({
        id: documentId,
        title: newTitle.trim() || '无标题文档',
        content: value,
        lastModified: new Date().toISOString()
      });
    }
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
            onClick={() => handleSave(true)}
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
