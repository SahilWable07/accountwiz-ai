import { getAuthData } from './auth';

const API_BASE_URL = 'http://localhost:8000';
const AUTH_API_URL = 'https://dt1wp7hrm9.execute-api.ap-south-1.amazonaws.com/auth/api/auth';

interface ApiResponse<T = any> {
  success: boolean;
  status_code: number;
  message: string;
  data: T;
  error: any;
  meta: any;
}

async function makeRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const authData = getAuthData();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (authData?.accessToken) {
    headers['Authorization'] = `Bearer ${authData.accessToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || error.detail || 'Request failed');
  }

  return response.json();
}

// Auth APIs
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await fetch(`${AUTH_API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    return response.json();
  },

  requestOtp: async (phone: string) => {
    const response = await fetch(`${AUTH_API_URL}/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });

    if (!response.ok) {
      throw new Error('Failed to send OTP');
    }

    return response.json();
  },

  verifyOtp: async (phone: string, otp: string) => {
    const response = await fetch(`${AUTH_API_URL}/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp }),
    });

    if (!response.ok) {
      throw new Error('OTP verification failed');
    }

    return response.json();
  },
};

// Account APIs
export const accountApi = {
  createBank: async (data: {
    account_name: string;
    account_number: string;
    bank_name: string;
    balance: number;
  }) => {
    const authData = getAuthData();
    return makeRequest('/accounts/bank', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        account_type: 'bank',
        client_id: authData?.clientId,
        user_id: authData?.userId,
        token: authData?.accessToken,
      }),
    });
  },

  createCash: async (balance: number) => {
    const authData = getAuthData();
    return makeRequest('/accounts/cash', {
      method: 'POST',
      body: JSON.stringify({
        balance,
        client_id: authData?.clientId,
        user_id: authData?.userId,
        token: authData?.accessToken,
      }),
    });
  },

  getAccounts: async () => {
    const authData = getAuthData();
    return makeRequest(`/accounts/${authData?.clientId}/${authData?.userId}`);
  },
};

// Financial Settings APIs
export const financialApi = {
  create: async (data: {
    financial_year_start: string;
    currency_code: string;
    language: string;
    timezone: string;
    gst_enabled: boolean;
    gst_rate: number;
  }) => {
    const authData = getAuthData();
    return makeRequest('/accounts/financial_settings', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        client_id: authData?.clientId,
        user_id: authData?.userId,
      }),
    });
  },

  getSettings: async () => {
    const authData = getAuthData();
    return makeRequest(
      `/accounts/financial_settings?user_id=${authData?.userId}&client_id=${authData?.clientId}&limit=10&offset=0`
    );
  },
};

// Ledger APIs
export const ledgerApi = {
  create: async (data: { name: string; type: string; balance: number }) => {
    const authData = getAuthData();
    return makeRequest('/ledgers/', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        client_id: authData?.clientId,
        user_id: authData?.userId,
      }),
    });
  },

  getLedgers: async (page = 1, size = 10) => {
    const authData = getAuthData();
    return makeRequest(
      `/ledgers/${authData?.clientId}/${authData?.userId}?page=${page}&size=${size}`
    );
  },
};

// Transaction APIs
export const transactionApi = {
  createWithQuery: async (query: string, bank_account_id?: string) => {
    const authData = getAuthData();
    return makeRequest('/transactions/query', {
      method: 'POST',
      body: JSON.stringify({
        query,
        bank_account_id,
        client_id: authData?.clientId,
        user_id: authData?.userId,
      }),
    });
  },

  create: async (data: {
    bank_account_id: string;
    type: string;
    amount: string;
    description: string;
    include_gst: boolean;
  }) => {
    const authData = getAuthData();
    return makeRequest('/transactions/', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        client_id: authData?.clientId,
        user_id: authData?.userId,
      }),
    });
  },

  update: async (
    transaction_id: string,
    data: Partial<{
      bank_account_id: string;
      type: string;
      amount: string;
      description: string;
      include_gst: boolean;
    }>
  ) => {
    const authData = getAuthData();
    return makeRequest(
      `/transactions/update?transaction_id=${transaction_id}&user_id=${authData?.userId}&client_id=${authData?.clientId}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
  },

  delete: async (transaction_id: string) => {
    const authData = getAuthData();
    return makeRequest(
      `/transactions/delete?transaction_id=${transaction_id}&user_id=${authData?.userId}&client_id=${authData?.clientId}`,
      { method: 'DELETE' }
    );
  },

  getHistory: async (
    filter_type: string,
    start_date?: string,
    end_date?: string
  ) => {
    const authData = getAuthData();
    let url = `/transactions/history?filter_type=${filter_type}&user_id=${authData?.userId}&client_id=${authData?.clientId}`;
    if (start_date && end_date) {
      url += `&start_date=${start_date}&end_date=${end_date}`;
    }
    return makeRequest(url);
  },

  downloadStatement: async (filter_type: string) => {
    const authData = getAuthData();
    const url = `/transactions/download_statement?filter_type=${filter_type}&user_id=${authData?.userId}&client_id=${authData?.clientId}`;
    const response = await fetch(`${API_BASE_URL}${url}`, {
      headers: {
        'Authorization': `Bearer ${authData?.accessToken}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to download statement');
    }
    
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `statement_${filter_type}_${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },

  getTotalBalance: async (period: string) => {
    const authData = getAuthData();
    return makeRequest(
      `/transactions/total_balance?period=${period}&user_id=${authData?.userId}&client_id=${authData?.clientId}`
    );
  },
};

// Inventory APIs
export const inventoryApi = {
  create: async (data: {
    bank_account_id: string;
    item_name: string;
    description: string;
    category: string;
    quantity: string;
    unit_price: string;
    total_value: string;
    unit: string;
  }) => {
    const authData = getAuthData();
    return makeRequest('/inventory/', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        client_id: authData?.clientId,
        user_id: authData?.userId,
      }),
    });
  },
};
