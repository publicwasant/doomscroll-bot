/**
 * BaseInstructor - Interface for all platform executors v1.9.0
 */
class BaseInstructor {
    constructor(dataCenter) {
        this.dataCenter = dataCenter;
        this.observer = null;
        this.queue = [];
        this.running = false;
        this.stats = { done: 0, success: 0, posts: 0, reels: 0 };
    }

    setObserver(observer) { this.observer = observer; }
    enqueue(href) { if (!this.queue.includes(href)) this.queue.push(href); }
    
    // ฟังก์ชันตรวจสอบสถานะเพื่อหยุดงานทันที
    checkStatus() {
        if (!this.running) {
            throw new Error("INSTRUCTOR_STOPPED");
        }
    }

    async start(actions, filters) { throw new Error("Method 'start()' must be implemented."); }
    async executeActionWorkflow(href) { throw new Error("Method 'executeActionWorkflow()' must be implemented."); }
    
    stop() { 
        this.running = false; 
        console.log("[Instructor] Stop signal received.");
        this.updateUI("System Standby"); // แจ้ง UI ให้เปลี่ยนสถานะทันที
    }

    updateUI(msg = "") {
        chrome.runtime.sendMessage({ 
            type: "STATS_UPDATE", 
            stats: this.stats, 
            msg, 
            running: this.running 
        });
    }
}
