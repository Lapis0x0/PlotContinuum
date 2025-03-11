import { NextRequest, NextResponse } from 'next/server';
import { readDocument } from '@/services/fileService';
import path from 'path';
import fs from 'fs';
import { getDocumentsDirectory } from '@/services/fileService';

// 获取特定文档
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = decodeURIComponent(params.id);
    const documentsDir = getDocumentsDirectory();
    const filePath = path.join(documentsDir, `${id}.md`);
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: '文档不存在' },
        { status: 404 }
      );
    }
    
    const result = readDocument(filePath);
    
    if (result.success) {
      return NextResponse.json({ 
        title: id,
        content: result.content 
      });
    } else {
      return NextResponse.json(
        { error: result.error || '读取失败' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('读取文档API错误:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
