// server/routes/payment.js
const express = require("express");
const fetch = require("node-fetch");

const router = express.Router();

router.post("/initiate", async (req, res) => {
  const { total, items, locationId, address, type, customerEmail } = req.body;

  if (!total || total <= 0) {
    return res.status(400).json({ error: "Invalid total amount" });
  }

  // Example: seller subaccount and platform subaccount
  const sellerSubaccount = process.env.SELLER_SUBACCOUNT || "ACCT_xxxxxxx";
  const platformSubaccount = process.env.PLATFORM_SUBACCOUNT;

  try {
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: customerEmail || "customer@example.com",
        amount: Math.round(total * 100), // convert Rands to Kobo
        currency: "ZAR",
        split: {
          type: "percentage",
          subaccounts: [
            { subaccount: sellerSubaccount, share: 90 },
            { subaccount: platformSubaccount, share: 10 },
          ],
        },
        metadata: {
          items,
          locationId,
          address,
          type,
        },
        callback_url: `${process.env.BASE_URL}/payment/success`,
      }),
    });

    const data = await response.json();

    if (!data || !data.data || !data.data.authorization_url) {
      console.error("Paystack response missing authorization_url:", data);
      return res.status(500).json({ error: "Payment initialization failed" });
    }

    // Send full Paystack data back
    res.json(data.data);
  } catch (err) {
    console.error("Paystack init error:", err);
    res.status(500).json({ error: "Payment initialization failed" });
  }
});

module.exports = router;