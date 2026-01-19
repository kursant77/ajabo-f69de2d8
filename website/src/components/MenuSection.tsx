import { type Category, type MenuItem } from "@/data/menuData";
import ProductCard from "@/components/ProductCard";
import { useSupabaseProducts } from "@/hooks/useSupabaseProducts";

interface MenuSectionProps {
  activeCategory: Category;
  onOrder: (item: MenuItem) => void;
}

const MenuSection = ({ activeCategory, onOrder }: MenuSectionProps) => {
  const { products, loading } = useSupabaseProducts();
  const filteredItems = products.filter((item) => item.category === activeCategory) as unknown as MenuItem[];

  console.log('MenuSection - All products:', products);
  console.log('MenuSection - Filtered items for category', activeCategory, ':', filteredItems);

  if (loading) {
    return (
      <section className="py-16 text-center">
        <p className="animate-pulse text-muted-foreground">Menyu yuklanmoqda...</p>
      </section>
    );
  }

  return (
    <section className="py-8 md:py-12">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="mb-10 text-center animate-fade-in-up">
          <h2 className="text-4xl font-extrabold text-[#2D2D2D] md:text-5xl tracking-tight">
            Bizning menyu
          </h2>
          <p className="mt-4 text-lg text-[#666666] font-medium">
            Tanlang va zavqlaning — yangi taomlar sizni kutmoqda 🍔
          </p>
        </div>

        {/* Products grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredItems.map((item, index) => (
            <div
              key={item.id}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <ProductCard item={item} onOrder={onOrder} />
            </div>
          ))}
        </div>

        {/* Empty state */}
        {filteredItems.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-lg text-muted-foreground">
              Bu kategoriyada hozircha mahsulot yo'q
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default MenuSection;
