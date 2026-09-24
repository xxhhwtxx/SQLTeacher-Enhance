/**
 * SQLTeacher Ultimate Enhancements Engine (Pro Master Edition)
 * 
 * 1. 🎨 Tab 1: 主题调色板 (8 Designer Presets + Custom Spectrum Picker + Blur/Mask Sliders)
 * 2. 🖼️ Tab 2: 动态壁纸 (Anime, Aurora, Obsidian, Local 4K Upload via IndexedDB + Brightness/Contrast)
 * 3. ✨ Tab 3: 动效与氛围 (Atmospheric Canvas: Sakura / Rain / Snow / Matrix, Cursor Trail, Shooting Stars, Ripples)
 * 4. 🔥 Tab 4: 打击感与音效 (Power Mode Typing Engine, Combo Badge, Sparks/Crystals, Mechanical Audio, Ambient Synth)
 * 5. 🛠️ Tab 5: 效率与工具 (Pomodoro Focus Timer, SQL Cheat Sheet Modal, Editor Toolbar, Font Ligatures)
 */

(function() {
    console.log('[BetterSQLTeacher] Initializing Pro Master Enhancements...');

    // Teardown previous instance if reloading
    if (window.__BETTER_SQLTEACHER_LOADED__) {
        console.log('[BetterSQLTeacher] Cleaning up previous instance for reload...');
        if (window.__better_teardown__) {
            try { window.__better_teardown__(); } catch(e) { console.error(e); }
        }
    }
    window.__BETTER_SQLTEACHER_LOADED__ = true;

    // --- 1. IndexedDB Storage for Large Wallpapers ---
    const DB_NAME = 'BetterSQLTeacherDB';
    const STORE_NAME = 'wallpapers';

    function openDB() {
        return new Promise((resolve, reject) => {
            const req = indexedDB.open(DB_NAME, 1);
            req.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            };
            req.onsuccess = (e) => resolve(e.target.result);
            req.onerror = (e) => reject(e.target.error);
        });
    }

    async function saveWallpaperToDB(dataUrl) {
        try {
            const db = await openDB();
            const tx = db.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).put(dataUrl, 'current_wallpaper');
            return new Promise((resolve) => tx.oncomplete = resolve);
        } catch(e) {
            console.warn('[BetterSQLTeacher] IndexedDB save error:', e);
        }
    }

    async function getWallpaperFromDB() {
        try {
            const db = await openDB();
            const tx = db.transaction(STORE_NAME, 'readonly');
            const req = tx.objectStore(STORE_NAME).get('current_wallpaper');
            return new Promise((resolve) => {
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => resolve(null);
            });
        } catch(e) {
            return null;
        }
    }

    // --- 1.2 IndexedDB Storage for Custom Audio / MP3 ---
    const AUDIO_DB_NAME = 'BetterSQLTeacherAudioDB';
    const AUDIO_STORE_NAME = 'custom_audio';

    function openAudioDB() {
        return new Promise((resolve, reject) => {
            const req = indexedDB.open(AUDIO_DB_NAME, 1);
            req.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(AUDIO_STORE_NAME)) {
                    db.createObjectStore(AUDIO_STORE_NAME);
                }
            };
            req.onsuccess = (e) => resolve(e.target.result);
            req.onerror = (e) => reject(e.target.error);
        });
    }

    async function saveCustomAudioToDB(audioRecord) {
        try {
            const db = await openAudioDB();
            const tx = db.transaction(AUDIO_STORE_NAME, 'readwrite');
            tx.objectStore(AUDIO_STORE_NAME).put(audioRecord, 'current_audio');
            return new Promise((resolve) => tx.oncomplete = resolve);
        } catch(e) {
            console.warn('[BetterSQLTeacher] Audio save error:', e);
        }
    }

    async function getCustomAudioFromDB() {
        try {
            const db = await openAudioDB();
            const tx = db.transaction(AUDIO_STORE_NAME, 'readonly');
            const req = tx.objectStore(AUDIO_STORE_NAME).get('current_audio');
            return new Promise((resolve) => {
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => resolve(null);
            });
        } catch(e) {
            return null;
        }
    }

    // --- 2. Color Palettes Definitions ---
    const PALETTES = [
        { id: 'teal', name: '极光青', hex: '#39c9b6', rgb: '57, 201, 182', dark: '#0f766e' },
        { id: 'pink', name: '樱花粉', hex: '#ff79c6', rgb: '255, 121, 198', dark: '#be185d' },
        { id: 'purple', name: '赛博紫', hex: '#bd93f9', rgb: '189, 147, 249', dark: '#7c3aed' },
        { id: 'blue', name: '深海蓝', hex: '#38bdf8', rgb: '56, 189, 248', dark: '#0284c7' },
        { id: 'orange', name: '落日橙', hex: '#fb923c', rgb: '251, 146, 60', dark: '#ea580c' },
        { id: 'emerald', name: '薄荷绿', hex: '#34d399', rgb: '52, 211, 153', dark: '#059669' },
        { id: 'gold', name: '霓虹金', hex: '#facc15', rgb: '250, 204, 21', dark: '#ca8a04' },
        { id: 'crimson', name: '烈焰红', hex: '#f43f5e', rgb: '244, 63, 94', dark: '#e11d48' },
    ];

    function hexToRgb(hex) {
        hex = hex.replace('#', '');
        if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
        const num = parseInt(hex, 16);
        return {
            r: (num >> 16) & 255,
            g: (num >> 8) & 255,
            b: num & 255
        };
    }

    function hexToDark(hex) {
        const rgb = hexToRgb(hex);
        const darkR = Math.max(0, Math.floor(rgb.r * 0.45));
        const darkG = Math.max(0, Math.floor(rgb.g * 0.45));
        const darkB = Math.max(0, Math.floor(rgb.b * 0.45));
        return `#${darkR.toString(16).padStart(2, '0')}${darkG.toString(16).padStart(2, '0')}${darkB.toString(16).padStart(2, '0')}`;
    }

    // --- 3. Configuration State ---
    const DEFAULT_CONFIG = {
        // Tab 1: 调色板
        accentColor: '#39c9b6',
        accentRgb: '57, 201, 182',
        accentDark: '#0f766e',
        blurAmount: 24,
        maskOpacity: 65,

        // Tab 2: 动态壁纸
        wallpaperType: 'anime', // 'anime' | 'aurora' | 'darkglass' | 'custom' | 'custom_video'
        wallpaperMotion: true,  // 电影感慢速推近呼吸运镜 (Ken Burns)
        wallpaperBrightness: 100, // 15 - 200 %
        wallpaperContrast: 100,   // 30 - 220 %

        // Tab 3: 动效与氛围
        atmosphereEnabled: true,
        atmosphereMode: 'sakura', // 'sakura' | 'rain' | 'snow' | 'matrix'
        atmosphereDensity: 35,    // 10 - 80
        atmosphereSpeed: 1.0,     // 0.5 - 2.5
        cursorTrailEnabled: true,
        cursorTrailStyle: 'stardust', // 'stardust' | 'aurora' | 'bubbles'
        shootingStarsEnabled: true,
        rippleEnabled: true,

        // Tab 4: 打击感与音效
        powerModeEnabled: true,
        powerModeStyle: 'sparks', // 'sparks' | 'crystal' | 'sakura' | 'neon'
        powerModeCombo: true,
        powerModeShake: false,
        soundEnabled: true,
        soundType: 'clicky', // 'clicky' | 'thock' | 'linear'
        soundVolume: 0.6,
        whiteNoiseEnabled: false,
        whiteNoiseType: 'rain', // 'rain' | 'fireplace' | 'ocean' | 'cosmic' | 'custom'
        whiteNoiseVolume: 0.4,
        customAudioName: '',
        neonEnabled: true,

        // Tab 5: 效率与工具
        pomodoroEnabled: true,
        pomodoroTime: 25, // 15 | 25 | 45 | 60
        pomodoroPos: null, // { left: number, top: number } | null
        cheatsheetEnabled: true,
        editorToolbarEnabled: true,
        ligatureEnabled: true,

        // Tab 5 additions (3, 4, 7):
        visualizerEnabled: true,
        snapCardEnabled: true,
        heatmapEnabled: true,
        heatmapTheme: 'github' // 'github' | 'neon' | 'bilibili' | 'ocean'
    };

    let storedConfig = {};
    try {
        storedConfig = JSON.parse(localStorage.getItem('better_sqlteacher_config') || '{}');
    } catch(e) {}
    // Purge legacy oversized media strings to protect localStorage quota
    delete storedConfig.customWallpaperData;
    delete storedConfig.customWallpaperRecord;
    delete storedConfig.customAudioRecord;

    let CONFIG = {
        ...DEFAULT_CONFIG,
        ...storedConfig
    };
    delete CONFIG.customWallpaperData;
    delete CONFIG.customWallpaperRecord;
    delete CONFIG.customAudioRecord;

    function saveConfig() {
        try {
            // NEVER serialize huge media blobs/base64 into localStorage (IndexedDB handles media)
            const safeConfig = { ...CONFIG };
            delete safeConfig.customWallpaperData;
            delete safeConfig.customWallpaperRecord;
            delete safeConfig.customAudioRecord;
            localStorage.setItem('better_sqlteacher_config', JSON.stringify(safeConfig));
        } catch(e) {
            console.warn('[BetterUI] LocalStorage quota exceeded, skipping persistent storage:', e);
        }
        applyConfig();
    }

    // --- 4. Toast Notification Helper ---
    function showToast(msg, duration = 2200) {
        let toast = document.getElementById('better-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'better-toast';
            toast.className = 'better-toast';
            document.body.appendChild(toast);
        }
        toast.innerHTML = msg;
        toast.classList.add('show');
        clearTimeout(toast.__timer);
        toast.__timer = setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
    }

    // Preset SVG Wallpapers
    const PRESET_WALLPAPERS = {
        anime: null,
        aurora: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCAxOTIwIDEwODAnIHdpZHRoPScxOTIwJyBoZWlnaHQ9JzEwODAnPgogIDxkZWZzPgogICAgPHJhZGlhbEdyYWRpZW50IGlkPSdzcGFjZScgY3g9JzUwJScgY3k9JzM1JScgcj0nNzUlJz4KICAgICAgPHN0b3Agb2Zmc2V0PScwJScgc3RvcC1jb2xvcj0nIzBlMjU0NycvPgogICAgICA8c3RvcCBvZmZzZXQ9JzUwJScgc3RvcC1jb2xvcj0nIzA4MTQyNicvPgogICAgICA8c3RvcCBvZmZzZXQ9JzEwMCUnIHN0b3AtY29sb3I9JyMwMjA2MGMnLz4KICAgIDwvcmFkaWFsR3JhZGllbnQ+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9J2F1cm9yYTEnIHgxPScwJScgeTE9JzAlJyB4Mj0nMTAwJScgeTI9JzEwMCUnPgogICAgICA8c3RvcCBvZmZzZXQ9JzAlJyBzdG9wLWNvbG9yPScjMDBmNWQ0JyBzdG9wLW9wYWNpdHk9JzAuOScvPgogICAgICA8c3RvcCBvZmZzZXQ9JzQ1JScgc3RvcC1jb2xvcj0nIzAwYjRkOCcgc3RvcC1vcGFjaXR5PScwLjc1Jy8+CiAgICAgIDxzdG9wIG9mZnNldD0nODAlJyBzdG9wLWNvbG9yPScjN2IyY2JmJyBzdG9wLW9wYWNpdHk9JzAuNicvPgogICAgICA8c3RvcCBvZmZzZXQ9JzEwMCUnIHN0b3AtY29sb3I9J3RyYW5zcGFyZW50JyBzdG9wLW9wYWNpdHk9JzAnLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9J2F1cm9yYTInIHgxPScxMDAlJyB5MT0nMCUnIHgyPScwJScgeTI9JzEwMCUnPgogICAgICA8c3RvcCBvZmZzZXQ9JzAlJyBzdG9wLWNvbG9yPScjMzhiZGY4JyBzdG9wLW9wYWNpdHk9JzAuODUnLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9J2F1cm9yYTMnIHgxPScyMCUnIHkxPScwJScgeDI9JzgwJScgeTI9JzEwMCUnPgogICAgICA8c3RvcCBvZmZzZXQ9JzAlJyBzdG9wLWNvbG9yPScjMzRkMzk5JyBzdG9wLW9wYWNpdHk9JzAuOCcvPgogICAgICA8c3RvcCBvZmZzZXQ9JzUwJScgc3RvcC1jb2xvcj0nIzA2YjZkNCcgc3RvcC1vcGFjaXR5PScwLjYnLz4KICAgICAgPHN0b3Agb2Zmc2V0PScxMDAlJyBzdG9wLWNvbG9yPScjNGY0NmU1JyBzdG9wLW9wYWNpdHk9JzAuMycvPgogICAgPC9saW5lYXJHcmFkaWVudD4KICAgIDxmaWx0ZXIgaWQ9J2JsdXItYXVyb3JhJyB4PSctMjAlJyB5PSctMjAlJyB3aWR0aD0nMTQwJScgaGVpZ2h0PScxNDAlJz4KICAgICAgPGZlR2F1c3NpYW5CbHVyIHN0ZERldmlhdGlvbj0nNTAnLz4KICAgIDwvZmlsdGVyPgogIDwvZGVmcz4KCiAgPHJlY3Qgd2lkdGg9JzE5MjAnIGhlaWdodD0nMTA4MCcgZmlsbD0ndXJsKCNzcGFjZSknLz4KICAgIDxwYXRoIGQ9J00tMTAwLDU2MCBRMzAwLDE0MCA4NTAsMzQwIFQxNzUwLDE4MCBRMTk1MCwyMDAgMjEwMCw0MjAgTDIxMDAsMTEwMCBMLTEwMCwxMTAwIFonIGZpbGw9J3VybCgjYXVyb3JhMSknIGZpbHRlcj0ndXJsKCNibHVyLWF1cm9yYSknIG9wYWNpdHk9JzAuOTUnLz4KICA8cGF0aCBkPSdNLTEwMCw0MjAgUTQ1MCw1NjAgMTA1MCwyMjAgVDIwNTAsMzgwIEwyMDUwLDExMDAgTC0xMDAsMTEwMCBaJyBmaWxsPSd1cmwoI2F1cm9yYTIpJyBmaWx0ZXI9J3VybCgjYmx1ci1hdXJvcmEpJyBvcGFjaXR5PScwLjg1Jy8+CiAgPHBhdGggZD0nTTEwMCw2ODAgUTYwMCwyNjAgMTI1MCw0MjAgVDIxMDAsMzIwIEwyMTAwLDExMDAgTDEwMCwxMTAwIFonIGZpbGw9J3VybCgjYXVyb3JhMyknIGZpbHRlcj0ndXJsKCNibHVyLWF1cm9yYSknIG9wYWNpdHk9JzAuNycvPgo8L3N2Zz4=",
        darkglass: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCAxOTIwIDEwODAnIHdpZHRoPScxOTIwJyBoZWlnaHQ9JzEwODAnPgogIDxkZWZzPgogICAgPHJhZGlhbEdyYWRpZW50IGlkPSdvYnNpZGlhbi1nbG93JyBjeD0nNTAlJyBjeT0nNDAlJyByPSc2NSUnPgogICAgICA8c3RvcCBvZmZzZXQ9JzAlJyBzdG9wLWNvbG9yPScjMWEyNjM4Jy8+CiAgICAgIDxzdG9wIG9mZnNldD0nNjAlJyBzdG9wLWNvbG9yPScjMGQxNTIyJy8+CiAgICAgIDxzdG9wIG9mZnNldD0nMTAwJScgc3RvcC1jb2xvcj0nIzA2MDkwZScvPgogICAgPC9yYWRpYWxHcmFkaWVudD4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0ncG9seTEnIHgxPScwJScgeTE9JzAlJyB4Mj0nMTAwJScgeTI9JzEwMCUnPgogICAgICA8c3RvcCBvZmZzZXQ9JzAlJyBzdG9wLWNvbG9yPScjMzM0MTU1JyBzdG9wLW9wYWNpdHk9JzAuNjUnLz4KICAgIDwvZmlsdGVyPgogIDwvZGVmcz4KICA8cmVjdCB3aWR0aD0nMTkyMCcgaGVpZ2h0PScxMDgwJyBmaWxsPSd1cmwoI29ic2lkaWFuLWdsb3cpJy8+CiAgPHBvbHlnb24gcG9pbnRzPScwLDAgNzIwLDAgNDgwLDQ4MCAwLDMyMCcgZmlsbD0ndXJsKCNwb2x5MSknIHN0cm9rZT0ncmdiYSgyNTUsMjU1LDI1NSwwLjE1KScgc3Ryb2tlLXdpZHRoPScxLjUnLz4KICA8cG9seWdvbiBwb2ludHM9JzQ4MCw0ODAgMTA4MCw0MjAgOTIwLDg4MCAzMjAsODYwJyBmaWxsPSd1cmwoI3BvbHkxKScgc3Ryb2tlPSdyZ2JhKDU2LDE4OSwyNDgsMC4zKScgc3Ryb2tlLXdpZHRoPScyJy8+Cjwvc3ZnPg=="
    };

    let currentVideoObjectUrl = null;

    function getVideoWallpaperElement() {
        let vid = document.getElementById('better-wallpaper-video');
        if (!vid) {
            vid = document.createElement('video');
            vid.id = 'better-wallpaper-video';
            vid.autoplay = true;
            vid.loop = true;
            vid.muted = true;
            vid.playsInline = true;
            vid.setAttribute('muted', '');
            vid.setAttribute('autoplay', '');
            vid.setAttribute('loop', '');
            vid.setAttribute('playsinline', '');
            vid.style.cssText = 'position: fixed !important; top: 0 !important; left: 0 !important; width: 100vw !important; height: 100vh !important; object-fit: cover !important; z-index: -11 !important; pointer-events: none !important;';

            // Auto-recovery handler for any media decode/demux error
            vid.addEventListener('error', () => {
                console.warn('[BetterSQLTeacher] Video wallpaper error encountered, auto-recovering in stable context...');
                setTimeout(async () => {
                    if (CONFIG.wallpaperType === 'custom_video') {
                        const rec = await getWallpaperFromDB();
                        if (rec && rec.data) {
                            const b = rec.data instanceof Blob ? rec.data : new Blob([rec.data], { type: 'video/mp4' });
                            vid.src = URL.createObjectURL(b);
                            vid.play().catch(() => {});
                        }
                    }
                }, 500);
            });

            (document.body || document.documentElement).prepend(vid);
        }
        return vid;
    }

    async function applyWallpaperToDOM() {
        const root = document.documentElement;
        const videoEl = getVideoWallpaperElement();

        // Check if custom wallpaper in DB is a video
        let dbRecord = null;
        if (CONFIG.wallpaperType === 'custom' || CONFIG.wallpaperType === 'custom_video') {
            dbRecord = CONFIG.customWallpaperRecord;
            if (!dbRecord || !dbRecord.data) {
                dbRecord = await getWallpaperFromDB();
                CONFIG.customWallpaperRecord = dbRecord;
            }
            if (dbRecord && (dbRecord.type === 'video' || (dbRecord.name && /\.(mp4|webm|mkv|mov)$/i.test(dbRecord.name)))) {
                CONFIG.wallpaperType = 'custom_video';
            }
        }

        const isVideoActive = CONFIG.wallpaperType === 'custom_video';

        // If document is not fully loaded, wait for window load event to ensure stable context
        if (isVideoActive && document.readyState !== 'complete') {
            window.addEventListener('load', () => {
                setTimeout(applyWallpaperToDOM, 300);
            }, { once: true });
            return;
        }

        // 1. Ken Burns live breathing motion on body
        if (CONFIG.wallpaperMotion !== false && !isVideoActive && CONFIG.wallpaperType !== 'darkglass') {
            document.body.classList.add('better-wp-motion');
        } else {
            document.body.classList.remove('better-wp-motion');
        }

        // 2. Aurora animated class
        if (CONFIG.wallpaperType === 'aurora') {
            document.body.classList.add('better-aurora-active');
        } else {
            document.body.classList.remove('better-aurora-active');
        }

        // 3. Video Wallpaper Class on Body
        if (isVideoActive) {
            document.body.classList.add('better-video-active');
        } else {
            document.body.classList.remove('better-video-active');
        }

        // 4. Handle Types
        if (CONFIG.wallpaperType === 'aurora') {
            videoEl.classList.remove('active');
            videoEl.pause();
            root.style.setProperty('--better-custom-wallpaper', `url('${PRESET_WALLPAPERS.aurora}')`);
        } else if (CONFIG.wallpaperType === 'darkglass') {
            videoEl.classList.remove('active');
            videoEl.pause();
            root.style.setProperty('--better-custom-wallpaper', `url('${PRESET_WALLPAPERS.darkglass}')`);
        } else if (isVideoActive) {
            let record = dbRecord || CONFIG.customWallpaperRecord;
            if (!record || !record.data) {
                record = await getWallpaperFromDB();
                CONFIG.customWallpaperRecord = record;
            }

            if (record && (record.data instanceof Blob || record.type === 'video' || (record.name && /\.(mp4|webm|mkv|mov)$/i.test(record.name)))) {
                const blob = record.data instanceof Blob ? record.data : new Blob([record.data], { type: 'video/mp4' });
                const blobName = record.name || 'custom_video';
                if (!videoEl.src || videoEl.dataset.blobName !== blobName || videoEl.error) {
                    currentVideoObjectUrl = URL.createObjectURL(blob);
                    videoEl.src = currentVideoObjectUrl;
                    videoEl.dataset.blobName = blobName;
                }
                videoEl.muted = true;
                videoEl.defaultMuted = true;
                videoEl.loop = true;
                videoEl.classList.add('active');
                videoEl.style.display = 'block';
                videoEl.style.opacity = '1';

                // Auto-recover if pre-navigation transitional context invalidated the blob URL
                videoEl.onerror = () => {
                    console.warn('[BetterSQLTeacher] Video load error, refreshing blob in committed document context...');
                    setTimeout(() => {
                        if (CONFIG.wallpaperType === 'custom_video' && record && record.data) {
                            const freshBlob = record.data instanceof Blob ? record.data : new Blob([record.data], { type: 'video/mp4' });
                            videoEl.src = URL.createObjectURL(freshBlob);
                            videoEl.play().catch(() => {});
                        }
                    }, 350);
                };

                const playPromise = videoEl.play();
                if (playPromise !== undefined) {
                    playPromise.catch(() => {
                        const startOnUserInteraction = () => {
                            videoEl.play().catch(() => {});
                            document.removeEventListener('click', startOnUserInteraction);
                        };
                        document.addEventListener('click', startOnUserInteraction, { once: true });
                    });
                }
                root.style.removeProperty('--better-custom-wallpaper');
            } else {
                videoEl.classList.remove('active');
                videoEl.pause();
                root.style.removeProperty('--better-custom-wallpaper');
            }
        } else if (CONFIG.wallpaperType === 'custom') {
            videoEl.classList.remove('active');
            videoEl.pause();
            let wpData = CONFIG.customWallpaperData;
            if (!wpData) {
                const res = dbRecord || await getWallpaperFromDB();
                if (res) {
                    wpData = typeof res === 'string' ? res : (res.data instanceof Blob ? URL.createObjectURL(res.data) : res.data);
                    CONFIG.customWallpaperData = wpData;
                }
            }
            if (wpData) {
                root.style.setProperty('--better-custom-wallpaper', `url('${wpData}')`);
            } else {
                root.style.removeProperty('--better-custom-wallpaper');
            }
        } else {
            // 'anime'
            videoEl.classList.remove('active');
            videoEl.pause();
            root.style.removeProperty('--better-custom-wallpaper');
        }

        updateWallpaperFilter();
    }
    window.__better_apply_wallpaper = applyWallpaperToDOM;
    window.__better_config = CONFIG;
    window.__better_save_config = saveConfig;

    if (document.readyState !== 'complete') {
        window.addEventListener('load', () => {
            setTimeout(() => {
                if (CONFIG.wallpaperType === 'custom_video') {
                    applyWallpaperToDOM();
                }
            }, 350);
        }, { once: true });
    }

    function updateWallpaperFilter() {
        const b = (CONFIG.wallpaperBrightness != null ? CONFIG.wallpaperBrightness : 100) / 100;
        const c = (CONFIG.wallpaperContrast != null ? CONFIG.wallpaperContrast : 100) / 100;
        document.documentElement.style.setProperty('--better-wallpaper-filter', `brightness(${b}) contrast(${c})`);
    }

    function applyConfig() {
        const root = document.documentElement;

        // Sliders
        root.style.setProperty('--better-blur', `${CONFIG.blurAmount}px`);
        root.style.setProperty('--better-mask', `rgba(10, 20, 30, ${CONFIG.maskOpacity / 100})`);

        // Accent Colors
        const rgb = CONFIG.accentRgb || '57, 201, 182';
        const hex = CONFIG.accentColor || '#39c9b6';
        const dark = CONFIG.accentDark || '#0f766e';
        root.style.setProperty('--better-accent', hex);
        root.style.setProperty('--better-accent-rgb', rgb);
        root.style.setProperty('--better-accent-glow', `rgba(${rgb}, 0.4)`);
        root.style.setProperty('--better-accent-dark', dark);
        root.style.setProperty('--better-accent-gradient', `linear-gradient(135deg, ${dark} 0%, ${hex} 100%)`);

        // Wallpapers
        applyWallpaperToDOM();

        // Atmosphere canvas display
        const canvas = document.getElementById('better-atmosphere-canvas');
        if (canvas) {
            canvas.style.display = CONFIG.atmosphereEnabled ? 'block' : 'none';
        }

        // Pomodoro widget display & position
        const pomo = document.getElementById('better-pomodoro-widget');
        if (pomo) {
            pomo.style.display = CONFIG.pomodoroEnabled ? 'flex' : 'none';
            if (CONFIG.pomodoroPos && typeof CONFIG.pomodoroPos.left === 'number') {
                pomo.style.left = CONFIG.pomodoroPos.left + 'px';
                pomo.style.top = CONFIG.pomodoroPos.top + 'px';
                pomo.style.right = 'auto';
            } else {
                pomo.style.left = '';
                pomo.style.top = '';
                pomo.style.right = '';
            }
        }

        // Editor Toolbar display
        const tb = document.querySelector('.better-editor-toolbar');
        if (tb) {
            tb.style.display = CONFIG.editorToolbarEnabled ? 'flex' : 'none';
        }

        // Neon Glow on Monaco / SQL Editor
        const editors = document.querySelectorAll('.sql-editor, .monaco-editor, .editor-workspace, .editor-frame');
        editors.forEach(el => {
            if (CONFIG.neonEnabled) {
                el.classList.add('better-neon-glow');
            } else {
                el.classList.remove('better-neon-glow');
            }
        });

        // Ambient white noise audio state
        updateWhiteNoiseState();
    }

    // --- 5. Multi-Mode Atmosphere Canvas Engine ---
    let atmosphereAnimId = null;
    let atmosphereParticles = [];
    let shootingStars = [];

    function initAtmosphere() {
        let canvas = document.getElementById('better-atmosphere-canvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = 'better-atmosphere-canvas';
            document.body.appendChild(canvas);
        }

        const ctx = canvas.getContext('2d');
        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;

        const resizeHandler = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
            resetParticles();
        };
        window.addEventListener('resize', resizeHandler);

        function resetParticles() {
            atmosphereParticles = [];
            const count = CONFIG.atmosphereDensity || 35;
            const mode = CONFIG.atmosphereMode || 'sakura';

            if (mode === 'sakura') {
                for (let i = 0; i < count; i++) {
                    atmosphereParticles.push({
                        x: Math.random() * width,
                        y: Math.random() * height,
                        size: Math.random() * 8 + 6,
                        speedX: Math.random() * 1.4 - 0.2,
                        speedY: Math.random() * 1.2 + 0.7,
                        angle: Math.random() * Math.PI * 2,
                        angularSpeed: (Math.random() - 0.5) * 0.03,
                        flip: Math.random() * Math.PI,
                        flipSpeed: Math.random() * 0.03 + 0.01,
                        opacity: Math.random() * 0.4 + 0.35,
                        color: Math.random() > 0.3 ? '#fbcfe8' : '#fda4af'
                    });
                }
            } else if (mode === 'rain') {
                for (let i = 0; i < count * 2; i++) {
                    atmosphereParticles.push({
                        x: Math.random() * width,
                        y: Math.random() * height,
                        length: Math.random() * 18 + 14,
                        speedY: Math.random() * 10 + 14,
                        speedX: -2.2,
                        opacity: Math.random() * 0.35 + 0.25,
                        width: Math.random() * 1.2 + 0.8
                    });
                }
            } else if (mode === 'snow') {
                for (let i = 0; i < count; i++) {
                    atmosphereParticles.push({
                        x: Math.random() * width,
                        y: Math.random() * height,
                        radius: Math.random() * 3.5 + 1.5,
                        speedY: Math.random() * 1.2 + 0.8,
                        swaySpeed: Math.random() * 0.02 + 0.01,
                        swayRange: Math.random() * 1.8 + 0.8,
                        angle: Math.random() * Math.PI * 2,
                        opacity: Math.random() * 0.5 + 0.3
                    });
                }
            } else if (mode === 'matrix') {
                const colCount = Math.floor(width / 24);
                const chars = '01SQLSELECTWHEREJOINANDGROUPBYORDERHAVING';
                for (let i = 0; i < colCount; i++) {
                    atmosphereParticles.push({
                        x: i * 24,
                        y: Math.random() * height,
                        speedY: Math.random() * 3 + 3,
                        chars: chars,
                        currChar: chars[Math.floor(Math.random() * chars.length)],
                        opacity: Math.random() * 0.5 + 0.25
                    });
                }
            }
        }

        resetParticles();

        function maybeAddShootingStar() {
            if (!CONFIG.shootingStarsEnabled) return;
            if (Math.random() < 0.008 && shootingStars.length < 3) {
                shootingStars.push({
                    x: Math.random() * width * 0.8 + width * 0.2,
                    y: Math.random() * (height * 0.4),
                    length: Math.random() * 90 + 70,
                    speed: Math.random() * 8 + 10,
                    opacity: 1,
                    angle: Math.PI / 4 + (Math.random() - 0.5) * 0.15
                });
            }
        }

        function renderAtmosphere() {
            if (CONFIG.atmosphereEnabled) {
                ctx.clearRect(0, 0, width, height);
                const mode = CONFIG.atmosphereMode || 'sakura';
                const spd = CONFIG.atmosphereSpeed || 1.0;

                if (mode === 'sakura') {
                    for (let i = 0; i < atmosphereParticles.length; i++) {
                        const p = atmosphereParticles[i];
                        p.x += (p.speedX + Math.sin(p.angle) * 0.5) * spd;
                        p.y += p.speedY * spd;
                        p.angle += p.angularSpeed * spd;
                        p.flip += p.flipSpeed * spd;

                        if (p.y > height + 20) {
                            p.y = -20;
                            p.x = Math.random() * width;
                        }
                        if (p.x > width + 20) p.x = -20;
                        if (p.x < -20) p.x = width + 20;

                        ctx.save();
                        ctx.translate(p.x, p.y);
                        ctx.rotate(p.angle);
                        ctx.scale(1, Math.sin(p.flip));
                        ctx.beginPath();
                        ctx.moveTo(0, 0);
                        ctx.bezierCurveTo(-p.size / 2, -p.size / 2, -p.size, p.size / 3, 0, p.size);
                        ctx.bezierCurveTo(p.size, p.size / 3, p.size / 2, -p.size / 2, 0, 0);
                        ctx.fillStyle = p.color;
                        ctx.globalAlpha = p.opacity;
                        ctx.shadowColor = 'rgba(253, 164, 175, 0.4)';
                        ctx.shadowBlur = 4;
                        ctx.fill();
                        ctx.restore();
                    }
                } else if (mode === 'rain') {
                    ctx.strokeStyle = '#38bdf8';
                    for (let i = 0; i < atmosphereParticles.length; i++) {
                        const r = atmosphereParticles[i];
                        r.y += r.speedY * spd;
                        r.x += r.speedX * spd;
                        if (r.y > height) {
                            r.y = -20;
                            r.x = Math.random() * (width + 100);
                        }

                        ctx.lineWidth = r.width;
                        ctx.globalAlpha = r.opacity;
                        ctx.beginPath();
                        ctx.moveTo(r.x, r.y);
                        ctx.lineTo(r.x + r.speedX * 1.5, r.y + r.length);
                        ctx.stroke();
                    }
                } else if (mode === 'snow') {
                    ctx.fillStyle = '#f8fafc';
                    for (let i = 0; i < atmosphereParticles.length; i++) {
                        const s = atmosphereParticles[i];
                        s.angle += s.swaySpeed * spd;
                        s.x += Math.sin(s.angle) * s.swayRange * spd;
                        s.y += s.speedY * spd;
                        if (s.y > height + 10) {
                            s.y = -10;
                            s.x = Math.random() * width;
                        }

                        ctx.globalAlpha = s.opacity;
                        ctx.beginPath();
                        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
                        ctx.fill();
                    }
                } else if (mode === 'matrix') {
                    ctx.font = '14px monospace';
                    for (let i = 0; i < atmosphereParticles.length; i++) {
                        const m = atmosphereParticles[i];
                        m.y += m.speedY * spd;
                        if (Math.random() < 0.05) {
                            m.currChar = m.chars[Math.floor(Math.random() * m.chars.length)];
                        }
                        if (m.y > height) {
                            m.y = 0;
                        }
                        ctx.fillStyle = '#34d399';
                        ctx.globalAlpha = m.opacity;
                        ctx.fillText(m.currChar, m.x, m.y);
                    }
                }

                // Render Shooting Stars
                maybeAddShootingStar();
                for (let i = shootingStars.length - 1; i >= 0; i--) {
                    const st = shootingStars[i];
                    st.x -= Math.cos(st.angle) * st.speed;
                    st.y += Math.sin(st.angle) * st.speed;
                    st.opacity -= 0.015;

                    if (st.opacity <= 0 || st.x < -100 || st.y > height + 100) {
                        shootingStars.splice(i, 1);
                        continue;
                    }

                    ctx.save();
                    const grad = ctx.createLinearGradient(
                        st.x, st.y,
                        st.x + Math.cos(st.angle) * st.length,
                        st.y - Math.sin(st.angle) * st.length
                    );
                    grad.addColorStop(0, `rgba(255, 255, 255, ${st.opacity})`);
                    grad.addColorStop(0.3, `rgba(${CONFIG.accentRgb || '57, 201, 182'}, ${st.opacity * 0.7})`);
                    grad.addColorStop(1, 'transparent');

                    ctx.strokeStyle = grad;
                    ctx.lineWidth = 2.2;
                    ctx.beginPath();
                    ctx.moveTo(st.x, st.y);
                    ctx.lineTo(
                        st.x + Math.cos(st.angle) * st.length,
                        st.y - Math.sin(st.angle) * st.length
                    );
                    ctx.stroke();
                    ctx.restore();
                }
            }
            atmosphereAnimId = requestAnimationFrame(renderAtmosphere);
        }

        renderAtmosphere();
        window.__better_reset_atmosphere__ = resetParticles;
    }

    // --- 6. Cursor Trail Particles ---
    let lastPointerTime = 0;
    const pointerMoveHandler = (e) => {
        if (!CONFIG.cursorTrailEnabled) return;
        const now = performance.now();
        if (now - lastPointerTime < 24) return;
        lastPointerTime = now;

        const particle = document.createElement('div');
        particle.className = 'better-cursor-particle';
        particle.style.left = `${e.clientX}px`;
        particle.style.top = `${e.clientY}px`;

        const style = CONFIG.cursorTrailStyle || 'stardust';
        const rgb = CONFIG.accentRgb || '57, 201, 182';

        if (style === 'stardust') {
            const size = Math.random() * 5 + 3;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.background = `radial-gradient(circle, #ffffff 10%, rgba(${rgb}, 0.9) 70%)`;
            particle.style.boxShadow = `0 0 8px rgba(${rgb}, 0.8)`;
            particle.style.setProperty('--cdx', `${(Math.random() - 0.5) * 20}px`);
            particle.style.setProperty('--cdy', `${Math.random() * 16 - 8}px`);
        } else if (style === 'aurora') {
            const size = Math.random() * 9 + 6;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.background = `rgba(${rgb}, 0.65)`;
            particle.style.filter = 'blur(2px)';
            particle.style.boxShadow = `0 0 12px rgba(${rgb}, 0.9)`;
            particle.style.setProperty('--cdx', `${(Math.random() - 0.5) * 10}px`);
            particle.style.setProperty('--cdy', `${-Math.random() * 20}px`);
        } else if (style === 'bubbles') {
            const size = Math.random() * 10 + 6;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.border = `1.5px solid rgba(${rgb}, 0.85)`;
            particle.style.background = 'transparent';
            particle.style.boxShadow = `inset 0 0 6px rgba(${rgb}, 0.4)`;
            particle.style.setProperty('--cdx', `${(Math.random() - 0.5) * 25}px`);
            particle.style.setProperty('--cdy', `${-Math.random() * 25}px`);
        }

        document.body.appendChild(particle);
        setTimeout(() => particle.remove(), 600);
    };
    window.addEventListener('pointermove', pointerMoveHandler);

    // --- 7. Power Mode Typing Combo & Explosions ---
    let comboCount = 0;
    let comboTimer = null;
    let comboBadge = null;

    function initComboBadge() {
        if (!comboBadge) {
            comboBadge = document.createElement('div');
            comboBadge.id = 'better-combo-badge';
            comboBadge.innerHTML = `
                <span class="better-combo-number">0</span>
                <span class="better-combo-label">COMBO!</span>
            `;
            document.body.appendChild(comboBadge);
        }
    }

    function triggerPowerMode(x, y) {
        if (!CONFIG.powerModeEnabled) return;

        // Combo Counter
        if (CONFIG.powerModeCombo) {
            comboCount++;
            clearTimeout(comboTimer);
            if (comboBadge) {
                comboBadge.querySelector('.better-combo-number').textContent = `${comboCount}x`;
                comboBadge.classList.add('active');
                comboBadge.style.transform = `scale(${Math.min(1.4, 1 + comboCount * 0.015)})`;
                setTimeout(() => {
                    if (comboBadge) comboBadge.style.transform = 'scale(1)';
                }, 80);
            }
            comboTimer = setTimeout(() => {
                comboCount = 0;
                if (comboBadge) comboBadge.classList.remove('active');
            }, 2500);
        }

        // Screen Shake
        if (CONFIG.powerModeShake) {
            const app = document.getElementById('app') || document.body;
            app.classList.remove('better-shake');
            void app.offsetWidth;
            app.classList.add('better-shake');
            setTimeout(() => app.classList.remove('better-shake'), 130);
        }

        // Particles Explosion
        const pCount = 7 + Math.floor(Math.random() * 5);
        const style = CONFIG.powerModeStyle || 'sparks';
        const rgb = CONFIG.accentRgb || '57, 201, 182';

        for (let i = 0; i < pCount; i++) {
            const p = document.createElement('div');
            p.className = 'better-power-particle';
            p.style.left = `${x}px`;
            p.style.top = `${y}px`;

            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * 45 + 20;
            p.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
            p.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);

            if (style === 'sparks') {
                const size = Math.random() * 4 + 3;
                p.style.width = `${size}px`;
                p.style.height = `${size}px`;
                p.style.background = Math.random() > 0.4 ? '#ffffff' : `rgb(${rgb})`;
                p.style.boxShadow = `0 0 10px rgba(${rgb}, 0.9)`;
            } else if (style === 'crystal') {
                const size = Math.random() * 6 + 4;
                p.style.width = `${size}px`;
                p.style.height = `${size}px`;
                p.style.borderRadius = '2px';
                p.style.background = `rgba(${rgb}, 0.9)`;
                p.style.transform = 'rotate(45deg)';
                p.style.boxShadow = `0 0 8px rgba(${rgb}, 0.8)`;
            } else if (style === 'sakura') {
                p.style.width = '6px';
                p.style.height = '8px';
                p.style.borderRadius = '50% 0 50% 50%';
                p.style.background = '#fbcfe8';
                p.style.boxShadow = '0 0 6px #fda4af';
            } else if (style === 'neon') {
                const size = Math.random() * 5 + 4;
                p.style.width = `${size}px`;
                p.style.height = `${size}px`;
                p.style.background = '#38bdf8';
                p.style.boxShadow = '0 0 14px #38bdf8';
            }

            document.body.appendChild(p);
            setTimeout(() => p.remove(), 450);
        }
    }

    // --- 8. Web Audio Synthesizer (Zero-Assets Sound System) ---
    let audioCtx = null;
    function getAudioContext() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        return audioCtx;
    }

    // Mechanical Keyboard Sound
    function playKeyboardSound(key) {
        if (!CONFIG.soundEnabled) return;
        try {
            const ctx = getAudioContext();
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const filter = ctx.createBiquadFilter();

            const isThock = CONFIG.soundType === 'thock';
            const isLinear = CONFIG.soundType === 'linear';

            let baseFreq = isThock ? 400 : (isLinear ? 320 : 850);
            let snapDur = isThock ? 0.055 : (isLinear ? 0.035 : 0.038);

            if (key === 'Enter') {
                baseFreq *= 0.75;
                snapDur += 0.02;
            } else if (key === 'Backspace') {
                baseFreq *= 0.88;
            } else if (key === ' ') {
                baseFreq *= 0.65;
                snapDur += 0.025;
            } else {
                baseFreq += (Math.random() * 100 - 50);
            }

            osc.type = (isThock || isLinear) ? 'sine' : 'triangle';
            osc.frequency.setValueAtTime(baseFreq, now);
            osc.frequency.exponentialRampToValueAtTime(isThock ? 85 : 180, now + snapDur);

            filter.type = isLinear ? 'lowpass' : (isThock ? 'lowpass' : 'bandpass');
            filter.frequency.setValueAtTime(isLinear ? 550 : (isThock ? 750 : baseFreq * 1.5), now);
            filter.Q.setValueAtTime(isThock ? 1.5 : 2.5, now);

            const vol = (CONFIG.soundVolume || 0.6) * (isLinear ? 0.28 : (isThock ? 0.42 : 0.32));
            gain.gain.setValueAtTime(vol, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + snapDur);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now);
            osc.stop(now + snapDur + 0.01);
        } catch (e) {}
    }

    // Ambient White Noise Synth
    let whiteNoiseSource = null;
    let whiteNoiseGain = null;
    let whiteNoiseOsc1 = null;
    let whiteNoiseOsc2 = null;

    let customAudioEl = null;
    let customAudioObjectUrl = null;

    function getCustomAudioElement() {
        if (!customAudioEl) {
            customAudioEl = document.getElementById('better-custom-audio');
            if (!customAudioEl) {
                customAudioEl = document.createElement('audio');
                customAudioEl.id = 'better-custom-audio';
                customAudioEl.loop = true;
                customAudioEl.style.display = 'none';
                document.body.appendChild(customAudioEl);
            }
        }
        return customAudioEl;
    }

    async function playCustomAudio() {
        stopWhiteNoise();
        const audio = getCustomAudioElement();
        let record = CONFIG.customAudioRecord;
        if (!record || !record.data) {
            record = await getCustomAudioFromDB();
            CONFIG.customAudioRecord = record;
        }
        if (record && record.data) {
            const blob = record.data instanceof Blob ? record.data : new Blob([record.data], { type: record.type || 'audio/mp3' });
            const trackName = record.name || 'custom_audio';
            if (!audio.src || audio.dataset.trackName !== trackName || audio.error) {
                if (customAudioObjectUrl) {
                    try { URL.revokeObjectURL(customAudioObjectUrl); } catch(e) {}
                }
                customAudioObjectUrl = URL.createObjectURL(blob);
                audio.src = customAudioObjectUrl;
                audio.dataset.trackName = trackName;
            }
            audio.volume = Math.max(0, Math.min(1, CONFIG.whiteNoiseVolume !== undefined ? CONFIG.whiteNoiseVolume : 0.4));
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {
                    const onUserGesture = () => {
                        audio.play().catch(() => {});
                        document.removeEventListener('click', onUserGesture);
                    };
                    document.addEventListener('click', onUserGesture, { once: true });
                });
            }
        }
    }

    function stopCustomAudio() {
        const audio = document.getElementById('better-custom-audio');
        if (audio) {
            audio.pause();
        }
    }

    function stopWhiteNoise() {
        if (whiteNoiseSource) {
            try { whiteNoiseSource.stop(); } catch(e) {}
            whiteNoiseSource.disconnect();
            whiteNoiseSource = null;
        }
        if (whiteNoiseOsc1) {
            try { whiteNoiseOsc1.stop(); } catch(e) {}
            whiteNoiseOsc1.disconnect();
            whiteNoiseOsc1 = null;
        }
        if (whiteNoiseOsc2) {
            try { whiteNoiseOsc2.stop(); } catch(e) {}
            whiteNoiseOsc2.disconnect();
            whiteNoiseOsc2 = null;
        }
    }

    function startWhiteNoise() {
        stopWhiteNoise();
        stopCustomAudio();
        if (!CONFIG.whiteNoiseEnabled) return;
        if (CONFIG.whiteNoiseType === 'custom') {
            playCustomAudio();
            return;
        }

        try {
            const ctx = getAudioContext();
            const type = CONFIG.whiteNoiseType || 'rain';
            const vol = (CONFIG.whiteNoiseVolume || 0.4) * 0.3;

            whiteNoiseGain = ctx.createGain();
            whiteNoiseGain.gain.setValueAtTime(vol, ctx.currentTime);
            whiteNoiseGain.connect(ctx.destination);

            if (type === 'cosmic') {
                whiteNoiseOsc1 = ctx.createOscillator();
                whiteNoiseOsc2 = ctx.createOscillator();
                whiteNoiseOsc1.type = 'sine';
                whiteNoiseOsc2.type = 'sine';
                whiteNoiseOsc1.frequency.setValueAtTime(55, ctx.currentTime);
                whiteNoiseOsc2.frequency.setValueAtTime(55.4, ctx.currentTime);

                const filter = ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(320, ctx.currentTime);

                whiteNoiseOsc1.connect(filter);
                whiteNoiseOsc2.connect(filter);
                filter.connect(whiteNoiseGain);

                whiteNoiseOsc1.start();
                whiteNoiseOsc2.start();
            } else {
                const bufferSize = ctx.sampleRate * 2;
                const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                const data = buffer.getChannelData(0);

                let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
                for (let i = 0; i < bufferSize; i++) {
                    const white = Math.random() * 2 - 1;
                    b0 = 0.99886 * b0 + white * 0.0555179;
                    b1 = 0.99332 * b1 + white * 0.0750759;
                    b2 = 0.96900 * b2 + white * 0.1538520;
                    b3 = 0.86650 * b3 + white * 0.3104856;
                    b4 = 0.55000 * b4 + white * 0.5329522;
                    b5 = -0.7616 * b5 - white * 0.0168980;
                    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
                    b6 = white * 0.115926;
                }

                whiteNoiseSource = ctx.createBufferSource();
                whiteNoiseSource.buffer = buffer;
                whiteNoiseSource.loop = true;

                const filter = ctx.createBiquadFilter();
                if (type === 'rain') {
                    filter.type = 'bandpass';
                    filter.frequency.setValueAtTime(1100, ctx.currentTime);
                    filter.Q.setValueAtTime(1.0, ctx.currentTime);
                } else if (type === 'fireplace') {
                    filter.type = 'lowpass';
                    filter.frequency.setValueAtTime(600, ctx.currentTime);
                } else if (type === 'ocean') {
                    filter.type = 'lowpass';
                    filter.frequency.setValueAtTime(800, ctx.currentTime);
                    const lfo = ctx.createOscillator();
                    const lfoGain = ctx.createGain();
                    lfo.frequency.setValueAtTime(0.08, ctx.currentTime);
                    lfoGain.gain.setValueAtTime(vol * 0.6, ctx.currentTime);
                    lfo.connect(lfoGain.gain);
                    lfo.start();
                }

                whiteNoiseSource.connect(filter);
                filter.connect(whiteNoiseGain);
                whiteNoiseSource.start();
            }
        } catch(e) {}
    }

    function updateWhiteNoiseState() {
        if (CONFIG.whiteNoiseEnabled) {
            if (CONFIG.whiteNoiseType === 'custom') {
                stopWhiteNoise();
                playCustomAudio();
            } else {
                stopCustomAudio();
                startWhiteNoise();
            }
        } else {
            stopWhiteNoise();
            stopCustomAudio();
        }
    }

    // Pomodoro Success Chime
    function playChime() {
        try {
            const ctx = getAudioContext();
            const now = ctx.currentTime;
            const notes = [659.25, 830.61, 987.77];
            notes.forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + idx * 0.15);
                gain.gain.setValueAtTime(0.25, now + idx * 0.15);
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.15 + 0.8);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + idx * 0.15);
                osc.stop(now + idx * 0.15 + 0.85);
            });
        } catch(e) {}
    }

    // Keydown Listener for Sound & Power Mode
    const keydownHandler = (e) => {
        const el = document.activeElement;
        const tag = el ? el.tagName.toLowerCase() : '';
        const isEditable = el && (
            tag === 'input' || 
            tag === 'textarea' || 
            el.isContentEditable ||
            el.closest('.monaco-editor') ||
            el.closest('.sql-editor')
        );

        if (isEditable && !e.repeat) {
            playKeyboardSound(e.key);

            let x = window.innerWidth / 2;
            let y = window.innerHeight / 2;

            const cursorEl = document.querySelector('.monaco-editor .cursor');
            if (cursorEl) {
                const rect = cursorEl.getBoundingClientRect();
                x = rect.left;
                y = rect.top;
            } else {
                const rect = el.getBoundingClientRect();
                x = rect.left + rect.width / 2;
                y = rect.top + rect.height / 2;
            }

            triggerPowerMode(x, y);
            if (typeof recordActivity === 'function') recordActivity('type', 1);
        }
    };
    window.addEventListener('keydown', keydownHandler, true);

    // Click Ripple Listener
    const pointerdownHandler = (e) => {
        if (!CONFIG.rippleEnabled) return;
        if (e.target.closest('#better-customizer-modal') || 
            e.target.closest('#better-customizer-btn') ||
            e.target.closest('#better-cheatsheet-modal')) return;

        const ripple = document.createElement('div');
        ripple.className = 'better-click-ripple';
        ripple.style.left = `${e.clientX}px`;
        ripple.style.top = `${e.clientY}px`;
        document.body.appendChild(ripple);

        setTimeout(() => ripple.remove(), 520);
    };
    window.addEventListener('pointerdown', pointerdownHandler);

    // --- 9. Blooming Botanical Pomodoro Focus Timer Widget ---
    let pomoTimer = null;
    let pomoSecondsLeft = (CONFIG.pomodoroTime || 25) * 60;
    let pomoIsRunning = false;
    let pomoIsBreak = false;
    let pomoCompletedCount = parseInt(localStorage.getItem('better_pomo_count') || '0');

    function initPomodoroWidget() {
        let pomo = document.getElementById('better-pomodoro-widget');
        if (!pomo) {
            pomo = document.createElement('div');
            pomo.id = 'better-pomodoro-widget';
            pomo.title = '按住可随意拖拽停靠';
            pomo.innerHTML = `
                <span class="better-pomo-grip" title="按住可随意拖动位置">⋮⋮</span>
                <div class="better-pomo-flower" id="better-pomo-flower" title="生机花瓣：随心流起伏呼吸绽放">
                    <div class="flower-center"></div>
                    <div class="flower-petal petal-1"></div>
                    <div class="flower-petal petal-2"></div>
                    <div class="flower-petal petal-3"></div>
                    <div class="flower-petal petal-4"></div>
                    <div class="flower-petal petal-5"></div>
                    <div class="flower-petal petal-6"></div>
                </div>
                <span id="better-pomo-icon" style="display:none;">🍅</span>
                <span id="better-pomo-time" class="better-pomo-time">25:00</span>
                <button id="better-pomo-toggle" class="better-pomo-btn" title="开始/暂停">▶</button>
                <button id="better-pomo-reset" class="better-pomo-btn" title="重置">↺</button>
                <div class="better-pomo-modes" title="快速切换心流专注模式">
                    <button class="better-pomo-mode-chip ${CONFIG.pomodoroTime === 25 || !CONFIG.pomodoroTime ? 'active' : ''}" data-mins="25" title="经典专注 25分钟">25m</button>
                    <button class="better-pomo-mode-chip ${CONFIG.pomodoroTime === 50 ? 'active' : ''}" data-mins="50" title="深度心流 50分钟">50m</button>
                    <button class="better-pomo-mode-chip ${CONFIG.pomodoroTime === 5 ? 'active' : ''}" data-mins="5" title="灵感短休 5分钟">5m</button>
                </div>
                <div class="better-pomo-badge" title="今日已达成专注番茄数">
                    <span style="font-size:11px;">🍅</span><span id="better-pomo-count">${pomoCompletedCount}</span>
                </div>
            `;
            document.body.appendChild(pomo);

            // Restore position if previously saved
            if (CONFIG.pomodoroPos && typeof CONFIG.pomodoroPos.left === 'number') {
                pomo.style.left = CONFIG.pomodoroPos.left + 'px';
                pomo.style.top = CONFIG.pomodoroPos.top + 'px';
                pomo.style.right = 'auto';
            }

            // Draggable mechanics with Pointer Events
            let isDragging = false;
            let startClientX = 0, startClientY = 0;
            let initialLeft = 0, initialTop = 0;
            let dragMoved = false;

            pomo.addEventListener('pointerdown', (e) => {
                if (e.target.closest('.better-pomo-btn')) return;

                isDragging = true;
                dragMoved = false;
                startClientX = e.clientX;
                startClientY = e.clientY;

                const rect = pomo.getBoundingClientRect();
                initialLeft = rect.left;
                initialTop = rect.top;

                pomo.style.left = initialLeft + 'px';
                pomo.style.top = initialTop + 'px';
                pomo.style.right = 'auto';
                pomo.classList.add('dragging');

                try { pomo.setPointerCapture(e.pointerId); } catch(err) {}
            });

            pomo.addEventListener('pointermove', (e) => {
                if (!isDragging) return;
                const dx = e.clientX - startClientX;
                const dy = e.clientY - startClientY;
                if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
                    dragMoved = true;
                }

                let newLeft = initialLeft + dx;
                let newTop = initialTop + dy;

                const pad = 8;
                const w = pomo.offsetWidth || 150;
                const h = pomo.offsetHeight || 38;
                const maxL = Math.max(pad, window.innerWidth - w - pad);
                const maxT = Math.max(pad, window.innerHeight - h - pad);

                newLeft = Math.max(pad, Math.min(newLeft, maxL));
                newTop = Math.max(pad, Math.min(newTop, maxT));

                pomo.style.left = newLeft + 'px';
                pomo.style.top = newTop + 'px';
            });

            function stopDragging(e) {
                if (!isDragging) return;
                isDragging = false;
                pomo.classList.remove('dragging');
                try { pomo.releasePointerCapture(e.pointerId); } catch(err) {}

                if (dragMoved) {
                    const left = parseFloat(pomo.style.left);
                    const top = parseFloat(pomo.style.top);
                    if (!isNaN(left) && !isNaN(top)) {
                        CONFIG.pomodoroPos = { left, top };
                        localStorage.setItem('better_sqlteacher_config', JSON.stringify(CONFIG));
                    }
                }
            }

            pomo.addEventListener('pointerup', stopDragging);
            pomo.addEventListener('pointercancel', stopDragging);

            const timeEl = pomo.querySelector('#better-pomo-time');
            const toggleBtn = pomo.querySelector('#better-pomo-toggle');
            const resetBtn = pomo.querySelector('#better-pomo-reset');
            const iconEl = pomo.querySelector('#better-pomo-icon');
            const flowerEl = pomo.querySelector('#better-pomo-flower');
            const countEl = pomo.querySelector('#better-pomo-count');
            const modeChips = pomo.querySelectorAll('.better-pomo-mode-chip');

            function updateDisplay() {
                const m = Math.floor(pomoSecondsLeft / 60).toString().padStart(2, '0');
                const s = (pomoSecondsLeft % 60).toString().padStart(2, '0');
                timeEl.textContent = `${m}:${s}`;
            }

            function tick() {
                if (pomoSecondsLeft > 0) {
                    pomoSecondsLeft--;
                    updateDisplay();
                } else {
                    clearInterval(pomoTimer);
                    pomoIsRunning = false;
                    pomo.classList.remove('running');
                    toggleBtn.textContent = '▶';
                    playChime();

                    // Grand Bloom Burst Effect
                    if (flowerEl) {
                        flowerEl.classList.add('blooming');
                        setTimeout(() => flowerEl.classList.remove('blooming'), 1400);
                    }

                    if (!pomoIsBreak) {
                        pomoCompletedCount++;
                        localStorage.setItem('better_pomo_count', pomoCompletedCount.toString());
                        if (countEl) countEl.textContent = pomoCompletedCount;
                        showToast(`🌸 繁花盛放！已完成本轮专注，今日达成 ${pomoCompletedCount} 颗番茄，短休 5 分钟吧~`, 5000);
                        pomoIsBreak = true;
                        iconEl.textContent = '☕';
                        pomoSecondsLeft = 5 * 60;
                    } else {
                        showToast('⚡ 休息充能完毕，准备开启下一轮沉浸心流！', 4000);
                        pomoIsBreak = false;
                        iconEl.textContent = '🍅';
                        pomoSecondsLeft = (CONFIG.pomodoroTime || 25) * 60;
                    }
                    updateDisplay();
                }
            }

            toggleBtn.addEventListener('click', () => {
                if (pomoIsRunning) {
                    clearInterval(pomoTimer);
                    pomoIsRunning = false;
                    pomo.classList.remove('running');
                    toggleBtn.textContent = '▶';
                } else {
                    pomoIsRunning = true;
                    pomo.classList.add('running');
                    toggleBtn.textContent = '⏸';
                    pomoTimer = setInterval(tick, 1000);
                }
            });

            resetBtn.addEventListener('click', () => {
                clearInterval(pomoTimer);
                pomoIsRunning = false;
                pomoIsBreak = false;
                pomo.classList.remove('running');
                iconEl.textContent = '🍅';
                toggleBtn.textContent = '▶';
                pomoSecondsLeft = (CONFIG.pomodoroTime || 25) * 60;
                updateDisplay();
            });

            // Mode Selector Event Handlers
            modeChips.forEach(chip => {
                chip.addEventListener('click', () => {
                    const mins = parseInt(chip.dataset.mins);
                    CONFIG.pomodoroTime = mins;
                    modeChips.forEach(c => c.classList.remove('active'));
                    chip.classList.add('active');
                    clearInterval(pomoTimer);
                    pomoIsRunning = false;
                    pomoIsBreak = false;
                    pomo.classList.remove('running');
                    toggleBtn.textContent = '▶';
                    pomoSecondsLeft = mins * 60;
                    updateDisplay();
                    saveConfig();
                    showToast(`⏱️ 番茄钟已切换为: ${mins} 分钟模式`);
                });
            });

            pomoSecondsLeft = (CONFIG.pomodoroTime || 25) * 60;
            updateDisplay();
        }
    }

    // --- 10. SQL Cheat Sheet Floating Modal ---
    const CHEAT_DATA = [
        {
            category: 'basic',
            title: '基础查询与别名 (SELECT & AS)',
            desc: '从表中检索特定列并指定易读的别名',
            code: 'SELECT name AS 姓名, age AS 年龄, score AS 成绩\nFROM students\nWHERE score >= 60\nORDER BY score DESC\nLIMIT 10;'
        },
        {
            category: 'basic',
            title: '去重检索 (DISTINCT)',
            desc: '消除查询结果中的重复记录行',
            code: 'SELECT DISTINCT department, city\nFROM employees;'
        },
        {
            category: 'basic',
            title: '条件逻辑与范围 (IN / BETWEEN)',
            desc: '在集合中筛选或在封闭区间内匹配',
            code: 'SELECT * FROM products\nWHERE category IN (\'电子\', \'数码\', \'办公\')\n  AND price BETWEEN 100 AND 1500;'
        },
        {
            category: 'join',
            title: '内连接 (INNER JOIN)',
            desc: '只保留左右两表中关联键完全匹配的数据记录',
            code: 'SELECT o.order_id, u.username, o.amount\nFROM orders o\nINNER JOIN users u ON o.user_id = u.id;'
        },
        {
            category: 'join',
            title: '左外连接 (LEFT JOIN)',
            desc: '保留左表全部记录，右表无匹配时各列自动填充 NULL',
            code: 'SELECT u.username, COUNT(o.id) AS total_orders\nFROM users u\nLEFT JOIN orders o ON u.id = o.user_id\nGROUP BY u.username;'
        },
        {
            category: 'join',
            title: '全外连接 (FULL OUTER JOIN)',
            desc: '并集关联两表全部记录，任一侧缺失则以 NULL 补齐',
            code: 'SELECT a.name, b.dept_name\nFROM employees a\nFULL OUTER JOIN departments b ON a.dept_id = b.id;'
        },
        {
            category: 'group',
            title: '分组汇总与聚合函数 (GROUP BY)',
            desc: '搭配 COUNT、SUM、AVG、MAX、MIN 聚合统计',
            code: 'SELECT department,\n       COUNT(*) AS 员工数,\n       AVG(salary) AS 平均薪资,\n       MAX(salary) AS 最高薪资\nFROM employees\nGROUP BY department;'
        },
        {
            category: 'group',
            title: '聚合后筛选 (HAVING)',
            desc: '区别于 WHERE，HAVING 用于对 GROUP BY 生成的聚合统计值做过滤',
            code: 'SELECT class_id, AVG(score) AS avg_score\nFROM exam_records\nGROUP BY class_id\nHAVING AVG(score) > 85;'
        },
        {
            category: 'func',
            title: '条件分支表达式 (CASE WHEN)',
            desc: '在 SQL 内部构建 if-else 逻辑并映射新列',
            code: 'SELECT name, score,\n       CASE \n         WHEN score >= 90 THEN \'优秀\'\n         WHEN score >= 60 THEN \'及格\'\n         ELSE \'重修\'\n       END AS 等级\nFROM students;'
        },
        {
            category: 'func',
            title: '字符串与模糊搜索 (LIKE / CONCAT)',
            desc: '通配符 % 代表任意字符，_ 代表单字符',
            code: 'SELECT CONCAT(first_name, \' \', last_name) AS full_name\nFROM users\nWHERE email LIKE \'%@gmail.com\';'
        },
        {
            category: 'func',
            title: '空值平替 (COALESCE)',
            desc: '返回参数列表中首个非 NULL 的有效值',
            code: 'SELECT name, COALESCE(phone, email, \'暂无联系方式\') AS contact\nFROM contacts;'
        },
        {
            category: 'adv',
            title: '行号窗口函数 (ROW_NUMBER)',
            desc: '对分组数据进行独立编号，常用于提取每组 Top-N',
            code: 'SELECT department, name, salary,\n       ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) AS rank_num\nFROM employees;'
        },
        {
            category: 'adv',
            title: '密集排名 (DENSE_RANK)',
            desc: '并列排名不跳号 (如 1, 2, 2, 3)',
            code: 'SELECT student_id, score,\n       DENSE_RANK() OVER (ORDER BY score DESC) AS rank\nFROM exam_results;'
        },
        {
            category: 'adv',
            title: '结果集合并 (UNION ALL)',
            desc: '将两个相同结构的 SELECT 结果纵向合并 (ALL 保留重复行)',
            code: 'SELECT id, title, \'news\' AS type FROM news_articles\nUNION ALL\nSELECT id, title, \'blog\' AS type FROM blog_posts;'
        }
    ];

    let cheatSheetModalEl = null;

    function toggleCheatSheetModal(force) {
        if (!cheatSheetModalEl) return;
        const shouldOpen = force !== undefined ? force : !cheatSheetModalEl.classList.contains('active');
        if (shouldOpen) {
            cheatSheetModalEl.classList.add('active');
        } else {
            cheatSheetModalEl.classList.remove('active');
        }
    }

    function initCheatSheetModal() {
        if (!cheatSheetModalEl) {
            cheatSheetModalEl = document.createElement('div');
            cheatSheetModalEl.id = 'better-cheatsheet-modal';
            cheatSheetModalEl.innerHTML = `
                <div class="better-modal-header">
                    <div class="better-modal-title">
                        <span style="font-size: 19px;">📖</span>
                        <strong>SQL 核心语法与常用函数速查宝典</strong>
                    </div>
                    <button id="better-cheat-close" class="better-close-btn" title="关闭">&times;</button>
                </div>

                <input type="text" id="better-cheat-search-input" class="better-cheat-search" placeholder="🔍 搜索语法关键词 (如: JOIN, CASE, 窗口函数, 分组...)" />

                <div class="better-cheat-tabs">
                    <button class="better-cheat-tab active" data-cat="all">⚡ 全部速查</button>
                    <button class="better-cheat-tab" data-cat="basic">📁 基础查询</button>
                    <button class="better-cheat-tab" data-cat="join">🔗 表关联 JOIN</button>
                    <button class="better-cheat-tab" data-cat="group">📊 分组与统计</button>
                    <button class="better-cheat-tab" data-cat="func">🔤 常用函数</button>
                    <button class="better-cheat-tab" data-cat="adv">🚀 高级分析</button>
                </div>

                <div class="better-cheatsheet-body" id="better-cheat-cards-container"></div>
            `;
            document.body.appendChild(cheatSheetModalEl);

            const closeBtn = cheatSheetModalEl.querySelector('#better-cheat-close');
            closeBtn.addEventListener('click', () => toggleCheatSheetModal(false));

            const container = cheatSheetModalEl.querySelector('#better-cheat-cards-container');
            const searchInput = cheatSheetModalEl.querySelector('#better-cheat-search-input');
            const tabs = cheatSheetModalEl.querySelectorAll('.better-cheat-tab');

            let currentCat = 'all';

            function renderCards() {
                const kw = searchInput.value.trim().toLowerCase();
                const filtered = CHEAT_DATA.filter(item => {
                    const matchCat = currentCat === 'all' || item.category === currentCat;
                    const matchKw = !kw || item.title.toLowerCase().includes(kw) || item.desc.toLowerCase().includes(kw) || item.code.toLowerCase().includes(kw);
                    return matchCat && matchKw;
                });

                if (filtered.length === 0) {
                    container.innerHTML = '<div style="text-align:center; padding: 40px; color: rgba(255,255,255,0.4);">未找到相关 SQL 语法，换个关键词搜搜看吧~</div>';
                    return;
                }

                container.innerHTML = filtered.map(item => `
                    <div class="better-cheat-card">
                        <div class="better-cheat-title">
                            <span>${item.title}</span>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <small style="font-size: 11px; opacity: 0.7; font-weight: normal;">${item.category.toUpperCase()}</small>
                                <button class="better-copy-code-btn" data-sql="${encodeURIComponent(item.code)}">📋 复制</button>
                            </div>
                        </div>
                        <div class="better-cheat-desc">${item.desc}</div>
                        <div class="better-cheat-code">
                            <pre class="better-cheat-pre"><code>${item.code}</code></pre>
                        </div>
                    </div>
                `).join('');

                container.querySelectorAll('.better-copy-code-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const sql = decodeURIComponent(btn.dataset.sql);
                        navigator.clipboard.writeText(sql);
                        showToast('✅ 已成功复制代码至剪贴板！');
                    });
                });
            }

            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    tabs.forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    currentCat = tab.dataset.cat;
                    renderCards();
                });
            });

            searchInput.addEventListener('input', () => renderCards());
            renderCards();
        }
    }

    // --- 11. SQL Editor Toolbar & Formatters ---
    const SQL_KEYWORDS = [
        'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'IN', 'BETWEEN', 'LIKE', 'IS', 'NULL',
        'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL OUTER JOIN', 'CROSS JOIN', 'JOIN', 'ON',
        'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'OFFSET', 'UNION ALL', 'UNION', 'AS', 'DISTINCT',
        'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE TABLE', 'DROP TABLE', 'ALTER TABLE',
        'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'OVER', 'PARTITION BY', 'ROW_NUMBER', 'COUNT', 'SUM',
        'AVG', 'MIN', 'MAX', 'COALESCE', 'CONCAT', 'SUBSTR', 'SUBSTRING', 'EXISTS'
    ];

    function formatSqlKeywords(text) {
        let res = text;
        SQL_KEYWORDS.sort((a, b) => b.length - a.length).forEach(kw => {
            const regex = new RegExp(`\\b${kw}\\b`, 'gi');
            res = res.replace(regex, kw);
        });
        return res;
    }

    function beautifySqlIndentation(text) {
        let upper = formatSqlKeywords(text);
        const newlineClauses = ['SELECT', 'FROM', 'WHERE', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL OUTER JOIN', 'JOIN', 'GROUP BY', 'HAVING', 'ORDER BY', 'LIMIT'];
        
        newlineClauses.forEach(cl => {
            const regex = new RegExp(`\\s+(${cl})\\b`, 'gi');
            upper = upper.replace(regex, `\n$1`);
        });
        return upper.trim();
    }

    function injectEditorToolbar() {
        if (!CONFIG.editorToolbarEnabled) {
            const old = document.querySelector('.better-editor-toolbar');
            if (old) old.remove();
            return;
        }

        // Target the main editor container
        const target = document.querySelector('.sql-editor') || document.querySelector('.monaco-editor');
        if (!target) return;

        const parent = target.parentElement;
        if (!parent) return;

        // CRITICAL FIX: If toolbar is ALREADY attached in this container before target, DO NOT TOUCH IT!
        if (parent.querySelector(':scope > .better-editor-toolbar') || (target.previousElementSibling && target.previousElementSibling.classList && target.previousElementSibling.classList.contains('better-editor-toolbar'))) {
            return;
        }

        // Clean up any stray toolbars elsewhere
        document.querySelectorAll('.better-editor-toolbar').forEach(t => t.remove());

        const toolbar = document.createElement('div');
        toolbar.className = 'better-editor-toolbar';
        toolbar.innerHTML = `
            <div class="better-toolbar-actions">
                <span style="font-size: 11.5px; font-weight: 700; color: var(--better-accent); margin-right: 4px;">⚡ SQL 助手:</span>
                <button class="better-tool-btn" id="btn-tool-upper">🔠 关键字大写</button>
                <button class="better-tool-btn" id="btn-tool-format">✨ 换行排版</button>
                <button class="better-tool-btn" id="btn-tool-visualize">🧩 逻辑拆解</button>
                <button class="better-tool-btn" id="btn-tool-snap">📸 打卡图</button>
                <button class="better-tool-btn" id="btn-tool-cheat">📖 查速查表</button>
            </div>
            <div class="better-toolbar-actions">
                <button class="better-tool-btn" id="btn-tool-copy">📋 复制代码</button>
                <button class="better-tool-btn" id="btn-tool-clear" style="color: #f87171;">🗑️ 清空</button>
            </div>
        `;

        parent.insertBefore(toolbar, target);

        function getMonacoValue() {
            try {
                if (window.monaco && monaco.editor) {
                    const models = monaco.editor.getModels();
                    if (models && models.length > 0) {
                        return models[0].getValue();
                    }
                }
            } catch(e) {}
            const textarea = parent.querySelector('textarea');
            return textarea ? textarea.value : '';
        }

        function setMonacoValue(val) {
            try {
                if (window.monaco && monaco.editor) {
                    const models = monaco.editor.getModels();
                    if (models && models.length > 0) {
                        models[0].setValue(val);
                        return;
                    }
                }
            } catch(e) {}
            const textarea = parent.querySelector('textarea');
            if (textarea) {
                textarea.value = val;
                textarea.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }

        toolbar.querySelector('#btn-tool-upper').addEventListener('click', () => {
            const text = getMonacoValue();
            if (text) {
                setMonacoValue(formatSqlKeywords(text));
                showToast('✅ 已将 SQL 核心关键字自动转换为大写！');
            }
        });

        toolbar.querySelector('#btn-tool-format').addEventListener('click', () => {
            const text = getMonacoValue();
            if (text) {
                setMonacoValue(beautifySqlIndentation(text));
                showToast('✨ 已完成 SQL 换行对齐美化！');
            }
        });

        toolbar.querySelector('#btn-tool-cheat').addEventListener('click', () => {
            toggleCheatSheetModal(true);
        });

        const btnVis = toolbar.querySelector('#btn-tool-visualize');
        if (btnVis) {
            btnVis.addEventListener('click', () => toggleVisualizerModal(true));
        }

        const btnSnap = toolbar.querySelector('#btn-tool-snap');
        if (btnSnap) {
            btnSnap.addEventListener('click', () => toggleSnapModal(true));
        }

        toolbar.querySelector('#btn-tool-copy').addEventListener('click', () => {
            const text = getMonacoValue();
            if (text) {
                navigator.clipboard.writeText(text);
                showToast('📋 已复制当前编辑器 SQL 代码！');
            }
        });

        toolbar.querySelector('#btn-tool-clear').addEventListener('click', () => {
            if (confirm('确定要清空当前 SQL 编辑器内容吗？')) {
                setMonacoValue('');
                showToast('🗑️ 编辑器已清空');
            }
        });
    }



    // --- Helper: Shared Monaco Value & HTML Escaping ---
    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function getMonacoValue() {
        try {
            if (window.monaco && monaco.editor) {
                const models = monaco.editor.getModels();
                if (models && models.length > 0) {
                    return models[0].getValue();
                }
            }
        } catch(e) {}
        const textarea = document.querySelector('.sql-editor textarea, .monaco-editor textarea, textarea');
        return textarea ? textarea.value : '';
    }

// ==========================================================================
// 🧩 14. SQL Execution Logic Pipeline Visualizer (拆解与数据流)
// ==========================================================================
let visualizerModalEl = null;

const PIPELINE_STAGES = [
    { id: 'from', name: 'FROM & JOIN', num: '01', desc: '确定源数据表并进行笛卡尔积或关联，生成初始虚拟工作集 VT1。', tip: 'SQL 真正执行的第一步不是 SELECT，而是从磁盘或缓存扫描基表。所有后续过滤都基于此处产出的临时数据集。' },
    { id: 'where', name: 'WHERE', num: '02', desc: '逐行判定过滤条件，只保留评估为 TRUE 的记录行，生成 VT2。', tip: 'WHERE 阶段无法使用聚合函数（如 COUNT/SUM），也不能使用 SELECT 中定义的列别名，因为此时 SELECT 尚未执行！' },
    { id: 'group', name: 'GROUP BY', num: '03', desc: '根据指定列的值将数据行归类折叠，将多行聚拢为单条分组记录，生成 VT3。', tip: '一旦执行 GROUP BY，后续操作除聚合函数外，通常只能引用出现于 GROUP BY 子句中的列。' },
    { id: 'having', name: 'HAVING', num: '04', desc: '对分组统计后的聚合计算值进行过滤筛选，生成 VT4。', tip: 'HAVING 与 WHERE 的根本区别：WHERE 针对单行记录过滤，HAVING 针对聚合后的统计结果过滤。' },
    { id: 'select', name: 'SELECT', num: '05', desc: '提取并计算所需的列、执行标量函数和数学运算，生成 VT5。', tip: 'SELECT 是在这个阶段才被执行并给列分配别名的，因此在 ORDER BY 之前的地方通常无法使用 SELECT 别名。' },
    { id: 'distinct', name: 'DISTINCT', num: '06', desc: '扫描结果集并剔除各列值完全一致的重复行，生成 VT6。', tip: 'DISTINCT 操作会触发排序或 Hash 查重，对大数据集有一定开销。' },
    { id: 'order', name: 'ORDER BY', num: '07', desc: '按指定列的 ASC(升序) 或 DESC(降序) 对输出结果进行全量排序，生成 VT7。', tip: '因为 ORDER BY 在 SELECT 之后执行，所以这里可以自由使用 SELECT 中命名的列别名进行排序！' },
    { id: 'limit', name: 'LIMIT', num: '08', desc: '按指定的行数截断结果集，配合 OFFSET 实现分页，输出最终展示结果。', tip: 'LIMIT 是整个生命周期的收尾动作，只返回请求行数，降低网络与渲染负荷。' }
];

function parseSqlClauses(sql) {
    if (!sql) return {};
    const clean = sql.replace(/\/\*[\s\S]*?\*\/|--.*$/gm, ' ').trim();
    const clauses = {};

    function extract(keyword, nextKeywords) {
        const nextPattern = nextKeywords.join('|');
        const reg = new RegExp(`\\b${keyword}\\b([\\s\\S]*?)(?=\\b(?:${nextPattern})\\b|$)`, 'i');
        const m = clean.match(reg);
        return m ? m[1].trim() : null;
    }

    clauses['select'] = extract('SELECT', ['FROM', 'WHERE', 'GROUP BY', 'HAVING', 'ORDER BY', 'LIMIT']);
    clauses['distinct'] = /\bSELECT\s+DISTINCT\b/i.test(clean) ? 'DISTINCT 开启' : null;
    clauses['from'] = extract('FROM', ['WHERE', 'GROUP BY', 'HAVING', 'ORDER BY', 'LIMIT']);
    clauses['where'] = extract('WHERE', ['GROUP BY', 'HAVING', 'ORDER BY', 'LIMIT']);
    clauses['group'] = extract('GROUP BY', ['HAVING', 'ORDER BY', 'LIMIT']);
    clauses['having'] = extract('HAVING', ['ORDER BY', 'LIMIT']);
    clauses['order'] = extract('ORDER BY', ['LIMIT']);
    clauses['limit'] = extract('LIMIT', []);

    return clauses;
}

function toggleVisualizerModal(force) {
    if (!visualizerModalEl) return;
    const shouldOpen = force !== undefined ? force : !visualizerModalEl.classList.contains('active');
    if (shouldOpen) {
        visualizerModalEl.classList.add('active');
        renderVisualizerPipeline();
    } else {
        visualizerModalEl.classList.remove('active');
    }
}

function renderVisualizerPipeline() {
    if (!visualizerModalEl) return;
    const editorVal = getMonacoValue() || 'SELECT id, name, score FROM students WHERE score >= 60 ORDER BY score DESC LIMIT 10;';
    const parsed = parseSqlClauses(editorVal);

    const pipeBox = visualizerModalEl.querySelector('#better-pipe-steps');
    const detailBox = visualizerModalEl.querySelector('#better-pipe-detail-content');

    let stepsHtml = '';
    PIPELINE_STAGES.forEach((stage, idx) => {
        const hasSnippet = !!parsed[stage.id];
        const isSelected = idx === 0 || (hasSnippet && !stepsHtml.includes('selected'));
        const cls = ['better-pipe-step'];
        if (hasSnippet) cls.push('active');
        else cls.push('skipped');
        if (isSelected) cls.push('selected');

        stepsHtml += `
            <div class="${cls.join(' ')}" data-stage="${stage.id}" data-idx="${idx}">
                <span class="better-pipe-step-num">${stage.num}</span>
                <span class="better-pipe-step-name">${stage.name}</span>
                <span class="better-pipe-step-badge">${hasSnippet ? '包含' : '缺省'}</span>
            </div>
        `;
        if (idx < PIPELINE_STAGES.length - 1) {
            stepsHtml += `<span class="better-pipe-arrow">➔</span>`;
        }
    });

    pipeBox.innerHTML = stepsHtml;

    function showDetail(stageId) {
        const st = PIPELINE_STAGES.find(s => s.id === stageId) || PIPELINE_STAGES[0];
        const snippet = parsed[st.id];

        detailBox.innerHTML = `
            <div class="better-pipe-detail-title">
                <span>阶段 ${st.num} · ${st.name} 底层解析</span>
                <span style="font-size: 11px; padding: 2px 8px; border-radius: 999px; background: ${snippet ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.08)'}; color: ${snippet ? '#38bdf8' : '#94a3b8'};">
                    ${snippet ? '✓ 当前查询已命中此阶段' : '○ 当前查询未显式指定此子句'}
                </span>
            </div>
            <div style="font-size: 13px; color: #e2e8f0; line-height: 1.6; margin-bottom: 8px;">
                ${st.desc}
            </div>
            ${snippet ? `
                <div style="font-size: 11.5px; font-weight: 700; color: #38bdf8; margin-top: 6px;">
                    📝 当前 SQL 中抽取的实际代码:
                </div>
                <div class="better-pipe-code-box">${escapeHtml(snippet)}</div>
            ` : ''}
            <div style="font-size: 12px; color: #f59e0b; background: rgba(245, 158, 11, 0.08); border-left: 3px solid #f59e0b; padding: 8px 12px; border-radius: 4px; margin-top: 8px;">
                💡 <strong>核心考点/避坑点</strong>: ${st.tip}
            </div>
        `;
    }

    pipeBox.querySelectorAll('.better-pipe-step').forEach(btn => {
        btn.addEventListener('click', () => {
            pipeBox.querySelectorAll('.better-pipe-step').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            showDetail(btn.dataset.stage);
        });
    });

    // Default to first active or first stage
    const firstSelected = pipeBox.querySelector('.better-pipe-step.selected') || pipeBox.querySelector('.better-pipe-step');
    if (firstSelected) showDetail(firstSelected.dataset.stage);
}

function initSqlVisualizer() {
    if (visualizerModalEl) return;
    visualizerModalEl = document.createElement('div');
    visualizerModalEl.id = 'better-visualizer-modal';
    visualizerModalEl.innerHTML = `
        <div class="better-modal-header" style="margin-bottom: 4px;">
            <div class="better-modal-title">
                <span>🧩 SQL 底层执行流水线全景图</span>
                <small style="color: #94a3b8; font-size: 11.5px; margin-left: 8px;">(SQL Lifecycle Visualizer)</small>
            </div>
            <button class="better-modal-close-btn" id="better-vis-close">✕</button>
        </div>
        <p style="font-size: 12px; color: #94a3b8; margin: 0 0 10px 0;">
            真实的数据库执行顺序是：<strong>FROM ➔ WHERE ➔ GROUP BY ➔ HAVING ➔ SELECT ➔ DISTINCT ➔ ORDER BY ➔ LIMIT</strong>。点击任意阶段节点可查看原理解析与避坑指南。
        </p>
        <div class="better-pipe-container" id="better-pipe-steps"></div>
        <div class="better-pipe-detail" id="better-pipe-detail-content"></div>
        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 14px;">
            <button class="better-secondary-btn" id="btn-vis-refresh" style="font-size: 12px; padding: 6px 14px;">↺ 重新读取编辑器代码</button>
            <button class="better-primary-btn" id="btn-vis-done" style="font-size: 12px; padding: 6px 18px;">关闭</button>
        </div>
    `;
    document.body.appendChild(visualizerModalEl);

    visualizerModalEl.querySelector('#better-vis-close').addEventListener('click', () => toggleVisualizerModal(false));
    visualizerModalEl.querySelector('#btn-vis-done').addEventListener('click', () => toggleVisualizerModal(false));
    visualizerModalEl.querySelector('#btn-vis-refresh').addEventListener('click', () => {
        renderVisualizerPipeline();
        showToast('🔄 已同步最新编辑器 SQL 代码！');
    });
}


// ==========================================================================
// 📸 15. Ray.so Style Code Snap Card Generator (美化打卡与分享)
// ==========================================================================
let snapModalEl = null;

const SNAP_GRADIENTS = {
    aurora: { name: '极光霓虹', colors: ['#7928CA', '#4338CA', '#06B6D4'], dot: 'linear-gradient(135deg, #7928CA, #06B6D4)' },
    obsidian: { name: '暗夜黑曜', colors: ['#1e293b', '#0f172a', '#020617'], dot: 'linear-gradient(135deg, #334155, #020617)' },
    sunset: { name: '日落暖阳', colors: ['#f43f5e', '#fb923c', '#facc15'], dot: 'linear-gradient(135deg, #f43f5e, #facc15)' },
    cyber: { name: '赛博电光', colors: ['#0ea5e9', '#2563eb', '#7c3aed'], dot: 'linear-gradient(135deg, #0ea5e9, #7c3aed)' },
    emerald: { name: '森林翡翠', colors: ['#10b981', '#059669', '#064e3b'], dot: 'linear-gradient(135deg, #10b981, #064e3b)' },
    light: { name: '现代浅白', colors: ['#f8fafc', '#e2e8f0', '#94a3b8'], dot: 'linear-gradient(135deg, #f8fafc, #94a3b8)', darkText: true },
    transparent: { name: '透明无底', colors: [], dot: 'repeating-conic-gradient(#334155 0% 25%, #1e293b 0% 50%) 50% / 10px 10px' }
};

let currentSnapTheme = 'aurora';
let currentSnapPadding = 36;
let snapShowLineNums = true;
let snapShowWatermark = true;

function toggleSnapModal(force) {
    if (!snapModalEl) return;
    const shouldOpen = force !== undefined ? force : !snapModalEl.classList.contains('active');
    if (shouldOpen) {
        snapModalEl.classList.add('active');
        renderSnapCanvas();
    } else {
        snapModalEl.classList.remove('active');
    }
}

function renderSnapCanvas() {
    if (!snapModalEl) return;
    const canvas = snapModalEl.querySelector('#better-snap-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 2;

    const rawCode = getMonacoValue() || 'SELECT \n    u.username,\n    COUNT(o.id) AS total_orders,\n    SUM(o.amount) AS total_spent\nFROM users u\nLEFT JOIN orders o ON u.id = o.user_id\nWHERE u.status = \'active\'\nGROUP BY u.username\nHAVING COUNT(o.id) > 5\nORDER BY total_spent DESC\nLIMIT 10;';
    const lines = rawCode.split('\n');

    // Typography calculations
    const fontSize = 14;
    const lineHeight = 22;
    const font = `${fontSize}px 'JetBrains Mono', 'Fira Code', Consolas, monospace`;
    ctx.font = font;

    // Calculate max line width
    let maxLineWidth = 300;
    lines.forEach(l => {
        const w = ctx.measureText(l).width;
        if (w > maxLineWidth) maxLineWidth = w;
    });

    const lineNumGutter = snapShowLineNums ? 44 : 16;
    const cardContentWidth = Math.max(460, maxLineWidth + lineNumGutter + 36);
    const cardContentHeight = 38 + (lines.length * lineHeight) + (snapShowWatermark ? 36 : 18);

    const pad = currentSnapPadding;
    const totalWidth = cardContentWidth + pad * 2;
    const totalHeight = cardContentHeight + pad * 2;

    canvas.width = totalWidth * dpr;
    canvas.height = totalHeight * dpr;
    canvas.style.width = `${totalWidth}px`;
    canvas.style.height = `${totalHeight}px`;

    ctx.scale(dpr, dpr);

    // Helper: Rounded rect
    function roundRect(x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }

    // 1. Draw outer gradient background
    if (currentSnapTheme !== 'transparent') {
        const conf = SNAP_GRADIENTS[currentSnapTheme];
        const grad = ctx.createLinearGradient(0, 0, totalWidth, totalHeight);
        grad.addColorStop(0, conf.colors[0]);
        grad.addColorStop(0.5, conf.colors[1]);
        grad.addColorStop(1, conf.colors[2]);
        ctx.fillStyle = grad;
        roundRect(0, 0, totalWidth, totalHeight, 18);
        ctx.fill();
    } else {
        ctx.clearRect(0, 0, totalWidth, totalHeight);
    }

    // 2. Draw Code Window Card
    const cardX = pad;
    const cardY = pad;
    const cardW = cardContentWidth;
    const cardH = cardContentHeight;

    // Card shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 28;
    ctx.shadowOffsetY = 12;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    roundRect(cardX, cardY, cardW, cardH, 12);
    ctx.fill();
    ctx.restore();

    // Card border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.lineWidth = 1;
    roundRect(cardX, cardY, cardW, cardH, 12);
    ctx.stroke();

    // 3. Draw macOS dots
    const dotsY = cardY + 18;
    const dotsX = cardX + 16;
    const colors = ['#ff5f56', '#ffbd2e', '#27c93f'];
    colors.forEach((c, i) => {
        ctx.beginPath();
        ctx.arc(dotsX + i * 14, dotsY, 5, 0, Math.PI * 2);
        ctx.fillStyle = c;
        ctx.fill();
    });

    // Window title
    ctx.fillStyle = '#94a3b8';
    ctx.font = `11px 'JetBrains Mono', Consolas, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('SQLTeacher · Query Session', cardX + cardW / 2, dotsY + 3);

    // 4. Draw Code lines with syntax highlighting
    ctx.textAlign = 'left';
    let lineY = cardY + 44;

    const kwRegex = new RegExp(`\\b(?:${SQL_KEYWORDS.join('|')})\\b`, 'i');

    lines.forEach((lineText, idx) => {
        // Line number
        if (snapShowLineNums) {
            ctx.fillStyle = '#475569';
            ctx.font = `12px 'JetBrains Mono', Consolas, monospace`;
            ctx.fillText(String(idx + 1).padStart(2, ' '), cardX + 14, lineY + 14);
        }

        const startX = cardX + lineNumGutter;

        // Simple token rendering
        let currentX = startX;
        ctx.font = font;

        // Tokenize line by space, punctuation, strings
        const tokens = lineText.split(/(\s+|[(),;]|\'[^\']*\'|\b\w+\b)/g).filter(Boolean);

        tokens.forEach(token => {
            if (token.startsWith("'") && token.endsWith("'")) {
                ctx.fillStyle = '#a6e3a1'; // String green
            } else if (/^\d+$/.test(token)) {
                ctx.fillStyle = '#fab387'; // Number orange
            } else if (kwRegex.test(token)) {
                ctx.fillStyle = '#cba6f7'; // Keyword purple
            } else if (/[(),;]/.test(token)) {
                ctx.fillStyle = '#89dceb'; // Punctuation cyan
            } else {
                ctx.fillStyle = '#cdd6f4'; // Identifier normal text
            }

            ctx.fillText(token, currentX, lineY + 14);
            currentX += ctx.measureText(token).width;
        });

        lineY += lineHeight;
    });

    // 5. Watermark Badge
    if (snapShowWatermark) {
        const badgeY = cardY + cardH - 14;
        ctx.font = `11px 'JetBrains Mono', Consolas, sans-serif`;
        ctx.fillStyle = '#38bdf8';
        ctx.fillText('✨ SQLTeacher Plus', cardX + 16, badgeY);

        ctx.fillStyle = '#64748b';
        ctx.textAlign = 'right';
        const dateStr = new Date().toISOString().split('T')[0];
        ctx.fillText(`📅 打卡达成 · ${dateStr}`, cardX + cardW - 16, badgeY);
    }
}

function initCardSnapGenerator() {
    if (snapModalEl) return;
    snapModalEl = document.createElement('div');
    snapModalEl.id = 'better-snap-modal';
    snapModalEl.innerHTML = `
        <div class="better-modal-header" style="margin-bottom: 6px;">
            <div class="better-modal-title">
                <span>📸 Ray.so 风格代码打卡美化生成器</span>
                <small style="color: #94a3b8; font-size: 11.5px; margin-left: 8px;">(Code Snap Card)</small>
            </div>
            <button class="better-modal-close-btn" id="better-snap-close">✕</button>
        </div>
        <div class="better-snap-preview-wrap">
            <div class="better-snap-canvas-container">
                <canvas id="better-snap-canvas"></canvas>
            </div>
        </div>
        <div class="better-snap-controls">
            <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 12px; color: #cbd5e1;">背景渐变:</span>
                <div class="better-snap-theme-select" id="snap-theme-btns"></div>
            </div>
            <div style="display: flex; align-items: center; gap: 14px;">
                <label style="display: flex; align-items: center; gap: 4px; font-size: 12px; color: #cbd5e1; cursor: pointer;">
                    <input type="checkbox" id="snap-toggle-lines" checked> 显示行号
                </label>
                <label style="display: flex; align-items: center; gap: 4px; font-size: 12px; color: #cbd5e1; cursor: pointer;">
                    <input type="checkbox" id="snap-toggle-watermark" checked> 打卡水印
                </label>
                <div style="display: flex; gap: 8px;">
                    <button class="better-secondary-btn" id="btn-snap-copy" style="font-size: 12px; padding: 6px 14px;">📋 复制图片</button>
                    <button class="better-primary-btn" id="btn-snap-download" style="font-size: 12px; padding: 6px 16px;">💾 保存图片</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(snapModalEl);

    // Populate theme buttons
    const themeBox = snapModalEl.querySelector('#snap-theme-btns');
    Object.keys(SNAP_GRADIENTS).forEach(key => {
        const item = SNAP_GRADIENTS[key];
        const btn = document.createElement('button');
        btn.className = `better-snap-theme-btn ${key === currentSnapTheme ? 'active' : ''}`;
        btn.style.background = item.dot;
        btn.title = item.name;
        btn.addEventListener('click', () => {
            themeBox.querySelectorAll('.better-snap-theme-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentSnapTheme = key;
            renderSnapCanvas();
        });
        themeBox.appendChild(btn);
    });

    snapModalEl.querySelector('#better-snap-close').addEventListener('click', () => toggleSnapModal(false));

    snapModalEl.querySelector('#snap-toggle-lines').addEventListener('change', (e) => {
        snapShowLineNums = e.target.checked;
        renderSnapCanvas();
    });
    snapModalEl.querySelector('#snap-toggle-watermark').addEventListener('change', (e) => {
        snapShowWatermark = e.target.checked;
        renderSnapCanvas();
    });

    // Copy image to clipboard
    snapModalEl.querySelector('#btn-snap-copy').addEventListener('click', () => {
        const canvas = snapModalEl.querySelector('#better-snap-canvas');
        if (!canvas) return;
        try {
            canvas.toBlob(async (blob) => {
                if (!blob) {
                    showToast('❌ 生成图片失败，请重试');
                    return;
                }
                try {
                    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
                    showToast('🎉 打卡图片已成功复制到剪贴板！可直接粘贴发送');
                } catch(err) {
                    console.error(err);
                    showToast('⚠️ 剪贴板写入权限受限，请使用【保存图片】');
                }
            }, 'image/png');
        } catch(e) {
            console.error(e);
            showToast('⚠️ 复制失败，请点击【保存图片】下载');
        }
    });

    // Download PNG
    snapModalEl.querySelector('#btn-snap-download').addEventListener('click', () => {
        const canvas = snapModalEl.querySelector('#better-snap-canvas');
        if (!canvas) return;
        try {
            const dateStr = new Date().toISOString().split('T')[0];
            const a = document.createElement('a');
            a.download = `SQLTeacher-打卡-${dateStr}.png`;
            a.href = canvas.toDataURL('image/png');
            a.click();
            showToast('💾 高清打卡卡片已保存至下载目录！');
        } catch(e) {
            console.error(e);
            showToast('❌ 保存失败');
        }
    });
}


// ==========================================================================
// 📅 16. GitHub Style Contribution Heatmap (刷题打卡与活跃度矩阵)
// ==========================================================================
const ACTIVITY_STORAGE_KEY = 'better_sqlteacher_activity';

function getActivityData() {
    try {
        return JSON.parse(localStorage.getItem(ACTIVITY_STORAGE_KEY) || '{}');
    } catch(e) {
        return {};
    }
}

function saveActivityData(data) {
    try {
        localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(data));
    } catch(e) {}
}

function recordActivity(type = 'run', amount = 1) {
    const data = getActivityData();
    const today = new Date().toISOString().split('T')[0];
    if (!data[today]) {
        data[today] = { count: 0, runs: 0, chars: 0 };
    }
    if (type === 'run') {
        data[today].runs = (data[today].runs || 0) + amount;
        data[today].count = (data[today].count || 0) + (amount * 3); // runs have higher weight
    } else if (type === 'type') {
        data[today].chars = (data[today].chars || 0) + amount;
        data[today].count = (data[today].count || 0) + amount;
    }
    saveActivityData(data);
}

function calculateStreaks(data) {
    const dates = Object.keys(data).filter(d => (data[d].count || 0) > 0).sort();
    if (dates.length === 0) return { current: 0, longest: 0, totalDays: 0, totalRuns: 0 };

    let totalRuns = 0;
    Object.values(data).forEach(v => totalRuns += (v.runs || 0));

    // Calculate current streak
    let currentStreak = 0;
    let checkDate = new Date();
    while (true) {
        const dateStr = checkDate.toISOString().split('T')[0];
        if (data[dateStr] && data[dateStr].count > 0) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            // Check if yesterday had activity (in case today hasn't started yet)
            if (currentStreak === 0) {
                checkDate.setDate(checkDate.getDate() - 1);
                const yestStr = checkDate.toISOString().split('T')[0];
                if (data[yestStr] && data[yestStr].count > 0) {
                    currentStreak++;
                    checkDate.setDate(checkDate.getDate() - 1);
                    continue;
                }
            }
            break;
        }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    let prevTime = 0;
    dates.forEach(d => {
        const currTime = new Date(d).getTime();
        if (prevTime === 0 || currTime - prevTime === 86400000) {
            tempStreak++;
        } else {
            tempStreak = 1;
        }
        if (tempStreak > longestStreak) longestStreak = tempStreak;
        prevTime = currTime;
    });

    return {
        current: currentStreak,
        longest: Math.max(currentStreak, longestStreak),
        totalDays: dates.length,
        totalRuns: totalRuns
    };
}

let tooltipEl = null;
function showHeatTooltip(e, text) {
    if (!tooltipEl) {
        tooltipEl = document.createElement('div');
        tooltipEl.className = 'better-heat-tooltip';
        document.body.appendChild(tooltipEl);
    }
    tooltipEl.textContent = text;
    tooltipEl.style.left = `${e.clientX + 10}px`;
    tooltipEl.style.top = `${e.clientY - 28}px`;
    tooltipEl.classList.add('show');
}
function hideHeatTooltip() {
    if (tooltipEl) tooltipEl.classList.remove('show');
}

function renderHeatmapWidget(container) {
    if (!container) return;
    const data = getActivityData();
    const streaks = calculateStreaks(data);
    const theme = CONFIG.heatmapTheme || 'github';

    // 16 weeks = 112 days
    const totalDays = 112;
    const today = new Date();
    const dayCells = [];

    // Days list from 111 days ago to today
    for (let i = totalDays - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayData = data[dateStr] || { count: 0, runs: 0 };
        let lvl = 0;
        if (dayData.count > 15) lvl = 4;
        else if (dayData.count > 8) lvl = 3;
        else if (dayData.count > 3) lvl = 2;
        else if (dayData.count > 0) lvl = 1;

        dayCells.push({
            date: dateStr,
            level: lvl,
            count: dayData.count,
            runs: dayData.runs
        });
    }

    container.innerHTML = `
        <div class="better-heatmap-card heatmap-theme-${theme}">
            <div class="better-heatmap-stats">
                <div class="better-stat-box">
                    <div class="better-stat-value">${streaks.current} <span style="font-size: 11px;">天</span></div>
                    <div class="better-stat-label">🔥 连续打卡</div>
                </div>
                <div class="better-stat-box">
                    <div class="better-stat-value">${streaks.longest} <span style="font-size: 11px;">天</span></div>
                    <div class="better-stat-label">🏆 最长坚持</div>
                </div>
                <div class="better-stat-box">
                    <div class="better-stat-value">${streaks.totalDays} <span style="font-size: 11px;">天</span></div>
                    <div class="better-stat-label">📅 累计刷题天</div>
                </div>
                <div class="better-stat-box">
                    <div class="better-stat-value">${streaks.totalRuns} <span style="font-size: 11px;">次</span></div>
                    <div class="better-stat-label">⚡ 查询执行</div>
                </div>
            </div>

            <div class="better-heatmap-grid-wrap">
                <div class="better-heatmap-grid" id="better-heat-grid"></div>
            </div>

            <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 10px;">
                <div style="display: flex; gap: 6px;">
                    <button class="better-secondary-btn" id="btn-heat-mock" style="font-size: 11px; padding: 3px 8px;">
                        🎲 填充模拟数据
                    </button>
                    <button class="better-secondary-btn" id="btn-heat-clear" style="font-size: 11px; padding: 3px 8px; color: #f87171;">
                        🧹 清空记录
                    </button>
                </div>
                <div class="better-heat-legend">
                    <span>较少</span>
                    <span class="better-heat-legend-cell" style="background: var(--heat-lvl-0);"></span>
                    <span class="better-heat-legend-cell" style="background: var(--heat-lvl-1);"></span>
                    <span class="better-heat-legend-cell" style="background: var(--heat-lvl-2);"></span>
                    <span class="better-heat-legend-cell" style="background: var(--heat-lvl-3);"></span>
                    <span class="better-heat-legend-cell" style="background: var(--heat-lvl-4);"></span>
                    <span>更多</span>
                </div>
            </div>
        </div>
    `;

    const grid = container.querySelector('#better-heat-grid');
    dayCells.forEach(c => {
        const cell = document.createElement('div');
        cell.className = 'better-heat-cell';
        cell.dataset.level = c.level;
        cell.dataset.date = c.date;

        cell.addEventListener('mouseenter', (e) => {
            const txt = c.count > 0 
                ? `${c.date}: 完成 ${c.runs} 次查询，活跃指数 ${c.count}` 
                : `${c.date}: 暂无学习记录`;
            showHeatTooltip(e, txt);
        });
        cell.addEventListener('mousemove', (e) => {
            if (tooltipEl) {
                tooltipEl.style.left = `${e.clientX + 10}px`;
                tooltipEl.style.top = `${e.clientY - 28}px`;
            }
        });
        cell.addEventListener('mouseleave', hideHeatTooltip);

        grid.appendChild(cell);
    });

    container.querySelector('#btn-heat-mock').addEventListener('click', () => {
        const mock = getActivityData();
        const now = new Date();
        for (let i = 0; i < 75; i++) {
            if (Math.random() > 0.28) {
                const d = new Date();
                d.setDate(now.getDate() - i);
                const ds = d.toISOString().split('T')[0];
                const r = Math.floor(Math.random() * 8) + 1;
                mock[ds] = { runs: r, chars: r * 40, count: r * 4 };
            }
        }
        saveActivityData(mock);
        renderHeatmapWidget(container);
        showToast('🎉 成功生成 60 天刷题成就模拟数据！');
    });

    container.querySelector('#btn-heat-clear').addEventListener('click', () => {
        if (confirm('确定要清空打卡记录吗？')) {
            localStorage.removeItem(ACTIVITY_STORAGE_KEY);
            renderHeatmapWidget(container);
            showToast('🧹 已重置所有打卡数据');
        }
    });
}


    // --- 12. Sidebar Nav Item Injection ---
    function injectSidebarNavItem() {
        const nav = document.querySelector('nav');
        if (!nav) return;
        if (document.querySelector('.better-sidebar-nav-item')) return;

        const item = document.createElement('a');
        item.className = 'better-sidebar-nav-item';
        item.href = 'javascript:void(0)';
        item.innerHTML = `
            <span class="nav-icon" aria-hidden="true">✨</span>
            <span class="nav-copy">
                <strong>美化与个性化</strong>
                <small>壁纸 · 动效 · 音效 · 工具</small>
            </span>
        `;
        item.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleCustomizerModal();
        });
        nav.appendChild(item);
    }

    // --- 13. Floating Customizer Widget & 5-Tab Modal UI ---
    let modalEl = null;
    let btnEl = null;

    function toggleCustomizerModal(force) {
        if (!modalEl || !btnEl) return;
        const shouldOpen = force !== undefined ? force : !modalEl.classList.contains('active');
        if (shouldOpen) {
            modalEl.classList.remove('closing');
            modalEl.classList.add('active');
            btnEl.classList.add('open');
        } else {
            if (modalEl.classList.contains('active')) {
                modalEl.classList.add('closing');
                btnEl.classList.remove('open');
                setTimeout(() => {
                    modalEl.classList.remove('active');
                    modalEl.classList.remove('closing');
                }, 220);
            }
        }
    }

    function initCustomizerWidget() {
        const oldBtn = document.getElementById('better-customizer-btn');
        if (oldBtn) oldBtn.remove();
        const oldModal = document.getElementById('better-customizer-modal');
        if (oldModal) oldModal.remove();

        btnEl = document.createElement('div');
        btnEl.id = 'better-customizer-btn';
        btnEl.title = '点击打开 SQLTeacher 个性化美化与高效体验工坊';
        btnEl.innerHTML = `
            <span class="better-pill-icon">✨</span>
            <div class="better-rolling-text-box">
                <span class="better-text-layer l1">个性化美化</span>
                <span class="better-text-layer l2">体验工坊</span>
            </div>
        `;
        btnEl.addEventListener('click', () => toggleCustomizerModal());
        document.body.appendChild(btnEl);

        modalEl = document.createElement('div');
        modalEl.id = 'better-customizer-modal';
        modalEl.innerHTML = `
            <div class="better-modal-header">
                <div class="better-modal-title">
                    <span style="font-size: 20px;">✨</span>
                    <strong>SQLTeacher 个性化体验工坊</strong>
                </div>
                <button id="better-modal-close" class="better-close-btn" title="关闭">&times;</button>
            </div>

            <!-- Segmented 5 Tabs -->
            <div class="better-modal-tabs">
                <button class="better-tab-btn active" data-tab="tab-palette">🎨 调色板</button>
                <button class="better-tab-btn" data-tab="tab-wallpaper">🖼️ 动态壁纸</button>
                <button class="better-tab-btn" data-tab="tab-atmosphere">✨ 动效氛围</button>
                <button class="better-tab-btn" data-tab="tab-power">🔥 击键打击</button>
                <button class="better-tab-btn" data-tab="tab-tools">🛠️ 效率工具</button>
            </div>

            <!-- Tab Panels Scrollable Body -->
            <div class="better-modal-body">
                
                <!-- TAB 1: 调色板与主题配色 -->
                <div id="tab-palette" class="better-tab-panel active">
                    <div style="font-size: 12px; color: rgba(255,255,255,0.7); margin-bottom: 2px;">
                        选择设计师推荐主题色，全软件导航、高光、编辑器流光即刻变换：
                    </div>

                    <!-- 8 Preset Color Grid -->
                    <div class="better-palette-grid">
                        ${PALETTES.map(p => `
                            <div class="better-palette-chip ${CONFIG.accentColor.toLowerCase() === p.hex.toLowerCase() ? 'active' : ''}" data-hex="${p.hex}" data-rgb="${p.rgb}" data-dark="${p.dark}">
                                <div class="better-color-circle" style="background: ${p.hex};"></div>
                                <span class="better-palette-label">${p.name}</span>
                            </div>
                        `).join('')}
                    </div>

                    <!-- Custom Spectrum Color Picker -->
                    <div class="better-custom-color-box">
                        <div>
                            <span>自由拾色器 (全光谱任意选色)</span>
                            <div id="val-color-hex" style="font-size: 11px; color: var(--better-accent); font-family: monospace; margin-top: 2px;">
                                ${CONFIG.accentColor}
                            </div>
                        </div>
                        <input type="color" id="input-custom-color" value="${CONFIG.accentColor}">
                    </div>

                    <hr class="better-divider">

                    <!-- Sliders: Blur & Mask -->
                    <div class="better-control-group">
                        <label>
                            <span>毛玻璃磨砂模糊度</span>
                            <strong id="val-blur">${CONFIG.blurAmount}px</strong>
                        </label>
                        <input type="range" id="range-blur" min="0" max="40" value="${CONFIG.blurAmount}">
                    </div>

                    <div class="better-control-group">
                        <label>
                            <span>界面背景暗度蒙版</span>
                            <strong id="val-mask">${CONFIG.maskOpacity}%</strong>
                        </label>
                        <input type="range" id="range-mask" min="15" max="90" value="${CONFIG.maskOpacity}">
                    </div>
                </div>

                <!-- TAB 2: 自定义壁纸与画面滤镜 -->
                <div id="tab-wallpaper" class="better-tab-panel">
                    <div style="font-size: 12px; color: rgba(255,255,255,0.7);">
                        精选预设壁纸风格：
                    </div>

                    <!-- 3D Fan-Out Wallpaper Deck Gallery -->
                    <div class="better-fan-deck-wrapper">
                        <div class="better-fan-deck">
                            <div class="better-fan-card ${CONFIG.wallpaperType === 'anime' || !CONFIG.wallpaperType ? 'active' : ''}" data-wptype="anime" data-text="二次元动漫" style="--r: -9;" title="浪漫唯美二次元动漫壁纸">
                                <span class="better-fan-icon">🌸</span>
                                <span class="better-fan-tag">浪漫唯美</span>
                            </div>
                            <div class="better-fan-card ${CONFIG.wallpaperType === 'aurora' ? 'active' : ''}" data-wptype="aurora" data-text="极光夜空" style="--r: -3;" title="流光溢彩极光动态流光">
                                <span class="better-fan-icon">🌌</span>
                                <span class="better-fan-tag">动态流光</span>
                            </div>
                            <div class="better-fan-card ${CONFIG.wallpaperType === 'darkglass' ? 'active' : ''}" data-wptype="darkglass" data-text="黑曜纯净" style="--r: 3;" title="黑曜石深邃暗黑纯净磨砂">
                                <span class="better-fan-icon">💎</span>
                                <span class="better-fan-tag">深邃磨砂</span>
                            </div>
                            <div class="better-fan-card ${CONFIG.wallpaperType === 'custom' || CONFIG.wallpaperType === 'custom_video' ? 'active' : ''}" data-wptype="custom" data-text="动态视频" style="--r: 9;" title="导入本地 4K/超清视频与图片壁纸">
                                <span class="better-fan-icon">🎬</span>
                                <span class="better-fan-tag">本地4K</span>
                            </div>
                        </div>
                    </div>

                    <button id="btn-reset-anime-wp" class="better-secondary-btn" style="width: 100%; margin-top: 2px;">
                        ↺ 还原为默认二次元动漫壁纸
                    </button>

                    <!-- Local Media Upload (IndexedDB) -->
                    <div class="better-control-group">
                        <input type="file" id="input-wallpaper-file" accept="video/mp4,video/webm,image/*" style="display: none;">
                        <button id="btn-upload-wallpaper" class="better-action-btn">
                            🎬 从电脑导入动态视频 (MP4/WebM) 或图片...
                        </button>
                        <small style="display:block; margin-top:5px; color:rgba(255,255,255,0.5); font-size:11px;">
                            支持 4K/2K/高清 MP4、WebM 动态视频壁纸，及 PNG、JPG、WEBP、GIF 动图；已开启 IndexedDB 极速无上限持久化存储
                        </small>
                    </div>

                    <!-- Ken Burns Live Camera Motion Switch -->
                    <div class="better-toggle-row" style="margin-top: 10px; margin-bottom: 8px;">
                        <div class="better-toggle-info">
                            <span>🌊 静态壁纸「电影感呼吸运镜」</span>
                            <small>对静态动漫/二次元壁纸启用 28s 慢速景深推进与微漂移，宛如 Live Photo 呼吸流淌</small>
                        </div>
                        <label class="better-switch-label">
                            <input type="checkbox" id="toggle-wp-motion" ${CONFIG.wallpaperMotion !== false ? 'checked' : ''}>
                            <span class="better-switch-slider"></span>
                        </label>
                    </div>

                    <hr class="better-divider">

                    <!-- Filter Sliders: Brightness & Contrast -->
                    <div class="better-control-group">
                        <label style="display:flex; justify-content:space-between; align-items:center;">
                            <span>壁纸画面亮度</span>
                            <span style="display:inline-flex; align-items:center; gap:8px;">
                                <strong id="val-wp-brightness">${CONFIG.wallpaperBrightness || 100}%</strong>
                                <button type="button" id="btn-reset-wp-filters" class="better-secondary-btn" style="padding:2px 8px; font-size:11px; border-radius:6px; cursor:pointer;" title="重置亮度和对比度为 100%">↺ 恢复默认</button>
                            </span>
                        </label>
                        <input type="range" id="range-wp-brightness" min="15" max="200" step="1" value="${CONFIG.wallpaperBrightness || 100}">
                    </div>

                    <div class="better-control-group">
                        <label>
                            <span>壁纸对比度</span>
                            <strong id="val-wp-contrast">${CONFIG.wallpaperContrast || 100}%</strong>
                        </label>
                        <input type="range" id="range-wp-contrast" min="30" max="220" step="1" value="${CONFIG.wallpaperContrast || 100}">
                    </div>
                </div>

                <!-- TAB 3: 动效与氛围 -->
                <div id="tab-atmosphere" class="better-tab-panel">
                    <!-- Atmosphere Canvas Master Toggle -->
                    <div class="better-toggle-row">
                        <div class="better-toggle-info">
                            <span>🌌 全屏环境动态粒子画布</span>
                            <small>在磨砂玻璃背景后渲染动态流光视觉微粒</small>
                        </div>
                        <label class="better-switch-label">
                            <input type="checkbox" id="toggle-atmosphere" ${CONFIG.atmosphereEnabled ? 'checked' : ''}>
                            <span class="better-switch-slider"></span>
                        </label>
                    </div>

                    <!-- Atmosphere Mode Selector -->
                    <div id="atmosphere-options-box" style="display: ${CONFIG.atmosphereEnabled ? 'flex' : 'none'}; flex-direction: column; gap: 8px; padding-left: 12px; border-left: 2px solid var(--better-accent-glow); margin-bottom: 8px;">
                        <div style="font-size: 11.5px; color: #cbd5e1;">粒子主题风格:</div>
                        <div class="better-pill-select" id="pills-atmosphere-mode">
                            <button class="better-pill-option ${CONFIG.atmosphereMode === 'sakura' ? 'active' : ''}" data-mode="sakura">🌸 浪漫落樱</button>
                            <button class="better-pill-option ${CONFIG.atmosphereMode === 'rain' ? 'active' : ''}" data-mode="rain">🌧️ 雨夜流光</button>
                            <button class="better-pill-option ${CONFIG.atmosphereMode === 'snow' ? 'active' : ''}" data-mode="snow">❄️ 冰雪飞舞</button>
                            <button class="better-pill-option ${CONFIG.atmosphereMode === 'matrix' ? 'active' : ''}" data-mode="matrix">💻 代码雨</button>
                        </div>

                        <div class="better-control-group">
                            <label style="margin-bottom: 2px;">
                                <span style="font-size: 11.5px;">粒子数量与密度</span>
                                <strong id="val-atmos-density" style="font-size: 11.5px;">${CONFIG.atmosphereDensity || 35}</strong>
                            </label>
                            <input type="range" id="range-atmos-density" min="15" max="75" value="${CONFIG.atmosphereDensity || 35}">
                        </div>

                        <div class="better-control-group">
                            <label style="margin-bottom: 2px;">
                                <span style="font-size: 11.5px;">微粒飘落速度</span>
                                <strong id="val-atmos-speed" style="font-size: 11.5px;">${CONFIG.atmosphereSpeed || 1.0}x</strong>
                            </label>
                            <input type="range" id="range-atmos-speed" min="5" max="25" value="${Math.round((CONFIG.atmosphereSpeed || 1.0) * 10)}">
                        </div>
                    </div>

                    <hr class="better-divider">

                    <!-- Shooting Stars Toggle -->
                    <div class="better-toggle-row">
                        <div class="better-toggle-info">
                            <span>🌠 夜空流星划过特效</span>
                            <small>天空中随机划过绚丽极光流星轨迹</small>
                        </div>
                        <label class="better-switch-label">
                            <input type="checkbox" id="toggle-shooting-stars" ${CONFIG.shootingStarsEnabled ? 'checked' : ''}>
                            <span class="better-switch-slider"></span>
                        </label>
                    </div>

                    <!-- Cursor Trail Master Toggle -->
                    <div class="better-toggle-row">
                        <div class="better-toggle-info">
                            <span>✨ 鼠标跟随流星尾迹</span>
                            <small>鼠标滑过时留下梦幻微粒光痕</small>
                        </div>
                        <label class="better-switch-label">
                            <input type="checkbox" id="toggle-cursor-trail" ${CONFIG.cursorTrailEnabled ? 'checked' : ''}>
                            <span class="better-switch-slider"></span>
                        </label>
                    </div>

                    <!-- Cursor Trail Style Pills -->
                    <div id="cursor-options-box" style="display: ${CONFIG.cursorTrailEnabled ? 'flex' : 'none'}; flex-direction: column; gap: 6px; padding-left: 12px; border-left: 2px solid var(--better-accent-glow); margin-bottom: 8px;">
                        <div style="font-size: 11.5px; color: #cbd5e1;">尾迹流光样式:</div>
                        <div class="better-pill-select" id="pills-cursor-style">
                            <button class="better-pill-option ${CONFIG.cursorTrailStyle === 'stardust' ? 'active' : ''}" data-cstyle="stardust">✨ 碎钻星尘</button>
                            <button class="better-pill-option ${CONFIG.cursorTrailStyle === 'aurora' ? 'active' : ''}" data-cstyle="aurora">🌈 极光烟霞</button>
                            <button class="better-pill-option ${CONFIG.cursorTrailStyle === 'bubbles' ? 'active' : ''}" data-cstyle="bubbles">🫧 梦幻气泡</button>
                        </div>
                    </div>

                    <!-- Click Ripple Toggle -->
                    <div class="better-toggle-row">
                        <div class="better-toggle-info">
                            <span>🖱️ 鼠标点击极光水波</span>
                            <small>点击页面任意位置时产生扩散波纹</small>
                        </div>
                        <label class="better-switch-label">
                            <input type="checkbox" id="toggle-ripple" ${CONFIG.rippleEnabled ? 'checked' : ''}>
                            <span class="better-switch-slider"></span>
                        </label>
                    </div>
                </div>

                <!-- TAB 4: 击键打击感与音效 -->
                <div id="tab-power" class="better-tab-panel">
                    <!-- Power Mode Master Toggle -->
                    <div class="better-toggle-row">
                        <div class="better-toggle-info">
                            <span>🔥 Power Mode 击键连击系统</span>
                            <small>在代码编辑器中输入时产生爆裂光粒与连击计数</small>
                        </div>
                        <label class="better-switch-label">
                            <input type="checkbox" id="toggle-power-mode" ${CONFIG.powerModeEnabled ? 'checked' : ''}>
                            <span class="better-switch-slider"></span>
                        </label>
                    </div>

                    <!-- Power Mode Options Box -->
                    <div id="power-options-box" style="display: ${CONFIG.powerModeEnabled ? 'flex' : 'none'}; flex-direction: column; gap: 8px; padding-left: 12px; border-left: 2px solid var(--better-accent-glow); margin-bottom: 8px;">
                        <div style="font-size: 11.5px; color: #cbd5e1;">粒子飞溅风格:</div>
                        <div class="better-pill-select" id="pills-power-style">
                            <button class="better-pill-option ${CONFIG.powerModeStyle === 'sparks' ? 'active' : ''}" data-pstyle="sparks">💥 耀眼火花</button>
                            <button class="better-pill-option ${CONFIG.powerModeStyle === 'crystal' ? 'active' : ''}" data-pstyle="crystal">💎 水晶碎片</button>
                            <button class="better-pill-option ${CONFIG.powerModeStyle === 'sakura' ? 'active' : ''}" data-pstyle="sakura">🌸 飞花碎瓣</button>
                            <button class="better-pill-option ${CONFIG.powerModeStyle === 'neon' ? 'active' : ''}" data-pstyle="neon">⚡ 霓虹微粒</button>
                        </div>

                        <div style="display: flex; gap: 10px; margin-top: 4px;">
                            <label style="display: flex; align-items: center; gap: 6px; font-size: 11.5px; cursor: pointer; color: #e2e8f0;">
                                <input type="checkbox" id="toggle-power-combo" ${CONFIG.powerModeCombo ? 'checked' : ''}>
                                <span>连击数浮层 (COMBO!)</span>
                            </label>
                            <label style="display: flex; align-items: center; gap: 6px; font-size: 11.5px; cursor: pointer; color: #e2e8f0;">
                                <input type="checkbox" id="toggle-power-shake" ${CONFIG.powerModeShake ? 'checked' : ''}>
                                <span>屏幕微震打击感</span>
                            </label>
                        </div>
                    </div>

                    <hr class="better-divider">

                    <!-- Mechanical Keyboard Sound -->
                    <div class="better-toggle-row">
                        <div class="better-toggle-info">
                            <span>⌨️ 机械键盘敲击音效</span>
                            <small>原生 Web Audio 即时合成，极具敲代码解压感</small>
                        </div>
                        <label class="better-switch-label">
                            <input type="checkbox" id="toggle-sound" ${CONFIG.soundEnabled ? 'checked' : ''}>
                            <span class="better-switch-slider"></span>
                        </label>
                    </div>

                    <!-- Keyboard Sound Options Box -->
                    <div id="sound-options-box" style="display: ${CONFIG.soundEnabled ? 'flex' : 'none'}; flex-direction: column; gap: 8px; padding-left: 12px; border-left: 2px solid var(--better-accent-glow); margin-bottom: 8px;">
                        <div style="font-size: 11.5px; color: #cbd5e1;">机械轴体风格:</div>
                        <div class="better-pill-select" id="pills-sound-axis">
                            <button class="better-pill-option ${CONFIG.soundType === 'clicky' ? 'active' : ''}" data-axis="clicky">🔵 清脆青轴</button>
                            <button class="better-pill-option ${CONFIG.soundType === 'thock' ? 'active' : ''}" data-axis="thock">🟤 沉稳茶轴</button>
                            <button class="better-pill-option ${CONFIG.soundType === 'linear' ? 'active' : ''}" data-axis="linear">🔴 静音红轴</button>
                        </div>

                        <div class="better-control-group">
                            <label style="margin-bottom: 2px;">
                                <span style="font-size: 11.5px;">按键音量</span>
                                <strong id="val-sound-vol" style="font-size: 11.5px;">${Math.round((CONFIG.soundVolume || 0.6) * 100)}%</strong>
                            </label>
                            <input type="range" id="range-sound-vol" min="10" max="100" value="${Math.round((CONFIG.soundVolume || 0.6) * 100)}">
                        </div>

                        <button id="btn-test-sound" class="better-secondary-btn" style="align-self: flex-start; padding: 4px 10px; font-size: 11px;">
                            🔊 试听敲击声
                        </button>
                    </div>

                    <hr class="better-divider">

                    <!-- White Noise Synth -->
                    <div class="better-toggle-row">
                        <div class="better-toggle-info">
                            <span>🎧 沉浸式学习白噪音</span>
                            <small>纯本地音频合成，屏蔽外界干扰，助你高效专注</small>
                        </div>
                        <label class="better-switch-label">
                            <input type="checkbox" id="toggle-white-noise" ${CONFIG.whiteNoiseEnabled ? 'checked' : ''}>
                            <span class="better-switch-slider"></span>
                        </label>
                    </div>

                    <!-- White Noise Options Box -->
                    <div id="noise-options-box" style="display: ${CONFIG.whiteNoiseEnabled ? 'flex' : 'none'}; flex-direction: column; gap: 8px; padding-left: 12px; border-left: 2px solid var(--better-accent-glow); margin-bottom: 8px;">
                        <div style="font-size: 11.5px; color: #cbd5e1;">白噪音与伴奏情境:</div>
                        <div class="better-pill-select" id="pills-noise-type">
                            <button class="better-pill-option ${CONFIG.whiteNoiseType === 'rain' ? 'active' : ''}" data-ntype="rain">🌧️ 窗外雨声</button>
                            <button class="better-pill-option ${CONFIG.whiteNoiseType === 'fireplace' ? 'active' : ''}" data-ntype="fireplace">🔥 壁炉柴火</button>
                            <button class="better-pill-option ${CONFIG.whiteNoiseType === 'ocean' ? 'active' : ''}" data-ntype="ocean">🌊 潮汐海浪</button>
                            <button class="better-pill-option ${CONFIG.whiteNoiseType === 'cosmic' ? 'active' : ''}" data-ntype="cosmic">🌌 宇宙微光</button>
                            <button class="better-pill-option ${CONFIG.whiteNoiseType === 'custom' ? 'active' : ''}" data-ntype="custom">🎵 本地 MP3</button>
                        </div>

                        <!-- Local MP3 / Audio Upload Box -->
                        <div class="better-control-group" style="margin-top: 2px;">
                            <input type="file" id="input-custom-audio" accept="audio/*,.mp3,.wav,.flac,.ogg,.m4a,.aac" style="display: none;">
                            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 6px 10px; background: rgba(255, 255, 255, 0.04); border: 1px dashed rgba(255, 255, 255, 0.18); border-radius: 8px;">
                                <button type="button" id="btn-upload-audio" class="better-secondary-btn" style="padding: 4px 10px; font-size: 11px; display: inline-flex; align-items: center; gap: 5px;">
                                    <span>📁 导入本地 MP3 / 音乐...</span>
                                </button>
                                <span id="label-custom-audio-name" style="font-size: 11px; color: #cbd5e1; max-width: 170px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                    ${CONFIG.customAudioName || '未导入音频'}
                                </span>
                            </div>
                            <small style="display:block; margin-top:4px; color:rgba(255,255,255,0.45); font-size:11px;">
                                支持 MP3、WAV、FLAC、M4A 学习音乐/白噪音，已开启 IndexedDB 离线永久存储，循环平滑播放
                            </small>
                        </div>

                        <div class="better-control-group">
                            <label style="margin-bottom: 2px;">
                                <span style="font-size: 11.5px;">播放音量</span>
                                <strong id="val-noise-vol" style="font-size: 11.5px;">${Math.round((CONFIG.whiteNoiseVolume || 0.4) * 100)}%</strong>
                            </label>
                            <input type="range" id="range-noise-vol" min="10" max="100" value="${Math.round((CONFIG.whiteNoiseVolume || 0.4) * 100)}">
                        </div>
                    </div>

                    <hr class="better-divider">

                    <!-- Monaco Editor Glow Toggle -->
                    <div class="better-toggle-row">
                        <div class="better-toggle-info">
                            <span>⚡ SQL 编辑器呼吸霓虹边框</span>
                            <small>为代码区域添加主题色呼吸极光微光</small>
                        </div>
                        <label class="better-switch-label">
                            <input type="checkbox" id="toggle-neon" ${CONFIG.neonEnabled ? 'checked' : ''}>
                            <span class="better-switch-slider"></span>
                        </label>
                    </div>
                </div>

                <!-- TAB 5: 效率与工具 -->
                <div id="tab-tools" class="better-tab-panel">
                    <!-- Pomodoro Timer Master Toggle -->
                    <div class="better-toggle-row">
                        <div class="better-toggle-info">
                            <span>🍅 顶部毛玻璃番茄专注钟</span>
                            <small>极简浮动番茄钟，支持工作与休息切换及清脆提示音</small>
                        </div>
                        <label class="better-switch-label">
                            <input type="checkbox" id="toggle-pomodoro" ${CONFIG.pomodoroEnabled ? 'checked' : ''}>
                            <span class="better-switch-slider"></span>
                        </label>
                    </div>

                    <!-- Pomodoro Options Box -->
                    <div id="pomo-options-box" style="display: ${CONFIG.pomodoroEnabled ? 'flex' : 'none'}; flex-direction: column; gap: 8px; padding-left: 12px; border-left: 2px solid var(--better-accent-glow); margin-bottom: 8px;">
                        <div style="font-size: 11.5px; color: #cbd5e1;">专注时长设定:</div>
                        <div class="better-pill-select" id="pills-pomo-time">
                            <button class="better-pill-option ${CONFIG.pomodoroTime === 15 ? 'active' : ''}" data-ptime="15">15 分钟</button>
                            <button class="better-pill-option ${CONFIG.pomodoroTime === 25 ? 'active' : ''}" data-ptime="25">25 分钟 (标准)</button>
                            <button class="better-pill-option ${CONFIG.pomodoroTime === 45 ? 'active' : ''}" data-ptime="45">45 分钟</button>
                            <button class="better-pill-option ${CONFIG.pomodoroTime === 60 ? 'active' : ''}" data-ptime="60">60 分钟</button>
                        </div>
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 4px; padding-top: 6px; border-top: 1px dashed rgba(255, 255, 255, 0.1);">
                            <span style="font-size: 11px; color: #94a3b8;">📍 位置调整: 支持按住胶囊随心拖动</span>
                            <button id="btn-reset-pomo-pos" class="better-secondary-btn" style="padding: 3px 8px; font-size: 11px;">
                                ↺ 恢复默认位置
                            </button>
                        </div>
                    </div>

                    <hr class="better-divider">

                    <!-- SQL Cheat Sheet Master Toggle -->
                    <div class="better-toggle-row">
                        <div class="better-toggle-info">
                            <span>📖 SQL 语法速查宝典</span>
                            <small>涵盖 14+ 核心语法、常用函数与窗口函数，一键复制代码</small>
                        </div>
                        <button id="btn-open-cheatsheet-now" class="better-secondary-btn" style="padding: 4px 10px; font-size: 11.5px;">
                            打开宝典
                        </button>
                    </div>

                    <!-- Editor Toolbar Master Toggle -->
                    <div class="better-toggle-row">
                        <div class="better-toggle-info">
                            <span>⚡ SQL 编辑器上方快捷工具栏</span>
                            <small>一键关键字大写、换行排版、复制代码与清空</small>
                        </div>
                        <label class="better-switch-label">
                            <input type="checkbox" id="toggle-editor-toolbar" ${CONFIG.editorToolbarEnabled ? 'checked' : ''}>
                            <span class="better-switch-slider"></span>
                        </label>
                    </div>

                    <!-- Font Ligatures Toggle -->
                    <div class="better-toggle-row">
                        <div class="better-toggle-info">
                            <span>🔤 JetBrains Mono 编程连字特性</span>
                            <small>连字字符 (如 &lt;=, !=, ==) 增强代码可读性</small>
                        </div>
                        <label class="better-switch-label">
                            <input type="checkbox" id="toggle-ligature" ${CONFIG.ligatureEnabled !== false ? 'checked' : ''}>
                            <span class="better-switch-slider"></span>
                        </label>
                    </div>

                    <hr class="better-divider">

                    <!-- SQL Visualizer Section -->
                    <div class="better-toggle-row">
                        <div class="better-toggle-info">
                            <span>🧩 SQL 底层执行逻辑流水线</span>
                            <small>直观拆解 FROM ➔ WHERE ➔ GROUP BY ➔ LIMIT 真实生命周期</small>
                        </div>
                        <button id="btn-open-visualizer-now" class="better-secondary-btn" style="padding: 4px 10px; font-size: 11.5px;">
                            打开全景图
                        </button>
                    </div>

                    <!-- Ray.so Snap Card Section -->
                    <div class="better-toggle-row">
                        <div class="better-toggle-info">
                            <span>📸 Ray.so 风格代码打卡美化卡片</span>
                            <small>macOS 质感卡片、7 款发光背景，一键复制到剪贴板或保存</small>
                        </div>
                        <button id="btn-open-snap-now" class="better-secondary-btn" style="padding: 4px 10px; font-size: 11.5px;">
                            生成打卡图
                        </button>
                    </div>

                    <hr class="better-divider">

                    <!-- Activity Heatmap Section -->
                    <div class="better-toggle-row">
                        <div class="better-toggle-info">
                            <span>📅 每日刷题热力绿格子打卡墙</span>
                            <small>记录每日学习活跃度，统计最长连续坚持天数与查询次数</small>
                        </div>
                        <label class="better-switch-label">
                            <input type="checkbox" id="toggle-heatmap" ${CONFIG.heatmapEnabled ? 'checked' : ''}>
                            <span class="better-switch-slider"></span>
                        </label>
                    </div>
                    <div id="heatmap-panel-box" style="display: ${CONFIG.heatmapEnabled ? 'block' : 'none'}; margin-top: 6px;">
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                            <span style="font-size: 11.5px; color: #cbd5e1;">打卡墙主题色彩:</span>
                            <div class="better-pill-select" id="pills-heat-theme">
                                <button class="better-pill-option ${CONFIG.heatmapTheme === 'github' ? 'active' : ''}" data-htheme="github">经典翠绿</button>
                                <button class="better-pill-option ${CONFIG.heatmapTheme === 'neon' ? 'active' : ''}" data-htheme="neon">赛博霓虹</button>
                                <button class="better-pill-option ${CONFIG.heatmapTheme === 'bilibili' ? 'active' : ''}" data-htheme="bilibili">B站粉</button>
                                <button class="better-pill-option ${CONFIG.heatmapTheme === 'ocean' ? 'active' : ''}" data-htheme="ocean">极地蓝</button>
                            </div>
                        </div>
                        <div id="better-heatmap-slot"></div>
                    </div>
                </div>

            </div>
        `;
        document.body.appendChild(modalEl);

        // --- Event Handlers for Customizer ---
        modalEl.querySelector('#better-modal-close').addEventListener('click', () => {
            toggleCustomizerModal(false);
        });

        // Tab Switching
        const tabBtns = modalEl.querySelectorAll('.better-tab-btn');
        const tabPanels = modalEl.querySelectorAll('.better-tab-panel');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                tabPanels.forEach(p => p.classList.remove('active'));
                btn.classList.add('active');
                const target = modalEl.querySelector(`#${btn.dataset.tab}`);
                if (target) target.classList.add('active');
            });
        });

        // TAB 1: Palette
        const paletteChips = modalEl.querySelectorAll('.better-palette-chip');
        paletteChips.forEach(chip => {
            chip.addEventListener('click', () => {
                paletteChips.forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                CONFIG.accentColor = chip.dataset.hex;
                CONFIG.accentRgb = chip.dataset.rgb;
                CONFIG.accentDark = chip.dataset.dark;
                modalEl.querySelector('#val-color-hex').textContent = chip.dataset.hex;
                modalEl.querySelector('#input-custom-color').value = chip.dataset.hex;
                saveConfig();
            });
        });

        const colorInput = modalEl.querySelector('#input-custom-color');
        colorInput.addEventListener('input', (e) => {
            const hex = e.target.value;
            const rgbObj = hexToRgb(hex);
            CONFIG.accentColor = hex;
            CONFIG.accentRgb = `${rgbObj.r}, ${rgbObj.g}, ${rgbObj.b}`;
            CONFIG.accentDark = hexToDark(hex);
            modalEl.querySelector('#val-color-hex').textContent = hex;
            paletteChips.forEach(c => c.classList.remove('active'));
            saveConfig();
        });

        const rangeBlur = modalEl.querySelector('#range-blur');
        rangeBlur.addEventListener('input', (e) => {
            CONFIG.blurAmount = parseInt(e.target.value);
            modalEl.querySelector('#val-blur').textContent = `${CONFIG.blurAmount}px`;
            saveConfig();
        });

        const rangeMask = modalEl.querySelector('#range-mask');
        rangeMask.addEventListener('input', (e) => {
            CONFIG.maskOpacity = parseInt(e.target.value);
            modalEl.querySelector('#val-mask').textContent = `${CONFIG.maskOpacity}%`;
            saveConfig();
        });

        // TAB 2: Wallpaper
        const wpCards = modalEl.querySelectorAll('.better-wp-card, .better-fan-card');
        wpCards.forEach(card => {
            card.addEventListener('click', async () => {
                wpCards.forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                
                const wptype = card.dataset.wptype;
                const videoEl = document.getElementById('better-wallpaper-video');
                
                if (wptype === 'custom') {
                    // Check if IndexedDB has a saved custom video or image
                    const dbRec = await getWallpaperFromDB();
                    if (dbRec && (dbRec.type === 'video' || (dbRec.name && /\.(mp4|webm|mkv|mov)$/i.test(dbRec.name)))) {
                        CONFIG.wallpaperType = 'custom_video';
                        CONFIG.customWallpaperRecord = dbRec;
                    } else if (dbRec) {
                        CONFIG.wallpaperType = 'custom';
                        CONFIG.customWallpaperRecord = dbRec;
                    } else {
                        // Open file picker if nothing in DB
                        fileInput.click();
                        return;
                    }
                } else {
                    CONFIG.wallpaperType = wptype;
                    if (videoEl) {
                        videoEl.pause();
                        videoEl.classList.remove('active');
                        videoEl.style.display = 'none';
                    }
                    document.body.classList.remove('better-video-active');
                }
                
                saveConfig();
                const cardName = card.getAttribute('data-text') || (card.querySelector('.better-fan-tag') ? card.querySelector('.better-fan-tag').textContent : wptype);
                showToast(`🖼️ 已切换壁纸: ${cardName}`);
            });
        });

        const resetAnimeBtn = modalEl.querySelector('#btn-reset-anime-wp');
        if (resetAnimeBtn) {
            resetAnimeBtn.addEventListener('click', () => {
                CONFIG.wallpaperType = 'anime';
                wpCards.forEach(c => {
                    if (c.dataset.wptype === 'anime') c.classList.add('active');
                    else c.classList.remove('active');
                });
                const videoEl = document.getElementById('better-wallpaper-video');
                if (videoEl) {
                    videoEl.pause();
                    videoEl.src = '';
                    videoEl.classList.remove('active');
                }
                saveConfig();
                showToast('🌸 已还原为动漫专属壁纸');
            });
        }

        const fileInput = modalEl.querySelector('#input-wallpaper-file');
        const uploadBtn = modalEl.querySelector('#btn-upload-wallpaper');
        uploadBtn.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mkv|mov)$/i.test(file.name);

            if (isVideo) {
                uploadBtn.textContent = `⏳ 正在加载动态视频 (${(file.size / 1024 / 1024).toFixed(1)}MB)...`;
                try {
                    await saveWallpaperToDB({ type: 'video', data: file, name: file.name });
                    CONFIG.wallpaperType = 'custom_video';
                    CONFIG.customWallpaperRecord = { type: 'video', data: file, name: file.name };
                    saveConfig();
                    wpCards.forEach(c => c.classList.remove('active'));
                    uploadBtn.textContent = '✅ 动态视频壁纸已激活';
                    showToast(`🎬 动态视频壁纸已启用: ${file.name}`);
                } catch(err) {
                    console.error(err);
                    showToast('❌ 视频加载失败，请重试');
                }
                setTimeout(() => {
                    uploadBtn.textContent = '🎬 从电脑导入动态视频 (MP4/WebM) 或图片...';
                }, 2500);
            } else {
                uploadBtn.textContent = '⏳ 壁纸处理中...';
                const reader = new FileReader();
                reader.onload = async function(evt) {
                    const b64 = evt.target.result;
                    await saveWallpaperToDB({ type: 'image', data: b64, name: file.name });
                    CONFIG.wallpaperType = 'custom';
                    CONFIG.customWallpaperData = b64;
                    saveConfig();
                    wpCards.forEach(c => c.classList.remove('active'));
                    uploadBtn.textContent = '✅ 已成功保存自定义壁纸';
                    showToast(`🖼️ 自定义壁纸已持久化: ${file.name}`);
                    setTimeout(() => {
                        uploadBtn.textContent = '🎬 从电脑导入动态视频 (MP4/WebM) 或图片...';
                    }, 2500);
                };
                reader.readAsDataURL(file);
            }
        });

        const toggleMotion = modalEl.querySelector('#toggle-wp-motion');
        if (toggleMotion) {
            toggleMotion.addEventListener('change', (e) => {
                CONFIG.wallpaperMotion = e.target.checked;
                saveConfig();
                showToast(CONFIG.wallpaperMotion ? '🌊 已开启静态壁纸电影感呼吸运镜' : '⏸️ 已关闭呼吸运镜');
            });
        }

        const rangeWpBri = modalEl.querySelector('#range-wp-brightness');
        rangeWpBri.addEventListener('input', (e) => {
            CONFIG.wallpaperBrightness = parseInt(e.target.value);
            modalEl.querySelector('#val-wp-brightness').textContent = `${CONFIG.wallpaperBrightness}%`;
            updateWallpaperFilter();
        });
        rangeWpBri.addEventListener('change', () => {
            saveConfig();
        });

        const rangeWpCon = modalEl.querySelector('#range-wp-contrast');
        rangeWpCon.addEventListener('input', (e) => {
            CONFIG.wallpaperContrast = parseInt(e.target.value);
            modalEl.querySelector('#val-wp-contrast').textContent = `${CONFIG.wallpaperContrast}%`;
            updateWallpaperFilter();
        });
        rangeWpCon.addEventListener('change', () => {
            saveConfig();
        });

        const btnResetWp = modalEl.querySelector('#btn-reset-wp-filters');
        if (btnResetWp) {
            btnResetWp.addEventListener('click', () => {
                CONFIG.wallpaperBrightness = 100;
                CONFIG.wallpaperContrast = 100;
                rangeWpBri.value = 100;
                rangeWpCon.value = 100;
                modalEl.querySelector('#val-wp-brightness').textContent = '100%';
                modalEl.querySelector('#val-wp-contrast').textContent = '100%';
                updateWallpaperFilter();
                saveConfig();
                showToast('已重置壁纸亮度与对比度为 100%');
            });
        }

        // TAB 3: Atmosphere
        const toggleAtmos = modalEl.querySelector('#toggle-atmosphere');
        const atmosBox = modalEl.querySelector('#atmosphere-options-box');
        toggleAtmos.addEventListener('change', (e) => {
            CONFIG.atmosphereEnabled = e.target.checked;
            atmosBox.style.display = CONFIG.atmosphereEnabled ? 'flex' : 'none';
            saveConfig();
        });

        const atmosModeBtns = modalEl.querySelectorAll('#pills-atmosphere-mode .better-pill-option');
        atmosModeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                atmosModeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                CONFIG.atmosphereMode = btn.dataset.mode;
                saveConfig();
                if (window.__better_reset_atmosphere__) window.__better_reset_atmosphere__();
            });
        });

        const rangeAtmosDen = modalEl.querySelector('#range-atmos-density');
        rangeAtmosDen.addEventListener('input', (e) => {
            CONFIG.atmosphereDensity = parseInt(e.target.value);
            modalEl.querySelector('#val-atmos-density').textContent = CONFIG.atmosphereDensity;
            saveConfig();
            if (window.__better_reset_atmosphere__) window.__better_reset_atmosphere__();
        });

        const rangeAtmosSpd = modalEl.querySelector('#range-atmos-speed');
        rangeAtmosSpd.addEventListener('input', (e) => {
            CONFIG.atmosphereSpeed = parseFloat(e.target.value) / 10;
            modalEl.querySelector('#val-atmos-speed').textContent = `${CONFIG.atmosphereSpeed}x`;
            saveConfig();
        });

        modalEl.querySelector('#toggle-shooting-stars').addEventListener('change', (e) => {
            CONFIG.shootingStarsEnabled = e.target.checked;
            saveConfig();
        });

        const toggleCursor = modalEl.querySelector('#toggle-cursor-trail');
        const cursorBox = modalEl.querySelector('#cursor-options-box');
        toggleCursor.addEventListener('change', (e) => {
            CONFIG.cursorTrailEnabled = e.target.checked;
            cursorBox.style.display = CONFIG.cursorTrailEnabled ? 'flex' : 'none';
            saveConfig();
        });

        const cursorStyleBtns = modalEl.querySelectorAll('#pills-cursor-style .better-pill-option');
        cursorStyleBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                cursorStyleBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                CONFIG.cursorTrailStyle = btn.dataset.cstyle;
                saveConfig();
            });
        });

        modalEl.querySelector('#toggle-ripple').addEventListener('change', (e) => {
            CONFIG.rippleEnabled = e.target.checked;
            saveConfig();
        });

        // TAB 4: Power Mode & Audio
        const togglePower = modalEl.querySelector('#toggle-power-mode');
        const powerBox = modalEl.querySelector('#power-options-box');
        togglePower.addEventListener('change', (e) => {
            CONFIG.powerModeEnabled = e.target.checked;
            powerBox.style.display = CONFIG.powerModeEnabled ? 'flex' : 'none';
            saveConfig();
        });

        const powerStyleBtns = modalEl.querySelectorAll('#pills-power-style .better-pill-option');
        powerStyleBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                powerStyleBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                CONFIG.powerModeStyle = btn.dataset.pstyle;
                saveConfig();
            });
        });

        modalEl.querySelector('#toggle-power-combo').addEventListener('change', (e) => {
            CONFIG.powerModeCombo = e.target.checked;
            saveConfig();
        });

        modalEl.querySelector('#toggle-power-shake').addEventListener('change', (e) => {
            CONFIG.powerModeShake = e.target.checked;
            saveConfig();
        });

        const toggleSound = modalEl.querySelector('#toggle-sound');
        const soundBox = modalEl.querySelector('#sound-options-box');
        toggleSound.addEventListener('change', (e) => {
            CONFIG.soundEnabled = e.target.checked;
            soundBox.style.display = CONFIG.soundEnabled ? 'flex' : 'none';
            saveConfig();
            if (CONFIG.soundEnabled) playKeyboardSound('Enter');
        });

        const soundAxisBtns = modalEl.querySelectorAll('#pills-sound-axis .better-pill-option');
        soundAxisBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                soundAxisBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                CONFIG.soundType = btn.dataset.axis;
                saveConfig();
                playKeyboardSound('Enter');
            });
        });

        const rangeSoundVol = modalEl.querySelector('#range-sound-vol');
        rangeSoundVol.addEventListener('input', (e) => {
            CONFIG.soundVolume = parseInt(e.target.value) / 100;
            modalEl.querySelector('#val-sound-vol').textContent = `${e.target.value}%`;
            saveConfig();
        });

        modalEl.querySelector('#btn-test-sound').addEventListener('click', () => {
            playKeyboardSound('Enter');
        });

        const toggleNoise = modalEl.querySelector('#toggle-white-noise');
        const noiseBox = modalEl.querySelector('#noise-options-box');
        toggleNoise.addEventListener('change', (e) => {
            CONFIG.whiteNoiseEnabled = e.target.checked;
            noiseBox.style.display = CONFIG.whiteNoiseEnabled ? 'flex' : 'none';
            saveConfig();
            updateWhiteNoiseState();
        });

        const noiseTypeBtns = modalEl.querySelectorAll('#pills-noise-type .better-pill-option');
        const btnUploadAudio = modalEl.querySelector('#btn-upload-audio');
        const inputCustomAudio = modalEl.querySelector('#input-custom-audio');
        const labelCustomAudioName = modalEl.querySelector('#label-custom-audio-name');

        if (btnUploadAudio && inputCustomAudio) {
            btnUploadAudio.addEventListener('click', () => {
                inputCustomAudio.click();
            });

            inputCustomAudio.addEventListener('change', async (e) => {
                const file = e.target.files && e.target.files[0];
                if (!file) return;

                const rec = {
                    name: file.name,
                    size: file.size,
                    type: file.type || 'audio/mp3',
                    data: file
                };
                await saveCustomAudioToDB(rec);
                CONFIG.customAudioRecord = rec;
                CONFIG.customAudioName = file.name;
                CONFIG.whiteNoiseType = 'custom';
                CONFIG.whiteNoiseEnabled = true;

                if (labelCustomAudioName) labelCustomAudioName.textContent = file.name;
                toggleNoise.checked = true;
                noiseBox.style.display = 'flex';

                noiseTypeBtns.forEach(b => {
                    b.classList.toggle('active', b.dataset.ntype === 'custom');
                });

                saveConfig();
                updateWhiteNoiseState();
                showToast(`🎵 已加载本地音频: ${file.name}`);
            });
        }

        noiseTypeBtns.forEach(btn => {
            btn.addEventListener('click', async () => {
                const ntype = btn.dataset.ntype;
                if (ntype === 'custom') {
                    let rec = CONFIG.customAudioRecord || await getCustomAudioFromDB();
                    if (!rec || !rec.data) {
                        if (inputCustomAudio) inputCustomAudio.click();
                        return;
                    }
                    CONFIG.customAudioRecord = rec;
                    CONFIG.whiteNoiseType = 'custom';
                } else {
                    CONFIG.whiteNoiseType = ntype;
                }

                noiseTypeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                saveConfig();
                if (CONFIG.whiteNoiseEnabled) updateWhiteNoiseState();
                const typeNames = {
                    rain: '🌧️ 窗外雨声',
                    fireplace: '🔥 壁炉柴火',
                    ocean: '🌊 潮汐海浪',
                    cosmic: '🌌 宇宙微光',
                    custom: `🎵 本地音频 (${CONFIG.customAudioName || '已载入'})`
                };
                showToast(`🎧 已切换音效: ${typeNames[CONFIG.whiteNoiseType] || CONFIG.whiteNoiseType}`);
            });
        });

        const rangeNoiseVol = modalEl.querySelector('#range-noise-vol');
        rangeNoiseVol.addEventListener('input', (e) => {
            CONFIG.whiteNoiseVolume = parseInt(e.target.value) / 100;
            modalEl.querySelector('#val-noise-vol').textContent = `${e.target.value}%`;
            saveConfig();
            if (whiteNoiseGain && audioCtx) {
                whiteNoiseGain.gain.setValueAtTime(CONFIG.whiteNoiseVolume * 0.3, audioCtx.currentTime);
            }
            const audioEl = document.getElementById('better-custom-audio');
            if (audioEl) {
                audioEl.volume = Math.max(0, Math.min(1, CONFIG.whiteNoiseVolume));
            }
        });

        modalEl.querySelector('#toggle-neon').addEventListener('change', (e) => {
            CONFIG.neonEnabled = e.target.checked;
            saveConfig();
        });

        // TAB 5: Tools & Efficiency
        const togglePomo = modalEl.querySelector('#toggle-pomodoro');
        const pomoBox = modalEl.querySelector('#pomo-options-box');
        togglePomo.addEventListener('change', (e) => {
            CONFIG.pomodoroEnabled = e.target.checked;
            pomoBox.style.display = CONFIG.pomodoroEnabled ? 'flex' : 'none';
            saveConfig();
        });

        const pomoTimeBtns = modalEl.querySelectorAll('#pills-pomo-time .better-pill-option');
        pomoTimeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                pomoTimeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                CONFIG.pomodoroTime = parseInt(btn.dataset.ptime);
                saveConfig();
                pomoSecondsLeft = CONFIG.pomodoroTime * 60;
                const timeEl = document.getElementById('better-pomo-time');
                if (timeEl) timeEl.textContent = `${CONFIG.pomodoroTime.toString().padStart(2, '0')}:00`;
                showToast(`🍅 番茄专注时长已设为 ${CONFIG.pomodoroTime} 分钟`);
            });
        });

        const resetPosBtn = modalEl.querySelector('#btn-reset-pomo-pos');
        if (resetPosBtn) {
            resetPosBtn.addEventListener('click', () => {
                CONFIG.pomodoroPos = null;
                saveConfig();
                showToast('📍 番茄钟已恢复默认顶部位置');
            });
        }

        modalEl.querySelector('#btn-open-cheatsheet-now').addEventListener('click', () => {
            toggleCheatSheetModal(true);
        });

        modalEl.querySelector('#toggle-editor-toolbar').addEventListener('change', (e) => {
            CONFIG.editorToolbarEnabled = e.target.checked;
            saveConfig();
            const tb = document.querySelector('.better-editor-toolbar');
            if (tb) tb.style.display = CONFIG.editorToolbarEnabled ? 'flex' : 'none';
        });

        modalEl.querySelector('#toggle-ligature').addEventListener('change', (e) => {
            CONFIG.ligatureEnabled = e.target.checked;
            saveConfig();
        });

        // Open Visualizer & Snap from Modal
        const btnOpenVis = modalEl.querySelector('#btn-open-visualizer-now');
        if (btnOpenVis) {
            btnOpenVis.addEventListener('click', () => {
                toggleCustomizerModal(false);
                setTimeout(() => toggleVisualizerModal(true), 200);
            });
        }
        const btnOpenSnap = modalEl.querySelector('#btn-open-snap-now');
        if (btnOpenSnap) {
            btnOpenSnap.addEventListener('click', () => {
                toggleCustomizerModal(false);
                setTimeout(() => toggleSnapModal(true), 200);
            });
        }

        // Heatmap Toggle & Themes
        const toggleHeatmap = modalEl.querySelector('#toggle-heatmap');
        const heatBox = modalEl.querySelector('#heatmap-panel-box');
        const heatSlot = modalEl.querySelector('#better-heatmap-slot');
        if (toggleHeatmap && heatBox) {
            toggleHeatmap.addEventListener('change', (e) => {
                CONFIG.heatmapEnabled = e.target.checked;
                heatBox.style.display = CONFIG.heatmapEnabled ? 'block' : 'none';
                saveConfig();
                if (CONFIG.heatmapEnabled && heatSlot) {
                    renderHeatmapWidget(heatSlot);
                }
            });
        }

        const heatThemeBtns = modalEl.querySelectorAll('#pills-heat-theme .better-pill-option');
        heatThemeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                heatThemeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                CONFIG.heatmapTheme = btn.dataset.htheme;
                saveConfig();
                if (heatSlot) renderHeatmapWidget(heatSlot);
                showToast(`🎨 打卡墙主题已切换为 ${btn.textContent}`);
            });
        });

        // Render initial heatmap in Tab 5 if active or slotted
        if (heatSlot && CONFIG.heatmapEnabled) {
            renderHeatmapWidget(heatSlot);
        }

    }

    // --- 14. Mutation Observer for Dynamic SPA Injection ---
    let appObserver = null;
    let observerDebounceTimer = null;
    function setupAppObserver() {
        if (appObserver) appObserver.disconnect();
        appObserver = new MutationObserver((mutations) => {
            // Filter out our own visual particle / canvas / toolbar mutations
            let hasExternalDomChange = false;
            for (const m of mutations) {
                if (m.addedNodes && m.addedNodes.length > 0) {
                    for (const node of m.addedNodes) {
                        if (node.nodeType === 1) {
                            const c = node.className || '';
                            if (typeof c === 'string' && (c.includes('better-') || c.includes('cursor') || c.includes('particle'))) {
                                continue;
                            }
                            hasExternalDomChange = true;
                            break;
                        }
                    }
                }
                if (hasExternalDomChange) break;
            }

            if (!hasExternalDomChange) return;

            if (observerDebounceTimer) return;
            observerDebounceTimer = setTimeout(() => {
                observerDebounceTimer = null;
                injectSidebarNavItem();
                injectEditorToolbar();
            }, 100);
        });
        appObserver.observe(document.body, { childList: true, subtree: true });

        // Route change detection for fast SPA navigation
        window.addEventListener('hashchange', () => {
            setTimeout(() => {
                injectSidebarNavItem();
                injectEditorToolbar();
            }, 60);
        });
    }


    // Expose control hooks to window for hotkeys & external triggers
    window.__better_toggle_visualizer__ = toggleVisualizerModal;
    window.__better_toggle_snap__ = toggleSnapModal;
    window.__better_toggle_customizer__ = toggleCustomizerModal;
    window.__better_render_heatmap__ = renderHeatmapWidget;

    // --- 15. Teardown Hook ---
    window.__better_teardown__ = function() {
        window.removeEventListener('keydown', keydownHandler, true);
        window.removeEventListener('pointerdown', pointerdownHandler);
        window.removeEventListener('pointermove', pointerMoveHandler);
        if (atmosphereAnimId) cancelAnimationFrame(atmosphereAnimId);
        if (appObserver) appObserver.disconnect();
        const oldToolbars = document.querySelectorAll('.better-editor-toolbar');
        oldToolbars.forEach(t => t.remove());
        stopWhiteNoise();
        clearInterval(pomoTimer);
    };

    // --- 16. Initialize Everything ---
    function init() {
        initAtmosphere();
        initComboBadge();
        initPomodoroWidget();
        initCheatSheetModal();
        initSqlVisualizer();
        initCardSnapGenerator();
        initCustomizerWidget();
        injectSidebarNavItem();
        injectEditorToolbar();
        setupAppObserver();
        applyConfig();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
