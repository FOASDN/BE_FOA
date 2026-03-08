import { Request, Response } from 'express';
import { getAIResponseForChat } from '@/services/ai.service';

export const handleChat = async (req: Request, res: Response) => {
    try {
        const { message, history } = req.body;

        if (!message) {
            return res.status(400).json({ message: 'Vui lòng cung nhập tin nhắn.' });
        }

        // Format history for Gemini (e.g. { role, parts: [{ text }] })
        const formattedHistory = (history || []).map((h: any) => ({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.content || h.parts[0].text }],
        }));

        const response = await getAIResponseForChat(formattedHistory, message);

        return res.json({ response });
    } catch (error: any) {
        console.error('Chat controller error:', error);
        return res.status(500).json({ message: 'Lỗi server.', error: error.message });
    }
};
