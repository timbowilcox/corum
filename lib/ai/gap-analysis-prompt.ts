import type { IntakeResponse, Site } from '@/types'
import { SMETA_CRITERIA } from '@/lib/smeta/criteria'
import { QUESTION_BY_ID } from '@/lib/smeta/intake-questions'
import { getCountryContext } from '@/lib/smeta/country-context'

export const GAP_ANALYSIS_PROMPT_VERSION = 'v1'

export function buildReasoningPrompt(
  site: Site,
  responses: IntakeResponse[]
): string {
  const countryContext = getCountryContext(site.country)
  const jurisdictionSection = countryContext
    ? `JURISDICTION-SPECIFIC REGULATIONS:\n${countryContext}`
    : `JURISDICTION-SPECIFIC REGULATIONS:\nNo specific regulatory context available for country code "${site.country}". Please flag any jurisdiction-specific criteria for manual review and note that local regulations may impose additional requirements beyond the SMETA standard.`

  const formattedResponses = responses
    .map((r) => {
      const question = QUESTION_BY_ID[r.question_id]
      const questionText = question?.question ?? r.question_id
      return `[${r.question_id}] (${r.pillar}, source: ${r.source}) Q: ${questionText}\nA: ${r.response_value ?? 'No response provided'}`
    })
    .join('\n\n')

  const criteriaList = SMETA_CRITERIA.map(
    (c) => `- ${c.id} [${c.pillar}]${c.zero_tolerance ? ' ⚠ ZERO TOLERANCE' : ''}: ${c.description}`
  ).join('\n')

  return `You are a SMETA (Sedex Members Ethical Trade Audit) compliance expert performing a thorough gap analysis.

SITE CONTEXT:
Name: ${site.name}
Type: ${site.site_type}
Country: ${site.country}
Employee count: ${site.employee_count ?? 'not specified'}

${jurisdictionSection}

INTAKE RESPONSES:
${formattedResponses || 'No responses provided.'}

SMETA CRITERIA MAPPING:
${criteriaList}

TASK:
Perform a detailed analysis of this site's SMETA compliance readiness. For each of the four pillars:

1. Assess each criterion based on the intake responses
2. Cross-reference related responses for consistency — flag contradictions (e.g., high working hours reported alongside claims of voluntary overtime)
3. Consider jurisdiction-specific requirements — an Australian farm has different regulatory obligations than a Thai factory
4. Note where responses are ambiguous or insufficient for a definitive assessment
5. For each finding, assess your confidence level (how certain are you based on the available evidence?)
6. For non-conformant findings, estimate the remediation effort (low/medium/high) and describe what evidence would resolve the gap

Write your analysis as a detailed narrative. Be thorough. This reasoning will be stored as an audit preparation document for the supplier.`
}

export function buildExtractionPrompt(narrative: string): string {
  return `You are a structured data extraction agent. Below is a detailed SMETA compliance analysis narrative.
Extract the findings into a structured JSON array.

ANALYSIS NARRATIVE:
${narrative}

Return ONLY a JSON array. No prose, no markdown, no explanation.
Each item must match this exact structure:
[
  {
    "criteria_id": "L1.1",
    "pillar": "labour",
    "severity": "conformant",
    "finding": "Workers are free to leave employment with reasonable notice.",
    "recommendation": "Maintain current practice and document in worker handbook.",
    "confidence": 0.9,
    "estimated_effort": "low",
    "evidence_needed": "Copy of standard employment contract showing notice period clause."
  }
]

SEVERITY RULES:
- conformant: criterion appears to be met based on responses
- minor: small gap, improvement recommended
- major: significant gap requiring remediation before next audit
- critical: serious non-conformance, urgent action required within 30 days
- zero_tolerance: ONLY for confirmed child labour, forced labour, or physical abuse

CONFIDENCE RULES:
- >= 0.8: clear evidence from intake responses
- 0.5-0.8: partial evidence, inference required
- < 0.5: cannot be assessed from intake alone

Cover every criterion in the mapping. If a criterion cannot be assessed, classify as "major" with confidence < 0.5.
For estimated_effort and evidence_needed, use null for conformant findings where no action is needed.`
}
