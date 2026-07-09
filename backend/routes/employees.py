"""
routes/employees.py — Employee CRUD + scenario simulation (replaces routes/employees.ts)
"""
from flask import Blueprint, request, jsonify
from store import fetch_employees, fetch_employee_by_id, persist_employee, reset_all_data, import_employees
from risk_model import analyze_employee_risk, analyze_employee_risk_batch

bp = Blueprint('employees', __name__)


@bp.route('/', methods=['GET'])
def list_employees():
    try:
        department = request.args.get('department')
        risk_level = request.args.get('riskLevel')
        search     = request.args.get('search', '').strip().lower()

        employees = fetch_employees()

        if department and department != 'All':
            employees = [e for e in employees if e.get('employment', {}).get('department') == department]
        if risk_level and risk_level != 'All':
            employees = [e for e in employees if (e.get('analysis') or {}).get('riskLevel') == risk_level]
        if search:
            employees = [
                e for e in employees
                if search in e.get('name', '').lower()
                or search in e.get('id', '').lower()
                or search in e.get('employment', {}).get('jobRole', '').lower()
            ]

        employees.sort(key=lambda e: (e.get('analysis') or {}).get('probability', 0), reverse=True)
        return jsonify(employees)
    except Exception as e:
        return jsonify({'error': 'Failed to fetch employees list', 'details': str(e)}), 500


@bp.route('/<emp_id>', methods=['GET'])
def get_employee(emp_id):
    try:
        emp = fetch_employee_by_id(emp_id)
        if not emp:
            return jsonify({'error': 'Employee not found'}), 404
        return jsonify(emp)
    except Exception as e:
        return jsonify({'error': 'Failed to fetch employee details', 'details': str(e)}), 500


@bp.route('/<emp_id>/update-scenario', methods=['POST'])
def update_scenario(emp_id):
    try:
        body = request.get_json(force=True) or {}
        emp  = fetch_employee_by_id(emp_id)
        if not emp:
            return jsonify({'error': 'Employee not found'}), 404

        if 'salary' in body:
            emp['compensation']['salary'] = float(body['salary'])
            emp['compensation']['salaryGap'] = max(0, emp['compensation']['estimatedMarketSalary'] - emp['compensation']['salary'])
        if 'overtimeHours' in body:
            ot = float(body['overtimeHours'])
            emp['workload']['overtimeHours'] = ot
            if ot == 0:
                emp['workload']['weeklyWorkingHours'] = 38
                emp['workload']['weekendWork'] = False
        if 'workLifeBalance' in body:
            emp['environment']['workLifeBalance'] = float(body['workLifeBalance'])
        if 'managerRelationship' in body:
            emp['environment']['managerRelationship'] = float(body['managerRelationship'])
        if 'jobSatisfaction' in body:
            emp['environment']['jobSatisfaction'] = float(body['jobSatisfaction'])
        if 'recognitionScore' in body:
            emp['environment']['recognitionScore'] = float(body['recognitionScore'])

        emp['analysis'] = analyze_employee_risk(emp)
        persist_employee(emp)
        return jsonify(emp)
    except Exception as e:
        return jsonify({'error': 'Failed to update simulation scenario', 'details': str(e)}), 500


@bp.route('/reset', methods=['POST'])
def reset():
    try:
        reset_all_data()
        return jsonify({'success': True, 'message': 'Workforce data reset successfully'})
    except Exception as e:
        return jsonify({'error': 'Failed to reset data', 'details': str(e)}), 500


@bp.route('/import', methods=['POST'])
def import_emp():
    try:
        body      = request.get_json(force=True) or {}
        employees = body.get('employees', [])
        if not isinstance(employees, list):
            return jsonify({'error': 'Expected an array of employee objects'}), 400

        processed = analyze_employee_risk_batch(employees)

        import_employees(processed)
        return jsonify({'success': True, 'count': len(processed)})
    except Exception as e:
        print(f'Import error: {e}')
        return jsonify({'error': 'Failed to import employees', 'details': str(e)}), 500
