import OpenAI from 'openai';
import { getAPIKey, getAISettings } from './aiSettingsService';

// 默认模型
export const DEFAULT_MODEL = 'deepseek-ai/DeepSeek-V2.5';

// 请求选项接口
export interface AIContinueOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  continuationMode?: 'append' | 'insert';
  selectedText?: string;
  onStream?: (chunk: string) => void;
  onProgress?: (progress: number) => void;
}

/**
 * 创建OpenAI客户端
 * @returns OpenAI客户端实例
 */
export const createOpenAIClient = (): OpenAI => {
  const apiKey = getAPIKey();
  const settings = getAISettings();
  
  return new OpenAI({
    apiKey: apiKey || 'dummy-key', // 如果没有API密钥，使用一个虚拟密钥
    baseURL: settings.baseUrl,
    dangerouslyAllowBrowser: true, // 允许在浏览器环境中运行
  });
};

/**
 * 使用AI续写文本
 * @param text 原始文本
 * @param options 请求选项
 * @returns 续写后的文本
 */
export const continueWithAI = async (
  text: string,
  options: AIContinueOptions = {}
): Promise<string> => {
  const client = createOpenAIClient();
  const prompt = `请继续写作以下内容，保持风格一致，不要重复已有内容，直接从断点处开始续写：\n\n${text}`;
  
  try {
    // 检查是否使用流式传输
    if (options.onStream) {
      let fullResponse = '';
      let totalTokens = options.maxTokens || 1000;
      let receivedTokens = 0;
      
      const stream = await client.chat.completions.create({
        model: options.model || DEFAULT_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 1000,
        stream: true,
      });
      
      // 处理流式响应
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          // 将每个chunk反转后再添加到响应中
          const reversedContent = content.split('').reverse().join('');
          fullResponse += reversedContent;
          options.onStream(reversedContent);
          
          // 估算进度（这是一个近似值）
          receivedTokens += content.split(/\s+/).length;
          const progress = Math.min(Math.round((receivedTokens / totalTokens) * 100), 99);
          options.onProgress?.(progress);
        }
      }
      
      // 完成时设置进度为100%
      options.onProgress?.(100);
      return fullResponse;
    } else {
      // 非流式请求
      const response = await client.chat.completions.create({
        model: options.model || DEFAULT_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 1000,
      });
      
      const content = response.choices[0]?.message?.content || '';
      // 将整个响应反转后再返回
      return content.split('').reverse().join('');
    }
  } catch (error) {
    console.error('AI续写错误:', error);
    throw error;
  }
};

/**
 * 使用AI修改文本
 * @param text 原始文本
 * @param instruction 修改指令
 * @param options 请求选项
 * @returns 修改后的文本
 */
export const editWithAI = async (
  text: string,
  instruction: string,
  options: AIContinueOptions = {}
): Promise<string> => {
  const client = createOpenAIClient();
  const prompt = `请根据以下指令修改文本：\n\n指令：${instruction}\n\n原文：\n${text}`;
  
  try {
    // 检查是否使用流式传输
    if (options.onStream) {
      let fullResponse = '';
      let totalTokens = options.maxTokens || 1000;
      let receivedTokens = 0;
      
      const stream = await client.chat.completions.create({
        model: options.model || DEFAULT_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 1000,
        stream: true,
      });
      
      // 处理流式响应
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullResponse += content;
          options.onStream(content);
          
          // 估算进度
          receivedTokens += content.split(/\s+/).length;
          const progress = Math.min(Math.round((receivedTokens / totalTokens) * 100), 99);
          options.onProgress?.(progress);
        }
      }
      
      // 完成时设置进度为100%
      options.onProgress?.(100);
      return fullResponse;
    } else {
      // 非流式请求
      const response = await client.chat.completions.create({
        model: options.model || DEFAULT_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 1000,
      });
      
      return response.choices[0]?.message?.content || '';
    }
  } catch (error) {
    console.error('AI修改错误:', error);
    throw error;
  }
};

/**
 * 验证API密钥是否有效
 * @param apiKey API密钥
 * @returns 是否有效
 */
export const validateAPIKey = async (apiKey: string): Promise<boolean> => {
  try {
    const client = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true, // 允许在浏览器环境中运行
    });
    
    // 发送一个简单的请求来验证API密钥
    await client.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [{ role: 'user', content: '你好' }],
      max_tokens: 5,
    });
    
    return true;
  } catch (error) {
    console.error('验证API密钥错误:', error);
    return false;
  }
};
