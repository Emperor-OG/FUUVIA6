const { Storage } = require("@google-cloud/storage");

// --- Build credentials object ---
const credentials = {
  type: "service_account",
  project_id: process.env.GCP_PROJECT_ID,
  private_key_id: process.env.GCP_PRIVATE_KEY_ID,
  private_key: process.env.GCP_PRIVATE_KEY ? process.env.GCP_PRIVATE_KEY.replace(/\\n/g, "\n") : undefined,
  client_email: process.env.GCP_CLIENT_EMAIL,
  client_id: process.env.GCP_CLIENT_ID,
  auth_uri: process.env.GCP_AUTH_URI,
  token_uri: process.env.GCP_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.GCP_AUTH_PROVIDER_CERT_URL,
  client_x509_cert_url: process.env.GCP_CLIENT_CERT_URL,
};

// --- Initialize storage ---
const storage = new Storage({
  credentials,
  projectId: process.env.GCP_PROJECT_ID,
});

// --- Safe bucket getter ---
function getBucket(envVar) {
  const bucketName = process.env[envVar];
  if (!bucketName) {
    console.warn(`⚠️ Bucket env var ${envVar} not set. Bucket will be null.`);
    return null;
  }
  return storage.bucket(bucketName);
}

// --- Buckets object (lazy-loaded) ---
const buckets = {
  storeProducts: getBucket("STORE_PRODUCTS"),
  storeLogos: getBucket("STORE_LOGOS"),
  storeBanners: getBucket("STORE_BANNERS"),
  storeDocuments: getBucket("STORE_DOCUMENTS"),
  storePOA: getBucket("STORE_POA"),
  proof_of_residence: getBucket("PROOF_OF_RESIDENCE"),
};

// --- Upload file ---
async function uploadFileToBucket(file, bucket) {
  if (!bucket || typeof bucket.file !== "function") {
    throw new Error("Invalid bucket provided to uploadFileToBucket()");
  }

  const blob = bucket.file(`${Date.now()}-${file.originalname}`);
  const blobStream = blob.createWriteStream({ resumable: false, contentType: file.mimetype });

  return new Promise((resolve, reject) => {
    blobStream.on("error", reject);
    blobStream.on("finish", () => {
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
      console.log(`Uploaded to ${bucket.name}: ${blob.name}`);
      resolve(publicUrl);
    });
    blobStream.end(file.buffer);
  });
}

// --- Delete file ---
async function deleteFileFromBucket(bucket, fileUrl) {
  try {
    if (!bucket || !fileUrl) return;
    const parts = fileUrl.split("/");
    const fileName = decodeURIComponent(parts.slice(4).join("/"));
    await bucket.file(fileName).delete();
    console.log(`Deleted file: ${fileName}`);
  } catch (err) {
    if (err.code === 404) console.log("File not found, skipping delete...");
    else console.error("Delete failed:", err);
  }
}

module.exports = { buckets, uploadFileToBucket, deleteFileFromBucket };

