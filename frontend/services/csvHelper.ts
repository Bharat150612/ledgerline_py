/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Employee, DataCleaningReport, ImputedFieldDetail } from '../core/types.js';
import * as XLSX from 'xlsx';

// Mappings for standard personnel fields
const recognizedHeaderMappings: Record<string, string[]> = {
  id: ['id', 'employeeid', 'empid'],
  name: ['name', 'employeename', 'fullname'],
  email: ['email', 'emailaddress'],
  age: ['age'],
  gender: ['gender', 'sex'],
  maritalStatus: ['maritalstatus', 'marriage'],
  education: ['education', 'degree'],
  distanceFromOffice: ['distancefromoffice', 'commute', 'distance'],
  dependents: ['dependents', 'children'],
  department: ['department', 'dept'],
  jobRole: ['jobrole', 'role', 'title'],
  jobLevel: ['joblevel', 'level'],
  yearsAtCompany: ['yearsatcompany', 'tenure'],
  yearsInCurrentRole: ['yearsincurrentrole'],
  yearsSinceLastPromotion: ['yearssincelastpromotion', 'promotiongap'],
  yearsWithCurrentManager: ['yearswithcurrentmanager'],
  employmentType: ['employmenttype', 'type'],
  salary: ['salary', 'annualsalary', 'pay'],
  bonus: ['bonus'],
  incentives: ['incentives'],
  benefitsSatisfaction: ['benefitssatisfaction'],
  estimatedMarketSalary: ['estimatedmarketsalary', 'marketsalary'],
  performanceRating: ['performancerating', 'rating'],
  trainingHours: ['traininghours'],
  certifications: ['certifications'],
  skillDevelopment: ['skilldevelopment'],
  projectSuccess: ['projectsuccess'],
  weeklyWorkingHours: ['weeklyworkinghours', 'hours'],
  overtimeHours: ['overtimehours', 'overtime'],
  numberOfProjects: ['numberofprojects', 'projects'],
  businessTravelFrequency: ['businesstravel', 'travel'],
  weekendWork: ['weekendwork', 'weekend'],
  jobSatisfaction: ['jobsatisfaction', 'satisfaction'],
  workLifeBalance: ['worklifebalance', 'wlb'],
  managerRelationship: ['managerrelationship', 'manager'],
  teamCollaboration: ['teamcollaboration'],
  recognitionScore: ['recognitionscore', 'recognition'],
  companyCultureRating: ['companyculturerating', 'culture'],
  employeeEngagement: ['employeeengagement', 'engagement'],
  inclusionFairnessSurveyScore: ['inclusionfairness'],
  stressLevel: ['stresslevel', 'stress'],
  leaveRecords: ['leaverecords', 'leaves'],
  absenteeism: ['absenteeism'],
  lateArrivals: ['latearrivals']
};

// Create list of allowed clean aliases to detect unnecessary columns
const templateHeadersClean = Object.keys(recognizedHeaderMappings).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
const allowedAliases = Object.values(recognizedHeaderMappings).flat().map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
const allAllowedClean = new Set([...templateHeadersClean, ...allowedAliases]);

interface RawEmployee {
  id: string;
  name: string;
  email: string;
  personal: {
    age: number | null;
    gender: string | null;
    maritalStatus: string | null;
    education: string | null;
    distanceFromOffice: number | null;
    dependents: number | null;
  };
  employment: {
    department: string;
    jobRole: string | null;
    jobLevel: number | null;
    yearsAtCompany: number | null;
    yearsInCurrentRole: number | null;
    yearsSinceLastPromotion: number | null;
    yearsWithCurrentManager: number | null;
    employmentType: 'Full-time' | 'Part-time' | 'Contract' | null;
  };
  compensation: {
    salary: number | null;
    bonus: number | null;
    incentives: number | null;
    benefitsSatisfaction: number | null;
    estimatedMarketSalary: number | null;
  };
  performance: {
    performanceRating: number | null;
    trainingHours: number | null;
    certifications: number | null;
    skillDevelopment: number | null;
    projectSuccess: number | null;
  };
  workload: {
    weeklyWorkingHours: number | null;
    overtimeHours: number | null;
    numberOfProjects: number | null;
    businessTravelFrequency: 'Non-Travel' | 'Rarely' | 'Frequently' | null;
    weekendWork: boolean | null;
  };
  environment: {
    jobSatisfaction: number | null;
    workLifeBalance: number | null;
    managerRelationship: number | null;
    teamCollaboration: number | null;
    recognitionScore: number | null;
    companyCultureRating: number | null;
    employeeEngagement: number | null;
    inclusionFairnessSurveyScore: number | null;
    stressLevel: number | null;
  };
  attendance: {
    leaveRecords: number | null;
    absenteeism: number | null;
    lateArrivals: number | null;
  };
}

function isMissing(val: string | null | undefined): boolean {
  if (val === null || val === undefined) return true;
  const v = val.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
  return (
    v === '' ||
    v === 'na' ||
    v === 'n-a' ||
    v === 'null' ||
    v === 'nan' ||
    v === 'none' ||
    v === 'nil' ||
    v === '-' ||
    v === 'undefined'
  );
}

function parseNumericVal(val: string): number | null {
  if (isMissing(val)) return null;
  const cleaned = val.replace(/[\s,$₹%]/g, '');
  if (cleaned === '') return null;
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function parseStringVal(val: string): string | null {
  return isMissing(val) ? null : val.trim();
}

function parseBooleanVal(val: string): boolean | null {
  if (isMissing(val)) return null;
  const v = val.trim().toLowerCase();
  if (v === 'true' || v === 'yes' || v === '1') return true;
  if (v === 'false' || v === 'no' || v === '0') return false;
  return null;
}

/**
 * Maps a row from parsing tool into a raw employee structure.
 */
function mapRowToRawEmployee(
  getVal: (possibleHeaders: string[], defaultValue?: string) => string,
  i: number
): RawEmployee {
  const id = getVal(['id', 'employeeid', 'empid'], `EMP-${1000 + i}`);
  const name = getVal(['name', 'employeename', 'fullname'], `Employee ${i}`);
  const email = getVal(['email', 'emailaddress'], `${name.toLowerCase().replace(/\s+/g, '.')}@synergycorp.com`);

  const age = parseNumericVal(getVal(['age']));
  const gender = parseStringVal(getVal(['gender', 'sex']));
  const maritalStatus = parseStringVal(getVal(['maritalstatus', 'marriage']));
  const education = parseStringVal(getVal(['education', 'degree']));
  const distanceFromOffice = parseNumericVal(getVal(['distancefromoffice', 'commute', 'distance']));
  const dependents = parseNumericVal(getVal(['dependents', 'children']));

  const department = parseStringVal(getVal(['department', 'dept'])) || 'Engineering';
  const jobRole = parseStringVal(getVal(['jobrole', 'role', 'title']));
  const jobLevel = parseNumericVal(getVal(['joblevel', 'level']));
  const yearsAtCompany = parseNumericVal(getVal(['yearsatcompany', 'tenure']));
  const yearsInCurrentRole = parseNumericVal(getVal(['yearsincurrentrole']));
  const yearsSinceLastPromotion = parseNumericVal(getVal(['yearssincelastpromotion', 'promotiongap']));
  const yearsWithCurrentManager = parseNumericVal(getVal(['yearswithcurrentmanager']));
  
  const employmentTypeRaw = parseStringVal(getVal(['employmenttype', 'type']));
  const employmentType = (['Full-time', 'Part-time', 'Contract'].includes(employmentTypeRaw || '') 
    ? employmentTypeRaw 
    : null) as 'Full-time' | 'Part-time' | 'Contract' | null;

  const salary = parseNumericVal(getVal(['salary', 'annualsalary', 'pay']));
  const bonus = parseNumericVal(getVal(['bonus']));
  const incentives = parseNumericVal(getVal(['incentives']));
  const benefitsSatisfaction = parseNumericVal(getVal(['benefitssatisfaction']));
  const estimatedMarketSalary = parseNumericVal(getVal(['estimatedmarketsalary', 'marketsalary']));

  const performanceRating = parseNumericVal(getVal(['performancerating', 'rating']));
  const trainingHours = parseNumericVal(getVal(['traininghours']));
  const certifications = parseNumericVal(getVal(['certifications']));
  const skillDevelopment = parseNumericVal(getVal(['skilldevelopment']));
  const projectSuccess = parseNumericVal(getVal(['projectsuccess']));

  const weeklyWorkingHours = parseNumericVal(getVal(['weeklyworkinghours', 'hours']));
  const overtimeHours = parseNumericVal(getVal(['overtimehours', 'overtime']));
  const numberOfProjects = parseNumericVal(getVal(['numberofprojects', 'projects']));
  
  const businessTravelRaw = parseStringVal(getVal(['businesstravel', 'travel']));
  const businessTravelFrequency = (['Non-Travel', 'Rarely', 'Frequently'].includes(businessTravelRaw || '')
    ? businessTravelRaw
    : null) as 'Non-Travel' | 'Rarely' | 'Frequently' | null;
  
  const weekendWork = parseBooleanVal(getVal(['weekendwork', 'weekend']));

  const jobSatisfaction = parseNumericVal(getVal(['jobsatisfaction', 'satisfaction']));
  const workLifeBalance = parseNumericVal(getVal(['worklifebalance', 'wlb']));
  const managerRelationship = parseNumericVal(getVal(['managerrelationship', 'manager']));
  const teamCollaboration = parseNumericVal(getVal(['teamcollaboration']));
  const recognitionScore = parseNumericVal(getVal(['recognitionscore', 'recognition']));
  const companyCultureRating = parseNumericVal(getVal(['companyculturerating', 'culture']));
  const employeeEngagement = parseNumericVal(getVal(['employeeengagement', 'engagement']));
  const inclusionFairnessSurveyScore = parseNumericVal(getVal(['inclusionfairness']));
  const stressLevel = parseNumericVal(getVal(['stresslevel', 'stress']));

  const leaveRecords = parseNumericVal(getVal(['leaverecords', 'leaves']));
  const absenteeism = parseNumericVal(getVal(['absenteeism']));
  const lateArrivals = parseNumericVal(getVal(['latearrivals']));

  return {
    id,
    name,
    email,
    personal: { age, gender, maritalStatus, education, distanceFromOffice, dependents },
    employment: { department, jobRole, jobLevel, yearsAtCompany, yearsInCurrentRole, yearsSinceLastPromotion, yearsWithCurrentManager, employmentType },
    compensation: { salary, bonus, incentives, benefitsSatisfaction, estimatedMarketSalary },
    performance: { performanceRating, trainingHours, certifications, skillDevelopment, projectSuccess },
    workload: { weeklyWorkingHours, overtimeHours, numberOfProjects, businessTravelFrequency, weekendWork },
    environment: { jobSatisfaction, workLifeBalance, managerRelationship, teamCollaboration, recognitionScore, companyCultureRating, employeeEngagement, inclusionFairnessSurveyScore, stressLevel },
    attendance: { leaveRecords, absenteeism, lateArrivals }
  };
}

function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 !== 0) {
    return sorted[mid];
  }
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function calculateMode(values: string[]): string {
  if (values.length === 0) return '';
  const counts: Record<string, number> = {};
  let maxCount = 0;
  let mode = values[0];
  for (const v of values) {
    if (!v) continue;
    counts[v] = (counts[v] || 0) + 1;
    if (counts[v] > maxCount) {
      maxCount = counts[v];
      mode = v;
    }
  }
  return mode;
}

function calculateImputedValue(values: number[], fieldName: string): number {
  if (values.length === 0) return 0;
  const meanFields = ['salary', 'bonus', 'estimatedmarketsalary', 'distancefromoffice', 'traininghours', 'weeklyworkinghours', 'leaverecords'];
  const cleanName = fieldName.toLowerCase().replace(/[^a-z]/g, '');
  if (meanFields.includes(cleanName)) {
    return calculateMean(values);
  }
  return calculateMedian(values);
}

function cloneRawEmployee(emp: RawEmployee): RawEmployee {
  return {
    id: emp.id,
    name: emp.name,
    email: emp.email,
    personal: { ...emp.personal },
    employment: { ...emp.employment },
    compensation: { ...emp.compensation },
    performance: { ...emp.performance },
    workload: { ...emp.workload },
    environment: { ...emp.environment },
    attendance: { ...emp.attendance }
  };
}

/**
 * Performs data cleaning and imputation using mean/median/mode aggregated by department.
 */
function cleanEmployeeData(rawEmployees: RawEmployee[]): { 
  employees: Employee[]; 
  imputationDetails: { totalImputed: number; fields: Record<string, ImputedFieldDetail> }; 
  monthlySalaryConverted: boolean;
} {
  const imputationDetails = {
    totalImputed: 0,
    fields: {} as Record<string, ImputedFieldDetail>
  };

  // ── Monthly salary auto-detection ────────────────────────────────────────
  // If the dataset's median salary is below 25,000, it is almost certainly
  // expressed as a monthly figure rather than annual. Multiply by 12.
  const salaryValues = rawEmployees
    .map(e => e.compensation.salary)
    .filter((v): v is number => v !== null && v !== undefined && !isNaN(v));
  const medianSalary = salaryValues.length > 0 ? calculateMedian(salaryValues) : 0;
  const monthlySalaryConverted = medianSalary > 0 && medianSalary < 25000;
  if (monthlySalaryConverted) {
    for (const emp of rawEmployees) {
      if (emp.compensation.salary !== null && emp.compensation.salary !== undefined) {
        emp.compensation.salary = emp.compensation.salary * 12;
      }
      if (emp.compensation.estimatedMarketSalary !== null && emp.compensation.estimatedMarketSalary !== undefined) {
        emp.compensation.estimatedMarketSalary = emp.compensation.estimatedMarketSalary * 12;
      }
      if (emp.compensation.bonus !== null && emp.compensation.bonus !== undefined && emp.compensation.bonus < 25000) {
        emp.compensation.bonus = emp.compensation.bonus * 12;
      }
    }
  }
  const depts: Record<string, RawEmployee[]> = {};
  for (const emp of rawEmployees) {
    const dept = emp.employment.department;
    if (!depts[dept]) depts[dept] = [];
    depts[dept].push(emp);
  }

  // Paths mapping: [section, field, defaultFallback]
  const numericFieldPaths: [string, string, number][] = [
    ['personal', 'age', 32],
    ['personal', 'distanceFromOffice', 12],
    ['personal', 'dependents', 0],
    ['employment', 'jobLevel', 2],
    ['employment', 'yearsAtCompany', 3],
    ['employment', 'yearsInCurrentRole', 2],
    ['employment', 'yearsSinceLastPromotion', 1],
    ['employment', 'yearsWithCurrentManager', 2],
    ['compensation', 'salary', 90000],
    ['compensation', 'bonus', 6000],
    ['compensation', 'incentives', 0],
    ['compensation', 'benefitsSatisfaction', 4],
    ['compensation', 'estimatedMarketSalary', 95000],
    ['performance', 'performanceRating', 3],
    ['performance', 'trainingHours', 24],
    ['performance', 'certifications', 1],
    ['performance', 'skillDevelopment', 3],
    ['performance', 'projectSuccess', 3],
    ['workload', 'weeklyWorkingHours', 40],
    ['workload', 'overtimeHours', 0],
    ['workload', 'numberOfProjects', 3],
    ['environment', 'jobSatisfaction', 4],
    ['environment', 'workLifeBalance', 3],
    ['environment', 'managerRelationship', 4],
    ['environment', 'teamCollaboration', 4],
    ['environment', 'recognitionScore', 3],
    ['environment', 'companyCultureRating', 4],
    ['environment', 'employeeEngagement', 4],
    ['environment', 'inclusionFairnessSurveyScore', 4],
    ['environment', 'stressLevel', 2],
    ['attendance', 'leaveRecords', 8],
    ['attendance', 'absenteeism', 0],
    ['attendance', 'lateArrivals', 0]
  ];

  const stringFieldPaths: [string, string, string][] = [
    ['personal', 'gender', 'Male'],
    ['personal', 'maritalStatus', 'Single'],
    ['personal', 'education', 'Bachelor'],
    ['employment', 'jobRole', 'Software Engineer'],
    ['employment', 'employmentType', 'Full-time'],
    ['workload', 'businessTravelFrequency', 'Rarely']
  ];

  const booleanFieldPaths: [string, string, boolean][] = [
    ['workload', 'weekendWork', false]
  ];

  // Calculate global fallbacks
  const globalNumeric: Record<string, number> = {};
  const globalString: Record<string, string> = {};

  for (const [section, field, fallback] of numericFieldPaths) {
    const key = `${section}.${field}`;
    const vals = rawEmployees
      .map(emp => (emp as any)[section]?.[field])
      .filter(v => v !== null && v !== undefined) as number[];
    globalNumeric[key] = vals.length > 0 ? calculateImputedValue(vals, String(field)) : (fallback as number);
  }

  for (const [section, field, fallback] of stringFieldPaths) {
    const key = `${section}.${field}`;
    const vals = rawEmployees
      .map(emp => (emp as any)[section]?.[field])
      .filter(v => v !== null && v !== undefined && v !== '') as string[];
    globalString[key] = vals.length > 0 ? calculateMode(vals) : (fallback as string);
  }

  // Calculate department stats
  const deptStats: Record<string, {
    numeric: Record<string, number>;
    string: Record<string, string>;
    boolean: Record<string, boolean>;
  }> = {};

  for (const dept of Object.keys(depts)) {
    const deptEmps = depts[dept];
    const numeric: Record<string, number> = {};
    const string: Record<string, string> = {};
    const boolean: Record<string, boolean> = {};

    for (const [section, field] of numericFieldPaths) {
      const key = `${section}.${field}`;
      const vals = deptEmps
        .map(emp => (emp as any)[section]?.[field])
        .filter(v => v !== null && v !== undefined) as number[];
      numeric[key] = vals.length > 0 ? calculateImputedValue(vals, String(field)) : globalNumeric[key];
    }

    for (const [section, field] of stringFieldPaths) {
      const key = `${section}.${field}`;
      const vals = deptEmps
        .map(emp => (emp as any)[section]?.[field])
        .filter(v => v !== null && v !== undefined && v !== '') as string[];
      string[key] = vals.length > 0 ? calculateMode(vals) : globalString[key];
    }

    for (const [section, field, fallback] of booleanFieldPaths) {
      const key = `${section}.${field}`;
      const vals = deptEmps
        .map(emp => (emp as any)[section]?.[field])
        .filter(v => v !== null && v !== undefined) as boolean[];
      if (vals.length > 0) {
        const trueCount = vals.filter(v => v === true).length;
        boolean[key] = trueCount >= vals.length / 2;
      } else {
        boolean[key] = fallback;
      }
    }

    deptStats[dept] = { numeric, string, boolean };
  }

  // Map and fill missing values
  const employees = rawEmployees.map(emp => {
    const dept = emp.employment.department;
    const stats = deptStats[dept];
    const cleanEmp = cloneRawEmployee(emp);

    // Fill numeric
    for (const [section, field] of numericFieldPaths) {
      const val = cleanEmp[section][field];
      if (val === null || val === undefined || isNaN(val)) {
        cleanEmp[section][field] = stats.numeric[`${section}.${field}`];
        imputationDetails.totalImputed++;
        const key = `${section}.${field}`;
        const meanFields = ['salary', 'bonus', 'estimatedmarketsalary', 'distancefromoffice', 'traininghours', 'weeklyworkinghours', 'leaverecords'];
        const cleanName = field.toLowerCase().replace(/[^a-z]/g, '');
        const method = meanFields.includes(cleanName) ? 'mean' : 'median';
        if (!imputationDetails.fields[key]) {
          imputationDetails.fields[key] = { count: 0, method };
        }
        imputationDetails.fields[key].count++;
      }
    }

    // Fill string
    for (const [section, field] of stringFieldPaths) {
      if (cleanEmp[section][field] === null || cleanEmp[section][field] === undefined || cleanEmp[section][field] === '') {
        cleanEmp[section][field] = stats.string[`${section}.${field}`];
        imputationDetails.totalImputed++;
        const key = `${section}.${field}`;
        if (!imputationDetails.fields[key]) {
          imputationDetails.fields[key] = { count: 0, method: 'mode' };
        }
        imputationDetails.fields[key].count++;
      }
    }

    // Fill boolean
    for (const [section, field] of booleanFieldPaths) {
      if (cleanEmp[section][field] === null || cleanEmp[section][field] === undefined) {
        cleanEmp[section][field] = stats.boolean[`${section}.${field}`];
        imputationDetails.totalImputed++;
        const key = `${section}.${field}`;
        if (!imputationDetails.fields[key]) {
          imputationDetails.fields[key] = { count: 0, method: 'fallback' };
        }
        imputationDetails.fields[key].count++;
      }
    }

    // derived compensation fields
    const salary = cleanEmp.compensation.salary;
    const estimatedMarketSalary = cleanEmp.compensation.estimatedMarketSalary || (salary * 1.05);
    cleanEmp.compensation.estimatedMarketSalary = estimatedMarketSalary;
    cleanEmp.compensation.salaryGap = Math.max(0, estimatedMarketSalary - salary);

    // Baseline
    cleanEmp.baseline = {
      salary: cleanEmp.compensation.salary,
      overtimeHours: cleanEmp.workload.overtimeHours,
      workLifeBalance: cleanEmp.environment.workLifeBalance,
      managerRelationship: cleanEmp.environment.managerRelationship,
      jobSatisfaction: cleanEmp.environment.jobSatisfaction,
      recognitionScore: cleanEmp.environment.recognitionScore,
    };

    return cleanEmp as Employee;
  });

  return { employees, imputationDetails, monthlySalaryConverted };
}

/**
 * Parses raw CSV file text into an array of Employee records.
 */
export function parseCSVToEmployees(csvText: string): { employees: Employee[]; report: DataCleaningReport } {
  const lines: string[] = [];
  let currentLine = '';
  let inQuotes = false;
  
  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentLine += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === '\n' || char === '\r') {
      if (inQuotes) {
        currentLine += char;
      } else {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        lines.push(currentLine);
        currentLine = '';
      }
    } else {
      currentLine += char;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }

  if (lines.length < 2) {
    throw new Error("CSV file does not contain a header and a data row.");
  }

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let cell = '';
    let inside = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inside && line[i+1] === '"') {
          cell += '"';
          i++;
        } else {
          inside = !inside;
        }
      } else if (char === ',') {
        if (inside) {
          cell += ',';
        } else {
          result.push(cell.trim());
          cell = '';
        }
      } else {
        cell += char;
      }
    }
    result.push(cell.trim());
    return result;
  };

  const originalHeaders = parseLine(lines[0]);
  const headers = originalHeaders.map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
  
  // Identify and log ignored unnecessary headers
  const ignoredHeaders = originalHeaders.filter(h => {
    const clean = h.toLowerCase().replace(/[^a-z0-9]/g, '');
    return clean && !allAllowedClean.has(clean);
  });
  if (ignoredHeaders.length > 0) {
    console.log(`Ignoring unnecessary CSV columns: ${ignoredHeaders.join(', ')}`);
  }

  const rawEmployees: RawEmployee[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const row = parseLine(line);
    if (row.length === 0 || (row.length === 1 && row[0] === '')) continue;

    const getVal = (possibleHeaders: string[], defaultValue: string = ''): string => {
      for (const ph of possibleHeaders) {
        const cleanPh = ph.toLowerCase().replace(/[^a-z0-9]/g, '');
        const idx = headers.indexOf(cleanPh);
        if (idx !== -1 && idx < row.length) {
          return row[idx];
        }
      }
      return defaultValue;
    };

    rawEmployees.push(mapRowToRawEmployee(getVal, i));
  }

  const { employees, imputationDetails, monthlySalaryConverted } = cleanEmployeeData(rawEmployees);
  
  const originalRowCount = lines.length > 0 ? lines.length - 1 : 0;
  const report: DataCleaningReport = {
    originalRowCount,
    validRowCount: rawEmployees.length,
    removedRowCount: Math.max(0, originalRowCount - rawEmployees.length),
    removedColumns: ignoredHeaders,
    imputedValuesCount: imputationDetails.totalImputed,
    imputedFields: imputationDetails.fields,
    monthlySalaryConverted
  };

  return { employees, report };
}

/**
 * Parses raw Excel file buffer into an array of Employee records using the xlsx library.
 */
export function parseExcelToEmployees(arrayBuffer: ArrayBuffer): { employees: Employee[]; report: DataCleaningReport } {
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  if (!worksheet) {
    throw new Error("The uploaded Excel workbook contains no sheets.");
  }

  const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: '' });
  
  if (rows.length < 2) {
    throw new Error("Excel worksheet does not contain a header and a data row.");
  }

  const originalHeaders = rows[0];
  const headers = originalHeaders.map((h: any) => String(h || '').toLowerCase().replace(/[^a-z0-9]/g, ''));

  // Identify and log ignored unnecessary headers
  const ignoredHeaders = originalHeaders.filter((h: any) => {
    const clean = String(h || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    return clean && !allAllowedClean.has(clean);
  });
  if (ignoredHeaders.length > 0) {
    console.log(`Ignoring unnecessary Excel columns: ${ignoredHeaders.join(', ')}`);
  }

  const rawEmployees: RawEmployee[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0 || row.every(val => val === '')) continue;

    const getVal = (possibleHeaders: string[], defaultValue: string = ''): string => {
      for (const ph of possibleHeaders) {
        const cleanPh = ph.toLowerCase().replace(/[^a-z0-9]/g, '');
        const idx = headers.indexOf(cleanPh);
        if (idx !== -1 && idx < row.length) {
          const cellValue = row[idx];
          return cellValue !== undefined && cellValue !== null ? String(cellValue).trim() : defaultValue;
        }
      }
      return defaultValue;
    };

    rawEmployees.push(mapRowToRawEmployee(getVal, i));
  }

  const { employees, imputationDetails, monthlySalaryConverted } = cleanEmployeeData(rawEmployees);

  const originalRowCount = rows.length > 0 ? rows.length - 1 : 0;
  const report: DataCleaningReport = {
    originalRowCount,
    validRowCount: rawEmployees.length,
    removedRowCount: Math.max(0, originalRowCount - rawEmployees.length),
    removedColumns: ignoredHeaders,
    imputedValuesCount: imputationDetails.totalImputed,
    imputedFields: imputationDetails.fields,
    monthlySalaryConverted
  };

  return { employees, report };
}

/**
 * Downloads a sample CSV format structure that users can copy to populate Excel/CSV files.
 */
export function downloadSampleCSVTemplate() {
  const headers = Object.keys(recognizedHeaderMappings);
  const csvContent = headers.join(",");
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "employee_attrition_import_template.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
