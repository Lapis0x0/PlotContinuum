'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FiX, FiCheck } from 'react-icons/fi';

interface AIContinuePopoverProps {
  position: { x: number, y: number } | null;
  content: string;
  isStreaming: boolean;
  progress: number;
  onClose: () => void;
  onAccept: () => void;
}

const AIContinuePopover: React.FC<AIContinuePopoverProps> = ({
  position,
  content,
  isStreaming,
  progress,
  onClose,
  onAccept
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  
  // 当位置变化时显示弹窗
  useEffect(() => {
    if (position) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [position]);
  
  // 点击外部关闭弹窗
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current && 
        !popoverRef.current.contains(event.target as Node) &&
        isVisible && 
        !isStreaming // 只有在流式传输完成后才允许点击外部关闭
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible, isStreaming, onClose]);
  
  // 自动滚动到底部
  useEffect(() => {
    if (contentRef.current && content) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [content]);
  
  if (!position) return null;
  
  return (
    <div 
      ref={popoverRef}
      className="fixed z-50 bg-white rounded-md shadow-lg border border-gray-200 w-64 max-w-sm"
      style={{ 
        top: `${position.y}px`, 
        left: `${position.x}px`,
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.2s ease-in-out',
        maxHeight: '300px',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* 标题栏 */}
      <div className="flex justify-between items-center px-3 py-2 border-b border-gray-200 bg-gray-50 rounded-t-md">
        <div className="text-sm font-medium text-gray-700">AI续写</div>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 focus:outline-none"
          disabled={isStreaming}
        >
          <FiX size={18} />
        </button>
      </div>
      
      {/* 进度条 */}
      {isStreaming && (
        <div className="relative w-full h-1 bg-gray-100">
          <div 
            className="absolute top-0 left-0 h-1 bg-blue-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}
      
      {/* 内容区域 */}
      <div 
        ref={contentRef}
        className="p-3 overflow-auto flex-1 text-sm text-gray-700 whitespace-pre-wrap"
        style={{ maxHeight: '200px' }}
      >
        {content || '正在生成内容...'}
      </div>
      
      {/* 操作按钮 */}
      <div className="flex justify-end px-3 py-2 border-t border-gray-200 bg-gray-50 rounded-b-md">
        <button
          onClick={onAccept}
          className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm flex items-center hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isStreaming || !content}
        >
          <FiCheck size={14} className="mr-1" />
          插入
        </button>
      </div>
    </div>
  );
};

export default AIContinuePopover;
