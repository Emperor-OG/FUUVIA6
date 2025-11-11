// server/routes/market.js
const express = require("express");
const router = express.Router();
const pool = require("../db");
const multer = require("multer");
const { buckets, uploadFileToBucket } = require("../GCS");

// ------------------------
// Multer setup (Memory Storage for GCS Uploads)
// ------------------------
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
});

const uploadFields = upload.fields([
  { name: "banner", maxCount: 1 },
  { name: "logo", maxCount: 1 },
  { name: "compliance", maxCount: 1 },
  { name: "poa", maxCount: 1 },
  { name: "proofOfResidence", maxCount: 1 },
]);

// ------------------------
// POST /api/stores - Create Store
// ------------------------
router.post("/", uploadFields, async (req, res) => {
  try {
    // Identify user email from auth or session
    const userEmail = req.user?.email || req.session?.user?.email;
    if (!userEmail) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    const {
      storeName,
      storeOwner,
      cellNumber,
      secondaryNumber,
      email,
      country,
      street,
      suburb,
      province,
      city,
      postalCode,
      description,
      bankName,
      branchCode,
      accountHolder,
      accountNumber,
      accountType,
    } = req.body;

    // ------------------------
    // Upload files to GCS
    // ------------------------
    const bannerUrl = req.files?.banner?.[0]
      ? await uploadFileToBucket(req.files.banner[0], buckets.storeBanners)
      : null;

    const logoUrl = req.files?.logo?.[0]
      ? await uploadFileToBucket(req.files.logo[0], buckets.storeLogos)
      : null;

    const complianceUrl = req.files?.compliance?.[0]
      ? await uploadFileToBucket(req.files.compliance[0], buckets.storeDocuments)
      : null;

    const poaUrl = req.files?.poa?.[0]
      ? await uploadFileToBucket(req.files.poa[0], buckets.storePOA)
      : null;

    const proofOfResidenceUrl = req.files?.proofOfResidence?.[0]
      ? await uploadFileToBucket(req.files.proofOfResidence[0], buckets.proof_of_residence)
      : null;

    // ------------------------
    // Insert store record
    // ------------------------
    const result = await pool.query(
      `INSERT INTO stores (
        store_name, store_owner, cell_number, secondary_number, email, country,
        street, suburb, province, city, postal_code, description,
        bank_name, branch_code, account_holder, account_number, account_type,
        banner_url, logo_url, compliance_url, poa_url, proof_of_residence_url,
        admin1
      ) VALUES (
        $1,$2,$3,$4,$5,$6,
        $7,$8,$9,$10,$11,$12,
        $13,$14,$15,$16,$17,
        $18,$19,$20,$21,$22,
        $23
      )
      RETURNING *`,
      [
        storeName,
        storeOwner,
        cellNumber,
        secondaryNumber || null,
        email,
        country,
        street,
        suburb || null,
        province,
        city,
        postalCode,
        description,
        bankName,
        branchCode,
        accountHolder,
        accountNumber,
        accountType,
        bannerUrl,
        logoUrl,
        complianceUrl,
        poaUrl,
        proofOfResidenceUrl,
        userEmail.trim().toLowerCase(),
      ]
    );

    return res.json({ success: true, store: result.rows[0] });
  } catch (err) {
    console.error("❌ Error inserting store:", err.message);
    console.error(err.stack);
    return res.status(500).json({ success: false, error: "Server error" });
  }
});

// ------------------------
// GET /api/stores - Fetch all stores
// ------------------------
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM stores ORDER BY id ASC");
    res.json({ success: true, stores: result.rows });
  } catch (err) {
    console.error("❌ Error fetching stores:", err.message);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// ------------------------
// GET /api/stores/my - Fetch stores for logged-in user
// ------------------------
router.get("/my", async (req, res) => {
  try {
    const userEmail = req.user?.email || req.session?.user?.email;
    if (!userEmail) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    const result = await pool.query(
      `SELECT * FROM stores
       WHERE $1 = ANY(ARRAY[
         admin1, admin2, admin3, admin4, admin5, admin6, admin7, admin8, admin9, admin10
       ])
       ORDER BY id ASC`,
      [userEmail.trim().toLowerCase()]
    );

    res.json({ success: true, stores: result.rows });
  } catch (err) {
    console.error("❌ Error fetching user stores:", err.message);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

module.exports = router;