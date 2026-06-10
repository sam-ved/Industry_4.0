// frontend/src/constants/models.js
// Model metadata constants for frontend

export const MODEL_COLORS = {
  cyan: '#06B6D4',
  blue: '#3B82F6',
  emerald: '#10B981',
  orange: '#F59E0B',
  purple: '#A855F7',
  red: '#EF4444',
}

export const FILE_TYPES = {
  IMAGE: ['image/png', 'image/jpeg', 'image/webp'],
  CSV: ['text/csv'],
}

export const FILE_EXTENSIONS = {
  IMAGE: ['.png', '.jpg', '.jpeg', '.webp'],
  CSV: ['.csv'],
}

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export const MODEL_CATEGORIES = {
  EXISTING: 'existing',
  ML: 'ml',
  ALL: 'all',
}
