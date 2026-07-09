/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { Employee, AnalyticsSummary } from '../core/types.js';

// In production (Vercel), VITE_API_URL points to the Render backend.
// In local dev, it's empty so requests go to the same Express server.
const BASE_URL = import.meta.env.VITE_API_URL ?? '';

export interface DbStatus {
  connected: boolean;
  statusMessage: string;
  host: string;
  provider: string;
}

async function json(res: Response) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed with status ${res.status}`);
  }
  return res.json();
}

export const api = {
  dbStatus: (): Promise<DbStatus> => fetch(`${BASE_URL}/api/db-status`).then(json),
  analytics: (): Promise<AnalyticsSummary> => fetch(`${BASE_URL}/api/analytics`).then(json),
  employees: (params?: { department?: string; riskLevel?: string; search?: string }): Promise<Employee[]> => {
    const qs = new URLSearchParams();
    if (params?.department) qs.set('department', params.department);
    if (params?.riskLevel) qs.set('riskLevel', params.riskLevel);
    if (params?.search) qs.set('search', params.search);
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return fetch(`${BASE_URL}/api/employees${suffix}`).then(json);
  },
  employee: (id: string): Promise<Employee> => fetch(`${BASE_URL}/api/employees/${id}`).then(json),
  updateScenario: (id: string, payload: Record<string, number>): Promise<Employee> =>
    fetch(`${BASE_URL}/api/employees/${id}/update-scenario`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(json),
  resetAll: (): Promise<{ success: boolean }> => fetch(`${BASE_URL}/api/employees/reset`, { method: 'POST' }).then(json),
  importEmployees: (employees: Employee[]): Promise<{ success: boolean; count: number }> =>
    fetch(`${BASE_URL}/api/employees/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employees }),
    }).then(json),
  summary: (id: string): Promise<{ summary: string; isFallback?: boolean }> =>
    fetch(`${BASE_URL}/api/employees/${id}/summary`, { method: 'POST' }).then(json),
  predictReason: (id: string): Promise<{ explanation: string; isFallback?: boolean }> =>
    fetch(`${BASE_URL}/api/employees/${id}/predict-reason`, { method: 'POST' }).then(json),
};
