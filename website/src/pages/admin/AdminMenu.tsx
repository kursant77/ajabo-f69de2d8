
import { useState, useMemo, useRef } from "react";
import { useSupabaseProducts, uploadProductImage, type Product } from "@/hooks/useSupabaseProducts";
import { useSupabaseCategories } from "@/hooks/useSupabaseCategories";
import { useSupabaseWarehouse } from "@/hooks/useSupabaseWarehouse";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash2, ImagePlus, ChefHat, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Pagination from "@/components/admin/Pagination";

type IngredientRow = { warehouse_product_id: string; quantity: number };

const AdminMenu = () => {
  const { products, loading: productsLoading, addProduct, updateProduct, deleteProduct, getProductIngredients, setProductIngredients } = useSupabaseProducts();
  const { categories } = useSupabaseCategories();
  const { items: warehouseItems } = useSupabaseWarehouse();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  // Form state
  const [formData, setFormData] = useState<Partial<Product>>({
    name: "",
    price: 0,
    description: "",
    image: "",
    category: "" as any,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Masalliqlar (ingredients)
  const [ingredients, setIngredients] = useState<IngredientRow[]>([]);
  const [isIngredientDialogOpen, setIsIngredientDialogOpen] = useState(false);
  const [newIngredientWarehouseId, setNewIngredientWarehouseId] = useState("");
  const [newIngredientQuantity, setNewIngredientQuantity] = useState("");

  const handleOpenModal = async (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData(product);
      setImageFile(null);
      setImagePreview(null);
      const existing = await getProductIngredients(product.id);
      setIngredients(existing);
    } else {
      setEditingProduct(null);
      setFormData({
        name: "",
        price: 0,
        description: "",
        image: "",
        category: "" as any,
      });
      setImageFile(null);
      setImagePreview(null);
      setIngredients([]);
    }
    setIsModalOpen(true);
  };

  const addIngredientRow = () => {
    if (!newIngredientWarehouseId || !newIngredientQuantity) return;
    const qty = Number(newIngredientQuantity);
    if (isNaN(qty) || qty <= 0) return;
    if (ingredients.some((i) => i.warehouse_product_id === newIngredientWarehouseId)) return;
    setIngredients((prev) => [...prev, { warehouse_product_id: newIngredientWarehouseId, quantity: qty }]);
    setNewIngredientWarehouseId("");
    setNewIngredientQuantity("");
    setIsIngredientDialogOpen(false);
  };

  const removeIngredient = (warehouse_product_id: string) => {
    setIngredients((prev) => prev.filter((i) => i.warehouse_product_id !== warehouse_product_id));
  };

  const warehouseName = (id: string) => warehouseItems.find((w) => w.id === id)?.name ?? id;

  const onImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImageFile(null);
      setImagePreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.category) return;

    let imageUrl = formData.image ?? "";
    if (imageFile) {
      try {
        imageUrl = await uploadProductImage(imageFile);
        setFormData((prev) => ({ ...prev, image: imageUrl }));
      } catch (err) {
        console.error("Rasm yuklashda xatolik:", err);
        return;
      }
    }

    const payload = { ...formData, image: imageUrl };
    let productId: string | undefined;
    if (editingProduct) {
      await updateProduct(editingProduct.id, payload);
      productId = editingProduct.id;
    } else {
      productId = await addProduct(payload as Omit<Product, "id">);
    }
    if (productId) {
      try {
        await setProductIngredients(productId, ingredients);
      } catch (err) {
        console.error("Masalliqlarni saqlashda xatolik:", err);
      }
    }
    setIsModalOpen(false);
  };

  const totalPages = Math.ceil(products.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return products.slice(start, start + itemsPerPage);
  }, [products, currentPage]);

  if (productsLoading) {
    return <div className="p-8 text-center">Yuklanmoqda...</div>;
  }

  return (
    <>
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Mahsulotlar ({products.length})</h2>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="mr-2 h-4 w-4" /> Yangi mahsulot
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {paginatedProducts.map((product) => (
          <div key={product.id} className="flex gap-4 rounded-lg border bg-card p-4 shadow-sm">
            <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-muted">
              <img
                src={product.image || "/placeholder.svg"}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex flex-1 flex-col justify-between">
              <div>
                <h3 className="font-semibold">{product.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {product.description}
                </p>
                <p className="font-medium text-primary">
                  {new Intl.NumberFormat("uz-UZ").format(product.price)} so'm
                </p>
              </div>
              <div className="flex gap-2 justify-end mt-2">
                <Button variant="ghost" size="icon" onClick={() => handleOpenModal(product)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => deleteProduct(product.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      <Dialog open={isIngredientDialogOpen} onOpenChange={setIsIngredientDialogOpen}>
        <DialogContent className="sm:max-w-[320px]">
          <DialogHeader>
            <DialogTitle>Masalliq qo&apos;shish</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-2">
              <Label>Tovar (omborxona)</Label>
              <Select value={newIngredientWarehouseId} onValueChange={setNewIngredientWarehouseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {warehouseItems.map((w) => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Miqdor (1 ta mahsulotga)</Label>
              <Input
                type="number"
                min={0.01}
                step="any"
                value={newIngredientQuantity}
                onChange={(e) => setNewIngredientQuantity(e.target.value)}
                placeholder="Mas. 2"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsIngredientDialogOpen(false)}>Bekor</Button>
              <Button type="button" onClick={addIngredientRow}>Qo&apos;shish</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Mahsulotni tahrirlash" : "Yangi mahsulot qo'shish"}
            </DialogTitle>
            <div className="text-sm text-muted-foreground">
              {editingProduct ? "Mahsulot ma'lumotlarini o'zgartiring va saqlash tugmasini bosing." : "Yangi mahsulot ma'lumotlarini kiriting."}
            </div>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nom</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Kategoriya</Label>
              <Select
                value={formData.category}
                onValueChange={(val: any) => setFormData({ ...formData, category: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.slug || cat.name.toLowerCase()}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="price">Narx</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label>Rasm</Label>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onImageChange}
              />
              <div className="flex gap-3 items-start">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => imageInputRef.current?.click()}
                  className="shrink-0"
                >
                  <ImagePlus className="h-4 w-4 mr-1" /> Fayl tanlash
                </Button>
                {(imagePreview || formData.image) && (
                  <div className="h-20 w-20 rounded-md overflow-hidden border bg-muted shrink-0">
                    <img
                      src={imagePreview || formData.image || ""}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Tarif</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label className="flex items-center gap-2">
                <ChefHat className="h-4 w-4" /> Masalliqlar
              </Label>
              <ul className="border rounded-md divide-y text-sm max-h-32 overflow-y-auto">
                {ingredients.length === 0 && (
                  <li className="px-3 py-2 text-muted-foreground">Masalliq qo&apos;shilmagan</li>
                )}
                {ingredients.map((row) => (
                  <li key={row.warehouse_product_id} className="px-3 py-2 flex justify-between items-center gap-2">
                    <span>{warehouseName(row.warehouse_product_id)}</span>
                    <span className="text-muted-foreground">{row.quantity} ta</span>
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeIngredient(row.warehouse_product_id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
              <Button type="button" variant="outline" size="sm" onClick={() => setIsIngredientDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-1" /> Masalliq qo&apos;shish
              </Button>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Bekor qilish</Button>
              <Button type="submit">{editingProduct ? "Saqlash" : "Qo'shish"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminMenu;
