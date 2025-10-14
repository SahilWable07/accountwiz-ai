import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { transactionApi, accountApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { TrendingUp, TrendingDown, Wallet, Send, ArrowUpRight, ArrowDownRight, Download, Receipt } from 'lucide-react';
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

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  created_at: string;
  bank_account_id: string;
  gst_amount?: number;
  include_gst?: boolean;
}

const Dashboard = () => {
  const [query, setQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [previewData, setPreviewData] = useState<any>(null);
  const [latestTransactions, setLatestTransactions] = useState<Transaction[]>([]);
  const [filterType, setFilterType] = useState('today');

  useEffect(() => {
    fetchData();
  }, [filterType]);

  const fetchData = async () => {
    try {
      const [balanceRes, accountsRes, transactionsRes] = await Promise.all([
        transactionApi.getTotalBalance('this_month').catch(() => ({ success: true, data: null })),
        accountApi.getAccounts().catch(() => ({ success: true, data: [] })),
        transactionApi.getHistory(filterType).catch(() => ({ success: true, data: { transactions: [] } })),
      ]);

      if (balanceRes.success && balanceRes.data) {
        const data = balanceRes.data as any;
        if (data.summary) {
          setBalance(data.summary);
        }
      } else {
        setBalance(null);
      }

      if (accountsRes.success && accountsRes.data) {
        const accountData = Array.isArray(accountsRes.data) ? accountsRes.data : [];
        setAccounts(accountData);
        if (accountData.length > 0 && !selectedAccountId) {
          setSelectedAccountId(accountData[0].id);
        }
      } else {
        setAccounts([]);
      }

      if (transactionsRes.success && transactionsRes.data) {
        const data = transactionsRes.data as any;
        const txns = data?.transactions || [];
        // Sort by created_at descending (latest first) and take top 5
        const sorted = [...txns].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setLatestTransactions(sorted.slice(0, 5));
      } else {
        setLatestTransactions([]);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // Set empty defaults for new users
      setBalance(null);
      setAccounts([]);
      setLatestTransactions([]);
    }
  };

  const handleQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsProcessing(true);
    try {
      const queryLower = query.toLowerCase();
      const mentionsCash = queryLower.includes('cash');
      const mentionedAccount = accounts.find(acc => 
        queryLower.includes(acc.account_name.toLowerCase()) || 
        (acc.bank_name && queryLower.includes(acc.bank_name.toLowerCase()))
      );

      let accountToUse = mentionsCash 
        ? accounts.find(acc => acc.account_type === 'cash')?.id
        : mentionedAccount?.id;

      if (accountToUse) {
        const response = await transactionApi.createWithQuery(query, accountToUse);
        if (response.success) {
          toast({
            title: 'Success',
            description: response.message || 'Transaction created successfully',
          });
          setQuery('');
          fetchData();
        }
      } else {
        const response = await transactionApi.createWithQuery(query);
        
        if (response.status_code === 200 && response.meta?.requires === 'bank_account_id') {
          setPreviewData(response.data);
          toast({
            title: 'Select Account/Bank',
            description: 'Please select the account or bank to complete the transaction',
          });
        } else if (response.success) {
          toast({
            title: 'Success',
            description: response.message || 'Transaction created successfully',
          });
          setQuery('');
          fetchData();
        }
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your financial activity</p>
      </div>

      {/* Balance Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-accent hover:shadow-lg transition-shadow animate-scale-in">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{balance?.income.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-destructive hover:shadow-lg transition-shadow animate-scale-in" style={{ animationDelay: '0.1s' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{balance?.expense.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-warning hover:shadow-lg transition-shadow animate-scale-in" style={{ animationDelay: '0.2s' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Loan Payable</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{balance?.loan_payable.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">Outstanding</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-info hover:shadow-lg transition-shadow animate-scale-in" style={{ animationDelay: '0.3s' }}>
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
      <Card className="shadow-lg animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            Quick Transaction
          </CardTitle>
          <CardDescription>
            Add a transaction using natural language, e.g., "Add expense of ₹500 for groceries from HDFC"
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
            <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-3 animate-scale-in">
              <h4 className="font-semibold">Transaction Preview</h4>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  {getTypeBadge(previewData.type)}
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
                <label className="text-sm font-medium">Select Account/Bank</label>
                <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.account_name} - {account.bank_name || account.account_type}
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

      {/* Latest Transactions */}
      <Card className="animate-fade-in">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              Latest Transactions
            </CardTitle>
            <div className="flex gap-2 items-center">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="this_week">This Week</SelectItem>
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
            {latestTransactions.map((txn, index) => (
              <div
                key={txn.id}
                className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-muted/50 transition-all hover:shadow-md animate-scale-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="space-y-1 flex-1">
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
                  {txn.gst_amount && txn.gst_amount > 0 && (
                    <p className="text-xs text-muted-foreground">
                      GST: ₹{txn.gst_amount.toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <span className={`text-xl font-bold ${txn.type === 'income' || txn.type === 'loan_receivable' ? 'text-accent' : 'text-destructive'}`}>
                    {txn.type === 'income' || txn.type === 'loan_receivable' ? '+' : '-'}₹{Number(txn.amount).toLocaleString()}
                  </span>
                  {txn.gst_amount && txn.gst_amount > 0 && (
                    <p className="text-xs text-muted-foreground">(incl. GST)</p>
                  )}
                </div>
              </div>
            ))}
            {latestTransactions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No transactions found for this period
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Accounts Overview */}
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Your Accounts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {accounts.map((account, index) => (
              <div
                key={account.id}
                className="rounded-lg border border-border bg-card p-4 space-y-2 hover:shadow-lg transition-all hover:scale-105 animate-scale-in"
                style={{ animationDelay: `${index * 0.1}s` }}
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
            {accounts.length === 0 && (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                No accounts found. Create one to get started.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
