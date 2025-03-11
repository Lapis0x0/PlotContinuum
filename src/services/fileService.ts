import fs from 'fs';
import path from 'path';
import os from 'os';

// 获取文档保存目录
export const getDocumentsDirectory = (): string => {
  const platform = os.platform();
  
  if (platform === 'darwin') {
    // macOS - 文稿文件夹
    return path.join(os.homedir(), 'Documents', 'PlotContinuum');
  } else if (platform === 'win32') {
    // Windows - 文档文件夹
    return path.join(os.homedir(), 'Documents', 'PlotContinuum');
  } else {
    // 其他系统 - 用户主目录下的PlotContinuum文件夹
    return path.join(os.homedir(), 'PlotContinuum');
  }
};

// 确保目录存在
export const ensureDirectoryExists = (directory: string): void => {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
};

// 保存文档
export const saveDocument = async (
  title: string, 
  content: string
): Promise<{ success: boolean; filePath: string; error?: string }> => {
  try {
    const documentsDir = getDocumentsDirectory();
    ensureDirectoryExists(documentsDir);
    
    // 处理文件名 - 移除不允许的字符
    const safeTitle = title.replace(/[/\\?%*:|"<>]/g, '-');
    const fileName = `${safeTitle}.md`;
    const filePath = path.join(documentsDir, fileName);
    
    // 写入文件
    fs.writeFileSync(filePath, content, 'utf8');
    
    return {
      success: true,
      filePath
    };
  } catch (error) {
    console.error('保存文档失败:', error);
    return {
      success: false,
      filePath: '',
      error: error instanceof Error ? error.message : '未知错误'
    };
  }
};

// 获取文档列表
export const getDocumentsList = (): { title: string; filePath: string; lastModified: Date }[] => {
  try {
    const documentsDir = getDocumentsDirectory();
    
    if (!fs.existsSync(documentsDir)) {
      return [];
    }
    
    const files = fs.readdirSync(documentsDir);
    
    return files
      .filter(file => file.endsWith('.md'))
      .map(file => {
        const filePath = path.join(documentsDir, file);
        const stats = fs.statSync(filePath);
        
        return {
          title: file.replace(/\.md$/, ''),
          filePath,
          lastModified: stats.mtime
        };
      })
      .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
  } catch (error) {
    console.error('获取文档列表失败:', error);
    return [];
  }
};

// 读取文档
export const readDocument = (filePath: string): { success: boolean; content: string; error?: string } => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return {
      success: true,
      content
    };
  } catch (error) {
    console.error('读取文档失败:', error);
    return {
      success: false,
      content: '',
      error: error instanceof Error ? error.message : '未知错误'
    };
  }
};
