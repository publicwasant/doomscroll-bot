/**
 * IGInstructor - Instagram Specific Executor v2.2.5 (Live Update & Speed Fix)
 */
class IGInstructor extends BaseInstructor {
    constructor(dataCenter) {
        super(dataCenter);
        this.currentTarget = null;
        this.currentActions = ["LIKE"];
        this.filters = { tags: [], condition: 'NONE' };
        this.settings = { autoScroll: true, speedMultiplier: 1.0 };
    }

    async start(actions, filters, settings) {
        if (this.running) return;
        this.running = true;
        this.updateConfig(actions, filters, settings);
        
        this.stats = { done: 0, success: 0, posts: 0, reels: 0 };
        console.log("[IGInstructor] Bot Started with settings:", this.settings);
        this.updateUI("IG Instructor: Active");

        try {
            while (this.running) {
                this.checkStatus();

                if (this.queue.length === 0) {
                    if (this.settings.autoScroll) {
                        this.updateUI("Instructor: Searching...");
                        window.scrollBy({ top: 1000, behavior: 'smooth' });
                    } else {
                        this.updateUI("Instructor: Idle (Auto-Scroll Off)");
                    }
                    // Speed multiplier applies to idle time too
                    await sleep(3000 * Math.max(0.5, this.settings.speedMultiplier));
                    continue;
                }

                const href = this.queue.shift();
                await this.executeActionWorkflow(href);
            }
        } catch (e) { 
            if (e.message !== "INSTRUCTOR_STOPPED") console.error("[IGInstructor] Loop Exception:", e);
        } finally { 
            this.running = false; 
            this.updateUI("System Standby");
        }
    }

    /**
     * อัปเดตค่า Config แบบ Live โดยไม่ทำลาย Object Reference เดิม
     */
    updateConfig(actions, filters, settings) {
        if (actions) this.currentActions = actions;
        if (filters) this.filters = filters;
        if (settings) {
            this.settings.autoScroll = settings.autoScroll;
            this.settings.speedMultiplier = settings.speedMultiplier;
        }
        console.log("[IGInstructor] Config Live Updated:", this.settings);
    }

    async executeActionWorkflow(href) {
        const tile = document.querySelector(`a[href="${href}"]`);
        if (!tile) return;

        try {
            this.checkStatus();
            await humanScrollTo(tile, this.running);
            
            this.checkStatus();
            await humanClick(tile, this.running);
            
            // Adjust delay based on speed multiplier
            await sleep(rand(1500, 2500) * this.settings.speedMultiplier);
            this.checkStatus();

            const fullPost = await this.observer.fillCurrentPost(href);
            this.currentTarget = fullPost;

            if (!this.shouldProcessPost(fullPost)) {
                this.updateUI(`Instructor: Skipped @${fullPost.user}`);
                await this.closePost();
                return;
            }

            this.updateUI(`Instructor: Processing @${fullPost.user}`);
            let anySuccess = false;

            for (const action of this.currentActions) {
                this.checkStatus();
                
                let btn = null;
                for (let i = 0; i < 3; i++) {
                    btn = this.findActionButton(action);
                    if (btn) break;
                    await sleep(600 * this.settings.speedMultiplier);
                }

                if (btn && this.running) {
                    await humanClick(btn, this.running);
                    anySuccess = true;
                    await sleep(rand(1000, 1500) * this.settings.speedMultiplier);
                }
            }

            if (anySuccess) this.stats.success++;

            this.checkStatus();
            await this.closePost();
            this.stats.done++;
            this.currentTarget = null;
            this.updateUI();
            
            await sleep(rand(1000, 2000) * this.settings.speedMultiplier);
            
        } catch (e) {
            if (e.message === "INSTRUCTOR_STOPPED") throw e;
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
            SAVE: ["Save", "Remove", "บันทึก", "เลิกบันทึก", "Unsave", "Remove from saved", "ลบออกจากการบันทึก"] 
        }[action];
        const scope = document.querySelector('div[role="presentation"] article') || document.querySelector('article') || document;
        const allSvgs = Array.from(scope.querySelectorAll('svg[aria-label]'));
        const targetSvg = allSvgs.find(svg => labels.includes(svg.getAttribute('aria-label')));
        return targetSvg ? (targetSvg.closest('[role="button"]') || targetSvg.parentElement) : null;
    }

    async closePost() {
        const closeBtn = document.querySelector('svg[aria-label="Close"]') || document.querySelector('svg[aria-label="ปิด"]');
        if (closeBtn) {
            const btn = closeBtn.closest('[role="button"]') || closeBtn.parentElement;
            await humanClick(btn, this.running);
        } else {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        }
        await sleep(500 * this.settings.speedMultiplier);
    }
}
