import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { inventoryApi, accountApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Plus, Package } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Account {
  id: string;
  account_name: string;
  account_type: string;
}

const Inventory = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showDialog, setShowDialog] = useState(false);

  const [form, setForm] = useState({
    bank_account_id: '',
    item_name: '',
    description: '',
    category: '',
    quantity: '',
    unit_price: '',
    total_value: '',
    unit: 'pcs',
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await accountApi.getAccounts();
      if (response.success) {
        const accountData = response.data as Account[];
        setAccounts(accountData);
        if (accountData.length > 0) {
          setForm((prev) => ({ ...prev, bank_account_id: accountData[0].id }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await inventoryApi.create(form);
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Inventory item created successfully',
        });
        setShowDialog(false);
        setForm({
          bank_account_id: accounts[0]?.id || '',
          item_name: '',
          description: '',
          category: '',
          quantity: '',
          unit_price: '',
          total_value: '',
          unit: 'pcs',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create inventory item',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (form.quantity && form.unit_price) {
      const total = Number(form.quantity) * Number(form.unit_price);
      setForm((prev) => ({ ...prev, total_value: total.toString() }));
    }
  }, [form.quantity, form.unit_price]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inventory</h1>
          <p className="text-muted-foreground">Manage your inventory and assets</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Inventory Item</DialogTitle>
              <DialogDescription>Add a new item to your inventory</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Account</Label>
                <Select
                  value={form.bank_account_id}
                  onValueChange={(v) => setForm({ ...form, bank_account_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.account_name} - {acc.account_type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="item_name">Item Name</Label>
                <Input
                  id="item_name"
                  placeholder="e.g., Laptop, Office Chair"
                  value={form.item_name}
                  onChange={(e) => setForm({ ...form, item_name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Enter item description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  placeholder="e.g., Electronics, Furniture"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    placeholder="Enter quantity"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Input
                    id="unit"
                    placeholder="pcs, kg, ltr"
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit_price">Unit Price</Label>
                <Input
                  id="unit_price"
                  type="number"
                  placeholder="Enter unit price"
                  value={form.unit_price}
                  onChange={(e) => setForm({ ...form, unit_price: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="total_value">Total Value</Label>
                <Input
                  id="total_value"
                  type="number"
                  placeholder="Auto-calculated"
                  value={form.total_value}
                  readOnly
                  className="bg-muted"
                />
              </div>

              <Button type="submit" className="w-full">
                Add to Inventory
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-12 text-center">
        <Package className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">Inventory Management</h3>
        <p className="text-muted-foreground mb-4">
          Track your assets, stock, and inventory items
        </p>
        <p className="text-sm text-muted-foreground">
          Click "Add Item" to create your first inventory entry
        </p>
      </Card>
    </div>
  );
};

export default Inventory;
