const ChartCard = ({ title, subtitle, children, className = '' }) => (
  <div className={`card-padded ${className}`}>
    <div className="mb-4">
      <h3 className="card-title">{title}</h3>
      {subtitle && <p className="page-subtitle">{subtitle}</p>}
    </div>
    {children}
  </div>
);

export default ChartCard;
