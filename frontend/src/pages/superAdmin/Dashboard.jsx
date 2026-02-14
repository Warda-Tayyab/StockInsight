import { Outlet } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import "../CSS/dashboard.css";

const Dashboard = () => {
  return (
    <div className="dashboard-wrapper">
      <Sidebar />
      <div className="dashboard-content">
        {/* This will render Dashboard home or any nested page */}
        <Outlet />
      </div>
    </div>
  );
};

export default Dashboard;
