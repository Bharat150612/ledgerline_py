import React, { useEffect, useState } from 'react';
import { Employee, AnalyticsSummary, DataCleaningReport } from '../core/types.js';
import { parseCSVToEmployees, parseExcelToEmployees, downloadSampleCSVTemplate } from '../services/csvHelper.js';
import { api, DbStatus } from '../services/api.js';
import { exportToJson, exportToExcel, exportToPdf } from '../services/exportHelper.js';

import { Tab } from '../components/Sidebar.js';
import { TopBar } from '../components/TopBar.js';
import { Landing } from '../components/Landing.js';
import { UploadPanel } from '../components/UploadPanel.js';
import { Overview } from '../components/Overview.js';
import { Departments } from '../components/Departments.js';
import { Directory } from '../components/Directory.js';
import { ReasonPredictor } from '../components/ReasonPredictor.js';
import { EmptyState } from '../components/ui.js';
import { SimState } from '../components/EmployeeDetail.js';

const defaultSim: SimState = { salary: 0, overtime: 0, wlb: 3, mgrRel: 3, jobSat: 3, recognition: 3 };

export default function App() {
  // Theme state: dark by default, persists via localStorage
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('ll_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('blue');
    if (theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
    localStorage.setItem('ll_theme', theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Show the home splash on first load; persist dismissal for the session
  const [activeTab, setActiveTab] = useState<Tab>('home');

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [dbStatus, setDbStatus] = useState<DbStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');

  // Intake state
  const [dragActive, setDragActive] = useState(false);
  const [importStatus, setImportStatus] = useState<{ status: 'idle' | 'loading' | 'success' | 'error'; message: string }>({ status: 'idle', message: '' });
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(() => localStorage.getItem('uploadedFileName'));
  const [cleaningReport, setCleaningReport] = useState<DataCleaningReport | null>(() => {
    const saved = localStorage.getItem('ll_cleaning_report');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Directory filters + selection
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [riskFilter, setRiskFilter] = useState('All');
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // What-if simulation
  const [sim, setSim] = useState<SimState>(defaultSim);
  const [isSimulating, setIsSimulating] = useState(false);

  // AI executive summary
  const [aiSummary, setAiSummary] = useState('');
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState('');

  // Leave-reason predictor
  const [reasonSelectedEmpId, setReasonSelectedEmpId] = useState<string | null>(null);
  const [reasonSelectedEmployee, setReasonSelectedEmployee] = useState<Employee | null>(null);
  const [explanation, setExplanation] = useState('');
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);
  const [explanationError, setExplanationError] = useState('');
  const [reasonSearchQuery, setReasonSearchQuery] = useState('');
  const [reasonDeptFilter, setReasonDeptFilter] = useState('All');
  const [reasonRiskFilter, setReasonRiskFilter] = useState('All');

  const showToast = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      const status = await api.dbStatus().catch(() => null);
      if (status) setDbStatus(status);

      const analyticsData = await api.analytics().catch(() => null);
      if (analyticsData) setAnalytics(analyticsData);

      const employeesData = await api.employees().catch(() => []);
      setEmployees(employeesData);
      if (employeesData.length > 0 && !selectedEmpId) {
        const sorted = [...employeesData].sort((a, b) => (b.analysis?.probability ?? 0) - (a.analysis?.probability ?? 0));
        setSelectedEmpId(sorted[0].id);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep selected employee + simulation sliders in sync with the roster
  useEffect(() => {
    if (selectedEmpId) {
      const emp = employees.find((e) => e.id === selectedEmpId);
      if (emp) {
        setSelectedEmployee(emp);
        setSim({
          salary: emp.compensation.salary,
          overtime: emp.workload.overtimeHours,
          wlb: emp.environment.workLifeBalance,
          mgrRel: emp.environment.managerRelationship,
          jobSat: emp.environment.jobSatisfaction,
          recognition: emp.environment.recognitionScore,
        });
        setAiSummary(emp.analysis?.aiSummary || '');
        setSummaryError('');
      }
    } else {
      setSelectedEmployee(null);
    }
  }, [selectedEmpId, employees]);

  // Keep the reason-predictor selection in sync
  useEffect(() => {
    if (reasonSelectedEmpId) {
      const emp = employees.find((e) => e.id === reasonSelectedEmpId);
      if (emp) {
        setReasonSelectedEmployee(emp);
        setExplanation('');
        setExplanationError('');
      }
    } else if (employees.length > 0) {
      setReasonSelectedEmpId(employees[0].id);
    }
  }, [reasonSelectedEmpId, employees]);

  const handleUploadedFile = async (file: File) => {
    if (!file) return;
    const isCsv = file.name.endsWith('.csv');
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    if (!isCsv && !isExcel) {
      setImportStatus({ status: 'error', message: 'Invalid file format. Upload a .csv, .xlsx, or .xls file.' });
      return;
    }

    setImportStatus({ status: 'loading', message: `Reading ${isCsv ? 'CSV' : 'Excel'} file and extracting fields…` });

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const resultData = e.target?.result;
        if (!resultData) throw new Error('Could not read file contents.');

        let parsed: Employee[] = [];
        let report: DataCleaningReport | null = null;
        if (isCsv) {
          if (typeof resultData !== 'string') throw new Error('Invalid CSV text data.');
          const res = parseCSVToEmployees(resultData);
          parsed = res.employees;
          report = res.report;
        } else {
          if (!(resultData instanceof ArrayBuffer)) throw new Error('Invalid Excel binary data.');
          const res = parseExcelToEmployees(resultData);
          parsed = res.employees;
          report = res.report;
        }

        if (parsed.length === 0) throw new Error('No employee records found in file.');

        setImportStatus({ status: 'loading', message: `Scoring ${parsed.length} records and saving to the ledger…` });

        const result = await api.importEmployees(parsed);
        setImportStatus({ status: 'success', message: `Imported ${result.count} records into the ledger.` });
        localStorage.setItem('uploadedFileName', file.name);
        setUploadedFileName(file.name);
        if (report) {
          localStorage.setItem('ll_cleaning_report', JSON.stringify(report));
          setCleaningReport(report);
        } else {
          localStorage.removeItem('ll_cleaning_report');
          setCleaningReport(null);
        }
        setSelectedEmpId(null);
        await loadData();
        showToast(`Imported ${result.count} employee records.`);
      } catch (err: any) {
        setImportStatus({ status: 'error', message: err.message || 'Error occurred while parsing or importing the file.' });
      }
    };
    reader.onerror = () => {
      setImportStatus({ status: 'error', message: `Failed to read ${isCsv ? 'CSV' : 'Excel'} file.` });
    };

    if (isCsv) reader.readAsText(file);
    else reader.readAsArrayBuffer(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) handleUploadedFile(e.dataTransfer.files[0]);
  };

  const applySimulation = async () => {
    if (!selectedEmployee) return;
    setIsSimulating(true);
    try {
      const updatedEmp = await api.updateScenario(selectedEmployee.id, {
        salary: sim.salary,
        overtimeHours: sim.overtime,
        workLifeBalance: sim.wlb,
        managerRelationship: sim.mgrRel,
        jobSatisfaction: sim.jobSat,
        recognitionScore: sim.recognition,
      });
      setEmployees((prev) => prev.map((e) => (e.id === updatedEmp.id ? updatedEmp : e)));
      setSelectedEmployee(updatedEmp);
      showToast('What-if simulation recalculated and saved.');
      const analyticsData = await api.analytics().catch(() => null);
      if (analyticsData) setAnalytics(analyticsData);
      setAiSummary('');
    } catch (err) {
      console.error('Error applying simulation:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleResetSingleEmployee = async () => {
    if (!selectedEmployee) return;
    const baseline = selectedEmployee.baseline || {
      salary: selectedEmployee.compensation.salary,
      overtimeHours: selectedEmployee.workload.overtimeHours,
      workLifeBalance: selectedEmployee.environment.workLifeBalance,
      managerRelationship: selectedEmployee.environment.managerRelationship,
      jobSatisfaction: selectedEmployee.environment.jobSatisfaction,
      recognitionScore: selectedEmployee.environment.recognitionScore,
    };

    setIsSimulating(true);
    try {
      const updatedEmp = await api.updateScenario(selectedEmployee.id, baseline);
      setEmployees((prev) => prev.map((e) => (e.id === updatedEmp.id ? updatedEmp : e)));
      setSelectedEmployee(updatedEmp);
      setSim({
        salary: baseline.salary,
        overtime: baseline.overtimeHours,
        wlb: baseline.workLifeBalance,
        mgrRel: baseline.managerRelationship,
        jobSat: baseline.jobSatisfaction,
        recognition: baseline.recognitionScore,
      });
      showToast(`Reset ${selectedEmployee.name}'s file to its original baseline.`);
      const analyticsData = await api.analytics().catch(() => null);
      if (analyticsData) setAnalytics(analyticsData);
      setAiSummary('');
    } catch (err) {
      console.error('Reset single employee failed:', err);
      showToast('Error resetting this file to baseline.');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleResetData = async () => {
    if (!window.confirm('Restore every record back to its original baseline? This clears all simulated changes.')) return;
    try {
      setIsLoading(true);
      await api.resetAll();
      await loadData();
      showToast('All records reset to baseline.');
    } catch (err) {
      console.error('Reset failed', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveCSV = async () => {
    if (!window.confirm('Remove the current file from the system? This deletes all records in the ledger.')) return;
    try {
      setIsLoading(true);
      await api.resetAll();
      localStorage.removeItem('uploadedFileName');
      setUploadedFileName(null);
      localStorage.removeItem('ll_cleaning_report');
      setCleaningReport(null);
      setImportStatus({ status: 'idle', message: '' });
      setSelectedEmpId(null);
      setSelectedEmployee(null);
      setEmployees([]);
      await loadData();
      showToast('Dataset removed from the ledger.');
    } catch (err) {
      console.error('Error removing dataset:', err);
      showToast('Error removing dataset.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = (format: 'excel' | 'pdf' | 'json') => {
    if (format === 'excel') {
      exportToExcel(employees);
      showToast('Ledger exported to Excel successfully.');
    } else if (format === 'pdf') {
      exportToPdf(employees, analytics, dbStatus);
      showToast('Ledger exported to PDF successfully.');
    } else {
      exportToJson(employees);
      showToast('Ledger exported to JSON successfully.');
    }
  };

  const fetchAiSummary = async () => {
    if (!selectedEmployee) return;
    setIsLoadingSummary(true);
    setSummaryError('');
    try {
      const data = await api.summary(selectedEmployee.id);
      setAiSummary(data.summary);
      setEmployees((prev) =>
        prev.map((e) => (e.id === selectedEmployee.id && e.analysis ? { ...e, analysis: { ...e.analysis, aiSummary: data.summary } } : e))
      );
    } catch {
      setSummaryError('Unable to draft a summary. Check the server connection.');
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const fetchExplanation = async () => {
    if (!reasonSelectedEmployee) return;
    setIsLoadingExplanation(true);
    setExplanationError('');
    setExplanation('');
    try {
      const data = await api.predictReason(reasonSelectedEmployee.id);
      setExplanation(data.explanation);
    } catch {
      setExplanationError('Unable to draft an interpretation. Check the server connection.');
    } finally {
      setIsLoadingExplanation(false);
    }
  };

  const departments: string[] = Array.from(new Set(employees.map((e) => e.employment.department)) as Set<string>).sort();

  const filteredEmployees = employees
    .filter((emp) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch = q === '' || emp.name.toLowerCase().includes(q) || emp.id.toLowerCase().includes(q) || emp.employment.jobRole.toLowerCase().includes(q);
      const matchesDept = deptFilter === 'All' || emp.employment.department === deptFilter;
      const matchesRisk = riskFilter === 'All' || emp.analysis?.riskLevel === riskFilter;
      return matchesSearch && matchesDept && matchesRisk;
    })
    .sort((a, b) => (b.analysis?.probability ?? 0) - (a.analysis?.probability ?? 0));

  const reasonFilteredEmployees = employees.filter((emp) => {
    const q = reasonSearchQuery.trim().toLowerCase();
    const matchesSearch = q === '' || emp.name.toLowerCase().includes(q) || emp.id.toLowerCase().includes(q) || emp.employment.jobRole.toLowerCase().includes(q);
    const matchesDept = reasonDeptFilter === 'All' || emp.employment.department === reasonDeptFilter;
    const matchesRisk = reasonRiskFilter === 'All' || emp.analysis?.riskLevel === reasonRiskFilter;
    return matchesSearch && matchesDept && matchesRisk;
  });

  const hasData = employees.length > 0;

  const navigate = (t: Tab) => {
    if (t !== 'home' && t !== 'upload' && !hasData) {
      setActiveTab('upload');
      return;
    }
    setActiveTab(t);
  };

  const renderMain = () => {
    if (activeTab === 'home') return <Landing hasData={hasData} onNavigate={navigate} activeTab={activeTab} onSelect={navigate} />;

    if (activeTab === 'upload') {
      return (
        <UploadPanel
          dragActive={dragActive}
          onDrag={handleDrag}
          onDrop={handleDrop}
          onFileSelected={handleUploadedFile}
          importStatus={importStatus}
          uploadedFileName={uploadedFileName}
          employeeCount={employees.length}
          onRemove={handleRemoveCSV}
          cleaningReport={cleaningReport}
        />
      );
    }

    if (!hasData) {
      const copy: Record<Tab, [string, string]> = {
        home: ['', ''],
        upload: ['', ''],
        overview: ['Global ledger', 'This view rolls up risk across every record on file.'],
        departments: ['Department ledger', 'This view compares risk across corporate divisions.'],
        directory: ['Personnel files', 'This view opens individual case files for review.'],
        reason_predictor: ['Leave predictor', 'This view interprets the most likely reason a person would resign.'],
      };
      const [title, purpose] = copy[activeTab];
      return <EmptyState title={title} purpose={purpose} onUpload={() => setActiveTab('upload')} onTemplate={downloadSampleCSVTemplate} />;
    }

    if (activeTab === 'overview' && analytics) {
      return (
        <Overview
          analytics={analytics}
          onFilterRisk={(risk) => {
            setRiskFilter(risk);
            setDeptFilter('All');
            setSearchQuery('');
            setActiveTab('directory');
          }}
          onFilterTotal={() => {
            setRiskFilter('All');
            setDeptFilter('All');
            setSearchQuery('');
            setActiveTab('directory');
          }}
        />
      );
    }
    if (activeTab === 'departments' && analytics) {
      return (
        <Departments
          analytics={analytics}
          onFilterDepartment={(dept) => {
            setDeptFilter(dept);
            setSearchQuery('');
            setRiskFilter('All');
            setActiveTab('directory');
          }}
        />
      );
    }

    if (activeTab === 'directory') {
      return (
        <Directory
          filteredEmployees={filteredEmployees}
          departments={departments}
          searchQuery={searchQuery}
          onSearch={setSearchQuery}
          deptFilter={deptFilter}
          onDeptFilter={setDeptFilter}
          riskFilter={riskFilter}
          onRiskFilter={setRiskFilter}
          selectedEmpId={selectedEmpId}
          onSelect={setSelectedEmpId}
          selectedEmployee={selectedEmployee}
          sim={sim}
          setSim={setSim}
          isSimulating={isSimulating}
          onApplySimulation={applySimulation}
          onResetSingle={handleResetSingleEmployee}
          aiSummary={aiSummary}
          isLoadingSummary={isLoadingSummary}
          summaryError={summaryError}
          onFetchSummary={fetchAiSummary}
        />
      );
    }

    if (activeTab === 'reason_predictor') {
      return (
        <ReasonPredictor
          filteredEmployees={reasonFilteredEmployees}
          departments={departments}
          searchQuery={reasonSearchQuery}
          onSearch={setReasonSearchQuery}
          deptFilter={reasonDeptFilter}
          onDeptFilter={setReasonDeptFilter}
          riskFilter={reasonRiskFilter}
          onRiskFilter={setReasonRiskFilter}
          selectedEmpId={reasonSelectedEmpId}
          onSelect={setReasonSelectedEmpId}
          selectedEmployee={reasonSelectedEmployee}
          explanation={explanation}
          isLoadingExplanation={isLoadingExplanation}
          explanationError={explanationError}
          onFetchExplanation={fetchExplanation}
        />
      );
    }

    return null;
  };

  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-ink)] ledger-ground">
      <div className="flex-1 flex flex-col min-h-screen">
        <TopBar
          activeTab={activeTab}
          successMsg={successMsg}
          onSelect={navigate}
          hasData={hasData}
          dbStatus={dbStatus}
          onReset={handleResetData}
          onExport={handleExportData}
          theme={theme}
          onToggleTheme={handleToggleTheme}
        />

        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-[var(--color-hairline)] border-t-[var(--color-kraft)] rounded-full animate-spin" />
            <p className="text-xs text-[var(--color-bone-dim)] mt-5 font-mono">Reading the ledger…</p>
          </div>
        ) : (
          <main className="flex-1 p-6 md:p-10 max-w-6xl w-full mx-auto">{renderMain()}</main>
        )}
      </div>
    </div>
  );
}
