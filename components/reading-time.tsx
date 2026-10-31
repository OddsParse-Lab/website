export function ReadingTime({ minutes }: { minutes: number }) {
  return <span className="journal-reading-time" aria-label={`Estimated reading time: ${minutes} minutes`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
              {minutes} min read
            </span>;
}
