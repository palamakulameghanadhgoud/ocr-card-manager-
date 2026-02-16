import { Box, Typography, Autocomplete, TextField, Button } from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';

const sortByLabel = (a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' });

export default function FilterSidebar({ filters, setFilters, categories, onClear }) {
  const industries = [...categories.filter((c) => c.type === 'industry')].sort(sortByLabel);
  const relationshipTypes = [...categories.filter((c) => c.type === 'relationshipType')].sort(sortByLabel);
  const priorities = [...categories.filter((c) => c.type === 'priority')].sort(sortByLabel);

  const hasActiveFilters =
    filters.industry || filters.relationshipType || filters.priority;

  return (
    <Box>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600 }}>
        Refine results
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Autocomplete
          value={industries.find((c) => c.value === filters.industry) || null}
          onChange={(_, v) => setFilters((f) => ({ ...f, industry: v?.value || '' }))}
          options={industries}
          getOptionLabel={(o) => o.label}
          isOptionEqualToValue={(o, v) => o?.value === v?.value}
          renderInput={(params) => (
            <TextField {...params} label="Industry" size="small" placeholder="All" variant="outlined" />
          )}
        />
        <Autocomplete
          value={relationshipTypes.find((c) => c.value === filters.relationshipType) || null}
          onChange={(_, v) => setFilters((f) => ({ ...f, relationshipType: v?.value || '' }))}
          options={relationshipTypes}
          getOptionLabel={(o) => o.label}
          isOptionEqualToValue={(o, v) => o?.value === v?.value}
          renderInput={(params) => (
            <TextField {...params} label="Relationship" size="small" placeholder="All" />
          )}
        />
        <Autocomplete
          value={priorities.find((c) => c.value === filters.priority) || null}
          onChange={(_, v) => setFilters((f) => ({ ...f, priority: v?.value || '' }))}
          options={priorities}
          getOptionLabel={(o) => o.label}
          isOptionEqualToValue={(o, v) => o?.value === v?.value}
          renderInput={(params) => (
            <TextField {...params} label="Priority" size="small" placeholder="All" />
          )}
        />
        {hasActiveFilters && (
          <Button
            size="small"
            startIcon={<ClearIcon />}
            onClick={onClear}
            fullWidth
          >
            Clear filters
          </Button>
        )}
      </Box>
    </Box>
  );
}
