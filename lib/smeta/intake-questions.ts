import type { IntakeQuestion } from '@/types'

export const INTAKE_QUESTIONS: IntakeQuestion[] = [
  // ─── Labour (10 questions) ─────────────────────────────────────────────────
  {
    id: 'L1',
    question: 'Does every worker have a signed employment contract in a language they understand?',
    type: 'yes_no',
    pillar: 'labour',
    criteria_ids: ['L7.2', 'L7.3'],
  },
  {
    id: 'L2',
    question: "Are workers' legal minimum wages met for all categories of worker, including piece-rate and casual?",
    type: 'yes_no',
    pillar: 'labour',
    criteria_ids: ['L6.1'],
  },
  {
    id: 'L3',
    question: 'Are wages paid on time and in full, with itemised payslips?',
    type: 'yes_no',
    pillar: 'labour',
    criteria_ids: ['L6.2'],
  },
  {
    id: 'L4',
    question: 'What is the maximum number of hours worked per week (including overtime) in peak season?',
    type: 'number',
    pillar: 'labour',
    criteria_ids: ['L5.1'],
    placeholder: 'e.g. 48',
  },
  {
    id: 'L5',
    question: 'Is all overtime voluntary and compensated at the correct premium rate?',
    type: 'yes_no',
    pillar: 'labour',
    criteria_ids: ['L5.2'],
  },
  {
    id: 'L6',
    question: 'Are there any workers under the age of 15 on site (or under local school-leaving age if higher)?',
    type: 'yes_no',
    pillar: 'labour',
    criteria_ids: ['L2.1'],
  },
  {
    id: 'L7',
    question: 'Are workers free to leave employment with reasonable notice and without penalty or debt?',
    type: 'yes_no',
    pillar: 'labour',
    criteria_ids: ['L1.1', 'L1.2'],
  },
  {
    id: 'L8',
    question: 'Is there a documented grievance procedure that workers are aware of?',
    type: 'yes_no',
    pillar: 'labour',
    criteria_ids: ['BE4.1'],
  },
  {
    id: 'L9',
    question: 'Are workers permitted to form or join a trade union or workers\' committee?',
    type: 'yes_no',
    pillar: 'labour',
    criteria_ids: ['L4.1'],
  },
  {
    id: 'L10',
    question: 'Are hiring, promotion and termination decisions free from discrimination based on gender, age, ethnicity, religion, or pregnancy?',
    type: 'yes_no',
    pillar: 'labour',
    criteria_ids: ['L8.1'],
  },

  // ─── Health & Safety (10 questions) ───────────────────────────────────────
  {
    id: 'HS1',
    question: 'Does the site have a written Health & Safety policy, signed by senior management and displayed on site?',
    type: 'yes_no',
    pillar: 'health_safety',
    criteria_ids: ['H1.1'],
  },
  {
    id: 'HS2',
    question: 'Have workplace risk assessments been completed and reviewed in the past 12 months?',
    type: 'yes_no',
    pillar: 'health_safety',
    criteria_ids: ['H3.1'],
  },
  {
    id: 'HS3',
    question: 'Are fire exits clearly marked, unobstructed, and tested via drills at least twice per year?',
    type: 'yes_no',
    pillar: 'health_safety',
    criteria_ids: ['H4.1'],
  },
  {
    id: 'HS4',
    question: 'Are fire extinguishers and emergency equipment present, inspected, and within service dates?',
    type: 'yes_no',
    pillar: 'health_safety',
    criteria_ids: ['H4.1'],
  },
  {
    id: 'HS5',
    question: 'Are all workplace accidents and near-misses recorded in an incident register?',
    type: 'yes_no',
    pillar: 'health_safety',
    criteria_ids: ['H5.1'],
  },
  {
    id: 'HS6',
    question: 'Is first aid equipment available on site and are trained first aiders present during all shifts?',
    type: 'yes_no',
    pillar: 'health_safety',
    criteria_ids: ['H6.1'],
  },
  {
    id: 'HS7',
    question: 'Are hazardous chemicals stored safely with current Safety Data Sheets accessible to workers?',
    type: 'yes_no',
    pillar: 'health_safety',
    criteria_ids: ['H8.1'],
  },
  {
    id: 'HS8',
    question: 'Is appropriate PPE provided to workers at no cost and are workers trained in its use?',
    type: 'yes_no',
    pillar: 'health_safety',
    criteria_ids: ['H9.1'],
  },
  {
    id: 'HS9',
    question: 'Are adequate welfare facilities available — including clean toilets, drinking water, and rest areas?',
    type: 'yes_no',
    pillar: 'health_safety',
    criteria_ids: ['H10.1'],
  },
  {
    id: 'HS10',
    question: 'Are all machinery and equipment subject to regular maintenance records and safety checks?',
    type: 'yes_no',
    pillar: 'health_safety',
    criteria_ids: ['H7.1'],
  },

  // ─── Environment (6 questions) ─────────────────────────────────────────────
  {
    id: 'E1',
    question: 'Does the site hold all required environmental permits and licenses, current and not expired?',
    type: 'yes_no',
    pillar: 'environment',
    criteria_ids: ['E2.1'],
  },
  {
    id: 'E2',
    question: 'Is there a documented waste management procedure covering segregation, storage, and disposal?',
    type: 'yes_no',
    pillar: 'environment',
    criteria_ids: ['E3.1'],
  },
  {
    id: 'E3',
    question: 'Is wastewater (including agricultural runoff) managed and treated before discharge?',
    type: 'yes_no',
    pillar: 'environment',
    criteria_ids: ['E4.1'],
  },
  {
    id: 'E4',
    question: 'Are hazardous chemicals and agrochemicals stored, used, and disposed of according to label instructions and local regulations?',
    type: 'yes_no',
    pillar: 'environment',
    criteria_ids: ['E6.1'],
  },
  {
    id: 'E5',
    question: 'Is water usage monitored and recorded on a regular basis?',
    type: 'yes_no',
    pillar: 'environment',
    criteria_ids: ['E7.1'],
  },
  {
    id: 'E6',
    question: 'Is energy consumption (electricity, fuel) monitored and recorded?',
    type: 'yes_no',
    pillar: 'environment',
    criteria_ids: ['E8.1'],
  },

  // ─── Business Ethics (6 questions) ────────────────────────────────────────
  {
    id: 'BE1',
    question: 'Does the site have a written anti-bribery and anti-corruption policy that staff are trained on?',
    type: 'yes_no',
    pillar: 'business_ethics',
    criteria_ids: ['BE1.1'],
  },
  {
    id: 'BE2',
    question: 'Are there clear rules governing gifts, hospitality, and conflicts of interest?',
    type: 'yes_no',
    pillar: 'business_ethics',
    criteria_ids: ['BE2.1'],
  },
  {
    id: 'BE3',
    question: 'If labour contractors or sub-contractors are used, is this disclosed to your buyers and are their workers covered by the same labour standards?',
    type: 'yes_no',
    pillar: 'business_ethics',
    criteria_ids: ['L9.2', 'BE3.1'],
  },
  {
    id: 'BE4',
    question: 'Is there a confidential whistleblowing or reporting channel available to all workers?',
    type: 'yes_no',
    pillar: 'business_ethics',
    criteria_ids: ['BE5.1'],
  },
  {
    id: 'BE5',
    question: 'Are financial records accurate, accessible, and available for audit on request?',
    type: 'yes_no',
    pillar: 'business_ethics',
    criteria_ids: ['BE6.1'],
  },
  {
    id: 'BE6',
    question: 'Has the site had a formal social compliance audit (SMETA or equivalent) in the past 24 months?',
    type: 'yes_no',
    pillar: 'business_ethics',
    criteria_ids: [],
  },
]

export const QUESTION_BY_ID = Object.fromEntries(
  INTAKE_QUESTIONS.map((q) => [q.id, q])
) as Record<string, IntakeQuestion>

export const QUESTIONS_BY_PILLAR = INTAKE_QUESTIONS.reduce(
  (acc, q) => {
    if (!acc[q.pillar]) acc[q.pillar] = []
    acc[q.pillar].push(q)
    return acc
  },
  {} as Record<string, IntakeQuestion[]>
)
