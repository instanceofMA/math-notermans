import express from "express";
import { aiRouter, init } from "./ai.js";
import dotenv from "dotenv";

// Pulling from .env
dotenv.config();

const PORT = process.env.PORT || 3000;

const app = express();

app.use(express.json());

app.assistantId = await init(process.env.OPENAI_API_KEY, "uploads/file.docx");
app.files = {};

app.get("/", (req, res) => res.json({success: true, message: "This is the API for the Dutch law tutor!"}));

app.use("/ai", aiRouter);

// app.use((error, req, res, next) => {
//     res.json({ success: false });
// })

app.listen(PORT, () => console.log("Listening on port", PORT));
