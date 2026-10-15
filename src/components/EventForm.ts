export const CATEGORY_COLORS: Record<string, string> = {
  personal: '#d48c8e',
  work: '#5b8cff',
  health: '#a8b89a',
  family: '#e8b4b8',
  finance: '#c9a24b',
  learning: '#8b7ab8',
  spiritual: '#7ab8a8',
  other: '#8a7a65',
}

export const CATEGORIES = Object.keys(CATEGORY_COLORS)

export const REMINDER_OPTIONS: { value: number | null; label: string }[] = [
  { value: null, label: 'No reminder' },
  { value: 5, label: '5 min before' },
  { value: 15, label: '15 min before' },
  { value: 30, label: '30 min before' },
  { value: 60, label: '1 hour before' },
  { value: 1440, label: '1 day before' },
]
