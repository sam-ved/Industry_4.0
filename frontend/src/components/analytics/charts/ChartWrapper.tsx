import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { ResponsiveContainer } from 'recharts';

interface ChartWrapperProps {
  title: string;
  children: React.ReactNode;
  height?: number;
}

const ChartWrapper: React.FC<ChartWrapperProps> = ({ title, children, height = 300 }) => {
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Box sx={{ flexGrow: 1, height: height, minHeight: height, mt: 2 }}>
          <ResponsiveContainer width="100%" height="100%">
            {children}
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ChartWrapper;
