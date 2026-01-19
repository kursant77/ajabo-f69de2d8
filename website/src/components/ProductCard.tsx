import type { MenuItem } from "@/data/menuData";

interface ProductCardProps {
    item: MenuItem;
    onOrder: (item: MenuItem) => void;
}

const ProductCard = ({ item, onOrder }: ProductCardProps) => {
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("uz-UZ").format(price) + " so'm";
    };

    return (
        <article className="group overflow-hidden rounded-lg bg-card shadow-cafe transition-all duration-300 hover:-translate-y-1 hover:shadow-cafe-lg">
            {/* Image */}
            <div className="relative aspect-[4/3] overflow-hidden">
                <img
                    src={item.image}
                    alt={item.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                />
                {/* Price badge */}
                <div className="absolute right-3 top-3 rounded-full bg-primary/90 px-3 py-1.5 text-sm font-semibold text-primary-foreground backdrop-blur-sm">
                    {formatPrice(item.price)}
                </div>
            </div>

            {/* Content */}
            <div className="p-4 md:p-5">
                <h3 className="mb-2 text-lg font-semibold text-card-foreground md:text-xl">
                    {item.name}
                </h3>
                <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
                    {item.description}
                </p>

                {/* Order button */}
                <button
                    onClick={() => onOrder(item)}
                    className="w-full rounded-lg bg-accent py-2.5 text-sm font-medium text-accent-foreground transition-all duration-300 hover:bg-accent/90 hover:shadow-md active:scale-[0.98] md:py-3 md:text-base"
                >
                    Buyurtma qilish
                </button>
            </div>
        </article>
    );
};

export default ProductCard;
