/**
 * BaseInstructor - แม่แบบสำหรับหน่วยลงมือทำ
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

    enqueue(href) { 
        if (!this.queue.includes(href)) {
            this.queue.push(href); 
        }
    }
    
    checkStatus() {
        if (!this.running) {
            throw new Error("INSTRUCTOR_STOPPED");
        }
    }

    async start(actions, filters) { throw new Error("Method 'start()' implementation missing."); }
    async executeActionWorkflow(href) { throw new Error("Method 'executeActionWorkflow()' implementation missing."); }
    
    stop() { 
        this.running = false; 
        this.updateUI("System Standby"); 
    }

    /**
     * ล้างสถานะการทำงานและคิวงานทั้งหมด
     */
    wipe() {
        this.running = false;
        this.queue = [];
        this.stats = { done: 0, success: 0, posts: 0, reels: 0 };
        console.log("[Instructor] Queue and Stats wiped.");
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
