// routes/products.js
const express = require("express");
const router = express.Router();
const pool = require("../db");
const multer = require("multer");
const { buckets, uploadFileToBucket, deleteFileFromBucket } = require("../GCS");

// Multer memory storage
const upload = multer({ storage: multer.memoryStorage() });

// ================================
// HELPERS
// ================================

// Parse Postgres text[] literal into JS array (also tolerates plain CSV)
function parsePgArray(input) {
  if (!input) return [];
  if (Array.isArray(input)) return input;
  const str = String(input).trim();
  // If looks like a JSON array -> parse
  if (str.startsWith("[") && str.endsWith("]")) {
    try { return JSON.parse(str); } catch {}
  }
  // If Postgres array literal {a,b}
  const cleaned = str.replace(/^\{|\}$/g, "");
  if (!cleaned) return [];
  return cleaned
    .split(",")
    .map(s => s.replace(/^"|"$/g, "").trim())
    .filter(Boolean);
}

// Safely parse images field (CSV, array, or text[])
function parseImages(imagesField) {
  if (!imagesField) return [];
  if (Array.isArray(imagesField)) return imagesField;

  const str = String(imagesField).trim();

  // JSON array case
  if (str.startsWith("[") && str.endsWith("]")) {
    try {
      const parsed = JSON.parse(str);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {}
  }

  // Postgres array literal case: {"url1","url2"} or {"url"}
  if (str.startsWith("{") && str.endsWith("}")) {
    const cleaned = str.slice(1, -1).trim(); // remove { and }
    if (!cleaned) return [];
    return cleaned
      .split(",")
      .map(s => s.replace(/^"|"$/g, "").trim()) // remove quotes
      .filter(Boolean);
  }

  // Fallback: plain CSV or single URL
  return str.split(",").map(s => s.trim()).filter(Boolean);
}

// Convert JS array to Postgres text[] literal
function toPgArray(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return "{}";
  return `{${arr.map(v => `"${String(v ?? "").replace(/"/g, '\\"')}"`).join(",")}}`;
}

// Accepts either JSON stringified arrays, Postgres array literal, or already arrays
function safeArray(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  const str = String(val).trim();
  // JSON string
  if (str.startsWith("[") && str.endsWith("]")) {
    try {
      const parsed = JSON.parse(str);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch (e) {
      // fallthrough
    }
  }
  // Postgres array literal {a,b}
  return parsePgArray(str);
}

// Ensure numeric array from input
function safeNumberArray(val) {
  return safeArray(val).map(v => {
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  });
}

// ================================
// GET: Fetch all products for a store
// ================================
router.get("/:id/products", async (req, res) => {
  try {
    const { id } = req.params;
    const productsRes = await pool.query(
      "SELECT * FROM products WHERE store_id=$1 ORDER BY id DESC",
      [id]
    );

    const products = productsRes.rows.map(p => ({
      ...p,
      images: parseImages(p.images),
      base_price: p.base_price !== null && p.base_price !== undefined ? parseFloat(p.base_price) : null,
      markup_price: p.markup_price !== null && p.markup_price !== undefined ? parseFloat(p.markup_price) : null,
      variant_names: parsePgArray(p.variant_names),
      variant_base_prices: parsePgArray(p.variant_base_prices).map(Number),
      variant_markup_price: parsePgArray(p.variant_markup_price).map(Number),
      variant_images: parsePgArray(p.variant_images),
      variants_stock: parsePgArray(p.variants_stock).map(Number),
      variant1_name: p.variant1_name || "",
    }));

    res.json({ products });
  } catch (err) {
    console.error("❌ Error fetching products:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ================================
// POST: Add new product with variants
// ================================
router.post("/:id/products", upload.fields([
  { name: "images" },
  { name: "variant_images" },
]), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, base_price, stock, description, category,
      variant_names, variant_base_prices, variant_markup_prices, variants_stock, variant1_name
    } = req.body;

    // Normalize arrays (frontend sends JSON.stringify([...]) in FormData)
    // Ensure arrays from formData JSON
    const parsedVariantNames = JSON.parse(variant_names || "[]");
    const parsedVariantBasePrices = JSON.parse(variant_base_prices || "[]").map(Number);
    const parsedVariantMarkupPrices = JSON.parse(variant_markup_prices || "[]").map(Number);
    const parsedVariantsStock = JSON.parse(variants_stock || "[]").map(Number);

    // Files
    const productFiles = req.files?.images || [];
    const variantFiles = req.files?.variant_images || [];

    if (!productFiles.length) return res.status(400).json({ error: "At least one product image is required." });

    // Upload main images to GCS
    const uploadedImages = [];
    for (const file of productFiles) {
      const url = await uploadFileToBucket(file, buckets.storeProducts);
      uploadedImages.push(url);
    }

    // Upload variant images to GCS, align with variant names length
    const uploadedVariantImages = [];
    for (let i = 0; i < parsedVariantNames.length; i++) {
      const file = variantFiles[i];
      uploadedVariantImages.push(file ? await uploadFileToBucket(file, buckets.storeProducts) : "");
    }

    // Calculate markup for base (if provided)
    const markup_percentage = 10;
    const basePriceNum = base_price !== undefined && base_price !== null && base_price !== "" ? parseFloat(base_price) : null;
    const markup_price = basePriceNum !== null ? +(basePriceNum + basePriceNum * (markup_percentage / 100)).toFixed(2) : null;

    // Compute final variant markup prices (ensure numeric)
    const variantMarkupPricesFinal = parsedVariantBasePrices.map((v, i) => {
      const baseN = (v !== null && v !== undefined) ? Number(v) : 0;
      const provided = parsedVariantMarkupPrices[i];
      if (provided !== null && provided !== undefined) return Number(provided);
      return Number((baseN + baseN * (markup_percentage / 100)).toFixed(2));
    });

    // Prepare insert values - use toPgArray for arrays (images, variant arrays)
    const insertQuery = `
      INSERT INTO products
      (store_id, name, variant1_name, base_price, markup_price, markup_percentage, stock, description, category, images,
       variant_names, variant_base_prices, variant_markup_price, variant_images, variants_stock)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
      RETURNING *;
    `;

    const insertValues = [
      id,
      name,
      variant1_name || name,
      basePriceNum,
      markup_price,
      markup_percentage,
      stock !== undefined && stock !== null && stock !== "" ? Number(stock) : 0,
      description,
      category,
      toPgArray(uploadedImages),
      toPgArray(parsedVariantNames),
      toPgArray(parsedVariantBasePrices.map(v => v === null ? 0 : v)),
      toPgArray(variantMarkupPricesFinal),
      toPgArray(uploadedVariantImages),
      toPgArray(parsedVariantsStock)
    ];

    const result = await pool.query(insertQuery, insertValues);
    const created = result.rows[0];

    res.json({
      product: {
        ...created,
        images: uploadedImages,
        variant_names: parsedVariantNames,
        variant_base_prices: parsedVariantBasePrices,
        variant_markup_price: variantMarkupPricesFinal.map(Number),
        variant_images: uploadedVariantImages,
        variants_stock: parsedVariantsStock,
        variant1_name: variant1_name || name,
      },
    });
  } catch (err) {
    console.error("❌ Error adding product with variants:", err);
    res.status(500).json({ error: "Failed to add product" });
  }
});

// ================================
// PUT: Update product + variants
// ================================
router.put("/:storeId/products/:productId", upload.fields([
  { name: "images" },
  { name: "variant_images" },
]), async (req, res) => {
  try {
    const { storeId, productId } = req.params;
    const {
      name, base_price, stock, description, category,
      variant_names, variant_base_prices, variant_markup_prices, variants_stock, variant1_name,
      deletedImages, deletedVariantImages
    } = req.body;

    const deletedImgs = JSON.parse(deletedImages || "[]");
    const deletedVarImgs = JSON.parse(deletedVariantImages || "[]");

    const currentRes = await pool.query(
      "SELECT * FROM products WHERE id=$1 AND store_id=$2",
      [productId, storeId]
    );
    if (!currentRes.rows.length) return res.status(404).json({ error: "Product not found" });

    const row = currentRes.rows[0];
    const currentImages = parseImages(row.images);
    const currentVariantImages = parseImages(row.variant_images);

    // Delete old images from GCS if requested
    for (const url of [...deletedImgs, ...deletedVarImgs]) {
      if (url) {
        try { await deleteFileFromBucket(buckets.storeProducts, url); } catch (e) { /* ignore */ }
      }
    }

    // Upload new files (if any)
    const newMainFiles = req.files?.images || [];
    const newVarFiles = req.files?.variant_images || [];

    const uploadedMain = [];
    for (const f of newMainFiles) uploadedMain.push(await uploadFileToBucket(f, buckets.storeProducts));

    const uploadedVar = [];
    for (const f of newVarFiles) uploadedVar.push(await uploadFileToBucket(f, buckets.storeProducts));

    const finalImages = [...currentImages.filter(i => !deletedImgs.includes(i)), ...uploadedMain];
    const finalVariantImages = [...currentVariantImages.filter(i => !deletedVarImgs.includes(i)), ...uploadedVar];

    // Normalize incoming arrays
    const parsedVariantNames = safeArray(variant_names);
    const parsedVariantBasePrices = safeNumberArray(variant_base_prices);
    const parsedVariantMarkupPrices = safeNumberArray(variant_markup_prices);
    const parsedVariantsStock = safeNumberArray(variants_stock).map(v => v === null ? 0 : v);

    const markup_percentage = 10;
    const basePriceNum = base_price !== undefined && base_price !== null && base_price !== "" ? parseFloat(base_price) : null;
    const markup_price = basePriceNum !== null ? +(basePriceNum + basePriceNum * (markup_percentage / 100)).toFixed(2) : null;

    const variantMarkupPricesFinal = parsedVariantBasePrices.map((v, i) => {
      const baseN = (v !== null && v !== undefined) ? Number(v) : 0;
      const provided = parsedVariantMarkupPrices[i];
      if (provided !== null && provided !== undefined) return Number(provided);
      return Number((baseN + baseN * (markup_percentage / 100)).toFixed(2));
    });

    const updateQuery = `
      UPDATE products
      SET name=$1, variant1_name=$2, base_price=$3, markup_price=$4, markup_percentage=$5, stock=$6,
          description=$7, category=$8, images=$9,
          variant_names=$10, variant_base_prices=$11, variant_markup_price=$12, variant_images=$13, variants_stock=$14
      WHERE id=$15 AND store_id=$16
      RETURNING *;
    `;

    const updateValues = [
      name,
      variant1_name || name,
      basePriceNum,
      markup_price,
      markup_percentage,
      stock !== undefined && stock !== null && stock !== "" ? Number(stock) : 0,
      description,
      category,
      toPgArray(finalImages),
      toPgArray(parsedVariantNames),
      toPgArray(parsedVariantBasePrices.map(v => v === null ? 0 : v)),
      toPgArray(variantMarkupPricesFinal),
      toPgArray(finalVariantImages),
      toPgArray(parsedVariantsStock),
      productId,
      storeId
    ];

    const result = await pool.query(updateQuery, updateValues);

    res.json({
      product: {
        ...result.rows[0],
        images: finalImages,
        variant_names: parsedVariantNames,
        variant_base_prices: parsedVariantBasePrices,
        variant_markup_price: variantMarkupPricesFinal.map(Number),
        variant_images: finalVariantImages,
        variants_stock: parsedVariantsStock,
        variant1_name: variant1_name || name,
      }
    });
  } catch (err) {
    console.error("❌ Error updating product:", err);
    res.status(500).json({ error: "Failed to update product" });
  }
});

// ================================
// DELETE: Remove product and its images
// ================================
router.delete("/:storeId/products/:productId", async (req, res) => {
  try {
    const { storeId, productId } = req.params;

    const productRes = await pool.query(
      "SELECT * FROM products WHERE id=$1 AND store_id=$2",
      [productId, storeId]
    );
    if (!productRes.rows.length) return res.status(404).json({ error: "Product not found" });

    const product = productRes.rows[0];

    const mainImages = parseImages(product.images);
    const variantImages = parseImages(product.variant_images);
    const allImages = [...mainImages, ...variantImages].filter(Boolean);

    for (const url of allImages) {
      try { await deleteFileFromBucket(buckets.storeProducts, url); } catch (err) { /* ignore */ }
    }

    await pool.query("DELETE FROM products WHERE id=$1 AND store_id=$2", [
      productId,
      storeId,
    ]);

    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting product:", err);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

module.exports = router;