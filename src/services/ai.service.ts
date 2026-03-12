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
  // ------------------------------------------------------------
  // 1️⃣ Cache layer (in‑memory) – avoid re‑calling AI for the same
  //    preferences + product set within a short time window.
  // ------------------------------------------------------------
  const cacheKey = JSON.stringify({
    pref: preferences,
    ids: products.map((p) => p._id.toString()).sort(),
    similar: similarUsersTopProducts,
  });
  // Simple static cache (could be replaced by Redis later)
  const staticCache = (global as any).__aiRecCache as Map<string, AIRecommendation[]> || new Map();
  (global as any).__aiRecCache = staticCache;
  if (staticCache.has(cacheKey)) {
    return staticCache.get(cacheKey)!;
  }

  // ------------------------------------------------------------
  // 2️⃣ Reduce prompt size – only send a reasonable number of
  //    candidate products. We keep the top 30 by rating (or price if
  //    needed) to keep token usage low and response time fast.
  // ------------------------------------------------------------
  const MAX_PRODUCTS_IN_PROMPT = 30;
  const sortedProducts = [...products]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, MAX_PRODUCTS_IN_PROMPT);

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      // Lower temperature for more deterministic, accurate answers.
      temperature: 0.2,
    },
  });

  const productList = sortedProducts.map((p) => ({
    id: p._id.toString(),
    name: p.name,
    description: p.description,
    category: p.category,
    tags: p.tags,
    ingredients: p.recipe.map((r) => r.name),
    price: p.price,
    rating: p.rating,
  }));

  // Build collaborative filtering section for prompt
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
3. Nếu có dữ liệu hành vi người dùng tương tự, hãy ưu tiên những món đó NẾU phù hợp sức khỏe
4. Trả về JSON với đúng format sau, KHÔNG có text thêm:
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
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in AI response');

    const parsed = JSON.parse(jsonMatch[0]);
    return parsed.recommendations as AIRecommendation[];
  } catch (err) {
    console.error('Gemini AI error:', err);
    // Fallback: return top products by rating
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

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `
Bạn là trợ lý xử lý đơn cho cửa hàng đồ ăn.

Nhiệm vụ:
Phân tích ghi chú của khách và chuyển thành danh sách ngắn gọn để nhân viên bếp đọc nhanh.

MỤC TIÊU OUTPUT:
- Mỗi ý là một chuỗi ngắn, rõ ràng, hành động được.
- Ưu tiên cách viết ngắn theo văn phong vận hành bếp.
- Không giải thích dài dòng.
- Không thêm thông tin ngoài ghi chú khách.

QUY TẮC CHUẨN HÓA:
1. Nếu khách nói bị dị ứng với thành phần nào, chuyển thành dạng "không <thành phần>".
2. Nếu khách nói "không bỏ/lấy X", "bỏ X", "không X", chuyển thành "không X".
4. Nếu khách nói "thêm X", chuyển thành "thêm X".
5. Nếu có nhiều ý, tách thành nhiều phần tử trong mảng theo đúng thứ tự xuất hiện trong ghi chú.
6. Chỉ trả về JSON hợp lệ, duy nhất, không kèm markdown, không kèm giải thích:
{
  "items": ["...", "..."]
}
Ghi chú khách:
"${rawNote}"
`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in AI response');

    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed.items)) throw new Error('Invalid items format');

    return parsed.items
      .map((item: unknown) => String(item).trim())
      .filter(Boolean)
      .slice(0, 10);
  } catch (error) {
    console.error('parseOrderNoteForStaff error:', error);

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
  // If the list is too massive, we might want to slice it, but usually safe products are a reasonable subset.
  // To save tokens/time, limit to top 20 safe products for AI explanation.
  const productsToAnalyze = safeProducts.slice(0, 20);

  if (productsToAnalyze.length === 0) return [];

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: { temperature: 0.4 },
  });

  const productList = productsToAnalyze.map((p) => ({
    id: p._id.toString(),
    name: p.name,
    description: p.description,
    ingredients: p.recipe.map((r) => r.name),
  }));

  const prompt = `Bạn là chuyên gia dinh dưỡng. Trách nhiệm của bạn là giải thích TẠI SAO các món ăn trong danh sách dưới đây lại an toàn và phù hợp với người dùng.
TẤT CẢ các món ăn dưới đây đã được hệ thống kiểm tra và xác nhận 100% KHÔNG chứa chất gây dị ứng của người dùng.

HỒ SƠ SỨC KHỎE NGƯỜI DÙNG:
- Dị ứng: ${preferences.allergies.length > 0 ? preferences.allergies.join(', ') : 'Không có'}
- Chế độ ăn kiêng (Dietary): ${preferences.dietary.length > 0 ? preferences.dietary.join(', ') : 'Không có'}
- Mục tiêu sức khỏe: ${preferences.health_goals.length > 0 ? preferences.health_goals.join(', ') : 'Không có'}

DANH SÁCH MÓN ĂN AN TOÀN (${productList.length} món):
${JSON.stringify(productList, null, 2)}

YÊU CẦU:
1. Viết 1 câu giải thích ngắn gọn (tối đa 25 từ) bằng TIẾNG VIỆT cho MỖI món ăn.
2. Nội dung giải thích phải NÊU BẬT được sự liên quan giữa nguyên liệu món ăn và hồ sơ sức khỏe của người dùng (ví dụ: "Món này hoàn toàn không có đậu phộng và rất giàu đạm, phù hợp để tăng cơ").
3. Chỉ dự đoán kết quả cho chính xác ${productList.length} món ăn được cung cấp. Cấm bỏ sót món nào.
4. Trả về JSON theo ĐÚNG định dạng sau:
{
  "insights": [
    {
      "productId": "id của sản phẩm",
      "aiReason": "Lý do ngắn gọn của AI"
    }
  ]
}

Bắt buộc trả về thuần JSON, không có text giải thích bên ngoài.`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in safe foods AI response');

    const parsed = JSON.parse(jsonMatch[0]);
    return parsed.insights as AISafeFoodInsight[];
  } catch (err) {
    console.error('Gemini Safe Foods Insight error:', err);
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