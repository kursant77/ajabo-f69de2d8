import { categories, type Category } from "@/data/menuData";
import { cn } from "@/lib/utils";

interface CategoryTabsProps {
  activeCategory: Category;
  onCategoryChange: (category: Category) => void;
}

const CategoryTabs = ({ activeCategory, onCategoryChange }: CategoryTabsProps) => {
  return (
    <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border/10">
      <div className="container mx-auto px-4">
        <nav className="flex items-center justify-start md:justify-center gap-3 overflow-x-auto py-6 no-scrollbar">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={cn(
                "whitespace-nowrap px-6 py-2 rounded-lg text-sm font-bold transition-all duration-300 shadow-sm",
                activeCategory === category.id
                  ? "bg-[#E21A1A] text-white scale-105"
                  : "bg-white text-[#4A4A4A] border border-gray-200 hover:bg-gray-50"
              )}
            >
              {category.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default CategoryTabs;
