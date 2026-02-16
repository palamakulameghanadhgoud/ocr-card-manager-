import { Link } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
} from '@mui/material';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';

export default function Layout(props) {
  return (
    <Box sx={{ minHeight: '100vh' }}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #3b82f6 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.15)',
        }}
      >
        <Toolbar sx={{ py: 0.5 }}>
          <Box
            component={Link}
            to="/"
            sx={{
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
              color: 'inherit',
              flexGrow: 1,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: 'rgba(255,255,255,0.15)',
                mr: 1.5,
              }}
            >
              <BusinessCenterIcon sx={{ fontSize: 24 }} />
            </Box>
            <Typography
              variant="h6"
              component="span"
              sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}
            >
              Business Card Manager
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>
      <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3 }, px: { xs: 2, sm: 3 } }}>
        {props.children}
      </Container>
    </Box>
  );
}
