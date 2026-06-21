import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically inject JWT Token if it exists in localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle authorization errors (token expired, etc.)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      // If we are not already on the login page, redirect to login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (username, password) => {
    // Auth uses urlencoded form parameters (OAuth2 standard in FastAPI)
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);

    const response = await api.post('/api/users/login', params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/api/users/me');
    return response.data;
  },

  register: async (username, email, password, role = 'Employee') => {
    const response = await api.post('/api/users/register', {
      username,
      email,
      password,
      role,
    });
    return response.data;
  },
};

export const adminService = {
  getEmployees: async () => {
    const response = await api.get('/api/admin/employees');
    return response.data;
  },
  getAuditLogs: async () => {
    const response = await api.get('/api/admin/audit-logs');
    return response.data;
  },
  getOverrideHistory: async () => {
    const response = await api.get('/api/admin/override-history');
    return response.data;
  },
};

export const docService = {
  uploadPdf: async (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
    return response.data;
  },

  getDocuments: async () => {
    const response = await api.get('/api/documents');
    return response.data;
  },

  getDocument: async (documentId) => {
    const response = await api.get(`/api/documents/${documentId}`);
    return response.data;
  },

  getReviewQueue: async () => {
    const response = await api.get('/api/review-queue');
    return response.data;
  },

  manualOverride: async (documentId, pageNumber, category) => {
    const response = await api.post('/api/review-queue/override', null, {
      params: {
        document_id: documentId,
        page_number: parseInt(pageNumber),
        selected_category: category,
      },
    });
    return response.data;
  },

  getDownloadUrl: (documentId, format) => {
    return `${API_BASE_URL}/api/documents/${documentId}/download/${format.toLowerCase()}`;
  },
};

export default api;
