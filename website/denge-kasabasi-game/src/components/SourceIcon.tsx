import type { SourceId } from '../types/scenario.ts'

const sourceClasses: Record<SourceId, string> = {
  municipality_engineer: 'engineer',
  farmer: 'farmer',
  environmental_expert: 'environmental',
  water_usage: 'usage',
  social_media: 'social',
  municipality_budget: 'budget',
}

export function SourceIcon({ sourceId }: { sourceId: SourceId }) {
  return (
    <span className={`source-icon ${sourceClasses[sourceId]}`}><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {sourceId === 'municipality_engineer' && <><circle cx="9" cy="8" r="3" /><path d="M3 20v-2a6 6 0 0 1 12 0v2M16 5h5v5h-5zM17 12h3" /></>}
      {sourceId === 'farmer' && <><path d="M4 8h11v8H4zM15 11h3l2 3v2h-5M7 8V5h5v3" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></>}
      {sourceId === 'environmental_expert' && <><path d="M12 21v-9M12 14c-5 0-7-3-7-7 4 0 7 2 7 7Zm0 3c5 0 7-3 7-7-4 0-7 2-7 7Z" /></>}
      {sourceId === 'water_usage' && <><path d="M5 20v-7h3v7M11 20V8h3v12M17 20V4h3v16" /></>}
      {sourceId === 'social_media' && <><path d="M4 5h16v12H9l-5 4V5Z" /><path d="M8 9h8M8 13h5" /></>}
      {sourceId === 'municipality_budget' && <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" /><path d="M9 7h6M9 11h6M9 15h4" /></>}
    </svg></span>
  )
}

