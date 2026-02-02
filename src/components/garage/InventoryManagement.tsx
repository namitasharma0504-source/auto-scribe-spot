import { useState, useEffect } from "react";
import { Plus, Search, Package, AlertTriangle, Edit2, Trash2, Filter, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SparePartItem {
  id: string;
  part_name: string;
  part_number: string | null;
  brand: string | null;
  category: string | null;
  quantity: number;
  min_stock_level: number | null;
  purchase_price: number | null;
  selling_price: number;
  warehouse_location: string | null;
  supplier_name: string | null;
  supplier_contact: string | null;
  last_restocked_at: string | null;
  created_at: string;
}

interface InventoryManagementProps {
  garageId: string;
}

const PART_CATEGORIES = [
  "Engine Parts",
  "Brake System",
  "Suspension",
  "Electrical",
  "Body Parts",
  "Filters",
  "Fluids & Oils",
  "Tyres & Wheels",
  "Batteries",
  "Accessories",
  "Other",
];

export function InventoryManagement({ garageId }: InventoryManagementProps) {
  const [inventory, setInventory] = useState<SparePartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState<SparePartItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    part_name: "",
    part_number: "",
    brand: "",
    category: "",
    quantity: 0,
    min_stock_level: 5,
    purchase_price: 0,
    selling_price: 0,
    warehouse_location: "",
    supplier_name: "",
    supplier_contact: "",
  });

  useEffect(() => {
    fetchInventory();
  }, [garageId]);

  const fetchInventory = async () => {
    try {
      const { data, error } = await supabase
        .from("spare_parts_inventory")
        .select("*")
        .eq("garage_id", garageId)
        .order("part_name", { ascending: true });

      if (error) throw error;
      setInventory(data || []);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      toast({
        title: "Error",
        description: "Failed to load inventory.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      item.part_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.part_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.brand?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    
    const matchesLowStock = !showLowStockOnly || 
      (item.min_stock_level && item.quantity <= item.min_stock_level);

    return matchesSearch && matchesCategory && matchesLowStock;
  });

  const lowStockCount = inventory.filter(
    (item) => item.min_stock_level && item.quantity <= item.min_stock_level
  ).length;

  const totalValue = inventory.reduce(
    (sum, item) => sum + item.quantity * item.selling_price,
    0
  );

  const handleAddPart = () => {
    setSelectedPart(null);
    setFormData({
      part_name: "",
      part_number: "",
      brand: "",
      category: "",
      quantity: 0,
      min_stock_level: 5,
      purchase_price: 0,
      selling_price: 0,
      warehouse_location: "",
      supplier_name: "",
      supplier_contact: "",
    });
    setDialogOpen(true);
  };

  const handleEditPart = (part: SparePartItem) => {
    setSelectedPart(part);
    setFormData({
      part_name: part.part_name,
      part_number: part.part_number || "",
      brand: part.brand || "",
      category: part.category || "",
      quantity: part.quantity,
      min_stock_level: part.min_stock_level || 5,
      purchase_price: part.purchase_price || 0,
      selling_price: part.selling_price,
      warehouse_location: part.warehouse_location || "",
      supplier_name: part.supplier_name || "",
      supplier_contact: part.supplier_contact || "",
    });
    setDialogOpen(true);
  };

  const handleDeleteClick = (part: SparePartItem) => {
    setSelectedPart(part);
    setDeleteDialogOpen(true);
  };

  const handleSavePart = async () => {
    if (!formData.part_name.trim()) {
      toast({
        title: "Error",
        description: "Part name is required.",
        variant: "destructive",
      });
      return;
    }

    if (formData.selling_price <= 0) {
      toast({
        title: "Error",
        description: "Selling price must be greater than 0.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const partData = {
        garage_id: garageId,
        part_name: formData.part_name.trim(),
        part_number: formData.part_number.trim() || null,
        brand: formData.brand.trim() || null,
        category: formData.category || null,
        quantity: formData.quantity,
        min_stock_level: formData.min_stock_level,
        purchase_price: formData.purchase_price || null,
        selling_price: formData.selling_price,
        warehouse_location: formData.warehouse_location.trim() || null,
        supplier_name: formData.supplier_name.trim() || null,
        supplier_contact: formData.supplier_contact.trim() || null,
      };

      if (selectedPart) {
        const { error } = await supabase
          .from("spare_parts_inventory")
          .update(partData)
          .eq("id", selectedPart.id);

        if (error) throw error;
        toast({ title: "Success", description: "Part updated successfully." });
      } else {
        const { error } = await supabase
          .from("spare_parts_inventory")
          .insert(partData);

        if (error) throw error;
        toast({ title: "Success", description: "Part added successfully." });
      }

      setDialogOpen(false);
      fetchInventory();
    } catch (error: any) {
      console.error("Error saving part:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save part.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePart = async () => {
    if (!selectedPart) return;

    try {
      const { error } = await supabase
        .from("spare_parts_inventory")
        .delete()
        .eq("id", selectedPart.id);

      if (error) throw error;
      
      toast({ title: "Success", description: "Part deleted successfully." });
      setDeleteDialogOpen(false);
      fetchInventory();
    } catch (error: any) {
      console.error("Error deleting part:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete part.",
        variant: "destructive",
      });
    }
  };

  const handleRestockPart = async (part: SparePartItem) => {
    const quantity = prompt("Enter quantity to add:", "10");
    if (!quantity) return;

    const addQty = parseInt(quantity);
    if (isNaN(addQty) || addQty <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid quantity.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("spare_parts_inventory")
        .update({
          quantity: part.quantity + addQty,
          last_restocked_at: new Date().toISOString(),
        })
        .eq("id", part.id);

      if (error) throw error;
      
      toast({ 
        title: "Restocked", 
        description: `Added ${addQty} units to ${part.part_name}.` 
      });
      fetchInventory();
    } catch (error: any) {
      console.error("Error restocking:", error);
      toast({
        title: "Error",
        description: "Failed to restock item.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Parts</p>
                <p className="text-2xl font-bold">{inventory.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Package className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Units</p>
                <p className="text-2xl font-bold">
                  {inventory.reduce((sum, item) => sum + item.quantity, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={lowStockCount > 0 ? "border-orange-300 bg-orange-50/50" : ""}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Low Stock Items</p>
                <p className="text-2xl font-bold text-orange-600">{lowStockCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Package className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Inventory Value</p>
                <p className="text-2xl font-bold">₹{totalValue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Spare Parts Inventory</CardTitle>
              <CardDescription>Manage your garage's spare parts stock</CardDescription>
            </div>
            <Button onClick={handleAddPart} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Part
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, part number, or brand..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {PART_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant={showLowStockOnly ? "default" : "outline"}
              onClick={() => setShowLowStockOnly(!showLowStockOnly)}
              className="gap-2"
            >
              <AlertTriangle className="w-4 h-4" />
              Low Stock ({lowStockCount})
            </Button>
          </div>

          {/* Table */}
          {filteredInventory.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>{inventory.length === 0 ? "No parts in inventory. Add your first part!" : "No parts match your filters."}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Part Name</TableHead>
                    <TableHead>Part #</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-right">Selling Price</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory.map((part) => {
                    const isLowStock = part.min_stock_level && part.quantity <= part.min_stock_level;
                    return (
                      <TableRow key={part.id} className={isLowStock ? "bg-orange-50" : ""}>
                        <TableCell className="font-medium">
                          {part.part_name}
                          {isLowStock && (
                            <Badge variant="outline" className="ml-2 text-orange-600 border-orange-300 bg-orange-100">
                              Low Stock
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {part.part_number || "-"}
                        </TableCell>
                        <TableCell>{part.brand || "-"}</TableCell>
                        <TableCell>
                          {part.category && (
                            <Badge variant="secondary">{part.category}</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          <span className={isLowStock ? "text-orange-600" : ""}>
                            {part.quantity}
                          </span>
                          {part.min_stock_level && (
                            <span className="text-xs text-muted-foreground ml-1">
                              /{part.min_stock_level}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ₹{part.selling_price.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {part.warehouse_location || "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleRestockPart(part)}
                              title="Restock"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleEditPart(part)}
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDeleteClick(part)}
                              className="text-destructive hover:text-destructive"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedPart ? "Edit Part" : "Add New Part"}</DialogTitle>
            <DialogDescription>
              {selectedPart ? "Update the part details below." : "Enter the details of the new spare part."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="part_name">Part Name *</Label>
                <Input
                  id="part_name"
                  value={formData.part_name}
                  onChange={(e) => setFormData({ ...formData, part_name: e.target.value })}
                  placeholder="e.g., Brake Pad Set"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="part_number">Part Number</Label>
                <Input
                  id="part_number"
                  value={formData.part_number}
                  onChange={(e) => setFormData({ ...formData, part_number: e.target.value })}
                  placeholder="e.g., BP-12345"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  placeholder="e.g., Bosch"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {PART_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Current Stock</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="min_stock_level">Minimum Stock Level</Label>
                <Input
                  id="min_stock_level"
                  type="number"
                  min="0"
                  value={formData.min_stock_level}
                  onChange={(e) => setFormData({ ...formData, min_stock_level: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purchase_price">Purchase Price (₹)</Label>
                <Input
                  id="purchase_price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.purchase_price}
                  onChange={(e) => setFormData({ ...formData, purchase_price: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="selling_price">Selling Price (₹) *</Label>
                <Input
                  id="selling_price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.selling_price}
                  onChange={(e) => setFormData({ ...formData, selling_price: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="warehouse_location">Warehouse Location</Label>
              <Input
                id="warehouse_location"
                value={formData.warehouse_location}
                onChange={(e) => setFormData({ ...formData, warehouse_location: e.target.value })}
                placeholder="e.g., Rack A, Shelf 3"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplier_name">Supplier Name</Label>
                <Input
                  id="supplier_name"
                  value={formData.supplier_name}
                  onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                  placeholder="e.g., ABC Auto Parts"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier_contact">Supplier Contact</Label>
                <Input
                  id="supplier_contact"
                  value={formData.supplier_contact}
                  onChange={(e) => setFormData({ ...formData, supplier_contact: e.target.value })}
                  placeholder="e.g., 9876543210"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePart} disabled={isSaving}>
              {isSaving ? "Saving..." : selectedPart ? "Update Part" : "Add Part"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Part</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedPart?.part_name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePart} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
