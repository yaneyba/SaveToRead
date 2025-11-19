/**
 * Dashboard Header Component
 *
 * Displays welcome message and quick stats
 */

interface DashboardHeaderProps {
  userName?: string;
  stats: {
    total: number;
    favorites: number;
    unread: number;
    read: number;
  };
}

export function DashboardHeader({ userName, stats }: DashboardHeaderProps) {
  return (
    <div className="dashboard-header">
      <div className="dashboard-welcome">
        <div>
          <h1>Welcome back, {userName || 'there'}!</h1>
          <p>Your personal reading library</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Articles</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.favorites}</div>
          <div className="stat-label">Favorites</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.unread}</div>
          <div className="stat-label">To Read</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.read}</div>
          <div className="stat-label">Completed</div>
        </div>
      </div>
    </div>
  );
}
