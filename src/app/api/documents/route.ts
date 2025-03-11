import { NextRequest, NextResponse } from 'next/server';
import { saveDocument, getDocumentsList, readDocument } from '@/services/fileService';

// 保存文档
export async function POST(request: NextRequest) {
  try {
    const { title, content } = await request.json();
    
    if (!title || !content) {
      return NextResponse.json(
        { error: '标题和内容不能为空' },
        { status: 400 }
      );
    }
    
    const result = await saveDocument(title, content);
    
    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        filePath: result.filePath,
        message: '文档保存成功'
      });
    } else {
      return NextResponse.json(
        { error: result.error || '保存失败' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('保存文档API错误:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}

// 获取文档列表
export async function GET() {
  try {
    const documents = getDocumentsList();
    return NextResponse.json({ documents });
  } catch (error) {
    console.error('获取文档列表API错误:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
