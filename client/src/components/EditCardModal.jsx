import { useState, useEffect } from 'react';
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
} from '@mui/material';
import { cardsApi } from '../api';
import { DEFAULT_CATEGORIES } from '../constants/categories';
import CategorySelect from './CategorySelect';

export default function EditCardModal({ open, onClose, onSuccess, card }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
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

  useEffect(() => {
    if (card && open && categories.length > 0) {
      const ind = categories.filter((c) => c.type === 'industry').sort((a, b) => a.label.localeCompare(b.label));
      const rel = categories.filter((c) => c.type === 'relationshipType').sort((a, b) => a.label.localeCompare(b.label));
      const pri = categories.filter((c) => c.type === 'priority').sort((a, b) => a.label.localeCompare(b.label));
      setForm({
        name: card.name || '',
        company: card.company || '',
        jobTitle: card.jobTitle || '',
        phone: card.phone || '',
        email: card.email || '',
        website: card.website || '',
        address: card.address || '',
        industry: card.categories?.industry || ind[0]?.value || '',
        relationshipType: card.categories?.relationshipType || rel[0]?.value || '',
        priority: card.categories?.priority || pri[0]?.value || '',
        tags: card.tags || [],
        tagInput: '',
        notes: card.notes || '',
      });
    }
  }, [card, open, categories]);

  useEffect(() => {
    if (open) {
      import('../api').then(({ categoriesApi }) =>
        categoriesApi
          .getAll()
          .then(({ data }) => setCategories(data?.length ? data : DEFAULT_CATEGORIES))
          .catch(() => setCategories(DEFAULT_CATEGORIES))
      );
    }
  }, [open]);

  const industries = [...categories.filter((c) => c.type === 'industry')].sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { sensitivity: 'base' })
  );
  const relationshipTypes = [...categories.filter((c) => c.type === 'relationshipType')].sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { sensitivity: 'base' })
  );
  const priorities = [...categories.filter((c) => c.type === 'priority')].sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { sensitivity: 'base' })
  );

  const handleSubmit = async () => {
    if (!card) return;
    if (!form.industry || !form.relationshipType || !form.priority) {
      setError('Please select Industry, Relationship, and Priority');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await cardsApi.update(card._id, {
        name: form.name,
        company: form.company,
        jobTitle: form.jobTitle,
        phone: form.phone,
        email: form.email,
        website: form.website,
        address: form.address,
        categories: {
          industry: form.industry,
          relationshipType: form.relationshipType,
          priority: form.priority,
        },
        tags: form.tags,
        notes: form.notes,
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update');
    } finally {
      setSaving(false);
    }
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

  if (!card) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 24px 48px rgba(0,0,0,0.12)',
        },
      }}
    >
      <DialogTitle>Edit Card</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 1 }}>
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
            helperText={!form.company ? 'Enter manually if not shown on card' : ''}
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
                <Chip key={t} label={t} size="small" onDelete={() => removeTag(t)} />
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
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving}>
          {saving ? <CircularProgress size={24} /> : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
