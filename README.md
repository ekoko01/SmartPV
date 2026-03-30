# PV Smart

เว็บแอป Django สำหรับคำนวณราคาและคะแนน PV แบบสด โดยออกแบบหน้าจอให้คล้ายเครื่องมือขายในภาพอ้างอิง

## Visual thesis

Operational green-tech cockpit ที่สะอาด คม และดูน่าเชื่อถือ เหมือนเครื่องมือขายจริง

## Content plan

- hero/app shell
- พื้นที่คำนวณสินค้า
- พื้นที่สรุปยอดและคะแนน
- action สำหรับเริ่มออเดอร์ใหม่

## Interaction thesis

- แถวสินค้า reveal แบบ staggered ตอนโหลดหน้า
- ยอดรวมและคะแนนรวม animate ทุกครั้งที่มีการเปลี่ยนจำนวน
- แผงสรุปฝั่งขวา sticky บน desktop

## Setup

1. สร้าง virtual environment และติดตั้ง dependencies
2. คัดลอก `.env.example` เป็น `.env`
3. ใส่ค่าฐานข้อมูล PostgreSQL
4. รัน `python manage.py migrate`
5. รัน `python manage.py runserver`

ถ้ายังไม่ได้ตั้งค่า PostgreSQL ระบบจะ fallback ไปใช้ SQLite ชั่วคราวเพื่อให้หน้าเดโมเปิดได้ทันที

## Deploy

โปรเจกต์ถูกเตรียมให้ deploy กับ Render ได้แล้วผ่าน `render.yaml` และรองรับ `DATABASE_URL` สำหรับ PostgreSQL บน production
