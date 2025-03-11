'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast, Toaster } from 'react-hot-toast';
import { FiSave, FiArrowLeft, FiKey, FiGlobe, FiPlus, FiTrash2, FiRefreshCw } from 'react-icons/fi';
import { 
  getAPIKey, 
  saveAPIKey, 
  getAISettings, 
  saveAISettings, 
  getModels,
  addModel,
  deleteModel,
  resetToDefaultModels,
  AIModel
} from '@/services/aiSettingsService';

export default function SettingsPage() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // 模型管理
  const [models, setModels] = useState<AIModel[]>([]);
  const [newModelName, setNewModelName] = useState('');
  const [newModelValue, setNewModelValue] = useState('');
  const [showAddModel, setShowAddModel] = useState(false);

  // 加载设置
  useEffect(() => {
    // 使用setTimeout确保在客户端渲染时执行
    const timer = setTimeout(() => {
      const savedApiKey = getAPIKey();
      const settings = getAISettings();
      const savedModels = getModels();
      
      setApiKey(savedApiKey);
      setBaseUrl(settings.baseUrl);
      setModels(savedModels);
    }, 0);
    
    return () => clearTimeout(timer);
  }, []);

  // 保存设置
  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // 保存API密钥
      if (apiKey.trim()) {
        saveAPIKey(apiKey);
      }
      
      // 保存基础URL
      saveAISettings({ baseUrl });
      
      toast.success('设置已保存');
      setTimeout(() => {
        router.push('/editor');
      }, 1500);
    } catch (error) {
      console.error('保存设置错误:', error);
      toast.error('保存设置时出错');
    } finally {
      setIsSaving(false);
    }
  };

  // 重置为默认URL
  const resetToDefaultUrl = () => {
    setBaseUrl('https://api.siliconflow.cn/v1');
    toast.success('已重置为默认URL');
  };
  
  // 添加新模型
  const handleAddModel = () => {
    if (!newModelName.trim() || !newModelValue.trim()) {
      toast.error('模型名称和值不能为空');
      return;
    }
    
    // 检查是否已存在相同的模型
    if (models.some(model => model.value === newModelValue)) {
      toast.error('已存在相同的模型值');
      return;
    }
    
    const updatedModels = addModel({
      name: newModelName,
      value: newModelValue
    });
    
    setModels(updatedModels);
    setNewModelName('');
    setNewModelValue('');
    setShowAddModel(false);
    toast.success('模型已添加');
  };
  
  // 删除模型
  const handleDeleteModel = (modelId: string) => {
    const updatedModels = deleteModel(modelId);
    setModels(updatedModels);
    toast.success('模型已删除');
  };
  
  // 重置为默认模型列表
  const handleResetModels = () => {
    const defaultModels = resetToDefaultModels();
    setModels(defaultModels);
    toast.success('已重置为默认模型列表');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Toaster position="top-right" />
      
      <div className="flex items-center mb-6">
        <button
          onClick={() => router.back()}
          className="mr-4 text-gray-600 hover:text-gray-900"
        >
          <FiArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">设置</h1>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <FiKey className="mr-2 text-blue-500" />
          API密钥设置
        </h2>
        
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-medium mb-2">
            SiliconFlow API密钥
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
          <p className="mt-2 text-sm text-gray-500">
            您可以从
            <a 
              href="https://cloud.siliconflow.cn/account/ak" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline ml-1"
            >
              https://cloud.siliconflow.cn/account/ak
            </a>
            获取API密钥。
          </p>
        </div>
        
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <FiGlobe className="mr-2 text-green-500" />
          API服务设置
        </h2>
        
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-medium mb-2">
            API基础URL
          </label>
          <div className="flex">
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://api.siliconflow.cn/v1"
            />
            <button
              type="button"
              onClick={resetToDefaultUrl}
              className="px-4 py-2 bg-gray-100 border border-gray-300 border-l-0 rounded-r-md text-gray-700 hover:bg-gray-200"
            >
              重置
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            SiliconFlow API的默认基础URL是 https://api.siliconflow.cn/v1
          </p>
        </div>
        
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <FiPlus className="mr-2 text-indigo-500" />
          模型管理
        </h2>
        
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <label className="block text-gray-700 text-sm font-medium">
              可用模型列表
            </label>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setShowAddModel(!showAddModel)}
                className="flex items-center px-2 py-1 text-sm bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
              >
                <FiPlus className="mr-1" />
                添加模型
              </button>
              <button
                type="button"
                onClick={handleResetModels}
                className="flex items-center px-2 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                <FiRefreshCw className="mr-1" />
                重置
              </button>
            </div>
          </div>
          
          {showAddModel && (
            <div className="bg-gray-50 p-4 rounded-md mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 text-xs font-medium mb-1">
                    模型名称
                  </label>
                  <input
                    type="text"
                    value={newModelName}
                    onChange={(e) => setNewModelName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="例如: GPT-4"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-xs font-medium mb-1">
                    模型值
                  </label>
                  <input
                    type="text"
                    value={newModelValue}
                    onChange={(e) => setNewModelValue(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="例如: gpt-4"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleAddModel}
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  添加
                </button>
              </div>
            </div>
          )}
          
          <div className="bg-gray-50 rounded-md">
            {models.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {models.map((model) => (
                  <li key={model.id} className="px-4 py-3 flex justify-between items-center">
                    <div>
                      <div className="font-medium">{model.name}</div>
                      <div className="text-sm text-gray-500">{model.value}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteModel(model.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <FiTrash2 />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-4 py-3 text-center text-gray-500">
                没有可用的模型，请添加模型或重置为默认列表
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
        >
          <FiSave className="mr-2" />
          {isSaving ? '保存中...' : '保存设置'}
        </button>
      </div>
    </div>
  );
}
