'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast, Toaster } from 'react-hot-toast';
import { FiSave, FiDownload, FiSettings, FiZap, FiEdit } from 'react-icons/fi';
import { DocumentData, saveDocument, getDocumentById, downloadDocument } from '@/services/localStorageService';
import { continueWithAI, editWithAI } from '@/services/aiService';
import { getAPIKey, getAISettings, saveAPIKey } from '@/services/aiSettingsService';
import AIContinueModal from '@/components/AIContinueModal';
import AIEditModal from '@/components/AIEditModal';
import APIKeyModal from '@/components/APIKeyModal';
import AIContinuePopover from '@/components/AIContinuePopover';
import TiptapEditor from '@/components/TiptapEditor';

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
  const [selectionStart, setSelectionStart] = useState<number>(-1);
  const [selectionEnd, setSelectionEnd] = useState<number>(-1);
  const [contextMenuPosition, setContextMenuPosition] = useState<{x: number, y: number} | null>(null);
  const [popoverPosition, setPopoverPosition] = useState<{x: number, y: number} | null>(null);
  const [streamingContent, setStreamingContent] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentSelection, setCurrentSelection] = useState<{
    text: string,
    range: Range | null,
    isInsertMode: boolean
  } | null>(null);
  const lastSavedContentRef = useRef<string>('');
  const lastSavedTitleRef = useRef<string>('');
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasLoadedDocRef = useRef<boolean>(false);
  const editorRef = useRef<HTMLTextAreaElement | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
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
        setTimeout(() => {
          if (onContentChange) onContentChange(doc.content);
          if (onTitleChange) onTitleChange(doc.title);
        }, 0);
        
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

  // 点击外部关闭右键菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        contextMenuRef.current && 
        !contextMenuRef.current.contains(event.target as Node) &&
        contextMenuPosition !== null
      ) {
        setContextMenuPosition(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [contextMenuPosition]);

  // 设置编辑器右键菜单
  useEffect(() => {
    const setupContextMenu = () => {
      const editorElement = document.querySelector('.tiptap-editor .ProseMirror') as HTMLElement;
      if (!editorElement) return;

      editorElement.addEventListener('contextmenu', handleContextMenu);
      
      return () => {
        editorElement.removeEventListener('contextmenu', handleContextMenu);
      };
    };

    // 等待编辑器加载完成
    const timer = setTimeout(setupContextMenu, 1000);
    
    return () => {
      clearTimeout(timer);
    };
  }, []);

  // 处理右键菜单
  const handleContextMenu = (event: MouseEvent) => {
    event.preventDefault();
    
    const selection = window.getSelection();
    if (selection && selection.toString()) {
      // 获取选中的文本
      const selectedText = selection.toString();
      if (selectedText) {
        // 设置选中文本的位置（这里我们不再使用具体的索引，而是保存选中的文本）
        setSelectionStart(0);
        setSelectionEnd(1);
        setContextMenuPosition({ x: event.clientX, y: event.clientY });
      } else {
        setContextMenuPosition(null);
      }
    } else {
      setContextMenuPosition(null);
    }
  };

  // 直接使用默认设置进行AI续写
  const handleDirectAIContinue = async () => {
    const apiKey = getAPIKey();
    if (!apiKey) {
      setIsAPIKeyModalOpen(true);
      return;
    }

    setContextMenuPosition(null);
    
    // 获取AI设置
    const settings = getAISettings();
    
    // 确定续写模式
    const selection = window.getSelection();
    const isInsertMode = selection && selection.toString();
    
    // 保存当前选区信息
    if (isInsertMode && selection) {
      setCurrentSelection({
        text: selection.toString(),
        range: selection.getRangeAt(0).cloneRange(),
        isInsertMode: true
      });
      
      // 设置弹窗位置在选区附近
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setPopoverPosition({ 
        x: rect.right + 10, 
        y: rect.top 
      });
    } else {
      // 在文档末尾添加内容
      setCurrentSelection({
        text: value,
        range: null,
        isInsertMode: false
      });
      
      // 获取编辑器末尾位置
      const editorElement = document.querySelector('.tiptap-editor .ProseMirror') as HTMLElement;
      if (editorElement) {
        const rect = editorElement.getBoundingClientRect();
        setPopoverPosition({ 
          x: rect.right - 300, 
          y: rect.bottom - 50 
        });
      } else {
        // 默认位置
        setPopoverPosition({ x: window.innerWidth / 2 - 150, y: window.innerHeight / 2 - 100 });
      }
    }
    
    // 调用统一的handleAIContinue函数
    handleAIContinue({
      model: settings.model,
      temperature: settings.temperature,
      maxTokens: settings.maxTokens,
      continuationMode: isInsertMode ? 'insert' : 'append'
    });
  };

  // 直接使用默认设置进行AI编辑
  const handleDirectAIEdit = async () => {
    const apiKey = getAPIKey();
    if (!apiKey) {
      setIsAPIKeyModalOpen(true);
      return;
    }

    setContextMenuPosition(null);
    
    // 由于AI编辑需要用户提供指令，所以我们仍然需要打开编辑模态框
    setIsAIEditModalOpen(true);
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
    setIsStreaming(true);
    setStreamingContent('');
    setAiProgress(0);
    
    try {
      let continuedText = '';
      const selection = window.getSelection();
      const isInsertMode = settings.continuationMode === 'insert' && selection && selection.toString();
      const textToComplete = isInsertMode && selection ? selection.toString() : value;
      
      // 使用流式传输
      await continueWithAI(textToComplete, {
        ...settings,
        onStream: (chunk) => {
          continuedText += chunk;
          setStreamingContent(prev => prev + chunk);
        },
        onProgress: (progress) => {
          setAiProgress(progress);
        }
      });
      
      toast.success('AI续写完成');
    } catch (error) {
      console.error('AI续写错误:', error);
      toast.error('AI续写失败，请检查API密钥和网络连接');
      setPopoverPosition(null);
    } finally {
      setIsProcessing(false);
      setIsStreaming(false);
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
      const selection = window.getSelection();
      const isEditingSelection = selection && selection.toString();
      const textToEdit = isEditingSelection && selection ? selection.toString() : value;
      
      // 使用流式传输
      editedText = await editWithAI(textToEdit, instruction, {
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
      if (isEditingSelection && selection) {
        // 只替换选中的部分
        const range = selection.getRangeAt(0);
        const preSelectionText = value.substring(0, range.startOffset);
        const postSelectionText = value.substring(range.endOffset);
        const newValue = preSelectionText + editedText + postSelectionText;
        
        setValue(newValue);
        // 使用setTimeout来避免在渲染过程中更新父组件状态
        setTimeout(() => {
          if (onContentChange) onContentChange(newValue);
        }, 0);
      } else {
        // 替换整个内容
        setValue(editedText);
        // 使用setTimeout来避免在渲染过程中更新父组件状态
        setTimeout(() => {
          if (onContentChange) onContentChange(editedText);
        }, 0);
      }
      
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

  // 处理接受AI续写内容
  const handleAcceptAIContinue = () => {
    if (!currentSelection || !streamingContent) return;
    
    if (currentSelection.isInsertMode && currentSelection.range) {
      // 在选中文本所在段落的末尾添加新段落，并将生成的内容插入到新段落中
      const range = currentSelection.range;
      const selectedText = currentSelection.text;
      
      // 获取完整文本
      const fullText = value;
      
      // 找到选中文本所在段落的末尾
      const selectionStartOffset = range.startOffset;
      const selectionEndOffset = range.endOffset;
      
      // 向后查找段落结束位置（找到下一个换行符或文档末尾）
      let paragraphEndOffset = selectionEndOffset;
      while (paragraphEndOffset < fullText.length && fullText[paragraphEndOffset] !== '\n') {
        paragraphEndOffset++;
      }
      
      // 向前查找段落开始位置（找到上一个换行符或文档开头）
      let paragraphStartOffset = selectionStartOffset;
      while (paragraphStartOffset > 0 && fullText[paragraphStartOffset - 1] !== '\n') {
        paragraphStartOffset--;
      }
      
      // 构建新文本：段落前部分 + 段落内容 + 两个换行符 + 生成的内容 + 段落后部分
      const textBeforeParagraph = fullText.substring(0, paragraphStartOffset);
      const paragraphContent = fullText.substring(paragraphStartOffset, paragraphEndOffset);
      const textAfterParagraph = fullText.substring(paragraphEndOffset);
      
      // 在段落末尾添加两个换行符，然后添加生成的内容
      const newValue = textBeforeParagraph + paragraphContent + '\n\n' + streamingContent + textAfterParagraph;
      
      setValue(newValue);
      // 使用setTimeout来避免在渲染过程中更新父组件状态
      setTimeout(() => {
        if (onContentChange) onContentChange(newValue);
      }, 0);
    } else {
      // 在文档末尾添加新段落和生成的内容
      const newValue = value + '\n\n' + streamingContent;
      setValue(newValue);
      // 使用setTimeout来避免在渲染过程中更新父组件状态
      setTimeout(() => {
        if (onContentChange) onContentChange(newValue);
      }, 0);
    }
    
    // 清理状态
    setPopoverPosition(null);
    setStreamingContent('');
    setCurrentSelection(null);
    
    toast.success('AI续写内容已插入');
  };

  // 关闭AI续写弹窗
  const handleCloseAIContinue = () => {
    setPopoverPosition(null);
    setStreamingContent('');
    setCurrentSelection(null);
    
    if (isStreaming) {
      toast.error('AI续写已取消');
    }
  };

  // 处理保存API密钥
  const handleSaveAPIKey = (apiKey: string) => {
    if (apiKey) {
      saveAPIKey(apiKey);
      setIsAPIKeyModalOpen(false);
      // 保存API密钥后打开AI续写设置对话框
      setIsAIContinueModalOpen(true);
    }
  };

  // 处理内容变化
  const handleContentChange = (newValue: string) => {
    setValue(newValue);
    
    // 使用setTimeout来避免在渲染过程中更新父组件状态
    setTimeout(() => {
      if (onContentChange) onContentChange(newValue);
    }, 0);
  };

  return (
    <div className="flex flex-col h-full">
      <Toaster position="top-right" />
      
      {/* 进度条 */}
      {showProgress && (
        <div className="relative w-full h-1 bg-gray-200">
          <div 
            className="absolute top-0 left-0 h-1 bg-blue-500 transition-all duration-300"
            style={{ width: `${aiProgress}%` }}
          ></div>
        </div>
      )}
      
      {/* 编辑器 */}
      <div className="flex-1 overflow-auto">
        <TiptapEditor
          value={value}
          onChange={handleContentChange}
          placeholder="开始写作..."
        />
      </div>
      
      {/* AI续写弹窗 */}
      <AIContinuePopover
        position={popoverPosition}
        content={streamingContent}
        isStreaming={isStreaming}
        progress={aiProgress}
        onClose={handleCloseAIContinue}
        onAccept={handleAcceptAIContinue}
      />
      
      {/* 自定义右键菜单 */}
      {contextMenuPosition && (
        <div 
          ref={contextMenuRef}
          className="fixed z-50 bg-white rounded-md shadow-lg border border-gray-200"
          style={{ 
            top: `${contextMenuPosition.y}px`, 
            left: `${contextMenuPosition.x}px`,
            minWidth: '150px'
          }}
        >
          <div className="py-1">
            <button
              onClick={handleDirectAIContinue}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
              disabled={isProcessing}
            >
              <FiZap className="mr-2 text-purple-500" />
              AI续写选中内容
            </button>
            <button
              onClick={handleDirectAIEdit}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
              disabled={isProcessing}
            >
              <FiEdit className="mr-2 text-indigo-500" />
              AI编辑选中内容
            </button>
          </div>
        </div>
      )}
      
      {/* 模态框 */}
      <AIContinueModal
        isOpen={isAIContinueModalOpen}
        onClose={() => setIsAIContinueModalOpen(false)}
        onContinue={handleAIContinue}
        hasSelection={selectionStart >= 0 && selectionEnd >= 0}
      />
      
      <AIEditModal
        isOpen={isAIEditModalOpen}
        onClose={() => setIsAIEditModalOpen(false)}
        onEdit={handleAIEdit}
      />
      
      <APIKeyModal
        isOpen={isAPIKeyModalOpen}
        onClose={() => setIsAPIKeyModalOpen(false)}
        onSave={handleSaveAPIKey}
      />
    </div>
  );
}
