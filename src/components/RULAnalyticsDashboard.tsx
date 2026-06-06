import React, { useState, useEffect } from 'react';
import { Download, TrendingDown, TrendingUp, AlertCircle, CheckCircle, Zap } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface RULPredictionResult {
  row_index: number;
  serial_number: string;
  battery_name: string;
  input_features: {
    current_health: number;
    cycle_count: number;
  };
  prediction: {
    predicted_rul_cycles: number;
    years_remaining: number;
    degradation_rate: number;
    confidence: number;
    recommendations: string;
  };
}

interface AnalyticsDashboardProps {
  results: {
    results: RULPredictionResult[];
    summary: {
      total_batteries: number;
      average_rul_cycles: number;
      average_soh: number;
      average_confidence: number;
      critical_batteries?: number;
      warning_batteries?: number;
    };
  };
}

export const RULAnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ results }) => {
  const [selectedMetric, setSelectedMetric] = useState<'rul' | 'soh' | 'confidence' | 'years'>('rul');

  if (!results) return null;

  const chartData = results.results.map((r, idx) => ({
    name: r.battery_name?.substring(0, 15) || `Battery ${idx + 1}`,
    serialNumber: r.serial_number,
    rul: r.prediction.predicted_rul_cycles,
    soh: r.input_features.current_health,
    confidence: r.prediction.confidence,
    yearsRemaining: r.prediction.years_remaining,
    cycles: r.input_features.cycle_count,
  }));

  // Status distribution data for pie chart
  const criticalCount = results.results.filter(r => r.prediction.predicted_rul_cycles < 500).length;
  const warningCount = results.results.filter(r => r.prediction.predicted_rul_cycles >= 500 && r.prediction.predicted_rul_cycles < 1000).length;
  const healthyCount = results.results.filter(r => r.prediction.predicted_rul_cycles >= 1000).length;

  const statusData = [
    { name: 'Healthy', value: healthyCount, color: '#10b981' },
    { name: 'Warning', value: warningCount, color: '#f59e0b' },
    { name: 'Critical', value: criticalCount, color: '#ef4444' },
  ];

  const downloadFullReport = () => {
    window.location.href = '/buy-plans?report=rul-prediction';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-5xl font-bold text-gray-900 mb-2">🔋 RUL Analytics Dashboard</h1>
            <p className="text-xl text-gray-600">Comprehensive battery health and remaining useful life analysis</p>
          </div>
          <button
            onClick={downloadFullReport}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg"
          >
            <Download className="w-6 h-6" />
            Download Full Report
          </button>
        </div>
      </div>

      {/* Key Metrics - Large Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="bg-white rounded-2xl p-8 shadow-lg border-l-4 border-green-500 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <p className="text-lg text-gray-600 font-semibold">Total Batteries</p>
            <Zap className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-5xl font-bold text-green-600">{results.summary.total_batteries}</p>
          <p className="text-sm text-gray-500 mt-2">batteries analyzed</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-lg border-l-4 border-blue-500 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <p className="text-lg text-gray-600 font-semibold">Avg RUL</p>
            <TrendingUp className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-5xl font-bold text-blue-600">{results.summary.average_rul_cycles}</p>
          <p className="text-sm text-gray-500 mt-2">cycles remaining</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-lg border-l-4 border-purple-500 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <p className="text-lg text-gray-600 font-semibold">Avg Health</p>
            <CheckCircle className="w-8 h-8 text-purple-600" />
          </div>
          <p className="text-5xl font-bold text-purple-600">{results.summary.average_soh}%</p>
          <p className="text-sm text-gray-500 mt-2">state of health</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-lg border-l-4 border-orange-500 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <p className="text-lg text-gray-600 font-semibold">Confidence</p>
            <AlertCircle className="w-8 h-8 text-orange-600" />
          </div>
          <p className="text-5xl font-bold text-orange-600">{results.summary.average_confidence}%</p>
          <p className="text-sm text-gray-500 mt-2">model confidence</p>
        </div>
      </div>

      {/* Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
        {/* Pie Chart */}
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">📊 Battery Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value} batteries`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-6 space-y-3">
            {statusData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-gray-700 font-semibold">{item.name}</span>
                </div>
                <span className="text-2xl font-bold text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Alert Stats */}
        <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-8 shadow-lg border-2 border-red-200">
          <h3 className="text-2xl font-bold text-red-900 mb-6">🚨 Critical Alerts</h3>
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-4">
              <p className="text-gray-600 text-sm mb-1">Batteries Requiring Attention</p>
              <p className="text-4xl font-bold text-red-600">{criticalCount}</p>
              <p className="text-xs text-gray-500 mt-1">RUL &lt; 500 cycles</p>
            </div>
            <div className="bg-white rounded-xl p-4">
              <p className="text-gray-600 text-sm mb-1">Batteries in Warning</p>
              <p className="text-4xl font-bold text-yellow-600">{warningCount}</p>
              <p className="text-xs text-gray-500 mt-1">RUL 500-1000 cycles</p>
            </div>
            <div className="bg-white rounded-xl p-4">
              <p className="text-gray-600 text-sm mb-1">Healthy Batteries</p>
              <p className="text-4xl font-bold text-green-600">{healthyCount}</p>
              <p className="text-xs text-gray-500 mt-1">RUL &gt; 1000 cycles</p>
            </div>
          </div>
        </div>

        {/* Performance Indicators */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 shadow-lg border-2 border-blue-200">
          <h3 className="text-2xl font-bold text-blue-900 mb-6">📈 Performance Metrics</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-700 font-semibold">Average RUL Health</span>
                <span className="text-blue-600 font-bold">{Math.round((results.summary.average_rul_cycles / 2000) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all"
                  style={{ width: `${Math.round((results.summary.average_rul_cycles / 2000) * 100)}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-700 font-semibold">Average SOH</span>
                <span className="text-purple-600 font-bold">{results.summary.average_soh}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-600 h-3 rounded-full transition-all"
                  style={{ width: `${results.summary.average_soh}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-700 font-semibold">Model Confidence</span>
                <span className="text-orange-600 font-bold">{results.summary.average_confidence}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-orange-500 to-red-600 h-3 rounded-full transition-all"
                  style={{ width: `${results.summary.average_confidence}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full-Width Charts */}
      <div className="space-y-8">
        {/* RUL Chart - Full Width */}
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">📊 Predicted RUL Across All Batteries</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} tick={{ fontSize: 12 }} />
              <YAxis label={{ value: 'RUL (cycles)', angle: -90, position: 'insideLeft' }} width={80} />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '2px solid #3b82f6', borderRadius: '12px', padding: '12px' }}
                formatter={(value) => [`${value} cycles`, 'RUL']}
                labelFormatter={(label) => `${label}`}
              />
              <Legend wrapperStyle={{ fontSize: '14px' }} />
              <Line
                type="monotone"
                dataKey="rul"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: '#3b82f6', r: 6 }}
                activeDot={{ r: 8 }}
                name="RUL (cycles)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* SOH Chart - Full Width */}
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">📈 State of Health (SOH) Analysis</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} tick={{ fontSize: 12 }} />
              <YAxis label={{ value: 'SOH (%)', angle: -90, position: 'insideLeft' }} width={80} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '2px solid #10b981', borderRadius: '12px', padding: '12px' }}
                formatter={(value) => [`${value}%`, 'SOH']}
              />
              <Legend wrapperStyle={{ fontSize: '14px' }} />
              <Bar dataKey="soh" fill="#10b981" name="State of Health (%)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Years Remaining - Full Width */}
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">⏱️ Years Remaining by Battery</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} tick={{ fontSize: 12 }} />
              <YAxis label={{ value: 'Years', angle: -90, position: 'insideLeft' }} width={80} />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '2px solid #f59e0b', borderRadius: '12px', padding: '12px' }}
                formatter={(value: any) => [typeof value === 'number' ? `${value.toFixed(1)} years` : value, 'Years Remaining']
                }
              />
              <Legend wrapperStyle={{ fontSize: '14px' }} />
              <Line
                type="monotone"
                dataKey="yearsRemaining"
                stroke="#f59e0b"
                strokeWidth={3}
                dot={{ fill: '#f59e0b', r: 6 }}
                activeDot={{ r: 8 }}
                name="Years Remaining"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Confidence Score - Full Width */}
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">🎯 Model Confidence Score</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} tick={{ fontSize: 12 }} />
              <YAxis label={{ value: 'Confidence (%)', angle: -90, position: 'insideLeft' }} width={80} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '2px solid #8b5cf6', borderRadius: '12px', padding: '12px' }}
                formatter={(value: any) => [typeof value === 'number' ? `${value.toFixed(1)}%` : value, 'Confidence']
                }
              />
              <Legend wrapperStyle={{ fontSize: '14px' }} />
              <Bar dataKey="confidence" fill="#8b5cf6" name="Model Confidence (%)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Cycles vs Health - Bubble Chart Style */}
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">🔄 Cycle Count vs Health Correlation</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} tick={{ fontSize: 12 }} />
              <YAxis yAxisId="left" label={{ value: 'Cycles', angle: -90, position: 'insideLeft' }} width={80} />
              <YAxis yAxisId="right" orientation="right" label={{ value: 'Health (%)', angle: 90, position: 'insideRight' }} width={80} />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '2px solid #06b6d4', borderRadius: '12px', padding: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '14px' }} />
              <Bar yAxisId="left" dataKey="cycles" fill="#06b6d4" name="Cycle Count" radius={[8, 8, 0, 0]} />
              <Bar yAxisId="right" dataKey="soh" fill="#ec4899" name="Health (%)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 text-center">
        <p className="text-gray-600">Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  );
};

export default RULAnalyticsDashboard;
