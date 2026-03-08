import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY } from '@/constants/env';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

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

interface HealthProfile {
  allergies: string[];
  conditions: string[];
  dietaryGoals: string[];
}

export interface AIRecommendation {
  productId: string;
  reason: string;
  healthScore: number; // 1-10
}

export const getAIRecommendations = async (
  products: ProductForAI[],
  healthProfile: HealthProfile,
  similarUsersTopProducts?: string[] // Collaborative filtering context
): Promise<AIRecommendation[]> => {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

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

  // Build collaborative filtering section for prompt
  const collaborativeSection =
    similarUsersTopProducts && similarUsersTopProducts.length > 0
      ? `\nHÀNH VI CỦA NGƯỜI DÙNG TƯƠNG TỰ (Collaborative Filtering):
Những người dùng có cùng hồ sơ sức khỏe thường đặt nhiều các món sau:
${similarUsersTopProducts.map((name, i) => `  ${i + 1}. ${name}`).join('\n')}
Hãy xem xét những món này nếu chúng phù hợp với hồ sơ sức khỏe của người dùng hiện tại.\n`
      : '';

  const prompt = `Bạn là chuyên gia dinh dưỡng. Hãy phân tích danh sách món ăn và đưa ra 6 gợi ý phù hợp nhất cho người dùng dựa trên hồ sơ sức khỏe của họ.

HỒ SƠ SỨC KHỎE NGƯỜI DÙNG:
- Dị ứng: ${healthProfile.allergies.length > 0 ? healthProfile.allergies.join(', ') : 'Không có'}
- Bệnh lý: ${healthProfile.conditions.length > 0 ? healthProfile.conditions.join(', ') : 'Không có'}
- Mục tiêu ăn uống: ${healthProfile.dietaryGoals.length > 0 ? healthProfile.dietaryGoals.join(', ') : 'Không có yêu cầu đặc biệt'}
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
