# KeyboardKid

基于 [qianyiai/kurocat](https://github.com/qianyiai/kurocat)（MIT）改造的桌面打字伴侣。

<p>
  <a href="./README.md">简体中文</a> ·
  <a href="./README.en.md">English</a> ·
  <a href="./README.ja.md">日本語</a>
</p>

**当前版本：[`v1.0.3`](https://github.com/daierg/KeyboardKid/releases/tag/v1.0.3)**  
仓库：https://github.com/daierg/KeyboardKid

透明置顶、跟随键盘/鼠标的桌面伴侣。默认皮肤为 **西西**（多表情整图 + 程序手臂），并保留经典手绘猫皮肤切换。Windows 安装后默认开机自启，应用内可检测本仓库 Releases 并提示更新。

## 下载

到 [Releases](https://github.com/daierg/KeyboardKid/releases) 获取安装包。Windows 推荐：

- **`KeyboardKid-1.0.3-x64-setup.exe`**（NSIS 安装器）

安装后若浏览器或 SmartScreen 提示「未知发布者」，选「仍要运行 / 保留」即可（开源未购买商业代码签名）。

## 主要功能

| 能力 | 说明 |
|------|------|
| 默认皮肤西西 | idle / 眨眼 / 打字 / 快速打字 / 输密码闭眼；手臂为程序层 |
| 经典猫皮肤 | 小黑猫、布偶、大橘、三花、奶牛、暹罗（侧栏/托盘切换） |
| 输入统计 | 左下角「字/分」HUD；侧栏「今日输入 / 今日最快」，按本地自然日清零 |
| 输密码防偷窥 | 检测到密码框时闭眼并隐藏按键气泡 |
| 开机自启 | **新安装默认开启**；侧栏/托盘可关闭 |
| 应用内更新 | 启动约 8 秒后检测，之后每 **4 小时**再检；有更新时嘴边气泡「斯哥让你更新软件」 |
| 多语言 | 简中 / 繁中 / 英 / 日 / 韩（跟随系统或手动切换） |
| 帧率与省电 | 60/30 FPS；菜单闲置约 25s 销毁 WebView；深度睡眠可修剪工作集 |
| 起床气 | 睡着被突然吵醒会短暂闹脾气，摸头可消气（2D/3D） |
| AI 伴侣 / Hook | MCP `set_agent_status` / `trigger_action`，以及 `--hook` / HTTP `/hook` |
| MCP 轮廓 | `faceShape` 等轮廓字段；`patch_cat` 热更新 |
| 单实例 | 重复启动会唤醒已有进程（Win mutex / Unix flock） |
| 其他 | 置顶、穿透锁定、缩放、65%/108 键、OBS 透明源、音频插拔恢复等 |

旧版 `kid` / `dafeiyu`（大肥鱼）皮肤已下架；若本地配置仍保存这些品种，启动时会自动落到 **西西**。

## 应用内自动更新

客户端从本仓库 GitHub Releases 拉取最新版（`api.github.com/repos/daierg/KeyboardKid/releases/latest`），**不是**实时推送。

1. 启动后约 8 秒静默检测一次  
2. 进程存活期间每 **4 小时**再检测一次  
3. 发现更高版本且未点过「稍后」时：猫嘴附近出现对话气泡 **「斯哥让你更新软件」**  
4. 点击气泡开始下载/安装；点 × 可对本版本稍后提醒  
5. 下载进度与失败提示仍使用顶部条  

发布新版本时请在本仓库打 `v*` tag，并附上 updater 能识别的资产名，例如：

- Windows：`KeyboardKid-<ver>-x64-setup.exe`
- macOS：`KeyboardKid-<ver>-macos-universal.app.tar.gz`（若启用）

CI：推送符合 `v*` 的 tag 会触发 [`.github/workflows/release.yml`](.github/workflows/release.yml) 构建并上传安装包。

## 本地开发

```bash
npm install
npm run tauri:dev
```

打包：

```bash
npm run tauri:build
```

### 权限（macOS）

首次需在「系统设置 → 隐私与安全性」勾选：

- **辅助功能**
- **输入监控**

### 权限（Windows）

一般可直接运行。精简系统若缺少 WebView2，请安装 [WebView2 Runtime](https://go.microsoft.com/fwlink/p/?LinkId=2124703)。

## 素材

默认西西素材目录与规范见 [docs/ASSET_GUIDE.md](docs/ASSET_GUIDE.md)。

## 版本说明（v1.0.3）

- 合入上游 KuroCat **v5.1.1 / v5.1.2** 桌面端能力（i18n、FPS/内存、起床气、macOS TCC 重置、AI 伴侣 Hook、MCP 轮廓、单实例、跨平台修复等）
- 保留 KeyboardKid 分叉：西西默认皮肤、打字统计、更新源 `daierg/KeyboardKid`、嘴边「斯哥让你更新软件」、默认开机自启
- 不上游官网/Android；不下架的大肥鱼专属能力不回迁

## 上游与许可

- `origin` → https://github.com/daierg/KeyboardKid  
- `upstream` → https://github.com/qianyiai/kurocat  

本项目基于上游 MIT 许可；详见 [LICENSE](LICENSE)。
