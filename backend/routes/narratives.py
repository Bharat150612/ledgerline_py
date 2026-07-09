"""
routes/narratives.py — Gemini narrative endpoints (replaces routes/narratives.ts)
"""
from flask import Blueprint, jsonify
from store import fetch_employee_by_id
from risk_model import analyze_employee_risk, predict_attrition_reason
from gemini import generate_executive_summary, generate_reason_explanation

bp = Blueprint('narratives', __name__)


@bp.route('/<emp_id>/summary', methods=['POST'])
def summary(emp_id):
    try:
        emp = fetch_employee_by_id(emp_id)
        if not emp:
            return jsonify({'error': 'Employee not found'}), 404

        analysis = emp.get('analysis') or analyze_employee_risk(emp)
        result   = generate_executive_summary(emp, analysis)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': 'Failed to generate summary', 'details': str(e)}), 500


@bp.route('/<emp_id>/predict-reason', methods=['POST'])
def predict_reason(emp_id):
    try:
        emp = fetch_employee_by_id(emp_id)
        if not emp:
            return jsonify({'error': 'Employee not found'}), 404

        analysis   = emp.get('analysis') or analyze_employee_risk(emp)
        prediction = analysis.get('reasonPrediction') or predict_attrition_reason(emp)
        result     = generate_reason_explanation(emp, analysis, prediction)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': 'Failed to generate reason interpretation', 'details': str(e)}), 500
