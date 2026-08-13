# DSH Desktop

一个 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（`dsh`）Web GUI 的桌面薄壳（Electron）。它只负责启动 `dsh web`、把它包进一个托盘常驻的原生窗口，**不内置任何 harness 代码** —— 因此 harness 升级时壳无需改动。

## 特性

- **托盘常驻**：关窗只隐藏，服务继续运行；只有菜单里的 `Quit` 才终止服务。
- **单实例**：第二次启动只聚焦已有窗口，不会起第二个服务。
- **无孤儿进程**：退出时 tree-kill 子进程；主进程被硬杀时由 reaper 兜底（TODO）。
- **安全渲染器**：`sandbox + contextIsolation`，无 preload，GUI 就是一个普通网页。
- **自动更新**：壳自身走 `electron-updater`（仅打包版生效），harness 本体走 npm，两条更新流解耦。

## 快速开始

```sh
npm install
npm start
```

首次使用需本机已有 `dsh`（见下）。

## dsh 解析顺序

壳按以下顺序找 `dsh`：

1. `DSH_BIN` —— 显式指向 `dsh` 可执行文件的路径；
2. `DSH_HOME/source/current` —— 源码 checkout（`install.sh` 布局），优先用 `apps/cli/lib/bin.js`，否则 `pnpm --dir <checkout> dsh`；
3. `PATH` 上的 `dsh`。

> 若你只有 `npx` 的临时安装，npx 缓存被清理后 PATH 就失效了。建议持久化安装：
>
> ```sh
> npm install -g @deepseek-ai/dsh
> ```
>
> 或在启动时设置 `DSH_BIN`。

服务始终监听 `127.0.0.1` + 系统分配端口（`--port 0`），因此可以和浏览器里已开的实例并存。

## Windows 权限模式

Windows 上 harness 没有隔离后端，CLI 默认的 `workspace-write` 模式无法启动。`DSH_PERMISSION_MODE` 未设置时，壳会回退到 `danger-full-access`（禁用审批提示）并打一条警告；显式设置该变量可覆盖。

## 打包

```sh
npm run dist        # 安装包输出到 release/
npm run dist:dir    # 仅解包目录，快速冒烟
```

安装包未签名，Windows SmartScreen / macOS Gatekeeper 会提示，属正常。

## 自动更新（壳自身）

1. 把 `package.json` 里 `build.publish` 的 `owner`/`repo` 改成你的 GitHub 账号与仓库；
2. 公开仓库无需 token；私有仓库需设置 `GH_TOKEN` 环境变量；
3. 每次发版用 `electron-builder --publish always`（或 GitHub Release 里放安装包），客户端即可在启动时检查并提示更新。

## 与上游保持同步（fork 二次开发）

- `git remote add upstream https://github.com/deepseek-ai/deepseek-harness.git`
- `main` 只做上游镜像，改动放 feature 分支
- 同步：`git fetch upstream && git merge upstream/main`
- 本壳不依赖 harness 源码，因此上游改动通常不影响它
