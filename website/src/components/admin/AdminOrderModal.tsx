import { useState, useEffect, useMemo } from "react";
import { X, ArrowLeft, Plus, Minus, Trash2, ShoppingCart, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSupabaseCategories, type Category } from "@/hooks/useSupabaseCategories";
import { useSupabaseProducts, type Product } from "@/hooks/useSupabaseProducts";
import { useSupabaseOrders } from "@/hooks/useSupabaseOrders";
import { toast } from "sonner";

interface CartItem {
  id: string;
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  totalPrice: number;
  image?: string;
}

interface AdminOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AdminOrderModal = ({ isOpen, onClose }: AdminOrderModalProps) => {
  const { categories, loading: categoriesLoading } = useSupabaseCategories();
  const { products, loading: productsLoading } = useSupabaseProducts();
  const { addOrder } = useSupabaseOrders();

  const [view, setView] = useState<"categories" | "products">("categories");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productQuantity, setProductQuantity] = useState(1);
  const [isCreating, setIsCreating] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setView("categories");
      setSelectedCategory(null);
      setCart([]);
      setSelectedProduct(null);
      setProductQuantity(1);
    }
  }, [isOpen]);

  // Filter products by selected category
  const filteredProducts = useMemo(() => {
    if (!selectedCategory) return [];
    return products.filter((p) => {
      const category = categories.find((c) => c.slug === selectedCategory || c.id === selectedCategory);
      if (!category) return false;
      // Match by slug or by name (lowercase)
      return p.category === category.slug || p.category === category.name.toLowerCase();
    });
  }, [products, selectedCategory, categories]);

  const handleCategorySelect = (categorySlug: string) => {
    setSelectedCategory(categorySlug);
    setView("products");
  };

  const handleBack = () => {
    if (view === "products") {
      setView("categories");
      setSelectedCategory(null);
      setSelectedProduct(null);
    }
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setProductQuantity(1);
  };

  const handleQuantityChange = (delta: number) => {
    setProductQuantity((prev) => Math.max(1, prev + delta));
  };

  const handleAddToCart = () => {
    if (!selectedProduct) return;

    const existingItem = cart.find((item) => item.productId === selectedProduct.id);

    if (existingItem) {
      // Update existing item quantity
      setCart((prev) =>
        prev.map((item) =>
          item.productId === selectedProduct.id
            ? {
              ...item,
              quantity: item.quantity + productQuantity,
              totalPrice: (item.quantity + productQuantity) * item.price,
            }
            : item
        )
      );
    } else {
      // Add new item to cart
      const newItem: CartItem = {
        id: `${selectedProduct.id}-${Date.now()}`,
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        price: selectedProduct.price,
        quantity: productQuantity,
        totalPrice: selectedProduct.price * productQuantity,
        image: selectedProduct.image,
      };
      setCart((prev) => [...prev, newItem]);
    }

    toast.success(`${selectedProduct.name} savatga qo'shildi`);
    setSelectedProduct(null);
    setProductQuantity(1);
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId));
    toast.success("Mahsulot savatdan olib tashlandi");
  };

  const handleUpdateCartQuantity = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const newQuantity = Math.max(1, item.quantity + delta);
          return {
            ...item,
            quantity: newQuantity,
            totalPrice: newQuantity * item.price,
          };
        }
        return item;
      })
    );
  };

  const totalPrice = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [cart]);

  const handleCreateOrder = async () => {
    if (cart.length === 0) {
      toast.error("Savat bo'sh. Avval mahsulot qo'shing");
      return;
    }

    setIsCreating(true);

    try {
      // Create order for each cart item
      const orderPromises = cart.map((item) =>
        addOrder({
          productName: item.productName,
          quantity: item.quantity,
          customerName: "Admin buyurtmasi",
          phoneNumber: "",
          address: "Manzil ko'rsatilmagan",
          status: "pending",
          createdAt: new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }),
          rawCreatedAt: new Date(),
          totalPrice: item.totalPrice,
          telegramUserId: null,
          orderType: "takeaway",
          paymentMethod: "cash",
        })
      );

      await Promise.all(orderPromises);

      toast.success(`${cart.length} ta buyurtma muvaffaqiyatli yaratildi!`);
      onClose();
    } catch (error) {
      console.error("Error creating orders:", error);
      toast.error("Buyurtma yaratishda xatolik yuz berdi");
    } finally {
      setIsCreating(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("uz-UZ").format(price);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-full h-[90vh] p-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <ShoppingCart className="h-5 w-5" />
            Buyurtma kiritish
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex overflow-hidden">
          {/* Left Side - Cart (40%) */}
          <div className="w-[40%] border-r bg-gray-50 flex flex-col">
            <div className="p-4 border-b bg-white">
              <h3 className="font-semibold text-lg">Savat</h3>
              <p className="text-sm text-muted-foreground">{cart.length} ta mahsulot</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                  <p className="text-muted-foreground">Savat bo'sh</p>
                  <p className="text-sm text-muted-foreground mt-2">Mahsulot qo'shing</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-lg border p-3 flex gap-3 hover:shadow-sm transition-shadow"
                  >
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.productName}
                        className="w-16 h-16 object-cover rounded-md"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{item.productName}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatPrice(item.price)} so'm
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleUpdateCartQuantity(item.id, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleUpdateCartQuantity(item.id, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-col items-end justify-between">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleRemoveFromCart(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <p className="text-sm font-semibold text-primary mt-auto">
                        {formatPrice(item.totalPrice)} so'm
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-4 border-t bg-white space-y-3">
                <div className="flex items-center justify-between text-lg font-semibold">
                  <span>Jami:</span>
                  <span className="text-primary">{formatPrice(totalPrice)} so'm</span>
                </div>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleCreateOrder}
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <>Yaratilmoqda...</>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Buyurtmani yaratish
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Right Side - Categories/Products (60%) */}
          <div className="flex-1 flex flex-col bg-white">
            {/* Navigation Header */}
            {view === "products" && (
              <div className="p-4 border-b flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={handleBack}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h3 className="font-semibold">
                  {categories.find(
                    (c) => c.slug === selectedCategory || c.name.toLowerCase() === selectedCategory
                  )?.name || "Mahsulotlar"}
                </h3>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4">
              {view === "categories" ? (
                // Categories View
                <div>
                  {categoriesLoading ? (
                    <div className="flex justify-center items-center h-64">
                      <p className="text-muted-foreground">Yuklanmoqda...</p>
                    </div>
                  ) : categories.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                      <p className="text-muted-foreground">Kategoriyalar topilmadi</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {categories.map((category) => {
                        const categoryValue = category.slug || category.name.toLowerCase();
                        const productCount = products.filter(
                          (p) => p.category === category.slug || p.category === category.name.toLowerCase()
                        ).length;
                        return (
                          <button
                            key={category.id}
                            onClick={() => handleCategorySelect(categoryValue)}
                            className="p-6 rounded-lg border-2 border-gray-200 hover:border-primary hover:bg-primary/5 transition-all text-left group"
                          >
                            <h3 className="font-semibold text-lg group-hover:text-primary">
                              {category.name}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {productCount} ta mahsulot
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                // Products View
                <div>
                  {productsLoading ? (
                    <div className="flex justify-center items-center h-64">
                      <p className="text-muted-foreground">Yuklanmoqda...</p>
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                      <p className="text-muted-foreground">Bu kategoriyada mahsulot yo'q</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredProducts.map((product) => (
                        <div
                          key={product.id}
                          className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${selectedProduct?.id === product.id
                              ? "border-primary bg-primary/5"
                              : "border-gray-200 hover:border-gray-300"
                            }`}
                          onClick={() => handleProductSelect(product)}
                        >
                          <div className="flex gap-4">
                            {product.image && (
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-20 h-20 object-cover rounded-md"
                              />
                            )}
                            <div className="flex-1">
                              <h4 className="font-semibold">{product.name}</h4>
                              {product.description && (
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                  {product.description}
                                </p>
                              )}
                              <p className="text-lg font-bold text-primary mt-2">
                                {formatPrice(product.price)} so'm
                              </p>
                            </div>
                          </div>

                          {selectedProduct?.id === product.id && (
                            <div className="mt-4 pt-4 border-t flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleQuantityChange(-1);
                                  }}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <Input
                                  type="number"
                                  min="1"
                                  value={productQuantity}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value) || 1;
                                    setProductQuantity(Math.max(1, val));
                                  }}
                                  className="w-20 text-center"
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleQuantityChange(1);
                                  }}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                              <Button
                                className="flex-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddToCart();
                                }}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Savatga qo'shish
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminOrderModal;

