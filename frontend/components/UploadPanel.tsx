import React from 'react';
import { Eyebrow } from './ui.js';
import { downloadSampleCSVTemplate } from '../services/csvHelper.js';
import { DataCleaningReport } from '../core/types.js';

function formatFieldName(key: string): string {
  const parts = key.split('.');
  const field = parts[parts.length - 1];
  return field
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

interface ImportStatus {
  status: 'idle' | 'loading' | 'success' | 'error';
  message: string;
}

const FIELDS = [
  { name: 'id', desc: 'Employee ID' },
  { name: 'name', desc: 'Full name' },
  { name: 'salary', desc: 'Base compensation' },
  { name: 'department', desc: 'Division / segment' },
  { name: 'jobRole', desc: 'Job title' },
  { name: 'weeklyWorkingHours', desc: 'Working hours / wk' },
  { name: 'overtimeHours', desc: 'Overtime hours' },
  { name: 'workLifeBalance', desc: 'Work-life balance (1-5)' },
];

export function UploadPanel({
  dragActive,
  onDrag,
  onDrop,
  onFileSelected,
  importStatus,
  uploadedFileName,
  employeeCount,
  onRemove,
  cleaningReport,
}: {
  dragActive: boolean;
  onDrag: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileSelected: (file: File) => void;
  importStatus: ImportStatus;
  uploadedFileName: string | null;
  employeeCount: number;
  onRemove: () => void;
  cleaningReport: DataCleaningReport | null;
}) {
  return (
    <div className="space-y-8 animate-fade-in max-w-5xl">
      <div>
        <Eyebrow>Step 01</Eyebrow>
        <h1 className="font-display text-3xl font-semibold text-[var(--color-bone)] mt-2">Dataset intake</h1>
        <p className="text-sm text-[var(--color-bone-dim)] mt-2 max-w-2xl">
          Load a flat CSV or Excel roster to populate the ledger. Every record is scored the moment it's read in.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 border border-[var(--color-hairline)] bg-[var(--color-ink-raised)] p-6 space-y-6">
          <div
            onDragEnter={onDrag}
            onDragOver={onDrag}
            onDragLeave={onDrag}
            onDrop={onDrop}
            className={`border-2 border-dashed p-10 text-center flex flex-col items-center justify-center min-h-[220px] transition-colors cursor-pointer ${
              dragActive ? 'border-[var(--color-kraft)] bg-[var(--color-kraft)]/5' : 'border-[var(--color-hairline)] hover:border-[var(--color-kraft-dim)]'
            }`}
          >
            <input
              type="file"
              id="csv-upload-input"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) onFileSelected(e.target.files[0]);
              }}
              className="hidden"
            />
            <label htmlFor="csv-upload-input" className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
              <span className="font-display text-3xl text-[var(--color-kraft)] mb-3">⌷</span>
              <span className="text-xs font-semibold text-[var(--color-bone)] block mb-1.5">
                Drag a roster file here, or <span className="text-[var(--color-kraft)] underline underline-offset-2">browse</span>
              </span>
              <span className="text-[10px] font-mono text-[var(--color-bone-dim)] block mt-1">
                .csv, .xlsx, .xls — headers should match standard personnel field names
              </span>
            </label>
          </div>

          {employeeCount > 0 && uploadedFileName && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border border-[var(--color-hairline)] bg-[var(--color-ink)]">
              <div className="text-left">
                <div className="text-xs font-semibold text-[var(--color-bone)]">{uploadedFileName}</div>
                <div className="text-[10px] font-mono text-[var(--color-bone-dim)] mt-1">{employeeCount} records on file</div>
              </div>
              <button
                onClick={onRemove}
                className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-rust)] hover:underline cursor-pointer shrink-0"
              >
                Remove file
              </button>
            </div>
          )}

          {importStatus.status !== 'idle' && (
            <div
              className={`text-xs px-4 py-3 border font-mono ${
                importStatus.status === 'success'
                  ? 'border-[var(--color-teal)]/40 text-[var(--color-teal)] bg-[var(--color-teal)]/10'
                  : importStatus.status === 'error'
                  ? 'border-[var(--color-rust)]/40 text-[var(--color-rust)] bg-[var(--color-rust)]/10'
                  : 'border-[var(--color-hairline)] text-[var(--color-bone-dim)]'
              }`}
            >
              {importStatus.message}
            </div>
          )}

          {cleaningReport && (
            <div className="mt-4 border border-[var(--color-hairline)] bg-[var(--color-ink)] p-4 space-y-3 animate-fade-in">
              <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--color-kraft)] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-kraft)] animate-pulse" />
                Data Cleansing & Imputation Audit
              </div>
              
              <div className="grid grid-cols-3 gap-3 text-xs border-b border-[var(--color-hairline)]/30 pb-3">
                <div>
                  <div className="text-[9px] font-mono text-[var(--color-bone-dim)] uppercase">Rows Parsed</div>
                  <div className="font-mono font-bold text-[var(--color-bone)] mt-0.5">
                    {cleaningReport.originalRowCount}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] font-mono text-[var(--color-bone-dim)] uppercase">Rows Cleaned Out</div>
                  <div className={`font-mono font-bold mt-0.5 ${cleaningReport.removedRowCount > 0 ? 'text-[var(--color-rust)]' : 'text-[var(--color-bone-dim)]'}`}>
                    {cleaningReport.removedRowCount}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] font-mono text-[var(--color-bone-dim)] uppercase">Imputed Values</div>
                  <div className={`font-mono font-bold mt-0.5 ${cleaningReport.imputedValuesCount > 0 ? 'text-[var(--color-amber)]' : 'text-[var(--color-bone-dim)]'}`}>
                    {cleaningReport.imputedValuesCount}
                  </div>
                </div>
              </div>

              {cleaningReport.removedColumns.length > 0 && (
                <div className="text-[11px] text-[var(--color-bone-dim)] leading-relaxed">
                  <span className="font-semibold text-[var(--color-bone)]">Ignored Unnecessary Columns:</span>{' '}
                  <code className="bg-[var(--color-ink-sunken)] px-1.5 py-0.5 rounded border border-[var(--color-hairline)] text-[10px] font-mono">
                    {cleaningReport.removedColumns.join(', ')}
                  </code>
                </div>
              )}

              {cleaningReport.monthlySalaryConverted && (
                <div className="flex items-start gap-2 px-3 py-2.5 bg-[var(--color-amber)]/10 border border-[var(--color-amber)]/30 text-[10.5px] font-mono">
                  <span className="text-[var(--color-amber)] text-sm leading-none mt-0.5">⚠</span>
                  <span className="text-[var(--color-amber)]">
                    <span className="font-bold">Monthly salary detected &amp; converted:</span>{' '}
                    Salary values appeared to be monthly (median &lt; ₹25,000). All salary, market salary, and bonus fields have been automatically multiplied ×12 for annual model prediction.
                  </span>
                </div>
              )}

              {Object.keys(cleaningReport.imputedFields).length > 0 ? (
                <div className="space-y-1.5">
                  <div className="text-[9px] font-mono text-[var(--color-bone-dim)] uppercase tracking-wider">Field Imputation Breakdown:</div>
                  <div className="max-h-[140px] overflow-y-auto divide-y divide-[var(--color-hairline)]/20 border border-[var(--color-hairline)] bg-[var(--color-ink-sunken)]/45">
                    {Object.entries(cleaningReport.imputedFields).map(([key, detail]) => (
                      <div key={key} className="flex items-center justify-between px-3 py-1.5 text-[10.5px]">
                        <span className="text-[var(--color-bone)] font-semibold">{formatFieldName(key)}</span>
                        <span className="text-[var(--color-bone-dim)] font-mono text-[9px] text-right ml-2">
                          {detail.count} missing replaced by department <span className="font-semibold text-[var(--color-kraft)] uppercase">{detail.method}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-[10px] font-mono text-[var(--color-teal)] italic">
                  ✓ Dataset is clean: No NA or blank values found requiring imputation.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="lg:col-span-5 border border-[var(--color-hairline)] bg-[var(--color-ink-raised)] p-6 space-y-5">
          <div>
            <h3 className="font-display text-base font-semibold text-[var(--color-bone)]">Expected schema</h3>
            <p className="text-[11px] text-[var(--color-bone-dim)] mt-1.5">
              Column names are matched case-insensitively; unmapped fields fall back to sensible defaults.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {FIELDS.map((f) => (
              <div key={f.name} className="border border-[var(--color-hairline)] p-2.5">
                <div className="font-mono text-[11px] font-semibold text-[var(--color-kraft)]">{f.name}</div>
                <div className="text-[9.5px] text-[var(--color-bone-dim)] mt-0.5">{f.desc}</div>
              </div>
            ))}
          </div>
          <button
            onClick={downloadSampleCSVTemplate}
            className="w-full text-[10px] font-mono uppercase tracking-wider text-[var(--color-bone)] border border-[var(--color-hairline)] hover:border-[var(--color-kraft-dim)] py-2.5 transition-colors cursor-pointer"
          >
            Download full CSV template
          </button>
        </div>
      </div>
    </div>
  );
}
