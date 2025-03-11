// 本地存储服务

export interface DocumentData {
  id: string;
  title: string;
  content: string;
  lastModified: number; // 时间戳
}

const STORAGE_KEY = 'plotcontinuum_documents';

// 保存文档到localStorage
export const saveDocument = (document: Omit<DocumentData, 'id' | 'lastModified'>): DocumentData => {
  const documents = getAllDocuments();
  
  // 检查是否已存在同名文档
  const existingDocIndex = documents.findIndex(doc => doc.title === document.title);
  const now = Date.now();
  
  let updatedDoc: DocumentData;
  
  if (existingDocIndex >= 0) {
    // 更新现有文档
    updatedDoc = {
      ...documents[existingDocIndex],
      content: document.content,
      lastModified: now
    };
    documents[existingDocIndex] = updatedDoc;
  } else {
    // 创建新文档
    updatedDoc = {
      id: generateId(),
      title: document.title,
      content: document.content,
      lastModified: now
    };
    documents.push(updatedDoc);
  }
  
  // 保存到localStorage
  localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
  
  return updatedDoc;
};

// 获取所有文档
export const getAllDocuments = (): DocumentData[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('获取文档失败:', error);
    return [];
  }
};

// 根据ID获取文档
export const getDocumentById = (id: string): DocumentData | null => {
  const documents = getAllDocuments();
  return documents.find(doc => doc.id === id) || null;
};

// 根据标题获取文档
export const getDocumentByTitle = (title: string): DocumentData | null => {
  const documents = getAllDocuments();
  return documents.find(doc => doc.title === title) || null;
};

// 删除文档
export const deleteDocument = (id: string): boolean => {
  const documents = getAllDocuments();
  const newDocuments = documents.filter(doc => doc.id !== id);
  
  if (newDocuments.length !== documents.length) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newDocuments));
    return true;
  }
  
  return false;
};

// 生成唯一ID
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// 下载文档为Markdown文件
export const downloadDocument = (document: DocumentData): void => {
  const blob = new Blob([document.content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = window.document.createElement('a');
  a.href = url;
  a.download = `${document.title}.md`;
  window.document.body.appendChild(a);
  a.click();
  window.document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
