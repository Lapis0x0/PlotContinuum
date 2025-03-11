'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast, Toaster } from 'react-hot-toast';
import { getAllDocuments, DocumentData, deleteDocument } from '@/services/localStorageService';

export default function DocumentsPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = () => {
    try {
      setIsLoading(true);
      const docs = getAllDocuments();
      setDocuments(docs);
    } catch (error) {
      console.error('获取文档列表错误:', error);
      toast.error('无法加载文档列表');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewDocument = () => {
    router.push('/editor');
  };

  const handleDeleteDocument = (id: string) => {
    try {
      const success = deleteDocument(id);
      if (success) {
        toast.success('文档已删除');
        fetchDocuments(); // 重新加载文档列表
      } else {
        toast.error('删除文档失败');
      }
    } catch (error) {
      console.error('删除文档错误:', error);
      toast.error('删除文档失败');
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-5xl mx-auto">
      <Toaster position="top-right" />
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">我的文档</h1>
        <button
          onClick={handleNewDocument}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          新建文档
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <p className="text-gray-500">加载中...</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-4">暂无文档</p>
          <button
            onClick={handleNewDocument}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            创建第一个文档
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  标题
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  最后修改时间
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link 
                      href={`/editor?title=${encodeURIComponent(doc.title)}`}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      {doc.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(doc.lastModified)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link 
                      href={`/editor?title=${encodeURIComponent(doc.title)}`}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      编辑
                    </Link>
                    <button
                      onClick={() => handleDeleteDocument(doc.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
