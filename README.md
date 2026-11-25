# KeyboardKid

基于 [qianyiai/kurocat](https://github.com/qianyiai/kurocat)（MIT）改造的桌面打字伴侣。

首轮 MVP：

- 软件名 **KeyboardKid**
- 两张整图：`idle`（常态）↔ `privacy`（输密码）
- 打字时整体微晃 / bob / squash
- 打字速度（WPM）+ 今日按键统计 HUD
- App Support 目录可自由替换素材

## 本地开发

```bash
npm install
npm run tauri:dev
```

macOS 首次需在「系统设置 → 隐私与安全性」勾选 **辅助功能** 与 **输入监控**。

## 素材

见 [docs/ASSET_GUIDE.md](docs/ASSET_GUIDE.md)。

菜单：**打开素材文件夹** / **重新加载素材**。

## 上游

本地 remote `upstream` → https://github.com/qianyiai/kurocat  
远程 `origin` → https://github.com/daierg/KeyboardKid（调试完成后再 push）
