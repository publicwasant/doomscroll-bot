/**
 * IGInstructor - Instagram Specific Executor v2.0.2 (Save Button Precision Fix)
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
        
        console.log("[IGInstructor] Started with actions:", actions);
        this.updateUI("IG Instructor: Active");

        try {
            while (this.running) {
                this.checkStatus();

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
                console.error("[IGInstructor] Loop Exception:", e);
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
            this.checkStatus();
            await humanScrollTo(tile, this.running);
            
            this.checkStatus();
            await humanClick(tile, this.running);
            
            await sleep(rand(2000, 3000));
            this.checkStatus();

            const fullPost = await this.observer.fillCurrentPost(href);
            this.currentTarget = fullPost;

            if (!this.shouldProcessPost(fullPost)) {
                this.updateUI(`Instructor: Filter skipped @${fullPost.user}`);
                await this.closePost();
                return;
            }

            this.updateUI(`Instructor: Working on @${fullPost.user}`);
            let anySuccess = false;

            for (const action of this.currentActions) {
                this.checkStatus();
                
                let btn = null;
                // Retry searching for the button
                for (let i = 0; i < 3; i++) {
                    btn = this.findActionButton(action);
                    if (btn) break;
                    await sleep(600);
                }

                if (btn && this.running) {
                    console.log(`[IGInstructor] Executing ${action} on @${fullPost.user}`);
                    await humanClick(btn, this.running);
                    anySuccess = true;
                    await sleep(rand(1200, 1800)); // ให้เวลาระบบ Update DOM
                }
            }

            if (anySuccess) {
                this.stats.success++;
                if (href.includes('/reel/')) this.stats.reels++; else this.stats.posts++;
            }

            this.checkStatus();
            await this.closePost();
            this.stats.done++;
            this.currentTarget = null;
            this.updateUI();
            await sleep(rand(1000, 2000));
            
        } catch (e) {
            if (e.message === "INSTRUCTOR_STOPPED") throw e;
            console.error(`[IGInstructor] Error on ${href}:`, e);
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

    /**
     * ค้นหาปุ่ม Action โดยเน้นการหาจาก SVG Label ภายใน Modal
     */
    findActionButton(action) {
        const labels = { 
            LIKE: ["Like", "Unlike", "ถูกใจ", "เลิกถูกใจ"], 
            REPOST: ["Repost", "Unrepost", "รีโพสต์", "เลิกโพสต์ใหม่"], 
            SAVE: ["Save", "Remove", "บันทึก", "เลิกบันทึก", "Unsave", "Remove from saved", "ลบออกจากการบันทึก"] 
        }[action];
        
        // ค้นหาใน Modal หรือ Article ที่มองเห็น
        const scope = document.querySelector('div[role="presentation"] article') || 
                      document.querySelector('article') || 
                      document;

        // ค้นหา SVG ทุกลูกที่มี aria-label ตรงกับที่เราต้องการ
        const allSvgs = Array.from(scope.querySelectorAll('svg[aria-label]'));
        const targetSvg = allSvgs.find(svg => labels.includes(svg.getAttribute('aria-label')));

        if (targetSvg) {
            // ส่งคืนตัวปุ่มที่เป็น Parent ของ SVG นั้น
            return targetSvg.closest('[role="button"]') || targetSvg.parentElement;
        }

        return null;
    }

    async closePost() {
        const closeBtn = document.querySelector('svg[aria-label="Close"]') || 
                         document.querySelector('svg[aria-label="ปิด"]') ||
                         document.querySelector('div[role="button"] svg'); // Fallback สำหรับปุ่มปิดบางแบบ
                         
        if (closeBtn) {
            const btn = closeBtn.closest('[role="button"]') || closeBtn.parentElement;
            await humanClick(btn, this.running);
        } else {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        }
        await sleep(500);
    }
}
