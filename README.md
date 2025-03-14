# PlotContinuum

<div align="center">
  <img src="https://img.shields.io/badge/版本-0.1.0-blue.svg" alt="版本" />
  <img src="https://img.shields.io/badge/Next.js-14.0.0-black" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-18.2.0-61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.0.0-3178C6" alt="TypeScript" />
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT" />
</div>

## 项目描述

PlotContinuum 是一个基于 Next.js 和 React 开发的智能写作平台，集成了 Markdown 编辑器与 AI 续写功能。它旨在为创作者提供流畅的写作体验，同时借助 AI 技术辅助内容创作。

## 核心功能

### Markdown 编辑器
- 基于 `@uiw/react-md-editor` 和 TiptapEditor 的强大编辑器
- 支持全面的 Markdown 语法
- 实时预览功能

### AI 续写功能
- 支持 AI 智能续写文本
- 支持 AI 根据指令修改文本
- 可自定义 AI 模型参数（温度、最大生成长度等）
- 流式输出，实时展示 AI 生成内容

### 文档管理系统
- 自动保存：每 10 秒自动保存一次
- 手动保存：点击保存按钮手动保存
- 本地存储：文档保存在浏览器的 localStorage 中
- 导出功能：支持将文档下载为 .md 文件
- 文档列表：查看和管理所有已保存的文档
- 文档删除：删除不需要的文档

## 安装与运行

### 前置条件
- Node.js 18.0.0 或更高版本
- npm 或 yarn 包管理器

### 安装步骤

1. 克隆仓库
```bash
git clone https://github.com/yourusername/PlotContinuum.git
cd PlotContinuum
```

2. 安装依赖
```bash
npm install
# 或
yarn install
```

3. 启动开发服务器
```bash
npm run dev
# 或
yarn dev
```

4. 打开浏览器访问 http://localhost:3000

### 生产环境构建
```bash
npm run build
npm run start
# 或
yarn build
yarn start
```

## 配置 AI 功能

1. 在设置中配置 API 密钥
2. 可选择调整 AI 模型、温度和最大生成长度等参数
3. 默认使用 DeepSeek-V2.5 模型，可根据需要更换

## 使用指南

### 创建新文档
1. 访问首页，点击"新建文档"
2. 输入文档标题，开始编写内容

### 使用 AI 续写
1. 将光标放置在需要续写的位置
2. 点击 AI 续写按钮或使用快捷键
3. 等待 AI 生成内容，可以接受或拒绝生成结果

### 使用 AI 修改
1. 选择需要修改的文本
2. 点击 AI 修改按钮
3. 输入修改指令，等待 AI 生成结果

### 保存与导出
- 文档会自动保存
- 点击保存按钮手动保存
- 点击下载按钮将文档导出为 .md 文件

## 未来计划
- [ ] 修复补全流式输出顺序问题
- [ ] 美化样式，添加段落选择和页面内进度条
- [ ] 更加完善的文档管理和目录系统
- [ ] 实现双栏结构，右边栏可以直接和大模型对话
- [ ] 打包为本地应用程序

## 许可证

本项目基于 MIT 许可证开源 - 详情请查看 [LICENSE](LICENSE) 文件
