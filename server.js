import express from "express";
import multer from "multer";
import cors from "cors";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const app = express();
app.use(cors());

// Хранилище для загрузки файлов во временную память
const upload = multer({ storage: multer.memoryStorage() });

// Настройки Storj — ТВОИ КЛЮЧИ УЖЕ ВСТАВЛЕНЫ
const s3 = new S3Client({
  region: "us-east-1",
  endpoint: "https://gateway.storjshare.io",
  credentials: {
    accessKeyId: "jur55aw5cgrwvjydf63jqtpbifqa",
    secretAccessKey: "jzvk7ra4seh4rfur7am3dyvjv6xi27xwqxv46cqpfwtx7fibagsx2",
  },
});

// Маршрут загрузки
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "Файл не получен" });
    }

    const fileName = Date.now() + "-" + file.originalname;

    const command = new PutObjectCommand({
      Bucket: "videos",
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await s3.send(command);

    const fileUrl = `https://gateway.storjshare.io/videos/${fileName}`;

    res.json({ url: fileUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка загрузки" });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));
