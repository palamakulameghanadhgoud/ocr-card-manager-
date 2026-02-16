import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  IconButton,
  Paper,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { cardsApi } from '../api';
import EditCardModal from '../components/EditCardModal';

export default function CardDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchCard = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await cardsApi.getById(id);
      setCard(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load card');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCard();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this card?')) return;
    setDeleting(true);
    try {
      await cardsApi.delete(id);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  const handleUpdate = () => {
    setEditOpen(false);
    fetchCard();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !card) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="outlined" onClick={() => navigate('/')}>
          Back to Dashboard
        </Button>
      </Box>
    );
  }

  if (!card) return null;

  const imageSrc = card.imageUrl?.startsWith('http')
    ? card.imageUrl
    : (import.meta.env.VITE_API_URL || '') + (card.imageUrl || '');

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          mb: 3,
          p: 2,
          borderRadius: 2,
          bgcolor: 'rgba(255,255,255,0.8)',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <IconButton onClick={() => navigate('/')} aria-label="Back to dashboard" sx={{ mr: 0.5 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" sx={{ flex: 1, minWidth: 0 }}>
          Card Details
        </Typography>
        <Button
          variant="outlined"
          startIcon={<EditIcon />}
          onClick={() => setEditOpen(true)}
        >
          Edit
        </Button>
        <Button
          variant="outlined"
          color="error"
          startIcon={deleting ? <CircularProgress size={20} /> : <DeleteIcon />}
          onClick={handleDelete}
          disabled={deleting}
        >
          Delete
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '300px 1fr' },
          gap: 3,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 0,
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid rgba(0,0,0,0.06)',
          }}
        >
          <Box
            component="img"
            src={imageSrc}
            alt={card.name || 'Business card'}
            sx={{
              width: '100%',
              height: 'auto',
              display: 'block',
            }}
          />
        </Paper>

        <Box
          sx={{
            p: 3,
            borderRadius: 3,
            bgcolor: 'rgba(255,255,255,0.9)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          }}
        >
          <Typography variant="h4" gutterBottom fontWeight={700}>
            {card.name || 'Unknown'}
          </Typography>
          {card.jobTitle && (
            <Typography color="text.secondary" gutterBottom>
              {card.jobTitle}
            </Typography>
          )}
          {card.company && (
            <Typography variant="h6" color="primary" gutterBottom>
              {card.company}
            </Typography>
          )}

          <Box sx={{ mt: 2 }}>
            {card.phone && (
              <Typography sx={{ mb: 0.5 }}>
                <strong>Phone:</strong> {card.phone}
              </Typography>
            )}
            {card.email && (
              <Typography sx={{ mb: 0.5 }}>
                <strong>Email:</strong>{' '}
                <Box
                  component="a"
                  href={`mailto:${card.email}`}
                  sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                >
                  {card.email}
                </Box>
              </Typography>
            )}
            {card.website && (
              <Typography sx={{ mb: 0.5 }}>
                <strong>Website:</strong>{' '}
                <Box
                  component="a"
                  href={card.website.startsWith('http') ? card.website : `https://${card.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                >
                  {card.website}
                </Box>
              </Typography>
            )}
            {card.address && (
              <Typography sx={{ mb: 0.5 }}>
                <strong>Address:</strong> {card.address}
              </Typography>
            )}
          </Box>

          {(card.categories?.industry || card.categories?.relationshipType || card.categories?.priority) && (
            <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {card.categories?.industry && (
                <Box
                  component="span"
                  sx={{
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 2,
                    bgcolor: 'primary.main',
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                  }}
                >
                  {card.categories.industry.charAt(0).toUpperCase() + card.categories.industry.slice(1)}
                </Box>
              )}
              {card.categories?.relationshipType && (
                <Box
                  component="span"
                  sx={{
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 2,
                    bgcolor: 'secondary.main',
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                  }}
                >
                  {card.categories.relationshipType.charAt(0).toUpperCase() + card.categories.relationshipType.slice(1)}
                </Box>
              )}
              {card.categories?.priority && (
                <Box
                  component="span"
                  sx={{
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 2,
                    bgcolor: 'success.main',
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                  }}
                >
                  {card.categories.priority.charAt(0).toUpperCase() + card.categories.priority.slice(1)}
                </Box>
              )}
            </Box>
          )}

          {card.tags?.length > 0 && (
            <Box sx={{ mt: 2, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {card.tags.map((tag) => (
                <Typography
                  key={tag}
                  component="span"
                  sx={{
                    px: 1,
                    py: 0.25,
                    borderRadius: 1,
                    bgcolor: 'primary.light',
                    color: 'primary.contrastText',
                    fontSize: '0.75rem',
                  }}
                >
                  {tag}
                </Typography>
              ))}
            </Box>
          )}

          {card.notes && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Notes
              </Typography>
              <Typography sx={{ mt: 0.5 }}>{card.notes}</Typography>
            </Box>
          )}
        </Box>
      </Box>

      <EditCardModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSuccess={handleUpdate}
        card={card}
      />
    </Box>
  );
}
