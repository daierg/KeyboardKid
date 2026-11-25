# KeyboardKid 素材指南

## 默认皮肤「西西」（大肥鱼式五表情）

目录 `src/assets/xixi/`（224×278，手臂烘焙在图内，无程序手臂/尾巴）：

| 文件 | 触发 |
|------|------|
| `idle.png` | 默认态（与 `typing.png` 同图） |
| `blink.png` | 定时眨眼（缓入缓出叠化） |
| `privacy.png` | 输密码闭眼 |
| `typing.png` | 正常打字速度 |
| `typing_fast.png` | 快速打字 / 摸头开心 |

## 旧两图 MVP（kid）

- `src/assets/kid/idle.png` — 常态整图（已去黑底）
- `src/assets/kid/privacy.png` — 输密码整图（透明底）

用户可覆盖目录（macOS）：

`~/Library/Application Support/keyboard-kid/kid-assets/`

编辑同目录 `assets-map.json`：

```json
{
  "mode": "full",
  "idle": "idle.png",
  "privacy": "privacy.png"
}
```

把 PNG 放进该目录后，在右键菜单点 **「重新加载素材」**。

## 规范

- 使用 **透明 PNG**（不要黑底；若有黑底请先抠图）。
- 建议画布约 512×512 或与键盘窗口比例接近。
- `idle`：日常 / 打字显示。
- `privacy`：检测到密码输入框时整图切换。

## 后续（mode: "rig"）

同姿态分层后再启用：

- `head.png` / `body.png` / `armL.png` / `armR.png`
- `rig.json` 中配置肩/颈 pivot

当前版本 `mode` 仍按 `full` 整图处理。
