/**
 * ฟังก์ชันหน่วงเวลา (Sleep) แบบใช้ Promise
 * @param {number} ms - จำนวนมิลลิวินาทีที่ต้องการรอ
 */
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/**
 * ฟังก์ชันสุ่มตัวเลขระหว่าง a ถึง b
 * ใช้สำหรับสุ่มเวลาหรือพิกัดเพื่อให้ Bot ดูเป็นธรรมชาติ
 */
const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

/**
 * ตรวจสอบว่าหน้าปัจจุบันของ Instagram รองรับการทำงานของ Bot หรือไม่
 * รองรับ: หน้าโปรไฟล์ทั่วไป, หน้า Explore, และหน้า Saved
 */
function isSupportedPage() {
    const path = window.location.pathname;
    const isHome = path === '/' || path === '';
    const isExplore = path.startsWith('/explore');
    const isSaved = path.includes('/saved/');
    const reservedPaths = ['/reels/', '/direct/', '/accounts/', '/emails/', '/legal/', '/privacy/'];
    const isReserved = reservedPaths.some(p => path.startsWith(p));
    return isExplore || (!isHome && !isReserved) || isSaved;
}

/**
 * จำลองการคลิกเมาส์แบบมนุษย์ (Human Click)
 * มีการสุ่มพิกัด (X, Y) ภายในขอบเขตของปุ่ม เพื่อหลบเลี่ยงการตรวจจับ
 */
async function humanClick(el, running) {
    if (!el || !running) return;
    const rect = el.getBoundingClientRect();
    
    // สุ่มพิกัดคลิกให้อยู่ในช่วง 30% - 70% ของพื้นที่ปุ่ม
    const x = rect.left + rect.width * (0.3 + Math.random() * 0.4);
    const y = rect.top + rect.height * (0.3 + Math.random() * 0.4);
    
    const eventInit = { bubbles: true, cancelable: true, view: window, clientX: x, clientY: y, buttons: 1 };
    
    // จำลองขั้นตอนการกดปุ่ม (Down -> Wait -> Up -> Click)
    el.dispatchEvent(new MouseEvent('mousedown', eventInit));
    await sleep(rand(50, 120)); // หน่วงเวลาตอนกดค้างเล็กน้อย
    el.dispatchEvent(new MouseEvent('mouseup', eventInit));
    el.dispatchEvent(new MouseEvent('click', eventInit));
}

/**
 * จำลองการเลื่อนหน้าจอ (Smooth Scroll)
 * เลื่อน Element เป้าหมายมาไว้กลางหน้าจออย่างนุ่มนวล
 */
async function humanScrollTo(el, running) {
    if (!el || !running) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await sleep(rand(600, 900)); // รอให้การเลื่อนหน้าจอเสร็จสมบูรณ์
}
