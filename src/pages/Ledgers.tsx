import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ledgerApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Plus, BookOpen } from 'lucide-react';
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

interface Ledger {
  id: string;
  name: string;
  type: string;
  balance: string;
}

const Ledgers = () => {
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [form, setForm] = useState({
    name: '',
    type: 'expense',
    balance: 0,
  });

  useEffect(() => {
    fetchLedgers();
  }, [page]);

  const fetchLedgers = async () => {
    try {
      const response = await ledgerApi.getLedgers(page, 10);
      if (response.success) {
        setLedgers(response.data as Ledger[]);
        if (response.meta) {
          setTotalPages(response.meta.total_pages);
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch ledgers',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await ledgerApi.create(form);
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Ledger created successfully',
        });
        setShowDialog(false);
        setForm({ name: '', type: 'expense', balance: 0 });
        fetchLedgers();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create ledger',
        variant: 'destructive',
      });
    }
  };

  const getTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      income: 'bg-accent/20 text-accent',
      expense: 'bg-destructive/20 text-destructive',
      loan_payable: 'bg-warning/20 text-warning',
      loan_receivable: 'bg-info/20 text-info',
    };
    return <Badge className={styles[type] || ''}>{type}</Badge>;
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ledgers</h1>
          <p className="text-muted-foreground">Manage your income, expense, and loan categories</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Ledger
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Ledger</DialogTitle>
              <DialogDescription>Add a new ledger category</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Ledger Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Rent, Salary, Utilities"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="loan_payable">Loan Payable</SelectItem>
                    <SelectItem value="loan_receivable">Loan Receivable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="balance">Initial Balance</Label>
                <Input
                  id="balance"
                  type="number"
                  placeholder="Enter initial balance"
                  value={form.balance}
                  onChange={(e) => setForm({ ...form, balance: Number(e.target.value) })}
                  required
                />
              </div>
              <Button type="submit" className="w-full">Create Ledger</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {ledgers.map((ledger) => (
          <Card key={ledger.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{ledger.name}</CardTitle>
                </div>
                {getTypeBadge(ledger.type)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">₹{Number(ledger.balance).toLocaleString()}</div>
              <p className="text-sm text-muted-foreground mt-2">Current Balance</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {ledgers.length === 0 && (
        <Card className="p-12 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No ledgers yet</h3>
          <p className="text-muted-foreground mb-4">Create your first ledger to categorize your transactions</p>
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Ledger
          </Button>
        </Card>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-4">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default Ledgers;
