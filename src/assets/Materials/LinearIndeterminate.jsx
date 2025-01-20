import * as React from 'react';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Button from '@mui/material/Button';

export default function LinearIndeterminate() {
  const [loading, setLoading] = React.useState(false);

  const handleClick = () => {
    setLoading(true);
    // Simula una acción que termina después de 3 segundos
    setTimeout(() => setLoading(false), 3000);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Button variant="contained" onClick={handleClick}>
        Mostrar Progreso
      </Button>
      {loading && (
        <LinearProgress />
      )}
    </Box>
  );
}
