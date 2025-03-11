import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <h1 className="text-4xl font-bold mb-6">PlotContinuum</h1>
      <p className="text-xl mb-8 text-center max-w-2xl">
        欢迎使用PlotContinuum智能写作协作平台，集成Markdown编辑器与AI续写引擎。
      </p>
      <div className="flex gap-4">
        <Link 
          href="/editor" 
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          开始写作
        </Link>
        <Link 
          href="/about" 
          className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
        >
          了解更多
        </Link>
      </div>
    </div>
  );
}
