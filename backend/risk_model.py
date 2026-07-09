"""
risk_model.py — ML-powered attrition risk analysis
Replaces TypeScript riskModel.ts using Decision Tree + Random Forest + XGBoost ensemble.
"""
import os
import joblib
import numpy as np
import pandas as pd

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'models.pkl')
_bundle = joblib.load(MODEL_PATH)
_dt  = _bundle['dt_model']
_rf  = _bundle['rf_model']
_xgb = _bundle['xgb_model']
_le  = _bundle['label_encoder']
FEATURES = _bundle['features']
FEAT_IMP = _bundle['feature_importance']

# ── Feature extraction ────────────────────────────────────────────────────────

def _extract(emp: dict) -> pd.DataFrame:
    workload     = emp.get('workload', {})
    env          = emp.get('environment', {})
    employment   = emp.get('employment', {})
    compensation = emp.get('compensation', {})
    performance  = emp.get('performance', {})
    attendance   = emp.get('attendance', {})
    personal     = emp.get('personal', {})

    travel_raw = workload.get('businessTravelFrequency', 'Non-Travel')
    try:
        travel_enc = int(_le.transform([travel_raw])[0])
    except Exception:
        travel_enc = 0

    market = float(compensation.get('estimatedMarketSalary', 1) or 1)
    gap    = float(compensation.get('salaryGap', 0) or 0)
    gap_pct = gap / market if market > 0 else 0.0

    row = {
        'overtime_hours':        float(workload.get('overtimeHours', 0)),
        'weekly_hours':          float(workload.get('weeklyWorkingHours', 40)),
        'weekend_work':          int(bool(workload.get('weekendWork', False))),
        'business_travel_enc':   travel_enc,
        'salary_gap_pct':        round(gap_pct, 4),
        'benefits_satisfaction': float(compensation.get('benefitsSatisfaction', 3)),
        'work_life_balance':     float(env.get('workLifeBalance', 3)),
        'job_satisfaction':      float(env.get('jobSatisfaction', 3)),
        'manager_relationship':  float(env.get('managerRelationship', 3)),
        'recognition_score':     float(env.get('recognitionScore', 3)),
        'stress_level':          float(env.get('stressLevel', 3)),
        'employee_engagement':   float(env.get('employeeEngagement', 3)),
        'culture_rating':        float(env.get('companyCultureRating', 3)),
        'years_at_company':      float(employment.get('yearsAtCompany', 3)),
        'years_in_role':         float(employment.get('yearsInCurrentRole', 2)),
        'years_since_promotion': float(employment.get('yearsSinceLastPromotion', 2)),
        'years_with_manager':    float(employment.get('yearsWithCurrentManager', 2)),
        'performance_rating':    float(performance.get('performanceRating', 3)),
        'training_hours':        float(performance.get('trainingHours', 20)),
        'distance_from_office':  float(personal.get('distanceFromOffice', 10)),
        'absenteeism':           float(attendance.get('absenteeism', 0)),
        'late_arrivals':         float(attendance.get('lateArrivals', 0)),
        'age':                   float(personal.get('age', 35)),
        'job_level':             float(employment.get('jobLevel', 2)),
    }
    return pd.DataFrame([row])[FEATURES]

# ── Model predictions ─────────────────────────────────────────────────────────

def _predict_proba(feat_vec: pd.DataFrame) -> dict:
    dt_p  = float(_dt.predict_proba(feat_vec)[0][1])
    rf_p  = float(_rf.predict_proba(feat_vec)[0][1])
    xgb_p = float(_xgb.predict_proba(feat_vec)[0][1])
    ensemble = 0.25 * dt_p + 0.35 * rf_p + 0.40 * xgb_p
    return {
        'decision_tree': round(dt_p * 100, 1),
        'random_forest': round(rf_p * 100, 1),
        'xgboost':       round(xgb_p * 100, 1),
        'ensemble':      round(ensemble * 100, 1),
    }

# ── Feature contributions (SHAP-style) ───────────────────────────────────────

FEATURE_META = {
    'overtime_hours':         ('Overtime & Hours',       'Workload'),
    'weekly_hours':           ('Weekly Working Hours',   'Workload'),
    'weekend_work':           ('Weekend Work',           'Workload'),
    'business_travel_enc':    ('Business Travel',        'Workload'),
    'salary_gap_pct':         ('Salary Gap vs Market',   'Compensation'),
    'benefits_satisfaction':  ('Benefits Satisfaction',  'Compensation'),
    'work_life_balance':      ('Work-Life Balance',      'Environment'),
    'job_satisfaction':       ('Job Satisfaction',       'Environment'),
    'manager_relationship':   ('Manager Relationship',   'Environment'),
    'recognition_score':      ('Recognition Score',      'Environment'),
    'stress_level':           ('Stress Level',           'Environment'),
    'employee_engagement':    ('Employee Engagement',    'Environment'),
    'culture_rating':         ('Company Culture',        'Environment'),
    'years_at_company':       ('Years at Company',       'Employment'),
    'years_in_role':          ('Years in Current Role',  'Employment'),
    'years_since_promotion':  ('Years Since Promotion',  'Employment'),
    'years_with_manager':     ('Years with Manager',     'Employment'),
    'performance_rating':     ('Performance Rating',     'Performance'),
    'training_hours':         ('Training Hours',         'Performance'),
    'distance_from_office':   ('Commute Distance',       'Personal'),
    'absenteeism':            ('Absenteeism Rate',       'Attendance'),
    'late_arrivals':          ('Late Arrivals',          'Attendance'),
    'age':                    ('Age',                    'Personal'),
    'job_level':              ('Job Level',              'Employment'),
}

RISK_HIGH = {
    'overtime_hours', 'weekly_hours', 'weekend_work', 'salary_gap_pct',
    'stress_level', 'years_since_promotion', 'absenteeism', 'late_arrivals',
    'distance_from_office', 'business_travel_enc'
}
RISK_LOW = {
    'work_life_balance', 'job_satisfaction', 'manager_relationship',
    'recognition_score', 'employee_engagement', 'culture_rating',
    'benefits_satisfaction', 'training_hours', 'performance_rating'
}
NEUTRAL = {
    'overtime_hours': 2, 'weekly_hours': 40, 'weekend_work': 0,
    'business_travel_enc': 0, 'salary_gap_pct': 0.0, 'benefits_satisfaction': 3,
    'work_life_balance': 3, 'job_satisfaction': 3, 'manager_relationship': 3,
    'recognition_score': 3, 'stress_level': 3, 'employee_engagement': 3,
    'culture_rating': 3, 'years_at_company': 5, 'years_in_role': 3,
    'years_since_promotion': 1, 'years_with_manager': 2, 'performance_rating': 3,
    'training_hours': 20, 'distance_from_office': 10, 'absenteeism': 1,
    'late_arrivals': 2, 'age': 35, 'job_level': 2,
}

def _contributions(feat_vec: pd.DataFrame, emp: dict) -> list:
    workload     = emp.get('workload', {})
    env          = emp.get('environment', {})
    employment   = emp.get('employment', {})
    compensation = emp.get('compensation', {})
    performance  = emp.get('performance', {})
    attendance   = emp.get('attendance', {})
    personal     = emp.get('personal', {})

    gap = int(compensation.get('salaryGap', 0) / 1000)
    labels = {
        'overtime_hours':        f"{workload.get('overtimeHours', 0)}h OT/wk",
        'weekly_hours':          f"{workload.get('weeklyWorkingHours', 40)}h/wk",
        'weekend_work':          'Yes' if workload.get('weekendWork') else 'No',
        'business_travel_enc':   workload.get('businessTravelFrequency', 'Non-Travel'),
        'salary_gap_pct':        f"₹{gap}k gap/yr" if gap > 0 else 'At market',
        'benefits_satisfaction': f"{compensation.get('benefitsSatisfaction', 3)}/5",
        'work_life_balance':     f"{env.get('workLifeBalance', 3)}/5",
        'job_satisfaction':      f"{env.get('jobSatisfaction', 3)}/5",
        'manager_relationship':  f"{env.get('managerRelationship', 3)}/5",
        'recognition_score':     f"{env.get('recognitionScore', 3)}/5",
        'stress_level':          f"{env.get('stressLevel', 3)}/5",
        'employee_engagement':   f"{env.get('employeeEngagement', 3)}/5",
        'culture_rating':        f"{env.get('companyCultureRating', 3)}/5",
        'years_at_company':      f"{employment.get('yearsAtCompany', 0)} yrs",
        'years_in_role':         f"{employment.get('yearsInCurrentRole', 0)} yrs",
        'years_since_promotion': f"{employment.get('yearsSinceLastPromotion', 0)} yrs",
        'years_with_manager':    f"{employment.get('yearsWithCurrentManager', 0)} yrs",
        'performance_rating':    f"{performance.get('performanceRating', 3)}/5",
        'training_hours':        f"{performance.get('trainingHours', 0)}h/yr",
        'distance_from_office':  f"{personal.get('distanceFromOffice', 0)} km",
        'absenteeism':           f"{attendance.get('absenteeism', 0)} days",
        'late_arrivals':         f"{attendance.get('lateArrivals', 0)} occurrences",
        'age':                   f"{personal.get('age', 35)} yrs",
        'job_level':             f"Level {employment.get('jobLevel', 2)}",
    }

    row = feat_vec.iloc[0].to_dict()
    contribs = []
    for feat_name in FEATURES:
        val     = row.get(feat_name, 0)
        neutral = NEUTRAL.get(feat_name, 0)
        imp     = FEAT_IMP.get(feat_name, 0.01)
        meta    = FEATURE_META.get(feat_name)
        if not meta:
            continue
        display_name, category = meta
        deviation = val - neutral
        if feat_name in RISK_HIGH:
            shap = deviation * imp * 15
        elif feat_name in RISK_LOW:
            shap = -deviation * imp * 15
        else:
            shap = -deviation * imp * 5  # age, job_level: higher = lower risk
        shap = round(max(-15, min(18, shap)), 2)
        contribs.append({
            'featureName':  feat_name,
            'displayName':  display_name,
            'category':     category,
            'shapValue':    shap,
            'currentValue': labels.get(feat_name, str(val)),
            'importance':   round(imp, 4),
        })

    return sorted(contribs, key=lambda x: -abs(x['shapValue']))


# ── Attrition reason prediction ───────────────────────────────────────────────

def predict_attrition_reason(emp: dict) -> dict:
    workload     = emp.get('workload', {})
    env          = emp.get('environment', {})
    employment   = emp.get('employment', {})
    compensation = emp.get('compensation', {})
    personal     = emp.get('personal', {})
    perf         = emp.get('performance', {})

    market = float(compensation.get('estimatedMarketSalary', 1) or 1)
    gap    = float(compensation.get('salaryGap', 0) or 0)
    gap_pct = gap / market if market > 0 else 0.0
    ben_sat = float(compensation.get('benefitsSatisfaction', 3))
    ot      = float(workload.get('overtimeHours', 0))
    wh      = float(workload.get('weeklyWorkingHours', 40))
    weekend = bool(workload.get('weekendWork', False))
    yrs_p   = float(employment.get('yearsSinceLastPromotion', 0))
    yrs_r   = float(employment.get('yearsInCurrentRole', 0))
    mgr     = float(env.get('managerRelationship', 3))
    rec     = float(env.get('recognitionScore', 3))
    dist    = float(personal.get('distanceFromOffice', 0))
    travel  = workload.get('businessTravelFrequency', 'Non-Travel')
    stress  = float(env.get('stressLevel', 3))
    perf_r  = float(perf.get('performanceRating', 3))

    reasons = []

    # Compensation
    cs = (85 if gap_pct > 0.20 else 60 if gap_pct > 0.10 else 35 if gap_pct > 0 else 10) + int((5 - ben_sat) * 3)
    reasons.append({'reason': 'Inadequate Compensation', 'probability': min(99, max(5, cs)), 'category': 'Compensation',
        'description': f"Salary gap vs market is ₹{int(gap/1000)}k/yr with {int(ben_sat)}/5 benefits satisfaction."})

    # Workload
    ws = (88 if wh > 50 or ot > 12 else 65 if wh > 44 or ot > 5 else 40 if wh > 40 or ot > 2 else 15) + (10 if weekend else 0)
    reasons.append({'reason': 'Workload & Burnout', 'probability': min(99, max(5, ws)), 'category': 'Workload',
        'description': f"Working {int(wh)}h/wk with {int(ot)}h overtime and {'active' if weekend else 'no'} weekend obligations."})

    # Career stagnation
    ca = (80 if yrs_p >= 4 else 50 if yrs_p >= 2 else 15) + min(20, int(yrs_r * 3))
    reasons.append({'reason': 'Stagnant Career Growth', 'probability': min(99, max(5, ca)), 'category': 'Employment',
        'description': f"No promotion for {int(yrs_p)} years and {int(yrs_r)} years in current role."})

    # Manager friction
    ms = (82 if mgr <= 2 else 45 if mgr == 3 else 12) + int((5 - rec) * 3)
    reasons.append({'reason': 'Friction with Management', 'probability': min(99, max(5, ms)), 'category': 'Environment',
        'description': f"Manager satisfaction {int(mgr)}/5 with recognition index {int(rec)}/5."})

    # Commute
    cs2 = (min(85, 30 + (dist - 20) * 2) if dist > 25 else 25 if dist > 15 else 10) + (25 if travel == 'Frequently' else 5 if travel == 'Rarely' else 0)
    reasons.append({'reason': 'Commute & Travel Pressures', 'probability': min(99, max(5, int(cs2))), 'category': 'Personal',
        'description': f"Commute is {int(dist)} km with {travel.lower()} business travel."})

    # Stress
    ss = (75 + int((stress - 4) * 12) if stress >= 4 else 40 if stress == 3 else 15) + (10 if perf_r >= 4 else 0)
    reasons.append({'reason': 'Role Stress & Fatigue', 'probability': min(99, max(5, int(ss))), 'category': 'Environment',
        'description': f"Stress level {int(stress)}/5 for a {'high-performing' if perf_r >= 4 else 'standard'} contributor."})

    sorted_r = sorted(reasons, key=lambda x: -x['probability'])
    primary  = sorted_r[0]
    diff     = primary['probability'] - (sorted_r[1]['probability'] if len(sorted_r) > 1 else 0)
    confidence = min(95, max(65, 70 + diff))

    return {
        'primaryReason': primary['reason'],
        'confidence': int(confidence),
        'reasonProbabilities': sorted_r,
        'reasoning': f"Based on ML analysis, primary flight driver is {primary['reason']}. {primary['description']}"
    }


# ── Recommendations ───────────────────────────────────────────────────────────

def _recommendations(emp: dict, contribs: list) -> list:
    workload     = emp.get('workload', {})
    env          = emp.get('environment', {})
    employment   = emp.get('employment', {})
    compensation = emp.get('compensation', {})
    personal     = emp.get('personal', {})
    shap = {c['featureName']: c['shapValue'] for c in contribs}
    recs = []
    if shap.get('salary_gap_pct', 0) > 3:
        recs.append(f"Review compensation. Market gap is ₹{int(compensation.get('salaryGap', 0)/1000)}k/yr.")
    if shap.get('overtime_hours', 0) > 3 or shap.get('weekly_hours', 0) > 2:
        recs.append(f"Reduce working hours ({workload.get('weeklyWorkingHours', 40)}h/wk) and limit non-essential overtime.")
    if shap.get('years_since_promotion', 0) > 3:
        recs.append(f"Schedule career review. {employment.get('yearsSinceLastPromotion', 0)} years since last promotion.")
    if shap.get('manager_relationship', 0) > 3:
        recs.append("Arrange 1-on-1 mediation or feedback session with direct manager.")
    if shap.get('work_life_balance', 0) > 3:
        recs.append("Explore flexible or hybrid work options to improve work-life balance.")
    if shap.get('recognition_score', 0) > 3:
        recs.append("Increase recognition frequency and ensure contributions are visible to leadership.")
    if shap.get('business_travel_enc', 0) > 3:
        recs.append("Reduce business travel frequency; substitute with remote calls where possible.")
    if shap.get('distance_from_office', 0) > 3:
        recs.append(f"Consider travel allowance or additional remote days ({personal.get('distanceFromOffice', 0)} km commute).")
    if shap.get('stress_level', 0) > 3:
        recs.append("Provide wellness coaching or redistribute workload to lower stress.")
    if shap.get('job_satisfaction', 0) > 3:
        recs.append("Conduct role enrichment or project rotation to improve job satisfaction.")
    if not recs:
        recs = [
            "Maintain engagement through active skill development and growth opportunities.",
            "Conduct annual retention review to preserve positive profile.",
        ]
    return recs


# ── Analytics summary ─────────────────────────────────────────────────────────

def compute_analytics_summary(employees: list) -> dict:
    from collections import defaultdict

    risk_counts  = {'Low': 0, 'Medium': 0, 'High': 0, 'Critical': 0}
    dept_data    = defaultdict(lambda: {'totalProb': 0, 'headcount': 0, 'criticalCount': 0})
    role_data    = defaultdict(lambda: {'totalProb': 0, 'headcount': 0})
    travel_data  = {k: {'totalProb': 0, 'count': 0} for k in ['Non-Travel', 'Rarely', 'Frequently']}
    ot_data      = {'With Overtime': {'totalProb': 0, 'count': 0}, 'No Overtime': {'totalProb': 0, 'count': 0}}
    tenure_data  = {k: {'totalProb': 0, 'count': 0} for k in ['<1 Year', '1-2 Years', '2-5 Years', '5+ Years']}
    promo_data   = {k: {'totalProb': 0, 'count': 0} for k in ['Recent (<1 Yr)', '1-2 Years', '3+ Years']}
    gap_data     = {k: {'totalProb': 0, 'count': 0} for k in ['At Market', '<10% Gap', '10-20% Gap', '20%+ Gap']}
    driver_stats = defaultdict(lambda: {'totalShap': 0, 'count': 0, 'displayName': ''})

    for emp in employees:
        analysis = emp.get('analysis') or {}
        prob     = analysis.get('probability', 0)
        lvl      = analysis.get('riskLevel', 'Low')
        risk_counts[lvl] = risk_counts.get(lvl, 0) + 1

        dept = emp.get('employment', {}).get('department', 'Unknown')
        dept_data[dept]['totalProb'] += prob
        dept_data[dept]['headcount'] += 1
        if lvl == 'Critical':
            dept_data[dept]['criticalCount'] += 1

        role = emp.get('employment', {}).get('jobRole', 'Unknown')
        role_data[role]['totalProb'] += prob
        role_data[role]['headcount'] += 1

        travel = emp.get('workload', {}).get('businessTravelFrequency', 'Non-Travel')
        if travel in travel_data:
            travel_data[travel]['totalProb'] += prob
            travel_data[travel]['count']     += 1

        otk = 'With Overtime' if emp.get('workload', {}).get('overtimeHours', 0) > 0 else 'No Overtime'
        ot_data[otk]['totalProb'] += prob
        ot_data[otk]['count']     += 1

        yrs = emp.get('employment', {}).get('yearsAtCompany', 0)
        tk  = '<1 Year' if yrs < 1 else '1-2 Years' if yrs <= 2 else '2-5 Years' if yrs < 5 else '5+ Years'
        tenure_data[tk]['totalProb'] += prob
        tenure_data[tk]['count']     += 1

        py  = emp.get('employment', {}).get('yearsSinceLastPromotion', 0)
        pk  = 'Recent (<1 Yr)' if py < 1 else '1-2 Years' if py <= 2 else '3+ Years'
        promo_data[pk]['totalProb'] += prob
        promo_data[pk]['count']     += 1

        market = float(emp.get('compensation', {}).get('estimatedMarketSalary', 1) or 1)
        gap    = float(emp.get('compensation', {}).get('salaryGap', 0) or 0)
        gp     = gap / market if market > 0 else 0
        gk     = '20%+ Gap' if gp > 0.20 else '10-20% Gap' if gp > 0.10 else '<10% Gap' if gp > 0 else 'At Market'
        gap_data[gk]['totalProb'] += prob
        gap_data[gk]['count']     += 1

        for c in analysis.get('contributions', []):
            fn = c['featureName']
            driver_stats[fn]['totalShap']  += abs(c['shapValue'])
            driver_stats[fn]['count']      += 1
            driver_stats[fn]['displayName'] = c['displayName']

    def avg(d, kt='totalProb', kc='headcount'):
        hc = d.get(kc, 0)
        return round(d[kt] / hc) if hc > 0 else 0

    return {
        'overallRiskCounts': risk_counts,
        'departmentRisk': sorted([
            {'department': d, 'avgProbability': avg(v), 'headcount': v['headcount'], 'criticalCount': v['criticalCount']}
            for d, v in dept_data.items()
        ], key=lambda x: -x['avgProbability']),
        'roleRisk': sorted([
            {'jobRole': r, 'avgProbability': avg(v), 'headcount': v['headcount']}
            for r, v in role_data.items()
        ], key=lambda x: -x['avgProbability']),
        'travelRisk': [{'frequency': f, 'avgProbability': round(v['totalProb'] / v['count']) if v['count'] else 0} for f, v in travel_data.items()],
        'overtimeRisk': [{'hasOvertime': k, 'avgProbability': round(v['totalProb'] / v['count']) if v['count'] else 0} for k, v in ot_data.items()],
        'tenureRisk': [{'range': k, 'avgProbability': round(v['totalProb'] / v['count']) if v['count'] else 0} for k, v in tenure_data.items()],
        'promotionRisk': [{'yearsSincePromotion': k, 'avgProbability': round(v['totalProb'] / v['count']) if v['count'] else 0} for k, v in promo_data.items()],
        'salaryGapRisk': [{'gapRange': k, 'avgProbability': round(v['totalProb'] / v['count']) if v['count'] else 0} for k, v in gap_data.items()],
        'overallDrivers': sorted([
            {'featureName': fn, 'displayName': v['displayName'], 'avgContribution': round(v['totalShap'] / v['count'], 2)}
            for fn, v in driver_stats.items() if v['count'] > 0
        ], key=lambda x: -x['avgContribution']),
    }


# ── Main public function ──────────────────────────────────────────────────────

def analyze_employee_risk(emp: dict) -> dict:
    feat_vec = _extract(emp)
    preds    = _predict_proba(feat_vec)
    prob     = max(1, min(99, round(preds['ensemble'])))

    risk_level = ('Critical' if prob >= 75 else 'High' if prob >= 50 else 'Medium' if prob >= 25 else 'Low')

    contribs = _contributions(feat_vec, emp)

    model_probs = [preds['decision_tree'], preds['random_forest'], preds['xgboost']]
    std_dev     = float(np.std(model_probs))
    confidence  = int(max(70, min(98, 95 - std_dev)))

    top_drivers = [c['displayName'] for c in contribs if c['shapValue'] > 0][:6]
    recs        = _recommendations(emp, contribs)
    reason_pred = predict_attrition_reason(emp)

    return {
        'probability':      prob,
        'riskLevel':        risk_level,
        'confidence':       confidence,
        'topDrivers':       top_drivers,
        'contributions':    contribs,
        'recommendations':  recs,
        'reasonPrediction': reason_pred,
        'modelBreakdown':   preds,
    }


def _extract_batch(employees: list) -> pd.DataFrame:
    rows = []
    
    # Extract travel raw values
    travel_raw_list = [emp.get('workload', {}).get('businessTravelFrequency') or 'Non-Travel' for emp in employees]
    # Attempt to batch encode
    try:
        travel_enc_list = _le.transform(travel_raw_list).tolist()
    except Exception:
        # Fallback element-wise encoding if there are any unseen/null categories
        travel_enc_list = []
        for tr in travel_raw_list:
            try:
                travel_enc_list.append(int(_le.transform([tr])[0]))
            except Exception:
                travel_enc_list.append(0)

    for idx, emp in enumerate(employees):
        workload     = emp.get('workload') or {}
        env          = emp.get('environment') or {}
        employment   = emp.get('employment') or {}
        compensation = emp.get('compensation') or {}
        performance  = emp.get('performance') or {}
        attendance   = emp.get('attendance') or {}
        personal     = emp.get('personal') or {}

        travel_enc = travel_enc_list[idx]

        market = float(compensation.get('estimatedMarketSalary') or 1)
        if market <= 0:
            market = 1.0
        gap    = float(compensation.get('salaryGap') or 0)
        gap_pct = gap / market

        row = {
            'overtime_hours':        float(workload.get('overtimeHours') or 0),
            'weekly_hours':          float(workload.get('weeklyWorkingHours') or 40),
            'weekend_work':          int(bool(workload.get('weekendWork'))),
            'business_travel_enc':   travel_enc,
            'salary_gap_pct':        round(gap_pct, 4),
            'benefits_satisfaction': float(compensation.get('benefitsSatisfaction') or 3),
            'work_life_balance':     float(env.get('workLifeBalance') or 3),
            'job_satisfaction':      float(env.get('jobSatisfaction') or 3),
            'manager_relationship':  float(env.get('managerRelationship') or 3),
            'recognition_score':     float(env.get('recognitionScore') or 3),
            'stress_level':          float(env.get('stressLevel') or 3),
            'employee_engagement':   float(env.get('employeeEngagement') or 3),
            'culture_rating':        float(env.get('companyCultureRating') or 3),
            'years_at_company':      float(employment.get('yearsAtCompany') or 3),
            'years_in_role':         float(employment.get('yearsInCurrentRole') or 2),
            'years_since_promotion': float(employment.get('yearsSinceLastPromotion') or 2),
            'years_with_manager':    float(employment.get('yearsWithCurrentManager') or 2),
            'performance_rating':    float(performance.get('performanceRating') or 3),
            'training_hours':        float(performance.get('trainingHours') or 20),
            'distance_from_office':  float(personal.get('distanceFromOffice') or 10),
            'absenteeism':           float(attendance.get('absenteeism') or 0),
            'late_arrivals':         float(attendance.get('lateArrivals') or 0),
            'age':                   float(personal.get('age') or 35),
            'job_level':             float(employment.get('jobLevel') or 2),
        }
        rows.append(row)

    return pd.DataFrame(rows)[FEATURES]


def analyze_employee_risk_batch(employees: list) -> list:
    if not employees:
        return []

    feat_df = _extract_batch(employees)

    dt_probs  = _dt.predict_proba(feat_df)[:, 1]
    rf_probs  = _rf.predict_proba(feat_df)[:, 1]
    xgb_probs = _xgb.predict_proba(feat_df)[:, 1]

    processed_employees = []

    for idx, emp in enumerate(employees):
        dt_p = float(dt_probs[idx])
        rf_p = float(rf_probs[idx])
        xgb_p = float(xgb_probs[idx])

        ensemble = 0.25 * dt_p + 0.35 * rf_p + 0.40 * xgb_p

        preds = {
            'decision_tree': round(dt_p * 100, 1),
            'random_forest': round(rf_p * 100, 1),
            'xgboost':       round(xgb_p * 100, 1),
            'ensemble':      round(ensemble * 100, 1),
        }

        prob = max(1, min(99, round(preds['ensemble'])))
        risk_level = ('Critical' if prob >= 75 else 'High' if prob >= 50 else 'Medium' if prob >= 25 else 'Low')

        row_df = feat_df.iloc[[idx]]
        contribs = _contributions(row_df, emp)

        model_probs = [preds['decision_tree'], preds['random_forest'], preds['xgboost']]
        std_dev     = float(np.std(model_probs))
        confidence  = int(max(70, min(98, 95 - std_dev)))

        top_drivers = [c['displayName'] for c in contribs if c['shapValue'] > 0][:6]
        recs        = _recommendations(emp, contribs)
        reason_pred = predict_attrition_reason(emp)

        emp['analysis'] = {
            'probability':      prob,
            'riskLevel':        risk_level,
            'confidence':       confidence,
            'topDrivers':       top_drivers,
            'contributions':    contribs,
            'recommendations':  recs,
            'reasonPrediction': reason_pred,
            'modelBreakdown':   preds,
        }
        processed_employees.append(emp)

    return processed_employees

