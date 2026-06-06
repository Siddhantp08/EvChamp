import React, { useRef } from 'react';
import { BatteryAnalysis } from '../services/batteryService';

interface BISCertificateProps {
  battery: BatteryAnalysis;
  onClose: () => void;
}

const BISCertificate: React.FC<BISCertificateProps> = ({ battery, onClose }) => {
  const certRef = useRef<HTMLDivElement>(null);
  const certDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const certNumber = `ZB/EV/${battery.serialNumber}/${Date.now().toString(36).toUpperCase()}`;
  const validUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  // Determine overall compliance
  const allCellsInRange = battery.cells.every(
    (c) =>
      c.voltage >= battery.normalRange.voltage.min &&
      c.voltage <= battery.normalRange.voltage.max &&
      c.temperature >= battery.normalRange.temperature.min &&
      c.temperature <= battery.normalRange.temperature.max
  );
  const healthPass = battery.health >= 70;
  const sohPass = battery.soh >= 60;
  const tempPass = battery.temperature <= 90;
  const overallPass = allCellsInRange && healthPass && sohPass && tempPass;

  // Cell voltage stats
  const voltages = battery.cells.map((c) => c.voltage);
  const temps = battery.cells.map((c) => c.temperature);
  const avgVoltage = (voltages.reduce((a, b) => a + b, 0) / voltages.length).toFixed(2);
  const minVoltage = Math.min(...voltages).toFixed(2);
  const maxVoltage = Math.max(...voltages).toFixed(2);
  const avgTemp = (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1);
  const minTemp = Math.min(...temps);
  const maxTemp = Math.max(...temps);

  const handlePrint = () => {
    const printContent = certRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow pop-ups to print the certificate.');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>ZipBolt Certificate - ${battery.serialNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          @page { size: A4; margin: 0; }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          .cert-page {
            width: 210mm;
            min-height: 297mm;
            padding: 15mm 18mm;
            margin: 0 auto;
            background: white;
            position: relative;
          }
          .cert-border {
            border: 3px solid #1e3a5f;
            border-radius: 8px;
            padding: 20px 25px;
            min-height: calc(297mm - 30mm);
            position: relative;
          }
          .cert-border::before {
            content: '';
            position: absolute;
            top: 4px; left: 4px; right: 4px; bottom: 4px;
            border: 1px solid #1e3a5f;
            border-radius: 6px;
            pointer-events: none;
          }
          .header { text-align: center; margin-bottom: 15px; padding-bottom: 12px; border-bottom: 2px solid #1e3a5f; }
          .bis-logo { display: flex; justify-content: center; align-items: center; gap: 15px; margin-bottom: 8px; }
          .bis-emblem { width: 60px; height: 60px; border: 2px solid #1e3a5f; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 28px; background: #f0f4ff; }
          .header h1 { font-size: 18px; color: #1e3a5f; letter-spacing: 3px; font-weight: 800; text-transform: uppercase; }
          .header h2 { font-size: 13px; color: #1e3a5f; font-weight: 600; margin-top: 2px; }
          .header .subtitle { font-size: 10px; color: #666; margin-top: 4px; }
          .header .sub-brand { font-size: 9px; color: #888; margin-top: 2px; }
          .cert-meta { display: flex; justify-content: space-between; margin-bottom: 14px; font-size: 10px; }
          .cert-meta .meta-item { text-align: left; }
          .cert-meta .meta-item label { color: #888; display: block; font-size: 8px; text-transform: uppercase; letter-spacing: 1px; }
          .cert-meta .meta-item span { color: #1e3a5f; font-weight: 700; font-size: 10px; }
          .section { margin-bottom: 12px; }
          .section-title { font-size: 11px; font-weight: 800; color: #1e3a5f; text-transform: uppercase; letter-spacing: 1.5px; padding-bottom: 4px; border-bottom: 1.5px solid #e0e7ef; margin-bottom: 8px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 20px; font-size: 10px; }
          .info-row { display: flex; justify-content: space-between; padding: 3px 0; }
          .info-row .label { color: #666; }
          .info-row .value { font-weight: 700; color: #1e3a5f; }
          .cell-table { width: 100%; border-collapse: collapse; font-size: 9px; margin-top: 6px; }
          .cell-table th { background: #1e3a5f; color: white; padding: 5px 6px; text-align: center; font-weight: 600; font-size: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
          .cell-table td { padding: 4px 6px; text-align: center; border-bottom: 1px solid #e8e8e8; font-size: 9px; }
          .cell-table tr:nth-child(even) { background: #f8fafc; }
          .pass { color: #16a34a; font-weight: 700; }
          .fail { color: #dc2626; font-weight: 700; }
          .warn { color: #d97706; font-weight: 700; }
          .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 8px 0; }
          .stat-box { background: #f0f4ff; border-radius: 6px; padding: 8px; text-align: center; }
          .stat-box .stat-value { font-size: 16px; font-weight: 800; color: #1e3a5f; }
          .stat-box .stat-label { font-size: 8px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px; }
          .verdict { text-align: center; padding: 12px; margin: 12px 0; border-radius: 8px; }
          .verdict.pass-verdict { background: #f0fdf4; border: 2px solid #16a34a; }
          .verdict.fail-verdict { background: #fef2f2; border: 2px solid #dc2626; }
          .verdict .verdict-icon { font-size: 28px; margin-bottom: 4px; }
          .verdict .verdict-text { font-size: 16px; font-weight: 800; letter-spacing: 2px; }
          .verdict .verdict-sub { font-size: 9px; color: #666; margin-top: 3px; }
          .footer { margin-top: 15px; padding-top: 10px; border-top: 1.5px solid #e0e7ef; display: flex; justify-content: space-between; align-items: flex-end; }
          .signature-box { text-align: center; width: 140px; }
          .signature-line { border-top: 1px solid #333; margin-top: 30px; padding-top: 3px; font-size: 8px; color: #666; }
          .qr-placeholder { width: 70px; height: 70px; border: 1px solid #ccc; display: flex; align-items: center; justify-content: center; font-size: 7px; color: #999; border-radius: 4px; background: #fafafa; }
          .disclaimer { font-size: 7px; color: #999; text-align: center; margin-top: 10px; line-height: 1.4; }
          .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 80px; color: rgba(30,58,95,0.04); font-weight: 900; letter-spacing: 10px; pointer-events: none; white-space: nowrap; }
          .checklist { font-size: 10px; margin: 6px 0; }
          .checklist-item { display: flex; align-items: center; gap: 6px; padding: 3px 0; }
          .check-pass { color: #16a34a; }
          .check-fail { color: #dc2626; }
          @media print { body { margin: 0; } .cert-page { margin: 0; } }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto py-8">
      {/* Toolbar */}
      <div className="fixed top-4 right-4 z-[60] flex items-center space-x-3">
        <button
          onClick={handlePrint}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          <span>Print / Download PDF</span>
        </button>
        <button
          onClick={onClose}
          className="bg-gray-700 text-white w-10 h-10 rounded-lg font-bold hover:bg-gray-800 transition-colors shadow-lg flex items-center justify-center text-xl"
        >
          ✕
        </button>
      </div>

      <div ref={certRef}>
        <div className="cert-page" style={{
          width: '210mm',
          minHeight: '297mm',
          padding: '15mm 18mm',
          margin: '0 auto',
          background: 'white',
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          position: 'relative',
          color: '#1a1a1a',
        }}>
          <div className="cert-border" style={{
            border: '3px solid #1e3a5f',
            borderRadius: '8px',
            padding: '20px 25px',
            minHeight: 'calc(297mm - 30mm)',
            position: 'relative',
          }}>
            {/* Inner border */}
            <div style={{
              position: 'absolute', top: '4px', left: '4px', right: '4px', bottom: '4px',
              border: '1px solid #1e3a5f', borderRadius: '6px', pointerEvents: 'none',
            }} />

            {/* Watermark */}
            <div className="watermark" style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%) rotate(-30deg)',
              fontSize: '80px', color: 'rgba(30,58,95,0.04)', fontWeight: 900,
              letterSpacing: '10px', pointerEvents: 'none', whiteSpace: 'nowrap',
            }}>
              ZIPBOLT CERTIFIED
            </div>

            {/* Header */}
            <div className="header" style={{ textAlign: 'center', marginBottom: '15px', paddingBottom: '12px', borderBottom: '2px solid #1e3a5f' }}>
              <div className="bis-logo" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginBottom: '8px' }}>
                <div className="bis-emblem" style={{
                  width: '60px', height: '60px', border: '2px solid #1e3a5f', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', background: '#f0f4ff',
                }}>
                  🏛️
                </div>
                <div>
                  <h1 style={{ fontSize: '18px', color: '#1e3a5f', letterSpacing: '3px', fontWeight: 800, textTransform: 'uppercase' }}>
                    ZipBolt
                  </h1>
                  <h2 style={{ fontSize: '13px', color: '#1e3a5f', fontWeight: 600, marginTop: '2px' }}>
                    Battery Audit &amp; Cell Analysis Certificate
                  </h2>
                  <p style={{ fontSize: '9px', color: '#888', marginTop: '2px' }}>Verified by ZipBolt | Bureau of Indian Standards Compliant</p>
                </div>
                <div className="bis-emblem" style={{
                  width: '60px', height: '60px', border: '2px solid #1e3a5f', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', background: '#f0f4ff',
                }}>
                  ⚡
                </div>
              </div>
              <p className="subtitle" style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>
                Verified as per IS 16893:2018 &amp; AIS-156 Standards for EV Battery Systems
              </p>
            </div>

            {/* Certificate Meta */}
            <div className="cert-meta" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px', fontSize: '10px' }}>
              <div className="meta-item">
                <label style={{ color: '#888', display: 'block', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Certificate No.</label>
                <span style={{ color: '#1e3a5f', fontWeight: 700, fontSize: '10px' }}>{certNumber}</span>
              </div>
              <div className="meta-item">
                <label style={{ color: '#888', display: 'block', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Date of Issue</label>
                <span style={{ color: '#1e3a5f', fontWeight: 700, fontSize: '10px' }}>{certDate}</span>
              </div>
              <div className="meta-item">
                <label style={{ color: '#888', display: 'block', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Valid Until</label>
                <span style={{ color: '#1e3a5f', fontWeight: 700, fontSize: '10px' }}>{validUntil}</span>
              </div>
              <div className="meta-item">
                <label style={{ color: '#888', display: 'block', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Tested by</label>
                <span style={{ color: '#1e3a5f', fontWeight: 700, fontSize: '10px' }}>ZipBolt</span>
              </div>
            </div>

            {/* Section 1: Battery Information */}
            <div className="section" style={{ marginBottom: '12px' }}>
              <div className="section-title" style={{
                fontSize: '11px', fontWeight: 800, color: '#1e3a5f', textTransform: 'uppercase',
                letterSpacing: '1.5px', paddingBottom: '4px', borderBottom: '1.5px solid #e0e7ef', marginBottom: '8px',
              }}>
                1. Battery Information
              </div>
              <div className="info-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 20px', fontSize: '10px' }}>
                <div className="info-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                  <span className="label" style={{ color: '#666' }}>Serial Number</span>
                  <span className="value" style={{ fontWeight: 700, color: '#1e3a5f' }}>{battery.serialNumber}</span>
                </div>
                <div className="info-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                  <span className="label" style={{ color: '#666' }}>Battery Name</span>
                  <span className="value" style={{ fontWeight: 700, color: '#1e3a5f' }}>{battery.name}</span>
                </div>
                <div className="info-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                  <span className="label" style={{ color: '#666' }}>Brand / Make</span>
                  <span className="value" style={{ fontWeight: 700, color: '#1e3a5f' }}>{battery.brand}</span>
                </div>
                <div className="info-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                  <span className="label" style={{ color: '#666' }}>Vehicle Type</span>
                  <span className="value" style={{ fontWeight: 700, color: '#1e3a5f', textTransform: 'capitalize' }}>{battery.type}</span>
                </div>
                <div className="info-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                  <span className="label" style={{ color: '#666' }}>Nominal Voltage</span>
                  <span className="value" style={{ fontWeight: 700, color: '#1e3a5f' }}>{battery.voltage}V</span>
                </div>
                <div className="info-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                  <span className="label" style={{ color: '#666' }}>Rated Capacity</span>
                  <span className="value" style={{ fontWeight: 700, color: '#1e3a5f' }}>{battery.capacity}Ah</span>
                </div>
                <div className="info-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                  <span className="label" style={{ color: '#666' }}>Number of Cells</span>
                  <span className="value" style={{ fontWeight: 700, color: '#1e3a5f' }}>{battery.cells.length}</span>
                </div>
                <div className="info-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                  <span className="label" style={{ color: '#666' }}>Status</span>
                  <span className="value" style={{ fontWeight: 700, color: battery.status === 'Active' ? '#16a34a' : '#dc2626' }}>{battery.status}</span>
                </div>
              </div>
            </div>

            {/* Section 2: Performance Summary */}
            <div className="section" style={{ marginBottom: '12px' }}>
              <div className="section-title" style={{
                fontSize: '11px', fontWeight: 800, color: '#1e3a5f', textTransform: 'uppercase',
                letterSpacing: '1.5px', paddingBottom: '4px', borderBottom: '1.5px solid #e0e7ef', marginBottom: '8px',
              }}>
                2. Performance Summary
              </div>
              <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', margin: '8px 0' }}>
                <div className="stat-box" style={{ background: '#f0f4ff', borderRadius: '6px', padding: '8px', textAlign: 'center' }}>
                  <div className="stat-value" style={{ fontSize: '16px', fontWeight: 800, color: '#1e3a5f' }}>{battery.soh}%</div>
                  <div className="stat-label" style={{ fontSize: '8px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>State of Health</div>
                </div>
                <div className="stat-box" style={{ background: '#f0fdf4', borderRadius: '6px', padding: '8px', textAlign: 'center' }}>
                  <div className="stat-value" style={{ fontSize: '16px', fontWeight: 800, color: '#16a34a' }}>{battery.health}%</div>
                  <div className="stat-label" style={{ fontSize: '8px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>Health Score</div>
                </div>
                <div className="stat-box" style={{ background: '#fff7ed', borderRadius: '6px', padding: '8px', textAlign: 'center' }}>
                  <div className="stat-value" style={{ fontSize: '16px', fontWeight: 800, color: '#ea580c' }}>{battery.cycles}</div>
                  <div className="stat-label" style={{ fontSize: '8px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>Charge Cycles</div>
                </div>
                <div className="stat-box" style={{ background: '#f0f4ff', borderRadius: '6px', padding: '8px', textAlign: 'center' }}>
                  <div className="stat-value" style={{ fontSize: '16px', fontWeight: 800, color: '#1e3a5f' }}>{battery.charge}%</div>
                  <div className="stat-label" style={{ fontSize: '8px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>Charge Level</div>
                </div>
                <div className="stat-box" style={{ background: '#fef2f2', borderRadius: '6px', padding: '8px', textAlign: 'center' }}>
                  <div className="stat-value" style={{ fontSize: '16px', fontWeight: 800, color: '#dc2626' }}>{battery.temperature}°C</div>
                  <div className="stat-label" style={{ fontSize: '8px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>Pack Temp</div>
                </div>
                <div className="stat-box" style={{ background: '#eff6ff', borderRadius: '6px', padding: '8px', textAlign: 'center' }}>
                  <div className="stat-value" style={{ fontSize: '16px', fontWeight: 800, color: '#2563eb' }}>{battery.current}A</div>
                  <div className="stat-label" style={{ fontSize: '8px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>Current Draw</div>
                </div>
              </div>
            </div>

            {/* Section 3: Cell-Level Analysis */}
            <div className="section" style={{ marginBottom: '12px' }}>
              <div className="section-title" style={{
                fontSize: '11px', fontWeight: 800, color: '#1e3a5f', textTransform: 'uppercase',
                letterSpacing: '1.5px', paddingBottom: '4px', borderBottom: '1.5px solid #e0e7ef', marginBottom: '8px',
              }}>
                3. Cell-Level Analysis ({battery.cells.length} Cells)
              </div>

              {/* Cell stats summary */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 20px', fontSize: '10px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                  <span style={{ color: '#666' }}>Acceptable Voltage Range</span>
                  <span style={{ fontWeight: 700, color: '#16a34a' }}>{battery.normalRange.voltage.min}V – {battery.normalRange.voltage.max}V</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                  <span style={{ color: '#666' }}>Acceptable Temp Range</span>
                  <span style={{ fontWeight: 700, color: '#16a34a' }}>{battery.normalRange.temperature.min}°C – {battery.normalRange.temperature.max}°C</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                  <span style={{ color: '#666' }}>Avg / Min / Max Voltage</span>
                  <span style={{ fontWeight: 700, color: '#1e3a5f' }}>{avgVoltage}V / {minVoltage}V / {maxVoltage}V</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                  <span style={{ color: '#666' }}>Avg / Min / Max Temp</span>
                  <span style={{ fontWeight: 700, color: '#1e3a5f' }}>{avgTemp}°C / {minTemp}°C / {maxTemp}°C</span>
                </div>
              </div>

              {/* Cell Table */}
              <table className="cell-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px', marginTop: '6px' }}>
                <thead>
                  <tr>
                    <th style={{ background: '#1e3a5f', color: 'white', padding: '5px 6px', textAlign: 'center', fontWeight: 600, fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cell #</th>
                    <th style={{ background: '#1e3a5f', color: 'white', padding: '5px 6px', textAlign: 'center', fontWeight: 600, fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Voltage (V)</th>
                    <th style={{ background: '#1e3a5f', color: 'white', padding: '5px 6px', textAlign: 'center', fontWeight: 600, fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Temp (°C)</th>
                    <th style={{ background: '#1e3a5f', color: 'white', padding: '5px 6px', textAlign: 'center', fontWeight: 600, fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Voltage Status</th>
                    <th style={{ background: '#1e3a5f', color: 'white', padding: '5px 6px', textAlign: 'center', fontWeight: 600, fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Temp Status</th>
                  </tr>
                </thead>
                <tbody>
                  {battery.cells.map((cell) => {
                    const vIn = cell.voltage >= battery.normalRange.voltage.min && cell.voltage <= battery.normalRange.voltage.max;
                    const tIn = cell.temperature >= battery.normalRange.temperature.min && cell.temperature <= battery.normalRange.temperature.max;
                    return (
                      <tr key={cell.id} style={{ background: cell.id % 2 === 0 ? '#f8fafc' : 'white' }}>
                        <td style={{ padding: '4px 6px', textAlign: 'center', borderBottom: '1px solid #e8e8e8', fontSize: '9px', fontWeight: 600 }}>Cell {cell.id}</td>
                        <td style={{ padding: '4px 6px', textAlign: 'center', borderBottom: '1px solid #e8e8e8', fontSize: '9px' }}>{cell.voltage}</td>
                        <td style={{ padding: '4px 6px', textAlign: 'center', borderBottom: '1px solid #e8e8e8', fontSize: '9px' }}>{cell.temperature}</td>
                        <td style={{ padding: '4px 6px', textAlign: 'center', borderBottom: '1px solid #e8e8e8', fontSize: '9px', fontWeight: 700, color: vIn ? '#16a34a' : '#dc2626' }}>
                          {vIn ? '✓ PASS' : '✗ FAIL'}
                        </td>
                        <td style={{ padding: '4px 6px', textAlign: 'center', borderBottom: '1px solid #e8e8e8', fontSize: '9px', fontWeight: 700, color: tIn ? '#16a34a' : '#dc2626' }}>
                          {tIn ? '✓ PASS' : '✗ FAIL'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Section 4: Thermal & MOS Analysis */}
            <div className="section" style={{ marginBottom: '12px' }}>
              <div className="section-title" style={{
                fontSize: '11px', fontWeight: 800, color: '#1e3a5f', textTransform: 'uppercase',
                letterSpacing: '1.5px', paddingBottom: '4px', borderBottom: '1.5px solid #e0e7ef', marginBottom: '8px',
              }}>
                4. Thermal &amp; Status Analysis
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 20px', fontSize: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                  <span style={{ color: '#666' }}>MOS Temperature</span>
                  <span style={{ fontWeight: 700, color: '#1e3a5f' }}>{battery.mosTemperature ?? 'N/A'}°C</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                  <span style={{ color: '#666' }}>Sum Voltage</span>
                  <span style={{ fontWeight: 700, color: '#1e3a5f' }}>{battery.sumVolt ?? battery.voltage}V</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                  <span style={{ color: '#666' }}>Status Alerts</span>
                  <span style={{ fontWeight: 700, color: (battery.statusInfo?.count ?? 0) > 0 ? '#d97706' : '#16a34a' }}>
                    {battery.statusInfo?.count ?? 0} — {battery.statusInfo?.message || 'All normal'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                  <span style={{ color: '#666' }}>Temperature Sensors</span>
                  <span style={{ fontWeight: 700, color: '#1e3a5f' }}>
                    {(battery.temperatures || []).map((t, i) => `T${i + 1}: ${t}°C`).join('  |  ')}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 5: Compliance Checklist */}
            <div className="section" style={{ marginBottom: '12px' }}>
              <div className="section-title" style={{
                fontSize: '11px', fontWeight: 800, color: '#1e3a5f', textTransform: 'uppercase',
                letterSpacing: '1.5px', paddingBottom: '4px', borderBottom: '1.5px solid #e0e7ef', marginBottom: '8px',
              }}>
                5. BIS Compliance Checklist
              </div>
              <div className="checklist" style={{ fontSize: '10px', margin: '6px 0' }}>
                {[
                  { label: 'All cell voltages within acceptable range (IS 16893)', pass: allCellsInRange },
                  { label: 'All cell temperatures within safe limits', pass: allCellsInRange },
                  { label: 'Battery health score ≥ 70%', pass: healthPass },
                  { label: 'State of Health (SoH) ≥ 60%', pass: sohPass },
                  { label: 'Pack temperature within operational limit (≤ 90°C)', pass: tempPass },
                  { label: 'MOS temperature within safe limits', pass: (battery.mosTemperature ?? 0) <= 50 },
                ].map((item, i) => (
                  <div key={i} className="checklist-item" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '3px 0' }}>
                    <span style={{ fontWeight: 700, color: item.pass ? '#16a34a' : '#dc2626', fontSize: '12px' }}>
                      {item.pass ? '☑' : '☒'}
                    </span>
                    <span>{item.label}</span>
                    <span style={{ marginLeft: 'auto', fontWeight: 700, color: item.pass ? '#16a34a' : '#dc2626', fontSize: '9px' }}>
                      {item.pass ? 'PASS' : 'FAIL'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Verdict */}
            <div className={`verdict ${overallPass ? 'pass-verdict' : 'fail-verdict'}`} style={{
              textAlign: 'center', padding: '12px', margin: '12px 0', borderRadius: '8px',
              background: overallPass ? '#f0fdf4' : '#fef2f2',
              border: `2px solid ${overallPass ? '#16a34a' : '#dc2626'}`,
            }}>
              <div className="verdict-icon" style={{ fontSize: '28px', marginBottom: '4px' }}>
                {overallPass ? '✅' : '❌'}
              </div>
              <div className="verdict-text" style={{
                fontSize: '16px', fontWeight: 800, letterSpacing: '2px',
                color: overallPass ? '#16a34a' : '#dc2626',
              }}>
                {overallPass ? 'CERTIFIED — COMPLIANT' : 'NON-COMPLIANT — CERTIFICATE DENIED'}
              </div>
              <div className="verdict-sub" style={{ fontSize: '9px', color: '#666', marginTop: '3px' }}>
                {overallPass
                  ? 'This battery meets all BIS standards for EV battery systems as per IS 16893:2018 & AIS-156'
                  : 'This battery does not meet one or more BIS compliance criteria. Corrective action required.'}
              </div>
            </div>

            {/* Footer */}
            <div className="footer" style={{
              marginTop: '15px', paddingTop: '10px', borderTop: '1.5px solid #e0e7ef',
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
            }}>
              <div className="signature-box" style={{ textAlign: 'center', width: '140px' }}>
                <div className="signature-line" style={{
                  borderTop: '1px solid #333', marginTop: '30px', paddingTop: '3px', fontSize: '8px', color: '#666',
                }}>
                  Authorized Signatory
                </div>
              </div>
              <div className="qr-placeholder" style={{
                width: '70px', height: '70px', border: '1px solid #ccc',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '7px', color: '#999', borderRadius: '4px', background: '#fafafa', textAlign: 'center',
              }}>
                QR Verification Code
              </div>
              <div className="signature-box" style={{ textAlign: 'center', width: '140px' }}>
                <div className="signature-line" style={{
                  borderTop: '1px solid #333', marginTop: '30px', paddingTop: '3px', fontSize: '8px', color: '#666',
                }}>
                  Testing Engineer
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="disclaimer" style={{ fontSize: '7px', color: '#999', textAlign: 'center', marginTop: '10px', lineHeight: 1.4 }}>
              This certificate is generated and verified by ZipBolt — Battery Verification &amp; Certification Platform by Ziptrax Technologies.
              Results are based on real-time sensor data and BIS compliance checks. For official BIS certification,
              please contact an accredited BIS testing laboratory. Certificate valid for one year from date of issue.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BISCertificate;
