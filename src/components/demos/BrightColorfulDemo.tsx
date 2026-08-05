import React from 'react'

const BrightColorfulDemo: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-300 via-pink-300 to-purple-400">
      {/* 头部导航 */}
      <header className="py-6 px-4">
        <nav className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-black text-white drop-shadow-lg">个人博客</h1>
          <ul className="flex space-x-6">
            <li><a href="#" className="text-white font-bold hover:text-yellow-200 transition-colors">首页</a></li>
            <li><a href="#" className="text-white font-bold hover:text-yellow-200 transition-colors">文章</a></li>
            <li><a href="#" className="text-white font-bold hover:text-yellow-200 transition-colors">关于</a></li>
          </ul>
        </nav>
      </header>

      {/* 主要内容 */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* 个人介绍 */}
        <section className="mb-16 text-center">
          <h2 className="text-6xl font-black text-white mb-6 drop-shadow-lg">
            创意无限
          </h2>
          <p className="text-white text-xl font-bold drop-shadow">
            用色彩记录生活，用创意点亮世界
          </p>
        </section>

        {/* 文章卡片 */}
        <section>
          <h3 className="text-3xl font-black text-white mb-8 text-center drop-shadow-lg">精彩文章</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden transform rotate-1 hover:rotate-0 transition-transform">
              <div className="h-40 bg-gradient-to-r from-red-400 to-pink-500"></div>
              <div className="p-6">
                <time className="text-sm text-gray-400">2024年1月15日</time>
                <h4 className="text-xl font-black mt-2 mb-3 text-gray-800">如何构建个人博客</h4>
                <p className="text-gray-600">分享我搭建这个博客的过程和心得...</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden transform -rotate-1 hover:rotate-0 transition-transform">
              <div className="h-40 bg-gradient-to-r from-green-400 to-blue-500"></div>
              <div className="p-6">
                <time className="text-sm text-gray-400">2024年1月10日</time>
                <h4 className="text-xl font-black mt-2 mb-3 text-gray-800">React 19 新特性解析</h4>
                <p className="text-gray-600">深入探讨React 19带来的革命性变化...</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden transform rotate-1 hover:rotate-0 transition-transform">
              <div className="h-40 bg-gradient-to-r from-yellow-400 to-orange-500"></div>
              <div className="p-6">
                <time className="text-sm text-gray-400">2024年1月5日</time>
                <h4 className="text-xl font-black mt-2 mb-3 text-gray-800">我的2024年计划</h4>
                <p className="text-gray-600">新的一年，新的目标和期待...</p>
              </div>
            </div>
          </div>
        </section>

        {/* 标签云 */}
        <section className="mt-16">
          <h3 className="text-2xl font-black text-white mb-6 text-center drop-shadow-lg">热门标签</h3>
          <div className="flex flex-wrap justify-center gap-3">
            <span className="px-4 py-2 bg-white text-pink-500 font-bold rounded-full shadow-lg">React</span>
            <span className="px-4 py-2 bg-white text-blue-500 font-bold rounded-full shadow-lg">TypeScript</span>
            <span className="px-4 py-2 bg-white text-green-500 font-bold rounded-full shadow-lg">生活</span>
            <span className="px-4 py-2 bg-white text-purple-500 font-bold rounded-full shadow-lg">设计</span>
            <span className="px-4 py-2 bg-white text-red-500 font-bold rounded-full shadow-lg">旅行</span>
            <span className="px-4 py-2 bg-white text-yellow-500 font-bold rounded-full shadow-lg">摄影</span>
          </div>
        </section>
      </main>

      {/* 底部 */}
      <footer className="max-w-6xl mx-auto px-4 py-8">
        <p className="text-white/80 text-center font-bold drop-shadow">© 2024 个人博客. 保留所有权利.</p>
      </footer>
    </div>
  )
}

export default BrightColorfulDemo