use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::process::Command;

use crate::config::app_data_dir;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct KidAssetMap {
    #[serde(default = "default_mode")]
    pub mode: String,
    #[serde(default)]
    pub idle: Option<String>,
    #[serde(default)]
    pub privacy: Option<String>,
}

fn default_mode() -> String {
    "full".to_string()
}

impl Default for KidAssetMap {
    fn default() -> Self {
        Self {
            mode: "full".to_string(),
            idle: Some("idle.png".to_string()),
            privacy: Some("privacy.png".to_string()),
        }
    }
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct KidAssetsPayload {
    pub dir: String,
    pub map: KidAssetMap,
    pub idle_path: Option<String>,
    pub privacy_path: Option<String>,
    pub idle_data_url: Option<String>,
    pub privacy_data_url: Option<String>,
}

fn mime_for(path: &PathBuf) -> &'static str {
    match path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_ascii_lowercase()
        .as_str()
    {
        "jpg" | "jpeg" => "image/jpeg",
        "webp" => "image/webp",
        "gif" => "image/gif",
        _ => "image/png",
    }
}

fn file_to_data_url(path: &PathBuf) -> Option<String> {
    let bytes = fs::read(path).ok()?;
    let b64 = to_base64(&bytes);
    Some(format!("data:{};base64,{}", mime_for(path), b64))
}

fn to_base64(data: &[u8]) -> String {
    const TABLE: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut out = String::with_capacity((data.len() + 2) / 3 * 4);
    let mut i = 0;
    while i + 3 <= data.len() {
        let n = ((data[i] as u32) << 16) | ((data[i + 1] as u32) << 8) | (data[i + 2] as u32);
        out.push(TABLE[((n >> 18) & 63) as usize] as char);
        out.push(TABLE[((n >> 12) & 63) as usize] as char);
        out.push(TABLE[((n >> 6) & 63) as usize] as char);
        out.push(TABLE[(n & 63) as usize] as char);
        i += 3;
    }
    if data.len() - i == 1 {
        let n = (data[i] as u32) << 16;
        out.push(TABLE[((n >> 18) & 63) as usize] as char);
        out.push(TABLE[((n >> 12) & 63) as usize] as char);
        out.push('=');
        out.push('=');
    } else if data.len() - i == 2 {
        let n = ((data[i] as u32) << 16) | ((data[i + 1] as u32) << 8);
        out.push(TABLE[((n >> 18) & 63) as usize] as char);
        out.push(TABLE[((n >> 12) & 63) as usize] as char);
        out.push(TABLE[((n >> 6) & 63) as usize] as char);
        out.push('=');
    }
    out
}

pub fn kid_assets_dir() -> PathBuf {
    app_data_dir().join("kid-assets")
}

pub fn assets_map_path() -> PathBuf {
    kid_assets_dir().join("assets-map.json")
}

pub fn ensure_kid_assets_dir() -> Result<PathBuf, String> {
    let dir = kid_assets_dir();
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let map_path = assets_map_path();
    if !map_path.exists() {
        let map = KidAssetMap::default();
        let json = serde_json::to_string_pretty(&map).map_err(|e| e.to_string())?;
        fs::write(&map_path, json).map_err(|e| e.to_string())?;
    }
    // README for users
    let guide = dir.join("README.txt");
    if !guide.exists() {
        let text = "KeyboardKid 素材目录\n\n\
把透明 PNG 放在本目录，并编辑 assets-map.json：\n\
{\n\
  \"mode\": \"full\",\n\
  \"idle\": \"idle.png\",\n\
  \"privacy\": \"privacy.png\"\n\
}\n\n\
idle = 常态整图；privacy = 输密码整图。\n\
文件名可改，只要 assets-map.json 指向正确文件。\n\
改完后在菜单点「重新加载素材」。\n";
        let _ = fs::write(guide, text);
    }
    Ok(dir)
}

fn resolve_named(dir: &PathBuf, name: &Option<String>) -> Option<String> {
    let Some(raw) = name else {
        return None;
    };
    let trimmed = raw.trim();
    if trimmed.is_empty() {
        return None;
    }
    let path = if PathBuf::from(trimmed).is_absolute() {
        PathBuf::from(trimmed)
    } else {
        dir.join(trimmed)
    };
    if path.is_file() {
        Some(path.to_string_lossy().to_string())
    } else {
        None
    }
}

pub fn load_kid_assets() -> Result<KidAssetsPayload, String> {
    let dir = ensure_kid_assets_dir()?;
    let map = if let Ok(content) = fs::read_to_string(assets_map_path()) {
        serde_json::from_str::<KidAssetMap>(&content).unwrap_or_default()
    } else {
        KidAssetMap::default()
    };
    let idle_path = resolve_named(&dir, &map.idle);
    let privacy_path = resolve_named(&dir, &map.privacy);
    let idle_data_url = idle_path
        .as_ref()
        .and_then(|p| file_to_data_url(&PathBuf::from(p)));
    let privacy_data_url = privacy_path
        .as_ref()
        .and_then(|p| file_to_data_url(&PathBuf::from(p)));
    Ok(KidAssetsPayload {
        dir: dir.to_string_lossy().to_string(),
        map,
        idle_path,
        privacy_path,
        idle_data_url,
        privacy_data_url,
    })
}

pub fn open_kid_assets_folder() -> Result<String, String> {
    let dir = ensure_kid_assets_dir()?;
    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg(&dir)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "windows")]
    {
        Command::new("explorer")
            .arg(&dir)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(all(not(target_os = "macos"), not(target_os = "windows")))]
    {
        Command::new("xdg-open")
            .arg(&dir)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    Ok(dir.to_string_lossy().to_string())
}
