# 工作进度提醒

一款基于 Electron + Vue 3 的桌面工作进度提醒工具。本地运行，零联网，隐私安全。

## 功能特性

- **任务管理**：创建/编辑/删除任务，分类与标签，优先级，进度条，状态流转，拖拽排序
- **实时进度提醒**：任务开始/到期前/到期时的系统通知，托盘菜单，全局快捷键 Ctrl+Shift+T 呼出窗口
- **番茄钟**：25/5/15 可配置，关联任务，专注完成后自动 +1 番茄数，会话存档供统计
- **统计与历史**：今日完成率环形图、近 7 天柱状图、近 30 天热力图、本月分类饼图
- **系统集成**：始终置顶（设置项开关）、开机自启、深色模式（跟随系统/手动）、数据导入导出

## 开发与运行

### 环境要求

- Node.js >= 18
- npm 或 pnpm

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

将启动 Vite 开发服务器并自动打开 Electron 窗口。

### 打包

```bash
npm run build
```

打包后输出到 release/ 目录，包含 NSIS 安装包和便携版。

## 快捷键

| 快捷键 | 功能 |
|---|---|
| Ctrl+Shift+T | 显示/隐藏主窗口（系统全局） |

## 数据存储

数据保存在 Electron userData 目录下的 tasks.json：

- Windows: %APPDATA%/工作进度提醒/tasks.json
- macOS: ~/Library/Application Support/工作进度提醒/tasks.json
- Linux: ~/.config/工作进度提醒/tasks.json

可在「设置 → 数据」中导出/导入备份。

## 目录结构

```
.
├── electron/         # Electron 主进程
│   ├── main.js       # 入口
│   ├── preload.js    # contextBridge 桥
│   ├── data.service.js
│   ├── ipc-handlers.js
│   ├── notifications.js
│   └── tray.js
├── src/              # Vue 3 渲染进程
│   ├── main.js
│   ├── App.vue
│   ├── router/
│   ├── components/
│   ├── views/
│   ├── stores/
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
| 数据 | 本地 JSON 文件 |
| 打包 | electron-builder |

## License

MIT
