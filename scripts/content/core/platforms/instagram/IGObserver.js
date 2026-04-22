/**
 * IGObserver - หน่วยสอดแนมเฉพาะสำหรับหน้าเว็บ Instagram
 * ทำหน้าที่ค้นหาโพสต์และสกัดข้อมูลเบื้องต้นจาก DOM
 */
class IGObserver extends BaseObserver {
    constructor(dataCenter, instructor) {
        super(dataCenter, instructor);
        this.discoverySet = new Set(); // ป้องกันการสแกนโพสต์เดิมซ้ำใน Session นี้
        this.selectors = {
            tiles: 'a[href*="/p/"], a[href*="/reel/"]', // ลิงก์ไปยังหน้าโพสต์หรือเรีล
            postOwner: 'header a[href^="/"][role="link"], span > a[href^="/"][role="link"]', // ชื่อเจ้าของโพสต์
            realCaption: 'article div[dir="auto"] > span, article h1' // ข้อความบรรยายโพสต์
        };
    }

    /**
     * เริ่มการเฝ้าดูการเปลี่ยนแปลงของหน้าจอ (Real-time Discovery)
     */
    start() {
        this.scan(document.body); // สแกนครั้งแรกทันทีที่โหลด
        
        // ใช้ MutationObserver เพื่อตรวจจับโพสต์ใหม่ๆ ที่โหลดเข้ามาตอนเรา Scroll
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) this.scan(node); // สแกนเฉพาะ Element ที่เพิ่มมาใหม่
                });
            }
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
        console.log("[IGObserver] Passive Scanning Activated");
    }

    /**
     * ค้นหาโพสต์จาก Element ที่ระบุ และส่งงานเบื้องต้นให้ Instructor
     */
    scan(root) {
        const tiles = root.querySelectorAll(this.selectors.tiles);
        tiles.forEach(tile => {
            const href = tile.getAttribute('href');
            if (!href || this.discoverySet.has(href)) return;

            // 1. สกัดข้อมูลพื้นฐานที่หาได้ทันที (Shell Discovery)
            let user = "";
            const container = tile.closest('article') || tile.parentElement;
            const userLink = container.querySelector(this.selectors.postOwner);
            if (userLink) user = userLink.getAttribute('href').split('/').filter(p => p)[0];

            // ตรวจสอบกรณีที่เป็นหน้าโปรไฟล์ตัวเอง/คนอื่น (ดึงจาก URL)
            const pathParts = window.location.pathname.split('/').filter(p => p);
            if (pathParts.length === 1 && !['explore', 'reels'].includes(pathParts[0])) user = pathParts[0];

            // 2. ตรวจสอบสถานะและส่งเข้าคิวงาน
            const existing = this.dataCenter.getPost(href);
            if (!existing || existing.status !== 'completed') {
                this.dataCenter.updatePost(href, { user, status: 'discovered' });
                this.instructor.enqueue(href); // ส่งงานให้ Commander จัดการต่อ
                this.discoverySet.add(href);
            }
        });
    }

    /**
     * ชิงจังหวะสกัดข้อมูลแบบละเอียด (Full Extraction) เมื่อโพสต์ถูกเปิดเต็มจอ
     */
    async fillCurrentPost(href) {
        const article = document.querySelector('article[role="presentation"], article');
        if (!article) return null;

        const capEl = article.querySelector(this.selectors.realCaption);
        const userLink = article.querySelector(this.selectors.postOwner);
        
        const user = userLink ? userLink.getAttribute('href').split('/').filter(p => p)[0] : "someone";
        const caption = capEl ? capEl.innerText.trim() : "";

        // อัปเดตฐานข้อมูลด้วยเนื้อหาที่สมบูรณ์ 100%
        return this.dataCenter.updatePost(href, { user, caption, status: 'completed' });
    }
}
