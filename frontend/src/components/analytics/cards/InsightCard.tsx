import React from 'react';
import { Card, CardContent, Typography, Box, Chip } from '@mui/material';
import { AlertTriangle, Info, CheckCircle, Zap } from 'lucide-react';

interface InsightCardProps {
  category: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
}

const severityConfig = {
  low: { color: "info" as const, icon: <Info size={20} /> },
  medium: { color: "success" as const, icon: <CheckCircle size={20} /> },
  high: { color: "warning" as const, icon: <Zap size={20} /> },
  critical: { color: "error" as const, icon: <AlertTriangle size={20} /> },
};

const InsightCard: React.FC<InsightCardProps> = ({ category, title, description, severity }) => {
  const config = severityConfig[severity] || severityConfig.low;

  return (
    <Card sx={{ mb: 2, borderLeft: 6, borderColor: `${config.color}.main`, borderRadius: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ color: `${config.color}.main` }}>{config.icon}</Box>
            <Typography variant="h6" component="div">
              {title}
            </Typography>
          </Box>
          <Chip label={category} size="small" variant="outlined" />
        </Box>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default InsightCard;
