import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
dotenv.config();

async function test() {
    console.log("KEY", process.env.GEMINI_API_KEY ? "EXISTS" : "MISSING");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    try {
        const result = await model.generateContent('Hi');
        console.log("Result:", result.response.text());
    } catch (e: any) {
        console.error("Error with gemini-1.5-flash:", e.message);

        console.log("Trying gemini-pro...");
        try {
            const model2 = genAI.getGenerativeModel({ model: 'gemini-pro' });
            const result2 = await model2.generateContent('Hi');
            console.log("Result gemini-pro:", result2.response.text());
        } catch (e2: any) {
            console.error("Error with gemini-pro:", e2.message);
        }
    }
}
test();
