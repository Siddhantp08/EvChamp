import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import { Html5Qrcode } from 'html5-qrcode';
import {
  BatteryData,
  BatteryAnalysis,
  addBattery,
  getUserBatteries,
  getBatteryAnalysis,
  getQRAnalysis,
  saveAudit,
} from '../services/batteryService';
import BISCertificate from './BISCertificate';
import { decodeQRString, validateQR, is24DigitQR, DecodedQR, QRValidation } from '../services/qrDecoder';
import { BatteryCSVUpload } from './BatteryCSVUpload';

const AdvanceAnalysis: React.FC = () => {
  const [batteries, setBatteries] = useState<BatteryData[]>([]);
  const [selectedBattery, setSelectedBattery] = useState<BatteryAnalysis | null>(null);
  const [serialInput, setSerialInput] = useState('');
  const [searchParams] = useSearchParams();
  const scanType = (searchParams.get('mode') === 'audit' ? 'audit' : 'battery') as 'audit' | 'battery';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'cells' | 'soh' | 'current' | 'health'>('cells');
  const [showAddForm, setShowAddForm] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [deviceTab, setDeviceTab] = useState<'active' | 'inactive'>('active');
  const [showScanner, setShowScanner] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const [showCertificate, setShowCertificate] = useState(false);
  const [showAuthCheck, setShowAuthCheck] = useState(false);
  const [authResult, setAuthResult] = useState<{ fields: { label: string; expected: string; entered: string; match: boolean }[]; score: number; status: string } | null>(null);
  const [authInputs, setAuthInputs] = useState({ manufacturer: '', brand: '', model: '', capacity: '', voltage: '', batchNumber: '', cellChemistry: '' });
  const [decodedQR, setDecodedQR] = useState<DecodedQR | null>(null);
  const [qrValidation, setQrValidation] = useState<QRValidation | null>(null);
  const [savingAudit, setSavingAudit] = useState(false);
  const [manualEntry, setManualEntry] = useState(false);
  const [cameraSupported, setCameraSupported] = useState(true);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const BackArrow = FaArrowLeft as React.ElementType;

  // Device detection and capability check
  const checkDeviceCapabilities = useCallback(() => {
    try {
      const isHTTPS = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
      const hasMediaDevices = !!(navigator && navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      const ua = navigator.userAgent.toLowerCase();
      const isIOS = /iphone|ipad|ipod/.test(ua);
      const isAndroid = /android/.test(ua);
      const isMobile = isIOS || isAndroid;

      console.log('📊 Device Capabilities:', {
        isHTTPS,
        hasMediaDevices,
        isIOS,
        isAndroid,
        isMobile,
        browser: ua.includes('safari') ? 'Safari' : ua.includes('chrome') ? 'Chrome' : ua.includes('firefox') ? 'Firefox' : 'Other',
      });

      if (!isHTTPS && window.location.hostname !== 'localhost') {
        console.warn('⚠️ Not using HTTPS - camera may not work');
      }

      if (!hasMediaDevices) {
        console.error('❌ Browser does not support mediaDevices API');
        setCameraSupported(false);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error checking device capabilities:', err);
      return false;
    }
  }, []);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2) { // SCANNING state
          await scannerRef.current.stop();
        }
      } catch (e) {
        // ignore stop errors
      }
      scannerRef.current = null;
    }
  }, []);

  const getOSSpecificInstructions = (): string => {
    const ua = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(ua);
    const isSafari = ua.includes('safari') && !ua.includes('chrome');
    
    if (isIOS && isSafari) {
      return '📱 **iOS (Safari):**\n1. Tap Share button (square with arrow)\n2. Tap Settings → Camera\n3. Tap Allow camera access\n4. Close & try again';
    } else if (isIOS) {
      return '📱 **iOS (Chrome/Firefox):**\n1. Settings → Safari → Camera\n2. Or: Settings → App Settings → Camera\n3. Enable camera access\n4. Close & try again';
    } else if (/android/.test(ua)) {
      return '🔧 **Android:**\n1. Settings → Apps → Permissions → Camera\n2. Or: Open browser settings → Site permissions → Camera\n3. Allow camera access\n4. Close & try again';
    }
    return '🖥️ **Desktop/Other:**\n1. Check browser bar for camera icon\n2. Click to allow camera\n3. Or: Settings → Privacy & Security → Camera\n4. Refresh page';
  };

  const testCameraPermission = async (): Promise<boolean> => {
    try {
      console.log('📸 Testing camera permission with getUserMedia...');
      
      // First, try to request camera permission directly
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });

      console.log('✅ Camera permission granted! Stream obtained:', stream);

      // Stop the test stream immediately
      stream.getTracks().forEach(track => {
        track.stop();
        console.log('🛑 Test stream track stopped');
      });

      return true;
    } catch (err: any) {
      console.error('❌ Camera permission test failed:', err);
      console.error('Error name:', err?.name);
      console.error('Error message:', err?.message);
      
      // Log permission-related errors specifically
      if (err?.name === 'NotAllowedError') {
        console.warn('⚠️ User denied camera permission');
      } else if (err?.name === 'NotFoundError') {
        console.warn('⚠️ No camera device found');
      } else if (err?.name === 'NotReadableError') {
        console.warn('⚠️ Camera is in use by another application');
      } else if (err?.name === 'SecurityError') {
        console.warn('⚠️ Security error - HTTPS required or feature blocked');
      } else if (err?.name === 'TypeError') {
        console.warn('⚠️ Browser does not support camera access');
      }
      
      return false;
    }
  };

  const startScanner = useCallback(async () => {
    setScannerError('');
    
    // Check capabilities first
    if (!checkDeviceCapabilities()) {
      setScannerError('🔴 Your device or browser does not support camera access.\n\n' + 
        'Try:\n• Using Chrome or Firefox\n• On a device with a camera\n• Using mobile instead of desktop\n\n' +
        'Or use manual entry below to enter the serial number.');
      setManualEntry(true);
      return;
    }

    // Check HTTPS
    const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
    if (!isSecure) {
      setScannerError('🔒 Camera requires HTTPS connection.\n\nThis site is using HTTP which blocks camera access.\nTry:\n• Refreshing the page\n• Using a secure HTTPS connection\n• Manual entry below');
      setManualEntry(true);
      return;
    }

    console.log('🎬 Starting scanner workflow...');
    setShowScanner(true);
    setManualEntry(false);

    // CRITICAL: Test camera permission FIRST to trigger browser prompt on mobile
    const ua = navigator.userAgent.toLowerCase();
    const isMobile = /iphone|ipad|ipod|android/.test(ua);
    
    if (isMobile) {
      console.log('📱 Mobile device detected - testing camera permission first');
      setScannerError('🔄 Requesting camera access...');
      
      const hasPermission = await testCameraPermission();
      
      if (!hasPermission) {
        console.error('❌ Camera permission test failed - user denied or camera unavailable');
        setScannerError('📱 **Camera Permission Denied or Unavailable**\n\n' + getOSSpecificInstructions() + '\n\nOr use manual entry to type the serial number.');
        setShowScanner(false);
        setManualEntry(true);
        return;
      }
      
      console.log('✅ Camera permission granted on mobile, proceeding to scanner');
      setScannerError('');
    }

    // Delay to allow DOM to render
    setTimeout(async () => {
      try {
        const readerElement = document.getElementById('qr-reader');
        if (!readerElement) {
          console.error('qr-reader element not found in DOM');
          setScannerError('❌ Scanner element not found. Try refreshing the page.');
          setShowScanner(false);
          setManualEntry(true);
          return;
        }

        console.log('✅ Starting QR scanner, element found');
        
        const html5Qrcode = new Html5Qrcode('qr-reader', {
          formatsToSupport: [0, 4, 2, 3, 7, 8, 11, 12, 13],
        } as any);
        scannerRef.current = html5Qrcode;

        console.log('📸 Html5Qrcode instance created, requesting camera access');
        
        await html5Qrcode.start(
          { facingMode: 'environment' },
          {
            fps: 15,
            qrbox: { width: 280, height: 280 },
            aspectRatio: 1.0,
          },
          (decodedText: string) => {
            const scannedValue = decodedText.trim();
            console.log('✅ QR code scanned successfully:', scannedValue.substring(0, 20) + '...');
            setShowScanner(false);
            html5Qrcode.stop().catch(() => {});
            scannerRef.current = null;

            if (is24DigitQR(scannedValue)) {
              const decoded = decodeQRString(scannedValue);
              if (decoded) {
                setDecodedQR(decoded);
                setQrValidation(validateQR(decoded));
                setSerialInput(decoded.serialNumber);
                setLoading(true);
                setError('');
                getQRAnalysis(decoded.raw, {
                  serialNumber: decoded.serialNumber,
                  manufacturer: decoded.manufacturer,
                  manufacturerCode: decoded.manufacturerCode,
                  productType: decoded.productType,
                  productTypeCode: decoded.productTypeCode,
                  chemistry: decoded.chemistry,
                  chemistryCode: decoded.chemistryCode,
                  model: decoded.model,
                  modelCode: decoded.modelCode,
                  productionLine: decoded.productionLine,
                  taskCode: decoded.taskCode,
                  factoryAddress: decoded.factoryAddress,
                  factoryAddressCode: decoded.factoryAddressCode,
                  factoryIdentifier: decoded.factoryIdentifier,
                  productionDate: decoded.productionDate,
                  productionDateRaw: decoded.productionDateRaw,
                }).then((analysis) => {
                  setSelectedBattery(analysis);
                }).catch((err) => {
                  setError(err.message || 'Failed to look up QR data.');
                }).finally(() => {
                  setLoading(false);
                });
              } else {
                setSerialInput(scannedValue);
              }
            } else {
              setDecodedQR(null);
              setQrValidation(null);
              setSerialInput(scannedValue);
            }
          },
          () => {
            // QR code not detected in this frame - ignore
          }
        );
        console.log('✅ Camera started successfully');
      } catch (err: any) {
        console.error('❌ Scanner error:', err);
        console.error('Error name:', err?.name);
        console.error('Error code:', err?.code);
        console.error('Error message:', err?.message);
        
        let errorMessage = '❌ Could not access camera.';
        let showManualFallback = true;

        switch (err?.name) {
          case 'NotAllowedError':
          case 'PermissionDeniedError':
            errorMessage = '📱 **Camera Permission Denied**\n\n' + getOSSpecificInstructions();
            break;
          case 'NotFoundError':
            errorMessage = '❌ **No Camera Found**\n\nYour device does not have a camera.\n\nUse manual entry to type the serial number.';
            break;
          case 'NotReadableError':
          case 'OverconstrainedError':
            errorMessage = '⚠️ **Camera In Use**\n\n1. Close other apps using the camera\n2. Close other browser tabs with camera\n3. Close this app/tab completely\n4. Wait 5 seconds\n5. Try again';
            break;
          case 'SecurityError':
            if (err.message?.includes('https') || err.message?.includes('HTTPS')) {
              errorMessage = '🔒 **HTTPS Required**\n\nCamera only works on secure HTTPS connections.\n\nTry:\n• Refreshing the page\n• Checking your connection\n• Using a different browser';
            } else {
              errorMessage = '🔒 **Security Blocked**\n\nYour browser blocked camera access.\n\nTry:\n• Check browser security settings\n• Refresh the page\n• Use a different browser';
            }
            break;
          default:
            if (err?.message?.includes('Permission') || err?.message?.includes('permission')) {
              errorMessage = '📱 **Camera Permission Required**\n\n' + getOSSpecificInstructions();
            } else if (err?.message?.includes('https') || err?.message?.includes('HTTPS')) {
              errorMessage = '🔒 **HTTPS Required**\n\nCamera needs a secure connection.';
            } else if (err?.message?.includes('camera') || err?.message?.includes('Camera')) {
              errorMessage = '❌ **Camera Error**\n\n' + err?.message + '\n\nTry:\n• Refreshing\n• Restarting the browser\n• Using a different browser';
            } else {
              errorMessage = '❌ **Camera Error**\n\n' + (err?.message || err?.toString()) + '\n\nUse manual entry below to continue.';
            }
        }
        
        setScannerError(errorMessage);
        setShowScanner(false);
        setManualEntry(showManualFallback);
      }
    }, 500);
  }, [checkDeviceCapabilities]);

  // Cleanup scanner on unmount
  useEffect(() => {
    // Check capabilities on mount
    checkDeviceCapabilities();
    
    return () => {
      stopScanner();
    };
  }, [stopScanner, checkDeviceCapabilities]);

  useEffect(() => {
    if (scanType === 'battery') {
      loadUserBatteries();
    } else {
      setInitialLoading(false);
    }
  }, [scanType]);

  const loadUserBatteries = async () => {
    try {
      setInitialLoading(true);
      const data = await getUserBatteries();
      setBatteries(data);
    } catch (err) {
      console.error('Failed to load batteries:', err);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleAuditFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serialInput.trim()) return;
    setLoading(true);
    setError('');

    const input = serialInput.trim();

    // Always try to decode as 24-digit QR first (handles typed/pasted QR codes)
    let decoded = decodedQR;
    if (is24DigitQR(input)) {
      const freshDecode = decodeQRString(input);
      if (freshDecode) {
        decoded = freshDecode;
        setDecodedQR(freshDecode);
        setQrValidation(validateQR(freshDecode));
      }
    }

    try {
      let analysis: BatteryAnalysis;
      if (decoded) {
        // Send full decoded QR metadata to backend for correct data
        analysis = await getQRAnalysis(decoded.raw, {
          serialNumber: decoded.serialNumber,
          manufacturer: decoded.manufacturer,
          manufacturerCode: decoded.manufacturerCode,
          productType: decoded.productType,
          productTypeCode: decoded.productTypeCode,
          chemistry: decoded.chemistry,
          chemistryCode: decoded.chemistryCode,
          model: decoded.model,
          modelCode: decoded.modelCode,
          productionLine: decoded.productionLine,
          taskCode: decoded.taskCode,
          factoryAddress: decoded.factoryAddress,
          factoryAddressCode: decoded.factoryAddressCode,
          factoryIdentifier: decoded.factoryIdentifier,
          productionDate: decoded.productionDate,
          productionDateRaw: decoded.productionDateRaw,
        });
      } else {
        analysis = await getBatteryAnalysis(input);
      }
      setSelectedBattery(analysis);
    } catch (err: any) {
      setError(err.message || 'Battery not found. Check the serial number.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBattery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serialInput.trim()) return;

    // Both scan types fetch battery details from the serial number
    setLoading(true);
    setError('');

    try {
      const result = await addBattery(serialInput.trim(), 'default', scanType);
      setBatteries((prev) => {
        const exists = prev.find((b) => b.serialNumber === result.battery.serialNumber);
        if (exists) return prev;
        return [...prev, result.battery];
      });
      setSerialInput('');
      setShowAddForm(false);
      // Auto-select the newly added battery
      handleSelectBattery(result.battery.serialNumber);
    } catch (err: any) {
      setError(err.message || 'Failed to add battery. Check the serial number.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBattery = async (serialNumber: string) => {
    setLoading(true);
    setError('');
    try {
      const analysis = await getBatteryAnalysis(serialNumber);
      setSelectedBattery(analysis);
    } catch (err: any) {
      setError(err.message || 'Failed to load analysis');
    } finally {
      setLoading(false);
    }
  };

  const getVoltageColor = (voltage: number, min: number, max: number) => {
    const ratio = (voltage - min) / (max - min);
    if (ratio < 0.3) return 'bg-blue-300';
    if (ratio < 0.7) return 'bg-blue-400';
    return 'bg-blue-600';
  };

  const getVoltageTextColor = (voltage: number, min: number, max: number) => {
    const ratio = (voltage - min) / (max - min);
    if (ratio >= 0.7) return 'text-white';
    return 'text-gray-800';
  };

  const getTempColor = (temp: number, min: number, max: number) => {
    const ratio = (temp - min) / (max - min);
    if (ratio < 0.3) return 'bg-green-400';
    if (ratio < 0.7) return 'bg-yellow-400';
    return 'bg-orange-400';
  };

  // ============ AUTHENTICITY CHECK LOGIC ============
  const runAuthenticityCheck = () => {
    if (!selectedBattery) return;
    const normalize = (v: string) => v.trim().toLowerCase().replace(/\s+/g, ' ');
    const fields: { label: string; expected: string; entered: string; match: boolean }[] = [];

    const checks: { label: string; expected: string; entered: string }[] = [
      { label: 'Manufacturer', expected: selectedBattery.manufacturer || '', entered: authInputs.manufacturer },
      { label: 'Brand', expected: selectedBattery.brand || '', entered: authInputs.brand },
      { label: 'Model', expected: selectedBattery.model || '', entered: authInputs.model },
      { label: 'Capacity (Ah)', expected: String(selectedBattery.capacity || ''), entered: authInputs.capacity },
      { label: 'Voltage (V)', expected: String(selectedBattery.voltage || ''), entered: authInputs.voltage },
      { label: 'Batch Number', expected: selectedBattery.batchNumber || '', entered: authInputs.batchNumber },
      { label: 'Cell Chemistry', expected: selectedBattery.cellChemistry || '', entered: authInputs.cellChemistry },
    ];

    let matched = 0;
    let total = 0;
    for (const c of checks) {
      if (!c.entered.trim()) continue; // skip empty fields
      total++;
      const isMatch = normalize(c.expected).includes(normalize(c.entered)) || normalize(c.entered).includes(normalize(c.expected));
      if (isMatch) matched++;
      fields.push({ label: c.label, expected: c.expected || 'N/A', entered: c.entered, match: isMatch });
    }

    // Serial pattern check (always counted)
    const serialPattern = /^[A-Z0-9]{6,}$/i;
    const serialValid = serialPattern.test(selectedBattery.serialNumber);
    fields.push({ label: 'Serial Pattern', expected: selectedBattery.serialNumber, entered: serialValid ? 'VALID FORMAT' : 'INVALID', match: serialValid });
    if (serialValid) matched++;
    total++;

    const score = total > 0 ? Math.round((matched / total) * 100) : 0;
    const status = score >= 80 ? 'LIKELY GENUINE' : score >= 50 ? 'SUSPICIOUS' : 'LIKELY COUNTERFEIT';
    setAuthResult({ fields, score, status });
  };

  // ============ CELL AUDIT MODE ============
  if (scanType === 'audit') {
    // ---------- AUDIT RESULTS PAGE (separate view) ----------
    if (selectedBattery && !loading) {
      return (
        <>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
          <div className="max-w-3xl mx-auto px-4 py-8">
            {/* Back / Scan Another */}
            <button
              onClick={() => { setSelectedBattery(null); setSerialInput(''); setError(''); setShowAuthCheck(false); setAuthResult(null); setDecodedQR(null); setQrValidation(null); setAuthInputs({ manufacturer: '', brand: '', model: '', capacity: '', voltage: '', batchNumber: '', cellChemistry: '' }); }}
              className="inline-flex items-center text-gray-600 hover:text-blue-600 transition-colors mb-6 font-semibold"
            >
              <BackArrow className="mr-2" />
              Scan Another Cell
            </button>

            {/* Success Banner */}
            <div className="mb-6 p-4 rounded-xl border-2 border-emerald-400 bg-emerald-50 flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-emerald-500 text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-sm text-emerald-700">Cell Data Retrieved</p>
                <p className="text-xs text-gray-500">Serial: <span className="font-mono font-bold">{selectedBattery.serialNumber}</span></p>
              </div>
            </div>

            {/* Battery Identification Card */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
              <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">Cell Identification</h3>
                    <p className="text-white/60 text-xs">Serial: {selectedBattery.serialNumber}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {/* Manufacturer Info */}
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Manufacturer Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-[10px] text-gray-400 uppercase font-semibold mb-1">Manufacturer</p>
                      <p className="text-sm font-bold text-gray-800">{selectedBattery.manufacturer || 'N/A'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-[10px] text-gray-400 uppercase font-semibold mb-1">Manufacturer Code</p>
                      <p className="text-sm font-bold text-gray-800">{selectedBattery.manufacturerCode || 'N/A'}</p>
                    </div>
                    {selectedBattery.model && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-[10px] text-gray-400 uppercase font-semibold mb-1">Model</p>
                      <p className="text-sm font-bold text-gray-800">{selectedBattery.model}</p>
                    </div>
                    )}
                    {selectedBattery.cellType && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-[10px] text-gray-400 uppercase font-semibold mb-1">Cell Type</p>
                      <p className="text-sm font-bold text-gray-800">{selectedBattery.cellType}</p>
                    </div>
                    )}
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-[10px] text-gray-400 uppercase font-semibold mb-1">Country of Origin</p>
                      <p className="text-sm font-bold text-gray-800 flex items-center">
                        <span className="mr-1">🌍</span> {selectedBattery.countryOfOrigin || 'N/A'}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-[10px] text-gray-400 uppercase font-semibold mb-1">Plant Location</p>
                      <p className="text-sm font-bold text-gray-800">{selectedBattery.plantLocation || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Production Info */}
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Production Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                      <p className="text-[10px] text-blue-400 uppercase font-semibold mb-1">Production Date</p>
                      <p className="text-sm font-bold text-blue-800">
                        {selectedBattery.productionDate
                          ? new Date(selectedBattery.productionDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
                          : 'N/A'}
                      </p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                      <p className="text-[10px] text-blue-400 uppercase font-semibold mb-1">Batch / Lot Number</p>
                      <p className="text-sm font-bold text-blue-800">{selectedBattery.batchNumber || 'N/A'}</p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                      <p className="text-[10px] text-blue-400 uppercase font-semibold mb-1">Warranty Expiry</p>
                      <p className="text-sm font-bold text-blue-800">
                        {selectedBattery.warrantyExpiry
                          ? new Date(selectedBattery.warrantyExpiry).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
                          : 'N/A'}
                      </p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                      <p className="text-[10px] text-blue-400 uppercase font-semibold mb-1">Brand</p>
                      <p className="text-sm font-bold text-blue-800">{selectedBattery.brand || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Technical Specs */}
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Technical Specifications</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100 text-center">
                      <p className="text-[10px] text-emerald-500 uppercase font-semibold mb-1">Cell Chemistry</p>
                      <p className="text-xs font-bold text-emerald-800">{selectedBattery.cellChemistry || 'N/A'}</p>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100 text-center">
                      <p className="text-[10px] text-emerald-500 uppercase font-semibold mb-1">Nominal Voltage</p>
                      <p className="text-xs font-bold text-emerald-800">{selectedBattery.nominalVoltage || `${selectedBattery.voltage}V`}</p>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100 text-center">
                      <p className="text-[10px] text-emerald-500 uppercase font-semibold mb-1">Capacity</p>
                      <p className="text-xs font-bold text-emerald-800">{selectedBattery.capacity} Ah</p>
                    </div>
                    {selectedBattery.energyCapacity && (
                    <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100 text-center">
                      <p className="text-[10px] text-emerald-500 uppercase font-semibold mb-1">Energy</p>
                      <p className="text-xs font-bold text-emerald-800">{selectedBattery.energyCapacity}</p>
                    </div>
                    )}
                    <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100 text-center">
                      <p className="text-[10px] text-emerald-500 uppercase font-semibold mb-1">Max Voltage</p>
                      <p className="text-xs font-bold text-emerald-800">{selectedBattery.maxVoltage || 'N/A'}</p>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100 text-center">
                      <p className="text-[10px] text-emerald-500 uppercase font-semibold mb-1">Min Voltage</p>
                      <p className="text-xs font-bold text-emerald-800">{selectedBattery.minVoltage || 'N/A'}</p>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100 text-center">
                      <p className="text-[10px] text-emerald-500 uppercase font-semibold mb-1">Weight</p>
                      <p className="text-xs font-bold text-emerald-800">{selectedBattery.weight || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 mt-3">
                    <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100 text-center">
                      <p className="text-[10px] text-emerald-500 uppercase font-semibold mb-1">Dimensions (L x W x H)</p>
                      <p className="text-xs font-bold text-emerald-800">{selectedBattery.dimensions || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Certifications */}
                {selectedBattery.certifications && selectedBattery.certifications.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Certifications</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedBattery.certifications.map((cert, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center bg-amber-50 border border-amber-200 rounded-full px-3 py-1.5 text-xs font-bold text-amber-800"
                        >
                          <svg className="w-3.5 h-3.5 mr-1.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          {cert}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ============ QR DECODED DATA CARD ============ */}
            {decodedQR && qrValidation && (
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
                <div className={`px-6 py-4 ${
                  qrValidation.authenticity_score >= 80
                    ? 'bg-gradient-to-r from-emerald-600 to-green-600'
                    : qrValidation.authenticity_score >= 50
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500'
                    : 'bg-gradient-to-r from-red-600 to-rose-600'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-lg">QR Decoded Identity</h3>
                        <p className="text-white/70 text-xs">24-digit encoded cell identity</p>
                      </div>
                    </div>
                    <div className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                      qrValidation.authenticity_score >= 80
                        ? 'bg-white/20 text-white'
                        : qrValidation.authenticity_score >= 50
                        ? 'bg-white/20 text-white'
                        : 'bg-white/20 text-white'
                    }`}>
                      {qrValidation.status}
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  {/* QR Score */}
                  <div className="text-center">
                    <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full border-4 ${
                      qrValidation.authenticity_score >= 80
                        ? 'border-emerald-400 bg-emerald-50'
                        : qrValidation.authenticity_score >= 50
                        ? 'border-amber-400 bg-amber-50'
                        : 'border-red-400 bg-red-50'
                    }`}>
                      <div>
                        <p className={`text-2xl font-black ${
                          qrValidation.authenticity_score >= 80
                            ? 'text-emerald-600'
                            : qrValidation.authenticity_score >= 50
                            ? 'text-amber-600'
                            : 'text-red-600'
                        }`}>{qrValidation.authenticity_score}%</p>
                        <p className="text-[8px] text-gray-500 uppercase font-bold">QR Score</p>
                      </div>
                    </div>
                  </div>

                  {/* Raw QR String */}
                  <div className="bg-gray-900 rounded-xl p-4">
                    <p className="text-[10px] text-gray-400 uppercase font-semibold mb-2">Raw QR String</p>
                    <p className="text-sm font-mono text-green-400 tracking-widest break-all">{decodedQR.raw}</p>
                  </div>

                  {/* Decoded Fields */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Decoded Segments</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                        <p className="text-[10px] text-blue-400 uppercase font-semibold mb-1">D1-D3 · Vendor Code</p>
                        <p className="text-sm font-bold text-blue-800">{decodedQR.manufacturer}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Code: {decodedQR.manufacturerCode}</p>
                      </div>
                      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                        <p className="text-[10px] text-blue-400 uppercase font-semibold mb-1">D4 · Production Type</p>
                        <p className="text-sm font-bold text-blue-800">{decodedQR.productType}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Code: {decodedQR.productTypeCode}</p>
                      </div>
                      <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                        <p className="text-[10px] text-purple-400 uppercase font-semibold mb-1">D5 · Cell Type</p>
                        <p className="text-sm font-bold text-purple-800">{decodedQR.chemistry}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Code: {decodedQR.chemistryCode}</p>
                      </div>
                      <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                        <p className="text-[10px] text-purple-400 uppercase font-semibold mb-1">D6-D7 · Model Code</p>
                        <p className="text-sm font-bold text-purple-800">{decodedQR.model}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Code: {decodedQR.modelCode}</p>
                      </div>
                      <div className="bg-pink-50 rounded-xl p-4 border border-pink-100">
                        <p className="text-[10px] text-pink-400 uppercase font-semibold mb-1">D8-D9 · Production Line</p>
                        <p className="text-sm font-bold text-pink-800 font-mono">{decodedQR.productionLine}</p>
                      </div>
                      <div className="bg-pink-50 rounded-xl p-4 border border-pink-100">
                        <p className="text-[10px] text-pink-400 uppercase font-semibold mb-1">D10-D11 · Task Code</p>
                        <p className="text-sm font-bold text-pink-800 font-mono">{decodedQR.taskCode}</p>
                      </div>
                      <div className="bg-teal-50 rounded-xl p-4 border border-teal-100">
                        <p className="text-[10px] text-teal-400 uppercase font-semibold mb-1">D12-D13 · Factory</p>
                        <p className="text-sm font-bold text-teal-800">{decodedQR.factoryAddress}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Code: {decodedQR.factoryAddressCode} · ID: {decodedQR.factoryIdentifier}</p>
                      </div>
                      <div className="bg-teal-50 rounded-xl p-4 border border-teal-100">
                        <p className="text-[10px] text-teal-400 uppercase font-semibold mb-1">D15-D17 · Production Date</p>
                        <p className="text-sm font-bold text-teal-800">{decodedQR.productionDate}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Encoded: {decodedQR.productionDateRaw}</p>
                      </div>
                      <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 col-span-2">
                        <p className="text-[10px] text-amber-500 uppercase font-semibold mb-1">D18-D24 · Product Serial No.</p>
                        <p className="text-lg font-black text-amber-800 font-mono tracking-wider">{decodedQR.serialNumber}</p>
                      </div>
                    </div>
                  </div>

                  {/* Validation Checks */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Validation Checks</h4>
                    <div className="space-y-2">
                      {qrValidation.checks.map((check, i) => (
                        <div key={i} className={`flex items-center justify-between p-3 rounded-xl border ${
                          check.pass ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
                        }`}>
                          <div className="flex items-center space-x-2">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              check.pass ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                            }`}>
                              {check.pass ? '✓' : '✗'}
                            </span>
                            <p className="text-sm font-semibold text-gray-700">{check.label}</p>
                          </div>
                          <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                            check.pass ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {check.pass ? 'PASS' : 'FAIL'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Warnings */}
                  {qrValidation.warnings.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <p className="text-xs font-bold text-amber-700 uppercase mb-2">⚠ Warnings</p>
                      <ul className="space-y-1">
                        {qrValidation.warnings.map((w, i) => (
                          <li key={i} className="text-xs text-amber-800 flex items-start space-x-2">
                            <span className="text-amber-500 mt-0.5">•</span>
                            <span>{w}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ============ BATTERY AUTHENTICITY CHECK ============ */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4 cursor-pointer"
                onClick={() => {
                  const opening = !showAuthCheck;
                  setShowAuthCheck(opening);
                  setAuthResult(null);
                  if (opening && decodedQR) {
                    setAuthInputs(prev => ({
                      ...prev,
                      manufacturer: prev.manufacturer || decodedQR.manufacturer,
                      cellChemistry: prev.cellChemistry || decodedQR.chemistry,
                    }));
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">Battery Authenticity Check</h3>
                      <p className="text-white/70 text-xs">Enter printed label details to verify genuineness</p>
                    </div>
                  </div>
                  <svg className={`w-5 h-5 text-white transition-transform ${showAuthCheck ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {showAuthCheck && (
                <div className="p-6">
                  <p className="text-sm text-gray-600 mb-4 bg-amber-50 rounded-lg px-4 py-3 border border-amber-200">
                    🔍 Enter the details <strong>printed on the physical battery label</strong>. We'll compare them with the QR/database data to check authenticity. Fill as many fields as you can read from the label.
                  </p>

                  {/* Input fields */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-[10px] text-gray-500 uppercase font-semibold mb-1">Manufacturer</label>
                      <input type="text" value={authInputs.manufacturer} onChange={(e) => setAuthInputs(p => ({ ...p, manufacturer: e.target.value }))}
                        placeholder="e.g. EVE Power Co. Ltd" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-amber-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 uppercase font-semibold mb-1">Brand</label>
                      <input type="text" value={authInputs.brand} onChange={(e) => setAuthInputs(p => ({ ...p, brand: e.target.value }))}
                        placeholder="e.g. EVE" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-amber-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 uppercase font-semibold mb-1">Model</label>
                      <input type="text" value={authInputs.model} onChange={(e) => setAuthInputs(p => ({ ...p, model: e.target.value }))}
                        placeholder="e.g. MB31" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-amber-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 uppercase font-semibold mb-1">Capacity (Ah)</label>
                      <input type="text" value={authInputs.capacity} onChange={(e) => setAuthInputs(p => ({ ...p, capacity: e.target.value }))}
                        placeholder="e.g. 314" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-amber-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 uppercase font-semibold mb-1">Voltage (V)</label>
                      <input type="text" value={authInputs.voltage} onChange={(e) => setAuthInputs(p => ({ ...p, voltage: e.target.value }))}
                        placeholder="e.g. 3.2" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-amber-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 uppercase font-semibold mb-1">Batch / Lot Number</label>
                      <input type="text" value={authInputs.batchNumber} onChange={(e) => setAuthInputs(p => ({ ...p, batchNumber: e.target.value }))}
                        placeholder="e.g. LOT-2025-A1" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-amber-500 focus:outline-none" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] text-gray-500 uppercase font-semibold mb-1">Cell Chemistry</label>
                      <input type="text" value={authInputs.cellChemistry} onChange={(e) => setAuthInputs(p => ({ ...p, cellChemistry: e.target.value }))}
                        placeholder="e.g. LiFePO4, NMC, LFP" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-amber-500 focus:outline-none" />
                    </div>
                  </div>

                  <button
                    onClick={runAuthenticityCheck}
                    disabled={!Object.values(authInputs).some(v => v.trim())}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-3 rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span>Verify Authenticity</span>
                  </button>

                  {/* ---- RESULT ---- */}
                  {authResult && (
                    <div className="mt-6">
                      {/* Score Circle */}
                      <div className="text-center mb-5">
                        <div className={`inline-flex items-center justify-center w-28 h-28 rounded-full border-4 ${
                          authResult.score >= 80 ? 'border-emerald-400 bg-emerald-50' : authResult.score >= 50 ? 'border-amber-400 bg-amber-50' : 'border-red-400 bg-red-50'
                        }`}>
                          <div>
                            <p className={`text-3xl font-black ${
                              authResult.score >= 80 ? 'text-emerald-600' : authResult.score >= 50 ? 'text-amber-600' : 'text-red-600'
                            }`}>{authResult.score}%</p>
                            <p className="text-[9px] text-gray-500 uppercase font-semibold">Authenticity</p>
                          </div>
                        </div>
                        <p className={`mt-2 text-sm font-bold ${
                          authResult.score >= 80 ? 'text-emerald-600' : authResult.score >= 50 ? 'text-amber-600' : 'text-red-600'
                        }`}>
                          {authResult.status}
                        </p>
                      </div>

                      {/* Field-by-field results */}
                      <div className="space-y-2">
                        {authResult.fields.map((f, i) => (
                          <div key={i} className={`flex items-center justify-between p-3 rounded-xl border ${
                            f.match ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
                          }`}>
                            <div>
                              <p className="text-xs text-gray-500 font-semibold">{f.label}</p>
                              <p className="text-sm font-bold text-gray-800">
                                {f.label === 'Serial Pattern' ? f.expected : `"${f.entered}"`}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                                f.match ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                              }`}>
                                {f.match ? '✓ MATCH' : '✗ MISMATCH'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Verdict info */}
                      <div className={`mt-4 p-4 rounded-xl border-2 text-center ${
                        authResult.score >= 80 ? 'border-emerald-400 bg-emerald-50' : authResult.score >= 50 ? 'border-amber-400 bg-amber-50' : 'border-red-400 bg-red-50'
                      }`}>
                        <p className="text-xs text-gray-500 mb-1">
                          {authResult.score >= 80
                            ? 'All entered details match the registered data. This cell appears to be genuine.'
                            : authResult.score >= 50
                            ? 'Some details do not match. Verify the printed label carefully or contact the manufacturer.'
                            : 'Multiple mismatches detected. This cell may be counterfeit. Do not use without further verification.'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Verify on BIS Portal */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl shadow-lg p-6 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                    <span className="text-2xl">🔍</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-lg">Verify on BIS Portal</h4>
                    <p className="text-sm text-gray-500">Cross-verify cell details on crsbis.in</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    window.open('https://www.crsbis.in/BIS/Lims_registrationc.do?hmode=getLimsData', '_blank', 'noopener,noreferrer');
                  }}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg transform hover:scale-105 flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  <span>Verify on BIS</span>
                </button>
              </div>
            </div>

            {/* Generate ZipBolt Certificate */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl shadow-lg p-6 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                    <span className="text-2xl">📜</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-lg">ZipBolt Certificate</h4>
                    <p className="text-sm text-gray-500">Cell Audit &amp; Analysis Report</p>
                  </div>
                </div>
                <button
                  disabled={savingAudit}
                  onClick={async () => {
                    if (!selectedBattery) return;
                    setSavingAudit(true);
                    try {
                      const auditId = `AUD-${selectedBattery.serialNumber}-${Date.now().toString(36).toUpperCase()}`;
                      const certNumber = `ZB/EV/${selectedBattery.serialNumber}/${Date.now().toString(36).toUpperCase()}`;
                      await saveAudit({
                        auditId,
                        qrRaw: decodedQR?.raw,
                        serialNumber: selectedBattery.serialNumber,
                        manufacturer: selectedBattery.manufacturer,
                        manufacturerCode: selectedBattery.manufacturerCode,
                        model: selectedBattery.model,
                        modelCode: decodedQR?.modelCode,
                        chemistry: selectedBattery.cellChemistry,
                        chemistryCode: decodedQR?.chemistryCode,
                        productionType: decodedQR?.productType,
                        productionLine: decodedQR?.productionLine,
                        taskCode: decodedQR?.taskCode,
                        factoryAddress: decodedQR?.factoryAddress,
                        factoryIdentifier: decodedQR?.factoryIdentifier,
                        productionDate: selectedBattery.productionDate,
                        capacity: String(selectedBattery.capacity),
                        voltage: String(selectedBattery.voltage),
                        countryOfOrigin: selectedBattery.countryOfOrigin,
                        qrAuthenticityScore: qrValidation?.authenticity_score,
                        qrValidationStatus: qrValidation?.status,
                        authCheckScore: authResult?.score,
                        authCheckStatus: authResult?.status,
                        authCheckDetails: authResult ? { fields: authResult.fields } : undefined,
                        certificateNumber: certNumber,
                        certificateGenerated: true,
                        cellData: {
                          cells: selectedBattery.cells,
                          soh: selectedBattery.soh,
                          health: selectedBattery.health,
                          temperature: selectedBattery.temperature,
                          current: selectedBattery.current,
                          charge: selectedBattery.charge,
                          cycles: selectedBattery.cycles,
                        },
                      });
                      console.log('✅ Audit saved to Neon DB:', auditId);
                    } catch (err) {
                      console.error('Failed to save audit:', err);
                    } finally {
                      setSavingAudit(false);
                      setShowCertificate(true);
                    }
                  }}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg transform hover:scale-105 flex items-center space-x-2 disabled:opacity-50"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>{savingAudit ? 'Saving...' : 'Generate Certificate'}</span>
                </button>
              </div>
            </div>

            {/* Scan Another Cell Button */}
            <div className="text-center">
              <button
                onClick={() => { setSelectedBattery(null); setSerialInput(''); setError(''); setShowAuthCheck(false); setAuthResult(null); setDecodedQR(null); setQrValidation(null); setAuthInputs({ manufacturer: '', brand: '', model: '', capacity: '', voltage: '', batchNumber: '', cellChemistry: '' }); }}
                className="inline-flex items-center bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-6 py-3 rounded-xl transition-colors space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Scan Another Cell</span>
              </button>
            </div>
          </div>
        </div>

        {/* BIS Certificate Modal */}
        {showCertificate && (
          <BISCertificate
            battery={selectedBattery}
            onClose={() => setShowCertificate(false)}
          />
        )}
        </>
      );
    }

    // ---------- AUDIT SCAN PAGE ----------
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="max-w-3xl mx-auto px-4 py-8">
          {/* Back Button */}
          <Link
            to="/zipbattery"
            className="inline-flex items-center text-gray-600 hover:text-blue-600 transition-colors mb-6 font-semibold"
          >
            <BackArrow className="mr-2" />
            Back to ZipBattery
          </Link>

          {/* Mode Header */}
          <div className="mb-6 p-4 rounded-xl border-2 border-blue-500 bg-blue-50 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-500 text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-sm text-blue-700">Cell Audit Mode</p>
              <p className="text-xs text-gray-500">Scan or enter a serial number to fetch cell identification details</p>
            </div>
          </div>

          {/* Camera Not Supported Warning */}
          {!cameraSupported && (
            <div className="mb-6 p-4 rounded-xl border-2 border-orange-400 bg-orange-50">
              <p className="text-sm font-semibold text-orange-800">
                ⚠️ Camera not available on this device/browser
              </p>
              <p className="text-xs text-gray-600 mt-2">
                You can still use manual entry below to analyze batteries.
              </p>
            </div>
          )}

          {/* Scan / Serial Input Form */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <form onSubmit={handleAuditFetch} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Enter Serial Number:
                </label>
                <p className="text-xs text-blue-600 mb-2 bg-blue-50 rounded-lg px-3 py-2">
                  ℹ️ Cell details will be fetched &amp; you can verify on the <strong>BIS Portal</strong>
                </p>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={serialInput}
                    onChange={(e) => setSerialInput(e.target.value)}
                    placeholder="e.g. FAP0002507, E7T0008943"
                    className="flex-1 border-2 border-gray-200 rounded-lg px-4 py-3 text-gray-800 focus:border-blue-500 focus:outline-none transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={loading || !serialInput.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? '...' : 'FETCH'}
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center my-4">
                <div className="flex-1 h-px bg-gray-200"></div>
                <span className="px-4 text-gray-400 text-sm font-medium">Or,</span>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>

              {/* QR Scanner */}
              <div className="text-center">
                <p className="font-semibold text-gray-700 mb-4">Scan QR Code</p>
                {!showScanner ? (
                  <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl p-6 mb-3 relative">
                    <div className="w-40 h-40 mx-auto relative bg-white rounded-lg shadow-inner overflow-hidden">
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl"></div>
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr"></div>
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl"></div>
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br"></div>
                      <div className="flex items-center justify-center h-full">
                        <svg className="w-16 h-16 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zm8-2v8h8V3h-8zm6 6h-4V5h4v4zM3 21h8v-8H3v8zm2-6h4v4H5v-4zm13-2h-2v2h2v-2zm0 4h-2v2h2v-2zm-4-4h-2v2h2v-2zm2 2h-2v2h2v-2zm2 2h-2v2h2v-2zm0-4h-2v2h2v-2zm-4 4h-2v2h2v-2z" />
                        </svg>
                      </div>
                      <div className="absolute left-2 right-2 h-0.5 bg-blue-500 opacity-75 animate-bounce" style={{ top: '50%' }}></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-3">Point camera at QR code on battery cell</p>
                    <button
                      type="button"
                      className="mt-3 bg-blue-500 text-white font-semibold px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors inline-flex items-center space-x-2"
                      onClick={startScanner}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>Open Scanner</span>
                    </button>
                  </div>
                ) : (
                  <div className="bg-black rounded-xl p-3 sm:p-4 mb-3 relative w-full">
                    <div id="qr-reader" className="w-full h-72 sm:h-80 rounded-lg overflow-hidden bg-gray-900 flex items-center justify-center"></div>
                    {scannerError ? (
                      <div>
                        <div className="bg-red-600 text-white text-xs sm:text-sm rounded-lg p-3 mt-3 whitespace-pre-line font-semibold">
                          {scannerError}
                        </div>
                        {manualEntry && (
                          <div className="mt-4 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
                            <p className="text-sm font-semibold text-gray-700 mb-3">💡 Alternative: Type Serial Number</p>
                            <div className="flex space-x-2">
                              <input
                                type="text"
                                placeholder="Enter serial number manually..."
                                value={serialInput}
                                onChange={(e) => setSerialInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && serialInput.trim()) {
                                    stopScanner();
                                    setShowScanner(false);
                                    setScannerError('');
                                    handleAuditFetch(e as any);
                                  }
                                }}
                                className="flex-1 border-2 border-yellow-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  stopScanner();
                                  setShowScanner(false);
                                  setScannerError('');
                                  if (serialInput.trim()) {
                                    handleAuditFetch({ preventDefault: () => {} } as any);
                                  }
                                }}
                                className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors"
                              >
                                Submit
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-300 text-xs mt-3">Point your camera at a QR code or barcode</p>
                    )}
                    <button
                      type="button"
                      className="mt-3 bg-red-500 text-white font-semibold px-4 sm:px-6 py-2 rounded-lg hover:bg-red-600 transition-colors inline-flex items-center space-x-2 text-sm sm:text-base w-full sm:w-auto justify-center"
                      onClick={() => {
                        stopScanner();
                        setShowScanner(false);
                        setScannerError('');
                      }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>Close Scanner</span>
                    </button>
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                  {error}
                </div>
              )}
            </form>
          </div>

          {/* Loading */}
          {loading && (
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center mb-6">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"></div>
              <p className="text-gray-500">Fetching cell details...</p>
            </div>
          )}


        </div>
      </div>
    );
  }

  // ============ BATTERY SCANNER MODE ============
  // Empty state - no batteries added → Show Battery Prediction Form
  if (!initialLoading && batteries.length === 0 && !showAddForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Back Button */}
          <Link
            to="/zipbattery"
            className="inline-flex items-center text-gray-600 hover:text-blue-600 transition-colors mb-8 font-semibold"
          >
            <BackArrow className="mr-2" />
            Back to ZipBattery
          </Link>

          {/* CSV Upload Section */}
          <BatteryCSVUpload 
            onResults={(results) => {
              console.log('CSV RUL predictions:', results);
            }}
          />
        </div>
      </div>
    );
  }

  // Add Battery Form
  if (showAddForm || (!initialLoading && batteries.length === 0)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="max-w-lg mx-auto px-4 py-8">
          {/* Back Button */}
          <button
            onClick={() => {
              if (batteries.length > 0) {
                setShowAddForm(false);
              }
            }}
            className="inline-flex items-center text-gray-600 hover:text-blue-600 transition-colors mb-8 font-semibold"
          >
            <BackArrow className="mr-2" />
            {batteries.length > 0 ? 'Back to My Devices' : ''}
          </button>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              Add a Battery
            </h2>

            {/* Mode indicator */}
            <div className="mb-6 p-4 rounded-xl border-2 border-green-500 bg-green-50 flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-500 text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-sm text-green-700">Battery Scanner Mode</p>
                <p className="text-xs text-gray-500">Full battery pack scan</p>
              </div>
            </div>

            <form onSubmit={handleAddBattery} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Enter Serial Number:
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={serialInput}
                    onChange={(e) => setSerialInput(e.target.value)}
                    placeholder="e.g. SN-001, E7T0008943"
                    className="flex-1 border-2 border-gray-200 rounded-lg px-4 py-3 text-gray-800 focus:border-blue-500 focus:outline-none transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={loading || !serialInput.trim()}
                    className="text-white font-bold px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-blue-500 hover:bg-blue-600"
                  >
                    {loading ? '...' : 'ADD'}
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center my-4">
                <div className="flex-1 h-px bg-gray-200"></div>
                <span className="px-4 text-gray-400 text-sm font-medium">Or,</span>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>

              {/* QR Scanner Section */}
              <div className="text-center">
                <p className="font-semibold text-gray-700 mb-4">Scan QR Code</p>

                {!showScanner ? (
                  <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl p-6 mb-3 relative">
                    {/* Scanner Viewfinder Placeholder */}
                    <div className="w-40 h-40 mx-auto relative bg-white rounded-lg shadow-inner overflow-hidden">
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl"></div>
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr"></div>
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl"></div>
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br"></div>
                      <div className="flex items-center justify-center h-full">
                        <svg className="w-16 h-16 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zm8-2v8h8V3h-8zm6 6h-4V5h4v4zM3 21h8v-8H3v8zm2-6h4v4H5v-4zm13-2h-2v2h2v-2zm0 4h-2v2h2v-2zm-4-4h-2v2h2v-2zm2 2h-2v2h2v-2zm2 2h-2v2h2v-2zm0-4h-2v2h2v-2zm-4 4h-2v2h2v-2z" />
                        </svg>
                      </div>
                      <div className="absolute left-2 right-2 h-0.5 bg-blue-500 opacity-75 animate-bounce" style={{ top: '50%' }}></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-3">Point camera at QR code on battery</p>
                    <button
                      type="button"
                      className="mt-3 bg-blue-500 text-white font-semibold px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors inline-flex items-center space-x-2"
                      onClick={startScanner}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>Open Scanner</span>
                    </button>
                  </div>
                ) : (
                  <div className="bg-black rounded-xl p-3 sm:p-4 mb-3 relative w-full">
                    {/* Live Camera Scanner */}
                    <div id="qr-reader" className="w-full h-72 sm:h-80 rounded-lg overflow-hidden bg-gray-900 flex items-center justify-center"></div>
                    {scannerError && (
                      <div className="bg-red-600 text-white text-xs sm:text-sm rounded-lg p-3 mt-3 whitespace-pre-line font-semibold">
                        {scannerError}
                      </div>
                    )}
                    <p className="text-gray-300 text-xs mt-3">Point your camera at a QR code or barcode</p>
                    <button
                      type="button"
                      className="mt-3 bg-red-500 text-white font-semibold px-4 sm:px-6 py-2 rounded-lg hover:bg-red-600 transition-colors inline-flex items-center space-x-2 text-sm sm:text-base w-full sm:w-auto justify-center"
                      onClick={() => {
                        stopScanner();
                        setShowScanner(false);
                        setScannerError('');
                      }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>Close Scanner</span>
                    </button>
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                  {error}
                </div>
              )}

              <div className="text-center pt-4">
                <p className="text-gray-500 text-sm mb-4">Available demo serial numbers:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {['SN-001', 'SN-002', 'SN-003', 'SN-004', 'SN-005', 'SN-006'].map((sn) => (
                    <button
                      key={sn}
                      type="button"
                      onClick={() => setSerialInput(sn)}
                      className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm hover:bg-blue-100 hover:text-blue-700 transition-colors"
                    >
                      {sn}
                    </button>
                  ))}
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Battery list + Analysis view
  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Link
          to="/zipbattery"
          className="inline-flex items-center text-gray-600 hover:text-blue-600 transition-colors mb-6 font-semibold"
        >
          <BackArrow className="mr-2" />
          Back to ZipBattery
        </Link>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Battery List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-400 to-blue-500 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-white text-lg">☰</span>
                    <h3 className="text-white font-bold text-lg">My Device</h3>
                  </div>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-xl font-bold hover:bg-green-600 transition-colors shadow-lg"
                  >
                    +
                  </button>
                </div>
                {/* Active / Inactive Tabs */}
                <div className="flex space-x-1 bg-white/10 rounded-lg p-0.5">
                  <button
                    onClick={() => setDeviceTab('active')}
                    className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-all ${
                      deviceTab === 'active'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-white/80 hover:text-white'
                    }`}
                  >
                    Active
                  </button>
                  <button
                    onClick={() => setDeviceTab('inactive')}
                    className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-all ${
                      deviceTab === 'inactive'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-white/80 hover:text-white'
                    }`}
                  >
                    Inactive
                  </button>
                </div>
              </div>

              {/* Battery Cards */}
              <div className="p-3 space-y-2 max-h-[500px] overflow-y-auto">
                {batteries
                  .filter((bat) =>
                    deviceTab === 'active'
                      ? bat.status === 'Active'
                      : bat.status === 'Inactive'
                  )
                  .map((bat) => {
                    const isSelected = selectedBattery?.serialNumber === bat.serialNumber;
                    const chargeColor = bat.charge > 60 ? '#22c55e' : bat.charge > 30 ? '#eab308' : '#ef4444';
                    const typeIcon = bat.type === 'truck' ? '🚛' : bat.type === 'bus' ? '🚌' : bat.type === 'auto' ? '🛺' : '🔋';
                    return (
                      <button
                        key={bat.serialNumber}
                        onClick={() => handleSelectBattery(bat.serialNumber)}
                        className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all ${
                          isSelected
                            ? 'bg-blue-50 border-2 border-blue-400 shadow-md'
                            : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                        }`}
                      >
                        {/* Vehicle Icon */}
                        <div className="flex-shrink-0">
                          <div className="w-11 h-11 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-xl">{typeIcon}</span>
                          </div>
                        </div>

                        {/* Name & Brand */}
                        <div className="flex-1 text-left min-w-0">
                          <div className="flex items-center space-x-1.5">
                            <h4 className="font-bold text-gray-800 text-sm truncate">{bat.name}</h4>
                            {bat.scanType && (
                              <span className={`text-[9px] font-bold px-1 py-0.5 rounded ${
                                bat.scanType === 'audit' 
                                  ? 'bg-blue-100 text-blue-600' 
                                  : 'bg-green-100 text-green-600'
                              }`}>
                                {bat.scanType === 'audit' ? 'AUDIT' : 'BATT'}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-400 truncate">{bat.brand || bat.serialNumber}</p>
                        </div>

                        {/* Mini Charge Ring + Temp */}
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          {/* Mini Circular Charge */}
                          <div className="relative w-8 h-8">
                            <svg className="w-full h-full" viewBox="0 0 36 36">
                              <circle cx="18" cy="18" r="14" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                              <circle
                                cx="18"
                                cy="18"
                                r="14"
                                fill="none"
                                stroke={chargeColor}
                                strokeWidth="3"
                                strokeDasharray={`${(bat.charge / 100) * 88} 88`}
                                strokeLinecap="round"
                                transform="rotate(-90 18 18)"
                              />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-gray-700">
                              {bat.charge}%
                            </span>
                          </div>

                          {/* Temperature */}
                          <div className="flex items-center space-x-0.5">
                            <span className="text-[10px]">🌡️</span>
                            <span className={`text-xs font-bold ${
                              bat.temperature > 70 ? 'text-red-500' : bat.temperature > 50 ? 'text-orange-500' : 'text-green-500'
                            }`}>
                              {bat.temperature}°C
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}

                {/* Empty state for tab */}
                {batteries.filter((bat) =>
                  deviceTab === 'active' ? bat.status === 'Active' : bat.status === 'Inactive'
                ).length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <p className="text-sm">No {deviceTab} batteries</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Analysis Dashboard */}
          <div className="lg:col-span-2">
            {loading ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-500">Loading analysis...</p>
              </div>
            ) : selectedBattery ? (
              <div className="space-y-6">
                {/* Battery Overview Card - matches mobile design */}
                <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl p-6 shadow-lg text-white">
                  {/* Header */}
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <h3 className="text-xl font-bold">{selectedBattery.name}</h3>
                      <p className="text-xs text-white/60">{selectedBattery.brand || selectedBattery.serialNumber}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        selectedBattery.status === 'Active' ? 'bg-green-400/30 text-green-200' : 'bg-red-400/30 text-red-200'
                      }`}>
                        {selectedBattery.status}
                      </span>
                      <div className="text-2xl cursor-pointer hover:opacity-80">⏻</div>
                    </div>
                  </div>

                  {/* Centered Charge Circle */}
                  <div className="flex justify-center my-6">
                    <div className="relative w-36 h-36">
                      <svg className="w-full h-full" viewBox="0 0 120 120">
                        <circle cx="60" cy="60" r="50" fill="none" stroke="#1e40af" strokeWidth="12" />
                        <circle
                          cx="60"
                          cy="60"
                          r="50"
                          fill="none"
                          stroke={selectedBattery.charge > 60 ? '#84cc16' : selectedBattery.charge > 30 ? '#eab308' : '#ef4444'}
                          strokeWidth="12"
                          strokeDasharray={`${(selectedBattery.charge / 100) * 314} 314`}
                          strokeLinecap="round"
                          transform="rotate(-90 60 60)"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold">{selectedBattery.charge}<span className="text-lg">%</span></span>
                        <span className="text-sm opacity-80">Charge</span>
                      </div>
                    </div>
                  </div>

                  {/* Temperature & Voltage Row */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="text-lg">🌡️</span>
                      </div>
                      <p className="text-xl font-bold text-yellow-300">{selectedBattery.temperature}°C</p>
                      <p className="text-xs opacity-75">Temperature</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="text-lg">⚡</span>
                      </div>
                      <p className="text-xl font-bold text-yellow-300">{selectedBattery.voltage}V</p>
                      <p className="text-xs opacity-75">Voltage</p>
                    </div>
                  </div>

                  {/* Health, Cycles, Capacity Row */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="text-lg">❤️</span>
                      </div>
                      <p className="text-lg font-bold text-green-300">{selectedBattery.health}%</p>
                      <p className="text-xs opacity-75">Health</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="text-lg">🔄</span>
                      </div>
                      <p className="text-lg font-bold text-yellow-300">{selectedBattery.cycles}</p>
                      <p className="text-xs opacity-75">Cycles</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="text-lg">🔋</span>
                      </div>
                      <p className="text-lg font-bold text-yellow-300">{selectedBattery.capacity}A</p>
                      <p className="text-xs opacity-75">Capacity</p>
                    </div>
                  </div>
                </div>

                {/* Analysis Tabs */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                  {/* Tab Headers */}
                  <div className="flex border-b border-gray-200">
                    {(['cells', 'soh', 'current', 'health'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-4 text-center font-semibold capitalize transition-colors text-sm ${
                          activeTab === tab
                            ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {tab === 'soh' ? 'SoH' : tab === 'health' ? 'Health' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    ))}
                  </div>

                  {/* Tab Content */}
                  <div className="p-6">
                    {activeTab === 'cells' && (
                      <div>
                        {/* Normal Range Info */}
                        <div className="bg-blue-50 rounded-lg p-4 mb-6">
                          <h4 className="font-bold text-gray-800 mb-2">Normal Range:</h4>
                          <p className="text-sm text-gray-700">
                            Voltage:{' '}
                            <span className="text-green-600 font-semibold">
                              ({selectedBattery.normalRange.voltage.min}v-{selectedBattery.normalRange.voltage.max}v)
                            </span>
                          </p>
                          <p className="text-sm text-gray-700">
                            Temperature:{' '}
                            <span className="text-green-600 font-semibold">
                              ({selectedBattery.normalRange.temperature.min}°c-{selectedBattery.normalRange.temperature.max}°c)
                            </span>
                          </p>
                        </div>

                        {/* Cell Grid */}
                        <div className="grid grid-cols-3 gap-3">
                          {selectedBattery.cells.map((cell) => (
                            <div
                              key={cell.id}
                              className="border border-gray-200 rounded-lg p-3 bg-white shadow-sm hover:shadow-md transition-shadow"
                            >
                              <p className="text-xs font-bold text-gray-500 mb-2">{cell.id}</p>
                              <div
                                className={`${getVoltageColor(
                                  cell.voltage,
                                  selectedBattery.normalRange.voltage.min,
                                  selectedBattery.normalRange.voltage.max
                                )} rounded px-2 py-1 mb-1`}
                              >
                                <p
                                  className={`text-sm font-bold ${getVoltageTextColor(
                                    cell.voltage,
                                    selectedBattery.normalRange.voltage.min,
                                    selectedBattery.normalRange.voltage.max
                                  )}`}
                                >
                                  {cell.voltage}v
                                </p>
                              </div>
                              <div
                                className={`${getTempColor(
                                  cell.temperature,
                                  selectedBattery.normalRange.temperature.min,
                                  selectedBattery.normalRange.temperature.max
                                )} rounded px-2 py-1`}
                              >
                                <p className="text-sm font-bold text-gray-800">{cell.temperature}°c</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeTab === 'soh' && (
                      <div className="text-center">
                        <h4 className="text-lg font-bold text-gray-800 mb-6">State of Health (SoH)</h4>

                        {/* SoH Circle */}
                        <div className="flex justify-center mb-8">
                          <div className="relative w-40 h-40">
                            <svg className="w-full h-full" viewBox="0 0 120 120">
                              <circle cx="60" cy="60" r="50" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                              <circle
                                cx="60"
                                cy="60"
                                r="50"
                                fill="none"
                                stroke={selectedBattery.soh >= 80 ? '#22c55e' : selectedBattery.soh >= 50 ? '#eab308' : '#ef4444'}
                                strokeWidth="10"
                                strokeDasharray={`${(selectedBattery.soh / 100) * 314} 314`}
                                strokeLinecap="round"
                                transform="rotate(-90 60 60)"
                              />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-3xl font-bold text-gray-800">{selectedBattery.soh}%</span>
                              <span className="text-sm text-gray-500">SoH</span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div className="bg-green-50 rounded-lg p-4">
                            <p className="text-sm text-gray-600">Health</p>
                            <p className="text-xl font-bold text-green-600">{selectedBattery.health}%</p>
                          </div>
                          <div className="bg-blue-50 rounded-lg p-4">
                            <p className="text-sm text-gray-600">Cycles</p>
                            <p className="text-xl font-bold text-blue-600">{selectedBattery.cycles}</p>
                          </div>
                          <div className="bg-orange-50 rounded-lg p-4">
                            <p className="text-sm text-gray-600">Capacity</p>
                            <p className="text-xl font-bold text-orange-600">{selectedBattery.capacity}Ah</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'current' && (
                      <div className="text-center">
                        <h4 className="text-lg font-bold text-gray-800 mb-6">Current Flow</h4>

                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 mb-6">
                          <p className="text-5xl font-bold text-blue-600 mb-2">{selectedBattery.current}A</p>
                          <p className="text-gray-500">Current Draw</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-yellow-50 rounded-lg p-4">
                            <p className="text-sm text-gray-600">Voltage</p>
                            <p className="text-xl font-bold text-yellow-600">{selectedBattery.voltage}V</p>
                          </div>
                          <div className="bg-purple-50 rounded-lg p-4">
                            <p className="text-sm text-gray-600">Power</p>
                            <p className="text-xl font-bold text-purple-600">
                              {(selectedBattery.voltage * selectedBattery.current).toFixed(1)}W
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'health' && (
                      <div>
                        {/* Battery Health Title */}
                        <h3 className="text-2xl font-extrabold text-gray-900 text-center mb-1">Battery Health</h3>
                        <p className="text-center text-gray-500 text-sm mb-6">Overview</p>

                        {/* Area Chart */}
                        {selectedBattery.chargeHistory && selectedBattery.chargeHistory.length > 0 && (() => {
                          const data = selectedBattery.chargeHistory!;
                          const chartW = 500;
                          const chartH = 200;
                          const padL = 0;
                          const padR = 0;
                          const padT = 30;
                          const padB = 30;
                          const w = chartW - padL - padR;
                          const h = chartH - padT - padB;
                          const maxVal = 100;
                          const peakIdx = data.reduce((mi, d, i, arr) => d.value > arr[mi].value ? i : mi, 0);
                          const points = data.map((d, i) => {
                            const x = padL + (i / (data.length - 1)) * w;
                            const y = padT + h - (d.value / maxVal) * h;
                            return { x, y, ...d };
                          });
                          const linePath = points.map((p, i) => {
                            if (i === 0) return `M ${p.x} ${p.y}`;
                            const prev = points[i - 1];
                            const cx1 = prev.x + (p.x - prev.x) * 0.4;
                            const cx2 = p.x - (p.x - prev.x) * 0.4;
                            return `C ${cx1} ${prev.y}, ${cx2} ${p.y}, ${p.x} ${p.y}`;
                          }).join(' ');
                          const areaPath = `${linePath} L ${points[points.length - 1].x} ${padT + h} L ${points[0].x} ${padT + h} Z`;

                          return (
                            <div className="mb-6">
                              <svg viewBox={`0 0 ${chartW} ${chartH + 20}`} className="w-full" preserveAspectRatio="xMidYMid meet">
                                <defs>
                                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.6" />
                                    <stop offset="50%" stopColor="#6ee7b7" stopOpacity="0.3" />
                                    <stop offset="100%" stopColor="#d1fae5" stopOpacity="0.05" />
                                  </linearGradient>
                                </defs>
                                {/* Area Fill */}
                                <path d={areaPath} fill="url(#chartGradient)" />
                                {/* Line */}
                                <path d={linePath} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
                                {/* Full Charge Label at peak */}
                                <rect x={points[peakIdx].x - 38} y={points[peakIdx].y - 24} width="76" height="20" rx="10" fill="#10b981" />
                                <text x={points[peakIdx].x} y={points[peakIdx].y - 11} textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">Full Charge</text>
                                {/* Peak dot */}
                                <circle cx={points[peakIdx].x} cy={points[peakIdx].y} r="4" fill="#10b981" stroke="white" strokeWidth="2" />
                                {/* Time Labels */}
                                {points.map((p, i) => (
                                  <text
                                    key={i}
                                    x={p.x}
                                    y={padT + h + 18}
                                    textAnchor="middle"
                                    fill={i === points.length - 1 ? '#111827' : '#9ca3af'}
                                    fontSize="10"
                                    fontWeight={i === points.length - 1 ? 'bold' : 'normal'}
                                  >
                                    {p.time}
                                  </text>
                                ))}
                              </svg>
                            </div>
                          );
                        })()}

                        {/* Metrics Row: Sum Volt, Current, Capacity */}
                        <div className="flex justify-center items-center space-x-6 mb-8 bg-gray-50 rounded-xl py-4 px-3">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 text-sm">⚡</span>
                            </div>
                            <div>
                              <p className="text-base font-bold text-gray-800">{selectedBattery.sumVolt || selectedBattery.voltage}V</p>
                              <p className="text-[10px] text-gray-400">Sum Volt</p>
                            </div>
                          </div>
                          <div className="w-px h-8 bg-gray-200"></div>
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <span className="text-green-600 text-sm">🔋</span>
                            </div>
                            <div>
                              <p className="text-base font-bold text-gray-800">{selectedBattery.current}</p>
                              <p className="text-[10px] text-gray-400">Current</p>
                            </div>
                          </div>
                          <div className="w-px h-8 bg-gray-200"></div>
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                              <div className="w-4 h-2.5 bg-emerald-500 rounded-sm"></div>
                            </div>
                            <div>
                              <p className="text-base font-bold text-gray-800">{selectedBattery.capacity}.0Ah</p>
                              <p className="text-[10px] text-gray-400">Capacity</p>
                            </div>
                          </div>
                        </div>

                        {/* Status Information Card */}
                        <div className="border border-blue-100 rounded-2xl p-5 mb-4 bg-white">
                          <h4 className="text-sm font-extrabold text-blue-800 tracking-wide mb-1">
                            STATUS INFORMATION- {selectedBattery.statusInfo?.count ?? 0}
                          </h4>
                          <p className="text-gray-600 text-sm">{selectedBattery.statusInfo?.message || 'No issues'}</p>
                        </div>

                        {/* Number of Temperatures Card */}
                        <div className="border border-blue-100 rounded-2xl p-5 mb-4 bg-white">
                          <h4 className="text-sm font-extrabold text-blue-800 tracking-wide mb-2">
                            NUMBER OF TEMPERATURES- {selectedBattery.temperatures?.length ?? 0}
                          </h4>
                          <div className="flex flex-wrap gap-x-4 gap-y-1">
                            {(selectedBattery.temperatures || []).map((temp, i) => (
                              <span key={i} className="text-sm">
                                <span className="text-gray-500">T{i + 1}:</span>{' '}
                                <span className={`font-bold ${temp > 35 ? 'text-red-500' : 'text-blue-600'}`}>{temp}°C</span>
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* MOS Temperature Card */}
                        <div className="border border-blue-100 rounded-2xl p-5 bg-white">
                          <h4 className="text-sm font-extrabold text-red-600 tracking-wide mb-1">MOS TEMPERATURE</h4>
                          <p className="text-sm text-gray-600">
                            MOS: <span className="font-bold text-blue-600">{selectedBattery.mosTemperature ?? 0}°C</span>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <span className="text-6xl mb-4 block">📊</span>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Select a Battery</h3>
                <p className="text-gray-500">
                  Choose a battery from your devices list to view its detailed analysis
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mt-4">
                {error}
              </div>
            )}

            {/* BIS Portal & ZipBolt Certificate - Coming Soon */}
            <div className="space-y-4 mt-6">
              {/* BIS Portal - Coming Soon */}
              <div className="relative rounded-2xl overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <span className="bg-gray-900/70 text-white text-lg font-bold px-6 py-2 rounded-full shadow-lg tracking-wide">Coming Soon</span>
                </div>
                <div className="blur-sm pointer-events-none select-none bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl shadow-lg p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                        <span className="text-2xl">🔍</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800 text-lg">Verify on BIS Portal</h4>
                        <p className="text-sm text-gray-500">Cross-verify cell details on crsbis.in</p>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold px-6 py-3 rounded-xl shadow-lg flex items-center space-x-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      <span>Verify on BIS</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ZipBolt Certificate - Coming Soon */}
              <div className="relative rounded-2xl overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <span className="bg-gray-900/70 text-white text-lg font-bold px-6 py-2 rounded-full shadow-lg tracking-wide">Coming Soon</span>
                </div>
                <div className="blur-sm pointer-events-none select-none bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl shadow-lg p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                        <span className="text-2xl">📜</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800 text-lg">ZipBolt Certificate</h4>
                        <p className="text-sm text-gray-500">Cell Audit &amp; Analysis Report</p>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold px-6 py-3 rounded-xl shadow-lg flex items-center space-x-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Generate Certificate</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* BIS Certificate Modal */}
    {showCertificate && selectedBattery && (
      <BISCertificate
        battery={selectedBattery}
        onClose={() => setShowCertificate(false)}
      />
    )}
    </>
  );
};

export default AdvanceAnalysis;

