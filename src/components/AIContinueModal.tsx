'use client';

import React, { useState, useEffect } from 'react';
import { AISettings, getAISettings, saveAISettings, getModels, AIModel } from '@/services/aiSettingsService';
import { toast } from 'react-hot-toast';
import { FiX, FiZap } from 'react-icons/fi';

interface AIContinueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: (settings: AISettings) => void;
  selectedText?: string;
  hasSelection?: boolean;
}

export default function AIContinueModal({ 
  isOpen, 
  onClose, 
  onContinue,
  selectedText,
  hasSelection
}: AIContinueModalProps) {
  const [settings, setSettings] = useState<AISettings>(getAISettings());
  const [models, setModels] = useState<AIModel[]>([]);
  const [continuationMode, setContinuationMode] = useState<'append' | 'insert'>('append');

  useEffect(() => {
    if (isOpen) {
      setSettings(getAISettings());
      setModels(getModels());
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setSettings(prev => {
      const newSettings = { 
        ...prev,
        [name]: name === 'temperature' || name === 'maxTokens' 
          ? parseFloat(value) 
          : value 
      };
      return newSettings;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveAISettings(settings);
    onContinue({
      ...settings,
      continuationMode,
      selectedText
    });
    toast.success('设置已保存');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">AI续写设置</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FiX size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          {hasSelection && (
            <div className="mb-4">
              <label className="block mb-2 font-medium text-gray-700">续写模式</label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="continuationMode"
                    value="append"
                    checked={continuationMode === 'append'}
                    onChange={() => setContinuationMode('append')}
                    className="mr-2"
                  />
                  <span>在文档末尾续写</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="continuationMode"
                    value="insert"
                    checked={continuationMode === 'insert'}
                    onChange={() => setContinuationMode('insert')}
                    className="mr-2"
                  />
                  <span>在选中位置续写</span>
                </label>
              </div>
              {continuationMode === 'insert' && selectedText && (
                <div className="mt-2 p-2 bg-gray-100 rounded text-sm">
                  <p className="font-medium">已选中文本:</p>
                  <p className="line-clamp-3 italic">{selectedText.length > 100 ? selectedText.substring(0, 100) + '...' : selectedText}</p>
                </div>
              )}
            </div>
          )}
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              模型
            </label>
            <select
              name="model"
              value={settings.model}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {models.length > 0 ? (
                models.map(model => (
                  <option key={model.id} value={model.value}>
                    {model.name}
                  </option>
                ))
              ) : (
                <option value="">没有可用的模型</option>
              )}
            </select>
            {models.length === 0 && (
              <p className="mt-1 text-xs text-red-500">
                请在设置页面添加模型
              </p>
            )}
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              温度 (0.1-1.0): {settings.temperature.toFixed(1)}
            </label>
            <input
              type="range"
              name="temperature"
              min="0.1"
              max="1.0"
              step="0.1"
              value={settings.temperature}
              onChange={handleChange}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>精确</span>
              <span>创意</span>
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              最大生成长度: {settings.maxTokens}
            </label>
            <input
              type="range"
              name="maxTokens"
              min="100"
              max="2000"
              step="100"
              value={settings.maxTokens}
              onChange={handleChange}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>短</span>
              <span>长</span>
            </div>
          </div>
          
          <button
            type="submit"
            className="flex items-center justify-center w-full px-4 py-2 text-white bg-purple-600 rounded hover:bg-purple-700"
          >
            <FiZap className="mr-2" />
            开始续写
          </button>
        </form>
      </div>
    </div>
  );
}
