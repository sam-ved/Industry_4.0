import React from 'react';
import { Box, Card, CardContent, Typography, useTheme } from '@mui/material';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: "primary" | "secondary" | "success" | "error" | "warning" | "info";
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, subtitle, icon, color = "primary" }) => {
  const theme = useTheme();

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', boxShadow: theme.shadows[3], borderRadius: 2 }}>
      <CardContent sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" component="div" color={`${color}.main`} sx={{ fontWeight: 'bold' }}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        {icon && (
          <Box sx={{ ml: 2, color: theme.palette[color].main }}>
            {icon}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default MetricCard;
