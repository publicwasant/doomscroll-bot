/**
 * BaseDataCenter - แม่แบบหลักสำหรับการจัดการข้อมูล (Storage & Persistence)
 * ทำหน้าที่เป็นหัวใจสำคัญในการบันทึกและดึงข้อมูลจาก Chrome Storage
 */
class BaseDataCenter {
    constructor() {
        this.posts = new Map(); // เก็บข้อมูลโพสต์ทั้งหมดในรูปแบบ Map เพื่อการค้นหาที่รวดเร็ว (href -> data)
        this.errorStack = [];    // เก็บประวัติข้อผิดพลาดล่าสุด
    }

    /**
     * โหลดข้อมูลที่บันทึกไว้ในเครื่องขึ้นมาเก็บใน Memory
     */
    async load() {
        const data = await chrome.storage.local.get(['all_posts', 'all_errors']);
        if (data.all_posts) data.all_posts.forEach(p => this.posts.set(p.href, p));
        if (data.all_errors) this.errorStack = data.all_errors;
    }

    /**
     * ระบบซิงค์ข้อมูลลง Disk (ทุก Platform ต้องเขียน Logic การสกัดข้อมูลของตัวเอง)
     */
    async sync() { 
        throw new Error("Method 'sync()' must be implemented by subclass."); 
    }

    /**
     * ดึงข้อมูลโพสต์จาก Memory ตามลิงก์ (href)
     */
    getPost(href) { 
        return this.posts.get(href); 
    }

    /**
     * อัปเดตหรือเพิ่มข้อมูลโพสต์ใหม่ และสั่ง Sync ลง Storage ทันที
     */
    updatePost(href, data) {
        const post = this.posts.get(href) || { href };
        Object.assign(post, data); // รวมข้อมูลใหม่เข้าไปใน Object เดิม
        this.posts.set(href, post);
        this.sync(); // สั่งบันทึกข้อมูลลง Storage
        return post;
    }

    /**
     * บันทึกข้อผิดพลาดลงใน Stack และ Storage เพื่อการตรวจสอบ (Debug)
     */
    async logError(err, context) {
        this.errorStack.unshift({ 
            time: new Date().toISOString(), 
            context, 
            msg: err.message || err 
        });
        this.errorStack = this.errorStack.slice(0, 100); // เก็บแค่ 100 รายการล่าสุด
        await chrome.storage.local.set({ all_errors: this.errorStack });
    }

    /**
     * ล้างข้อมูลทั้งหมดใน Storage และ Memory (Factory Reset)
     */
    async wipe() {
        await chrome.storage.local.clear();
        this.posts.clear();
    }
}
