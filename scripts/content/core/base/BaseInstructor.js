/**
 * BaseInstructor - แม่แบบสำหรับหน่วยลงมือทำ (Execution Contract)
 * ทำหน้าที่บริหารจัดการคิวงานและลำดับขั้นตอนการทำ Action
 */
class BaseInstructor {
    constructor(dataCenter) {
        this.dataCenter = dataCenter; // อ้างอิงหน่วยข้อมูล
        this.observer = null;        // อ้างอิงหน่วยสอดแนม (ต้องตั้งค่าภายหลัง)
        this.queue = [];              // คิวงาน (List of hrefs) ที่รอประมวลผล
        this.running = false;         // สถานะการทำงานปัจจุบัน
        this.stats = { done: 0, success: 0, posts: 0, reels: 0 }; // สถิติการทำงาน
    }

    /**
     * เชื่อมต่อกับหน่วยสอดแนม
     */
    setObserver(observer) { this.observer = observer; }

    /**
     * เพิ่มงาน (ลิงก์โพสต์) เข้าไปในคิว ถ้ายังไม่มีอยู่ในคิว
     */
    enqueue(href) { 
        if (!this.queue.includes(href)) {
            this.queue.push(href); 
        }
    }
    
    /**
     * ตรวจสอบสถานะว่ายังรันอยู่หรือไม่ ถ้าไม่รันจะทำการหยุดงานทันที (Atomic Stop)
     */
    checkStatus() {
        if (!this.running) {
            throw new Error("INSTRUCTOR_STOPPED");
        }
    }

    /**
     * เริ่มต้นการทำงานตามเงื่อนไขที่กำหนด
     */
    async start(actions, filters) { 
        throw new Error("Method 'start()' must be implemented."); 
    }

    /**
     * ลำดับขั้นตอนการจัดการโพสต์หนึ่งรายการ
     */
    async executeActionWorkflow(href) { 
        throw new Error("Method 'executeActionWorkflow()' must be implemented."); 
    }
    
    /**
     * หยุดการทำงานและแจ้งสถานะกลับไปยัง UI
     */
    stop() { 
        this.running = false; 
        this.updateUI("System Standby"); 
    }

    /**
     * ส่งข้อความอัปเดตสถานะและสถิติไปยังหน้าจอ Popup
     */
    updateUI(msg = "") {
        chrome.runtime.sendMessage({ 
            type: "STATS_UPDATE", 
            stats: this.stats, 
            msg, 
            running: this.running 
        });
    }
}
