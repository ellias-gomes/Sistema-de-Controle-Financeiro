const API_BASE_URL = typeof window !== 'undefined' && window.location.port === '5173'
  ? '/api'
  : 'http://127.0.0.1:8000/api';

async function request(endpoint, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const sep = endpoint.includes('?') ? '&' : '?';
  // Append cache buster to GET requests to guarantee fresh data
  const finalEndpoint = method === 'GET' ? `${endpoint}${sep}_t=${Date.now()}` : endpoint;
  const url = `${API_BASE_URL}${finalEndpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store',
    'Pragma': 'no-cache',
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, { 
      ...options, 
      cache: 'no-store',
      headers 
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Erro na requisição' }));
      throw new Error(errorData.detail || `HTTP Error ${response.status}`);
    }
    if (response.status === 204) return null;
    return await response.json();
  } catch (err) {
    console.error(`API Error on [${options.method || 'GET'}] ${url}:`, err);
    throw err;
  }
}

export const api = {
  // Dashboard
  getDashboardOverview: (month) => {
    const query = month ? `?month=${encodeURIComponent(month)}` : '';
    return request(`/dashboard/overview${query}`);
  },

  // Transactions
  getTransactions: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.month) params.append('month', filters.month);
    if (filters.type) params.append('type', filters.type);
    if (filters.sub_type) params.append('sub_type', filters.sub_type);
    if (filters.category_id) params.append('category_id', filters.category_id);
    if (filters.search) params.append('search', filters.search);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.offset) params.append('offset', filters.offset);
    const qs = params.toString();
    return request(`/transactions/${qs ? '?' + qs : ''}`);
  },

  createTransaction: (data) => {
    return request('/transactions/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateTransaction: (id, data) => {
    return request(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteTransaction: (id) => {
    return request(`/transactions/${id}`, {
      method: 'DELETE',
    });
  },

  clearAllTransactions: () => {
    return request('/transactions/clear/all', {
      method: 'DELETE',
    });
  },

  // Categories
  getCategories: (type) => {
    const query = type ? `?type=${encodeURIComponent(type)}` : '';
    return request(`/categories/${query}`);
  },

  createCategory: (data) => {
    return request('/categories/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateCategory: (id, data) => {
    return request(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteCategory: (id) => {
    return request(`/categories/${id}`, {
      method: 'DELETE',
    });
  },

  // Projections
  getInflationProjection: ({ annualRate, monthsAhead, lookbackMonths, includeDiscretionary, excludeCurrentMonth = false }) => {
    return request('/projections/inflation', {
      method: 'POST',
      body: JSON.stringify({
        annual_rate: Number(annualRate),
        months_ahead: Number(monthsAhead),
        lookback_months: Number(lookbackMonths),
        include_discretionary: Boolean(includeDiscretionary),
        exclude_current_month: Boolean(excludeCurrentMonth),
        baseline_mode: Number(lookbackMonths) === 1 ? 'latest_month' : 'average_months',
      }),
    });
  },

  getEmergencyFundOverview: ({ lookbackMonths = 3, annualRate = 4.5, customLiquidAssets = null }) => {
    const params = new URLSearchParams();
    if (lookbackMonths) params.append('lookback_months', lookbackMonths);
    if (annualRate !== undefined && annualRate !== null) params.append('annual_rate', annualRate);
    if (customLiquidAssets !== null && customLiquidAssets !== undefined && customLiquidAssets !== '') {
      params.append('custom_liquid_assets', customLiquidAssets);
    }
    const qs = params.toString();
    return request(`/projections/emergency-fund${qs ? '?' + qs : ''}`);
  },

  // Bank Statement Import (OFX & CSV)
  parseStatement: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const url = `${API_BASE_URL}/import/parse`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Erro ao processar extrato' }));
      throw new Error(errorData.detail || `Erro ${response.status}`);
    }
    return await response.json();
  },

  confirmImport: (transactions) => {
    return request('/import/confirm', {
      method: 'POST',
      body: JSON.stringify({ transactions }),
    });
  },

  // Category Budgets
  getBudgetsSummary: (month) => {
    const query = month ? `?month=${encodeURIComponent(month)}` : '';
    return request(`/budgets/summary${query}`);
  },

  setCategoryBudget: (categoryId, monthlyLimit) => {
    return request('/budgets/', {
      method: 'POST',
      body: JSON.stringify({
        category_id: categoryId,
        monthly_limit: Number(monthlyLimit),
      }),
    });
  },

  deleteCategoryBudget: (categoryId) => {
    return request(`/budgets/${categoryId}`, {
      method: 'DELETE',
    });
  },
};

