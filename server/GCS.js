const { Storage } = require("@google-cloud/storage");

// --- Safety checks for required env vars ---
const required = [
  "GCP_PROJECT_ID",
  "GCP_PRIVATE_KEY",
  "GCP_CLIENT_EMAIL",
  "STORE_PRODUCTS",
  "STORE_LOGOS",
  "STORE_BANNERS",
  "STORE_DOCUMENTS",
  "STORE_POA",
  "PROOF_OF_RESIDENCE",
];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`❌ Missing required environment variable: ${key}`);
    process.exit(1); // fail fast
  }
}

// --- Build credentials object ---
const credentials = {
  type: "service_account",
  project_id: process.env.GCP_PROJECT_ID,
  private_key_id: process.env.GCP_PRIVATE_KEY_ID,
  private_key: process.env.GCP_PRIVATE_KEY.replace(/\\n/g, "\n"),
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

// --- Buckets ---
const buckets = {
  profile: process.env.PROFILE_PICTURES ? storage.bucket(process.env.PROFILE_PICTURES) : null,
  image: process.env.IMAGES ? storage.bucket(process.env.IMAGES) : null,
  video: process.env.VIDEOS ? storage.bucket(process.env.VIDEOS) : null,

  storeProducts: storage.bucket(process.env.STORE_PRODUCTS),
  storeLogos: storage.bucket(process.env.STORE_LOGOS),
  storeBanners: storage.bucket(process.env.STORE_BANNERS),
  storeDocuments: storage.bucket(process.env.STORE_DOCUMENTS),
  storePOA: storage.bucket(process.env.STORE_POA),
  proof_of_residence: storage.bucket(process.env.PROOF_OF_RESIDENCE),
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
    if (!fileUrl) return;
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
