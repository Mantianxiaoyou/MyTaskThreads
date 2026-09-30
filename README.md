<div align="center">

# 面向社畜的多线程管理器

**把便利贴长在屏幕上——记下今天要做的事，到点提醒你，忙起来也不会漏。**

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Electron](https://img.shields.io/badge/Electron-28-47848F?logo=electron&logoColor=white)](https://www.electronjs.org/)
[![Vue](https://img.shields.io/badge/Vue-3-42B883?logo=vuedotjs&logoColor=white)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Platform](https://img.shields.io/badge/Platform-Windows-0078D6?logo=windows&logoColor=white)](#打包)
[![local-first](https://img.shields.io/badge/local--first-no%20network-2ea44f)](#数据存储)

</div>

> 名字来自一句吐槽：人只有一个 CPU，工作线程开多了就会卡死——所以把"记住这些事"这条线程外包出去吧。

## 目录

- [这是什么](#这是什么)
- [功能特性](#功能特性)
- [快速开始](#快速开始)
- [快捷键](#快捷键)
- [窗口背景自定义](#窗口背景自定义)
- [今日任务包含哪些](#今日任务包含哪些)
- [数据存储](#数据存储)
- [目录结构](#目录结构)
- [技术栈](#技术栈)
- [常见问题](#常见问题)
- [参与与反馈](#参与与反馈)
- [License](#license)

## 这是什么

最早的起因是：在电脑上多开工作的时候，忙着忙着就把一开始要做的事忘掉了 qwq，于是想能不能把任务都记下来——这才用蓝色大肥鱼顺手搓了这么一个小工具。

白天被会议、需求变更和群消息轮番抢占，等真正坐下来的时候，今天要做的事已经忘了一半。这个项目就是为这种日常准备的：**把"记住这些事"这条线程外包出去。**

它做的事情很朴素：把你今天的任务记下来，到点前提醒你一声；你忙的时候，它缩成巴掌大的小窗贴在屏幕角落——像一张便利贴，区别是它不会掉、不会被顺手撕掉、也不会在下班时被风吹走。

希望它能让你少惦记一点"我是不是忘了什么"，多想一点"接下来做哪件"。

## 功能特性

- **任务管理**：创建 / 编辑 / 删除，分类与标签、优先级、进度、状态流转、拖拽排序
- **今日任务**：把计划开始 / 截止在今天、今天创建、以及进行中的任务聚在一起；没有期限的任务未完成时会一直留着
- **到点提醒**：任务开始前、到期前、到期时的系统通知，托盘菜单常驻
- **番茄钟**：25 / 5 / 15 可配置，可关联任务，专注结束后自动 +1 番茄数
- **统计回顾**：今日完成率环形图、近 7 天柱状图、近 30 天热力图、本月分类饼图
- **mini 小窗**：一键缩成 260×360 置顶小窗（标题栏 / 侧边栏 / 托盘菜单），专注时挂在桌面角落
- **窗口背景自定义**：不透明度、明暗程度、自定义图片（铺满 / 完整显示 / 平铺）与图片遮罩
- **系统集成**：始终置顶、开机自启、深色模式（跟随系统 / 手动）、数据导入导出
- **本地优先**：运行时零联网，不注册、不上传、无遥测，数据就是你机器上的一个 JSON 文件

## 快速开始

### 环境要求

- Node.js >= 18
- npm 或 pnpm
- Windows（打包配置目前提供 NSIS 安装包与便携版）

### 安装与开发

```bash
npm install
npm run dev      # 启动 Vite 开发服务器，并自动打开 Electron 窗口
```

> 改了 `electron/` 下的主进程或 preload 必须重启 Electron 才生效；`src/` 里的渲染进程有热更新。

### 打包

```bash
npm run build       # 渲染进程 + NSIS 安装包 + 便携版，输出到 release/
npm run build:dir   # 只产出免安装目录 release/win-unpacked
npx vite build      # 只想验证渲染进程能否编译
```

> `electron-builder` 第一次打包要联网下载 Electron 运行时与打包工具（100MB 以上），之后走本地缓存。

### 自动打包

推一个 `v*` 标签，[.github/workflows/build.yml](.github/workflows/build.yml) 会在 GitHub 的 Windows 机器上自动打包，并把安装包与便携版附到 Release：

```bash
git tag v1.0.0
git push origin v1.0.0
```

平时 push 和 PR 只会跑一次渲染进程编译校验（几十秒），不打安装包；也可以在 Actions 页面手动触发打包。

### 免安装运行

仓库里附了两个双击启动器，不用开终端：

| 文件 | 说明 |
|---|---|
| `无终端启动器.vbs` | 静默启动，不弹控制台窗口 |
| `终端启动器.bat` | 带控制台窗口，方便看输出 |

首次运行时它们会先构建 `dist/`（需要 PATH 上有 node / npm）。注意这一步走的是 `npm run build`，会连带触发 electron-builder 打包流程，因此第一次会比较慢；只想准备 `dist/` 的话手动跑一次 `npx vite build` 更快。

## 快捷键

| 快捷键 | 功能 |
|---|---|
| Ctrl+Shift+T | 显示 / 隐藏主窗口（系统全局） |

## 窗口背景自定义

「设置 → 窗口 → 窗口背景」，对**主窗口和 mini 小窗同时生效**：

| 控件 | 说明 |
|---|---|
| 不透明度 | 0-100，越低越能透出桌面（窗口本身是透明的） |
| 明暗程度 | 50 跟随主题；< 50 背景更暗，> 50 更亮 |
| 背景图片 | 选择本地图片作为窗口背景，可切换铺满窗口 / 完整显示 / 平铺 |
| 图片遮罩 | 在图片上叠一层主题色，0 为原图，越大文字越清晰 |

几点说明：

- 图片由主进程读成 data URL 再交给页面，开发模式（http）和打包后（file）行为一致
- 只把图片**路径**存进 tasks.json，图片内容留在内存；图片被移动或删除后，设置页会给出提示
- 支持 png / jpg / webp / gif / bmp / avif，单张上限 20MB
- 默认值（明暗 50、不透明度 100、无图片）与未自定义时完全一致；「恢复默认背景」会连同图片一起清除

## 今日任务包含哪些

- 计划开始时间、截止时间在今天，或今天创建的任务
- 进行中的任务
- **没有期限的任务**：没做完就一直留在今日，做完后只在完成当天显示
- 跨天时会自动重新判定（每 30 秒检查一次日期），不需要重启应用

## 数据存储

数据保存在 Electron userData 目录下的 tasks.json：

- Windows：`%APPDATA%/工作进度提醒/tasks.json`
- macOS：`~/Library/Application Support/工作进度提醒/tasks.json`
- Linux：`~/.config/工作进度提醒/tasks.json`

可在「设置 → 数据」中导出 / 导入备份。背景图片只记录文件路径，不占用数据文件体积。

## 目录结构

```
.
├── electron/          # Electron 主进程
│   ├── main.js        # 入口
│   ├── preload.js     # contextBridge 桥
│   ├── data.service.js
│   ├── ipc-handlers.js
│   ├── notifications.js
│   └── tray.js
├── src/               # Vue 3 渲染进程
│   ├── main.js
│   ├── App.vue
│   ├── router/
│   ├── components/
│   ├── views/
│   ├── stores/
│   ├── composables/   # 复用逻辑（窗口背景样式等）
│   ├── services/
│   ├── utils/
│   └── assets/
├── index.html
├── vite.config.js
└── package.json
```

## 技术栈

| 层 | 技术 |
|---|---|
| 桌面框架 | Electron 28 |
| 前端框架 | Vue 3 + Vite |
| 状态管理 | Pinia |
| 路由 | Vue Router 4 |
| 图表 | Chart.js + vue-chartjs |
| 样式 | 原生 CSS + CSS 变量（背景混色用 color-mix） |
| 数据 | 本地 JSON 文件 |
| 打包 | electron-builder |

## 常见问题

**改了代码为什么没生效？**
`src/` 走 Vite 热更新；`electron/` 下的主进程和 preload 只跟着窗口创建加载，必须重启 Electron（刷新页面救不了主进程）。

**背景图片选了，但窗口里没看到？**
先看设置页的预览框：预览有图而窗口没有，重启一次应用即可（preload 变更后旧窗口不生效）；预览也没有的话，设置页会写出具体原因（格式不支持 / 超过 20MB / 文件被移动或删除）。

**`npm run build` 一直卡在下载？**
`electron-builder` 首次要下载 Electron 运行时和 NSIS / 签名工具，国内网络可能很慢。只想出前端产物用 `npx vite build`，想跳过安装包用 `npm run build:dir`。

**数据在哪，换电脑怎么带走？**
见 [数据存储](#数据存储)。直接拷 `tasks.json`，或用「设置 → 数据」导出导入。

**会联网、会上传数据吗？**
不会。运行时没有任何网络请求，没有账号也没有统计上报；唯一联网的地方是 `npm install` 和打包。

## 参与与反馈

欢迎提 Issue 和 PR。提交前建议先跑 `npx vite build` 确认渲染进程能编译；`electron/` 的改动没有自动化测试，麻烦手动 `npm run dev` 验一遍。

## License

[MIT](LICENSE)
