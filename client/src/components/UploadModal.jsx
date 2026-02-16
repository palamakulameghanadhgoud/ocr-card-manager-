import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Chip,
  Input,
  CircularProgress,
  Alert,
  Typography,
} from '@mui/material';
import { cardsApi, ocrApi } from '../api';
import CategorySelect from './CategorySelect';

export default function UploadModal({ open, onClose, onSuccess, categories }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    company: '',
    jobTitle: '',
    phone: '',
    email: '',
    website: '',
    address: '',
    industry: '',
    relationshipType: '',
    priority: '',
    tags: [],
    tagInput: '',
    notes: '',
  });

  const industries = [...categories.filter((c) => c.type === 'industry')].sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { sensitivity: 'base' })
  );
  const relationshipTypes = [...categories.filter((c) => c.type === 'relationshipType')].sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { sensitivity: 'base' })
  );
  const priorities = [...categories.filter((c) => c.type === 'priority')].sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { sensitivity: 'base' })
  );

  useEffect(() => {
    if (!open || categories.length === 0) return;
    const ind = categories.filter((c) => c.type === 'industry').sort((a, b) => a.label.localeCompare(b.label));
    const rel = categories.filter((c) => c.type === 'relationshipType').sort((a, b) => a.label.localeCompare(b.label));
    const pri = categories.filter((c) => c.type === 'priority').sort((a, b) => a.label.localeCompare(b.label));
    setForm((prev) => ({
      ...prev,
      industry: prev.industry || ind[0]?.value || '',
      relationshipType: prev.relationshipType || rel[0]?.value || '',
      priority: prev.priority || pri[0]?.value || '',
    }));
  }, [open, categories]);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length === 0) return;
    const f = acceptedFiles[0];
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError('');
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif'] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
    disabled: !open,
  });

  const handleRunOCR = async () => {
    if (!file) {
      setError('Please select an image first');
      return;
    }
    setOcrLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('image', file);
      const { data } = await ocrApi.process(formData);
      setForm((prev) => ({
        ...prev,
        name: data.name || prev.name,
        company: data.company || prev.company,
        jobTitle: data.jobTitle || prev.jobTitle,
        phone: data.phone || prev.phone,
        email: data.email || prev.email,
        website: data.website || prev.website,
        address: data.address || prev.address,
      }));
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'OCR failed. Ensure the image is clear and the server is running.';
      setError(msg);
    } finally {
      setOcrLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      setError('Please select an image');
      return;
    }
    if (!form.industry || !form.relationshipType || !form.priority) {
      setError('Please select Industry, Relationship, and Priority');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('name', form.name);
      formData.append('company', form.company);
      formData.append('jobTitle', form.jobTitle);
      formData.append('phone', form.phone);
      formData.append('email', form.email);
      formData.append('website', form.website);
      formData.append('address', form.address);
      formData.append('industry', form.industry);
      formData.append('relationshipType', form.relationshipType);
      formData.append('priority', form.priority);
      formData.append('notes', form.notes);
      formData.append('tags', JSON.stringify(form.tags));

      await cardsApi.create(formData);
      handleClose();
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save card');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setForm({
      name: '',
      company: '',
      jobTitle: '',
      phone: '',
      email: '',
      website: '',
      address: '',
      industry: '',
      relationshipType: '',
      priority: '',
      tags: [],
      tagInput: '',
      notes: '',
    });
    setError('');
    onClose();
  };

  const addTag = () => {
    const t = form.tagInput.trim();
    if (t && !form.tags.includes(t)) {
      setForm((prev) => ({ ...prev, tags: [...prev.tags, t], tagInput: '' }));
    }
  };

  const removeTag = (t) => {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((x) => x !== t) }));
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 24px 48px rgba(0,0,0,0.12)',
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 600 }}>Add Business Card</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
          <Box>
            <Box
              {...getRootProps()}
              sx={{
                border: '2px dashed',
                borderColor: isDragActive ? 'primary.main' : 'grey.300',
                borderRadius: 3,
                p: 4,
                textAlign: 'center',
                cursor: 'pointer',
                bgcolor: preview ? 'grey.50' : isDragActive ? 'primary.main' : 'grey.50',
                color: isDragActive && !preview ? 'white' : 'text.secondary',
                mb: 2,
                transition: 'all 0.25s ease',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: preview ? 'grey.100' : 'primary.main',
                  color: preview ? 'text.secondary' : 'white',
                },
              }}
            >
              <input {...getInputProps()} />
              {preview ? (
                <Box
                  component="img"
                  src={preview}
                  alt="Preview"
                  sx={{ maxWidth: '100%', maxHeight: 220, borderRadius: 2 }}
                />
              ) : (
                <Typography sx={{ color: 'inherit' }}>
                  {isDragActive ? 'Drop the image here' : 'Drag & drop or click to upload'}
                </Typography>
              )}
            </Box>
            <Button
              variant="outlined"
              onClick={handleRunOCR}
              disabled={!file || ocrLoading}
              fullWidth
              sx={{ py: 1.5 }}
            >
              {ocrLoading ? <CircularProgress size={24} /> : 'Extract with OCR'}
            </Button>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <TextField
              label="Name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              size="small"
              fullWidth
            />
            <TextField
              label="Company"
              value={form.company}
              onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
              placeholder="Enter if not detected (e.g. shown as logo only)"
              helperText={!form.company ? 'Company not detected — enter manually if known' : ''}
              size="small"
              fullWidth
            />
            <TextField
              label="Job Title"
              value={form.jobTitle}
              onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))}
              size="small"
              fullWidth
            />
            <TextField
              label="Phone"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              size="small"
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              size="small"
              fullWidth
            />
            <TextField
              label="Website"
              value={form.website}
              onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
              size="small"
              fullWidth
            />
            <TextField
              label="Address"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              size="small"
              fullWidth
              multiline
            />
            <CategorySelect
              label="Industry"
              value={form.industry}
              onChange={(v) => setForm((f) => ({ ...f, industry: v }))}
              options={industries}
            />
            <CategorySelect
              label="Relationship"
              value={form.relationshipType}
              onChange={(v) => setForm((f) => ({ ...f, relationshipType: v }))}
              options={relationshipTypes}
            />
            <CategorySelect
              label="Priority"
              value={form.priority}
              onChange={(v) => setForm((f) => ({ ...f, priority: v }))}
              options={priorities}
            />
            <Box>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 0.5 }}>
                {form.tags.map((t) => (
                  <Chip
                    key={t}
                    label={t}
                    size="small"
                    onDelete={() => removeTag(t)}
                  />
                ))}
              </Box>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Input
                  size="small"
                  placeholder="Add tag"
                  value={form.tagInput}
                  onChange={(e) => setForm((f) => ({ ...f, tagInput: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  sx={{ flex: 1 }}
                />
                <Button size="small" onClick={addTag}>
                  Add
                </Button>
              </Box>
            </Box>
            <TextField
              label="Notes"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              size="small"
              fullWidth
              multiline
              rows={2}
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!file || saving}>
          {saving ? <CircularProgress size={24} /> : 'Save Card'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
