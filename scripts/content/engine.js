/**
 * Doomscroll Bot Orchestrator v1.7.6
 * Bridges DataCenter, Observer, and Instructor
 */
class DoomscrollEngine {
    constructor() {
        this.dataCenter = new DataCenter();
        this.instructor = new Instructor(this.dataCenter);
        this.observer = new Observer(this.dataCenter, this.instructor);
        
        // Circular dependency handling
        this.instructor.setObserver(this.observer);

        this.init();
    }

    async init() {
        await this.dataCenter.load();
        this.initGlobalAPI();
        this.injectBridge();
        this.observer.start();
    }

    injectBridge() {
        const s = document.createElement('script');
        s.src = chrome.runtime.getURL('scripts/content/bridge.js');
        (document.head || document.documentElement).appendChild(s);
        s.onload = () => s.remove();
    }

    initGlobalAPI() {
        window.doomAPI = {
            posts: () => Array.from(this.dataCenter.posts.values()),
            users: async () => (await chrome.storage.local.get(['all_user'])).all_user || [],
            hashtag: async () => (await chrome.storage.local.get(['all_hashtag'])).all_hashtag || [],
            queue: () => this.instructor.queue,
            state: () => ({ 
                running: this.instructor.running, 
                stats: this.instructor.stats, 
                queue_size: this.instructor.queue.length 
            }),
            target: () => this.instructor.currentTarget,
            start: (a, f) => this.instructor.start(a, f),
            stop: () => this.instructor.stop(),
            
            // --- Ultimate Export API ---
            export: async () => {
                const storageData = await chrome.storage.local.get(null);
                const snapshot = {
                    metadata: {
                        project: "Doomscroll Bot",
                        version: chrome.runtime.getManifest().version,
                        export_time: new Date().toISOString(),
                        local_time: new Date().toLocaleString(),
                        url: window.location.href
                    },
                    threads: {
                        data_center: {
                            total_posts: this.dataCenter.posts.size,
                            all_user: storageData.all_user || [],
                            all_hashtag: storageData.all_hashtag || [],
                            all_posts: Array.from(this.dataCenter.posts.values())
                        },
                        instructor: {
                            running: this.instructor.running,
                            stats: this.instructor.stats,
                            queue: this.instructor.queue,
                            current_target: this.instructor.currentTarget
                        },
                        observer: {
                            discovery_count: this.observer.discoverySet.size,
                            current_discovery_set: Array.from(this.observer.discoverySet)
                        }
                    },
                    system: {
                        error_stack: this.dataCenter.errorStack,
                        storage_raw: storageData
                    }
                };

                const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `doom-full-snapshot-${Date.now()}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                return "Full System Snapshot exported successfully.";
            },
            
            wipe: async () => {
                await this.dataCenter.wipe();
                location.reload();
            }
        };

        window.addEventListener("message", async (e) => {
            if (e.data.type !== "DOOM_API_REQUEST") return;
            const method = e.data.method;
            const params = e.data.params;
            const result = await window.doomAPI[method]?.(params);
            if (result) console.log(`%c[Doom API: ${method.toUpperCase()}]`, "color: #0095f6; font-weight: bold;", result);
        });
    }

    // Proxy for Main Script
    get running() { return this.instructor.running; }
    get stats() { return this.instructor.stats; }
    get filters() { return this.instructor.filters; }
    get currentActions() { return this.instructor.currentActions; }
    
    start(a, f) { this.instructor.start(a, f); }
    stop() { this.instructor.stop(); }
    resetInternalState() { this.dataCenter.load(); }
    updateConfig(a, f) { this.instructor.currentActions = a; this.instructor.filters = f; }
}

window.engine = new DoomscrollEngine();
