import Link from 'next/link';

export default function About() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">关于 PlotContinuum</h1>
      
      <div className="prose lg:prose-xl">
        <p className="mb-4">
          PlotContinuum 是一个智能写作协作平台，旨在为作者、内容创作者和写作爱好者提供一个高效、智能的写作环境。
        </p>
        
        <h2 className="text-2xl font-semibold mt-6 mb-3">主要功能</h2>
        <ul className="list-disc pl-6 mb-4">
          <li>基于 Markdown 的文章编辑器，支持实时预览</li>
          <li>AI 续写功能，帮助克服写作瓶颈（即将推出）</li>
          <li>AI 辅助修改和优化文章（即将推出）</li>
          <li>云端保存和多设备同步（即将推出）</li>
        </ul>
        
        <h2 className="text-2xl font-semibold mt-6 mb-3">技术栈</h2>
        <p className="mb-4">
          PlotContinuum 使用现代化的技术栈构建：
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>前端：Next.js、React、TypeScript</li>
          <li>UI：Tailwind CSS</li>
          <li>编辑器：react-md-editor</li>
          <li>AI 功能：即将集成</li>
        </ul>
        
        <div className="mt-8">
          <Link 
            href="/" 
            className="text-blue-600 hover:underline"
          >
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
