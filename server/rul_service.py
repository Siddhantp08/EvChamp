"""
RUL (Remaining Useful Life) Prediction Service
Loads trained ML models and provides inference API
"""

import pickle
import json
import os
from pathlib import Path
import numpy as np
from typing import Dict, List, Optional

# Model file paths (relative to project root)
MODELS_DIR = Path(__file__).parent.parent / "models" / "rul"
RUL_MODEL_PATH = MODELS_DIR / "trained_models" / "rul_model.pkl"
SCALER_PATH = MODELS_DIR / "trained_models" / "scaler.pkl"
ENCODER_PATH = MODELS_DIR / "trained_models" / "encoder.pkl"
CONFIG_PATH = MODELS_DIR / "config" / "rul_config.json"
FEATURES_PATH = MODELS_DIR / "config" / "feature_names.json"

class RULPredictor:
    """Load and run RUL prediction models"""
    
    def __init__(self):
        self.model = None
        self.scaler = None
        self.encoder = None
        self.config = None
        self.feature_names = None
        self.is_loaded = False
        
    def load_models(self) -> bool:
        """Load all pickle models and configuration"""
        try:
            # Load RUL model
            if RUL_MODEL_PATH.exists():
                with open(RUL_MODEL_PATH, 'rb') as f:
                    self.model = pickle.load(f)
                print(f"✅ RUL Model loaded: {RUL_MODEL_PATH}")
            else:
                print(f"⚠️  RUL Model not found: {RUL_MODEL_PATH}")
            
            # Load scaler
            if SCALER_PATH.exists():
                with open(SCALER_PATH, 'rb') as f:
                    self.scaler = pickle.load(f)
                print(f"✅ Scaler loaded: {SCALER_PATH}")
            
            # Load encoder
            if ENCODER_PATH.exists():
                with open(ENCODER_PATH, 'rb') as f:
                    self.encoder = pickle.load(f)
                print(f"✅ Encoder loaded: {ENCODER_PATH}")
            
            # Load config
            if CONFIG_PATH.exists():
                with open(CONFIG_PATH, 'r') as f:
                    self.config = json.load(f)
                print(f"✅ Config loaded: {CONFIG_PATH}")
            
            # Load feature names
            if FEATURES_PATH.exists():
                with open(FEATURES_PATH, 'r') as f:
                    self.feature_names = json.load(f)
                print(f"✅ Feature names loaded: {FEATURES_PATH}")
            
            self.is_loaded = True
            return True
            
        except Exception as e:
            print(f"❌ Error loading models: {str(e)}")
            return False
    
    def preprocess_features(self, features: Dict) -> np.ndarray:
        """
        Preprocess input features for model prediction
        
        Args:
            features: Dictionary with battery parameters
            
        Returns:
            Preprocessed numpy array
        """
        try:
            # Extract features in order
            feature_list = [
                features.get('battery_capacity', 0),
                features.get('current_health', 100),
                features.get('cycle_count', 0),
                features.get('average_temp', 25),
                features.get('charger_type', 1),  # Encoded
                features.get('usage_pattern', 1),  # Encoded
            ]
            
            X = np.array([feature_list])
            
            # Scale features if scaler available
            if self.scaler:
                X = self.scaler.transform(X)
            
            return X
            
        except Exception as e:
            print(f"❌ Preprocessing error: {str(e)}")
            return None
    
    def predict_rul(self, features: Dict) -> Optional[Dict]:
        """
        Predict RUL for given battery features
        
        Args:
            features: Dictionary with:
                - battery_capacity (kWh)
                - current_health (0-100%)
                - cycle_count (int)
                - average_temp (°C)
                - charger_type (str: 'slow', 'fast', 'ultrafast', 'home')
                - usage_pattern (str: 'city', 'highway', 'mixed')
        
        Returns:
            Dictionary with RUL predictions and confidence
        """
        if not self.is_loaded or self.model is None:
            return {
                'error': 'Models not loaded',
                'prediction': None,
                'confidence': 0
            }
        
        try:
            # Preprocess features
            X = self.preprocess_features(features)
            if X is None:
                return {'error': 'Preprocessing failed', 'confidence': 0}
            
            # Make prediction
            prediction = self.model.predict(X)[0]
            
            # Get confidence if available (for ensemble/probabilistic models)
            confidence = 0.92  # Default confidence
            if hasattr(self.model, 'predict_proba'):
                proba = self.model.predict_proba(X)[0]
                confidence = float(np.max(proba))
            
            # Calculate metrics
            current_soh = features.get('current_health', 100)
            current_cycles = features.get('cycle_count', 0)
            predicted_rul_cycles = max(0, int(prediction))
            years_remaining = predicted_rul_cycles / 250  # ~250 cycles/year
            degradation_rate = (100 - current_soh) / max(1, current_cycles)
            
            return {
                'success': True,
                'predicted_rul_cycles': predicted_rul_cycles,
                'years_remaining': round(years_remaining, 2),
                'predicted_end_of_life_cycle': current_cycles + predicted_rul_cycles,
                'degradation_rate': round(degradation_rate, 4),
                'confidence': round(confidence * 100, 1),
                'model_version': self.config.get('version', 'unknown') if self.config else 'unknown',
                'recommendations': self._generate_recommendations(
                    features, predicted_rul_cycles, current_soh
                )
            }
            
        except Exception as e:
            return {
                'error': f'Prediction failed: {str(e)}',
                'confidence': 0
            }
    
    def _generate_recommendations(self, features: Dict, rul_cycles: int, soh: float) -> List[str]:
        """Generate maintenance recommendations based on predictions"""
        recommendations = []
        
        # Temperature recommendations
        temp = features.get('average_temp', 25)
        if temp > 40:
            recommendations.append("🌡️ High temperature detected - Improve cooling")
        elif temp < 5:
            recommendations.append("❄️ Low temperature detected - Battery efficiency reduced")
        
        # Charger type recommendations
        charger = features.get('charger_type', 'unknown')
        if charger == 'ultrafast':
            recommendations.append("⚡ Using ultra-fast charger - Consider slower charging for longevity")
        
        # Cycle count recommendations
        if rul_cycles < 500:
            recommendations.append("⏰ Low remaining cycles - Plan replacement soon")
        elif rul_cycles < 1000:
            recommendations.append("📊 Moderate remaining cycles - Monitor closely")
        
        # SOH recommendations
        if soh < 70:
            recommendations.append("📉 Low state of health - Schedule maintenance")
        
        if not recommendations:
            recommendations.append("✅ Battery in good condition - Continue normal operation")
        
        return recommendations


# Global predictor instance
rul_predictor = RULPredictor()

def initialize_rul_service():
    """Initialize RUL service on startup"""
    success = rul_predictor.load_models()
    if success:
        print("🎯 RUL Service initialized successfully")
    else:
        print("⚠️  RUL Service initialized with missing models")
    return success


def get_rul_prediction(features: Dict) -> Dict:
    """API function to get RUL prediction"""
    return rul_predictor.predict_rul(features)


if __name__ == '__main__':
    # Test the service
    initialize_rul_service()
    
    test_features = {
        'battery_capacity': 100,
        'current_health': 85,
        'cycle_count': 500,
        'average_temp': 30,
        'charger_type': 'fast',
        'usage_pattern': 'mixed'
    }
    
    result = get_rul_prediction(test_features)
    print("\nPrediction Result:")
    print(json.dumps(result, indent=2))
