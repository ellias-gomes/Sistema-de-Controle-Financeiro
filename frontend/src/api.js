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
};
