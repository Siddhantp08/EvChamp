const express = require('express');
const cors = require('cors');
const { neon } = require('@neondatabase/serverless');
const nodemailer = require('nodemailer');
const { verifyToken, createClerkClient } = require('@clerk/backend');

const app = express();

app.use(cors());
app.use(express.json());

// Initialize DB on first request (serverless cold start)
let initPromise = null;
app.use(async (req, res, next) => {
  if (!dbReady && !initPromise) {
    initPromise = initDB();
    await initPromise;
  }
  next();
});

// ============ Neon DB Functions ============
let sql = null;
let dbReady = false;

function getSQL() {
  if (!sql) {
    sql = neon(process.env.DATABASE_URL);
  }
  return sql;
}

async function initDB() {
  try {
    await getSQL()`
      CREATE TABLE IF NOT EXISTS cell_audits (
        id SERIAL PRIMARY KEY,
        audit_id TEXT UNIQUE NOT NULL,
        qr_raw TEXT,
        serial_number TEXT NOT NULL,
        manufacturer TEXT,
        manufacturer_code TEXT,
        model TEXT,
        model_code TEXT,
        chemistry TEXT,
        chemistry_code TEXT,
        production_type TEXT,
        production_line TEXT,
        task_code TEXT,
        factory_address TEXT,
        factory_identifier TEXT,
        production_date TEXT,
        capacity TEXT,
        voltage TEXT,
        country_of_origin TEXT,
        qr_authenticity_score INTEGER,
        qr_validation_status TEXT,
        auth_check_score INTEGER,
        auth_check_status TEXT,
        auth_check_details JSONB,
        certificate_number TEXT,
        certificate_generated BOOLEAN DEFAULT FALSE,
        cell_data JSONB,
        audited_by TEXT,
        audited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    await getSQL()`CREATE INDEX IF NOT EXISTS idx_cell_audits_serial ON cell_audits(serial_number)`;
    await getSQL()`CREATE INDEX IF NOT EXISTS idx_cell_audits_qr ON cell_audits(qr_raw)`;
    await getSQL()`CREATE INDEX IF NOT EXISTS idx_cell_audits_audit_id ON cell_audits(audit_id)`;

    await getSQL()`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        clerk_id TEXT UNIQUE NOT NULL,
        email TEXT,
        first_name TEXT,
        last_name TEXT,
        image_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_sign_in_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    await getSQL()`CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id)`;

    dbReady = true;
    return true;
  } catch (err) {
    console.error('Neon DB init failed:', err.message);
    return false;
  }
}

async function saveAuditToDB(auditData) {
  if (!dbReady) await initDB();
  const {
    auditId, qrRaw, serialNumber, manufacturer, manufacturerCode,
    model, modelCode, chemistry, chemistryCode, productionType,
    productionLine, taskCode, factoryAddress, factoryIdentifier,
    productionDate, capacity, voltage, countryOfOrigin,
    qrAuthenticityScore, qrValidationStatus,
    authCheckScore, authCheckStatus, authCheckDetails,
    certificateNumber, certificateGenerated,
    cellData, auditedBy
  } = auditData;

  const result = await getSQL()`
    INSERT INTO cell_audits (
      audit_id, qr_raw, serial_number, manufacturer, manufacturer_code,
      model, model_code, chemistry, chemistry_code, production_type,
      production_line, task_code, factory_address, factory_identifier,
      production_date, capacity, voltage, country_of_origin,
      qr_authenticity_score, qr_validation_status,
      auth_check_score, auth_check_status, auth_check_details,
      certificate_number, certificate_generated,
      cell_data, audited_by
    ) VALUES (
      ${auditId}, ${qrRaw || null}, ${serialNumber}, ${manufacturer || null}, ${manufacturerCode || null},
      ${model || null}, ${modelCode || null}, ${chemistry || null}, ${chemistryCode || null}, ${productionType || null},
      ${productionLine || null}, ${taskCode || null}, ${factoryAddress || null}, ${factoryIdentifier || null},
      ${productionDate || null}, ${capacity || null}, ${voltage || null}, ${countryOfOrigin || null},
      ${qrAuthenticityScore || null}, ${qrValidationStatus || null},
      ${authCheckScore || null}, ${authCheckStatus || null}, ${JSON.stringify(authCheckDetails || null)},
      ${certificateNumber || null}, ${certificateGenerated || false},
      ${JSON.stringify(cellData || null)}, ${auditedBy || null}
    )
    RETURNING *
  `;
  return result[0];
}

async function getAuditBySerial(serialNumber) {
  if (!dbReady) await initDB();
  return await getSQL()`SELECT * FROM cell_audits WHERE serial_number = ${serialNumber} ORDER BY created_at DESC`;
}

async function getAuditById(auditId) {
  if (!dbReady) await initDB();
  const results = await getSQL()`SELECT * FROM cell_audits WHERE audit_id = ${auditId}`;
  return results[0] || null;
}

async function getAllAudits(limit = 50, offset = 0) {
  if (!dbReady) await initDB();
  return await getSQL()`SELECT * FROM cell_audits ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
}

async function updateCertificate(auditId, certificateNumber) {
  if (!dbReady) await initDB();
  const result = await getSQL()`
    UPDATE cell_audits SET certificate_number = ${certificateNumber}, certificate_generated = true
    WHERE audit_id = ${auditId} RETURNING *
  `;
  return result[0] || null;
}

// ============ In-memory battery store ============
const batteryDatabase = {
  'SN-001': {
    serialNumber: 'SN-001',
    name: 'Truck - 1',
    brand: 'YBX ACTIVE SPECIALIST',
    type: 'truck',
    charge: 68,
    temperature: 79,
    voltage: 12,
    health: 95,
    cycles: 48,
    capacity: 25,
    status: 'Active',
    manufacturer: 'Yuasa Battery Co. Ltd.',
    manufacturerCode: 'YBX-IND-001',
    productionDate: '2024-08-15',
    batchNumber: 'BATCH-2024-08-A112',
    cellChemistry: 'Lithium Iron Phosphate (LiFePO4)',
    nominalVoltage: '12V',
    maxVoltage: '14.6V',
    minVoltage: '10.0V',
    weight: '8.2 kg',
    dimensions: '260 x 173 x 225 mm',
    certifications: ['BIS IS 16893:2018', 'AIS-156', 'IEC 62660-1'],
    warrantyExpiry: '2027-08-15',
    countryOfOrigin: 'India',
    plantLocation: 'Bangalore, Karnataka',
    cells: [
      { id: 1, voltage: 3.3, temperature: 39 },
      { id: 2, voltage: 6.3, temperature: 69 },
      { id: 3, voltage: 7.5, temperature: 88 },
      { id: 4, voltage: 3.3, temperature: 39 },
      { id: 5, voltage: 6.3, temperature: 69 },
      { id: 6, voltage: 7.5, temperature: 88 },
      { id: 7, voltage: 3.3, temperature: 39 },
      { id: 8, voltage: 6.3, temperature: 69 },
      { id: 9, voltage: 7.5, temperature: 88 },
    ],
    soh: 92,
    current: 15.4,
    sumVolt: 52.4,
    mosTemperature: 4,
    temperatures: [39, 31, 39, 38],
    statusInfo: { count: 1, message: 'Cell volt high level 2' },
    chargeHistory: [
      { time: '6am', value: 40 }, { time: '8am', value: 55 },
      { time: '10am', value: 78 }, { time: '12pm', value: 92 },
      { time: '2pm', value: 100 }, { time: '4pm', value: 95 },
      { time: '6pm', value: 82 }, { time: '8pm', value: 68 },
      { time: '10pm', value: 50 }, { time: '12am', value: 35 },
      { time: '2am', value: 28 },
    ],
  },
  'SN-002': {
    serialNumber: 'SN-002',
    name: 'Truck - 2',
    brand: 'YBX ACTIVE SPECIALIST',
    type: 'truck',
    charge: 15,
    temperature: 35,
    voltage: 11.8,
    health: 88,
    cycles: 120,
    capacity: 25,
    status: 'Active',
    manufacturer: 'Yuasa Battery Co. Ltd.',
    manufacturerCode: 'YBX-IND-002',
    productionDate: '2024-03-22',
    batchNumber: 'BATCH-2024-03-B045',
    cellChemistry: 'Lithium Iron Phosphate (LiFePO4)',
    nominalVoltage: '12V',
    maxVoltage: '14.6V',
    minVoltage: '10.0V',
    weight: '8.2 kg',
    dimensions: '260 x 173 x 225 mm',
    certifications: ['BIS IS 16893:2018', 'AIS-156', 'IEC 62660-1'],
    warrantyExpiry: '2027-03-22',
    countryOfOrigin: 'India',
    plantLocation: 'Bangalore, Karnataka',
    cells: [
      { id: 1, voltage: 3.1, temperature: 42 },
      { id: 2, voltage: 5.9, temperature: 55 },
      { id: 3, voltage: 7.2, temperature: 72 },
      { id: 4, voltage: 3.0, temperature: 40 },
      { id: 5, voltage: 6.0, temperature: 58 },
      { id: 6, voltage: 7.1, temperature: 70 },
      { id: 7, voltage: 3.2, temperature: 44 },
      { id: 8, voltage: 5.8, temperature: 53 },
      { id: 9, voltage: 7.3, temperature: 75 },
    ],
    soh: 85,
    current: 12.8,
    sumVolt: 48.6,
    mosTemperature: 6,
    temperatures: [42, 35, 40, 38],
    statusInfo: { count: 2, message: 'Low charge warning' },
    chargeHistory: [
      { time: '6am', value: 30 }, { time: '8am', value: 28 },
      { time: '10am', value: 22 }, { time: '12pm', value: 18 },
      { time: '2pm', value: 15 }, { time: '4pm', value: 45 },
      { time: '6pm', value: 60 }, { time: '8pm', value: 52 },
      { time: '10pm', value: 38 }, { time: '12am', value: 25 },
      { time: '2am', value: 15 },
    ],
  },
  'SN-003': {
    serialNumber: 'SN-003',
    name: 'Other',
    brand: 'YBX ACTIVE SPECIALIST',
    type: 'other',
    charge: 25,
    temperature: 85,
    voltage: 12.4,
    health: 78,
    cycles: 200,
    capacity: 25,
    status: 'Active',
    manufacturer: 'Yuasa Battery Co. Ltd.',
    manufacturerCode: 'YBX-IND-003',
    productionDate: '2023-11-10',
    batchNumber: 'BATCH-2023-11-C089',
    cellChemistry: 'Lithium Nickel Manganese Cobalt (NMC)',
    nominalVoltage: '12.4V',
    maxVoltage: '14.8V',
    minVoltage: '9.8V',
    weight: '7.5 kg',
    dimensions: '240 x 165 x 210 mm',
    certifications: ['BIS IS 16893:2018', 'AIS-156'],
    warrantyExpiry: '2026-11-10',
    countryOfOrigin: 'India',
    plantLocation: 'Pune, Maharashtra',
    cells: [
      { id: 1, voltage: 3.5, temperature: 82 },
      { id: 2, voltage: 3.6, temperature: 83 },
      { id: 3, voltage: 3.5, temperature: 81 },
      { id: 4, voltage: 3.4, temperature: 84 },
      { id: 5, voltage: 3.6, temperature: 83 },
      { id: 6, voltage: 3.5, temperature: 82 },
      { id: 7, voltage: 3.5, temperature: 85 },
      { id: 8, voltage: 3.4, temperature: 84 },
      { id: 9, voltage: 3.6, temperature: 83 },
    ],
    soh: 75,
    current: 10.5,
    sumVolt: 30.6,
    mosTemperature: 8,
    temperatures: [82, 83, 81, 84],
    statusInfo: { count: 3, message: 'High temperature alert' },
    chargeHistory: [
      { time: '6am', value: 60 }, { time: '8am', value: 55 },
      { time: '10am', value: 48 }, { time: '12pm', value: 42 },
      { time: '2pm', value: 38 }, { time: '4pm', value: 33 },
      { time: '6pm', value: 28 }, { time: '8pm', value: 25 },
      { time: '10pm', value: 30 }, { time: '12am', value: 45 },
      { time: '2am', value: 25 },
    ],
  },
  'SN-004': {
    serialNumber: 'SN-004',
    name: 'Other',
    brand: 'YBX ACTIVE SPECIALIST',
    type: 'other',
    charge: 25,
    temperature: 85,
    voltage: 11.9,
    health: 72,
    cycles: 250,
    capacity: 25,
    status: 'Inactive',
    manufacturer: 'Yuasa Battery Co. Ltd.',
    manufacturerCode: 'YBX-IND-004',
    productionDate: '2023-06-18',
    batchNumber: 'BATCH-2023-06-D201',
    cellChemistry: 'Lithium Nickel Manganese Cobalt (NMC)',
    nominalVoltage: '12V',
    maxVoltage: '14.6V',
    minVoltage: '10.0V',
    weight: '7.5 kg',
    dimensions: '240 x 165 x 210 mm',
    certifications: ['BIS IS 16893:2018'],
    warrantyExpiry: '2026-06-18',
    countryOfOrigin: 'India',
    plantLocation: 'Chennai, Tamil Nadu',
    cells: [
      { id: 1, voltage: 2.8, temperature: 80 },
      { id: 2, voltage: 5.5, temperature: 78 },
      { id: 3, voltage: 7.8, temperature: 90 },
      { id: 4, voltage: 2.9, temperature: 82 },
      { id: 5, voltage: 5.6, temperature: 79 },
      { id: 6, voltage: 7.7, temperature: 89 },
      { id: 7, voltage: 3.0, temperature: 81 },
      { id: 8, voltage: 5.4, temperature: 77 },
      { id: 9, voltage: 7.9, temperature: 91 },
    ],
    soh: 68,
    current: 8.2,
    sumVolt: 49.6,
    mosTemperature: 12,
    temperatures: [80, 78, 82, 79],
    statusInfo: { count: 4, message: 'Battery degradation warning' },
    chargeHistory: [
      { time: '6am', value: 35 }, { time: '8am', value: 32 },
      { time: '10am', value: 28 }, { time: '12pm', value: 25 },
      { time: '2pm', value: 22 }, { time: '4pm', value: 20 },
      { time: '6pm', value: 18 }, { time: '8pm', value: 50 },
      { time: '10pm', value: 42 }, { time: '12am', value: 30 },
      { time: '2am', value: 25 },
    ],
  },
  'SN-005': {
    serialNumber: 'SN-005',
    name: 'Bus - 1',
    brand: 'LITHIUM PRO MAX',
    type: 'bus',
    charge: 92,
    temperature: 35,
    voltage: 48.2,
    health: 98,
    cycles: 15,
    capacity: 100,
    status: 'Active',
    manufacturer: 'Lithium Pro Energy Systems Pvt. Ltd.',
    manufacturerCode: 'LPM-IND-005',
    productionDate: '2025-01-08',
    batchNumber: 'BATCH-2025-01-E330',
    cellChemistry: 'Lithium Iron Phosphate (LiFePO4)',
    nominalVoltage: '48V',
    maxVoltage: '54.6V',
    minVoltage: '40.0V',
    weight: '32.5 kg',
    dimensions: '520 x 240 x 220 mm',
    certifications: ['BIS IS 16893:2018', 'AIS-156', 'IEC 62660-1', 'UN38.3'],
    warrantyExpiry: '2028-01-08',
    countryOfOrigin: 'India',
    plantLocation: 'Noida, Uttar Pradesh',
    cells: [
      { id: 1, voltage: 3.5, temperature: 32 },
      { id: 2, voltage: 3.6, temperature: 33 },
      { id: 3, voltage: 3.5, temperature: 31 },
      { id: 4, voltage: 3.4, temperature: 34 },
      { id: 5, voltage: 3.6, temperature: 33 },
      { id: 6, voltage: 3.5, temperature: 32 },
      { id: 7, voltage: 3.5, temperature: 35 },
      { id: 8, voltage: 3.4, temperature: 34 },
      { id: 9, voltage: 3.6, temperature: 33 },
      { id: 10, voltage: 3.5, temperature: 31 },
      { id: 11, voltage: 3.6, temperature: 33 },
      { id: 12, voltage: 3.4, temperature: 32 },
    ],
    soh: 97,
    current: 45.6,
    sumVolt: 96.8,
    mosTemperature: 2,
    temperatures: [32, 33, 31, 34],
    statusInfo: { count: 0, message: 'All systems normal' },
    chargeHistory: [
      { time: '6am', value: 85 }, { time: '8am', value: 88 },
      { time: '10am', value: 92 }, { time: '12pm', value: 95 },
      { time: '2pm', value: 100 }, { time: '4pm', value: 98 },
      { time: '6pm', value: 94 }, { time: '8pm', value: 92 },
      { time: '10pm', value: 90 }, { time: '12am', value: 88 },
      { time: '2am', value: 92 },
    ],
  },
  'SN-006': {
    serialNumber: 'SN-006',
    name: 'Auto - 1',
    brand: 'EV POWER CELL',
    type: 'auto',
    charge: 55,
    temperature: 52,
    voltage: 24.1,
    health: 91,
    cycles: 65,
    capacity: 40,
    status: 'Active',
    manufacturer: 'EV Power Cell Industries',
    manufacturerCode: 'EPC-IND-006',
    productionDate: '2024-11-25',
    batchNumber: 'BATCH-2024-11-F078',
    cellChemistry: 'Lithium Iron Phosphate (LiFePO4)',
    nominalVoltage: '24V',
    maxVoltage: '29.2V',
    minVoltage: '20.0V',
    weight: '14.8 kg',
    dimensions: '330 x 195 x 215 mm',
    certifications: ['BIS IS 16893:2018', 'AIS-156', 'IEC 62660-1'],
    warrantyExpiry: '2027-11-25',
    countryOfOrigin: 'India',
    plantLocation: 'Ahmedabad, Gujarat',
    cells: [
      { id: 1, voltage: 3.2, temperature: 48 },
      { id: 2, voltage: 4.1, temperature: 52 },
      { id: 3, voltage: 5.8, temperature: 60 },
      { id: 4, voltage: 3.3, temperature: 49 },
      { id: 5, voltage: 4.0, temperature: 51 },
      { id: 6, voltage: 5.9, temperature: 62 },
      { id: 7, voltage: 3.1, temperature: 47 },
      { id: 8, voltage: 4.2, temperature: 53 },
      { id: 9, voltage: 5.7, temperature: 59 },
    ],
    soh: 89,
    current: 22.3,
    sumVolt: 38.3,
    mosTemperature: 5,
    temperatures: [48, 52, 49, 51],
    statusInfo: { count: 1, message: 'Moderate temperature rise' },
    chargeHistory: [
      { time: '6am', value: 70 }, { time: '8am', value: 65 },
      { time: '10am', value: 58 }, { time: '12pm', value: 55 },
      { time: '2pm', value: 80 }, { time: '4pm', value: 75 },
      { time: '6pm', value: 68 }, { time: '8pm', value: 60 },
      { time: '10pm', value: 55 }, { time: '12am', value: 48 },
      { time: '2am', value: 55 },
    ],
  },
  'FAP0002507': {
    serialNumber: 'FAP0002507',
    name: 'Cell - MB31',
    brand: 'EVE',
    type: 'other',
    charge: 92,
    temperature: 32,
    voltage: 3.2,
    health: 99,
    cycles: 5,
    capacity: 314,
    status: 'Active',
    manufacturer: 'EVE Power Co. Ltd',
    manufacturerCode: 'EVE-CN-MB31',
    productionDate: '2025-10-01',
    batchNumber: '040CB43L300011',
    cellChemistry: 'Lithium Iron Phosphate (LiFePO4)',
    nominalVoltage: '3.2V',
    maxVoltage: '3.65V',
    minVoltage: '2.5V',
    weight: '5.43 kg',
    dimensions: '174 x 71 x 207 mm',
    certifications: ['UN38.3', 'IEC 62660-1', 'UL 1973'],
    warrantyExpiry: '2030-10-01',
    countryOfOrigin: 'China',
    plantLocation: 'Huizhou, Guangdong',
    model: 'MB31',
    energyCapacity: '1004.8 Wh',
    cellType: 'Rechargeable Li-ion Cell',
    cells: [
      { id: 1, voltage: 3.21, temperature: 30 },
      { id: 2, voltage: 3.20, temperature: 31 },
      { id: 3, voltage: 3.19, temperature: 30 },
      { id: 4, voltage: 3.20, temperature: 32 },
      { id: 5, voltage: 3.21, temperature: 31 },
      { id: 6, voltage: 3.20, temperature: 30 },
      { id: 7, voltage: 3.19, temperature: 31 },
      { id: 8, voltage: 3.21, temperature: 32 },
      { id: 9, voltage: 3.20, temperature: 30 },
    ],
    soh: 99,
    current: 0.5,
    sumVolt: 28.81,
    mosTemperature: 2,
    temperatures: [30, 31, 30, 32],
    statusInfo: { count: 0, message: 'All systems normal' },
    chargeHistory: [
      { time: '6am', value: 88 }, { time: '8am', value: 90 },
      { time: '10am', value: 92 }, { time: '12pm', value: 94 },
      { time: '2pm', value: 95 }, { time: '4pm', value: 93 },
      { time: '6pm', value: 92 }, { time: '8pm', value: 91 },
      { time: '10pm', value: 92 }, { time: '12am', value: 90 },
      { time: '2am', value: 92 },
    ],
  },
};

// User batteries storage
const userBatteries = {};
const userBatteryScanTypes = {};

// Auto-generate battery for unknown serial numbers
function generateBatteryFromSerial(serialNumber) {
  let hash = 0;
  for (let i = 0; i < serialNumber.length; i++) {
    hash = ((hash << 5) - hash + serialNumber.charCodeAt(i)) | 0;
  }
  const seed = (n, min, max) => min + Math.abs((hash * (n + 1)) % (max - min + 1));
  const seedF = (n, min, max) => +(min + (Math.abs((hash * (n + 1)) % 10000) / 10000) * (max - min)).toFixed(1);

  const types = ['truck', 'bus', 'auto', 'other'];
  const brands = [
    'YBX ACTIVE SPECIALIST', 'LITHIUM PRO MAX', 'EV POWER CELL',
    'EXIDE EV MASTER', 'AMARON VOLTA', 'TATA GREEN', 'LUMINOUS POWER',
    'OKAYA EV CELL', 'LIVGUARD PRIME', 'COSLIGHT ENERGY',
  ];
  const typeIdx = Math.abs(hash) % types.length;
  const brandIdx = Math.abs(hash * 3) % brands.length;
  const type = types[typeIdx];
  const brand = brands[brandIdx];

  const typeNames = { truck: 'Truck', bus: 'Bus', auto: 'Auto', other: 'Battery' };
  const unitNum = seed(7, 1, 99);
  const name = `${typeNames[type]} - ${unitNum}`;

  const cellCount = type === 'bus' ? seed(10, 10, 16) : seed(10, 6, 12);
  const nominalVoltage = type === 'bus' ? seedF(2, 36, 60) : type === 'truck' ? seedF(2, 12, 24) : seedF(2, 12, 48);
  const capacity = type === 'bus' ? seed(3, 60, 150) : type === 'truck' ? seed(3, 20, 60) : seed(3, 15, 50);

  const cells = [];
  const vBase = seedF(4, 2.8, 4.0);
  for (let i = 1; i <= cellCount; i++) {
    cells.push({
      id: i,
      voltage: +(vBase + (Math.abs((hash * i * 13) % 100) / 100) * 1.5).toFixed(1),
      temperature: seed(i * 7, 28, 75),
    });
  }

  const charge = seed(5, 10, 100);
  const health = seed(6, 60, 100);
  const soh = seed(8, 55, 100);
  const cycles = seed(9, 5, 500);
  const current = seedF(11, 2, 50);
  const temperature = seed(12, 30, 85);
  const sumVolt = +(cells.reduce((s, c) => s + c.voltage, 0)).toFixed(1);
  const mosTemp = seed(13, 1, 15);

  const tempSensors = [];
  const sensorCount = seed(14, 2, 6);
  for (let i = 0; i < sensorCount; i++) {
    tempSensors.push(seed(15 + i, 28, 65));
  }

  const statusMessages = [
    'All systems normal', 'Cell volt high level 2', 'Moderate temperature rise',
    'Low charge warning', 'Cell balancing in progress', 'Overcharge protection triggered',
  ];
  const statusCount = seed(20, 0, 3);
  const statusMsg = statusMessages[Math.abs(hash * 5) % statusMessages.length];

  const times = ['6am', '8am', '10am', '12pm', '2pm', '4pm', '6pm', '8pm', '10pm', '12am', '2am'];
  const chargeHistory = times.map((time, i) => ({
    time,
    value: Math.min(100, Math.max(5, charge + seed(30 + i, -30, 30))),
  }));

  const manufacturers = [
    { name: 'Yuasa Battery Co. Ltd.', plant: 'Bangalore, Karnataka' },
    { name: 'Lithium Pro Energy Systems Pvt. Ltd.', plant: 'Noida, Uttar Pradesh' },
    { name: 'EV Power Cell Industries', plant: 'Ahmedabad, Gujarat' },
    { name: 'Exide Industries Ltd.', plant: 'Kolkata, West Bengal' },
    { name: 'Amaron Battery Corp.', plant: 'Tirupati, Andhra Pradesh' },
    { name: 'Tata Green Batteries', plant: 'Pune, Maharashtra' },
    { name: 'Luminous Power Technologies', plant: 'Manesar, Haryana' },
    { name: 'Okaya Power Pvt. Ltd.', plant: 'Greater Noida, Uttar Pradesh' },
    { name: 'Livguard Energy Technologies', plant: 'Gurugram, Haryana' },
    { name: 'Coslight India Technology', plant: 'Chennai, Tamil Nadu' },
  ];
  const mfgIdx = Math.abs(hash * 7) % manufacturers.length;
  const mfg = manufacturers[mfgIdx];

  const chemistries = [
    'Lithium Iron Phosphate (LiFePO4)', 'Lithium Nickel Manganese Cobalt (NMC)',
    'Lithium Titanate (LTO)', 'Lithium Cobalt Oxide (LCO)', 'Lithium Manganese Oxide (LMO)',
  ];
  const chemIdx = Math.abs(hash * 9) % chemistries.length;

  const prodYear = 2023 + Math.abs(hash * 11) % 3;
  const prodMonth = 1 + Math.abs(hash * 13) % 12;
  const prodDay = 1 + Math.abs(hash * 17) % 28;
  const prodDate = `${prodYear}-${String(prodMonth).padStart(2, '0')}-${String(prodDay).padStart(2, '0')}`;

  const batchLetter = String.fromCharCode(65 + Math.abs(hash * 19) % 26);
  const batchNum = String(Math.abs(hash * 23) % 999).padStart(3, '0');
  const batchNumber = `BATCH-${prodYear}-${String(prodMonth).padStart(2, '0')}-${batchLetter}${batchNum}`;

  const mfgCode = brand.split(' ').map(w => w[0]).join('').substring(0, 3).toUpperCase();
  const manufacturerCode = `${mfgCode}-IND-${String(Math.abs(hash) % 10000).padStart(4, '0')}`;

  const maxV = +(nominalVoltage * 1.2).toFixed(1);
  const minV = +(nominalVoltage * 0.8).toFixed(1);

  const warrantyYears = type === 'bus' ? 3 : 2;
  const warrantyYear = prodYear + warrantyYears;
  const warrantyExpiry = `${warrantyYear}-${String(prodMonth).padStart(2, '0')}-${String(prodDay).padStart(2, '0')}`;

  const weightKg = type === 'bus' ? seedF(40, 25, 45) : type === 'truck' ? seedF(41, 6, 15) : seedF(41, 3, 12);
  const dimL = type === 'bus' ? seed(42, 400, 600) : type === 'truck' ? seed(42, 220, 300) : seed(42, 180, 280);
  const dimW = type === 'bus' ? seed(43, 200, 300) : type === 'truck' ? seed(43, 150, 200) : seed(43, 120, 180);
  const dimH = type === 'bus' ? seed(44, 180, 250) : type === 'truck' ? seed(44, 180, 240) : seed(44, 150, 220);

  const allCerts = ['BIS IS 16893:2018', 'AIS-156', 'IEC 62660-1', 'UN38.3', 'ISO 12405'];
  const certCount = 2 + Math.abs(hash * 29) % 4;
  const certifications = allCerts.slice(0, certCount);

  return {
    serialNumber, name, brand, type, charge, temperature, voltage: nominalVoltage,
    health, cycles, capacity, status: health >= 70 ? 'Active' : 'Inactive',
    cells, soh, current, sumVolt, mosTemperature: mosTemp, temperatures: tempSensors,
    statusInfo: { count: statusCount, message: statusMsg }, chargeHistory,
    manufacturer: mfg.name, manufacturerCode, productionDate: prodDate, batchNumber,
    cellChemistry: chemistries[chemIdx], nominalVoltage: `${nominalVoltage}V`,
    maxVoltage: `${maxV}V`, minVoltage: `${minV}V`, weight: `${weightKg} kg`,
    dimensions: `${dimL} x ${dimW} x ${dimH} mm`, certifications, warrantyExpiry,
    countryOfOrigin: 'India', plantLocation: mfg.plant,
  };
}

// ============ Battery API Routes ============

app.get('/api/batteries/:serialNumber', (req, res) => {
  const { serialNumber } = req.params;
  const upperSerial = serialNumber.toUpperCase();
  if (!batteryDatabase[upperSerial]) {
    batteryDatabase[upperSerial] = generateBatteryFromSerial(upperSerial);
  }
  res.json({ battery: batteryDatabase[upperSerial] });
});

app.post('/api/batteries/add', (req, res) => {
  const { serialNumber, userId, scanType } = req.body;
  if (!serialNumber) {
    return res.status(400).json({ error: 'Serial number is required' });
  }
  const upperSerial = serialNumber.toUpperCase();
  if (!batteryDatabase[upperSerial]) {
    batteryDatabase[upperSerial] = generateBatteryFromSerial(upperSerial);
  }
  const battery = batteryDatabase[upperSerial];
  const uid = userId || 'default';
  if (!userBatteries[uid]) userBatteries[uid] = [];
  if (!userBatteries[uid].includes(upperSerial)) userBatteries[uid].push(upperSerial);
  const type = scanType || 'audit';
  if (!userBatteryScanTypes[uid]) userBatteryScanTypes[uid] = {};
  userBatteryScanTypes[uid][upperSerial] = type;
  res.json({ message: 'Battery added successfully', battery: { ...battery, scanType: type }, scanType: type });
});

app.get('/api/user/:userId/batteries', (req, res) => {
  const { userId } = req.params;
  const serials = userBatteries[userId] || [];
  const scanTypes = userBatteryScanTypes[userId] || {};
  const batteries = serials
    .map((sn) => {
      const bat = batteryDatabase[sn];
      if (!bat) return null;
      return { ...bat, scanType: scanTypes[sn] || 'audit' };
    })
    .filter(Boolean);
  res.json({ batteries });
});

app.get('/api/batteries/:serialNumber/analysis', (req, res) => {
  const { serialNumber } = req.params;
  const upperSerial = serialNumber.toUpperCase();
  if (!batteryDatabase[upperSerial]) {
    batteryDatabase[upperSerial] = generateBatteryFromSerial(upperSerial);
  }
  const battery = batteryDatabase[upperSerial];
  res.json({
    ...battery,
    normalRange: { voltage: { min: 2.5, max: 8.0 }, temperature: { min: 29, max: 87 } },
  });
});

app.post('/api/batteries/qr-analysis', (req, res) => {
  const { qrRaw, decoded } = req.body;
  if (!decoded || !decoded.serialNumber) {
    return res.status(400).json({ error: 'Missing decoded QR data' });
  }

  const upperSerial = decoded.serialNumber.toUpperCase();

  if (batteryDatabase[upperSerial]) {
    const battery = batteryDatabase[upperSerial];
    return res.json({
      ...battery,
      normalRange: { voltage: { min: 2.5, max: 8.0 }, temperature: { min: 29, max: 87 } },
    });
  }

  const qrUpper = (qrRaw || '').toUpperCase();
  if (qrUpper && batteryDatabase[qrUpper]) {
    const battery = batteryDatabase[qrUpper];
    return res.json({
      ...battery,
      normalRange: { voltage: { min: 2.5, max: 8.0 }, temperature: { min: 29, max: 87 } },
    });
  }

  const manufacturer = decoded.manufacturer || 'Unknown';
  const chemistry = decoded.chemistry || 'Unknown';
  const model = decoded.model || 'Unknown';
  const productType = decoded.productType || 'Cell';
  const productionDate = decoded.productionDate || '';
  const factoryAddress = decoded.factoryAddress || '';
  const productionLine = decoded.productionLine || '';
  const taskCode = decoded.taskCode || '';
  const factoryIdentifier = decoded.factoryIdentifier || '';

  const chemData = {
    'LFP (LiFePO4)':                  { voltage: 3.2, maxV: 3.65, minV: 2.5, chemFull: 'Lithium Iron Phosphate (LiFePO4)' },
    'NMC (Nickel Manganese Cobalt)':   { voltage: 3.7, maxV: 4.2,  minV: 2.7, chemFull: 'Lithium Nickel Manganese Cobalt (NMC)' },
    'NCA (Nickel Cobalt Aluminium)':   { voltage: 3.6, maxV: 4.2,  minV: 2.5, chemFull: 'Lithium Nickel Cobalt Aluminium (NCA)' },
    'LTO (Lithium Titanate)':          { voltage: 2.4, maxV: 2.8,  minV: 1.8, chemFull: 'Lithium Titanate (LTO)' },
    'LMO (Lithium Manganese Oxide)':   { voltage: 3.7, maxV: 4.2,  minV: 2.5, chemFull: 'Lithium Manganese Oxide (LMO)' },
    'LCO (Lithium Cobalt Oxide)':      { voltage: 3.6, maxV: 4.2,  minV: 2.7, chemFull: 'Lithium Cobalt Oxide (LCO)' },
    'Sodium-Ion':                      { voltage: 3.1, maxV: 3.8,  minV: 2.0, chemFull: 'Sodium-Ion (Na-Ion)' },
    'Solid-State':                     { voltage: 3.8, maxV: 4.35, minV: 2.7, chemFull: 'Solid-State Lithium' },
  };
  const chem = chemData[chemistry] || { voltage: 3.2, maxV: 3.65, minV: 2.5, chemFull: chemistry };

  const modelCap = { 'LF280K': 280, 'LF304': 304, 'LF272': 272, 'LF50': 50, 'LF60': 60, 'MB31': 314 };
  const capacity = modelCap[model] || 280;
  const energyWh = +(capacity * chem.voltage).toFixed(1);

  const mfgCountry = {
    'CATL': 'China', 'Samsung SDI': 'South Korea', 'LG Energy Solution': 'South Korea',
    'Panasonic': 'Japan', 'SK Innovation': 'South Korea', 'AESC (Envision)': 'Japan',
    'Gotion High-Tech': 'China', 'CALB': 'China', 'BYD': 'China',
    'Lishen': 'China', 'Sunwoda': 'China', 'Farasis Energy': 'China',
    'Svolt Energy': 'China', 'Rept Battero': 'China', 'Coslight': 'China',
    'Toshiba': 'Japan', 'Murata': 'Japan', 'EVE': 'China',
    'Phylion': 'China', 'BAK Battery': 'China', 'Highstar': 'China',
    'Great Power': 'China', 'Ampere': 'India', 'Exide': 'India',
  };
  const country = mfgCountry[manufacturer] || 'Unknown';

  const cellCount = 9;
  const cells = [];
  for (let i = 1; i <= cellCount; i++) {
    cells.push({
      id: i,
      voltage: +(chem.voltage + (Math.random() * 0.04 - 0.02)).toFixed(2),
      temperature: Math.floor(28 + Math.random() * 5),
    });
  }

  const mfgCode = decoded.manufacturerCode || '';
  const batchNumber = qrRaw || `${mfgCode}${decoded.productTypeCode || ''}${decoded.chemistryCode || ''}${decoded.modelCode || ''}${productionLine}${taskCode}`;

  const battery = {
    serialNumber: upperSerial,
    name: `${productType} - ${model}`,
    brand: manufacturer,
    type: 'other',
    charge: 95,
    temperature: 30,
    voltage: chem.voltage,
    health: 99,
    cycles: 3,
    capacity,
    status: 'Active',
    manufacturer: manufacturer.includes('Unknown') ? manufacturer : `${manufacturer} Energy Co. Ltd`,
    manufacturerCode: `${mfgCode}-${decoded.modelCode || ''}`,
    productionDate,
    batchNumber,
    cellChemistry: chem.chemFull,
    nominalVoltage: `${chem.voltage}V`,
    maxVoltage: `${chem.maxV}V`,
    minVoltage: `${chem.minV}V`,
    weight: capacity > 200 ? '5.43 kg' : capacity > 100 ? '3.2 kg' : '1.5 kg',
    dimensions: capacity > 200 ? '174 x 71 x 207 mm' : capacity > 100 ? '148 x 52 x 95 mm' : '65 x 26 x 18 mm',
    certifications: ['UN38.3', 'IEC 62660-1', 'UL 1973', 'BIS IS 16893:2018'],
    warrantyExpiry: productionDate ? (() => {
      const parts = productionDate.match(/(\w+)\s+(\d+),?\s+(\d+)/);
      if (!parts) return '';
      const d = new Date(productionDate);
      if (isNaN(d.getTime())) return '';
      d.setFullYear(d.getFullYear() + 5);
      return d.toISOString().split('T')[0];
    })() : '',
    countryOfOrigin: country,
    plantLocation: factoryAddress || 'N/A',
    model,
    energyCapacity: `${energyWh} Wh`,
    cellType: productType === 'Cell' ? 'Rechargeable Li-ion Cell' : productType,
    cells,
    soh: 99,
    current: 0.3,
    sumVolt: +(cells.reduce((s, c) => s + c.voltage, 0)).toFixed(1),
    mosTemperature: 2,
    temperatures: [30, 31, 29, 31],
    statusInfo: { count: 0, message: 'All systems normal' },
    chargeHistory: [
      { time: '6am', value: 92 }, { time: '8am', value: 93 },
      { time: '10am', value: 94 }, { time: '12pm', value: 95 },
      { time: '2pm', value: 96 }, { time: '4pm', value: 95 },
      { time: '6pm', value: 94 }, { time: '8pm', value: 93 },
      { time: '10pm', value: 94 }, { time: '12am', value: 93 },
      { time: '2am', value: 95 },
    ],
  };

  batteryDatabase[upperSerial] = battery;
  if (qrUpper) batteryDatabase[qrUpper] = battery;

  res.json({
    ...battery,
    normalRange: { voltage: { min: 2.5, max: 8.0 }, temperature: { min: 29, max: 87 } },
  });
});

// ============ Cell Audit Routes (Neon DB) ============

app.post('/api/audits', async (req, res) => {
  try {
    const audit = await saveAuditToDB(req.body);
    res.status(201).json({ success: true, audit });
  } catch (err) {
    if (err.message?.includes('unique') || err.message?.includes('duplicate')) {
      return res.status(409).json({ success: false, message: 'Audit already exists for this ID' });
    }
    console.error('Save audit error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to save audit' });
  }
});

app.get('/api/audits/serial/:serialNumber', async (req, res) => {
  try {
    const audits = await getAuditBySerial(req.params.serialNumber);
    res.json({ success: true, audits });
  } catch (err) {
    console.error('Get audits error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch audits' });
  }
});

app.get('/api/audits/:auditId', async (req, res) => {
  try {
    const audit = await getAuditById(req.params.auditId);
    if (!audit) return res.status(404).json({ success: false, message: 'Audit not found' });
    res.json({ success: true, audit });
  } catch (err) {
    console.error('Get audit error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch audit' });
  }
});

app.get('/api/audits', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = Math.max(parseInt(req.query.offset) || 0, 0);
    const audits = await getAllAudits(limit, offset);
    res.json({ success: true, audits });
  } catch (err) {
    console.error('List audits error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to list audits' });
  }
});

app.patch('/api/audits/:auditId/certificate', async (req, res) => {
  try {
    const { certificateNumber } = req.body;
    if (!certificateNumber) return res.status(400).json({ success: false, message: 'certificateNumber required' });
    const audit = await updateCertificate(req.params.auditId, certificateNumber);
    if (!audit) return res.status(404).json({ success: false, message: 'Audit not found' });
    res.json({ success: true, audit });
  } catch (err) {
    console.error('Update certificate error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to update certificate' });
  }
});

// Contact enquiry — sends email to Ai.evchamp@gmail.com
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, company, inquiryType, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'name, email and message are required' });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"EVChamp Enquiry" <${process.env.GMAIL_USER}>`,
      to: 'Ai.evchamp@gmail.com',
      replyTo: email,
      subject: `New Enquiry: ${inquiryType || 'General'} — ${name}`,
      html: `
        <h2>New Contact Enquiry</h2>
        <table cellpadding="8" style="border-collapse:collapse;font-family:sans-serif;font-size:14px">
          <tr><td><b>Name</b></td><td>${name}</td></tr>
          <tr><td><b>Email</b></td><td>${email}</td></tr>
          <tr><td><b>Company</b></td><td>${company || '—'}</td></tr>
          <tr><td><b>Inquiry Type</b></td><td>${inquiryType || '—'}</td></tr>
          <tr><td><b>Message</b></td><td style="white-space:pre-wrap">${message}</td></tr>
        </table>
      `,
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Contact email failed:', err.message);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Clerk user sync
app.post('/api/users/sync', async (req, res) => {
  try {
    const { clerkId, email, firstName, lastName, imageUrl } = req.body;
    if (!clerkId) return res.status(400).json({ error: 'clerkId is required' });
    const result = await getSQL()`
      INSERT INTO users (clerk_id, email, first_name, last_name, image_url, last_sign_in_at)
      VALUES (${clerkId}, ${email}, ${firstName}, ${lastName}, ${imageUrl}, NOW())
      ON CONFLICT (clerk_id) DO UPDATE SET
        email = EXCLUDED.email,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        image_url = EXCLUDED.image_url,
        last_sign_in_at = NOW()
      RETURNING *
    `;
    res.json({ success: true, user: result[0] });
  } catch (err) {
    console.error('User sync error:', err.message);
    res.status(500).json({ error: 'Failed to sync user' });
  }
});

// ============ ZeVault Credits ============
// Reads shared credits from the Zeflash Neon DB by user email.
// Both EVChamp and Zeflash share the same ZeVault credit balance.
let zeflashSql = null;
function getZeflashSQL() {
  if (!zeflashSql) {
    const url = process.env.ZEFLASH_DATABASE_URL;
    if (!url) throw new Error('ZEFLASH_DATABASE_URL is not configured');
    zeflashSql = neon(url);
  }
  return zeflashSql;
}

app.get('/api/zevault-credits', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing Authorization header' });
    }
    const token = authHeader.split(' ')[1];

    // Verify Clerk JWT using evchamp's Clerk secret key
    const clerkSecretKey = process.env.CLERK_SECRET_KEY;
    if (!clerkSecretKey) {
      return res.status(500).json({ error: 'Server auth not configured' });
    }

    const payload = await verifyToken(token, { secretKey: clerkSecretKey });
    const clerkUserId = payload.sub;

    // Resolve user email from Clerk
    const clerkClient = createClerkClient({ secretKey: clerkSecretKey });
    const clerkUser = await clerkClient.users.getUser(clerkUserId);
    const email = clerkUser.emailAddresses?.[0]?.emailAddress;
    if (!email) {
      return res.status(400).json({ error: 'No email associated with this account' });
    }

    // Look up credits in zeflash Neon DB by email
    const zsql = getZeflashSQL();
    const rows = await zsql`
      SELECT c.remaining, c.total, c.used
      FROM "Credit" c
      JOIN "User" u ON u.id = c."userId"
      WHERE u.email = ${email}
      LIMIT 1
    `;

    if (rows.length === 0) {
      // User has no credits record yet in zeflash (hasn't used the service)
      return res.json({ remaining: 0, total: 0, used: 0 });
    }

    return res.json({
      remaining: rows[0].remaining,
      total: rows[0].total,
      used: rows[0].used,
    });
  } catch (err) {
    console.error('[ZeVault Credits Error]', err.message);
    return res.status(500).json({ error: 'Unable to load your credits right now.' });
  }
});

module.exports = app;
