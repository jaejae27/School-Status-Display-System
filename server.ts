import express from "express";
import path from "path";
import multer from "multer";
import * as xlsx from "xlsx";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;
const upload = multer({ storage: multer.memoryStorage() });

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY as string,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

app.use(express.json());

// API: Parse Class Excel
app.post("/api/upload/classes", upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    // Expecting columns: 학년, 반, 담임, 부담임, 남, 여
    const formattedClasses = data.map((row: any) => ({
      grade: parseInt(row["학년"]),
      classNumber: parseInt(row["반"]),
      homeroomTeacher: row["담임"] || "",
      assistantTeacher: row["부담임"] || "",
      boysCount: parseInt(row["남"]) || 0,
      girlsCount: parseInt(row["여"]) || 0,
    }));

    res.json(formattedClasses);
  } catch (error) {
    console.error("Excel parse error:", error);
    res.status(500).json({ error: "Failed to parse excel file" });
  }
});

// API: Parse Monthly Events using Gemini
app.post("/api/upload/events", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const base64Data = req.file.buffer.toString("base64");
    const mimeType = req.file.mimetype;

    const prompt = `
      Please extract school monthly events from this file.
      Return the data in a JSON format where keys are days of the month (1 to 31) and values are the event description for that day.
      Example: { "1": "개학식", "5": "어린이날", ... }
      If there is no event for a day, do not include it or leave it as an empty string.
      Only return the JSON object.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [{
        parts: [
          { inlineData: { data: base64Data, mimeType } },
          { text: prompt }
        ]
      }],
      config: {
        responseMimeType: "application/json"
      }
    });

    const result = JSON.parse(response.text || "{}");
    res.json(result);
  } catch (error) {
    console.error("Gemini parse error:", error);
    res.status(500).json({ error: "Failed to parse events using AI" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
