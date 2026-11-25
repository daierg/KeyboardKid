import { invoke } from '@tauri-apps/api/core';
import type { KidAssetMap } from './kidRenderer';

export interface KidAssetsPayload {
  dir: string;
  map: KidAssetMap;
  idlePath: string | null;
  privacyPath: string | null;
  idleDataUrl: string | null;
  privacyDataUrl: string | null;
}

export async function loadKidAssetsFromDisk(): Promise<KidAssetMap | null> {
  try {
    const payload = await invoke<KidAssetsPayload>('get_kid_assets');
    const map: KidAssetMap = { mode: payload.map?.mode === 'rig' ? 'rig' : 'full' };
    // Prefer data URLs so AppSupport PNGs load without asset-protocol scope issues.
    if (payload.idleDataUrl) map.idle = payload.idleDataUrl;
    if (payload.privacyDataUrl) map.privacy = payload.privacyDataUrl;
    if (!map.idle && !map.privacy) return null;
    return map;
  } catch (err) {
    console.warn('[KeyboardKid] get_kid_assets failed', err);
    return null;
  }
}

export async function openKidAssetsFolder(): Promise<string> {
  return invoke<string>('open_kid_assets_folder');
}

export async function reloadKidAssets(): Promise<KidAssetMap | null> {
  return loadKidAssetsFromDisk();
}
