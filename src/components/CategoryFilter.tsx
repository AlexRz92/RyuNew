import { LayoutGrid } from 'lucide-react';
import type { Category } from '../lib/types';

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

export function CategoryFilter({ categories, selectedCategory, onSelectCategory }: CategoryFilterProps) {
  return (
    <div className="mb-8">
      <h3 className="text-content font-semibold mb-3 text-sm uppercase tracking-wider">
        Explorar categorías
      </h3>
      <div className="flex gap-3 overflow-x-auto pb-2 -mb-2 scrollbar-hide">
        <CategoryPill
          active={selectedCategory === null}
          onClick={() => onSelectCategory(null)}
          label="Todos"
          imageUrl=""
        />
        {categories.map((category) => (
          <CategoryPill
            key={category.id}
            active={selectedCategory === category.id}
            onClick={() => onSelectCategory(category.id)}
            label={category.name}
            imageUrl={category.image_url}
          />
        ))}
      </div>
    </div>
  );
}

interface CategoryPillProps {
  active: boolean;
  onClick: () => void;
  label: string;
  imageUrl: string;
}

function CategoryPill({ active, onClick, label, imageUrl }: CategoryPillProps) {
  return (
    <button
      onClick={onClick}
      className={`group flex flex-col items-center gap-2 flex-shrink-0 w-24 focus:outline-none`}
    >
      <div
        className={`w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden border-2 transition-all ${
          active
            ? 'border-brand ring-2 ring-brand/30 shadow-card-hover'
            : 'border-line bg-surface group-hover:border-brand/50 group-hover:shadow-card'
        }`}
      >
        {imageUrl ? (
          <img src={imageUrl} alt={label} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <LayoutGrid className={`w-8 h-8 ${active ? 'text-brand' : 'text-content-muted'}`} />
        )}
      </div>
      <span
        className={`text-xs font-medium text-center line-clamp-2 leading-tight ${
          active ? 'text-brand' : 'text-content-soft group-hover:text-content'
        }`}
      >
        {label}
      </span>
    </button>
  );
}
