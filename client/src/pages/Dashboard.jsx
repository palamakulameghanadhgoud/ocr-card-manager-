import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
  Alert,
  Typography,
  useMediaQuery,
  useTheme,
  Drawer,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewListIcon from '@mui/icons-material/ViewList';
import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';
import CloseIcon from '@mui/icons-material/Close';
import { cardsApi, categoriesApi } from '../api';
import { DEFAULT_CATEGORIES } from '../constants/categories';
import CardGrid from '../components/CardGrid';
import UploadModal from '../components/UploadModal';
import FilterSidebar from '../components/FilterSidebar';

export default function Dashboard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    industry: '',
    relationshipType: '',
    priority: '',
  });
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [categories, setCategories] = useState([]);

  const fetchCards = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        search: search || undefined,
        industry: filters.industry || undefined,
        relationshipType: filters.relationshipType || undefined,
        priority: filters.priority || undefined,
        sortBy,
        sortOrder,
      };
      const { data } = await cardsApi.getAll(params);
      setCards(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load cards');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await categoriesApi.getAll();
      setCategories(data?.length ? data : DEFAULT_CATEGORIES);
    } catch {
      setCategories(DEFAULT_CATEGORIES);
    }
  };

  const hasActiveFilters = search || filters.industry || filters.relationshipType || filters.priority;

  useEffect(() => {
    fetchCards();
  }, [search, filters, sortBy, sortOrder]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCardCreated = () => {
    setUploadOpen(false);
    fetchCards();
  };

  const handleCardDeleted = () => {
    fetchCards();
  };

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          mb: 3,
          p: 2,
          borderRadius: 3,
          bgcolor: 'rgba(255,255,255,0.7)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.8)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', flex: 1, minWidth: 0 }}>
          <TextField
            placeholder="Search by name, company, tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            sx={{
              minWidth: { xs: '100%', sm: 220 },
              maxWidth: 340,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Sort by</InputLabel>
            <Select
              value={sortBy}
              label="Sort by"
              onChange={(e) => setSortBy(e.target.value)}
            >
              <MenuItem value="createdAt">Date Added</MenuItem>
              <MenuItem value="name">Name</MenuItem>
              <MenuItem value="company">Company</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>Order</InputLabel>
            <Select
              value={sortOrder}
              label="Order"
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <MenuItem value="desc">Desc</MenuItem>
              <MenuItem value="asc">Asc</MenuItem>
            </Select>
          </FormControl>
          {isMobile && (
            <IconButton
              onClick={() => setFilterDrawerOpen(true)}
              color="primary"
              aria-label="Filters"
            >
              <FilterListIcon />
            </IconButton>
          )}
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, v) => v && setViewMode(v)}
            size="small"
          >
            <ToggleButton value="grid" aria-label="Grid view">
              <ViewModuleIcon />
            </ToggleButton>
            <ToggleButton value="list" aria-label="List view">
              <ViewListIcon />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setUploadOpen(true)}
          sx={{ flexShrink: 0 }}
        >
          Add Card
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
        {!isMobile && (
          <Box
            sx={{
              width: 240,
              flexShrink: 0,
              p: 2.5,
              borderRadius: 3,
              bgcolor: 'rgba(255,255,255,0.9)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
              border: '1px solid rgba(0,0,0,0.06)',
            }}
          >
            <FilterSidebar
              filters={filters}
              setFilters={setFilters}
              categories={categories}
              onClear={() => setFilters({ industry: '', relationshipType: '', priority: '' })}
            />
          </Box>
        )}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={320} py={4}>
              <CircularProgress size={40} />
            </Box>
          ) : cards.length === 0 ? (
            hasActiveFilters ? (
              <Box
                sx={{
                  textAlign: 'center',
                  py: 8,
                  px: 3,
                  borderRadius: 3,
                  bgcolor: 'rgba(255,255,255,0.9)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                }}
              >
                <Typography color="text.secondary" variant="body1">
                  No cards match your search or filters
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  textAlign: 'center',
                  py: 10,
                  px: 4,
                  borderRadius: 3,
                  bgcolor: 'rgba(255,255,255,0.9)',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                  border: '2px dashed',
                  borderColor: 'primary.light',
                }}
              >
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    opacity: 0.1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  <AddIcon sx={{ fontSize: 40, color: 'primary.main', opacity: 0.6 }} />
                </Box>
                <Typography variant="h6" color="text.primary" gutterBottom fontWeight={600}>
                  No business cards yet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 320, mx: 'auto' }}>
                  Upload a business card photo to extract contact info with OCR and keep everything organized
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<AddIcon />}
                  onClick={() => setUploadOpen(true)}
                  sx={{ px: 3, py: 1.5 }}
                >
                  Add Your First Card
                </Button>
              </Box>
            )
          ) : (
            <CardGrid
              cards={cards}
              viewMode={viewMode}
              onDelete={handleCardDeleted}
              onUpdate={fetchCards}
            />
          )}
        </Box>
      </Box>

      <Drawer
        anchor="right"
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: 320,
            borderTopLeftRadius: 24,
            borderBottomLeftRadius: 24,
            boxShadow: '-8px 0 32px rgba(0,0,0,0.12)',
          },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" fontWeight={600}>
              Filters
            </Typography>
            <IconButton onClick={() => setFilterDrawerOpen(false)} aria-label="Close">
              <CloseIcon />
            </IconButton>
          </Box>
          <FilterSidebar
            filters={filters}
            setFilters={setFilters}
            categories={categories}
            onClear={() => setFilters({ industry: '', relationshipType: '', priority: '' })}
          />
        </Box>
      </Drawer>

      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSuccess={handleCardCreated}
        categories={categories}
      />
    </Box>
  );
}
