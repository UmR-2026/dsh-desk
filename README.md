# DSH Desktop

DeepSeek Harness（`dsh`）Web GUI 的桌面薄壳（Electron）。它只负责启动 `dsh web`、把它包进一个托盘常驻的原生窗口，**不内置任何 harness 代码** —— harness 升级时壳无需改动。

## 前置依赖（一次性）

壳本身不含 `dsh`，运行前需要本机有一个持久化的 `dsh`：

```sh
npm install -g @deepseek-ai/dsh
```

或者设 `DSH_BIN` 指向已有的 `dsh` 可执行文件（见「dsh 解析顺序」）。

## 快速开始

**方式 A —— 安装版（推荐）**

1. 到 [Releases](https://github.com/UmR-2026/dsh-desk/releases) 下载 `DSH-Desktop-Setup-0.1.0.exe`
2. 双击一键安装
3. 从开始菜单 / 桌面快捷方式启动，系统托盘出现图标

**方式 B —— 免安装**

直接双击 `release\win-unpacked\DSH Desktop.exe`。

**方式 C —— 从源码跑（开发者）**

```sh
npm install -g @deepseek-ai/dsh   # 前置依赖
npm install                        # 装 electron 等依赖
npm start                          # 启动
```

## 特性

- **托盘常驻**：关窗只隐藏，服务继续运行；只有托盘菜单 `Quit` 才终止服务。
- **单实例**：第二次启动只聚焦已有窗口，不会起第二个服务。
- **退出清理**：`Quit` 时 tree-kill 掉背后的 `dsh` 进程，不留孤儿。
- **安全渲染器**：`sandbox + contextIsolation`，无 preload，GUI 就是一个普通网页。
- **自动更新**：壳自身走 `electron-updater`（仅打包版生效）；harness 本体走 npm，两条更新流解耦。

## dsh 解析顺序

1. `DSH_BIN` —— 显式指向 `dsh` 可执行文件的路径；
2. `DSH_HOME/source/current` —— 源码 checkout（`install.sh` 布局），优先用 `apps/cli/lib/bin.js`，否则 `pnpm --dir <checkout> dsh`；
3. `PATH` 上的 `dsh`。

服务始终监听 `127.0.0.1` + 系统分配端口（`--port 0`），因此可以和浏览器里已开的实例并存。

## Windows 权限模式

Windows 上 harness 没有隔离后端，CLI 默认的 `workspace-write` 模式无法启动。`DSH_PERMISSION_MODE` 未设置时，壳会回退到 `danger-full-access`（禁用审批提示）并打一条警告；显式设置该变量可覆盖。

## 打包

```sh
npm run dist        # 安装包输出到 release/
npm run dist:dir    # 仅解包目录，快速冒烟
npm run smoke       # 无窗口冒烟：拉起 dsh web -> 解析就绪行 -> 清理
```

安装包未签名，Windows SmartScreen / macOS Gatekeeper 会提示，属正常。

## 自动更新

已配置为 GitHub Release（`owner: UmR-2026`，`repo: dsh-desk`），打包版启动时自动检查更新。

发新版：

1. 改 `package.json` 的 `version`（如 `0.1.1`）；
2. `npx electron-builder --publish always`（已设 `releaseType: release`）；
3. 若发布时出现重复 draft，合并后手动设为正式 release 即可。

公开仓库无需 token；私有仓库需设 `GH_TOKEN` 环境变量。

## 与上游保持同步（fork 二次开发）

- `git remote add upstream https://github.com/deepseek-ai/deepseek-harness.git`
- `main` 只做上游镜像，改动放 feature 分支
- 同步：`git fetch upstream && git merge upstream/main`
- 本壳不依赖 harness 源码，因此上游改动通常不影响它
