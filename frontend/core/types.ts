/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PersonalInfo {
  age: number;
  gender: string;
  maritalStatus: string;
  education: string;
  distanceFromOffice: number; // in km
  dependents: number;
}

export interface EmploymentDetails {
  department: string;
  jobRole: string;
  jobLevel: number; // 1 to 5
  yearsAtCompany: number;
  yearsInCurrentRole: number;
  yearsSinceLastPromotion: number;
  yearsWithCurrentManager: number;
  employmentType: 'Full-time' | 'Part-time' | 'Contract';
}

export interface Compensation {
  salary: number; // annual
  bonus: number;
  incentives: number;
  benefitsSatisfaction: number; // 1 to 5
  estimatedMarketSalary: number;
  salaryGap: number; // estimatedMarketSalary - salary
}

export interface Performance {
  performanceRating: number; // 1 to 5
  trainingHours: number;
  certifications: number;
  skillDevelopment: number; // 1 to 5
  projectSuccess: number; // 1 to 5
}

export interface Workload {
  weeklyWorkingHours: number;
  overtimeHours: number;
  numberOfProjects: number;
  businessTravelFrequency: 'Non-Travel' | 'Rarely' | 'Frequently';
  weekendWork: boolean;
}

export interface WorkEnvironment {
  jobSatisfaction: number; // 1 to 5
  workLifeBalance: number; // 1 to 5
  managerRelationship: number; // 1 to 5
  teamCollaboration: number; // 1 to 5
  recognitionScore: number; // 1 to 5
  companyCultureRating: number; // 1 to 5
  employeeEngagement: number; // 1 to 5
  inclusionFairnessSurveyScore: number; // 1 to 5
  stressLevel: number; // 1 to 5
}

export interface Attendance {
  leaveRecords: number; // number of days taken
  absenteeism: number; // unexcused absences
  lateArrivals: number;
}

export interface FeatureContribution {
  featureName: string;
  displayName: string;
  category: 'Personal' | 'Employment' | 'Compensation' | 'Performance' | 'Workload' | 'Environment' | 'Attendance';
  shapValue: number; // positive increases risk, negative decreases risk
  currentValue: string | number;
}

export interface AttritionReasonProbability {
  reason: string;
  probability: number; // 0 to 100
  category: string;
  description: string;
}

export interface AttritionReasonPrediction {
  primaryReason: string;
  confidence: number;
  reasonProbabilities: AttritionReasonProbability[];
  reasoning: string;
}

export interface RiskAnalysis {
  probability: number; // 0 to 100
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  confidence: number; // 0 to 100
  topDrivers: string[]; // array of risk-increasing features
  contributions: FeatureContribution[]; // SHAP-like breakdown
  recommendations: string[];
  aiSummary?: string; // Cache for Gemini generation
  reasonPrediction?: AttritionReasonPrediction; // New predicted leave reason object
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  personal: PersonalInfo;
  employment: EmploymentDetails;
  compensation: Compensation;
  performance: Performance;
  workload: Workload;
  environment: WorkEnvironment;
  attendance: Attendance;
  analysis?: RiskAnalysis;
  baseline?: {
    salary: number;
    overtimeHours: number;
    workLifeBalance: number;
    managerRelationship: number;
    jobSatisfaction: number;
    recognitionScore: number;
  };
}

export interface AnalyticsSummary {
  overallRiskCounts: {
    Low: number;
    Medium: number;
    High: number;
    Critical: number;
  };
  departmentRisk: {
    department: string;
    avgProbability: number;
    headcount: number;
    criticalCount: number;
  }[];
  roleRisk: {
    jobRole: string;
    avgProbability: number;
    headcount: number;
  }[];
  travelRisk: {
    frequency: string;
    avgProbability: number;
  }[];
  overtimeRisk: {
    hasOvertime: string;
    avgProbability: number;
  }[];
  tenureRisk: {
    range: string;
    avgProbability: number;
  }[];
  promotionRisk: {
    yearsSincePromotion: string;
    avgProbability: number;
  }[];
  salaryGapRisk: {
    gapRange: string;
    avgProbability: number;
  }[];
  overallDrivers: {
    featureName: string;
    displayName: string;
    avgContribution: number;
  }[];
}

export interface ImputedFieldDetail {
  count: number;
  method: 'mean' | 'median' | 'mode' | 'fallback';
}

export interface DataCleaningReport {
  originalRowCount: number;
  validRowCount: number;
  removedRowCount: number;
  removedColumns: string[];
  imputedValuesCount: number;
  imputedFields: Record<string, ImputedFieldDetail>;
  monthlySalaryConverted?: boolean;
}
