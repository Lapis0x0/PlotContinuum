// 文档服务

// 存储键
const DOCUMENTS_STORAGE_KEY = 'plotcontinuum_documents';
const DRAFT_DOCUMENT_STORAGE_KEY = 'plotcontinuum_draft_document';

// 文档接口
export interface Document {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// 草稿文档接口
export interface DraftDocument {
  id?: string;
  title: string;
  content: string;
  lastModified: string;
}

/**
 * 保存文档到本地存储
 * @param document 文档对象
 * @returns 文档ID
 */
export const saveDocument = (document: Omit<Document, 'id' | 'createdAt'> & { id?: string }): string => {
  try {
    if (typeof window === 'undefined') {
      throw new Error('无法在服务器端保存文档');
    }

    // 获取现有文档
    const documents = getAllDocuments();
    
    let documentToSave: Document;
    
    if (document.id) {
      // 更新现有文档
      const existingDocIndex = documents.findIndex(doc => doc.id === document.id);
      
      if (existingDocIndex === -1) {
        throw new Error('文档不存在');
      }
      
      documentToSave = {
        ...documents[existingDocIndex],
        title: document.title,
        content: document.content,
        updatedAt: document.updatedAt || new Date().toISOString(),
      };
      
      documents[existingDocIndex] = documentToSave;
    } else {
      // 创建新文档
      documentToSave = {
        id: Date.now().toString(),
        title: document.title,
        content: document.content,
        createdAt: new Date().toISOString(),
        updatedAt: document.updatedAt || new Date().toISOString(),
      };
      
      documents.push(documentToSave);
    }
    
    // 保存到本地存储
    localStorage.setItem(DOCUMENTS_STORAGE_KEY, JSON.stringify(documents));
    
    // 保存成功后清除草稿
    clearDraftDocument();
    
    return documentToSave.id;
  } catch (error) {
    console.error('保存文档错误:', error);
    throw error;
  }
};

/**
 * 获取所有文档
 * @returns 文档列表
 */
export const getAllDocuments = (): Document[] => {
  try {
    if (typeof window === 'undefined') {
      return [];
    }
    
    const documentsJson = localStorage.getItem(DOCUMENTS_STORAGE_KEY);
    return documentsJson ? JSON.parse(documentsJson) : [];
  } catch (error) {
    console.error('获取文档列表错误:', error);
    return [];
  }
};

/**
 * 获取单个文档
 * @param id 文档ID
 * @returns 文档对象或undefined
 */
export const getDocument = (id: string): Document | undefined => {
  try {
    const documents = getAllDocuments();
    return documents.find(doc => doc.id === id);
  } catch (error) {
    console.error('获取文档错误:', error);
    return undefined;
  }
};

/**
 * 删除文档
 * @param id 文档ID
 * @returns 是否成功删除
 */
export const deleteDocument = (id: string): boolean => {
  try {
    if (typeof window === 'undefined') {
      return false;
    }
    
    const documents = getAllDocuments();
    const filteredDocuments = documents.filter(doc => doc.id !== id);
    
    if (filteredDocuments.length === documents.length) {
      return false; // 没有找到要删除的文档
    }
    
    localStorage.setItem(DOCUMENTS_STORAGE_KEY, JSON.stringify(filteredDocuments));
    
    // 如果当前草稿是这个文档，也清除草稿
    const draft = getDraftDocument();
    if (draft && draft.id === id) {
      clearDraftDocument();
    }
    
    return true;
  } catch (error) {
    console.error('删除文档错误:', error);
    return false;
  }
};

/**
 * 保存草稿文档
 * @param draft 草稿文档
 */
export const saveDraftDocument = (draft: DraftDocument): void => {
  try {
    if (typeof window === 'undefined') {
      return;
    }
    
    localStorage.setItem(DRAFT_DOCUMENT_STORAGE_KEY, JSON.stringify({
      ...draft,
      lastModified: new Date().toISOString()
    }));
  } catch (error) {
    console.error('保存草稿错误:', error);
  }
};

/**
 * 获取草稿文档
 * @returns 草稿文档或undefined
 */
export const getDraftDocument = (): DraftDocument | undefined => {
  try {
    if (typeof window === 'undefined') {
      return undefined;
    }
    
    const draftJson = localStorage.getItem(DRAFT_DOCUMENT_STORAGE_KEY);
    return draftJson ? JSON.parse(draftJson) : undefined;
  } catch (error) {
    console.error('获取草稿错误:', error);
    return undefined;
  }
};

/**
 * 清除草稿文档
 */
export const clearDraftDocument = (): void => {
  try {
    if (typeof window === 'undefined') {
      return;
    }
    
    localStorage.removeItem(DRAFT_DOCUMENT_STORAGE_KEY);
  } catch (error) {
    console.error('清除草稿错误:', error);
  }
};
