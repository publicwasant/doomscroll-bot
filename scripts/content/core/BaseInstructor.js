/**
 * Base Instructor Class v1.0.0
 */
class BaseInstructor {
    constructor(master, name = "GenericInstructor") {
        this.master = master;
        this.name = name;
        this.isWorking = false;
        this.stopRequested = false;
        this.master.registerInstructor(this.name, this);
    }

    async onCommand(tasks) {
        if (this.isWorking) return;
        this.isWorking = true;
        this.stopRequested = false;

        for (const task of tasks) {
            if (this.stopRequested) break;
            try {
                // ใช้ waeUtils ในการหน่วงเวลาแบบสุ่ม
                await waeUtils.sleep(waeUtils.rand(1000, 3000));
                await this.performAction(task);
            } catch (error) {
                console.error(`❌ [${this.name}] Task failed:`, error);
            }
        }
        this.isWorking = false;
    }

    async performAction(task) {
        throw new Error("performAction() must be implemented.");
    }

    // Helpers ที่เรียกใช้ waeUtils โดยตรง
    async click(el) { await waeUtils.humanClick(el); }
    async scrollTo(el) { await waeUtils.humanScrollTo(el); }
    async wait(ms) { await waeUtils.sleep(ms); }
}
window.BaseInstructor = BaseInstructor;