"""
train_model.py — Trains an ensemble of Decision Tree, Random Forest, and XGBoost
models for employee attrition risk prediction.

Run this once to produce 'models.pkl' which the Flask server loads at startup.
"""

import numpy as np
import os
import pandas as pd
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.calibration import CalibratedClassifierCV
import xgboost as xgb
import joblib
import random

random.seed(42)
np.random.seed(42)

# ---------------------------------------------------------------------------
# Generate a realistic synthetic training dataset (IBM HR-like structure)
# ---------------------------------------------------------------------------
N = 6000

def gen_dataset(n):
    rows = []
    for _ in range(n):
        overtime_hours       = random.choices([0, 2, 5, 8, 12, 16, 20], weights=[25,10,15,20,15,10,5])[0]
        weekly_hours         = 38 + overtime_hours + random.randint(-2, 4)
        weekly_hours         = max(38, min(70, weekly_hours))
        weekend_work         = overtime_hours > 8 and random.random() < 0.6
        business_travel      = random.choices(['Non-Travel', 'Rarely', 'Frequently'], weights=[40, 40, 20])[0]
        salary_gap_pct       = random.choices([-0.15, -0.05, 0.0, 0.05, 0.12, 0.22, 0.32], weights=[5,10,20,25,20,12,8])[0]
        salary_gap_pct       = max(-0.2, min(0.5, salary_gap_pct + random.gauss(0, 0.03)))
        benefits_satisfaction = random.randint(1, 5)
        wlb                  = random.randint(1, 5)
        job_satisfaction     = random.randint(1, 5)
        manager_rel          = random.randint(1, 5)
        recognition          = random.randint(1, 5)
        stress_level         = random.randint(1, 5)
        engagement           = random.randint(1, 5)
        culture              = random.randint(1, 5)
        yrs_company          = random.choices([0,1,2,3,4,5,7,10,15,20], weights=[5,8,10,10,10,12,15,12,10,8])[0]
        yrs_role             = min(yrs_company, random.randint(0, max(1, yrs_company)))
        yrs_since_promo      = min(yrs_company, random.choices([0,1,2,3,4,5,7,10], weights=[15,20,20,15,12,8,6,4])[0])
        yrs_mgr              = min(yrs_company, random.randint(0, max(1, yrs_company)))
        perf_rating          = random.randint(1, 5)
        training_hours       = random.randint(0, 80)
        distance             = random.choices([1,5,10,15,20,25,30,40,50], weights=[10,15,20,15,15,10,8,5,2])[0]
        absenteeism          = random.choices([0,1,2,3,4,5,8,12], weights=[30,20,15,12,10,7,4,2])[0]
        late_arrivals        = random.choices([0,1,2,3,5,8,12], weights=[30,20,15,12,10,8,5])[0]
        age                  = random.randint(22, 58)
        job_level            = random.randint(1, 5)

        # Build realistic attrition probability
        risk = 0.18

        # Overtime / workload
        if overtime_hours > 10: risk += 0.18
        elif overtime_hours > 2: risk += 0.08
        if weekend_work: risk += 0.05

        # Salary gap
        if salary_gap_pct > 0.20: risk += 0.19
        elif salary_gap_pct > 0.10: risk += 0.10
        elif salary_gap_pct > 0.02: risk += 0.03
        elif salary_gap_pct < 0: risk -= 0.08

        # Work-life balance
        if wlb <= 2: risk += (3 - wlb) * 0.07
        elif wlb >= 4: risk -= 0.07

        # Job satisfaction
        if job_satisfaction <= 2: risk += (3 - job_satisfaction) * 0.08
        elif job_satisfaction >= 4: risk -= 0.09

        # Years since promotion
        if yrs_since_promo >= 3: risk += min(0.14, yrs_since_promo * 0.03)
        else: risk -= 0.04

        # Business travel
        if business_travel == 'Frequently': risk += 0.11
        elif business_travel == 'Rarely': risk += 0.02
        else: risk -= 0.04

        # Manager
        if manager_rel <= 2: risk += (3 - manager_rel) * 0.09
        elif manager_rel >= 4: risk -= 0.08

        # Recognition
        if recognition <= 2: risk += (3 - recognition) * 0.06
        elif recognition >= 4: risk -= 0.06

        # Distance
        if distance > 25: risk += min(0.09, (distance - 20) * 0.004)
        else: risk -= 0.03

        # Stress + performance
        if stress_level >= 4 and perf_rating >= 4: risk += 0.08
        elif stress_level <= 2: risk -= 0.04

        # Absenteeism
        if absenteeism > 4 or late_arrivals > 6: risk += 0.07

        # Young employees leave more
        if age < 30: risk += 0.05
        elif age > 45: risk -= 0.05

        # Entry-level employees
        if job_level == 1: risk += 0.05

        # Benefits
        if benefits_satisfaction <= 2: risk += 0.04

        risk = max(0.01, min(0.99, risk + np.random.normal(0, 0.08)))
        attrition = int(risk > 0.5)

        rows.append({
            'overtime_hours': overtime_hours,
            'weekly_hours': weekly_hours,
            'weekend_work': int(weekend_work),
            'business_travel': business_travel,
            'salary_gap_pct': round(salary_gap_pct, 4),
            'benefits_satisfaction': benefits_satisfaction,
            'work_life_balance': wlb,
            'job_satisfaction': job_satisfaction,
            'manager_relationship': manager_rel,
            'recognition_score': recognition,
            'stress_level': stress_level,
            'employee_engagement': engagement,
            'culture_rating': culture,
            'years_at_company': yrs_company,
            'years_in_role': yrs_role,
            'years_since_promotion': yrs_since_promo,
            'years_with_manager': yrs_mgr,
            'performance_rating': perf_rating,
            'training_hours': training_hours,
            'distance_from_office': distance,
            'absenteeism': absenteeism,
            'late_arrivals': late_arrivals,
            'age': age,
            'job_level': job_level,
            'attrition': attrition,
        })
    return pd.DataFrame(rows)

print("Generating training data...")
df = gen_dataset(N)
print(f"Dataset shape: {df.shape}, attrition rate: {df.attrition.mean():.2%}")

# Encode categorical
le = LabelEncoder()
df['business_travel_enc'] = le.fit_transform(df['business_travel'])

FEATURES = [
    'overtime_hours', 'weekly_hours', 'weekend_work', 'business_travel_enc',
    'salary_gap_pct', 'benefits_satisfaction', 'work_life_balance',
    'job_satisfaction', 'manager_relationship', 'recognition_score',
    'stress_level', 'employee_engagement', 'culture_rating',
    'years_at_company', 'years_in_role', 'years_since_promotion',
    'years_with_manager', 'performance_rating', 'training_hours',
    'distance_from_office', 'absenteeism', 'late_arrivals', 'age', 'job_level',
]

X = df[FEATURES]
y = df['attrition']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

print("Training Decision Tree...")
dt = DecisionTreeClassifier(max_depth=8, min_samples_split=20, min_samples_leaf=10, random_state=42)
dt_cal = CalibratedClassifierCV(dt, cv=5, method='sigmoid')
dt_cal.fit(X_train, y_train)

print("Training Random Forest...")
rf = RandomForestClassifier(n_estimators=200, max_depth=10, min_samples_split=15,
                             min_samples_leaf=8, random_state=42, n_jobs=-1)
rf_cal = CalibratedClassifierCV(rf, cv=5, method='sigmoid')
rf_cal.fit(X_train, y_train)

print("Training XGBoost...")
xgb_model = xgb.XGBClassifier(
    n_estimators=200, max_depth=6, learning_rate=0.08,
    subsample=0.8, colsample_bytree=0.8, use_label_encoder=False,
    eval_metric='logloss', random_state=42, n_jobs=-1
)
xgb_cal = CalibratedClassifierCV(xgb_model, cv=5, method='sigmoid')
xgb_cal.fit(X_train, y_train)

# Evaluate
from sklearn.metrics import accuracy_score, roc_auc_score
for name, model in [('DecisionTree', dt_cal), ('RandomForest', rf_cal), ('XGBoost', xgb_cal)]:
    preds = model.predict(X_test)
    proba = model.predict_proba(X_test)[:, 1]
    print(f"  {name} - Accuracy: {accuracy_score(y_test, preds):.3f}, AUC: {roc_auc_score(y_test, proba):.3f}")

# Get feature importances from underlying RF model
try:
    cc = rf_cal.calibrated_classifiers_[0]
    rf_base = cc.estimator if hasattr(cc, 'estimator') else cc.base_estimator
    importances = rf_base.feature_importances_
except Exception:
    # Fallback: train a plain RF just for importances
    _rf_plain = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42, n_jobs=-1)
    _rf_plain.fit(X_train, y_train)
    importances = _rf_plain.feature_importances_

feature_importance_dict = dict(zip(FEATURES, importances.tolist()))

# Save everything
bundle = {
    'dt_model': dt_cal,
    'rf_model': rf_cal,
    'xgb_model': xgb_cal,
    'label_encoder': le,
    'features': FEATURES,
    'feature_importance': feature_importance_dict,
}
joblib.dump(bundle, os.path.join(os.path.dirname(__file__), 'models.pkl'))
print("\nModels saved to models.pkl successfully.")
print("Feature importances (top 10):")
sorted_imp = sorted(feature_importance_dict.items(), key=lambda x: -x[1])
for feat, imp in sorted_imp[:10]:
    print(f"  {feat}: {imp:.4f}")
