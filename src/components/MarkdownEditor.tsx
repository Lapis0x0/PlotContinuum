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
import AIContinueIndicator from '@/components/AIContinueIndicator';
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
    range?: Range | null,
    isInsertMode: boolean,
    selectionStartOffset?: number,
    selectionEndOffset?: number,
    fullText?: string
  } | null>(null);
  const [processingSelection, setProcessingSelection] = useState<any>(null);
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
    const selectedText = selection ? selection.toString() : '';
    const isInsertMode = selectedText ? true : false;
    
    // 记录原始选区信息
    console.log('原始选区信息:', {
      selection: selectedText,
      rangeCount: selection?.rangeCount,
      isInsertMode
    });
    
    // 创建选区信息对象，但不立即设置状态
    let selectionInfo = null;
    let popoverPos = null;
    
    if (isInsertMode && selection) {
      // 获取完整文本用于记忆位置
      const fullText = value;
      const range = selection.getRangeAt(0);
      
      console.log('选中的文本:', {
        text: selectedText,
        length: selectedText.length
      });
      
      // 创建选区信息对象
      selectionInfo = {
        text: selectedText,
        range: range.cloneRange(),
        isInsertMode: true,
        selectionStartOffset: 0,
        selectionEndOffset: 0,
        fullText
      };
      
      // 简化定位逻辑，直接使用选区位置
      const rect = range.getBoundingClientRect();
      
      console.log('选区位置:', rect);
      
      // 创建弹窗位置对象
      popoverPos = { 
        x: rect.left, 
        y: rect.bottom + 10 // 选区下方，留出一定间距
      };
      
      console.log('设置的弹窗位置:', popoverPos);
    } else {
      // 在文档末尾添加内容
      selectionInfo = {
        text: value,
        range: null,
        isInsertMode: false
      };
      
      // 获取编辑器末尾位置
      const editorElement = document.querySelector('.tiptap-editor .ProseMirror') as HTMLElement;
      if (editorElement) {
        const rect = editorElement.getBoundingClientRect();
        console.log('编辑器位置:', rect);
        
        // 创建弹窗位置对象
        popoverPos = { 
          x: rect.left + 20, // 稍微向右偏移，避免靠边
          y: rect.bottom - 30 // 编辑器下方，留出一定间距
        };
        
        console.log('设置的弹窗位置:', popoverPos);
      } else {
        // 默认位置
        popoverPos = { x: window.innerWidth / 2 - 60, y: window.innerHeight / 2 };
        console.log('使用默认位置:', popoverPos);
      }
    }
    
    // 设置状态
    setCurrentSelection(selectionInfo);
    setPopoverPosition(popoverPos);
    
    // 直接调用handleAIContinue函数，但传递选区信息作为参数
    handleAIContinueWithSelection(selectionInfo, {
      model: settings.model,
      temperature: settings.temperature,
      maxTokens: settings.maxTokens,
      continuationMode: isInsertMode ? 'insert' : 'append'
    });
  };
  
  // 新增函数：使用传入的选区信息进行AI续写
  const handleAIContinueWithSelection = async (selectionInfo: any, options: any) => {
    try {
      setIsStreaming(true);
      setStreamingContent('');
      setAiProgress(0);
      
      // 保存选区信息到专用状态变量，确保后续可以正确获取
      setProcessingSelection(selectionInfo);
      
      console.log('开始AI续写，选项:', options);
      console.log('当前弹窗位置:', popoverPosition);
      console.log('传入的选区信息:', selectionInfo);
      
      // 获取API密钥
      const apiKey = getAPIKey();
      if (!apiKey) {
        toast.error('请先设置API密钥');
        setIsAPIKeyModalOpen(true);
        return;
      }
      
      // 获取要续写的文本
      let textToProcess = '';
      
      if (options.continuationMode === 'insert' && selectionInfo?.text) {
        // 插入模式：使用选中的文本
        textToProcess = selectionInfo.text;
        console.log('使用选中的文本进行续写');
      } else {
        // 追加模式：使用完整文档
        textToProcess = value || '';
        console.log('使用完整文档进行续写');
      }
      
      // 记录实际传递给模型的文本
      console.log('传递给模型的文本:', {
        length: textToProcess.length,
        preview: textToProcess.length > 100 
          ? textToProcess.substring(0, 50) + '...' + textToProcess.substring(textToProcess.length - 50) 
          : textToProcess,
        isFullDocument: textToProcess === value,
        isSelection: selectionInfo?.text === textToProcess,
        mode: options.continuationMode
      });
      
      // 保存当前文档
      saveDocumentToStorage(title, value, true);
      
      // 准备AI续写选项
      const aiOptions = {
        model: options.model,
        temperature: options.temperature,
        maxTokens: options.maxTokens || 500,
        continuationMode: options.continuationMode,
        onStream: (chunk: string) => {
          setStreamingContent(prev => prev + chunk);
        },
        onProgress: (progress: number) => {
          setAiProgress(progress);
          console.log('AI续写进度:', progress);
        }
      };
      
      // 调用AI服务进行续写
      const result = await continueWithAI(textToProcess, aiOptions);
      
      console.log('AI续写完成，内容长度:', result.length);
      
      // 确保进度条显示100%
      setAiProgress(100);
      
      // 保存最终结果
      setStreamingContent(result);
    } catch (error) {
      console.error('AI续写出错:', error);
      toast.error('AI续写出错，请稍后再试');
      
      // 出错时关闭弹窗
      setPopoverPosition(null);
      setProcessingSelection(null);
    } finally {
      setIsStreaming(false);
    }
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
  const handleAIContinue = async (options: any) => {
    try {
      setIsStreaming(true);
      setStreamingContent('');
      setAiProgress(0);
      
      console.log('开始AI续写，选项:', options);
      console.log('当前弹窗位置:', popoverPosition);
      console.log('当前选区信息:', currentSelection);
      
      // 获取API密钥
      const apiKey = getAPIKey();
      if (!apiKey) {
        toast.error('请先设置API密钥');
        setIsAPIKeyModalOpen(true);
        return;
      }
      
      // 获取要续写的文本
      let textToProcess = '';
      
      if (options.continuationMode === 'insert' && currentSelection?.text) {
        // 插入模式：使用选中的文本
        textToProcess = currentSelection.text;
        console.log('使用选中的文本进行续写');
      } else {
        // 追加模式：使用完整文档
        textToProcess = value || '';
        console.log('使用完整文档进行续写');
      }
      
      // 记录实际传递给模型的文本
      console.log('传递给模型的文本:', {
        length: textToProcess.length,
        preview: textToProcess.length > 100 
          ? textToProcess.substring(0, 50) + '...' + textToProcess.substring(textToProcess.length - 50) 
          : textToProcess,
        isFullDocument: textToProcess === value,
        isSelection: currentSelection?.text === textToProcess,
        mode: options.continuationMode
      });
      
      // 保存当前文档
      saveDocumentToStorage(title, value, true);
      
      // 准备AI续写选项
      const aiOptions = {
        model: options.model,
        temperature: options.temperature,
        maxTokens: options.maxTokens || 500,
        continuationMode: options.continuationMode,
        onStream: (chunk: string) => {
          setStreamingContent(prev => prev + chunk);
        },
        onProgress: (progress: number) => {
          setAiProgress(progress);
          console.log('AI续写进度:', progress);
        }
      };
      
      // 调用AI服务进行续写
      const result = await continueWithAI(textToProcess, aiOptions);
      
      console.log('AI续写完成，内容长度:', result.length);
      
      // 确保进度条显示100%
      setAiProgress(100);
      
      // 保存最终结果
      setStreamingContent(result);
    } catch (error) {
      console.error('AI续写出错:', error);
      toast.error('AI续写出错，请稍后再试');
      
      // 出错时关闭弹窗
      setPopoverPosition(null);
    } finally {
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
    if (!processingSelection || !streamingContent) return;
    
    try {
      // 复制内容到剪贴板
      navigator.clipboard.writeText(streamingContent)
        .then(() => {
          toast.success('续写内容已复制到剪贴板');
          console.log('续写内容已复制到剪贴板');
        })
        .catch((error) => {
          console.error('复制到剪贴板失败:', error);
          toast.error('复制到剪贴板失败');
        });
      
      // 清理状态
      setPopoverPosition(null);
      setStreamingContent('');
      setProcessingSelection(null);
    } catch (error) {
      console.error('处理AI续写内容时出错:', error);
      toast.error('处理AI续写内容时出错');
    }
  };

  // 关闭AI续写弹窗
  const handleCloseAIContinue = () => {
    setPopoverPosition(null);
    setStreamingContent('');
    setProcessingSelection(null);
    
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
      
      {/* AI续写指示器 */}
      <AIContinueIndicator
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
