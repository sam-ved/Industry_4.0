import pickle
import numpy as np
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler
from typing import Dict, List, Tuple, Optional

class PCAFeatureExtractor:
    def __init__(self, n_components: Optional[int] = 50, variance_threshold: float = 0.95):
        self.n_components = n_components
        self.variance_threshold = variance_threshold
        self.pca = PCA(n_components=n_components)
        self.scaler = StandardScaler()
        self.is_fitted = False

    def fit(self, X_train: np.ndarray) -> Dict:
        """Fit PCA and Scaler to the training data."""
        # Scale features
        X_scaled = self.scaler.fit_transform(X_train)
        
        # Fit PCA
        # If n_components is not set, use variance_threshold
        if self.n_components is None:
            self.pca = PCA(n_components=self.variance_threshold)
            
        self.pca.fit(X_scaled)
        self.is_fitted = True
        
        # Calculate cumulative variance to check against threshold if n_components was used
        cumulative_variance = np.sum(self.pca.explained_variance_ratio_)
        
        # If the cumulative variance is less than threshold, we might want to re-fit,
        # but standard scikit-learn PCA allows n_components=float for variance thresholding directly.
        # However, let's keep it simple.
        
        actual_components = self.pca.n_components_
        original_features = X_train.shape[1]
        
        return {
            "n_components_selected": actual_components,
            "explained_variance_ratio": self.pca.explained_variance_ratio_.tolist(),
            "cumulative_variance": float(cumulative_variance),
            "original_features": original_features,
            "reduced_features": actual_components,
            "compression_ratio": f"{(actual_components / original_features * 100):.1f}%"
        }

    def transform(self, X: np.ndarray) -> np.ndarray:
        """Transform data using fitted Scaler and PCA."""
        if not self.is_fitted:
            raise ValueError("PCA is not fitted yet.")
        X_scaled = self.scaler.transform(X)
        return self.pca.transform(X_scaled)

    def get_feature_importance(self) -> List[Tuple[int, float]]:
        """
        Estimate feature importance based on PCA components.
        Returns a list of tuples (original_feature_index, importance_score)
        """
        if not self.is_fitted:
            raise ValueError("PCA is not fitted yet.")
            
        # A simple heuristic: sum of absolute weights of original features across principal components,
        # weighted by the explained variance of each component.
        components = self.pca.components_  # (n_components, n_features)
        variance_ratio = self.pca.explained_variance_ratio_  # (n_components,)
        
        importance = np.sum(np.abs(components) * variance_ratio[:, np.newaxis], axis=0)
        
        # Return sorted list of (index, importance)
        sorted_indices = np.argsort(importance)[::-1]
        return [(int(idx), float(importance[idx])) for idx in sorted_indices]

    def save(self, filepath: str) -> None:
        """Save scaler and PCA model to disk."""
        if not self.is_fitted:
            raise ValueError("Cannot save an unfitted PCAFeatureExtractor.")
        with open(filepath, 'wb') as f:
            pickle.dump({
                'pca': self.pca,
                'scaler': self.scaler,
                'n_components': self.n_components,
                'variance_threshold': self.variance_threshold
            }, f)

    def load(self, filepath: str) -> None:
        """Load scaler and PCA model from disk."""
        with open(filepath, 'rb') as f:
            data = pickle.load(f)
            self.pca = data['pca']
            self.scaler = data['scaler']
            self.n_components = data['n_components']
            self.variance_threshold = data['variance_threshold']
            self.is_fitted = True
