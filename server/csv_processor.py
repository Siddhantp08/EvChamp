"""
CSV Data Processing and RUL Prediction API
Processes uploaded CSV files and runs ML model predictions
"""

import pandas as pd
import json
import io
from pathlib import Path
from typing import Dict, List, Optional
import pickle
import numpy as np

from server.rul_service import get_rul_prediction, rul_predictor, initialize_rul_service

class CSVRULProcessor:
    """Process CSV files and predict RUL for multiple batteries"""
    
    def __init__(self):
        self.required_columns = [
            'battery_capacity',
            'current_health',
            'cycle_count',
            'average_temp',
            'charger_type',
            'usage_pattern'
        ]
        self.optional_columns = [
            'serial_number',
            'battery_name',
            'manufacturer',
            'production_date',
            'voltage',
            'temperature'
        ]
    
    def process_csv(self, csv_content: str) -> Dict:
        """
        Process CSV content and generate RUL predictions
        
        Args:
            csv_content: CSV file content as string
            
        Returns:
            Dictionary with results and metadata
        """
        try:
            # Read CSV
            df = pd.read_csv(io.StringIO(csv_content))
            
            # Validate required columns
            missing_cols = [col for col in self.required_columns if col not in df.columns]
            if missing_cols:
                return {
                    'success': False,
                    'error': f'Missing required columns: {", ".join(missing_cols)}',
                    'required_columns': self.required_columns,
                    'optional_columns': self.optional_columns
                }
            
            # Process each row
            results = []
            errors = []
            
            for idx, row in df.iterrows():
                try:
                    # Extract features
                    features = {
                        'battery_capacity': float(row.get('battery_capacity', 0)),
                        'current_health': float(row.get('current_health', 100)),
                        'cycle_count': int(row.get('cycle_count', 0)),
                        'average_temp': float(row.get('average_temp', 25)),
                        'charger_type': str(row.get('charger_type', 'fast')).lower(),
                        'usage_pattern': str(row.get('usage_pattern', 'mixed')).lower(),
                    }
                    
                    # Get optional fields
                    optional_data = {
                        'serial_number': row.get('serial_number', f'BATTERY-{idx+1}'),
                        'battery_name': row.get('battery_name', ''),
                        'manufacturer': row.get('manufacturer', ''),
                        'production_date': row.get('production_date', ''),
                    }
                    
                    # Run prediction
                    prediction = get_rul_prediction(features)
                    
                    # Combine with optional data
                    result = {
                        'row_index': idx + 1,
                        **optional_data,
                        'input_features': features,
                        'prediction': prediction
                    }
                    
                    results.append(result)
                    
                except Exception as e:
                    errors.append({
                        'row': idx + 1,
                        'error': str(e)
                    })
            
            return {
                'success': len(errors) == 0,
                'total_rows': len(df),
                'processed_rows': len(results),
                'failed_rows': len(errors),
                'results': results,
                'errors': errors,
                'summary': self._generate_summary(results)
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'CSV processing failed: {str(e)}'
            }
    
    def _generate_summary(self, results: List[Dict]) -> Dict:
        """Generate summary statistics from predictions"""
        if not results:
            return {}
        
        predictions = [r['prediction'] for r in results if 'prediction' in r and r['prediction'].get('success')]
        
        if not predictions:
            return {'error': 'No valid predictions'}
        
        rul_values = [p.get('predicted_rul_cycles', 0) for p in predictions]
        confidence_values = [p.get('confidence', 0) for p in predictions]
        soh_values = [r['input_features'].get('current_health', 0) for r in results]
        
        return {
            'total_batteries': len(results),
            'average_rul_cycles': round(np.mean(rul_values), 0),
            'min_rul_cycles': int(np.min(rul_values)),
            'max_rul_cycles': int(np.max(rul_values)),
            'average_confidence': round(np.mean(confidence_values), 1),
            'average_soh': round(np.mean(soh_values), 1),
            'critical_batteries': len([v for v in rul_values if v < 500]),
            'warning_batteries': len([v for v in rul_values if 500 <= v < 1000]),
            'healthy_batteries': len([v for v in rul_values if v >= 1000])
        }

# Global processor instance
csv_processor = CSVRULProcessor()

def process_battery_csv(csv_content: str) -> Dict:
    """API function to process battery CSV"""
    return csv_processor.process_csv(csv_content)

if __name__ == '__main__':
    # Initialize models first
    initialize_rul_service()
    
    # Example CSV content
    example_csv = """serial_number,battery_name,current_health,cycle_count,average_temp,battery_capacity,charger_type,usage_pattern
BAT001,Truck Battery 1,85,500,30,100,fast,mixed
BAT002,Bus Battery 1,92,200,28,280,slow,highway
BAT003,Auto Battery 1,72,1500,35,50,fast,city
BAT004,Truck Battery 2,88,300,32,100,home,mixed"""
    
    result = process_battery_csv(example_csv)
    print(json.dumps(result, indent=2))
