/** @module inventory/dashboard/components/StatsCard */

import './StatsCard.css';

const StatsCard = ({ title, value, subtitle, icon, trend, trendValue, color }) => {
  return (
    <div data-testid="stats-card" className="stats-card" style={{ borderTopColor: color }}>
      <div className="stats-card-header">
        <div className="stats-card-icon" style={{ backgroundColor: `${color}20`, color }}>
          {icon}
        </div>
        <div className={`stats-card-trend ${trend}`}>
          {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
        </div>
      </div>
      <div className="stats-card-body">
        <h3 className="stats-card-value">{value}</h3>
        <p className="stats-card-title">{title}</p>
        {subtitle && <p className="stats-card-subtitle">{subtitle}</p>}
      </div>
    </div>
  );
};

export default StatsCard;
