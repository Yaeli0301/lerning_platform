import React from 'react';
import { Box } from '@mui/material';

const Logo = () => (
  <Box
    sx={{
      width: 48,
      height: 48,
      bgcolor: '#1976d2',
      borderRadius: 2,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontWeight: 'bold',
      fontSize: 24,
      userSelect: 'none',
      fontFamily: 'Arial, sans-serif',
    }}
  >
    LM
  </Box>
);

export default Logo;
