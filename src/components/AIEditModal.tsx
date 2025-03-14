'use client';

import React, { useState, useEffect } from 'react';
import { AISettings, getAISettings, saveAISettings, getModels, AIModel } from '@/services/aiSettingsService';
import { toast } from 'react-hot-toast';

interface AIEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: (instruction: string, settings: AISettings) => void;
}

export default function AIEditModal({ isOpen, onClose, onEdit }: AIEditModalProps) {
  const [settings, setSettings] = useState<AISettings>(getAISettings());
  const [models, setModels] = useState<AIModel[]>([]);
  const [instruction, setInstruction] = useState('');
  
  useEffect(() => {
    if (isOpen) {
      setSettings(getAISettings());
      setModels(getModels());
      setInstruction('');
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'instruction') {
      setInstruction(value);
    } else {
      setSettings(prev => {
        const newSettings = { 
          ...prev,
          [name]: name === 'temperature' || name === 'maxTokens' 
            ? parseFloat(value) 
            : value 
        };
        return newSettings;
      });
    }
  };

  const handleSave = () => {
    if (!instruction.trim()) {
      toast.error('请输入编辑指令');
      return;
    }
    
    saveAISettings(settings);
    onEdit(instruction, settings);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold mb-4">AI编辑设置</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              编辑指令
            </label>
            <textarea
              name="instruction"
              value={instruction}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例如：修改文章风格为更加正式的学术风格"
              rows={4}
            />
          </div>
          
          <div>
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
          
          <div>
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
          
          <div>
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
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
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
            disabled={models.length === 0 || !instruction.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            确认并编辑
          </button>
        </div>
      </div>
    </div>
  );
}
