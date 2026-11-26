# KeyboardKid

A desktop typing companion forked from [qianyiai/kurocat](https://github.com/qianyiai/kurocat) (MIT).

<p>
  <a href="./README.md">简体中文</a> ·
  <a href="./README.en.md">English</a> ·
  <a href="./README.ja.md">日本語</a>
</p>

**Current release: [`v1.0.1`](https://github.com/daierg/KeyboardKid/releases/tag/v1.0.1)**  
Repo: https://github.com/daierg/KeyboardKid

Transparent, always-on-top companion that reacts to keyboard and mouse. Default skin is **Xixi (西西)** (multi-expression sprites + procedural arms), with classic hand-drawn cat skins still available. Fresh Windows installs enable **login autostart** by default. In-app updates check **this** repository’s GitHub Releases.

## Download

Get installers from [Releases](https://github.com/daierg/KeyboardKid/releases). Windows:

- **`KeyboardKid-1.0.1-x64-setup.exe`** (NSIS)

If SmartScreen warns about an unknown publisher, choose **Run anyway / Keep** (open-source build without a commercial code-signing cert).

## Features

| Feature | Detail |
|---------|--------|
| Xixi skin | idle / blink / typing / fast typing / privacy eyes-closed; procedural arms |
| Classic cats | Black, Ragdoll, Orange Tabby, Calico, Tuxedo, Siamese (side menu / tray) |
| Typing stats | Bottom-left CPM HUD; menu “today chars / today peak”; resets at local midnight |
| Password privacy | Closes eyes and hides key bubbles when a password field is detected |
| Autostart | **On by default for new installs**; toggle in menu / tray |
| In-app update | Check ~8s after launch, then every **4 hours**; mouth bubble: “斯哥让你更新软件” |
| More | Always-on-top, click-through lock, scale, 65%/108 keyboard, OBS source, MCP (from KuroCat) |

Retired skins `kid` and `dafeiyu` (BigFish) were removed. Saved preferences for those IDs fall back to **Xixi**.

## In-app auto-update

The client reads the latest release from GitHub (`api.github.com/repos/daierg/KeyboardKid/releases/latest`). This is **not** a live push channel.

1. Silent check ~8 seconds after launch  
2. Recheck every **4 hours** while running  
3. If a newer version exists and was not dismissed: show the mouth speech bubble **「斯哥让你更新软件」**  
4. Click the bubble to download/install; × dismisses this version for now  
5. Progress / errors still use the top toast  

When publishing, push a `v*` tag with assets the updater can select, e.g.:

- Windows: `KeyboardKid-<ver>-x64-setup.exe`
- macOS: `KeyboardKid-<ver>-macos-universal.app.tar.gz` (when built)

CI: tagging `v*` runs [`.github/workflows/release.yml`](.github/workflows/release.yml) and uploads installers.

## Development

```bash
npm install
npm run tauri:dev
```

Build:

```bash
npm run tauri:build
```

### Permissions (macOS)

Enable **Accessibility** and **Input Monitoring** under System Settings → Privacy & Security.

### Permissions (Windows)

Usually none. On stripped images without WebView2, install the [WebView2 Runtime](https://go.microsoft.com/fwlink/p/?LinkId=2124703).

## Assets

See [docs/ASSET_GUIDE.md](docs/ASSET_GUIDE.md) for the Xixi sprite layout.

## v1.0.1 notes

- Restored classic builtin skins (breed switch fixed)
- Daily typing stats rollover (midnight + wake hardening)
- Default login autostart on fresh install
- Update feed → `daierg/KeyboardKid`, 4h interval, mouth update bubble

## Upstream & license

- `origin` → https://github.com/daierg/KeyboardKid  
- `upstream` → https://github.com/qianyiai/kurocat  

MIT — see [LICENSE](LICENSE).
