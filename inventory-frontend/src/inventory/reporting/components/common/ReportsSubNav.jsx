import { NavLink } from 'react-router-dom';
import { reportNavLinks } from '../../data/reportsDummyData';

const ReportsSubNav = () => (
  <nav className="flex flex-wrap gap-2 print:hidden mb-2">
    {reportNavLinks.map(({ path, label, end }) => (
      <NavLink
        key={path}
        to={path}
        end={end}
        className={({ isActive }) =>
          `px-3 py-1.5 rounded-xl text-sm font-medium transition-all no-underline ${
            isActive
              ? 'bg-gradient-to-r from-slate-800 via-indigo-700 to-purple-700 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
          }`
        }
      >
        {label}
      </NavLink>
    ))}
  </nav>
);

export default ReportsSubNav;
