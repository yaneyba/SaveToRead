/**
 * Dashboard Controls Component
 *
 * Filter tabs and search functionality
 */

interface DashboardControlsProps {
  activeFilter: 'all' | 'favorites' | 'unread';
  onFilterChange: (filter: 'all' | 'favorites' | 'unread') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function DashboardControls({
  activeFilter,
  onFilterChange,
  searchQuery,
  onSearchChange
}: DashboardControlsProps) {
  return (
    <div className="dashboard-controls">
      <div className="filter-tabs">
        <button
          className={activeFilter === 'all' ? 'active' : ''}
          onClick={() => onFilterChange('all')}
        >
          All Articles
        </button>
        <button
          className={activeFilter === 'favorites' ? 'active' : ''}
          onClick={() => onFilterChange('favorites')}
        >
          Favorites
        </button>
        <button
          className={activeFilter === 'unread' ? 'active' : ''}
          onClick={() => onFilterChange('unread')}
        >
          To Read
        </button>
      </div>

      <div className="search-container">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search articles..."
          className="search-input"
        />
      </div>
    </div>
  );
}
