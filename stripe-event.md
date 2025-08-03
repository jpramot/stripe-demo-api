# Stripe Webhook Events สำคัญกับ Subscription และ Checkout Session (Payment)

---

## 1. `checkout.session.completed`

- **เกิดขึ้นเมื่อ:** ลูกค้าชำระเงินหรือสมัครสมาชิกผ่าน Stripe Checkout สำเร็จสมบูรณ์
- **เกี่ยวข้องกับ:** ทั้ง One-time payment และ Subscription (mode: `"payment"` หรือ `"subscription"`)
- **ข้อมูลสำคัญใน event.data.object:**
  - `id` - id ของ Checkout Session
  - `mode` - `"payment"` หรือ `"subscription"`
  - `payment_intent` (ถ้า mode เป็น payment)
  - `subscription` (ถ้า mode เป็น subscription)
  - `customer` - id ลูกค้า Stripe
- **ใช้งาน:**  
  ใช้ยืนยันว่า payment หรือ subscription ถูกชำระเรียบร้อยแล้ว เพื่อ update ฐานข้อมูลหรือเริ่มกระบวนการต่อ เช่น ให้บริการ หรือเปิดฟีเจอร์

---

## 2. `checkout.session.expired`

- **เกิดขึ้นเมื่อ:** Session ของ Checkout หมดอายุโดยลูกค้าไม่ได้ทำการชำระเงิน
- **เกี่ยวข้องกับ:** Checkout Sessions ทุกรูปแบบ
- **ข้อมูลสำคัญใน event.data.object:**
  - `id` - id ของ Checkout Session ที่หมดอายุ
- **ใช้งาน:**  
  ใช้แจ้งเตือนลูกค้า หรือทำความสะอาดข้อมูลที่เกี่ยวข้องกับ session นั้น ๆ

---

## 3. `invoice.payment_succeeded`

- **เกิดขึ้นเมื่อ:** การชำระเงินของใบแจ้งหนี้สำเร็จ (ใช้กับ Subscription และ Invoice)
- **เกี่ยวข้องกับ:** Subscription billing ทุกรอบ (recurring)
- **ข้อมูลสำคัญใน event.data.object:**
  - `id` - id ของ Invoice
  - `subscription` - id ของ Subscription ที่จ่าย
  - `customer` - id ลูกค้า
  - `amount_paid` - จำนวนเงินที่จ่าย
- **ใช้งาน:**  
  ใช้ยืนยันการรับเงินจากการต่ออายุ subscription หรือ invoice อื่น ๆ เพื่ออัปเดตสถานะในระบบ

---

## 4. `invoice.payment_failed`

- **เกิดขึ้นเมื่อ:** การชำระเงินของใบแจ้งหนี้ล้มเหลว (เช่น บัตรหมดอายุ, ยอดเงินไม่พอ)
- **เกี่ยวข้องกับ:** Subscription billing ทุกรอบ
- **ข้อมูลสำคัญใน event.data.object:**
  - `id` - id ของ Invoice
  - `subscription` - id ของ Subscription ที่จ่ายล้มเหลว
  - `customer` - id ลูกค้า
- **ใช้งาน:**  
  ใช้แจ้งลูกค้าให้อัปเดตข้อมูลการชำระเงิน หรือทำ logic กรณีบล็อก account ชั่วคราว

---

## 5. `customer.subscription.created`

- **เกิดขึ้นเมื่อ:** Subscription ถูกสร้างสำเร็จ
- **ข้อมูลสำคัญใน event.data.object:**
  - `id` - id ของ Subscription
  - `status` - สถานะ subscription เช่น `"active"`, `"trialing"`, `"incomplete"`
  - `current_period_start` / `current_period_end` - ช่วงเวลาการใช้งานปัจจุบัน
- **ใช้งาน:**  
  เก็บข้อมูล subscription ใหม่ในระบบ

---

## 6. `customer.subscription.updated`

- **เกิดขึ้นเมื่อ:** Subscription มีการเปลี่ยนแปลง เช่น เปลี่ยน plan, ยกเลิก หรือ renewal
- **ข้อมูลสำคัญใน event.data.object:**
  - Subscription object ใหม่ (updated state)
- **ใช้งาน:**  
  อัปเดตสถานะ subscription ในระบบ เช่น เปลี่ยนแปลงราคา หรือยกเลิก

---

## 7. `customer.subscription.deleted`

- **เกิดขึ้นเมื่อ:** Subscription ถูกยกเลิกหรือหมดอายุและไม่ต่ออายุแล้ว
- **ข้อมูลสำคัญใน event.data.object:**
  - Subscription object (สถานะมักจะเป็น `"canceled"`)
- **ใช้งาน:**  
  อัปเดตสถานะ subscription ว่าถูกยกเลิก เพื่อหยุดให้บริการ หรือแจ้งลูกค้า

---

## 8. `payment_intent.succeeded`

- **เกิดขึ้นเมื่อ:** PaymentIntent ชำระเงินสำเร็จ
- **เกี่ยวข้องกับ:** การจ่ายเงินทั่วไป (One-time payment) ที่ใช้ PaymentIntent เป็นหลัก
- **ข้อมูลสำคัญใน event.data.object:**
  - `id` - id ของ PaymentIntent
  - `amount` - จำนวนเงินที่จ่าย
  - `status` - `"succeeded"`
- **ใช้งาน:**  
  ยืนยันการชำระเงิน และ update order หรือบริการในระบบ

---

## 9. `payment_intent.payment_failed`

- **เกิดขึ้นเมื่อ:** PaymentIntent ล้มเหลว (บัตรปฏิเสธ, ยอดเงินไม่พอ ฯลฯ)
- **ข้อมูลสำคัญใน event.data.object:**
  - `id` - id ของ PaymentIntent
  - `last_payment_error` - ข้อมูล error
- **ใช้งาน:**  
  แจ้งลูกค้าให้ตรวจสอบข้อมูลบัตร หรือ retry การจ่ายเงิน

---

# ตัวอย่างโค้ดการจัดการ webhook events (Node.js)

```js
switch (event.type) {
  case "checkout.session.completed":
    // เช็ค session.mode เป็น payment หรือ subscription
    // ถ้า payment ใช้ session.payment_intent ไปดึง PaymentIntent
    // ถ้า subscription ใช้ session.subscription ไปดึง Subscription
    break;

  case "checkout.session.expired":
    // แจ้ง session หมดอายุ
    break;

  case "invoice.payment_succeeded":
    // อัปเดตสถานะ subscription / invoice ว่าจ่ายแล้ว
    break;

  case "invoice.payment_failed":
    // แจ้งลูกค้า update บัตร หรือ retry payment
    break;

  case "customer.subscription.created":
  case "customer.subscription.updated":
  case "customer.subscription.deleted":
    // อัปเดตสถานะ subscription ในระบบตามข้อมูล
    break;

  case "payment_intent.succeeded":
    // อัปเดตสถานะการจ่ายเงินทั่วไปสำเร็จ
    break;

  case "payment_intent.payment_failed":
    // แจ้งการจ่ายเงินล้มเหลว
    break;

  default:
  // event อื่นๆ
}
```
