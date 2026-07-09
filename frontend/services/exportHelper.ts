/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Employee, AnalyticsSummary } from '../core/types.js';
import { DbStatus } from './api.js';

/**
 * Downloads the raw employee dataset as a formatted JSON file.
 */
export function exportToJson(employees: Employee[]) {
  const blob = new Blob([JSON.stringify(employees, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'ledgerline_export.json';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Downloads the employee dataset as a clean, structured Excel spreadsheet.
 */
export function exportToExcel(employees: Employee[]) {
  const flattened = employees.map(emp => ({
    'Employee ID': emp.id,
    'Name': emp.name,
    'Email': emp.email,
    'Age': emp.personal.age,
    'Gender': emp.personal.gender,
    'Marital Status': emp.personal.maritalStatus,
    'Education': emp.personal.education,
    'Commute Distance (km)': emp.personal.distanceFromOffice,
    'Dependents': emp.personal.dependents,
    'Department': emp.employment.department,
    'Job Role': emp.employment.jobRole,
    'Job Level': emp.employment.jobLevel,
    'Years at Company': emp.employment.yearsAtCompany,
    'Years in Current Role': emp.employment.yearsInCurrentRole,
    'Years Since Promotion': emp.employment.yearsSinceLastPromotion,
    'Years with Manager': emp.employment.yearsWithCurrentManager,
    'Employment Type': emp.employment.employmentType,
    'Salary': emp.compensation.salary,
    'Bonus': emp.compensation.bonus,
    'Incentives': emp.compensation.incentives,
    'Benefits Satisfaction': emp.compensation.benefitsSatisfaction,
    'Estimated Market Salary': emp.compensation.estimatedMarketSalary,
    'Performance Rating': emp.performance.performanceRating,
    'Weekly Working Hours': emp.workload.weeklyWorkingHours,
    'Overtime Hours': emp.workload.overtimeHours,
    'Number of Projects': emp.workload.numberOfProjects,
    'Business Travel': emp.workload.businessTravelFrequency,
    'Weekend Work': emp.workload.weekendWork ? 'Yes' : 'No',
    'Job Satisfaction': emp.environment.jobSatisfaction,
    'Work-Life Balance': emp.environment.workLifeBalance,
    'Manager Relationship': emp.environment.managerRelationship,
    'Recognition Score': emp.environment.recognitionScore,
    'Stress Level': emp.environment.stressLevel,
    'Absenteeism (Days)': emp.attendance.absenteeism,
    'Late Arrivals': emp.attendance.lateArrivals,
    'Risk Probability (%)': emp.analysis?.probability ?? 'N/A',
    'Risk Level': emp.analysis?.riskLevel ?? 'N/A',
    'AI Model Confidence (%)': emp.analysis?.confidence ?? 'N/A',
    'Top Risk Drivers': emp.analysis?.topDrivers?.join(', ') ?? 'N/A',
    'Primary Leave Reason': emp.analysis?.reasonPrediction?.primaryReason ?? 'N/A',
  }));

  const worksheet = XLSX.utils.json_to_sheet(flattened);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Personnel Ledger');
  XLSX.writeFile(workbook, 'ledgerline_export.xlsx');
}

/**
 * Downloads a comprehensive, beautifully styled PDF Report containing
 * overall dashboard summaries, department summaries, and a detailed risk roster.
 */
export function exportToPdf(
  employees: Employee[],
  analytics: AnalyticsSummary | null,
  dbStatus: DbStatus | null
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryColor = [221, 161, 94]; // Kraft Caramel color: #dda15e
  const textColor = [20, 23, 28]; // Dark Slate text color
  const lightBg = [243, 239, 233]; // Parchment color: #f3efe9

  const criticalColor = [193, 80, 46]; // rust: #c1502e
  const highColor = [214, 154, 60]; // amber: #d69a3c
  const mediumColor = [111, 140, 168]; // fog: #6f8ca8
  const lowColor = [76, 139, 120]; // teal: #4c8b78

  // Helper for page headers
  const addHeader = (title: string, subtitle: string) => {
    // Top border accent bar
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(10, 10, 190, 3, 'F');

    // Title
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(title, 10, 21);

    // Subtitle
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text(subtitle, 10, 26);

    // Divider line
    doc.setDrawColor(210, 205, 195);
    doc.setLineWidth(0.3);
    doc.line(10, 29, 200, 29);
  };

  const addFooter = (pageNum: number) => {
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(140, 135, 125);
    doc.text(`Ledgerline Attrition Analytics Report  |  Confidential`, 10, 287);
    doc.text(`Page ${pageNum}`, 200, 287, { align: 'right' });
  };

  // --- PAGE 1: COVER & EXECUTIVE SUMMARY ---
  // Top Border Accent
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 8, 'F');

  // Title Block
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(28);
  doc.text('L E D G E R L I N E', 20, 38);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('PERSONNEL ATTRITION RISK & INTEL REPORT', 20, 46);

  // Metadata separator line
  doc.setDrawColor(210, 205, 195);
  doc.setLineWidth(0.4);
  doc.line(20, 54, 190, 54);

  // Metadata details
  doc.setFontSize(9);
  doc.setTextColor(110, 105, 95);
  doc.text(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, 20, 61);
  doc.text(`Sync Mode: ${dbStatus?.connected ? 'Cloud Synced (MongoDB Active)' : 'Local Ledger (Session In-Memory)'}`, 20, 66);
  doc.text(`Personnel Headcount: ${employees.length}`, 20, 71);

  // Executive summary dashboard
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text('Executive Attrition Dashboard Summary', 20, 87);

  // Stats Box background
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.rect(20, 92, 170, 48, 'F');

  const total = employees.length;
  const critical = employees.filter(e => e.analysis?.riskLevel === 'Critical').length;
  const high = employees.filter(e => e.analysis?.riskLevel === 'High').length;
  const medium = employees.filter(e => e.analysis?.riskLevel === 'Medium').length;
  const low = employees.filter(e => e.analysis?.riskLevel === 'Low').length;

  const totalProbSum = employees.reduce((sum, e) => sum + (e.analysis?.probability ?? 0), 0);
  const avgRiskProb = total > 0 ? Math.round(totalProbSum / total) : 0;

  // Render Dashboard contents
  doc.setFontSize(9.5);
  doc.setTextColor(60, 55, 45);

  // Left Column
  doc.setFont('Helvetica', 'bold');
  doc.text('Overall Risk Index:', 25, 101);
  doc.setFont('Helvetica', 'normal');
  doc.text(`${avgRiskProb}% Average Probability`, 25, 107);
  doc.text('This metric aggregates relative scores', 25, 113);
  doc.text('across all 11 core flight risk factors.', 25, 118);

  // Right Column
  doc.setFont('Helvetica', 'bold');
  doc.text('Risk Profile Breakdown:', 110, 101);
  doc.setFont('Helvetica', 'normal');

  doc.setTextColor(criticalColor[0], criticalColor[1], criticalColor[2]);
  doc.text(`• Critical Risk (>=75%): ${critical} (${((critical / total) * 100).toFixed(0)}%)`, 110, 107);

  doc.setTextColor(highColor[0], highColor[1], highColor[2]);
  doc.text(`• High Risk (50-74%):  ${high} (${((high / total) * 100).toFixed(0)}%)`, 110, 113);

  doc.setTextColor(mediumColor[0], mediumColor[1], mediumColor[2]);
  doc.text(`• Medium Risk (25-49%): ${medium} (${((medium / total) * 100).toFixed(0)}%)`, 110, 119);

  doc.setTextColor(lowColor[0], lowColor[1], lowColor[2]);
  doc.text(`• Low Risk (<25%):     ${low} (${((low / total) * 100).toFixed(0)}%)`, 110, 125);

  // Department Table
  if (analytics && analytics.departmentRisk && analytics.departmentRisk.length > 0) {
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text('Risk Breakdown by Department', 20, 155);

    const deptRows = analytics.departmentRisk.map(d => [
      d.department,
      String(d.headcount),
      `${d.avgProbability}%`,
      String(d.criticalCount)
    ]);

    autoTable(doc, {
      startY: 160,
      margin: { left: 20, right: 20 },
      head: [['Department', 'Headcount', 'Avg. Probability', 'Critical Cases']],
      body: deptRows,
      theme: 'striped',
      headStyles: {
        fillColor: primaryColor,
        textColor: [20, 23, 28], // Dark text on light accent
        fontStyle: 'bold',
        fontSize: 9
      },
      styles: {
        fontSize: 8.5,
        cellPadding: 2.5
      }
    });
  }

  // Risk Drivers Table
  if (analytics && analytics.overallDrivers && analytics.overallDrivers.length > 0) {
    const finalY = (doc as any).lastAutoTable?.finalY || 160;

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text('Key Structural Flight Risk Drivers (SHAP)', 20, finalY + 13);

    const driverRows = analytics.overallDrivers.slice(0, 5).map((d, i) => [
      `#${i + 1}`,
      d.displayName,
      `${d.avgContribution.toFixed(2)} pts`
    ]);

    autoTable(doc, {
      startY: finalY + 18,
      margin: { left: 20, right: 20 },
      head: [['Rank', 'Attribute Factor', 'Average SHAP Impact Value']],
      body: driverRows,
      theme: 'plain',
      headStyles: {
        textColor: textColor,
        fontStyle: 'bold',
        fontSize: 9
      },
      styles: {
        fontSize: 8.5,
        cellPadding: 2
      }
    });
  }

  addFooter(1);

  // --- PAGE 2+: DETAILED ROSTER LEDGER ---
  doc.addPage();
  addHeader('Personnel Ledger', 'Complete workforce roster ordered by calculated resignation risk');

  const tableHeaders = [
    'ID',
    'Name',
    'Department',
    'Job Role',
    'Risk %',
    'Risk Level',
    'Primary Driver',
    'Top Factors'
  ];

  const tableRows = employees
    .sort((a, b) => (b.analysis?.probability ?? 0) - (a.analysis?.probability ?? 0))
    .map(emp => [
      emp.id,
      emp.name,
      emp.employment.department,
      emp.employment.jobRole,
      `${emp.analysis?.probability ?? 0}%`,
      emp.analysis?.riskLevel ?? 'Low',
      emp.analysis?.reasonPrediction?.primaryReason ?? 'None',
      emp.analysis?.topDrivers?.slice(0, 2).join(', ') ?? 'None'
    ]);

  autoTable(doc, {
    startY: 34,
    margin: { left: 10, right: 10 },
    head: [tableHeaders],
    body: tableRows,
    theme: 'striped',
    headStyles: {
      fillColor: textColor,
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 15 }, // ID
      1: { cellWidth: 26 }, // Name
      2: { cellWidth: 22 }, // Department
      3: { cellWidth: 25 }, // Job Role
      4: { cellWidth: 14 }, // Risk %
      5: { cellWidth: 18 }, // Risk Level
      6: { cellWidth: 32 }, // Primary Leave Driver
      7: { cellWidth: 38 }  // Top Drivers
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2
    },
    didDrawCell: (data) => {
      // Highlight risk level cell text with semantic color tones
      if (data.column.index === 5) {
        const text = String(data.cell.raw || '');
        if (text === 'Critical') {
          doc.setTextColor(criticalColor[0], criticalColor[1], criticalColor[2]);
          doc.setFont('Helvetica', 'bold');
        } else if (text === 'High') {
          doc.setTextColor(highColor[0], highColor[1], highColor[2]);
          doc.setFont('Helvetica', 'bold');
        } else if (text === 'Medium') {
          doc.setTextColor(mediumColor[0], mediumColor[1], mediumColor[2]);
        } else if (text === 'Low') {
          doc.setTextColor(lowColor[0], lowColor[1], lowColor[2]);
        }
      }
    },
    didDrawPage: (data) => {
      // Add page header for page 3+
      if (data.pageNumber > 2) {
        addHeader('Personnel Ledger (Continued)', 'Complete workforce roster ordered by calculated resignation risk');
      }
      addFooter(data.pageNumber);
    }
  });

  // Download PDF file
  doc.save('ledgerline_report.pdf');
}
