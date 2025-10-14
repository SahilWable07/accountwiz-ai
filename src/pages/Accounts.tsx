import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { accountApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Plus, Wallet, DollarSign } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Account {
  id: string;
  account_name: string;
  account_number?: string;
  bank_name?: string;
  account_type: string;
  balance: number;
  is_active: string;
  created_at: string;
}

const Accounts = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showBankDialog, setShowBankDialog] = useState(false);
  const [showCashDialog, setShowCashDialog] = useState(false);

  const [bankForm, setBankForm] = useState({
    account_name: '',
    account_number: '',
    bank_name: '',
    balance: 0,
  });

  const [cashBalance, setCashBalance] = useState(0);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await accountApi.getAccounts();
      if (response.success) {
        setAccounts(Array.isArray(response.data) ? response.data : []);
      } else {
        setAccounts([]);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
      setAccounts([]);
      // Don't show error toast for empty accounts - this is normal for new users
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBank = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await accountApi.createBank(bankForm);
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Bank account created successfully',
        });
        setShowBankDialog(false);
        setBankForm({ account_name: '', account_number: '', bank_name: '', balance: 0 });
        fetchAccounts();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create account',
        variant: 'destructive',
      });
    }
  };

  const handleCreateCash = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await accountApi.createCash(cashBalance);
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Cash account created successfully',
        });
        setShowCashDialog(false);
        setCashBalance(0);
        fetchAccounts();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create cash account',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Accounts</h1>
          <p className="text-muted-foreground">Manage your bank and cash accounts</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showCashDialog} onOpenChange={setShowCashDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <DollarSign className="mr-2 h-4 w-4" />
                Add Cash Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Cash Account</DialogTitle>
                <DialogDescription>Add a new cash account to track cash transactions</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateCash} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cashBalance">Initial Balance</Label>
                  <Input
                    id="cashBalance"
                    type="number"
                    placeholder="Enter balance"
                    value={cashBalance}
                    onChange={(e) => setCashBalance(Number(e.target.value))}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">Create Cash Account</Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={showBankDialog} onOpenChange={setShowBankDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Bank Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Bank Account</DialogTitle>
                <DialogDescription>Add a new bank account to track your finances</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateBank} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="accountName">Account Name</Label>
                  <Input
                    id="accountName"
                    placeholder="e.g., Savings Account"
                    value={bankForm.account_name}
                    onChange={(e) => setBankForm({ ...bankForm, account_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    placeholder="e.g., HDFC, ICICI"
                    value={bankForm.bank_name}
                    onChange={(e) => setBankForm({ ...bankForm, bank_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="balance">Initial Balance</Label>
                  <Input
                    id="balance"
                    type="number"
                    placeholder="Enter balance"
                    value={bankForm.balance}
                    onChange={(e) => setBankForm({ ...bankForm, balance: Number(e.target.value) })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">Create Account</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {accounts.map((account) => (
          <Card key={account.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{account.account_name}</CardTitle>
                </div>
                <Badge variant={account.account_type === 'bank' ? 'default' : 'secondary'}>
                  {account.account_type}
                </Badge>
              </div>
              {account.bank_name && (
                <CardDescription>{account.bank_name}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-2">
              {account.account_number && (
                <p className="text-sm text-muted-foreground">
                  A/C: {account.account_number}
                </p>
              )}
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">₹{account.balance.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline" className="text-xs">
                  {account.is_active}
                </Badge>
                <span>Created {new Date(account.created_at).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {accounts.length === 0 && (
        <Card className="p-12 text-center">
          <Wallet className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No accounts yet</h3>
          <p className="text-muted-foreground mb-4">Create your first account to get started</p>
          <Button onClick={() => setShowBankDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Account
          </Button>
        </Card>
      )}
    </div>
  );
};

export default Accounts;
