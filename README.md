# Multi-WinOS Switcher

![Build Status](https://github.com/xiaoheicat/multi-winos-switcher/workflows/Build%20Windows%20Executable/badge.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platform](https://img.shields.io/badge/platform-Windows-blue.svg)

快速切换 Windows 双系统/多系统的 Electron 应用程序，无需重启到启动管理器界面即可直接选择目标系统。

## ✨ 功能特点

- 🚀 **一键切换** - 无需重启到启动管理器，直接选择目标系统
- 💻 **绿色便携** - 无需安装，解压即用
- 🎨 **现代界面** - 参考 Windows 启动管理器的简洁设计
- ⌨️ **快捷操作** - 支持键盘快捷键，操作便捷高效
- 🔄 **智能识别** - 自动读取系统启动项，标记当前系统
- 🎯 **安全可靠** - 基于 Windows 原生 bcdedit 命令

## 📋 系统要求

- Windows 10 / Windows 11
- ⚠️ **必须以管理员身份运行**
- 支持双系统/多系统环境（包括 VHD 虚拟硬盘系统）

## 🚀 使用方法

### 下载安装

1. 从 [Releases](https://github.com/xiaoheicat/multi-winos-switcher/releases) 下载最新版本
2. 解压到任意目录
3. 右键点击 `Multi-WinOS Switcher.exe`，选择"以管理员身份运行"

### 操作流程

1. **启动应用** - 以管理员身份运行程序
2. **选择系统** - 界面会显示所有可用的 Windows 系统
3. **确认切换** - 点击目标系统或按 Enter 确认
4. **自动重启** - 系统将在 1 秒后自动重启到选定系统

### ⌨️ 键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| `↑` / `↓` | 上下选择系统 |
| `Enter` | 确认切换到选中的系统 |
| `Esc` | 取消并关闭应用 |

## 🛠️ 开发指南

### 环境准备

```bash
# 克隆仓库
git clone https://github.com/xiaoheicat/multi-winos-switcher.git
cd multi-winos-switcher

# 安装依赖
npm install
```

### 本地开发

```bash
# 编译并运行（需要管理员权限）
npm run dev

# 或者分步执行
npm run build   # 编译 TypeScript
npm start       # 启动应用
```

### 打包构建

```bash
# 构建便携版可执行文件
npm run build
npm run dist
```

构建完成后，便携版应用位于 `release/` 目录。

### 项目结构

```
multi-winos-switcher/
├── src/                    # TypeScript 源代码
│   ├── main.ts            # Electron 主进程
│   └── bootManager.ts     # 启动项管理模块
├── renderer/              # 渲染进程（前端）
│   ├── index.html         # 主界面
│   ├── styles.css         # 样式文件
│   └── renderer.js        # 前端逻辑
├── assets/                # 资源文件
│   └── icon.ico           # 应用图标
├── build/                 # 构建配置
│   └── app.manifest       # Windows 清单
├── .github/workflows/     # GitHub Actions
│   └── build.yml          # 自动构建配置
└── scripts/               # 辅助脚本
    └── run-as-admin.bat   # 管理员启动脚本
```

## 🔧 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Electron | 28.x | 跨平台桌面应用框架 |
| TypeScript | 5.x | 类型安全的开发语言 |
| Windows API | bcdedit | 启动配置管理 |
| electron-builder | 24.x | 应用打包工具 |

## 📚 工作原理

本应用通过 Windows 原生命令实现系统切换：

```mermaid
graph LR
    A[启动应用] --> B[读取启动项]
    B --> C[bcdedit /enum]
    C --> D[解析 UUID 和描述]
    D --> E[显示系统列表]
    E --> F[用户选择系统]
    F --> G[设置默认启动项]
    G --> H[bcdedit /default UUID]
    H --> I[取消等待时间]
    I --> J[bcdedit /timeout 0]
    J --> K[系统重启]
    K --> L[shutdown /r /t 0]
```

### 核心命令

```cmd
# 读取所有启动项
bcdedit /enum

# 设置默认启动项
bcdedit /default {UUID}

# 取消启动等待时间
bcdedit /timeout 0

# 立即重启系统
shutdown /r /t 0
```

## ⚠️ 注意事项

| 项目 | 说明 |
|------|------|
| ⚡ 管理员权限 | **必须以管理员身份运行**，否则无法修改启动配置 |
| 💾 保存工作 | 切换前请保存所有工作，系统将在确认后立即重启 |
| 🪟 系统限制 | 仅支持 Windows 系统之间的切换 |
| 🐧 Linux 不支持 | 不支持 Windows/Linux 双系统切换 |
| 🔄 备份建议 | 首次使用前建议备份重要数据 |

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

### 报告问题

如果遇到问题，请提供以下信息：

- Windows 版本
- 启动配置（`bcdedit /enum` 的输出，隐私信息可打码）
- 错误截图或日志

### 开发规范

- 遵循 TypeScript 类型规范
- 提交前运行 `npm run build` 确保编译通过
- 保持代码风格一致

## 📄 许可证

本项目采用 [MIT License](LICENSE) 开源协议。

## 👤 作者

**xiaoheicat**

- GitHub: [@xiaoheicat](https://github.com/xiaoheicat)

## ⭐ Star History

如果这个项目对你有帮助，请给个 Star ⭐

## 🙏 致谢

- 灵感来源于文章：[双系统、多系统快速切换](https://blog.csdn.net/example)
- 使用 [Electron](https://www.electronjs.org/) 构建
- 感谢所有贡献者
