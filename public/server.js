
import express from "express";
import OpenAI from "openai";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.OPENAI_API_KEY) {
    throw new Error("Hiányzik az API kulcs a .env fájlból!");
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

app.use(helmet());
app.use(express.json({ limit: "12mb" }));
app.use(express.static("public"));

app.use("/api/", rateLimit({
    windowMs: 60 * 1000,
    limit: 20
}));

app.post("/api/chat", async (req, res) => {
    try {
        const { messages } = req.body;

        if (!Array.isArray(messages) || messages.length === 0 || messages.length > 30) {
            return res.status(400).json({
                error: "Érvénytelen üzenetek."
            });
        }

        const input = messages.map(message => {
            if (!["user", "assistant"].includes(message.role)) {
                throw new Error("Érvénytelen szerepkör.");
            }

            if (typeof message.text !== "string" || message.text.length > 12000) {
                throw new Error("Érvénytelen üzenet.");
            }

            const content = [{
                type: "input_text",
                text: message.text || "Mit látsz ezen a képen?"
            }];

            if (message.image) {
                if (
                    typeof message.image !== "string" ||
                    !/^data:image\/(png|jpeg|webp);base64,/.test(message.image) ||
                    message.image.length > 8_000_000
                ) {
                    throw new Error("Érvénytelen kép.");
                }

                content.push({
                    type: "input_image",
                    image_url: message.image,
                    detail: "auto"
                });
            }

            return {
                role: message.role,
                content
            };
        });

        const response = await openai.responses.create({
            model: "gpt-5.5",
            instructions: "Te Neura AI vagy, egy segítőkész magyar AI asszisztens. Válaszolj a felhasználó nyelvén, érthetően és pontosan.",
            input
        });

        res.json({
            reply: response.output_text
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Nem sikerült választ kapni az AI-tól."
        });
    }
});

app.listen(PORT, () => {
    console.log(`Neura AI elindult: http://localhost:${PORT}`);
});
