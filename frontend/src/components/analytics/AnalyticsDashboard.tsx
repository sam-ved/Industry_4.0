import React, { useState } from 'react';
import { Box, Typography, Button, Divider, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, FormControlLabel, Checkbox, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Download } from 'lucide-react';
import MetricCard from './cards/MetricCard';
import InsightCard from './cards/InsightCard';

import ChartsPanel from '../MLStudio/ChartsPanel';
import { generateReport } from '../../services/api';

interface AnalyticsDashboardProps {
  payload: any;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ payload }) => {
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);
  const [isDownloadDialogOpen, setIsDownloadDialogOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<string>('pdf');
  const [includeYolo, setIncludeYolo] = useState(false);
  const [includeEnergy, setIncludeEnergy] = useState(false);

  if (!payload || Object.keys(payload).length === 0) {
    return <Typography>No analytics data available.</Typography>;
  }

  const {
    executive_summary,
    health_score
  } = payload;
  const insights = payload.insights || [];
  const recommendations = payload.recommendations || [];

  const handleDownload = async () => {
    setDownloadingFormat(selectedFormat);
    setIsDownloadDialogOpen(false);
    
    const enrichedPayload = {
      ...payload,
      include_yolo: includeYolo,
      include_energy: includeEnergy
    };

    try {
      await generateReport(enrichedPayload, selectedFormat);
    } catch (error) {
      console.error("Failed to download report", error);
      alert(`Failed to download ${selectedFormat.toUpperCase()} report.`);
    } finally {
      setDownloadingFormat(null);
    }
  };

  return (
    <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Header & Export Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Enterprise Analytics Dashboard</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            variant="contained" 
            color="primary"
            startIcon={downloadingFormat ? <CircularProgress size={20} color="inherit" /> : <Download />} 
            onClick={() => setIsDownloadDialogOpen(true)} 
            disabled={!!downloadingFormat}
          >
            {downloadingFormat ? 'Generating...' : 'Generate Report'}
          </Button>
        </Box>
      </Box>
      
      <Divider />

      {/* Executive Summary */}
      {executive_summary && (
        <Box>
          <Typography variant="h5" gutterBottom>Executive Summary</Typography>
          <Typography variant="body1" sx={{ mb: 2 }}><b>Objective:</b> {executive_summary.business_objective}</Typography>
          <Typography variant="body1" sx={{ mb: 2 }}><b>Conclusion:</b> {executive_summary.executive_conclusion}</Typography>
        </Box>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div>
          <MetricCard title="Model Algorithm" value={payload.algorithm} color="primary" />
        </div>
        <div>
          <MetricCard 
            title="Performance Status" 
            value={executive_summary?.model_performance?.performance_tier || "N/A"} 
            color={executive_summary?.model_performance?.performance_tier === "Poor" ? "error" : "success"} 
          />
        </div>
        {health_score?.model_health !== undefined && (
          <div>
            <MetricCard title="Model Health" value={`${health_score.model_health}/100`} color="info" />
          </div>
        )}
        <div>
          <MetricCard title="Data Quality Score" value={`${executive_summary?.dataset_summary?.data_quality_score || 0}/100`} color="warning" />
        </div>
      </div>

      {/* Charts Section */}
      <Typography variant="h5" sx={{ mt: 2 }}>Interactive Visualizations</Typography>
      <Box sx={{ mt: 2 }}>
        <ChartsPanel results={payload} />
      </Box>
      {/* Insights & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
        <div>
          <Typography variant="h5" gutterBottom>Industrial Insights</Typography>
          {insights && insights.map((insight: any, i: number) => (
            <InsightCard 
              key={`insight-${i}`}
              category={insight.category}
              title={insight.title}
              description={insight.description}
              severity={insight.severity}
            />
          ))}
          {(!insights || insights.length === 0) && <Typography>No insights generated.</Typography>}
        </div>
        <div>
          <Typography variant="h5" gutterBottom>Optimization Recommendations</Typography>
          {recommendations && recommendations.map((rec: any, i: number) => (
            <Box key={`rec-${i}`} sx={{ mb: 2, p: 2, bgcolor: 'rgba(255, 255, 255, 0.05)', borderRadius: 2, border: '1px solid', borderColor: 'divider', color: '#F9FAFB' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }} gutterBottom>{rec.action}</Typography>
              <ul>
                {rec.expected_impacts.map((imp: any, j: number) => (
                  <li key={`imp-${i}-${j}`}>
                    <Typography variant="body2">{imp.metric}: <b>{imp.value}</b></Typography>
                  </li>
                ))}
              </ul>
            </Box>
          ))}
          {(!recommendations || recommendations.length === 0) && <Typography>No recommendations generated.</Typography>}
        </div>
      </div>

      {/* Download Report Dialog */}
      <Dialog open={isDownloadDialogOpen} onClose={() => setIsDownloadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#0B1423', color: '#F9FAFB', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          Generate Comprehensive Report
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#0B1423', color: '#F9FAFB', pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel id="format-select-label" sx={{ color: '#94A3B8' }}>Report Format</InputLabel>
              <Select
                labelId="format-select-label"
                value={selectedFormat}
                label="Report Format"
                onChange={(e) => setSelectedFormat(e.target.value)}
                sx={{ 
                  color: '#F9FAFB', 
                  '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.4)' },
                  '.MuiSvgIcon-root ': { fill: 'white !important' }
                }}
              >
                <MenuItem value="pdf">PDF Document</MenuItem>
                <MenuItem value="docx">Word Document (DOCX)</MenuItem>
                <MenuItem value="excel">Excel Spreadsheet</MenuItem>
                <MenuItem value="json">JSON Data</MenuItem>
                <MenuItem value="csv">CSV File</MenuItem>
                <MenuItem value="markdown">Markdown</MenuItem>
                <MenuItem value="html">HTML</MenuItem>
              </Select>
            </FormControl>

            <Box>
              <Typography variant="subtitle2" sx={{ color: '#94A3B8', mb: 1 }}>Additional Data Integrations</Typography>
              <FormControlLabel
                control={<Checkbox checked={includeYolo} onChange={(e) => setIncludeYolo(e.target.checked)} sx={{ color: 'rgba(255,255,255,0.5)', '&.Mui-checked': { color: '#06B6D4' } }} />}
                label={<Typography variant="body2">Include YOLO Computer Vision Models Data</Typography>}
              />
              <FormControlLabel
                control={<Checkbox checked={includeEnergy} onChange={(e) => setIncludeEnergy(e.target.checked)} sx={{ color: 'rgba(255,255,255,0.5)', '&.Mui-checked': { color: '#06B6D4' } }} />}
                label={<Typography variant="body2">Include Energy Consumption Models Data</Typography>}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ bgcolor: '#0B1423', borderTop: '1px solid rgba(255,255,255,0.1)', p: 2 }}>
          <Button onClick={() => setIsDownloadDialogOpen(false)} sx={{ color: '#94A3B8' }}>Cancel</Button>
          <Button onClick={handleDownload} variant="contained" sx={{ bgcolor: '#06B6D4', '&:hover': { bgcolor: '#0891B2' } }}>
            Generate & Download
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AnalyticsDashboard;
