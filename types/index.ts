// ─── Domain enums ────────────────────────────────────────────────────────────

export type SiteType = 'farm' | 'packhouse' | 'factory' | 'warehouse' | 'office'

export type Pillar = 'labour' | 'health_safety' | 'environment' | 'business_ethics'

export type Severity = 'zero_tolerance' | 'critical' | 'major' | 'minor' | 'conformant'

export type IntakeMode = 'conversation' | 'form'

export type IntakeStatus = 'not_started' | 'in_progress' | 'submitted'

export type AnalysisJobStatus = 'pending' | 'running' | 'complete' | 'failed'

export type ResponseType = 'yes_no' | 'text' | 'number' | 'select' | 'multiselect'

export type ResponseSource = 'form' | 'conversation' | 'quick_check'

export type EstimatedEffort = 'low' | 'medium' | 'high'

export type RiskGrade = 'high_risk' | 'moderate_risk' | 'low_risk'

// ─── Database row types ───────────────────────────────────────────────────────

export interface Organisation {
  id: string
  name: string
  created_at: string
  updated_at: string
}

export interface UserProfile {
  id: string
  organisation_id: string
  full_name: string | null
  created_at: string
}

export interface Site {
  id: string
  organisation_id: string
  name: string
  site_type: SiteType
  address: string | null
  country: string
  employee_count: number | null
  intake_mode: IntakeMode
  intake_status: IntakeStatus
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface IntakeResponse {
  id: string
  site_id: string
  question_id: string
  pillar: Pillar
  response_value: string | null
  response_type: ResponseType
  source: ResponseSource
  created_at: string
  updated_at: string
}

export interface ConversationTurn {
  id: string
  site_id: string
  turn_number: number
  role: 'assistant' | 'user'
  content: string
  extracted_question_ids: string[] | null
  created_at: string
}

export interface AnalysisJob {
  id: string
  site_id: string
  status: AnalysisJobStatus
  analysis_narrative: string | null
  error_message: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string
}

export interface GapFinding {
  id: string
  site_id: string
  analysis_job_id: string
  criteria_id: string
  pillar: Pillar
  severity: Severity
  finding: string
  recommendation: string
  confidence: number
  estimated_effort: EstimatedEffort | null
  evidence_needed: string | null
  created_at: string
}

export interface FindingNote {
  id: string
  finding_id: string
  note: string
  created_by: string
  created_at: string
}

export interface ReadinessScore {
  id: string
  site_id: string
  analysis_job_id: string
  pillar: Pillar | 'overall'
  score: number
  findings_count: number
  zero_tolerance_count: number
  critical_count: number
  major_count: number
  minor_count: number
  conformant_count: number
  created_at: string
}

export interface QuickCheckSubmission {
  id: string
  ip_hash: string
  site_type: SiteType
  country: string
  responses: Record<string, string>
  risk_grade: RiskGrade
  risk_summary: string
  created_at: string
}

// ─── Scoring types ────────────────────────────────────────────────────────────

export interface ScoreSet {
  overall: number
  labour: number
  health_safety: number
  environment: number
  business_ethics: number
  zero_tolerance_count: number
  critical_count: number
  major_count: number
  minor_count: number
  conformant_count: number
  total_count: number
}

export interface ScoreDelta {
  overall: number
  labour: number
  health_safety: number
  environment: number
  business_ethics: number
}

// ─── Quick check types ────────────────────────────────────────────────────────

export type QuickCheckResponses = {
  QC1: 'yes' | 'no'
  QC2: 'yes' | 'no'
  QC3: 'yes' | 'no'
  QC4: 'yes' | 'no'
  QC5: 'yes' | 'no'
}

export type QuickCheckReason =
  | 'zero_tolerance_detected'
  | 'multiple_critical_gaps'
  | 'single_critical_gap'
  | 'no_immediate_concerns'

export interface QuickCheckResult {
  grade: RiskGrade
  reason: QuickCheckReason
}

// ─── Intake question types ────────────────────────────────────────────────────

export interface IntakeQuestion {
  id: string
  question: string
  type: ResponseType
  pillar: Pillar
  criteria_ids: string[]
  placeholder?: string
}

export interface QuickCheckQuestion {
  id: keyof QuickCheckResponses
  question: string
  signal: string
}

// ─── AI response types ────────────────────────────────────────────────────────

export interface ConversationExtractedItem {
  question_id: string
  response_value: string
  confidence: number
}

export interface ConversationAIResponse {
  message: string
  extracted: ConversationExtractedItem[]
  follow_up_reason?: string
  coverage_complete: boolean
}

export interface GapFindingAIOutput {
  criteria_id: string
  pillar: Pillar
  severity: Severity
  finding: string
  recommendation: string
  confidence: number
  estimated_effort: EstimatedEffort | null
  evidence_needed: string | null
}

export interface QuickCheckAIResponse {
  risk_grade: RiskGrade
  risk_summary: string
  top_concerns: string[]
  cta_message: string
}

// ─── API response types ───────────────────────────────────────────────────────

export interface ApiError {
  error: string
}

export interface SiteWithLatestScore extends Site {
  latest_score?: ReadinessScore | null
  latest_analysis?: AnalysisJob | null
}

export interface GapFindingWithNotes extends GapFinding {
  notes: FindingNote[]
}

// ─── SMETA criteria types ─────────────────────────────────────────────────────

export interface SmetaCriteria {
  id: string
  pillar: Pillar
  description: string
  zero_tolerance: boolean
}
