/** @module inventory/purchasing/pages/PurchaseOrderDetailPage */
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import purchaseService from '../../../shared/services/purchaseService';

const PurchaseOrderDetailPage = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    purchaseService
      .getOrder(id)
      .then((res) => setOrder(res.data.data))
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to load PO'));
  }, [id]);

  if (!order) {
    return <div className="page-container py-12 text-center text-slate-500">Loading…</div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">{order.poNumber}</h1>
          <p className="page-subtitle capitalize">Status: {order.status}</p>
        </div>
        <div className="flex gap-2">
          <Link to="/purchasing/orders" className="btn-secondary no-underline">
            Back
          </Link>
          {['ordered', 'partial'].includes(order.status) && (
            <Link
              to={`/purchasing/receive/new?po=${order._id}`}
              className="btn-primary no-underline"
            >
              Receive against PO
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="card-padded">
          <p className="text-xs text-slate-500 m-0">Supplier</p>
          <p className="font-semibold m-0 mt-1">{order.vendorId?.name}</p>
        </div>
        <div className="card-padded">
          <p className="text-xs text-slate-500 m-0">Destination</p>
          <p className="font-semibold m-0 mt-1">
            {order.locationId?.name}{' '}
            <span className="text-xs font-normal text-slate-400">
              ({order.locationId?.locationType || 'store'})
            </span>
          </p>
        </div>
        <div className="card-padded">
          <p className="text-xs text-slate-500 m-0">Subtotal</p>
          <p className="font-semibold m-0 mt-1">Rs {Number(order.subtotal || 0).toLocaleString()}</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Ordered</th>
                <th>Received</th>
                <th>Unit cost</th>
              </tr>
            </thead>
            <tbody>
              {(order.items || []).map((i) => (
                <tr key={i._id}>
                  <td>{i.productName}</td>
                  <td>{i.sku}</td>
                  <td>{i.quantity}</td>
                  <td>{i.receivedQty || 0}</td>
                  <td>Rs {Number(i.unitCost || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderDetailPage;
