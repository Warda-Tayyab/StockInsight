import { FiInbox } from 'react-icons/fi';

const EmptyState = ({ message = 'No data available for this filter.' }) => (
  <div className="empty-state flex flex-col items-center">
    <FiInbox className="w-12 h-12 text-slate-300 mb-3" />
    <p className="m-0">{message}</p>
  </div>
);

export default EmptyState;
