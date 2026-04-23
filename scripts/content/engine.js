/**
 * Doomscroll Bot Orchestrator v2.2.4 (Full Triple-Thread Wipe Support)
 */
class DoomscrollEngine {
    constructor() {
        this.dataCenter = new IGDataCenter();
        this.instructor = new IGInstructor(this.dataCenter);
        this.observer = new IGObserver(this.dataCenter, this.instructor);
        this.instructor.setObserver(this.observer);
        this.init();
    }

    async init() {
        if (this.dataCenter) await this.dataCenter.load();
        this.initGlobalAPI();
        this.injectBridge();
        if (this.observer) this.observer.start();
    }

    injectBridge() {
        const s = document.createElement('script');
        s.src = chrome.runtime.getURL('scripts/content/bridge.js');
        (document.head || document.documentElement).appendChild(s);
        s.onload = () => s.remove();
    }

    /**
     * สั่งล้างข้อมูลทุกหน่วยงาน (Wipe Command)
     */
    async fullWipe() {
        console.log("[Engine] Initiating Full Wipe...");
        if (this.instructor) this.instructor.wipe(); // 1. ล้างคิวและหยุด Bot
        if (this.observer) this.observer.wipe();     // 2. ล้างประวัติการสแกนหน้าจอ
        if (this.dataCenter) await this.dataCenter.wipe(); // 3. ล้าง RAM และ Disk
        console.log("[Engine] Bot reset to factory state.");
    }

    initGlobalAPI() {
        window.doomAPI = {
            posts: () => this.dataCenter ? Array.from(this.dataCenter.posts.values()) : [],
            users: async () => (await chrome.storage.local.get(['all_user'])).all_user || [],
            hashtag: async () => (await chrome.storage.local.get(['all_hashtag'])).all_hashtag || [],
            found: async () => await chrome.storage.local.get(['all_user', 'all_hashtag', 'all_posts']),
            queue: () => this.instructor ? this.instructor.queue : [],
            state: () => ({ 
                running: this.instructor?.running || false, 
                stats: this.instructor?.stats || {}, 
                queue_size: this.instructor?.queue.length || 0 
            }),
            target: () => this.instructor?.currentTarget,
            config: () => ({ 
                actions: this.instructor?.currentActions, 
                filters: this.instructor?.filters,
                settings: this.instructor?.settings 
            }),
            start: (a, f, s) => this.instructor?.start(a, f, s),
            stop: () => this.instructor?.stop(),
            sync: async () => { if(this.dataCenter) await this.dataCenter.sync(); return "Data Center Synced."; },
            stackTrace: () => this.dataCenter?.errorStack || [],
            health: () => {
                const selectors = {
                    tiles: 'a[href*="/p/"], a[href*="/reel/"]',
                    closeBtn: 'svg[aria-label="Close"], svg[aria-label="ปิด"]',
                    article: 'article[role="presentation"], article',
                    postOwner: 'header a[href^="/"][role="link"]',
                    caption: 'article div[dir="auto"] > span'
                };
                const results = {};
                for (const [key, sel] of Object.entries(selectors)) {
                    results[key] = { found: !!document.querySelector(sel), count: document.querySelectorAll(sel).length };
                }
                return results;
            },
            export: async () => {
                const storageData = await chrome.storage.local.get(null);
                const snapshot = {
                    metadata: { project: "Doomscroll Bot", version: "2.2.4", time: new Date().toLocaleString() },
                    threads: {
                        data_center: { all_posts: Array.from(this.dataCenter.posts.values()) },
                        instructor: { stats: this.instructor.stats, queue: this.instructor.queue },
                        observer: { discovery: Array.from(this.observer.discoverySet) }
                    },
                    storage: storageData
                };
                chrome.runtime.sendMessage({
                    type: "DOWNLOAD_JSON",
                    data: JSON.stringify(snapshot, null, 2),
                    filename: `doomscroll-export-${Date.now()}.json`
                });
                return "Snapshot export requested via background.";
            },
            wipe: async () => { await this.fullWipe(); location.reload(); }
        };

        window.addEventListener("message", async (e) => {
            if (e.data.type !== "DOOM_API_REQUEST") return;
            const method = e.data.method;
            const params = e.data.params;
            const result = await window.doomAPI[method]?.(params);
            if (result !== undefined) {
                console.log(`%c[Doom API: ${method.toUpperCase()}]`, "color: #0095f6; font-weight: bold;", result);
            }
        });
    }

    get running() { return this.instructor?.running || false; }
    get stats() { return this.instructor?.stats || {}; }
    get filters() { return this.instructor?.filters || {}; }
    get currentActions() { return this.instructor?.currentActions || []; }
    get settings() { return this.instructor?.settings || {}; }
    
    start(a, f, s) { this.instructor?.start(a, f, s); }
    stop() { this.instructor?.stop(); }
    resetInternalState() { this.fullWipe(); }
    
    updateConfig(a, f, s) { 
        if (this.instructor) {
            this.instructor.updateConfig(a, f, s);
        }
    }
}

window.engine = new DoomscrollEngine();
