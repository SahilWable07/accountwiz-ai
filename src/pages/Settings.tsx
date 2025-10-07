import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { financialApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Settings as SettingsIcon, Save } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface FinancialSettings {
  id: string;
  financial_year_start: string;
  currency_code: string;
  language: string;
  timezone: string;
  gst_enabled: boolean;
  gst_rate: string;
}

const Settings = () => {
  const { authData } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [hasSettings, setHasSettings] = useState(false);

  const [form, setForm] = useState({
    financial_year_start: new Date().toISOString().split('T')[0],
    currency_code: 'INR',
    language: 'en',
    timezone: 'Asia/Kolkata',
    gst_enabled: false,
    gst_rate: 0,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await financialApi.getSettings();
      const data = response.data as FinancialSettings[];
      if (response.success && data && data.length > 0) {
        const settings = data[0];
        setForm({
          financial_year_start: settings.financial_year_start,
          currency_code: settings.currency_code,
          language: settings.language,
          timezone: settings.timezone,
          gst_enabled: settings.gst_enabled,
          gst_rate: Number(settings.gst_rate),
        });
        setHasSettings(true);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await financialApi.create(form);
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Financial settings saved successfully',
        });
        setHasSettings(true);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save settings',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your financial preferences and configurations</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5 text-primary" />
              <CardTitle>Financial Settings</CardTitle>
            </div>
            <CardDescription>Configure your financial year and currency</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="financial_year_start">Financial Year Start</Label>
                <Input
                  id="financial_year_start"
                  type="date"
                  value={form.financial_year_start}
                  onChange={(e) => setForm({ ...form, financial_year_start: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency_code">Currency Code</Label>
                <Input
                  id="currency_code"
                  placeholder="INR, USD, EUR"
                  value={form.currency_code}
                  onChange={(e) => setForm({ ...form, currency_code: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Input
                  id="language"
                  placeholder="en, hi"
                  value={form.language}
                  onChange={(e) => setForm({ ...form, language: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input
                  id="timezone"
                  placeholder="Asia/Kolkata"
                  value={form.timezone}
                  onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                  required
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="gst_enabled">Enable GST</Label>
                  <p className="text-sm text-muted-foreground">
                    Apply GST to eligible transactions
                  </p>
                </div>
                <Switch
                  id="gst_enabled"
                  checked={form.gst_enabled}
                  onCheckedChange={(checked) => setForm({ ...form, gst_enabled: checked })}
                />
              </div>

              {form.gst_enabled && (
                <div className="space-y-2">
                  <Label htmlFor="gst_rate">GST Rate (%)</Label>
                  <Input
                    id="gst_rate"
                    type="number"
                    placeholder="18"
                    value={form.gst_rate}
                    onChange={(e) => setForm({ ...form, gst_rate: Number(e.target.value) })}
                    required
                  />
                </div>
              )}

              <Button type="submit" className="w-full">
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <p className="text-lg font-medium">
                {authData?.user.first_name} {authData?.user.last_name}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <p className="text-lg font-medium">{authData?.user.email}</p>
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <p className="text-lg font-medium">{authData?.user.phone}</p>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <p className="text-lg font-medium capitalize">{authData?.user.status}</p>
            </div>
            <div className="space-y-2">
              <Label>User ID</Label>
              <p className="text-sm text-muted-foreground font-mono">{authData?.userId}</p>
            </div>
            <div className="space-y-2">
              <Label>Client ID</Label>
              <p className="text-sm text-muted-foreground font-mono">{authData?.clientId}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
