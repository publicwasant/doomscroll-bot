/**
 * Doomscroll Bot Orchestrator v2.0.0
 * The Central Command for Triple-Thread Architecture
 * Bridges: DataCenter (Storage), Observer (Scout), Instructor (Commander)
 */
class DoomscrollEngine {
    constructor() {
        // เริ่มต้น Thread 1: Data Center (สมองส่วนกลาง)
        this.dataCenter = new IGDataCenter();
        
        // เริ่มต้น Thread 3: Instructor (หน่วยปฏิบัติการ)
        this.instructor = new IGInstructor(this.dataCenter);
        
        // เริ่มต้น Thread 2: Observer (หน่วยสอดแนม)
        this.observer = new IGObserver(this.dataCenter, this.instructor);
        
        // เชื่อมความสัมพันธ์ระหว่าง Thread (Circular Link)
        this.instructor.setObserver(this.observer);

        this.init();
    }

    async init() {
        // โหลดข้อมูลเก่าจากเครื่อง
        if (this.dataCenter) await this.dataCenter.load();
        
        // เปิดใช้งาน Console API และ Bridge
        this.initGlobalAPI();
        this.injectBridge();
        
        // สั่งให้หน่วยสอดแนมเริ่มทำงานทันที
        if (this.observer) this.observer.start();
    }

    /**
     * ฉีด Bridge Script เข้าไปในหน้าเว็บเพื่อให้เรียกใช้ 'doom' จาก Console ได้
     */
    injectBridge() {
        const s = document.createElement('script');
        s.src = chrome.runtime.getURL('scripts/content/bridge.js');
        (document.head || document.documentElement).appendChild(s);
        s.onload = () => s.remove();
    }

    /**
     * รวบรวมฟังก์ชันทั้งหมดเพื่อเปิดช่องทางให้ Bridge เรียกใช้งาน
     */
    initGlobalAPI() {
        window.doomAPI = {
            // --- ข้อมูลใน Data Center ---
            posts: () => this.dataCenter ? Array.from(this.dataCenter.posts.values()) : [],
            users: async () => (await chrome.storage.local.get(['all_user'])).all_user || [],
            hashtag: async () => (await chrome.storage.local.get(['all_hashtag'])).all_hashtag || [],
            found: async () => await chrome.storage.local.get(['all_user', 'all_hashtag', 'all_posts']),
            
            // --- สถานะปัจจุบันของระบบ ---
            queue: () => this.instructor ? this.instructor.queue : [],
            state: () => ({ 
                running: this.instructor?.running || false, 
                stats: this.instructor?.stats || {}, 
                queue_size: this.instructor?.queue.length || 0 
            }),
            target: () => this.instructor?.currentTarget,
            config: () => ({ actions: this.instructor?.currentActions, filters: this.instructor?.filters }),
            
            // --- การควบคุมและ Debug ---
            start: (a, f) => this.instructor?.start(a, f),
            stop: () => this.instructor?.stop(),
            sync: async () => { if(this.dataCenter) await this.dataCenter.sync(); return "Data Center Synced."; },
            stackTrace: () => this.dataCenter?.errorStack || [],
            
            // ตรวจสุขภาพ Selector (สำคัญมากสำหรับ Developer)
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

            // --- การจัดการข้อมูล ---
            export: async () => {
                const storageData = await chrome.storage.local.get(null);
                const snapshot = {
                    metadata: { project: "Doomscroll Bot", version: "2.0.0", time: new Date().toLocaleString() },
                    threads: {
                        data_center: { all_posts: Array.from(this.dataCenter.posts.values()) },
                        instructor: { stats: this.instructor.stats, queue: this.instructor.queue },
                        observer: { discovery: Array.from(this.observer.discoverySet) }
                    },
                    storage: storageData
                };
                const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = `doom-v2-full-snapshot-${Date.now()}.json`;
                a.click();
                return "Full snapshot exported.";
            },
            
            wipe: async () => { if(this.dataCenter) await this.dataCenter.wipe(); location.reload(); }
        };

        // รับข้อความจาก Bridge (Console หน้าเว็บ)
        window.addEventListener("message", async (e) => {
            if (e.data.type !== "DOOM_API_REQUEST") return;
            const method = e.data.method;
            const params = e.data.params;
            const result = await window.doomAPI[method]?.(params);
            
            // ตอบกลับผลลัพธ์ผ่าน Console
            if (result !== undefined) {
                console.log(`%c[Doom API: ${method.toUpperCase()}]`, "color: #0095f6; font-weight: bold;", result);
            }
        });
    }

    // --- ส่วนเชื่อมต่อสำหรับหน้า UI (Popup) ---
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

// จุดกำเนิดของระบบ
window.engine = new DoomscrollEngine();
