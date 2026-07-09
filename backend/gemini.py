"""
gemini.py — Wraps the Gemini API for HR narrative write-ups (replaces gemini.ts)
Falls back to rule-based text when no API key is set or the call fails.
"""
import os
import google.generativeai as genai

_client_initialized = False

def _get_client():
    global _client_initialized
    key = os.environ.get('GEMINI_API_KEY')
    if not key:
        print('GEMINI_API_KEY not set. AI narratives will use rule-based fallbacks.')
        return None
    if not _client_initialized:
        genai.configure(api_key=key)
        _client_initialized = True
    return True

MODEL = 'gemini-1.5-flash'


# ── Rule-based fallbacks ──────────────────────────────────────────────────────

def get_rule_based_summary(emp: dict, analysis: dict) -> str:
    top = analysis.get('topDrivers', [])
    name = emp.get('name', 'This employee')
    drivers = f"The primary risk drivers include {', '.join(top[:3])}." if top else 'No major critical risk factors identified.'
    prob  = analysis.get('probability', 0)
    level = analysis.get('riskLevel', 'Low')
    conf  = analysis.get('confidence', 80)

    summary = (
        f"Our intelligence engine identifies {name} as a {level} risk of resigning, "
        f"with an estimated probability of {prob}%. This assessment is backed by a prediction "
        f"confidence of {conf}%. {drivers} "
    )
    if prob >= 50:
        summary += (
            "Immediate action is recommended to mitigate this flight risk. Key focus areas should "
            "include reviewing workload boundaries, establishing a structured dialogue around career "
            "progression, and addressing any active gaps in compensation vs. market value. "
            "Facilitating a supportive conversation with their current manager will also yield positive outcomes."
        )
    else:
        summary += (
            "The employee's metrics are largely within healthy retention bounds. HR and management "
            "should continue supporting their skill development, maintaining open channels for "
            "recognition, and ensuring work-life balance remains sustainable."
        )
    return summary


def get_rule_based_reason_explanation(emp: dict, prediction: dict) -> str:
    name   = emp.get('name', 'This employee')
    reason = prediction.get('primaryReason', 'Unknown')
    conf   = prediction.get('confidence', 75)
    rsn    = prediction.get('reasoning', '')
    return f"""# AI Predictive Diagnostics: {name}

Our predictive model has isolated {reason} as the single highest probability driver behind potential voluntary resignation.

Model Diagnostics & Context:
- Flight Trigger: {rsn}
- Model Confidence: {conf}% (Calibrated variance across SHAP attributions)

Strategic Retention Recommendation:
1. Targeted Relief: Design a direct, non-standard intervention targeting this exact flight trigger within the next 30 days.
2. Organizational Calibration: Address surrounding team workload/compensation patterns to prevent cluster risk.
3. Dialogue: Open a collaborative 1-on-1 dialogue to explore flexible solutions."""


# ── Gemini calls ──────────────────────────────────────────────────────────────

def generate_executive_summary(emp: dict, analysis: dict) -> dict:
    name = emp.get('name', '')
    employment   = emp.get('employment', {})
    compensation = emp.get('compensation', {})
    workload     = emp.get('workload', {})
    env          = emp.get('environment', {})
    attendance   = emp.get('attendance', {})

    prompt = f"""You are an expert HR retention strategist and Senior Workforce Psychologist.
Review the following detailed organizational file for this employee:

Employee Name: {name}
Job Title: {employment.get('jobRole')} in the {employment.get('department')} Department (Job Level: {employment.get('jobLevel')}/5)
Employment Tenure: {employment.get('yearsAtCompany')} years total ({employment.get('yearsInCurrentRole')} in current role)
Promotion History: {employment.get('yearsSinceLastPromotion')} years since last promotion.
Direct Manager Relationship: {employment.get('yearsWithCurrentManager')} years with current manager.

Risk Intelligence Assessment:
- Resignation Probability: {analysis.get('probability')}% ({analysis.get('riskLevel')} Risk Category)
- AI Model Confidence: {analysis.get('confidence')}%
- Identified Flight Risk Drivers: {', '.join(analysis.get('topDrivers', []))}

Compensation Metrics:
- Current Annual Salary: ₹{compensation.get('salary', 0):,} vs Estimated Market Salary: ₹{compensation.get('estimatedMarketSalary', 0):,}
- Salary Gap vs Market: ₹{compensation.get('salaryGap', 0):,}/year (Benefits Satisfaction: {compensation.get('benefitsSatisfaction')}/5)

Workload & Operations:
- Total Weekly Working Hours: {workload.get('weeklyWorkingHours')} hours (includes {workload.get('overtimeHours')} hours overtime)
- Business Travel Frequency: {workload.get('businessTravelFrequency')}
- Weekend Work: {'Required' if workload.get('weekendWork') else 'None'}

Workplace Surveys (out of 5):
- Job Satisfaction: {env.get('jobSatisfaction')}/5
- Work-Life Balance: {env.get('workLifeBalance')}/5
- Manager Relationship: {env.get('managerRelationship')}/5
- Employee Engagement: {env.get('employeeEngagement')}/5
- Recognition Score: {env.get('recognitionScore')}/5
- Stress Level: {env.get('stressLevel')}/5
- Attendance: {attendance.get('absenteeism')} absent days, {attendance.get('lateArrivals')} late arrivals.

YOUR TASK:
Provide a polished, elite-grade, highly actionable Executive Summary for HR and Leadership.
- Paragraph 1: Attrition Risk Diagnostics & Root Causes.
- Paragraph 2: Actionable Mitigation Plan with specific retention tactics.

Tone: Professional, direct, supportive, analytical. ~160-200 words."""

    if not _get_client():
        return {'text': get_rule_based_summary(emp, analysis), 'isFallback': True}

    try:
        print(f"Querying Gemini ({MODEL}) for employee summary: {name}")
        model    = genai.GenerativeModel(MODEL)
        response = model.generate_content(prompt)
        return {'text': response.text or '', 'isFallback': False}
    except Exception as e:
        print(f'Gemini call failed, using rule-based summary: {e}')
        return {'text': get_rule_based_summary(emp, analysis), 'isFallback': True}


def generate_reason_explanation(emp: dict, analysis: dict, prediction: dict) -> dict:
    name = emp.get('name', '')
    employment = emp.get('employment', {})
    reason_probs = prediction.get('reasonProbabilities', [])

    prompt = f"""You are an elite Senior Industrial-Organizational Psychologist and Workforce AI Analyst.
Review this employee's file and our predictive model's output:

Employee Name: {name}
Role: {employment.get('jobRole')} ({employment.get('department')})
Overall Resignation Risk: {analysis.get('probability')}% ({analysis.get('riskLevel')} Risk)

Model Attrition Reason Predictions:
{chr(10).join([f"- {r['reason']}: {r['probability']}% probability. {r['description']}" for r in reason_probs])}

Predicted Primary Leave Reason: {prediction.get('primaryReason')} (Confidence: {prediction.get('confidence')}%)

YOUR TASK:
1. Explain why the model identified "{prediction.get('primaryReason')}" as the highest-ranked leave risk.
2. Rate the validity of this prediction based on industry standards.
3. Draft a precise retention prescription to neutralize this specific primary driver.

Tone: Clinical, analytical, objective, supportive. ~150-180 words."""

    if not _get_client():
        return {'text': get_rule_based_reason_explanation(emp, prediction), 'isFallback': True}

    try:
        print(f"Querying Gemini ({MODEL}) for reason interpretation: {name}")
        model    = genai.GenerativeModel(MODEL)
        response = model.generate_content(prompt)
        return {'text': response.text or '', 'isFallback': False}
    except Exception as e:
        print(f'Gemini call failed for reason interpretation: {e}')
        return {'text': get_rule_based_reason_explanation(emp, prediction), 'isFallback': True}
