import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
dotenv.config();

async function testAll() {
    console.log("KEY", process.env.GEMINI_API_KEY ? "EXISTS" : "MISSING");

    // Instead of guessing, let's fetch the actual REST API to list models
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        const data = await response.json();
        const models = data.models.filter((m: any) => m.supportedGenerationMethods.includes("generateContent")).map((m: any) => m.name);
        console.log("Available generation models:", models);

        // Grab the first 1.5 model
        const modelNameRaw = models.find((m: string) => m.includes("gemini-1.5-flash")) || models.find((m: string) => m.includes("gemini-1.5-pro")) || models.find((m: string) => m.includes("gemini"));
        if (modelNameRaw) {
            const shortName = modelNameRaw.replace('models/', '');
            console.log("Selected model:", shortName);

            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
            const model = genAI.getGenerativeModel({ model: shortName });

            const result = await model.generateContent("Say hi");
            console.log("Test success:", result.response.text());
        }
    } catch (e: any) {
        console.error("Failed:", e.message);
    }
}
testAll();
