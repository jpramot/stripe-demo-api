# คู่มือการอัพเกรดแผน (Upgrade Plan) ด้วย Stripe Subscription

เอกสารนี้อธิบายขั้นตอนและแนวทางการทำ **อัพเกรดแผนสมาชิก (Subscription)** ด้วย Stripe อย่างละเอียด รวมถึงการจัดการ prorations และการชำระเงิน พร้อมคำแนะนำที่ควรรู้

---

## 1. ความเข้าใจโครงสร้างของ Stripe Subscription

| Entity                | ความหมาย                         |
| --------------------- | -------------------------------- |
| **Product**           | สินค้าหรือบริการ เช่น แผน Basic  |
| **Price**             | ราคาของแผน เช่น 599 บาท/เดือน    |
| **Subscription**      | ข้อมูลการสมัครสมาชิกของผู้ใช้    |
| **Subscription Item** | ตัวเชื่อม Subscription กับ Price |

---

## 2. ดึงข้อมูล Subscription ปัจจุบัน

ก่อนจะอัพเกรดแผน ต้องดึงข้อมูล subscription ปัจจุบันเพื่อใช้สำหรับการอัพเดต โดยเฉพาะ `subscription_item.id` ซึ่งใช้ระบุ item ที่จะเปลี่ยนราคา

```js
const subscription = await stripe.subscriptions.retrieve(subscriptionId);
const subscriptionItemId = subscription.items.data[0].id; // กรณีมีแค่ 1 แผน
const customerId = subscription.customer;
```

---

## 3. ตรวจสอบใบแจ้งหนี้ (Invoice) แบบ Proration Preview

เพื่อแสดงยอดเงินที่จะต้องจ่ายสำหรับส่วนต่างของแผนก่อนอัพเกรด ให้ใช้ฟังก์ชัน **`createPreview`** ของ Stripe

```js
const preview = await stripe.invoices.createPreview({
  customer: customerId,
  subscription: subscriptionId,
  subscription_details: {
    proration_behavior: "create_prorations",
    items: [
      {
        id: subscriptionItemId, // subscription item เดิม
        price: newPriceId, // price ใหม่ที่ต้องการเปลี่ยน
      },
    ],
  },
});

console.log("ยอดเงินที่ต้องจ่าย (prorated):", preview.amount_due / 100, preview.currency);

// ดูรายละเอียดแต่ละบรรทัดใน invoice preview
preview.lines.data.forEach((line) => {
  console.log({
    description: line.description,
    amount: line.amount / 100,
    proration: line.proration,
  });
});
```

---

## 4. อัพเดต Subscription เป็นแผนใหม่

ถ้าผู้ใช้ยอมรับยอดที่ preview แล้ว ให้ทำการอัพเดต subscription ตามนี้

```js
await stripe.subscriptions.update(subscriptionId, {
  items: [
    {
      id: subscriptionItemId,
      price: newPriceId,
    },
  ],
  proration_behavior: "create_prorations",
  billing_cycle_anchor: "unchanged", // รักษาวันเริ่มรอบบิลเดิม
});
```

---

## 5. การชำระเงินและการจัดการ Webhook

Stripe จะสร้าง **invoice สำหรับส่วนต่าง (proration)** และพยายามตัดเงินจากวิธีชำระเงินที่ตั้งไว้โดยอัตโนมัติ

### Event ที่ควรเฝ้าฟังใน Webhook

| Event                           | ความหมาย                                    | การจัดการ                        |
| ------------------------------- | ------------------------------------------- | -------------------------------- |
| `customer.subscription.updated` | ข้อมูล subscription ถูกเปลี่ยน (อัพเกรดแผน) | อัพเดตข้อมูลในระบบฐานข้อมูล      |
| `invoice.created`               | สร้าง invoice ใหม่ (รวม proration)          | เก็บข้อมูลหรือแจ้งเตือนเพิ่มเติม |
| `invoice.payment_succeeded`     | การชำระเงินสำเร็จ                           | เปิดใช้งานแผนใหม่ในระบบ          |
| `invoice.payment_failed`        | การชำระเงินไม่สำเร็จ                        | แจ้งผู้ใช้ให้แก้ไขข้อมูลชำระเงิน |

### ตัวอย่างโค้ด Webhook Handler

```js
app.post("/webhook", express.raw({ type: "application/json" }), (req, res) => {
  const event = stripe.webhooks.constructEvent(
    req.body,
    req.headers["stripe-signature"],
    webhookSecret
  );

  switch (event.type) {
    case "customer.subscription.updated":
      // อัพเดตข้อมูล subscription ในฐานข้อมูล
      break;
    case "invoice.payment_succeeded":
      // บันทึกสถานะจ่ายเงินสำเร็จ และเปิดใช้งานแผนใหม่
      break;
    case "invoice.payment_failed":
      // แจ้งผู้ใช้ให้แก้ไขข้อมูลชำระเงิน
      break;
  }

  res.status(200).end();
});
```

---

## 6. คำแนะนำและข้อควรระวัง

- ใช้ `subscription_item.id` เพื่ออัพเดตราคาของแผนอย่างถูกต้อง
- ควร `preview invoice` ก่อนอัพเกรด เพื่อแจ้งยอดที่ต้องจ่ายแก่ผู้ใช้
- ทำความเข้าใจ `proration_behavior` เพื่อควบคุมการคำนวณส่วนต่างเวลาที่เหลือและเครดิตต่าง ๆ
- ตั้งค่า `billing_cycle_anchor: "unchanged"` เพื่อรักษาวันเริ่มรอบบิลเดิม
- การอัพเกรดแผนจะตัดเงินส่วนต่างทันที (ถ้าใช้ `proration_behavior` แบบ default หรือ `always_invoice`)
- ควรจัดการ Webhook อย่างรัดกุม เพื่อซิงค์สถานะการสมัครสมาชิกและสถานะการชำระเงินในระบบของคุณ

---

### 🔹 สรุปขั้นตอนการอัพเกรดแผน

1. ดึงข้อมูล **subscription ปัจจุบัน**
2. ทำ **preview invoice** แสดงยอดที่ต้องจ่าย (ส่วนต่าง)
3. ถ้าผู้ใช้ยอมรับ, **อัพเดต subscription เป็นแผนใหม่**
4. Stripe สร้าง **invoice** และพยายามตัดเงินอัตโนมัติ
5. **ฟัง Webhook** เพื่อตรวจสอบสถานะการชำระเงิน
6. **อัพเดตสถานะ** ในระบบของคุณตามผลลัพธ์

---
