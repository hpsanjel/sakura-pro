/**
 * Year-based filtering utilities for consultancy data management
 */

/**
 * Creates a Prisma date filter for a specific year
 * @param year The year to filter by (e.g., 2024)
 * @returns Prisma date filter object
 */
export function createYearFilter(year: number) {
  return {
    createdAt: {
      gte: new Date(`${year}-01-01`),
      lt: new Date(`${year + 1}-01-01`)
    }
  }
}

/**
 * Creates a Prisma date filter for a specific year on a specific date field
 * @param year The year to filter by (e.g., 2024)
 * @param dateField The date field to filter on (defaults to 'createdAt')
 * @returns Prisma date filter object
 */
export function createYearFilterForField(year: number, dateField: string = 'createdAt') {
  return {
    [dateField]: {
      gte: new Date(`${year}-01-01`),
      lt: new Date(`${year + 1}-01-01`)
    }
  }
}

/**
 * Gets an array of available years for selection (current year - 10 years)
 * @returns Array of years from current year - 10 to current year
 */
export function getAvailableYears(): number[] {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: 10 }, (_, i) => currentYear - i)
}

/**
 * Checks if a date falls within a specific year
 * @param date The date to check
 * @param year The year to check against
 * @returns True if date is within the specified year
 */
export function isDateInYear(date: Date, year: number): boolean {
  const yearStart = new Date(`${year}-01-01`)
  const yearEnd = new Date(`${year + 1}-01-01`)
  return date >= yearStart && date < yearEnd
}

/**
 * Formats a year for display (e.g., "2024", "2024 Academic Year")
 * @param year The year to format
 * @param format The format type ('simple' | 'academic')
 * @returns Formatted year string
 */
export function formatYear(year: number, format: 'simple' | 'academic' = 'simple'): string {
  switch (format) {
    case 'academic':
      return `${year}-${(year + 1).toString().slice(-2)} Academic Year`
    case 'simple':
    default:
      return year.toString()
  }
}
