/**
 * BaseObserver - แม่แบบสำหรับการสแกนหน้าเว็บ (Scanning Contract)
 * ทำหน้าที่เป็น "หน่วยสอดแนม" คอยหาโพสต์ใหม่ๆ บนหน้าจอ
 */
class BaseObserver {
    constructor(dataCenter, instructor) {
        this.dataCenter = dataCenter; // อ้างอิงถึงหน่วยจัดการข้อมูล
        this.instructor = instructor; // อ้างอิงถึงหน่วยลงมือทำ (เพื่อส่งงานเข้าคิว)
    }

    /**
     * เริ่มต้นการทำงานของหน่วยสอดแนม (ต้องเขียนเพิ่มในระดับ Platform)
     */
    start() { 
        throw new Error("Method 'start()' must be implemented."); 
    }
    
    /**
     * ค้นหาและระบุตัวตนโพสต์บนหน้าจอ
     */
    scan(root) { 
        throw new Error("Method 'scan()' must be implemented."); 
    }
    
    /**
     * สกัดข้อมูลเชิงลึกเมื่อโพสต์ถูกเปิดขึ้นมา (Deep Extraction)
     */
    async fillCurrentPost(href) { 
        throw new Error("Method 'fillCurrentPost()' must be implemented."); 
    }
}
