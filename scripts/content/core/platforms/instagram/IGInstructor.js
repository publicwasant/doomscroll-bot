/**
 * Instagram Operator (Instructor) v1.1.1 - Enhanced Selector Edition
 */
class IGInstructor extends BaseInstructor {
    constructor(master) {
        super(master, "IGInstructor");
        this.style = "color: #e67e22; font-weight: bold; border-left: 3px solid #e67e22; padding-left: 5px;";
    }

    async performAction(task) {
        const action = task.action.toUpperCase().trim();
        const { payload } = task;
        
        waeUtils.log("INSTRUCTOR", `Executing ${action} on ${payload.id}`);

        if (!payload.element) {
            waeUtils.log("INSTRUCTOR", "Target element missing", "error");
            return;
        }

        switch (action) {
            case 'PROCESS':
                await this.processPost(payload.element);
                break;
            case 'LIKE':
                await this.likePost(payload.element);
                break;
            case 'SAVE':
                await this.savePost(payload.element);
                break;
            default:
                waeUtils.log("INSTRUCTOR", `Unknown action: ${action}`, "warn");
        }
    }

    async processPost(postElement) {
        await waeUtils.humanScrollTo(postElement);
        await waeUtils.sleep(waeUtils.rand(1000, 2000));
        waeUtils.log("INSTRUCTOR", "Post processed successfully.");
    }

    async likePost(postElement) {
        await waeUtils.humanScrollTo(postElement);
        // ค้นหาทั้งจาก svg และตัว div เอง
        const likeBtn = postElement.querySelector('div[role="button"] svg[aria-label="Like"], div[role="button"] svg[aria-label="ถูกใจ"], div[role="button"][aria-label="Like"], div[role="button"][aria-label="ถูกใจ"]')?.closest('div[role="button"]');
        
        if (likeBtn) {
            const isAlreadyLiked = postElement.querySelector('svg[aria-label="Unlike"], svg[aria-label="เลิกถูกใจ"]');
            if (!isAlreadyLiked) {
                await waeUtils.humanClick(likeBtn);
                waeUtils.log("INSTRUCTOR", "❤️ Liked successfully.");
            } else {
                waeUtils.log("INSTRUCTOR", "Already liked. Skipping.");
            }
        }
    }

    async savePost(postElement) {
        await waeUtils.humanScrollTo(postElement);
        
        // --- Enhanced Save Button Selector ---
        // 1. ลองหาจาก aria-label มาตรฐาน (ทั้งบน SVG และ DIV)
        let saveBtn = postElement.querySelector('svg[aria-label="Save"], svg[aria-label="บันทึก"], div[role="button"][aria-label="Save"], div[role="button"][aria-label="บันทึก"]')?.closest('div[role="button"]');
        
        // 2. ถ้ายังไม่เจอ ลองเช็คสถานะที่เซฟไปแล้ว (เผื่อต้องการข้าม)
        const isAlreadySaved = postElement.querySelector('svg[aria-label="Remove"], svg[aria-label="ยกเลิกการบันทึก"], div[role="button"][aria-label="Remove"]');
        
        if (isAlreadySaved) {
            waeUtils.log("INSTRUCTOR", "Post already saved. Skipping.");
            return;
        }

        // 3. Fallback: ถ้ายังหาปุ่มไม่เจอเลย ให้มองหาปุ่มที่อยู่ "ขวาสุด" ของแถบ Action Bar
        if (!saveBtn) {
            const actionButtons = postElement.querySelectorAll('div[role="button"]');
            // ปุ่ม Save มักจะแยกตัวอยู่ขวาสุดตัวเดียว หรือเป็นตัวสุดท้ายในกลุ่ม
            if (actionButtons.length > 0) {
                saveBtn = actionButtons[actionButtons.length - 1]; // ลองสุ่มตัวสุดท้าย
            }
        }

        if (saveBtn) {
            await waeUtils.humanClick(saveBtn);
            waeUtils.log("INSTRUCTOR", "🔖 Saved successfully.");
        } else {
            waeUtils.log("INSTRUCTOR", "⚠️ Save button could not be located.", "warn");
        }
    }
}

if (window.master) {
    new IGInstructor(window.master);
}
