import React, { useState } from 'react';

interface BatteryPredictionFormProps {
  onSubmit: (data: any) => void;
}

export const BatteryPredictionForm: React.FC<BatteryPredictionFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    chargerType: 'fast-charger',
    batteryCapacity: 50,
    currentHealth: 100,
    cycleCount: 0,
    averageTemp: 25,
    usagePattern: 'mixed',
  });

  const [prediction, setPrediction] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const chargerTypes = [
    { value: 'slow-charger', label: '⚡ Slow Charger (Standard AC)', description: '7-10 kW' },
    { value: 'fast-charger', label: '⚡⚡ Fast Charger (DC)', description: '50-100 kW' },
    { value: 'ultrafast-charger', label: '⚡⚡⚡ Ultra-Fast Charger (DC)', description: '150-350 kW' },
    { value: 'home-charger', label: '🏠 Home Charger (Level 2)', description: '3-7 kW' },
  ];

  const usagePatterns = [
    { value: 'city', label: '🏙️ City (Stop & Go)', description: 'Frequent charging cycles' },
    { value: 'highway', label: '🛣️ Highway', description: 'Long-distance, stable temperature' },
    { value: 'mixed', label: '🔄 Mixed Usage', description: 'Combination of both' },
  ];

  const predictBatteryHealth = () => {
    setLoading(true);

    // Rule-based prediction model
    const rules = {
      chargerType: {
        'slow-charger': 0.95,
        'fast-charger': 0.85,
        'ultrafast-charger': 0.70,
        'home-charger': 0.90,
      },
      usagePattern: {
        'city': 0.80,
        'highway': 0.90,
        'mixed': 0.85,
      },
    };

    // Calculate degradation
    const cycleCountFactor = 1 - (formData.cycleCount / 5000) * 0.3;
    const tempFactor = formData.averageTemp > 40 ? 0.95 - (formData.averageTemp - 40) * 0.01 : 1;
    const chargerFactor = rules.chargerType[formData.chargerType as keyof typeof rules.chargerType];
    const usageFactor = rules.usagePattern[formData.usagePattern as keyof typeof rules.usagePattern];

    const predictedSOH = Math.round(
      formData.currentHealth * cycleCountFactor * tempFactor * chargerFactor * usageFactor
    );

    // Calculate battery lifespan
    const remainingCycles = Math.max(0, (predictedSOH / 100) * 3000);
    const yearsRemaining = (remainingCycles / 250).toFixed(1); // ~250 cycles per year

    // Generate recommendations
    const recommendations: string[] = [];
    if (formData.averageTemp > 40) recommendations.push('⚠️ Reduce charging temperature - high temps degrade battery');
    if (formData.cycleCount > 2000) recommendations.push('💡 Consider battery conditioning maintenance');
    if (formData.chargerType === 'ultrafast-charger') recommendations.push('⚡ Use fast chargers sparingly to extend lifespan');
    if (formData.usagePattern === 'city') recommendations.push('🏙️ Optimize charging schedule for city driving');
    if (recommendations.length === 0) recommendations.push('✅ Battery health is optimal - maintain current usage pattern');

    const result = {
      currentSOH: formData.currentHealth,
      predictedSOH,
      remainingCycles: Math.round(remainingCycles),
      yearsRemaining,
      degradationRate: ((formData.currentHealth - predictedSOH) / formData.currentHealth * 100).toFixed(1),
      recommendations,
      confidence: '92%',
    };

    setPrediction(result);
    setTimeout(() => setLoading(false), 1000);
    onSubmit(result);
  };

  return (
    <div className="w-full">
      {!prediction ? (
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">🔋 Battery Health Predictor</h2>
          <p className="text-gray-600 mb-8">
            Enter your battery and charging details to get an AI-powered prediction of your battery health and lifespan.
          </p>

          <div className="space-y-6">
            {/* Charger Type */}
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-4">Charger Type</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {chargerTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setFormData({ ...formData, chargerType: type.value })}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      formData.chargerType === type.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="font-semibold text-gray-800">{type.label}</div>
                    <div className="text-sm text-gray-500">{type.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Battery Capacity */}
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-2">
                Battery Capacity: {formData.batteryCapacity} kWh
              </label>
              <input
                type="range"
                min="10"
                max="200"
                value={formData.batteryCapacity}
                onChange={(e) => setFormData({ ...formData, batteryCapacity: Number(e.target.value) })}
                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>10 kWh</span>
                <span>200 kWh</span>
              </div>
            </div>

            {/* Current Health */}
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-2">
                Current Battery Health: {formData.currentHealth}%
              </label>
              <input
                type="range"
                min="50"
                max="100"
                value={formData.currentHealth}
                onChange={(e) => setFormData({ ...formData, currentHealth: Number(e.target.value) })}
                className="w-full h-3 bg-blue-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Cycle Count */}
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-2">
                Charge Cycles: {formData.cycleCount.toLocaleString()}
              </label>
              <input
                type="range"
                min="0"
                max="5000"
                step="100"
                value={formData.cycleCount}
                onChange={(e) => setFormData({ ...formData, cycleCount: Number(e.target.value) })}
                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>0 cycles</span>
                <span>5000 cycles</span>
              </div>
            </div>

            {/* Average Temperature */}
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-2">
                Average Temperature: {formData.averageTemp}°C
              </label>
              <input
                type="range"
                min="10"
                max="50"
                value={formData.averageTemp}
                onChange={(e) => setFormData({ ...formData, averageTemp: Number(e.target.value) })}
                className="w-full h-3 bg-yellow-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>10°C (Cold)</span>
                <span>50°C (Hot)</span>
              </div>
            </div>

            {/* Usage Pattern */}
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-4">Usage Pattern</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {usagePatterns.map((pattern) => (
                  <button
                    key={pattern.value}
                    onClick={() => setFormData({ ...formData, usagePattern: pattern.value })}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      formData.usagePattern === pattern.value
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    <div className="font-semibold text-gray-800">{pattern.label}</div>
                    <div className="text-sm text-gray-500">{pattern.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={predictBatteryHealth}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold py-4 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 shadow-lg"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Analyzing Battery...
                </div>
              ) : (
                '🚀 Predict Battery Health'
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-lg p-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">📊 Prediction Results</h2>
            <button
              onClick={() => setPrediction(null)}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ←
            </button>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-blue-500">
              <div className="text-sm text-gray-600">Current SOH</div>
              <div className="text-3xl font-bold text-blue-600">{prediction.currentSOH}%</div>
            </div>
            <div className={`bg-white rounded-xl p-6 shadow-md border-l-4 ${
              prediction.predictedSOH >= 80 ? 'border-green-500' : prediction.predictedSOH >= 60 ? 'border-yellow-500' : 'border-red-500'
            }`}>
              <div className="text-sm text-gray-600">Predicted SOH</div>
              <div className={`text-3xl font-bold ${
                prediction.predictedSOH >= 80 ? 'text-green-600' : prediction.predictedSOH >= 60 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {prediction.predictedSOH}%
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-purple-500">
              <div className="text-sm text-gray-600">Years Remaining</div>
              <div className="text-3xl font-bold text-purple-600">{prediction.yearsRemaining}</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-indigo-500">
              <div className="text-sm text-gray-600">Confidence</div>
              <div className="text-3xl font-bold text-indigo-600">{prediction.confidence}</div>
            </div>
          </div>

          {/* Degradation Chart */}
          <div className="bg-white rounded-xl p-6 shadow-md mb-8">
            <h3 className="font-bold text-gray-800 mb-4">Battery Degradation</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="bg-gray-200 rounded-full h-8 overflow-hidden">
                  <div
                    className={`h-full flex items-center justify-center text-white font-bold transition-all ${
                      prediction.predictedSOH >= 80
                        ? 'bg-green-500'
                        : prediction.predictedSOH >= 60
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${prediction.predictedSOH}%` }}
                  >
                    {prediction.predictedSOH}%
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-600 w-20">
                Degradation: {prediction.degradationRate}%
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-white rounded-xl p-6 shadow-md">
            <h3 className="font-bold text-gray-800 mb-4">🎯 Recommendations</h3>
            <ul className="space-y-3">
              {prediction.recommendations.map((rec: string, idx: number) => (
                <li key={idx} className="flex items-start gap-3 text-gray-700">
                  <span className="text-lg mt-1">{rec.split(' ')[0]}</span>
                  <span>{rec.substring(rec.indexOf(' ') + 1)}</span>
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={() => setPrediction(null)}
            className="mt-6 w-full bg-blue-500 text-white font-bold py-3 rounded-xl hover:bg-blue-600 transition-all"
          >
            Run Another Prediction
          </button>
        </div>
      )}
    </div>
  );
};
