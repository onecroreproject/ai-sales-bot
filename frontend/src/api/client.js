const BASE_URL = 'http://localhost:8000';

export function getAuthToken() {
  return localStorage.getItem('access_token');
}

export function setAuthToken(token) {
  localStorage.setItem('access_token', token);
}

export function clearAuthToken() {
  localStorage.removeItem('access_token');
}

async function request(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearAuthToken();
  }

  if (response.status === 204) {
    return true;
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || data.message || 'API request failed');
  }

  return data;
}

export const api = {
  // Auth
  login: (email, password) => request('/api/v1/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (companyId, email, password) => request('/api/v1/auth/register', { method: 'POST', body: JSON.stringify({ company_id: parseInt(companyId), email, password }) }),
  verifyEmail: (token) => request(`/api/v1/auth/verify-email?token=${encodeURIComponent(token)}`),
  resendVerification: (email) => request('/api/v1/auth/resend-verification', { method: 'POST', body: JSON.stringify({ email }) }),
  forgotPassword: (email) => request('/api/v1/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  getMe: () => request('/api/v1/auth/me'),

  // Companies
  getMyCompany: () => request('/api/v1/companies/me'),
  getAllCompanies: () => request('/api/v1/companies'),
  createCompany: (name, website, description) => request('/api/v1/companies', { method: 'POST', body: JSON.stringify({ name, website, description }) }),
  updateCompany: (id, data) => request(`/api/v1/companies/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Dashboard & Super Admin Stats
  getDashboardStats: () => request('/api/v1/dashboard/stats'),
  getSuperAdminStats: () => request('/api/v1/dashboard/super-admin'),

  // Products
  getProducts: () => request('/api/v1/products'),
  createProduct: (data) => request('/api/v1/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id, data) => request(`/api/v1/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id) => request(`/api/v1/products/${id}`, { method: 'DELETE' }),

  // Knowledge Base
  getKnowledge: () => request('/api/v1/knowledge'),
  createKnowledge: (data) => request('/api/v1/knowledge', { method: 'POST', body: JSON.stringify(data) }),
  updateKnowledge: (id, data) => request(`/api/v1/knowledge/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteKnowledge: (id) => request(`/api/v1/knowledge/${id}`, { method: 'DELETE' }),

  // Leads
  getLeads: (companyId) => request(`/api/v1/leads?company_id=${companyId}`),
  updateLead: (id, companyId, data) => request(`/api/v1/leads/${id}?company_id=${companyId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteLead: (id) => request(`/api/v1/leads/${id}`, { method: 'DELETE' }),

  // Widget Config
  getWidgetConfig: () => request('/api/v1/widget/config'),
  updateWidgetConfig: (data) => request('/api/v1/widget/config', { method: 'PUT', body: JSON.stringify(data) }),
  regenerateSiteKey: () => request('/api/v1/widget/config/regenerate-key', { method: 'POST' }),
};
