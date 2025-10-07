import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { transactionApi, accountApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { TrendingUp, TrendingDown, Wallet, Send, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Balance {
  income: number;
  expense: number;
  loan_payable: number;
  loan_receivable: number;
  total: number;
}

interface Account {
  id: string;
  account_name: string;
  account_type: string;
  balance: number;
  bank_name?: string;
}

const Dashboard = () => {
  const [query, setQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [previewData, setPreviewData] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [balanceRes, accountsRes] = await Promise.all([
        transactionApi.getTotalBalance('this_month'),
        accountApi.getAccounts(),
      ]);

      if (balanceRes.success && balanceRes.data) {
        const data = balanceRes.data as any;
        if (data.summary) {
          setBalance(data.summary);
        }
      }

      if (accountsRes.success && accountsRes.data) {
        const accountData = accountsRes.data as Account[];
        setAccounts(accountData);
        if (accountData.length > 0) {
          setSelectedAccountId(accountData[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  const handleQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    // First, show account selection dialog
    setIsProcessing(true);
    try {
      // Call API without bank_account_id to get preview
      const response = await transactionApi.createWithQuery(query);
      
      if (response.status_code === 200 && response.meta?.requires === 'bank_account_id') {
        // Show preview and ask for account
        setPreviewData(response.data);
        toast({
          title: 'Select Account',
          description: response.message || 'Please select an account to complete the transaction',
        });
      } else if (response.success) {
        // Transaction created successfully
        toast({
          title: 'Success',
          description: response.message || 'Transaction created successfully',
        });
        setQuery('');
        setPreviewData(null);
        fetchData();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to process query',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmTransaction = async () => {
    if (!selectedAccountId) {
      toast({
        title: 'Error',
        description: 'Please select an account',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    try {
      const response = await transactionApi.createWithQuery(query, selectedAccountId);
      
      if (response.success) {
        toast({
          title: 'Transaction created',
          description: response.message,
        });
        setQuery('');
        setPreviewData(null);
        fetchData();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create transaction',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your financial activity</p>
      </div>

      {/* Balance Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-accent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{balance?.income.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-destructive">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{balance?.expense.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-warning">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Loan Payable</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{balance?.loan_payable.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">Outstanding</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-info">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Loan Receivable</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{balance?.loan_receivable.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">To receive</p>
          </CardContent>
        </Card>
      </div>

      {/* Natural Language Input */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            Quick Transaction
          </CardTitle>
          <CardDescription>
            Add a transaction using natural language, e.g., "Add expense of ₹500 for groceries"
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleQuerySubmit} className="flex gap-2">
            <Input
              placeholder="Type your transaction..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={isProcessing}>
              {isProcessing ? 'Processing...' : 'Add'}
            </Button>
          </form>

          {previewData && (
            <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-3">
              <h4 className="font-semibold">Transaction Preview</h4>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <Badge>{previewData.type}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-medium">₹{previewData.amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Description:</span>
                  <span className="font-medium">{previewData.description}</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Account</label>
                <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.account_name} - {account.account_type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={confirmTransaction} disabled={isProcessing} className="w-full">
                Confirm Transaction
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Accounts Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Your Accounts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="rounded-lg border border-border bg-card p-4 space-y-2 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{account.account_name}</h4>
                  <Badge variant="outline">{account.account_type}</Badge>
                </div>
                {account.bank_name && (
                  <p className="text-sm text-muted-foreground">{account.bank_name}</p>
                )}
                <p className="text-2xl font-bold">₹{account.balance.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
