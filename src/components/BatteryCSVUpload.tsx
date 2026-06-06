import React, { useState, useRef } from 'react';
import { Upload, Download, AlertCircle, CheckCircle2, Maximize2 } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import RULAnalyticsDashboard from './RULAnalyticsDashboard';

interface RULPredictionResult {
  row_index: number;
  serial_number: string;
  battery_name: string;
  manufacturer: string;
  input_features: {
    battery_capacity: number;
    current_health: number;
    cycle_count: number;
    average_temp: number;
    charger_type: string;
    usage_pattern: string;
  };
  prediction: {
    success: boolean;
    predicted_rul_cycles: number;
    years_remaining: number;
    degradation_rate: number;
    confidence: number;
    recommendations: string[];
  };
}

interface CSVUploadProps {
  onResults?: (results: RULPredictionResult[]) => void;
}

export const BatteryCSVUpload: React.FC<CSVUploadProps> = ({ onResults }) => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showFullDashboard, setShowFullDashboard] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const text = await file.text();

      // Send to backend
      const response = await fetch('http://localhost:5000/api/battery/rul-predict-csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ csv_content: text }),
      });

      const data = await response.json();

      if (data.success) {
        setResults(data);
        onResults?.(data.results);
      } else {
        setError(data.error || 'Failed to process CSV');
      }
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const downloadResults = () => {
    // Redirect to payment/download page
    window.location.href = '/buy-plans?report=rul-prediction';
  };

  const convertResultsToCSV = (results: RULPredictionResult[]): string => {
    const headers = [
      'Serial Number',
      'Battery Name',
      'Current Health (%)',
      'Cycle Count',
      'Predicted RUL (Cycles)',
      'Years Remaining',
      'Degradation Rate',
      'Confidence (%)',
      'Recommendations',
    ];

    const rows = results.map((r) => [
      r.serial_number,
      r.battery_name,
      r.input_features.current_health,
      r.input_features.cycle_count,
      r.prediction.predicted_rul_cycles,
      r.prediction.years_remaining,
      r.prediction.degradation_rate.toFixed(4),
      r.prediction.confidence,
      r.prediction.recommendations.join('; '),
    ]);

    return [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
  };

  // Prepare data for charts
  const prepareChartData = (results: RULPredictionResult[]) => {
    return results.map((r, idx) => ({
      name: r.battery_name || `Battery ${idx + 1}`,
      serialNumber: r.serial_number,
      rul: r.prediction.predicted_rul_cycles,
      soh: r.input_features.current_health,
      confidence: r.prediction.confidence,
      yearsRemaining: r.prediction.years_remaining,
    }));
  };

  const chartData = results ? prepareChartData(results.results) : [];

  // Show full-screen dashboard if requested
  if (showFullDashboard && results) {
    return (
      <div>
        <button
          onClick={() => setShowFullDashboard(false)}
          className="fixed top-4 left-4 z-50 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
        >
          ← Back to Summary
        </button>
        <RULAnalyticsDashboard results={results} />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 border border-blue-100">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">🔋 Batch RUL Prediction</h2>
        <p className="text-gray-600">Upload a CSV file with battery data to predict RUL for multiple batteries</p>
      </div>

      {/* Template Section */}
      <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-3">📋 CSV Template</h3>
        <p className="text-sm text-blue-700 mb-3">
          Your CSV file must include these columns (exact names required):
        </p>
        <div className="bg-white rounded p-3 font-mono text-xs text-gray-700 overflow-x-auto mb-3">
          serial_number,battery_name,current_health,cycle_count,average_temp,battery_capacity,charger_type,usage_pattern
        </div>
        <div className="text-sm text-blue-700">
          <p className="mb-2"><strong>Required columns:</strong></p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>battery_capacity (kWh)</li>
            <li>current_health (0-100%)</li>
            <li>cycle_count (number)</li>
            <li>average_temp (°C)</li>
            <li>charger_type (slow-charger, fast-charger, ultrafast-charger, home-charger)</li>
            <li>usage_pattern (city, highway, mixed)</li>
          </ul>
        </div>
      </div>

      {/* Upload Area */}
      <div
        className="mb-8 p-8 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50 cursor-pointer hover:bg-blue-100 transition-colors"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx"
          onChange={handleFileChange}
          disabled={loading}
          className="hidden"
        />

        <div className="text-center">
          <Upload className="w-12 h-12 text-blue-600 mx-auto mb-3" />
          <p className="text-lg font-semibold text-gray-800 mb-2">
            {loading ? 'Processing...' : 'Click to upload CSV or drag and drop'}
          </p>
          <p className="text-sm text-gray-600">Supports CSV files with battery data</p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900">Error</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Results Display */}
      {results && (
        <div className="space-y-8">
          {/* Summary Statistics */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-green-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Prediction Summary
              </h3>
              <button
                onClick={() => setShowFullDashboard(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors text-sm"
              >
                <Maximize2 className="w-4 h-4" />
                View Full Dashboard
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-white rounded p-3 shadow-sm">
                <p className="text-xs text-gray-600 uppercase font-semibold">Total Batteries</p>
                <p className="text-2xl font-bold text-green-600">{results.summary.total_batteries}</p>
              </div>

              <div className="bg-white rounded p-3 shadow-sm">
                <p className="text-xs text-gray-600 uppercase font-semibold">Avg RUL</p>
                <p className="text-2xl font-bold text-blue-600">{results.summary.average_rul_cycles}</p>
                <p className="text-xs text-gray-500">cycles</p>
              </div>

              <div className="bg-white rounded p-3 shadow-sm">
                <p className="text-xs text-gray-600 uppercase font-semibold">Avg SOH</p>
                <p className="text-2xl font-bold text-purple-600">{results.summary.average_soh}%</p>
              </div>

              <div className="bg-white rounded p-3 shadow-sm">
                <p className="text-xs text-gray-600 uppercase font-semibold">Avg Confidence</p>
                <p className="text-2xl font-bold text-orange-600">{results.summary.average_confidence}%</p>
              </div>

              <div className="bg-white rounded p-3 shadow-sm border-l-4 border-red-500">
                <p className="text-xs text-red-600 uppercase font-semibold">Critical</p>
                <p className="text-2xl font-bold text-red-600">{results.summary.critical_batteries}</p>
              </div>

              <div className="bg-white rounded p-3 shadow-sm border-l-4 border-yellow-500">
                <p className="text-xs text-yellow-600 uppercase font-semibold">Warning</p>
                <p className="text-2xl font-bold text-yellow-600">{results.summary.warning_batteries}</p>
              </div>
            </div>
          </div>

          {/* Analytics Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* RUL Line Chart */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 mb-4">📊 Predicted RUL Across Batteries</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 12 }} />
                  <YAxis label={{ value: 'RUL (cycles)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '8px' }}
                    formatter={(value) => [`${value} cycles`, 'RUL']}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="rul" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', r: 5 }}
                    name="RUL"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* SOH Bar Chart */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 mb-4">📈 State of Health (SOH) Comparison</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 12 }} />
                  <YAxis label={{ value: 'SOH (%)', angle: -90, position: 'insideLeft' }} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '8px' }}
                    formatter={(value) => [`${value}%`, 'SOH']}
                  />
                  <Legend />
                  <Bar 
                    dataKey="soh" 
                    fill="#10b981" 
                    name="SOH"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Years Remaining & Confidence Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Years Remaining Line Chart */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 mb-4">⏱️ Years Remaining</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 12 }} />
                  <YAxis label={{ value: 'Years', angle: -90, position: 'insideLeft' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '8px' }}
                    formatter={(value: any) => [typeof value === 'number' ? `${value.toFixed(1)} years` : value, 'Remaining']}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="yearsRemaining" 
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    dot={{ fill: '#f59e0b', r: 5 }}
                    name="Years Remaining"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Confidence Bar Chart */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 mb-4">🎯 Model Confidence Score</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 12 }} />
                  <YAxis label={{ value: 'Confidence (%)', angle: -90, position: 'insideLeft' }} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '8px' }}
                    formatter={(value: any) => [typeof value === 'number' ? `${value.toFixed(1)}%` : value, 'Confidence']}
                  />
                  <Legend />
                  <Bar 
                    dataKey="confidence" 
                    fill="#8b5cf6" 
                    name="Confidence"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Results Table - Hidden, Available via Payment */}
          {/* Detailed results table moved behind payment wall */}

          {/* Download Detailed Report Button */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
            <p className="text-gray-700 mb-4">
              📊 <strong>Unlock the detailed report</strong> with battery-by-battery analysis, recommendations, and predictive insights. Available through our premium plans.
            </p>
            <button
              onClick={downloadResults}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-lg font-semibold transition-all transform hover:scale-105"
            >
              <Download className="w-5 h-5" />
              Download Detailed Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatteryCSVUpload;
