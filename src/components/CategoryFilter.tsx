import { Category } from '../lib/supabase';

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

export function CategoryFilter({ categories, selectedCategory, onSelectCategory }: CategoryFilterProps) {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-amber-500/20 rounded-xl p-4 mb-6">
      <h3 className="text-amber-400 font-semibold mb-3 text-sm uppercase tracking-wider">Categorías</h3>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onSelectCategory(null)}
          className={`px-4 py-2 rounded-lg transition-all ${
            selectedCategory === null
              ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/30'
              : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white'
          }`}
        >
          Todos
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onSelectCategory(category.id)}
            className={`px-4 py-2 rounded-lg transition-all ${
              selectedCategory === category.id
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/30'
                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
}
