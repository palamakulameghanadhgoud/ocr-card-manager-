import axios from 'axios';

const apiBase = import.meta.env.VITE_API_URL || '';
const api = axios.create({
  baseURL: apiBase + '/api',
  headers: { 'Content-Type': 'application/json' },
});

export const evaluationApi = {
  evaluate: (formData) => api.post('/evaluation', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  history: () => api.get('/evaluation/history'),
  getById: (id) => api.get(`/evaluation/${id}`),
};

export const ocrApi = {
  process: (formData) => api.post('/ocr', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

export const healthApi = {
  check: () => api.get('/health'),
};