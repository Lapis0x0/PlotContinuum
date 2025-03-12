'use client';

import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Typography from '@tiptap/extension-typography';
import { common, createLowlight } from 'lowlight';
import MarkdownIt from 'markdown-it';
import TurndownService from 'turndown';
import { FiBold, FiItalic, FiList, FiCode, FiLink, FiImage } from 'react-icons/fi';
import { MdFormatListNumbered, MdFormatQuote } from 'react-icons/md';

// 创建语法高亮实例
const lowlight = createLowlight(common);

interface TiptapEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

// 创建markdown-it实例用于解析Markdown
const md = new MarkdownIt({
  html: true,
  breaks: true,
  linkify: true,
});

// 创建turndown实例用于将HTML转换为Markdown
const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
});

// 添加代码块规则
turndownService.addRule('codeBlocks', {
  filter: function(node: HTMLElement): boolean {
    return node.nodeName === 'PRE' && 
           node.firstChild !== null && 
           node.firstChild.nodeName === 'CODE';
  },
  replacement: function(content: string, node: HTMLElement): string {
    if (node.firstChild) {
      const codeElement = node.firstChild as HTMLElement;
      const code = codeElement.textContent || '';
      const lang = codeElement.getAttribute('class')?.replace('language-', '') || '';
      return `\n\`\`\`${lang}\n${code}\n\`\`\`\n`;
    }
    return `\n\`\`\`\n${content}\n\`\`\`\n`;
  }
});

const TiptapEditor: React.FC<TiptapEditorProps> = ({ value, onChange, placeholder = '开始写作...' }) => {
  const [html, setHtml] = useState<string>('');
  const [editorReady, setEditorReady] = useState(false);

  // 将Markdown转换为HTML
  useEffect(() => {
    if (value !== undefined) {
      const renderedHtml = md.render(value);
      setHtml(renderedHtml);
    }
  }, [value]);

  // 创建编辑器实例
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: true,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: true,
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Link.configure({
        openOnClick: false,
      }),
      Image,
      CodeBlockLowlight.configure({
        lowlight,
      }),
      Typography,
    ],
    content: html,
    onUpdate: ({ editor }) => {
      const htmlContent = editor.getHTML();
      const markdown = turndownService.turndown(htmlContent);
      onChange(markdown);
    },
    onTransaction: () => {
      // 确保编辑器已经准备好
      if (!editorReady) {
        setEditorReady(true);
      }
    }
  });

  // 设置Markdown输入处理器
  useEffect(() => {
    if (editor && editorReady) {
      const editorElement = document.querySelector('.ProseMirror');
      if (editorElement) {
        const handleMarkdownInput = (event: Event) => {
          const inputEvent = event as InputEvent;
          if (!editor || inputEvent.inputType !== 'insertText' || inputEvent.data !== ' ') return;
          
          // 获取当前行的文本
          const { state } = editor;
          const { selection } = state;
          const { $from } = selection;
          const lineStart = $from.start();
          const lineEnd = $from.end();
          const line = state.doc.textBetween(lineStart, $from.pos, '\n');
          
          // 检查是否是标题格式
          if (line === '#') {
            // 删除 # 并创建标题
            editor.chain()
              .focus()
              .deleteRange({ from: lineStart, to: $from.pos })
              .setNode('heading', { level: 1 })
              .run();
            return;
          } else if (line === '##') {
            editor.chain()
              .focus()
              .deleteRange({ from: lineStart, to: $from.pos })
              .setNode('heading', { level: 2 })
              .run();
            return;
          } else if (line === '###') {
            editor.chain()
              .focus()
              .deleteRange({ from: lineStart, to: $from.pos })
              .setNode('heading', { level: 3 })
              .run();
            return;
          }
          
          // 检查是否是无序列表
          if (line === '-' || line === '*') {
            editor.chain()
              .focus()
              .deleteRange({ from: lineStart, to: $from.pos })
              .toggleBulletList()
              .run();
            return;
          }
          
          // 检查是否是有序列表
          if (line === '1.') {
            editor.chain()
              .focus()
              .deleteRange({ from: lineStart, to: $from.pos })
              .toggleOrderedList()
              .run();
            return;
          }
          
          // 检查是否是引用
          if (line === '>') {
            editor.chain()
              .focus()
              .deleteRange({ from: lineStart, to: $from.pos })
              .toggleBlockquote()
              .run();
            return;
          }
        };
        
        editorElement.addEventListener('input', handleMarkdownInput);
        
        return () => {
          editorElement.removeEventListener('input', handleMarkdownInput);
        };
      }
    }
  }, [editor, editorReady]);

  // 当外部value变化时更新编辑器内容
  useEffect(() => {
    if (editor && value !== undefined) {
      const currentContent = turndownService.turndown(editor.getHTML());
      if (currentContent !== value) {
        const newHtml = md.render(value);
        editor.commands.setContent(newHtml);
      }
    }
  }, [editor, value]);

  // 处理粗体
  const handleBold = () => {
    if (editor) {
      editor.chain().focus().toggleBold().run();
    }
  };

  // 处理斜体
  const handleItalic = () => {
    if (editor) {
      editor.chain().focus().toggleItalic().run();
    }
  };

  // 处理无序列表
  const handleBulletList = () => {
    if (editor) {
      editor.chain().focus().toggleBulletList().run();
    }
  };

  // 处理有序列表
  const handleOrderedList = () => {
    if (editor) {
      editor.chain().focus().toggleOrderedList().run();
    }
  };

  // 处理引用
  const handleBlockquote = () => {
    if (editor) {
      editor.chain().focus().toggleBlockquote().run();
    }
  };

  // 处理链接
  const handleLink = () => {
    if (editor) {
      const url = window.prompt('输入链接URL:');
      if (url) {
        editor.chain().focus().setLink({ href: url }).run();
      } else if (url === '') {
        editor.chain().focus().unsetLink().run();
      }
    }
  };

  // 处理图片
  const handleImage = () => {
    if (editor) {
      const url = window.prompt('输入图片URL:');
      if (url) {
        editor.chain().focus().setImage({ src: url }).run();
      }
    }
  };

  // 处理代码块
  const handleCodeBlock = () => {
    if (editor) {
      editor.chain().focus().toggleCodeBlock().run();
    }
  };

  // 添加标题按钮
  const handleHeading = (level: 1 | 2 | 3 | 4 | 5 | 6) => {
    if (editor) {
      editor.chain().focus().toggleHeading({ level }).run();
    }
  };

  return (
    <div className="tiptap-editor border rounded-md overflow-hidden">
      {/* 工具栏 */}
      <div className="flex items-center p-2 border-b bg-gray-50 flex-wrap">
        <div className="flex mr-2 space-x-1">
          <button
            onClick={() => handleHeading(1)}
            className={`p-1 rounded hover:bg-gray-200 ${editor?.isActive('heading', { level: 1 }) ? 'bg-gray-200' : ''}`}
            title="标题1"
          >
            H1
          </button>
          <button
            onClick={() => handleHeading(2)}
            className={`p-1 rounded hover:bg-gray-200 ${editor?.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''}`}
            title="标题2"
          >
            H2
          </button>
          <button
            onClick={() => handleHeading(3)}
            className={`p-1 rounded hover:bg-gray-200 ${editor?.isActive('heading', { level: 3 }) ? 'bg-gray-200' : ''}`}
            title="标题3"
          >
            H3
          </button>
        </div>
        <div className="flex space-x-1">
          <button
            onClick={handleBold}
            className={`p-1 rounded hover:bg-gray-200 ${editor?.isActive('bold') ? 'bg-gray-200' : ''}`}
            title="粗体"
          >
            <FiBold />
          </button>
          <button
            onClick={handleItalic}
            className={`p-1 rounded hover:bg-gray-200 ${editor?.isActive('italic') ? 'bg-gray-200' : ''}`}
            title="斜体"
          >
            <FiItalic />
          </button>
          <button
            onClick={handleBulletList}
            className={`p-1 rounded hover:bg-gray-200 ${editor?.isActive('bulletList') ? 'bg-gray-200' : ''}`}
            title="无序列表"
          >
            <FiList />
          </button>
          <button
            onClick={handleOrderedList}
            className={`p-1 rounded hover:bg-gray-200 ${editor?.isActive('orderedList') ? 'bg-gray-200' : ''}`}
            title="有序列表"
          >
            <MdFormatListNumbered />
          </button>
          <button
            onClick={handleBlockquote}
            className={`p-1 rounded hover:bg-gray-200 ${editor?.isActive('blockquote') ? 'bg-gray-200' : ''}`}
            title="引用"
          >
            <MdFormatQuote />
          </button>
          <button
            onClick={handleLink}
            className={`p-1 rounded hover:bg-gray-200 ${editor?.isActive('link') ? 'bg-gray-200' : ''}`}
            title="链接"
          >
            <FiLink />
          </button>
          <button
            onClick={handleImage}
            className={`p-1 rounded hover:bg-gray-200 ${editor?.isActive('image') ? 'bg-gray-200' : ''}`}
            title="图片"
          >
            <FiImage />
          </button>
          <button
            onClick={handleCodeBlock}
            className={`p-1 rounded hover:bg-gray-200 ${editor?.isActive('codeBlock') ? 'bg-gray-200' : ''}`}
            title="代码块"
          >
            <FiCode />
          </button>
        </div>
      </div>

      {/* 编辑器内容区 */}
      <div className="p-4 min-h-[300px]">
        {editor && (
          <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
            <div className="flex bg-white shadow-lg rounded-md border">
              <button
                onClick={handleBold}
                className={`p-1 hover:bg-gray-100 ${editor.isActive('bold') ? 'bg-gray-100' : ''}`}
              >
                <FiBold size={14} />
              </button>
              <button
                onClick={handleItalic}
                className={`p-1 hover:bg-gray-100 ${editor.isActive('italic') ? 'bg-gray-100' : ''}`}
              >
                <FiItalic size={14} />
              </button>
              <button
                onClick={handleLink}
                className={`p-1 hover:bg-gray-100 ${editor.isActive('link') ? 'bg-gray-100' : ''}`}
              >
                <FiLink size={14} />
              </button>
            </div>
          </BubbleMenu>
        )}
        <EditorContent editor={editor} className="prose max-w-none" />
      </div>
      
      {/* 添加全局样式 */}
      <style jsx global>{`
        .ProseMirror {
          outline: none;
          min-height: 250px;
        }
        .ProseMirror h1 {
          font-size: 2em;
          margin-bottom: 0.5em;
          font-weight: bold;
        }
        .ProseMirror h2 {
          font-size: 1.5em;
          margin-bottom: 0.5em;
          font-weight: bold;
        }
        .ProseMirror h3 {
          font-size: 1.3em;
          margin-bottom: 0.5em;
          font-weight: bold;
        }
        .ProseMirror ul {
          list-style-type: disc;
          padding-left: 1.5em;
        }
        .ProseMirror ol {
          list-style-type: decimal;
          padding-left: 1.5em;
        }
        .ProseMirror blockquote {
          border-left: 3px solid #ccc;
          padding-left: 1em;
          margin-left: 0;
          font-style: italic;
        }
        .ProseMirror pre {
          background-color: #f3f3f3;
          padding: 0.5em;
          border-radius: 0.3em;
        }
      `}</style>
    </div>
  );
};

export default TiptapEditor;
