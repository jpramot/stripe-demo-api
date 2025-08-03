# Stripe Objects

---

## 1. Checkout Session

### คืออะไร?

Checkout Session คือ object ที่ Stripe สร้างขึ้นเพื่อใช้เป็น “หน้าจ่ายเงินสำเร็จรูป” (Hosted Checkout Page) สำหรับลูกค้า  
โดย Session จะรวมข้อมูลเกี่ยวกับรายการสินค้า (line items), วิธีการชำระเงิน, subscription หรือการจ่ายเงินแบบครั้งเดียว (one-time payment) ไว้ในที่เดียว

### ใช้งานอย่างไร?

- สร้าง Checkout Session เพื่อให้ลูกค้าเข้าไปกรอกข้อมูลบัตรและชำระเงินบนหน้า Stripe-hosted checkout
- Session จะมีสถานะ lifecycle เช่น `open`, `complete`, `expired`
- สามารถสร้างแบบ Payment (ครั้งเดียว) หรือ Subscription (สมัครสมาชิกแบบ recurring)

### ข้อมูลสำคัญใน Session

- `id` — รหัส Session ใช้ยืนยันและดึงข้อมูล
- `mode` — `"payment"` (one-time) หรือ `"subscription"`
- `payment_intent` — id PaymentIntent (ถ้า mode = payment)
- `subscription` — id Subscription (ถ้า mode = subscription)
- `customer` — id ลูกค้า Stripe
- `line_items` — รายการสินค้า/บริการ

### ตัวอย่างการใช้งาน

- ลูกค้าคลิกปุ่ม “ชำระเงิน” → สร้าง Session → Redirect ลูกค้าไปหน้า Stripe Checkout
- รอ webhook event `checkout.session.completed` เพื่อยืนยันการชำระเงิน

---

## 2. PaymentIntent

### คืออะไร?

PaymentIntent คือ object ที่ Stripe ใช้จัดการกระบวนการชำระเงินของลูกค้า (One-time Payment)  
มันช่วยติดตามสถานะการชำระเงินตั้งแต่เริ่มจนจบ (เช่น `requires_payment_method`, `processing`, `succeeded` หรือ `failed`)

### ทำไมต้องใช้?

- รองรับการทำ 3D Secure, การยืนยันตัวตนหลายขั้นตอน
- ลดปัญหาการจ่ายเงินไม่สมบูรณ์
- รองรับการ retry การจ่ายใหม่

### ข้อมูลสำคัญ

- `id` — รหัส PaymentIntent
- `amount` — จำนวนเงินที่จะเก็บ
- `currency` — สกุลเงิน
- `status` — สถานะปัจจุบัน เช่น `"requires_payment_method"`, `"succeeded"`, `"canceled"`
- `payment_method` — วิธีการจ่ายเงิน เช่น บัตรเครดิต

### ตัวอย่างการใช้งาน

- สร้าง PaymentIntent เพื่อเก็บข้อมูลจ่ายเงิน
- ส่งข้อมูลไป frontend เพื่อให้ลูกค้ากรอกข้อมูลบัตร
- ติดตามสถานะผ่าน webhook เช่น `payment_intent.succeeded`, `payment_intent.payment_failed`

---

## 3. Customer

### คืออะไร?

Customer คือ object ที่แทนตัวลูกค้าของเราในระบบ Stripe  
ใช้เก็บข้อมูล เช่น อีเมล, บัตรเครดิต, การตั้งค่าการชำระเงิน, ประวัติการจ่ายเงิน

### ประโยชน์

- เก็บข้อมูลลูกค้าครั้งเดียว ใช้ซ้ำได้
- เก็บบัตรเครดิตเพื่อจ่ายซ้ำ (เช่น subscription หรือ one-click payment)
- ติดตามประวัติการสั่งซื้อและใบแจ้งหนี้

### ข้อมูลสำคัญ

- `id` — รหัสลูกค้าใน Stripe
- `email` — อีเมลลูกค้า
- `default_payment_method` — วิธีจ่ายเงินหลัก (เช่น บัตรเครดิต)
- `invoice_settings` — การตั้งค่าใบแจ้งหนี้

### ตัวอย่างการใช้งาน

- สร้าง Customer ตอนลูกค้าลงทะเบียนหรือชำระเงินครั้งแรก
- ผูก PaymentMethod กับ Customer เพื่อเก็บบัตรไว้ใช้ครั้งถัดไป
- ใช้ Customer ID เพื่อสร้าง Subscription หรือส่งใบแจ้งหนี้

---

## 4. Subscription

### คืออะไร?

Subscription คือ object ที่เก็บข้อมูลการสมัครสมาชิก (Recurring Payment)  
มีข้อมูลเรื่องแผนบริการ (Plan/Price), ระยะเวลาการชำระเงิน, สถานะ และประวัติการต่ออายุ

### ข้อมูลสำคัญ

- `id` — รหัส Subscription
- `customer` — id ลูกค้า
- `status` — สถานะ เช่น `"active"`, `"past_due"`, `"canceled"`
- `items` — รายการ Plan/Price ที่สมัคร
- `current_period_start` / `current_period_end` — ช่วงเวลาการใช้งานปัจจุบัน

### ตัวอย่างการใช้งาน

- สร้าง Subscription โดยระบุ Customer และ Price ID
- ระบบ Stripe จะเรียกเก็บเงินตามรอบที่กำหนดอัตโนมัติ
- ใช้ webhook เพื่ออัปเดตสถานะ subscription ในระบบเรา

---

## 5. Invoice

### คืออะไร?

Invoice คือใบแจ้งหนี้ที่ Stripe สร้างขึ้นเพื่อเรียกเก็บเงินลูกค้า  
ใช้สำหรับ Subscription, One-time Invoice หรือ Billing อื่น ๆ

### ข้อมูลสำคัญ

- `id` — รหัส Invoice
- `customer` — ลูกค้าที่จะถูกเรียกเก็บเงิน
- `subscription` — Subscription ที่เกี่ยวข้อง (ถ้ามี)
- `amount_due` — ยอดเงินที่ต้องชำระ
- `status` — เช่น `"open"`, `"paid"`, `"void"`

### ตัวอย่างการใช้งาน

- ตรวจสอบสถานะ invoice ผ่าน webhook เช่น `invoice.payment_succeeded`, `invoice.payment_failed`
- ส่งใบแจ้งหนี้ให้ลูกค้าทางอีเมล

---

## 6. PaymentMethod

### คืออะไร?

PaymentMethod คือวิธีการชำระเงินของลูกค้า เช่น บัตรเครดิต, บัตรเดบิต, Wallet ต่าง ๆ  
สามารถผูกกับ Customer หรือใช้แบบชั่วคราว

### ข้อมูลสำคัญ

- `id` — รหัส PaymentMethod
- `type` — ประเภท เช่น `"card"`, `"bank_account"`
- `card` — ข้อมูลบัตร เช่น ยี่ห้อ, 4 หลักสุดท้าย

### ตัวอย่างการใช้งาน

- ผูก PaymentMethod กับ Customer
- ใช้ PaymentMethod ในการสร้าง PaymentIntent หรือ Subscription

---

# สรุปความสัมพันธ์ของ Object

| Object           | ความหมาย/หน้าที่                        | เชื่อมโยงกับ                                  |
| ---------------- | --------------------------------------- | --------------------------------------------- |
| Customer         | ลูกค้าในระบบ Stripe                     | PaymentMethod, Subscription, Invoice, Session |
| PaymentMethod    | วิธีการชำระเงิน                         | Customer, PaymentIntent                       |
| PaymentIntent    | ตัวแทนการชำระเงิน (One-time payment)    | Session, PaymentMethod                        |
| Checkout Session | หน้า Checkout ที่ Stripe สร้างให้ลูกค้า | PaymentIntent, Subscription, Customer         |
| Subscription     | ข้อมูลการสมัครสมาชิกแบบรายเดือน/ปี      | Customer, Invoice                             |
| Invoice          | ใบแจ้งหนี้สำหรับการชำระเงิน             | Subscription, Customer                        |

---
