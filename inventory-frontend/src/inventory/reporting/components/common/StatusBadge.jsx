const map = {
  in_stock: 'badge-success',
  low_stock: 'badge-warning',
  out_of_stock: 'badge-danger',
  low: 'badge-warning',
  critical: 'badge-danger',
  expiring: 'badge-warning',
  expired: 'badge-neutral',
  ok: 'badge-success',
  active: 'badge-info',
  stock_in: 'badge-success',
  stock_out: 'badge-warning',
  sale: 'badge-info',
  login: 'badge-neutral',
};

const StatusBadge = ({ status }) => (
  <span className={`capitalize ${map[status] || 'badge-neutral'}`}>
    {String(status || '—').replace(/_/g, ' ')}
  </span>
);

export default StatusBadge;
