'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FiCheck, FiX, FiEdit3, FiClock } from 'react-icons/fi';

interface AIContinueIndicatorProps {
  position: { x: number, y: number } | null;
  content: string;
  isStreaming: boolean;
  progress: number;
  onClose: () => void;
  onAccept: () => void;
}

const AIContinueIndicator: React.FC<AIContinueIndicatorProps> = ({
  position,
  content,
  isStreaming,
  progress,
  onClose,
  onAccept
}) => {
  const indicatorRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isPopoverVisible, setIsPopoverVisible] = useState(false);
  const [isIndicatorVisible, setIsIndicatorVisible] = useState(false);
  
  // 当位置变化时显示指示器
  useEffect(() => {
    if (position) {
      console.log('AIContinueIndicator: 接收到新位置', position);
      setIsIndicatorVisible(true);
    } else {
      console.log('AIContinueIndicator: 位置为空，隐藏指示器');
      setIsIndicatorVisible(false);
      setIsPopoverVisible(false);
    }
  }, [position]);
  
  // 自动滚动到底部
  useEffect(() => {
    if (contentRef.current && content) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [content]);
  
  // 处理鼠标进入指示器
  const handleMouseEnter = () => {
    setIsPopoverVisible(true);
  };
  
  // 处理鼠标离开指示器
  const handleMouseLeave = () => {
    setIsPopoverVisible(false);
  };
  
  // 如果没有位置信息，不渲染组件
  if (!position) {
    console.log('AIContinueIndicator: 没有位置信息，不渲染组件');
    return null;
  }
  
  console.log('AIContinueIndicator: 渲染组件', { position, isIndicatorVisible, progress });
  
  // 获取状态文本和图标
  const getStatusInfo = () => {
    if (isStreaming) {
      return {
        text: '续写中...',
        icon: <FiClock className="animate-pulse" size={14} />,
        color: 'text-blue-500',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200'
      };
    } else {
      return {
        text: '续写完成',
        icon: <FiCheck size={14} />,
        color: 'text-green-500',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      };
    }
  };
  
  const statusInfo = getStatusInfo();
  
  return (
    <>
      {/* 指示器（状态标签） */}
      <div 
        ref={indicatorRef}
        className={`fixed z-40 rounded-full shadow-sm cursor-pointer transition-all duration-300 ${statusInfo.bgColor} ${statusInfo.borderColor} border`}
        style={{ 
          top: `${position.y}px`, 
          left: `${position.x}px`,
          opacity: isIndicatorVisible ? 1 : 0,
          transition: 'all 0.3s ease-in-out',
          padding: '4px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '12px',
          fontWeight: 500,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
        }}
        onMouseEnter={handleMouseEnter}
      >
        {statusInfo.icon}
        <span className={`${statusInfo.color}`}>{statusInfo.text}</span>
        {!isStreaming && <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse ml-1"></div>}
      </div>
      
      {/* 弹窗 */}
      {isPopoverVisible && (
        <div 
          ref={popoverRef}
          className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 w-72 max-w-sm overflow-hidden"
          style={{ 
            top: `${position.y + 32}px`, 
            left: `${position.x}px`,
            maxHeight: '350px',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            transform: 'translateY(0)',
            opacity: 1,
            transition: 'transform 0.3s ease, opacity 0.3s ease',
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* 标题栏 */}
          <div className={`flex justify-between items-center px-4 py-3 ${statusInfo.bgColor} ${statusInfo.borderColor} border-b`}>
            <div className="flex items-center gap-2">
              <FiEdit3 size={16} className={statusInfo.color} />
              <div className={`text-sm font-medium ${statusInfo.color}`}>
                {statusInfo.text}
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 focus:outline-none rounded-full p-1 hover:bg-gray-100 transition-colors"
              disabled={isStreaming}
            >
              <FiX size={16} />
            </button>
          </div>
          
          {/* 内容区域 */}
          <div 
            ref={contentRef}
            className="p-4 overflow-auto flex-1 text-sm text-gray-700 whitespace-pre-wrap bg-gray-50"
            style={{ maxHeight: '220px', lineHeight: '1.6' }}
          >
            {content || '正在生成内容...'}
          </div>
          
          {/* 操作按钮 - 只在完成时显示 */}
          {!isStreaming && content && (
            <div className="flex justify-between px-4 py-3 border-t border-gray-200 bg-white">
              <button
                onClick={onClose}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-sm flex items-center hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                <FiX size={14} className="mr-1.5" />
                取消
              </button>
              <button
                onClick={onAccept}
                className="px-3 py-1.5 bg-blue-500 text-white rounded-md text-sm flex items-center hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                <FiCheck size={14} className="mr-1.5" />
                复制到剪贴板
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default AIContinueIndicator;
