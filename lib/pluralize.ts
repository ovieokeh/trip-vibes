/**
 * Simple pluralization utility using JavaScript's built-in Intl.PluralRules.
 * Provides grammatically correct pluralization for English.
 */

const pluralRules = new Intl.PluralRules("en-US");

/**
 * Returns the correct plural form for a given count and word.
 *
 * @param count - The number of items
 * @param singular - The singular form of the word
 * @param plural - Optional custom plural form (defaults to singular + 's')
 * @returns The formatted string with count and pluralized word
 *
 * @example
 * pluralize(1, 'day') // "1 day"
 * pluralize(5, 'day') // "5 days"
 * pluralize(1, 'activity', 'activities') // "1 activity"
 * pluralize(3, 'activity', 'activities') // "3 activities"
 * pluralize(1, 'person', 'people') // "1 person"
 * pluralize(5, 'person', 'people') // "5 people"
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  const pluralForm = plural ?? `${singular}s`;
  const rule = pluralRules.select(count);

  // English only uses 'one' and 'other' rules
  const word = rule === "one" ? singular : pluralForm;
  return `${count} ${word}`;
}

/**
 * Returns just the pluralized word without the count.
 *
 * @example
 * pluralWord(1, 'day') // "day"
 * pluralWord(5, 'day') // "days"
 */
export function pluralWord(count: number, singular: string, plural?: string): string {
  const pluralForm = plural ?? `${singular}s`;
  const rule = pluralRules.select(count);
  return rule === "one" ? singular : pluralForm;
}
