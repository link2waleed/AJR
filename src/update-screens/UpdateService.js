/**
 * UpdateService.js  —  src/update-screens/UpdateService.js
 *
 * Fetches a remote config JSON from GitHub Pages to determine
 * whether a hard or soft update should be shown.
 *
 * ─── How It Works ────────────────────────────────────────────────────────────
 *  • `enabled: true`   → activate the update check
 *  • `minVersion`      → users BELOW this version see the update screen
 *                        users AT or ABOVE this version do NOT see it
 *
 *  Example: you release v1.0.3.
 *    Set  enabled: true, minVersion: "1.0.3"
 *    → Users on 1.0.2 and below see the update screen
 *    → Users already on 1.0.3 see nothing  ✅
 *
 * ─── Remote JSON Schema ──────────────────────────────────────────────────────
 * {
 *   "hardUpdate": {
 *     "enabled": true,
 *     "minVersion": "1.0.3",     ← users below this version are hard-blocked
 *     "title": "Update Required",
 *     "message": "Please update to continue using AJR.",
 *     "androidUrl": "https://play.google.com/store/apps/details?id=com.my.AJR.android",
 *     "iosUrl":     "https://apps.apple.com/pk/app/ajr-deen-accountability/id6758246710"
 *   },
 *   "softUpdate": {
 *     "enabled": true,
 *     "minVersion": "1.0.3",     ← users below this version see a soft nudge
 *     "title": "New Update Available",
 *     "message": "We've added new features!",
 *     "androidUrl": "https://play.google.com/store/apps/details?id=com.my.AJR.android",
 *     "iosUrl":     "https://apps.apple.com/pk/app/ajr-deen-accountability/id6758246710"
 *   }
 * }
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';

// ── Configure this URL ───────────────────────────────────────────────────────
const REMOTE_CONFIG_URL =
    'https://ahmed-rna.github.io/ajr-config/config.json';

// Max ms to wait before giving up (keeps splash fast on poor networks)
const FETCH_TIMEOUT_MS = 3000;
// ─────────────────────────────────────────────────────────────────────────────

/** Current installed app version, read from app.json at build time */
const APP_VERSION =
    Constants.expoConfig?.version ||
    Constants.manifest?.version ||
    '0.0.0';

console.log(`[UpdateService] Current app version: ${APP_VERSION}`);

/** Possible update types returned to callers */
export const UPDATE_STATE = {
    NONE: 'none',
    SOFT: 'soft',
    HARD: 'hard',
};

// Cache per app-session so repeated calls are instant
let _cachedResult = null;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Accept both boolean true and string "true"
 * (GitHub Pages JSON editing sometimes wraps values in quotes)
 */
const isOn = (val) => val === true || val === 'true';

/**
 * Compare two semantic version strings.
 * Returns: -1 if v1 < v2 | 0 if equal | 1 if v1 > v2
 *
 * Examples:
 *   compareVersions("1.0.2", "1.0.3") → -1  (older, needs update)
 *   compareVersions("1.0.3", "1.0.3") →  0  (same, no update needed)
 *   compareVersions("1.0.4", "1.0.3") →  1  (newer, no update needed)
 */
function compareVersions(v1, v2) {
    const parts1 = String(v1).split('.').map(Number);
    const parts2 = String(v2).split('.').map(Number);
    const len = Math.max(parts1.length, parts2.length);

    for (let i = 0; i < len; i++) {
        const p1 = parts1[i] || 0;
        const p2 = parts2[i] || 0;
        if (p1 < p2) return -1;
        if (p1 > p2) return 1;
    }
    return 0;
}

/**
 * Determine if an update block (hardUpdate or softUpdate) should fire.
 *
 * Rules:
 *  1. `enabled` must be true (or "true")
 *  2. If `minVersion` is set: only fire if current app is BELOW minVersion
 *  3. If `minVersion` is absent: fire for everyone (legacy/simple toggle)
 */
function shouldShowUpdate(block) {
    if (!isOn(block?.enabled)) return false;

    if (block?.minVersion) {
        const result = compareVersions(APP_VERSION, block.minVersion);
        console.log(
            `[UpdateService] Version check: app=${APP_VERSION} minVersion=${block.minVersion} → ${result < 0 ? 'SHOW' : 'SKIP'}`
        );
        return result < 0; // Only show if app is OLDER than minVersion
    }

    // No minVersion set — just use the enabled flag
    return true;
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch the remote config JSON with a timeout.
 * Returns null on any failure so the app is never blocked.
 */
async function fetchRemoteConfig() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
        const response = await fetch(REMOTE_CONFIG_URL, {
            signal: controller.signal,
            cache: 'no-store',
        });

        if (!response.ok) {
            console.warn(`[UpdateService] HTTP ${response.status} — skipping update check`);
            return null;
        }

        return await response.json();
    } catch (error) {
        if (error.name === 'AbortError') {
            console.warn('[UpdateService] Fetch timed out — skipping update check');
        } else {
            console.warn('[UpdateService] Fetch error:', error.message);
        }
        return null;
    } finally {
        clearTimeout(timeoutId);
    }
}

/**
 * Main entry point — call once from SplashScreen.
 *
 * Hard update takes priority over soft update.
 *
 * Returns: { state: 'none' | 'soft' | 'hard', config: null | { title, message, storeUrl } }
 */
async function checkForUpdates() {
    if (_cachedResult !== null) return _cachedResult;

    const remoteConfig = await fetchRemoteConfig();

    if (!remoteConfig) {
        // Network unavailable or timed out — never block the user
        _cachedResult = { state: UPDATE_STATE.NONE, config: null };
        return _cachedResult;
    }

    const storeUrl = (block) =>
        Platform.OS === 'ios' ? block?.iosUrl : block?.androidUrl;

    // Hard update takes priority
    if (shouldShowUpdate(remoteConfig.hardUpdate)) {
        console.log('[UpdateService] Hard update triggered');
        _cachedResult = {
            state: UPDATE_STATE.HARD,
            config: {
                title:    remoteConfig.hardUpdate.title   || 'Update Required',
                message:  remoteConfig.hardUpdate.message || 'Please update the app to continue.',
                storeUrl: storeUrl(remoteConfig.hardUpdate),
            },
        };
        return _cachedResult;
    }

    if (shouldShowUpdate(remoteConfig.softUpdate)) {
        console.log('[UpdateService] Soft update triggered');
        _cachedResult = {
            state: UPDATE_STATE.SOFT,
            config: {
                title:    remoteConfig.softUpdate.title   || 'New Update Available',
                message:  remoteConfig.softUpdate.message || 'A new version of AJR is available.',
                storeUrl: storeUrl(remoteConfig.softUpdate),
            },
        };
        return _cachedResult;
    }

    console.log('[UpdateService] No update required for this version');
    _cachedResult = { state: UPDATE_STATE.NONE, config: null };
    return _cachedResult;
}

/** Force a fresh check on next call (useful for testing) */
function clearCache() {
    _cachedResult = null;
}

const UpdateService = { checkForUpdates, clearCache, UPDATE_STATE };
export default UpdateService;
