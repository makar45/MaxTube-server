import express from "express";
import cors from "cors";
import Busboy from "busboy";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// ===============================
// ТВОИ ДАННЫЕ STORJ
// ===============================
const STORJ_ENDPOINT = "https://gateway.storjshare.io";
const STORJ_ACCESS_KEY = "jur55aw5cgrwvjydf63jqtpbifqa";
const STORJ_SECRET_KEY = "jzvk7ra4seh4rfur7am3dyvjv6xi27xwqxv46cqpfwtx7fibagsx2";
const STORJ_BUCKET = "videos"; // ты сказал "videos"

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
// Загрузка файла в Storj (без multer)
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

      // ПРАВИЛЬНАЯ ССЫЛКА ДЛЯ ТВОЕГО STORJ
      const url = `https://gateway.storjshare.io/s/${STORJ_ACCESS_KEY}/${STORJ_BUCKET}/${fileName}`;

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
