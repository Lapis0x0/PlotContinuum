// AI设置服务

// 存储键
const API_KEY_STORAGE_KEY = 'plotcontinuum_api_key';
const AI_SETTINGS_STORAGE_KEY = 'plotcontinuum_ai_settings';
const AI_MODELS_STORAGE_KEY = 'plotcontinuum_ai_models';

// 模型接口
export interface AIModel {
  id: string;
  name: string;
  value: string;
}

// AI设置接口
export interface AISettings {
  model: string;
  temperature: number;
  maxTokens: number;
  baseUrl: string;
}

// 默认模型列表
export const DEFAULT_MODELS: AIModel[] = [
  { id: '1', name: 'DeepSeek-V2.5', value: 'deepseek-ai/DeepSeek-V2.5' },
  { id: '2', name: 'DeepSeek-Coder', value: 'deepseek-ai/deepseek-coder' },
  { id: '3', name: 'Llama-3-70b', value: 'meta-llama/Llama-3-70b-chat-hf' },
  { id: '4', name: 'Llama-3-8b', value: 'meta-llama/Llama-3-8b-chat-hf' },
];

// 默认设置
const DEFAULT_SETTINGS: AISettings = {
  model: 'deepseek-ai/DeepSeek-V2.5',
  temperature: 0.7,
  maxTokens: 1000,
  baseUrl: 'https://api.siliconflow.cn/v1',
};

/**
 * 保存API密钥到本地存储
 * @param apiKey API密钥
 */
export const saveAPIKey = (apiKey: string): void => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
    }
  } catch (error) {
    console.error('保存API密钥错误:', error);
  }
};

/**
 * 从本地存储获取API密钥
 * @returns API密钥或空字符串
 */
export const getAPIKey = (): string => {
  try {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(API_KEY_STORAGE_KEY) || '';
    }
    return '';
  } catch (error) {
    console.error('获取API密钥错误:', error);
    return '';
  }
};

/**
 * 保存AI设置到本地存储
 * @param settings AI设置
 */
export const saveAISettings = (settings: Partial<AISettings>): void => {
  try {
    if (typeof window !== 'undefined') {
      const currentSettings = getAISettings();
      const updatedSettings = { ...currentSettings, ...settings };
      localStorage.setItem(AI_SETTINGS_STORAGE_KEY, JSON.stringify(updatedSettings));
    }
  } catch (error) {
    console.error('保存AI设置错误:', error);
  }
};

/**
 * 从本地存储获取AI设置
 * @returns AI设置
 */
export const getAISettings = (): AISettings => {
  try {
    if (typeof window !== 'undefined') {
      const settingsJson = localStorage.getItem(AI_SETTINGS_STORAGE_KEY);
      if (settingsJson) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(settingsJson) };
      }
    }
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error('获取AI设置错误:', error);
    return DEFAULT_SETTINGS;
  }
};

/**
 * 获取所有模型
 * @returns 模型列表
 */
export const getModels = (): AIModel[] => {
  try {
    if (typeof window !== 'undefined') {
      const modelsJson = localStorage.getItem(AI_MODELS_STORAGE_KEY);
      if (modelsJson) {
        return JSON.parse(modelsJson);
      }
    }
    // 如果没有保存过模型列表，返回默认模型
    return DEFAULT_MODELS;
  } catch (error) {
    console.error('获取模型列表错误:', error);
    return DEFAULT_MODELS;
  }
};

/**
 * 保存模型列表
 * @param models 模型列表
 */
export const saveModels = (models: AIModel[]): void => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(AI_MODELS_STORAGE_KEY, JSON.stringify(models));
    }
  } catch (error) {
    console.error('保存模型列表错误:', error);
  }
};

/**
 * 添加新模型
 * @param model 新模型
 * @returns 更新后的模型列表
 */
export const addModel = (model: Omit<AIModel, 'id'>): AIModel[] => {
  try {
    const models = getModels();
    const newModel: AIModel = {
      ...model,
      id: Date.now().toString(), // 生成唯一ID
    };
    
    const updatedModels = [...models, newModel];
    saveModels(updatedModels);
    return updatedModels;
  } catch (error) {
    console.error('添加模型错误:', error);
    return getModels();
  }
};

/**
 * 删除模型
 * @param modelId 要删除的模型ID
 * @returns 更新后的模型列表
 */
export const deleteModel = (modelId: string): AIModel[] => {
  try {
    const models = getModels();
    const updatedModels = models.filter(model => model.id !== modelId);
    
    // 如果删除了当前选中的模型，需要更新设置
    const settings = getAISettings();
    const deletedModel = models.find(model => model.id === modelId);
    
    if (deletedModel && settings.model === deletedModel.value && updatedModels.length > 0) {
      saveAISettings({ model: updatedModels[0].value });
    }
    
    saveModels(updatedModels);
    return updatedModels;
  } catch (error) {
    console.error('删除模型错误:', error);
    return getModels();
  }
};

/**
 * 重置为默认模型列表
 * @returns 默认模型列表
 */
export const resetToDefaultModels = (): AIModel[] => {
  saveModels(DEFAULT_MODELS);
  return DEFAULT_MODELS;
};
