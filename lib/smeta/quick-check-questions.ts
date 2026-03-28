import type { QuickCheckQuestion } from '@/types'

export const QUICK_CHECK_QUESTIONS: QuickCheckQuestion[] = [
  {
    id: 'workforce_size',
    question: 'How many workers are employed at your site?',
    subtitle: 'Including permanent, temporary, and seasonal workers',
    pillar: 'context',
    options: [
      { value: '1-10', label: '1–10', score: 0 },
      { value: '11-50', label: '11–50', score: 0 },
      { value: '51-200', label: '51–200', score: 0 },
      { value: '200+', label: '200+', score: 0 },
    ],
  },
  {
    id: 'worker_documentation',
    question: 'How would you describe your worker documentation?',
    subtitle: 'Think contracts, age verification, and right-to-work records',
    pillar: 'labour',
    options: [
      { value: 'not_started', label: 'Not started', score: 0 },
      { value: 'partial', label: 'Partially in place', score: 0.5 },
      { value: 'mostly_complete', label: 'Mostly complete', score: 1.0 },
      { value: 'fully_documented', label: 'Fully documented', score: 1.5 },
    ],
  },
  {
    id: 'health_safety_management',
    question: "What's the state of your health & safety management?",
    subtitle: 'Written policies, risk assessments, and incident records',
    pillar: 'health_safety',
    options: [
      { value: 'no_formal', label: 'No formal system', score: 0 },
      { value: 'informal', label: 'Some informal practices', score: 0.5 },
      { value: 'documented_stale', label: 'Documented but not reviewed recently', score: 1.0 },
      { value: 'active', label: 'Active and up to date', score: 1.5 },
    ],
  },
  {
    id: 'fire_safety',
    question: 'How do you manage fire safety?',
    subtitle: 'Exits, drills, signage, and emergency procedures',
    pillar: 'health_safety',
    options: [
      { value: 'not_assessed', label: "Haven't assessed this yet", score: 0 },
      { value: 'some_measures', label: 'Some measures but no regular drills', score: 0.5 },
      { value: 'regular', label: 'Regular drills and marked exits', score: 1.0 },
      { value: 'full_programme', label: 'Full fire safety programme', score: 1.5 },
    ],
  },
  {
    id: 'audit_history',
    question: 'Have you been through an ethical trade audit before?',
    subtitle: 'SMETA, BSCI, SA8000, or similar social compliance audits',
    pillar: 'context',
    options: [
      { value: 'never', label: 'Never', score: 0 },
      { value: 'attempted', label: "Attempted but didn't pass", score: 0.5 },
      { value: 'passed_old', label: "Passed but it's been over 2 years", score: 1.0 },
      { value: 'passed_recent', label: 'Passed within the last 2 years', score: 1.5 },
    ],
  },
]
