/**
 * BaseObserver - Interface for all platform scanners
 */
class BaseObserver {
    constructor(dataCenter, instructor) {
        this.dataCenter = dataCenter;
        this.instructor = instructor;
    }

    // ทุก Observer ต้องมีจุดเริ่มต้น
    start() { throw new Error("Method 'start()' must be implemented."); }
    
    // ทุก Observer ต้องสแกนเป็น
    scan(root) { throw new Error("Method 'scan()' must be implemented."); }
    
    // ทุก Observer ต้องสามารถเติมข้อมูลเชิงลึกได้
    async fillCurrentPost(href) { throw new Error("Method 'fillCurrentPost()' must be implemented."); }
}
