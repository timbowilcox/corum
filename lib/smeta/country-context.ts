export const COUNTRY_CONTEXT: Record<string, string> = {
  AU: `
    AUSTRALIAN REGULATORY CONTEXT:
    - Work Health and Safety Act 2011 (Cth) and state WHS Acts
    - Fair Work Act 2009: National Employment Standards, Modern Awards, minimum wage via FWC Annual Wage Review
    - Modern Slavery Act 2018 (Cth): reporting obligations for entities with >$100M revenue
    - Maximum ordinary hours: 38/week under NES. Reasonable overtime provisions apply.
    - Minimum wage: updated annually by Fair Work Commission (currently ~$24.10/hr as of July 2025)
    - Age restrictions: generally 15+ for most work, with restrictions on hazardous work for under-18s
    - Anti-discrimination: Federal and state legislation (Age, Disability, Racial, Sex Discrimination Acts)
    - Workers' compensation: mandatory state-based schemes
    - Right of entry for union officials under Fair Work Act
  `,
  NZ: `
    NEW ZEALAND REGULATORY CONTEXT:
    - Health and Safety at Work Act 2015 (HSWA)
    - Employment Relations Act 2000
    - Minimum Wage Act 1983: adult minimum wage updated annually
    - Modern Slavery legislation: in development as of 2025
    - Maximum hours: no statutory cap, but must be reasonable under ERA
    - Minimum age: 16 for most work
  `,
  GB: `
    UK REGULATORY CONTEXT:
    - Health and Safety at Work Act 1974
    - Employment Rights Act 1996
    - Modern Slavery Act 2015: statements required for organisations with >£36M turnover
    - National Minimum/Living Wage: varies by age band, updated annually
    - Working Time Regulations 1998: 48-hour weekly limit (opt-out available)
    - Equality Act 2010
    - Gangmasters and Labour Abuse Authority (GLAA) licensing for agriculture
  `,
  TH: `
    THAILAND REGULATORY CONTEXT:
    - Labour Protection Act B.E. 2541 (1998)
    - Occupational Safety, Health and Environment Act B.E. 2554 (2011)
    - Minimum wage: varies by province, set by tripartite committee
    - Maximum hours: 8/day, 48/week for industrial work
    - Minimum age: 15 for employment, 18 for hazardous work
    - Migrant worker protections under Royal Ordinance on Foreign Workers Management
    - Anti-trafficking: Prevention and Suppression of Human Trafficking Act B.E. 2551
  `,
  PH: `
    PHILIPPINES REGULATORY CONTEXT:
    - Occupational Safety and Health Standards (OSHS)
    - Labor Code of the Philippines
    - Minimum wage: varies by region, set by Regional Tripartite Wages and Productivity Boards
    - Maximum hours: 8/day, overtime premium of 25% (regular) or 30% (rest day/holiday)
    - Minimum age: 15, with conditions for 15-17
    - Anti-Trafficking in Persons Act (RA 9208, as amended by RA 10364)
  `,
  IN: `
    INDIA REGULATORY CONTEXT:
    - Occupational Safety, Health and Working Conditions Code 2020
    - Code on Wages 2019: minimum wage varies by state and skill category
    - Maximum hours: generally 48/week under Factories Act
    - Minimum age: 14 for non-hazardous work, 18 for hazardous
    - Bonded Labour System (Abolition) Act 1976
    - Contract Labour (Regulation and Abolition) Act 1970
    - State-specific Shops and Establishments Acts
  `,
}

export function getCountryContext(countryCode: string): string | null {
  return COUNTRY_CONTEXT[countryCode] ?? null
}
