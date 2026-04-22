/**
 * IGInstructor - Instagram Specific Executor v1.9.0 (Atomic Stop Support)
 */
class IGInstructor extends BaseInstructor {
    constructor(dataCenter) {
        super(dataCenter);
        this.currentTarget = null;
        this.currentActions = ["LIKE"];
        this.filters = { tags: [], condition: 'NONE' };
    }

    async start(actions, filters) {
        if (this.running) return;
        this.running = true;
        this.currentActions = actions;
        this.filters = filters;
        this.stats = { done: 0, success: 0, posts: 0, reels: 0 };
        
        console.log("[IGInstructor] Started");
        this.updateUI("IG Instructor: Active");

        try {
            while (this.running) {
                this.checkStatus(); // เช็กสถานะก่อนเริ่มงานถัดไป

                if (this.queue.length === 0) {
                    this.updateUI("Instructor: Searching...");
                    window.scrollBy({ top: 1000, behavior: 'smooth' });
                    await sleep(3000);
                    continue;
                }

                const href = this.queue.shift();
                await this.executeActionWorkflow(href);
            }
        } catch (e) { 
            if (e.message === "INSTRUCTOR_STOPPED") {
                console.log("[IGInstructor] Halted immediately.");
            } else {
                console.error("[IGInstructor] Runtime Error:", e);
            }
        } finally { 
            this.running = false; 
            this.updateUI("System Standby");
        }
    }

    async executeActionWorkflow(href) {
        const tile = document.querySelector(`a[href="${href}"]`);
        if (!tile) return;

        try {
            this.checkStatus(); // ก่อน Scroll
            await humanScrollTo(tile, this.running);
            
            this.checkStatus(); // ก่อน Click
            await humanClick(tile, this.running);
            
            this.checkStatus(); // ระหว่างรอโหลด
            await sleep(rand(2000, 3000));

            const fullPost = await this.observer.fillCurrentPost(href);
            this.currentTarget = fullPost;

            if (!this.shouldProcessPost(fullPost)) {
                this.updateUI(`Instructor: Skipped @${fullPost.user}`);
                await this.closePost();
                return;
            }

            this.updateUI(`Instructor: Working on @${fullPost.user}`);
            let success = false;
            for (const action of this.currentActions) {
                this.checkStatus(); // เช็กก่อนทำแต่ละ Action
                const btn = this.findActionButton(action);
                if (btn && this.running) {
                    await humanClick(btn, this.running);
                    success = true;
                    await sleep(rand(800, 1500));
                }
            }

            if (success) {
                this.stats.success++;
                if (href.includes('/reel/')) this.stats.reels++; else this.stats.posts++;
            }

            this.checkStatus(); // ก่อนปิดโพสต์
            await this.closePost();
            this.stats.done++;
            this.currentTarget = null;
            this.updateUI();
            await sleep(rand(1000, 2000));
            
        } catch (e) {
            if (e.message === "INSTRUCTOR_STOPPED") throw e; // โยนต่อไปให้ start() จัดการ
            console.error(`[IGInstructor] Error processing task ${href}:`, e);
            await this.closePost();
        }
    }

    shouldProcessPost(post) {
        if (!post) return false;
        if (this.filters.condition === 'NONE') return true;
        const cap = (post.caption || "").toLowerCase();
        const user = (post.user || "").toLowerCase();
        const match = this.filters.tags.some(t => {
            const val = t.value.toLowerCase();
            if (t.type === 'user') return user.includes(val);
            if (t.type === 'hashtag') return cap.includes('#' + val);
            return cap.includes(val);
        });
        return this.filters.condition.includes('NOT') ? !match : match;
    }

    findActionButton(action) {
        const labels = { 
            LIKE: ["Like", "Unlike", "ถูกใจ", "เลิกถูกใจ"], 
            REPOST: ["Repost", "Unrepost", "รีโพสต์", "เลิกโพสต์ใหม่"], 
            SAVE: ["Save", "Remove", "บันทึก", "เลิกบันทึก", "Unsave"] 
        }[action];
        const btns = Array.from(document.querySelectorAll('article [role="button"]'));
        return btns.find(b => labels.includes(b.querySelector('svg')?.getAttribute('aria-label')));
    }

    async closePost() {
        const closeBtn = document.querySelector('svg[aria-label="Close"], svg[aria-label="ปิด"]');
        if (closeBtn) await humanClick(closeBtn, this.running);
        else window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    }
}
