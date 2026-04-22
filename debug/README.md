# 🛠 Doomscroll Bot Debug Logs

เนื่องจาก Chrome Extension ไม่สามารถเขียนไฟล์ลง Folder นี้ได้โดยตรง (Security Sandbox) 

### 📂 วิธีใช้งาน:
1. พิมพ์ `await doom.export()` ใน Console ของ Extension
2. นำไฟล์ที่ได้มาวางใน Folder นี้ หรือสร้างไฟล์ใหม่ชื่อ `all_data.json` แล้วนำเนื้อหามาใส่
3. คุณสามารถใช้ข้อมูลในนี้เพื่อวิเคราะห์พฤติกรรมของ Bot หรือตรวจสอบความผิดพลาดได้

---
**Structure:**
- `all_data.json`: ข้อมูลที่สแกนเจอและสถานะล่าสุด
- `error_logs.json`: StackTrace ของปัญหาที่พบ
