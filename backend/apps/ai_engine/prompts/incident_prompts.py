"""
User prompt templates for incident analysis, severity prediction, and recommendation generation.
"""

from typing import List, Optional


def build_incident_analysis_prompt(
    title: str,
    description: str,
    logs: Optional[str] = None,
    severity: Optional[str] = None,
    impact: Optional[str] = None,
) -> str:
    """
    Build structured prompt for incident root cause and impact analysis.
    """
    prompt = (
        "Analyze the following production incident and provide a structured JSON response:\n\n"
        f"Title: {title}\n"
        f"Description: {description}\n"
    )
    if severity:
        prompt += f"Severity: {severity}\n"
    if impact:
        prompt += f"Impact: {impact}\n"
    if logs:
        prompt += f"Telemetry/Logs:\n{logs}\n"

    prompt += (
        "\nReturn a valid JSON object with the following schema:\n"
        "{\n"
        '  "summary": "Executive summary of the incident (1-2 sentences)",\n'
        '  "probable_root_cause": "Detailed probable technical root cause",\n'
        '  "affected_components": ["Component A", "Component B"],\n'
        '  "recommended_actions": ["Action 1", "Action 2"]\n'
        "}"
    )
    return prompt


def build_severity_prediction_prompt(
    category: str,
    impact: str,
    affected_users: int,
    description: str,
) -> str:
    """
    Build structured prompt for severity prediction and confidence scoring.
    """
    return (
        "Evaluate the severity of the following incident and provide a structured JSON response:\n\n"
        f"Category: {category}\n"
        f"Impact: {impact}\n"
        f"Affected Users: {affected_users}\n"
        f"Description: {description}\n\n"
        "Return a valid JSON object with the following schema:\n"
        "{\n"
        '  "predicted_severity": "CRITICAL|HIGH|MEDIUM|LOW",\n'
        '  "confidence_score": 0.85\n'
        "}\n"
        "Note: confidence_score must be a float between 0.0 and 1.0."
    )


def build_recommendations_prompt(
    title: str,
    description: str,
    category: Optional[str] = None,
    severity: Optional[str] = None,
    affected_components: Optional[List[str]] = None,
) -> str:
    """
    Build structured prompt for immediate mitigation, investigation checklist, and prevention recommendations.
    """
    prompt = (
        "Generate actionable response recommendations for the following incident:\n\n"
        f"Title: {title}\n"
        f"Description: {description}\n"
    )
    if category:
        prompt += f"Category: {category}\n"
    if severity:
        prompt += f"Severity: {severity}\n"
    if affected_components:
        prompt += f"Affected Components: {', '.join(affected_components)}\n"

    prompt += (
        "\nReturn a valid JSON object with the following schema:\n"
        "{\n"
        '  "immediate_mitigation_steps": ["Step 1", "Step 2"],\n'
        '  "investigation_checklist": ["Check 1", "Check 2"],\n'
        '  "prevention_recommendations": ["Recommendation 1", "Recommendation 2"]\n'
        "}"
    )
    return prompt
