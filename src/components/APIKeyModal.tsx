'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { getAPIKey, saveAPIKey } from '@/services/aiSettingsService';
import { useRouter } from 'next/navigation';

interface APIKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (apiKey: string) => void;
}

export default function APIKeyModal({ isOpen, onClose, onSave }: APIKeyModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      setApiKey(getAPIKey());
      setShowApiKey(false);
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      toast.error('请输入API密钥');
      return;
    }

    setIsSaving(true);
    try {
      saveAPIKey(apiKey);
      if (onSave) {
        onSave(apiKey);
      } else {
        onClose();
      }
      toast.success('API密钥已保存');
    } catch (error) {
      console.error('保存API密钥错误:', error);
      toast.error('保存API密钥时出错');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGoToSettings = () => {
    onClose();
    router.push('/settings');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold mb-4">设置API密钥</h2>
        
        <p className="text-gray-600 mb-4 text-sm">
          请输入您的SiliconFlow API密钥。您可以从
          <a 
            href="https://cloud.siliconflow.cn/account/ak" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline ml-1"
          >
            https://cloud.siliconflow.cn/account/ak
          </a>
          获取密钥。
        </p>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-medium mb-2">
            API密钥
          </label>
          <div className="relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入您的API密钥"
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              onClick={() => setShowApiKey(!showApiKey)}
            >
              {showApiKey ? '隐藏' : '显示'}
            </button>
          </div>
        </div>
        
        <p className="text-gray-600 mb-4 text-sm">
          您还可以在设置页面中配置更多选项，如模型和API基础URL。
        </p>
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={handleGoToSettings}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            前往设置页面
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}
