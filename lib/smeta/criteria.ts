import type { SmetaCriteria } from '@/types'

export const SMETA_CRITERIA: SmetaCriteria[] = [
  // Labour
  { id: 'L1.1', pillar: 'labour', description: 'Workers are free to leave employment with reasonable notice', zero_tolerance: true },
  { id: 'L1.2', pillar: 'labour', description: 'No retention of identity documents or deposits', zero_tolerance: true },
  { id: 'L2.1', pillar: 'labour', description: 'No workers under minimum legal working age (15 or local school-leaving age)', zero_tolerance: true },
  { id: 'L4.1', pillar: 'labour', description: 'Workers have the right to form or join a trade union', zero_tolerance: false },
  { id: 'L5.1', pillar: 'labour', description: 'Working hours comply with legal limits (max 60 hrs/week including overtime)', zero_tolerance: false },
  { id: 'L5.2', pillar: 'labour', description: 'Overtime is voluntary and compensated at the correct premium', zero_tolerance: false },
  { id: 'L6.1', pillar: 'labour', description: 'All workers receive at least the legal minimum wage', zero_tolerance: false },
  { id: 'L6.2', pillar: 'labour', description: 'Wages paid on time and in full with itemised payslips', zero_tolerance: false },
  { id: 'L7.2', pillar: 'labour', description: 'All workers have signed employment contracts', zero_tolerance: false },
  { id: 'L7.3', pillar: 'labour', description: 'Contracts are in a language the worker understands', zero_tolerance: false },
  { id: 'L8.1', pillar: 'labour', description: 'No discrimination in hiring, promotion, or termination', zero_tolerance: false },
  { id: 'L9.2', pillar: 'labour', description: 'Sub-contracted workers covered by same labour standards', zero_tolerance: false },

  // Health & Safety
  { id: 'H1.1', pillar: 'health_safety', description: 'Written H&S policy signed by senior management', zero_tolerance: false },
  { id: 'H3.1', pillar: 'health_safety', description: 'Risk assessments completed and reviewed in past 12 months', zero_tolerance: false },
  { id: 'H4.1', pillar: 'health_safety', description: 'Fire safety: marked exits, drills, extinguishers in date', zero_tolerance: false },
  { id: 'H5.1', pillar: 'health_safety', description: 'Incident register maintained for accidents and near-misses', zero_tolerance: false },
  { id: 'H6.1', pillar: 'health_safety', description: 'First aid equipment available, trained first aiders on all shifts', zero_tolerance: false },
  { id: 'H7.1', pillar: 'health_safety', description: 'Machinery subject to regular maintenance and safety checks', zero_tolerance: false },
  { id: 'H8.1', pillar: 'health_safety', description: 'Hazardous chemicals stored safely with current SDS accessible', zero_tolerance: false },
  { id: 'H9.1', pillar: 'health_safety', description: 'PPE provided at no cost, workers trained in its use', zero_tolerance: false },
  { id: 'H10.1', pillar: 'health_safety', description: 'Adequate welfare facilities: toilets, drinking water, rest areas', zero_tolerance: false },

  // Environment
  { id: 'E2.1', pillar: 'environment', description: 'All required environmental permits current and not expired', zero_tolerance: false },
  { id: 'E3.1', pillar: 'environment', description: 'Documented waste management procedure in place', zero_tolerance: false },
  { id: 'E4.1', pillar: 'environment', description: 'Wastewater managed and treated before discharge', zero_tolerance: false },
  { id: 'E6.1', pillar: 'environment', description: 'Hazardous chemicals stored and disposed per regulations', zero_tolerance: false },
  { id: 'E7.1', pillar: 'environment', description: 'Water usage monitored and recorded', zero_tolerance: false },
  { id: 'E8.1', pillar: 'environment', description: 'Energy consumption monitored and recorded', zero_tolerance: false },

  // Business Ethics
  { id: 'BE1.1', pillar: 'business_ethics', description: 'Written anti-bribery/corruption policy, staff trained', zero_tolerance: false },
  { id: 'BE2.1', pillar: 'business_ethics', description: 'Clear rules on gifts, hospitality, conflicts of interest', zero_tolerance: false },
  { id: 'BE3.1', pillar: 'business_ethics', description: 'Sub-contracting disclosed to buyers', zero_tolerance: false },
  { id: 'BE4.1', pillar: 'business_ethics', description: 'Documented grievance procedure known to workers', zero_tolerance: false },
  { id: 'BE5.1', pillar: 'business_ethics', description: 'Confidential whistleblowing channel available to all workers', zero_tolerance: false },
  { id: 'BE6.1', pillar: 'business_ethics', description: 'Financial records accurate and available for audit', zero_tolerance: false },
]

export const CRITERIA_BY_ID = Object.fromEntries(
  SMETA_CRITERIA.map((c) => [c.id, c])
) as Record<string, SmetaCriteria>
