import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { transactionApi, accountApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Plus, Trash2, Edit, Filter, Download } from 'lucide-react';
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

interface Transaction {
  id: string;
  type: string;
  amount: string;
  description: string;
  created_at: string;
  bank_account_id: string;
  gst_amount?: number;
  include_gst?: boolean;
}

interface Account {
  id: string;
  account_name: string;
  account_type: string;
  bank_name?: string;
}

const Transactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [filterType, setFilterType] = useState('this_month');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const [form, setForm] = useState({
    bank_account_id: '',
    type: 'expense',
    amount: '',
    description: '',
    include_gst: false,
  });

  useEffect(() => {
    fetchData();
  }, [filterType]);

  useEffect(() => {
    if (accounts.length > 0 && !form.bank_account_id) {
      setForm((prev) => ({ ...prev, bank_account_id: accounts[0].id }));
    }
  }, [accounts]);

  const fetchData = async () => {
    try {
      const [transactionRes, accountRes] = await Promise.all([
        transactionApi.getHistory(filterType),
        accountApi.getAccounts(),
      ]);

      if (transactionRes.success && transactionRes.data) {
        const data = transactionRes.data as any;
        const txns = data?.transactions || [];
        // Sort by created_at descending (latest first)
        const sorted = [...txns].sort((a: Transaction, b: Transaction) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setTransactions(sorted);
      } else {
        // If no transactions, set empty array
        setTransactions([]);
      }

      if (accountRes.success && accountRes.data) {
        const accountData = (accountRes.data as Account[]) || [];
        setAccounts(accountData);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      // Don't show error for empty data
      if (error instanceof Error && !error.message.includes('No data found')) {
        setTransactions([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await transactionApi.create(form);
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Transaction created successfully',
        });
        setShowCreateDialog(false);
        setForm({ bank_account_id: accounts[0]?.id || '', type: 'expense', amount: '', description: '', include_gst: false });
        fetchData();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create transaction',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setForm({
      bank_account_id: transaction.bank_account_id,
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.description,
      include_gst: false,
    });
    setShowEditDialog(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction) return;

    try {
      const response = await transactionApi.update(editingTransaction.id, {
        bank_account_id: form.bank_account_id,
        type: form.type,
        amount: form.amount,
        description: form.description,
        include_gst: form.include_gst,
      });
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Transaction updated successfully',
        });
        setShowEditDialog(false);
        setEditingTransaction(null);
        setForm({ bank_account_id: accounts[0]?.id || '', type: 'expense', amount: '', description: '', include_gst: false });
        fetchData();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update transaction',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;

    try {
      const response = await transactionApi.delete(id);
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Transaction deleted successfully',
        });
        fetchData();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete transaction',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadStatement = async () => {
    try {
      await transactionApi.downloadStatement(filterType);
      toast({
        title: 'Success',
        description: 'Statement downloaded successfully',
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: 'Download Not Available',
        description: 'Statement download is currently not available. Please contact support.',
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

  const getAccountName = (accountId: string) => {
    const account = accounts.find(acc => acc.id === accountId);
    return account ? `${account.account_name}${account.bank_name ? ` - ${account.bank_name}` : ''}` : 'Unknown';
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Transactions</h1>
          <p className="text-muted-foreground">View and manage your transactions</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Transaction
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Transaction</DialogTitle>
              <DialogDescription>Add a new transaction manually</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Account</Label>
                <Select value={form.bank_account_id} onValueChange={(v) => setForm({ ...form, bank_account_id: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.account_name} {acc.bank_name ? `- ${acc.bank_name}` : ''} ({acc.account_type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <Label>Amount</Label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  placeholder="Enter description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" className="w-full">Create Transaction</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle>Transaction History</CardTitle>
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="this_week">This Week</SelectItem>
                  <SelectItem value="last_week">Last Week</SelectItem>
                  <SelectItem value="this_month">This Month</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={handleDownloadStatement}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {transactions.map((txn, index) => (
              <div
                key={txn.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border border-border p-4 hover:bg-muted/50 transition-all hover:shadow-md animate-scale-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getTypeBadge(txn.type)}
                    {txn.include_gst && (
                      <Badge variant="outline" className="text-xs">GST</Badge>
                    )}
                    <span className="font-medium">{txn.description}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(txn.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className={`text-xl sm:text-2xl font-bold ${txn.type === 'income' || txn.type === 'loan_receivable' ? 'text-accent' : 'text-destructive'}`}>
                      {txn.type === 'income' || txn.type === 'loan_receivable' ? '+' : '-'}₹{parseFloat(String(txn.amount)).toLocaleString('en-IN')}
                    </span>
                    {txn.gst_amount && txn.gst_amount > 0 && (
                      <p className="text-xs text-muted-foreground">(incl. GST)</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(txn)}>
                      <Edit className="h-4 w-4 text-primary" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(txn.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {transactions.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No transactions found for this period
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
            <DialogDescription>Update transaction details</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label>Account</Label>
              <Select value={form.bank_account_id} onValueChange={(v) => setForm({ ...form, bank_account_id: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.account_name} {acc.bank_name ? `- ${acc.bank_name}` : ''} ({acc.account_type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <Label>Amount</Label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                placeholder="Enter description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
              />
            </div>
            <Button type="submit" className="w-full">Update Transaction</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Transactions;
