import type { QuickCheckQuestion } from '@/types'

export const QUICK_CHECK_QUESTIONS: QuickCheckQuestion[] = [
  {
    id: 'QC1',
    question: 'Are there any workers under the age of 15 on your site (or under local school-leaving age if higher)?',
    signal: 'Zero-tolerance: child labour',
  },
  {
    id: 'QC2',
    question: 'Are all workers free to leave employment with reasonable notice and without penalty, debt, or retention of identity documents?',
    signal: 'Zero-tolerance: forced labour',
  },
  {
    id: 'QC3',
    question: 'Are fire exits clearly marked, unobstructed, and tested via evacuation drills at least twice per year?',
    signal: 'Critical: fire safety',
  },
  {
    id: 'QC4',
    question: 'Do all workers receive at least the legal minimum wage, paid on time and in full?',
    signal: 'Critical: wage compliance',
  },
  {
    id: 'QC5',
    question: 'Is there a written Health & Safety policy, signed by senior management and displayed on site?',
    signal: 'Critical: H&S governance',
  },
]
