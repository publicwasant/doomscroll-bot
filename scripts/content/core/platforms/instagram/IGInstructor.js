/**
 * IGInstructor - ผู้ลงมือทำงานเฉพาะสำหรับ Instagram
 * จัดการลำดับขั้นตอนการเปิดโพสต์, ตรวจสอบเงื่อนไข และกดปุ่ม Action
 */
class IGInstructor extends BaseInstructor {
    constructor(dataCenter) {
        super(dataCenter);
        this.currentTarget = null;
        this.currentActions = ["LIKE"];
        this.filters = { tags: [], condition: 'NONE' };
    }

    /**
     * เริ่มต้น Loop การทำงานของบอท
     * @param {Array} actions - รายการที่สั่งให้ทำ (LIKE, REPOST, SAVE)
     * @param {Object} filters - เงื่อนไขในการกรองโพสต์
     */
    async start(actions, filters) {
        if (this.running) return;
        this.running = true;
        this.currentActions = actions;
        this.filters = filters;
        this.stats = { done: 0, success: 0, posts: 0, reels: 0 };
        
        this.updateUI("IG Instructor: Active");

        try {
            while (this.running) {
                this.checkStatus(); // ตรวจสอบ Kill-switch ทันทีทุกต้นรอบ

                // ถ้างานในคิวหมด ให้เลื่อนจอลงไปหาเพิ่ม
                if (this.queue.length === 0) {
                    this.updateUI("Instructor: Searching...");
                    window.scrollBy({ top: 1000, behavior: 'smooth' });
                    await sleep(3000);
                    continue;
                }

                // หยิบงานชิ้นแรกออกมาทำ (FIFO - First In First Out)
                const href = this.queue.shift();
                await this.executeActionWorkflow(href);
            }
        } catch (e) { 
            if (e.message === "INSTRUCTOR_STOPPED") {
                console.log("[IGInstructor] Halted immediately.");
            } else {
                console.error("[IGInstructor] Loop Exception:", e);
            }
        } finally { 
            this.running = false; 
            this.updateUI("System Standby"); // กลับคืนสถานะเริ่มต้นเมื่อจบงาน
        }
    }

    /**
     * ลำดับขั้นตอนการจัดการโพสต์หนึ่งชิ้น (Surgical Execution)
     */
    async executeActionWorkflow(href) {
        const tile = document.querySelector(`a[href="${href}"]`);
        if (!tile) return; // ถ้าโพสต์หายไปจากหน้าจอแล้ว ให้ข้ามไป

        try {
            // 1. นำเมาส์ไปหาและคลิกเปิดโพสต์
            this.checkStatus();
            await humanScrollTo(tile, this.running);
            
            this.checkStatus();
            await humanClick(tile, this.running);
            
            // 2. รอให้ Dialog โพสต์โหลดเสร็จ
            this.checkStatus();
            await sleep(rand(2000, 3000));

            // 3. สั่ง Observer สแกนข้อมูล "ของจริง" ตอนโพสต์เปิดอยู่
            const fullPost = await this.observer.fillCurrentPost(href);
            this.currentTarget = fullPost;

            // 4. ตรวจสอบกับ Filter ที่ผู้ใช้ตั้งไว้
            if (!this.shouldProcessPost(fullPost)) {
                this.updateUI(`Instructor: Skipped @${fullPost.user}`);
                await this.closePost();
                return;
            }

            // 5. ลงมือทำ Action ตามรายการที่เลือก
            this.updateUI(`Instructor: Working on @${fullPost.user}`);
            let success = false;
            for (const action of this.currentActions) {
                this.checkStatus();
                const btn = this.findActionButton(action);
                if (btn && this.running) {
                    await humanClick(btn, this.running);
                    success = true;
                    await sleep(rand(800, 1500)); // เว้นจังหวะระหว่าง Action ให้เนียน
                }
            }

            // เก็บสถิติแยกประเภท Post vs Reel
            if (success) {
                this.stats.success++;
                if (href.includes('/reel/')) this.stats.reels++; else this.stats.posts++;
            }

            // 6. จบงานชิ้นนี้ ปิดโพสต์ทิ้ง
            this.checkStatus();
            await this.closePost();
            this.stats.done++;
            this.currentTarget = null;
            this.updateUI(); // อัปเดตตัวเลข Success บน Popup
            await sleep(rand(1000, 2000)); // หน่วงเวลาก่อนเริ่มงานใหม่
            
        } catch (e) {
            if (e.message === "INSTRUCTOR_STOPPED") throw e;
            console.error(`[IGInstructor] Error on ${href}:`, e);
            await this.closePost();
        }
    }

    /**
     * Logic การกรองโพสต์ (The Brain)
     */
    shouldProcessPost(post) {
        if (!post) return false;
        if (this.filters.condition === 'NONE') return true; // ถ้าไม่ตั้ง Filter ให้ผ่านหมด

        const cap = (post.caption || "").toLowerCase();
        const user = (post.user || "").toLowerCase();
        
        // เช็กการ Match ของ Tags แต่ละประเภท
        const match = this.filters.tags.some(t => {
            const val = t.value.toLowerCase();
            if (t.type === 'user') return user.includes(val);
            if (t.type === 'hashtag') return cap.includes('#' + val);
            return cap.includes(val); // Keyword ปกติ
        });

        // รองรับเงื่อนไขเชิงนิเสธ (เช่น DOES NOT CONTAIN)
        return this.filters.condition.includes('NOT') ? !match : match;
    }

    /**
     * ค้นหาปุ่ม Action ที่ต้องการผ่าน SVG Label
     */
    findActionButton(action) {
        const labels = { 
            LIKE: ["Like", "Unlike", "ถูกใจ", "เลิกถูกใจ"], 
            REPOST: ["Repost", "Unrepost", "รีโพสต์", "เลิกโพสต์ใหม่"], 
            SAVE: ["Save", "Remove", "บันทึก", "เลิกบันทึก", "Unsave"] 
        }[action];
        
        // ค้นหาในขอบเขตของ Article ที่เปิดอยู่เท่านั้น
        const btns = Array.from(document.querySelectorAll('article [role="button"]'));
        return btns.find(b => labels.includes(b.querySelector('svg')?.getAttribute('aria-label')));
    }

    /**
     * ปิดโพสต์โดยการกดปุ่ม Close หรือปุ่ม Escape บนคีย์บอร์ด
     */
    async closePost() {
        const closeBtn = document.querySelector('svg[aria-label="Close"], svg[aria-label="ปิด"]');
        if (closeBtn) await humanClick(closeBtn, this.running);
        else window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    }
}
