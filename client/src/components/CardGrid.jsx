import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Chip,
  IconButton,
  CardActionArea,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useState } from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';

export default function CardGrid({ cards, viewMode, onDelete, onUpdate }) {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuCardId, setMenuCardId] = useState(null);

  const apiBase = import.meta.env.VITE_API_URL || '';

  const handleMenuOpen = (e, cardId) => {
    e.stopPropagation();
    setMenuAnchor(e.currentTarget);
    setMenuCardId(cardId);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuCardId(null);
  };

  const handleView = () => {
    if (menuCardId) navigate(`/cards/${menuCardId}`);
    handleMenuClose();
  };

  const handleDelete = async (e, cardId) => {
    e?.stopPropagation?.();
    if (!window.confirm('Delete this card?')) return;
    try {
      const { cardsApi } = await import('../api');
      await cardsApi.delete(cardId);
      onDelete?.();
    } catch (err) {
      console.error(err);
    }
    handleMenuClose();
  };

  if (viewMode === 'list') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {cards.map((card) => {
          const imageSrc = card.imageUrl?.startsWith('http')
            ? card.imageUrl
            : apiBase + (card.imageUrl || '');
          return (
            <Card
              key={card._id}
              sx={{
                display: 'flex',
                flexDirection: 'row',
                overflow: 'hidden',
                '&:hover': { boxShadow: '0 8px 30px rgba(0,0,0,0.1)' },
              }}
            >
              <CardActionArea
                sx={{ display: 'flex', justifyContent: 'flex-start' }}
                onClick={() => navigate(`/cards/${card._id}`)}
              >
                <CardMedia
                  component="img"
                  image={imageSrc}
                  alt={card.name}
                  sx={{ width: 100, minHeight: 100, objectFit: 'cover' }}
                />
                <CardContent sx={{ flex: 1, textAlign: 'left' }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {card.name || 'Unknown'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {card.company} {card.jobTitle && `• ${card.jobTitle}`}
                  </Typography>
                  {card.tags?.length > 0 && (
                    <Box sx={{ mt: 0.5, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {card.tags.slice(0, 3).map((t) => (
                        <Chip key={t} label={t} size="small" />
                      ))}
                    </Box>
                  )}
                </CardContent>
              </CardActionArea>
              <IconButton
                onClick={(e) => handleMenuOpen(e, card._id)}
                sx={{ alignSelf: 'center' }}
              >
                <MoreVertIcon />
              </IconButton>
            </Card>
          );
        })}
        <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={handleMenuClose}>
          <MenuItem onClick={handleView}>
            <VisibilityIcon fontSize="small" sx={{ mr: 1 }} />
            View
          </MenuItem>
          <MenuItem onClick={() => menuCardId && handleDelete(null, menuCardId)}>
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
            Delete
          </MenuItem>
        </Menu>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: 'repeat(1, 1fr)',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(3, 1fr)',
          lg: 'repeat(4, 1fr)',
        },
        gap: 2,
      }}
    >
      {cards.map((card) => {
        const imageSrc = card.imageUrl?.startsWith('http')
          ? card.imageUrl
          : apiBase + (card.imageUrl || '');
        return (
          <Card
            key={card._id}
            sx={{
              overflow: 'hidden',
              '&:hover': {
                transform: 'translateY(-6px)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
              },
            }}
          >
            <CardActionArea onClick={() => navigate(`/cards/${card._id}`)}>
              <Box
                sx={{
                  position: 'relative',
                  height: 180,
                  overflow: 'hidden',
                  bgcolor: 'grey.100',
                }}
              >
                <CardMedia
                  component="img"
                  image={imageSrc}
                  alt={card.name}
                  sx={{
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'transform 0.3s ease',
                    '&:hover': {
                      transform: 'scale(1.03)',
                    },
                  }}
                />
              </Box>
              <CardContent sx={{ textAlign: 'left', py: 1.5 }}>
                <Typography variant="subtitle1" fontWeight={600} noWrap>
                  {card.name || 'Unknown'}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {card.company || '—'}
                </Typography>
                {card.tags?.length > 0 && (
                  <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {card.tags.slice(0, 2).map((t) => (
                      <Chip key={t} label={t} size="small" color="primary" variant="outlined" />
                    ))}
                  </Box>
                )}
              </CardContent>
            </CardActionArea>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', pr: 0.5, pb: 0.5 }}>
              <IconButton
                size="small"
                onClick={(e) => handleMenuOpen(e, card._id)}
                aria-label="More options"
                sx={{ m: 0.5 }}
              >
                <MoreVertIcon />
              </IconButton>
            </Box>
          </Card>
        );
      })}
      <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={handleMenuClose}>
        <MenuItem onClick={handleView}>
          <VisibilityIcon fontSize="small" sx={{ mr: 1 }} />
          View
        </MenuItem>
        <MenuItem onClick={() => menuCardId && handleDelete(null, menuCardId)}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
}
