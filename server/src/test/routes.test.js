import { describe, it, expect, vi, beforeEach } from 'vitest';
import { upload } from '../src/middleware/upload.js';

describe('Upload Middleware', () => {
  it('exports upload middleware', () => {
    expect(upload).toBeDefined();
    expect(typeof upload.single).toBe('function');
  });
});

describe('Health Route', () => {
  it('should have health route module', async () => {
    const mod = await import('../src/routes/health.js');
    expect(mod.default).toBeDefined();
  });
});

describe('OCR Route', () => {
  it('should have ocr route module', async () => {
    const mod = await import('../src/routes/ocr.js');
    expect(mod.default).toBeDefined();
  });
});

describe('Evaluation Route', () => {
  it('should have evaluation route module', async () => {
    const mod = await import('../src/routes/evaluation.js');
    expect(mod.default).toBeDefined();
  });
});

describe('Database Config', () => {
  it('should have connectDB function', async () => {
    const mod = await import('../src/config/db.js');
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe('function');
  });
});

describe('Evaluation Model', () => {
  it('should have Evaluation model', async () => {
    const mod = await import('../src/models/Evaluation.js');
    expect(mod.default).toBeDefined();
    expect(mod.default.modelName).toBe('Evaluation');
  });
});