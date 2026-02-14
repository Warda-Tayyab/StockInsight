import { NavLink } from "react-router-dom";
import "../pages/CSS/sidebar.css";

const Sidebar = () => {
  return (
    <div className="sidebar">
      <h2>Super Admin</h2>
      <nav>
        <NavLink to="/super-admin/dashboard" end>
          Dashboard Home
        </NavLink>
        <NavLink to="/super-admin/dashboard/create-tenant">
          Create Tenant
        </NavLink>
        <NavLink to="/super-admin/dashboard/tenant-list">
          Tenant List
        </NavLink>
      </nav>
    </div>
  );
};

export default Sidebar;
