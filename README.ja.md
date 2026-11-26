# KeyboardKid

[qianyiai/kurocat](https://github.com/qianyiai/kurocat)（MIT）を改造したデスクトップ打鍵コンパニオンです。

<p>
  <a href="./README.md">简体中文</a> ·
  <a href="./README.en.md">English</a> ·
  <a href="./README.ja.md">日本語</a>
</p>

**現行バージョン：[`v1.0.3`](https://github.com/daierg/KeyboardKid/releases/tag/v1.0.3)**  
リポジトリ：https://github.com/daierg/KeyboardKid

透明・最前面の打鍵／マウス連動ペット。既定スキンは **西西（Xixi）**（複数表情スプライト＋プログラム腕）。クラシック猫スキンも切替可能。Windows 新規インストールでは **ログイン時自動起動が既定 ON**。アプリ内更新は本リポジトリの GitHub Releases を参照します。

## ダウンロード

[Releases](https://github.com/daierg/KeyboardKid/releases) から入手してください。Windows：

- **`KeyboardKid-1.0.3-x64-setup.exe`**（NSIS）

SmartScreen 等で「発行元不明」と出た場合は「実行／保持」を選んでください（商用コード署名なしの OSS ビルドです）。

## 主な機能

| 機能 | 内容 |
|------|------|
| 西西スキン | idle / まばたき / 打鍵 / 高速打鍵 / パスワード時閉眼。腕はプログラム層 |
| クラシック猫 | 黒猫・ラグドール・茶トラ・三毛・タキシード・シャム（サイドメニュー／トレイ） |
| 入力統計 | 左下「字/分」HUD、メニュー「今日の入力／今日の最速」。ローカル日付で日次リセット |
| パスワード保護 | パスワード欄検出時に閉眼＆キーバブル非表示 |
| 自動起動 | **新規インストールで既定 ON**。メニュー／トレイでオフ可 |
| アプリ内更新 | 起動約 8 秒後に検出、以降 **4 時間**ごと。更新時は口元バブル「斯哥让你更新软件」 |
| 多言語 | 簡中／繁中／英／日／韓（システム追従または手動） |
| FPS と省電力 | 60/30 FPS；メニュー約 25 秒アイドルで WebView 破棄；深い睡眠時の作業セット削減 |
| 起床時の不機嫌 | 睡眠中に起こすと短時間むくれ、頭をなでると落ち着く（2D/3D） |
| AI コンパニオン / Hook | MCP `set_agent_status` / `trigger_action`、`--hook` と HTTP `/hook` |
| MCP 輪郭 | `faceShape` など；`patch_cat` でライブ更新 |
| 単一インスタンス | 二重起動時は既存プロセスを起こす |
| その他 | 最前面、クリック透過ロック、拡大縮小、65%/108、OBS、オーディオ挿抜復帰など |

旧スキン `kid` / `dafeiyu`（BigFish）は削除済み。設定に残っていれば起動時に **西西** へフォールバックします。

## アプリ内自動更新

クライアントは GitHub Releases API（`daierg/KeyboardKid`）を参照します。リアルタイム配信ではありません。

1. 起動約 8 秒後にサイレント検出  
2. 動作中は **4 時間**ごとに再検出  
3. 新しい版があり「後で」未選択なら、口元に **「斯哥让你更新软件」**  
4. バブルクリックでダウンロード／インストール、× で当該版を後回し  
5. 進捗・失敗は上部トースト  

公開時は `v*` タグと updater が認識する資産名を付けてください。例：

- Windows：`KeyboardKid-<ver>-x64-setup.exe`
- macOS：`KeyboardKid-<ver>-macos-universal.app.tar.gz`（ビルドする場合）

CI：`v*` タグ push で [`.github/workflows/release.yml`](.github/workflows/release.yml) がインストーラをビルド／アップロードします。

## 開発

```bash
npm install
npm run tauri:dev
```

ビルド：

```bash
npm run tauri:build
```

### 権限（macOS）

「システム設定 → プライバシーとセキュリティ」で **アクセシビリティ** と **入力監視** を許可。

### 権限（Windows）

通常はそのまま。WebView2 が無い環境では [WebView2 Runtime](https://go.microsoft.com/fwlink/p/?LinkId=2124703) を導入。

## 素材

西西素材の配置は [docs/ASSET_GUIDE.md](docs/ASSET_GUIDE.md) を参照。

## v1.0.3 の変更

- 上流 KuroCat **v5.1.1 / v5.1.2** のデスクトップ機能を取り込み（i18n、FPS/メモリ、起床気、macOS TCC リセット、AI コンパニオン Hook、MCP 輪郭、単一インスタンス、クロスプラットフォーム修正など）
- KeyboardKid 独自分を維持：西西既定、入力統計、更新元 `daierg/KeyboardKid`、口元「斯哥让你更新软件」、既定自動起動
- 上流の website/Android、廃止済み BigFish 専用機能は対象外

## 上流とライセンス

- `origin` → https://github.com/daierg/KeyboardKid  
- `upstream` → https://github.com/qianyiai/kurocat  

MIT — [LICENSE](LICENSE)。
