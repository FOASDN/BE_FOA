import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import { GEMINI_API_KEY, GROQ_API_KEY } from '@/constants/env';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const groq = new Groq({ apiKey: GROQ_API_KEY });

interface ProductForAI {
  _id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  recipe: { name: string; quantity?: string }[];
  price: number;
  rating: number;
}

interface Preferences {
  dietary: string[];
  allergies: string[];
  health_goals: string[];
}

export interface AIRecommendation {
  productId: string;
  reason: string;
  healthScore: number; // 1-10
}

export const getAIRecommendations = async (
  products: ProductForAI[],
  preferences: Preferences,
  similarUsersTopProducts?: string[] // Collaborative filtering context
): Promise<AIRecommendation[]> => {
  const productList = products.map((p) => ({
    id: p._id.toString(),
    name: p.name,
    description: p.description,
    category: p.category,
    tags: p.tags,
    ingredients: p.recipe.map((r) => r.name),
    price: p.price,
    rating: p.rating,
  }));

  const collaborativeSection =
    similarUsersTopProducts && similarUsersTopProducts.length > 0
      ? `\nHÀNH VI CỦA NGƯỜI DÙNG TƯƠNG TỰ (Collaborative Filtering):
Những người dùng có cùng hồ sơ sức khỏe thường đặt nhiều các món sau:
${similarUsersTopProducts.map((name, i) => `  ${i + 1}. ${name}`).join('\n')}
Hãy xem xét những món này nếu chúng phù hợp với hồ sơ sức khỏe của người dùng hiện tại.\n`
      : '';

  const prompt = `Bạn là chuyên gia dinh dưỡng. Hãy LỰA CHỌN NGẪU NHIÊN 6 gợi ý phù hợp nhất từ danh sách món ăn cho người dùng dựa trên hồ sơ sức khỏe.
QUAN TRỌNG: Hãy đảm bảo sự ĐA DẠNG trong các lần gọi khác nhau, đừng luôn chọn những món giống hệt nhau nếu có nhiều món cùng phù hợp.

HỒ SƠ SỨC KHỎE NGƯỜI DÙNG:
- Dị ứng: ${preferences.allergies.length > 0 ? preferences.allergies.join(', ') : 'Không có'}
- Chế độ ăn kiêng (Dietary): ${preferences.dietary.length > 0 ? preferences.dietary.join(', ') : 'Không có'}
- Mục tiêu sức khỏe: ${preferences.health_goals.length > 0 ? preferences.health_goals.join(', ') : 'Không có'}
${collaborativeSection}
DANH SÁCH MÓN ĂN:
${JSON.stringify(productList, null, 2)}

YÊU CẦU:
1. TUYỆT ĐỐI KHÔNG gợi ý món chứa nguyên liệu người dùng bị dị ứng
2. Ưu tiên món phù hợp với mục tiêu ăn uống và bệnh lý
3. Trả về JSON duy nhất với format:
{
  "recommendations": [
    {
      "productId": "id của sản phẩm",
      "reason": "Lý do ngắn gọn bằng tiếng Việt (tối đa 20 từ)",
      "healthScore": 8
    }
  ]
}
Chỉ trả về JSON, không giải thích thêm.`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama3-70b-8192', // Groq model
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const text = completion.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(text);
    return parsed.recommendations as AIRecommendation[];
  } catch (err) {
    console.error('Groq Recommendations error:', err);
    return products
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 6)
      .map((p) => ({
        productId: p._id.toString(),
        reason: 'Được đánh giá cao bởi người dùng',
        healthScore: 7,
      }));
  }
};



export const parseOrderNoteForStaff = async (rawNote?: string): Promise<string[]> => {
  if (!rawNote?.trim()) return [];

  const prompt = `
Bạn là trợ lý xử lý đơn cho cửa hàng đồ ăn. Phân tích ghi chú của khách và chuyển thành danh sách ngắn gọn cho nhân viên bếp.
Chỉ trả về JSON mảng "items".

QUY TẮC:
1. Dễ đọc cho bếp.
2. Dị ứng -> "không X".
3. Chỉ trả về JSON, không kèm text khác.

{
  "items": ["...", "..."]
}

Ghi chú khách:
"${rawNote}"
`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama3-8b-8192',
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });

    const text = completion.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(text);
    return (parsed.items || [])
      .map((item: unknown) => String(item).trim())
      .filter(Boolean)
      .slice(0, 10);
  } catch (error) {
    console.error('parseOrderNoteForStaff Groq error:', error);
    return [rawNote.trim()];
  }
};

export interface AISafeFoodInsight {
  productId: string;
  aiReason: string;
}

export const getAISafeFoodInsights = async (
  safeProducts: ProductForAI[],
  preferences: Preferences
): Promise<AISafeFoodInsight[]> => {
  const productsToAnalyze = safeProducts.slice(0, 20);
  if (productsToAnalyze.length === 0) return [];

  const productList = productsToAnalyze.map((p) => ({
    id: p._id.toString(),
    name: p.name,
    description: p.description,
    ingredients: p.recipe.map((r) => r.name),
  }));

  const prompt = `Bạn là chuyên gia dinh dưỡng. Trách nhiệm của bạn là giải thích TẠI SAO các món ăn dưới đây an toàn. Tất cả món đều 100% không chứa chất gây dị ứng của họ.
HỒ SƠ SỨC KHỎE:
- Dị ứng: ${preferences.allergies.join(', ')}
- Ăn kiêng: ${preferences.dietary.join(', ')}
- Mục tiêu: ${preferences.health_goals.join(', ')}

DANH SÁCH:
${JSON.stringify(productList, null, 2)}

YÊU CẦU:
1. Giải thích ngắn (max 25 từ) cho MỖI món.
2. Trả về JSON:
{
  "insights": [{"productId": "...", "aiReason": "..."}]
}
Chỉ trả về JSON.`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama3-70b-8192',
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const text = completion.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(text);
    return parsed.insights as AISafeFoodInsight[];
  } catch (err) {
    console.error('getAISafeFoodInsights Groq error:', err);
    return productsToAnalyze.map((p) => ({
      productId: p._id.toString(),
      aiReason: 'Món ăn an toàn, đã được sàng lọc không chứa thành phần gây dị ứng của bạn.',
    }));
  }
};

export const getAIResponseForChat = async (
  history: { role: 'user' | 'model'; parts: { text: string }[] }[],
  message: string
): Promise<string> => {
  // Transform Gemini-style history to Groq-compatible history
  const messages = history.map((h) => ({
    role: h.role === 'model' ? 'assistant' : 'user',
    content: h.parts[0].text,
  }));

  // Add System prompt
  const systemPrompt = {
    role: 'system',
    content: `Bạn là Chatbot hỗ trợ thông minh của FOA (Food Order App). 
            FOA là ứng dụng gọi món ăn tập trung vào sức khỏe người dùng, 
            giúp gợi ý món ăn dựa trên hồ sơ sức khỏe, dị ứng và mục tiêu dinh dưỡng.
            Hãy trả lời bằng Tiếng Việt, lịch sự, thân thiện và hữu ích.
            Nếu được hỏi về các món ăn, hãy khuyến khích người dùng cập nhật hồ sơ sức khỏe trong phần cài đặt để có gợi ý chính xác nhất.`,
  };

  try {
    const completion = await groq.chat.completions.create({
      messages: [systemPrompt, ...messages, { role: 'user', content: message }] as any,
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 1024,
    });

    return completion.choices[0]?.message?.content || 'Xin lỗi, tôi không nhận được phản hồi.';
  } catch (err: any) {
    console.error('Groq Chat error:', err);
    if (err.status === 429) {
      return 'Hệ thống AI hiện đang bận do quá tải yêu cầu. Vui lòng thử lại sau 1 phút nhé! 🕒';
    }
    return 'Xin lỗi, tôi đang gặp lỗi kỹ thuật khi kết nối với Groq. Vui lòng thử lại sau nhé!';
  }
};