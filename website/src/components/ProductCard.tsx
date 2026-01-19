import { ShoppingCart } from "lucide-react";
import type { MenuItem } from "@/data/menuData";

interface ProductCardProps {
    item: MenuItem;
    onOrder: (item: MenuItem) => void;
}

const ProductCard = ({ item, onOrder }: ProductCardProps) => {
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("uz-UZ").format(price);
    };

    return (
        <article className="group flex flex-col h-full bg-white rounded-2xl overflow-hidden shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border border-gray-100">
            {/* Image container with zoom effect */}
            <div className="relative aspect-square overflow-hidden">
                <img
                    src={item.image}
                    alt={item.name}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                />
            </div>

            {/* Content area */}
            <div className="flex flex-col flex-grow p-5 text-center">
                <h3 className="text-xl font-bold text-[#E21A1A] mb-3 line-clamp-1">
                    {item.name}
                </h3>

                <div className="flex items-center justify-center gap-1.5 mb-6">
                    <span className="text-lg font-extrabold text-[#2D2D2D]">
                        ✨ {formatPrice(item.price)} so'm
                    </span>
                </div>

                {/* Shopping cart button */}
                <button
                    onClick={() => onOrder(item)}
                    className="mt-auto flex items-center justify-center gap-2 w-full bg-[#E21A1A] hover:bg-[#c41616] text-white py-3.5 rounded-xl font-bold transition-all duration-300 shadow-lg shadow-red-100 hover:shadow-red-200 active:scale-95"
                >
                    <ShoppingCart className="w-5 h-5" />
                    <span>Savatga qo'shish</span>
                </button>
            </div>
        </article>
    );
};

export default ProductCard;
