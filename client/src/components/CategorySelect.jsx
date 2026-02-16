import { Autocomplete, TextField } from '@mui/material';

/**
 * Searchable dropdown for Industry, Relationship, Priority.
 * Options sorted alphabetically by label. Required - no empty selection.
 */
export default function CategorySelect({ label, value, onChange, options }) {
  const sorted = [...options].sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));
  const selected = sorted.find((o) => o.value === value) || null;

  return (
    <Autocomplete
      value={selected}
      onChange={(_, v) => onChange(v?.value || '')}
      options={sorted}
      getOptionLabel={(o) => o.label}
      isOptionEqualToValue={(o, v) => o?.value === v?.value}
      disableClearable
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          size="small"
          required
          error={!value}
          helperText={!value ? `Select ${label}` : ''}
        />
      )}
    />
  );
}
