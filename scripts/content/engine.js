/**
 * Doomscroll Bot Orchestrator v1.8.5
 * Universal Framework Orchestration with Modular DataCenter
 */
class DoomscrollEngine {
    constructor() {
        // Dynamic Platform Selection (Auto-detect)
        if (window.location.hostname.includes("instagram.com")) {
            this.dataCenter = new IGDataCenter();
            this.instructor = new IGInstructor(this.dataCenter);
            this.observer = new IGObserver(this.dataCenter, this.instructor);
            this.instructor.setObserver(this.observer);
        }

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

    initGlobalAPI() {
        window.doomAPI = {
            posts: () => this.dataCenter ? Array.from(this.dataCenter.posts.values()) : [],
            users: async () => (await chrome.storage.local.get(['all_user'])).all_user || [],
            hashtag: async () => (await chrome.storage.local.get(['all_hashtag'])).all_hashtag || [],
            queue: () => this.instructor ? this.instructor.queue : [],
            state: () => ({ 
                running: this.instructor?.running || false, 
                stats: this.instructor?.stats || {}, 
                queue_size: this.instructor?.queue.length || 0 
            }),
            target: () => this.instructor?.currentTarget,
            start: (a, f) => this.instructor?.start(a, f),
            stop: () => this.instructor?.stop(),
            export: async () => {
                const data = await chrome.storage.local.get(null);
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = `doom-export-${Date.now()}.json`;
                a.click();
            },
            wipe: async () => { if(this.dataCenter) await this.dataCenter.wipe(); location.reload(); }
        };

        window.addEventListener("message", async (e) => {
            if (e.data.type !== "DOOM_API_REQUEST") return;
            const method = e.data.method;
            const params = e.data.params;
            const result = await window.doomAPI[method]?.(params);
            if (result) console.log(`%c[Doom API: ${e.data.method.toUpperCase()}]`, "color: #0095f6; font-weight: bold;", result);
        });
    }

    get running() { return this.instructor?.running || false; }
    get stats() { return this.instructor?.stats || {}; }
    get filters() { return this.instructor?.filters || {}; }
    get currentActions() { return this.instructor?.currentActions || []; }
    
    start(a, f) { this.instructor?.start(a, f); }
    stop() { this.instructor?.stop(); }
    resetInternalState() { if(this.dataCenter) this.dataCenter.load(); }
    updateConfig(a, f) { 
        if (this.instructor) {
            this.instructor.currentActions = a; 
            this.instructor.filters = f; 
        }
    }
}

window.engine = new DoomscrollEngine();
