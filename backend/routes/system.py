"""
routes/system.py — System/analytics endpoints (replaces routes/system.ts)
"""
from flask import Blueprint, jsonify
from store import fetch_employees, get_db_status, ensure_db_attempt
from risk_model import compute_analytics_summary

bp = Blueprint('system', __name__)


@bp.route('/db-status', methods=['GET'])
def db_status():
    ensure_db_attempt()
    return jsonify(get_db_status())


@bp.route('/analytics', methods=['GET'])
def analytics():
    try:
        employees = fetch_employees()
        return jsonify(compute_analytics_summary(employees))
    except Exception as e:
        return jsonify({'error': 'Failed to compute analytics summary', 'details': str(e)}), 500
