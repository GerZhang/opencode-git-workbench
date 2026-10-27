# git-workbench

OpenCode Desktop 的 Git 面板插件，基于 OpenCode V2 的 GUI 插件 SDK（`@opencode/plugin/gui`）。

## 功能

- **Changes**：查看已暂存/未暂存文件、逐文件暂存与取消暂存、查看 unified diff、填写提交信息并提交（支持 `--amend`）。
- **Graph**：按 lane 绘制提交历史，支持当前分支/所有分支切换、refs 标签、作者与时间、分批加载。
- 中英文界面，跟随 OpenCode 语言设置。
- 所有 Git 命令在主进程通过 `execFile` 执行，不经过 shell。

## 开发

```bash
npm install
npm run typecheck
npm test
npm run build
```

监听构建：

```bash
npm run watch
```

重新构建后 OpenCode Desktop 会自动重新加载该插件的 GUI，不需要重启应用。

## 安装

在全局 `~/.config/opencode/opencode.jsonc` 中加入本地插件目录：

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["/Users/gerald/Develop/Default/opencode"]
}
```

打开 OpenCode Desktop 后：

- 在会话侧边栏的 `+` 菜单选择 **Git**；或
- 命令面板执行 **Open Git**。

插件会显示在 **Settings > Extensions > Plugins**，可以单独关闭。

## 结构

```text
src/
├── index.ts              Server 部分：声明插件 id `git-workbench`
├── gui.tsx               GUI 入口：合并声明、窗口 setup 与 main
├── gui/
│   ├── contract.ts       main ↔ window 的 typed IPC（Effect Schema）
│   ├── definition.ts     i18n 声明
│   ├── main.ts           Electron 主进程：注册 Git IPC 实现
│   ├── window.tsx        窗口：Panel / Command / MenuItem / Style
│   ├── GitPanel.tsx      Changes 与 Graph UI
│   └── styles.ts         注入到文档的 CSS
└── git/
    ├── service.ts        Git 命令与解析（status/log/diff/stage/commit）
    └── graph.ts          提交历史的 lane 布局
```

## 说明

- GUI 插件 API 目前在 OpenCode 中是实验性的（`./gui-experimental`），版本升级后可能需要适配。
- 当前版本不做 push、pull、checkout、rebase 或丢弃变更，只覆盖查看历史与提交。
- 文件变更不会自动轮询，使用面板右上角的刷新按钮或执行任意 Git 操作后刷新。
- 提交会触发仓库自身的 hooks；如果配置了 GPG 签名，签名失败会直接显示在面板错误栏。
