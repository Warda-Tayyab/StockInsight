/** @module inventory/inventory-management/pages/InventoryAction */

import { useParams, useNavigate, Navigate } from 'react-router-dom';
import InventoryForm from '../components/InventoryForm';

const TITLES = {
  'stock-in': { title: 'Stock In', subtitle: 'Add stock to a warehouse location' },
  'stock-out': { title: 'Stock Out', subtitle: 'Remove stock from a warehouse location' },
  adjust: { title: 'Adjust Stock', subtitle: 'Correct inventory quantities' },
};

const InventoryAction = () => {
  const { type } = useParams();
  const navigate = useNavigate();
  const meta = TITLES[type];

  if (!meta) {
    return <Navigate to="/inventory" replace />;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">{meta.title}</h1>
          <p className="page-subtitle">{meta.subtitle}</p>
        </div>
        <button type="button" className="btn-secondary" onClick={() => navigate('/inventory')}>
          Back to Inventory
        </button>
      </div>
      <div className="card-padded">
        <InventoryForm
          type={type}
          item={null}
          onClose={() => navigate('/inventory')}
          onSuccess={() => navigate('/inventory')}
        />
      </div>
    </div>
  );
};

export default InventoryAction;
