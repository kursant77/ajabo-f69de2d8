
import { useState, useMemo } from "react";
import {
    Package,
    Plus,
    Search,
    AlertTriangle,
    Edit2,
    Trash2,
    ArrowDownRight,
    Database,
    MoreVertical
} from "lucide-react";
import { useSupabaseWarehouse, type WarehouseProduct } from "@/hooks/useSupabaseWarehouse";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import StatsCard from "@/components/admin/StatsCard";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const AdminInventory = () => {
    const {
        items,
        loading,
        tableExists,
        addProductType,
        addStock,
        updateProductType,
        deleteProductType,
    } = useSupabaseWarehouse();

    const [searchQuery, setSearchQuery] = useState("");
    const [isAddTypeDialogOpen, setIsAddTypeDialogOpen] = useState(false);
    const [isAddStockDialogOpen, setIsAddStockDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<WarehouseProduct | null>(null);
    const [selectedForStock, setSelectedForStock] = useState<WarehouseProduct | null>(null);
    const [addStockAmount, setAddStockAmount] = useState("");
    const [formData, setFormData] = useState({
        name: "",
        unit: "dona",
    });

    const filteredItems = useMemo(() => {
        return items.filter((item) =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [items, searchQuery]);

    const stats = useMemo(() => {
        const totalItems = items.length;
        const lowStock = items.filter((item) => item.quantity < 10).length;
        return { totalItems, lowStock };
    }, [items]);

    const handleOpenAddType = () => {
        setEditingItem(null);
        setFormData({ name: "", unit: "dona" });
        setIsAddTypeDialogOpen(true);
    };

    const handleOpenEdit = (item: WarehouseProduct) => {
        setEditingItem(item);
        setFormData({ name: item.name, unit: item.unit });
        setIsAddTypeDialogOpen(true);
    };

    const handleOpenAddStock = (item: WarehouseProduct) => {
        setSelectedForStock(item);
        setAddStockAmount("");
        setIsAddStockDialogOpen(true);
    };

    const handleSubmitType = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingItem) {
            await updateProductType(editingItem.id, formData);
        } else {
            await addProductType({ name: formData.name, unit: formData.unit });
        }
        setIsAddTypeDialogOpen(false);
    };

    const handleSubmitStock = async (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseInt(addStockAmount, 10);
        if (!selectedForStock || isNaN(amount) || amount <= 0) {
            toast.error("Iltimos, to'g'ri miqdor kiriting");
            return;
        }
        await addStock(selectedForStock.id, amount);
        setIsAddStockDialogOpen(false);
        setSelectedForStock(null);
        setAddStockAmount("");
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Haqiqatan ham ushbu mahsulotni o'chirmoqchimisiz?")) {
            deleteProductType(id);
        }
    };

    const sqlCode = `
-- Omborhona (tavarlar / mahsulot turlari)
CREATE TABLE warehouse_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  quantity DECIMAL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'dona',
  min_quantity INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE warehouse_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for warehouse_products" ON warehouse_products FOR ALL USING (true);

-- Buyurtma orqali ayirilganini belgilash (ikki marta ayirilishining oldini olish)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS warehouse_deducted BOOLEAN DEFAULT false;
`.trim();

    if (loading) return <div className="p-8 text-center text-muted-foreground">Yuklanmoqda...</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {!tableExists && (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-6 flex flex-col md:flex-row items-start gap-4">
                    <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full text-red-600 dark:text-red-400">
                        <AlertTriangle className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-red-900 dark:text-red-100 mb-1">Ma'lumotlar bazasi jadvali topilmadi</h3>
                        <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                            Omborhona ma'lumotlarini saqlash uchun quyidagi SQL kodni Supabase Dashboard → SQL Editor qismida ishlating.
                        </p>
                        <details className="cursor-pointer">
                            <summary className="text-xs font-bold text-red-900 dark:text-red-100 border-b border-red-900 dark:border-red-100 inline-block">SQL Kodni ko'rish</summary>
                            <pre className="mt-4 p-4 bg-slate-900 text-slate-100 rounded-lg text-xs overflow-x-auto">
                                {sqlCode}
                            </pre>
                        </details>
                    </div>
                    <Button
                        variant="outline"
                        className="border-red-900 text-red-900 hover:bg-red-100 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-900/30 gap-2 shrink-0"
                        onClick={() => {
                            navigator.clipboard.writeText(sqlCode);
                            toast.success("SQL kod nusxalandi!");
                        }}
                    >
                        <Database className="h-4 w-4" /> Nusxalash
                    </Button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StatsCard title="Jami mahsulotlar" value={stats.totalItems} icon={Package} />
                <StatsCard
                    title="Kam qolganlar"
                    value={stats.lowStock}
                    icon={AlertTriangle}
                    className={stats.lowStock > 0 ? "border-red-200 bg-red-50/30 dark:border-red-800 dark:bg-red-950/20" : ""}
                    change={stats.lowStock > 0 ? "E'tibor bering" : "Hammasi joyida"}
                    changeType={stats.lowStock > 0 ? "negative" : "positive"}
                />
            </div>

            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Mahsulot nomi bo'yicha qidirish..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Button onClick={handleOpenAddType} className="w-full md:w-auto gap-2">
                    <Plus className="h-4 w-4" /> Mahsulot qo'shish
                </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredItems.map((item) => {
                    const isLow = item.quantity < 10;
                    return (
                        <Card
                            key={item.id}
                            className={cn(
                                "cursor-pointer transition-all hover:shadow-md hover:border-primary/30",
                                isLow && "border-red-300 dark:border-red-700 bg-red-50/30 dark:bg-red-950/20"
                            )}
                            onClick={() => handleOpenAddStock(item)}
                        >
                            <CardContent className="p-5 relative">
                                <div className="absolute top-3 right-2" onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleOpenEdit(item)}>
                                                <Edit2 className="h-4 w-4 mr-2" /> Tahrirlash
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="text-destructive focus:text-destructive"
                                                onClick={() => handleDelete(item.id)}
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" /> O'chirish
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <div className="pr-8">
                                    <h3 className="font-semibold text-lg text-foreground">{item.name}</h3>
                                    <p className="text-sm text-muted-foreground mt-0.5">{item.unit}</p>
                                    <p
                                        className={cn(
                                            "mt-3 text-xl font-bold",
                                            isLow ? "text-red-600 dark:text-red-400" : "text-foreground"
                                        )}
                                    >
                                        {item.quantity} {item.unit}
                                        {isLow && <ArrowDownRight className="inline h-4 w-4 ml-1 text-red-500" />}
                                    </p>
                                    {isLow && (
                                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">Kam qoldi</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
            {filteredItems.length === 0 && (
                <div className="text-center py-12 text-muted-foreground rounded-2xl border border-dashed border-border/50">
                    Hech qanday mahsulot yo'q. &quot;Mahsulot qo'shish&quot; tugmasi orqali qo'shing.
                </div>
            )}

            <Dialog open={isAddTypeDialogOpen} onOpenChange={setIsAddTypeDialogOpen}>
                <DialogContent className="max-w-md">
                    <form onSubmit={handleSubmitType}>
                        <DialogHeader>
                            <DialogTitle>{editingItem ? "Mahsulotni tahrirlash" : "Mahsulot qo'shish"}</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Mahsulot nomi</label>
                                <Input
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Masalan: Cola, Katlet"
                                />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">O'lchami</label>
                                <Input
                                    value={formData.unit}
                                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                    placeholder="dona, shisha, kg..."
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsAddTypeDialogOpen(false)}>
                                Bekor qilish
                            </Button>
                            <Button type="submit">{editingItem ? "Saqlash" : "Qo'shish"}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={isAddStockDialogOpen} onOpenChange={setIsAddStockDialogOpen}>
                <DialogContent className="max-w-md">
                    <form onSubmit={handleSubmitStock}>
                        <DialogHeader>
                            <DialogTitle>Omborxonaga jo'natish</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            {selectedForStock && (
                                <p className="text-sm text-muted-foreground">
                                    <span className="font-medium text-foreground">{selectedForStock.name}</span> — omborxona qoldig'i:{" "}
                                    {selectedForStock.quantity} {selectedForStock.unit}
                                </p>
                            )}
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Soni</label>
                                <Input
                                    type="number"
                                    min={1}
                                    required
                                    value={addStockAmount}
                                    onChange={(e) => setAddStockAmount(e.target.value)}
                                    placeholder="Miqdor kiriting"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsAddStockDialogOpen(false)}>
                                Bekor qilish
                            </Button>
                            <Button type="submit">
                                Omborxonaga jo'natish
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminInventory;
