/**
 * IGDataCenter - ระบบจัดการข้อมูลเฉพาะสำหรับ Instagram v2.2.5
 * ทำหน้าที่สกัดชื่อผู้ใช้และ Hashtag เพื่อทำระบบ Suggestion
 */
class IGDataCenter extends BaseDataCenter {
    constructor() {
        super();
    }

    /**
     * สกัดข้อมูลจากฐานข้อมูลโพสต์ (Master Record) เพื่ออัปเดตระบบดัชนี (Indexing)
     * ข้อมูลที่ได้จะนำไปโชว์ใน Suggestion ของหน้า UI
     */
    async sync() {
        // ดึงโพสต์ล่าสุด 500 รายการมาวิเคราะห์
        const allPosts = Array.from(this.posts.values()).slice(-500);
        const userSet = new Set();
        const hashSet = new Set();
        const hashtagRegex = /#([a-zA-Z0-9_ก-๙]+)/g; // Regex สำหรับ Hashtag ภาษาไทยและอังกฤษ

        allPosts.forEach(p => {
            // 1. เก็บชื่อผู้ใช้ (User)
            if (p.user) userSet.add(p.user.toLowerCase());
            
            // 2. สกัด Hashtag จาก Caption
            if (p.caption) {
                let match;
                while ((match = hashtagRegex.exec(p.caption)) !== null) {
                    hashSet.add(match[1].toLowerCase());
                }
            }
        });

        // บันทึกลง Storage แยกเป็นหมวดหมู่เพื่อให้ Popup ดึงไปใช้ได้เร็ว
        await chrome.storage.local.set({ 
            all_posts: allPosts,
            all_user: Array.from(userSet).slice(0, 500),
            all_hashtag: Array.from(hashSet).slice(0, 500)
        });
    }
}
