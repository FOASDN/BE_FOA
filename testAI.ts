import { getAIRecommendations, getAISafeFoodInsights } from './src/services/ai.service';

const mockProducts = [
  {
    _id: 'prod1',
    name: 'Salad Gà',
    description: 'Salad gà tươi ngon',
    category: 'Salad',
    tags: ['healthy', 'low-cal'],
    recipe: [{ name: 'gà' }, { name: 'xà lách' }, { name: 'cà chua' }],
    price: 50000,
    rating: 4.5,
  },
  {
    _id: 'prod2',
    name: 'Bánh mì trứng',
    description: 'Bánh mì với trứng và rau',
    category: 'Breakfast',
    tags: ['quick'],
    recipe: [{ name: 'bánh mì' }, { name: 'trứng' }, { name: 'rau' }],
    price: 30000,
    rating: 4.0,
  },
];

const mockPreferences = {
  dietary: [],
  allergies: ['trứng'],
  health_goals: ['giảm cân'],
};

(async () => {
  console.log('--- Testing getAIRecommendations ---');
  const recs = await getAIRecommendations(mockProducts, mockPreferences);
  console.log(JSON.stringify(recs, null, 2));

  console.log('\n--- Testing getAISafeFoodInsights ---');
  const safeProducts = mockProducts.filter(p => !mockPreferences.allergies.includes(p.recipe[0].name));
  const insights = await getAISafeFoodInsights(safeProducts, mockPreferences);
  console.log(JSON.stringify(insights, null, 2));
})();
