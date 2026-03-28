-- Migration: Update quick_check_submissions for pillar-based readiness model
-- The old CHECK constraint only allowed 'high_risk', 'moderate_risk', 'low_risk'.
-- The new model uses readiness levels: 'getting_started', 'making_progress', 'looking_good', 'not_assessed'.

ALTER TABLE quick_check_submissions
  DROP CONSTRAINT IF EXISTS quick_check_submissions_risk_grade_check;

ALTER TABLE quick_check_submissions
  ADD CONSTRAINT quick_check_submissions_risk_grade_check
  CHECK (risk_grade IN ('high_risk', 'moderate_risk', 'low_risk', 'getting_started', 'making_progress', 'looking_good', 'not_assessed'));
