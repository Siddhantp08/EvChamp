const API_BASE = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5000/api');

export interface CellData {
  id: number;
  voltage: number;
  temperature: number;
}

export interface BatteryData {
  serialNumber: string;
  name: string;
  brand: string;
  type: string;
  charge: number;
  temperature: number;
  voltage: number;
  health: number;
  cycles: number;
  capacity: number;
  status: string;
  cells: CellData[];
  soh: number;
  current: number;
  scanType?: 'audit' | 'battery';
  sumVolt?: number;
  mosTemperature?: number;
  temperatures?: number[];
  statusInfo?: { count: number; message: string };
  chargeHistory?: { time: string; value: number }[];
  manufacturer?: string;
  manufacturerCode?: string;
  productionDate?: string;
  batchNumber?: string;
  cellChemistry?: string;
  nominalVoltage?: string;
  maxVoltage?: string;
  minVoltage?: string;
  weight?: string;
  dimensions?: string;
  certifications?: string[];
  warrantyExpiry?: string;
  countryOfOrigin?: string;
  plantLocation?: string;
  model?: string;
  energyCapacity?: string;
  cellType?: string;
}

export interface BatteryAnalysis extends BatteryData {
  normalRange: {
    voltage: { min: number; max: number };
    temperature: { min: number; max: number };
  };
  brand: string;
  type: string;
}

export async function addBattery(
  serialNumber: string,
  userId: string = 'default',
  scanType: 'audit' | 'battery' = 'audit'
): Promise<{ message: string; battery: BatteryData }> {
  const res = await fetch(`${API_BASE}/batteries/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ serialNumber, userId, scanType }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to add battery');
  }

  return res.json();
}

export async function getUserBatteries(userId: string = 'default'): Promise<BatteryData[]> {
  const res = await fetch(`${API_BASE}/user/${userId}/batteries`);
  if (!res.ok) throw new Error('Failed to fetch batteries');
  const data = await res.json();
  return data.batteries;
}

export async function getBatteryAnalysis(serialNumber: string): Promise<BatteryAnalysis> {
  const res = await fetch(`${API_BASE}/batteries/${serialNumber}/analysis`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Battery not found');
  }
  return res.json();
}

export async function getBattery(serialNumber: string): Promise<BatteryData> {
  const res = await fetch(`${API_BASE}/batteries/${serialNumber}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Battery not found');
  }
  const data = await res.json();
  return data.battery;
}

export async function getQRAnalysis(qrRaw: string, decoded: Record<string, string>): Promise<BatteryAnalysis> {
  const res = await fetch(`${API_BASE}/batteries/qr-analysis`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ qrRaw, decoded }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'QR analysis failed');
  }
  return res.json();
}

// ============ AUDIT ENDPOINTS (Neon DB) ============

export interface AuditData {
  auditId: string;
  qrRaw?: string;
  serialNumber: string;
  manufacturer?: string;
  manufacturerCode?: string;
  model?: string;
  modelCode?: string;
  chemistry?: string;
  chemistryCode?: string;
  productionType?: string;
  productionLine?: string;
  taskCode?: string;
  factoryAddress?: string;
  factoryIdentifier?: string;
  productionDate?: string;
  capacity?: string;
  voltage?: string;
  countryOfOrigin?: string;
  qrAuthenticityScore?: number;
  qrValidationStatus?: string;
  authCheckScore?: number;
  authCheckStatus?: string;
  authCheckDetails?: Record<string, unknown>;
  certificateNumber?: string;
  certificateGenerated?: boolean;
  cellData?: Record<string, unknown>;
  auditedBy?: string;
}

export async function saveAudit(auditData: AuditData): Promise<{ success: boolean; audit: Record<string, unknown> }> {
  const res = await fetch(`${API_BASE}/audits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(auditData),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to save audit');
  }
  return res.json();
}

export async function getAuditsBySerial(serialNumber: string): Promise<{ success: boolean; audits: Record<string, unknown>[] }> {
  const res = await fetch(`${API_BASE}/audits/serial/${encodeURIComponent(serialNumber)}`);
  if (!res.ok) throw new Error('Failed to fetch audits');
  return res.json();
}

export async function updateAuditCertificate(auditId: string, certificateNumber: string): Promise<{ success: boolean; audit: Record<string, unknown> }> {
  const res = await fetch(`${API_BASE}/audits/${encodeURIComponent(auditId)}/certificate`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ certificateNumber }),
  });
  if (!res.ok) throw new Error('Failed to update certificate');
  return res.json();
}
