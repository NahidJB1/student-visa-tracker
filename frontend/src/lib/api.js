const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function apiRequest(endpoint, options = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('svt_token') : null;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, config);

  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('svt_token');
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  // Auth
  login: (email, password) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (data) =>
    apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Students
  getStudents: (status) =>
    apiRequest(`/students${status ? `?status=${encodeURIComponent(status)}` : ''}`),
  addStudent: (data) =>
    apiRequest('/students', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateStudentStatus: (id, status) =>
    apiRequest(`/students/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
  deleteStudent: (id) =>
    apiRequest(`/students/${id}`, {
      method: 'DELETE',
    }),

  // Financials
  getFinancials: (studentId) =>
    apiRequest(`/students/${studentId}/financials`),
  updateFinancials: (studentId, data) =>
    apiRequest(`/students/${studentId}/financials`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Dashboard
  getTimeline: (period) =>
    apiRequest(`/dashboard/timeline?period=${period}`),
  getStatusDistribution: () =>
    apiRequest('/dashboard/status-distribution'),
  getEarnings: () =>
    apiRequest('/dashboard/earnings'),
};
