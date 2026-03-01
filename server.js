import express from "express";
import cors from "cors";
import Busboy from "busboy";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// ===============================
// ТВОЙ LINKSHARING ACCESS GRANT
// ===============================
const LINKSHARING_KEY = "1LBi1yyPHj2VkrXCe186w5v9AP9hhdSP2qc21q3qJexfsm6rGBvQqLkEGNrVuMtc8u4sXAGUGzaJmnKH21wDqxDnXJRxL88zmgMocb4kkCy71k4T9NQYyfStd5CVPMCTaLHJxk12VN4NvDKH32eiW1J2biSJwDTgCexWPzkpbstkj4vbHiR26KLePkz5qMXYyXmtbHov7mRtC3x43aquBdBByKMT5vqtHwnv8fivkWA8GJZumyLE44XHWr9APcdLFhANwADNRrQTURGSxiCPghoor9KfaRssBq";

const STORJ_ENDPOINT = "https://gateway.storjshare.io";
const STORJ_ACCESS_KEY = "jur55aw5cgrwvjydf63jqtpbifqa";
const STORJ_SECRET_KEY = "jzvk7ra4seh4rfur7am3dyvjv6xi27xwqxv46cqpfwtx7fibagsx2";
const STORJ_BUCKET = "videos";

// ===============================
const app = express();
app.use(cors());

const s3 = new S3Client({
  region: "us-east-1",
  endpoint: STORJ_ENDPOINT,
  credentials: {
    accessKeyId: STORJ_ACCESS_KEY,
    secretAccessKey: STORJ_SECRET_KEY
  },
  forcePathStyle: true
});

// ===============================
// Загрузка файла в Storj
// ===============================
app.post("/upload", (req, res) => {
  const busboy = Busboy({ headers: req.headers });

  let fileBuffer = null;
  let fileName = null;
  let mimeType = null;

  busboy.on("file", (fieldname, file, info) => {
    fileName = Date.now() + "_" + info.filename.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    mimeType = info.mimeType;

    const chunks = [];
    file.on("data", (chunk) => chunks.push(chunk));
    file.on("end", () => {
      fileBuffer = Buffer.concat(chunks);
    });
  });

  busboy.on("finish", async () => {
    if (!fileBuffer) {
      return res.status(400).json({ error: "No file" });
    }

    try {
      await s3.send(
        new PutObjectCommand({
          Bucket: STORJ_BUCKET,
          Key: fileName,
          Body: fileBuffer,
          ContentType: mimeType
        })
      );

      // ПРАВИЛЬНАЯ РАБОЧАЯ ССЫЛКА ДЛЯ ВИДЕО
      const url = `https://link.storjshare.io/raw/${LINKSHARING_KEY}/${STORJ_BUCKET}/${fileName}`;

      res.json({ url });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Upload failed" });
    }
  });

  req.pipe(busboy);
});

// ===============================
app.get("/", (req, res) => {
  res.send("MaxTube backend is running");
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Server running on port " + port));
