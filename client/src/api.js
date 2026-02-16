import axios from 'axios';

const apiBase = import.meta.env.VITE_API_URL || '';
const api = axios.create({
  baseURL: apiBase + '/api',
  headers: { 'Content-Type': 'application/json' },
});

export const cardsApi = {
  getAll: (params) => api.get('/cards', { params }),
  getById: (id) => api.get(`/cards/${id}`),
  create: (formData) => api.post('/cards', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id, data) => api.put(`/cards/${id}`, data),
  delete: (id) => api.delete(`/cards/${id}`),
};

export const ocrApi = {
  process: (formData) => api.post('/ocr', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

export const categoriesApi = {
  getAll: () => api.get('/categories'),
  create: (data) => api.post('/categories', data),
};

export const getImageUrl = (path) => (path?.startsWith('http') ? path : path);
