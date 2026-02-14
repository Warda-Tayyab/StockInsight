import { useState } from "react";
import "../CSS/Home.css";

const DashboardHome = () => {
  // Sample tenant data (backend se aayega later)
  const [tenants] = useState([
    { _id: "1", name: "Cyranix Inc", status: "active" },
    { _id: "2", name: "TechNova", status: "trial" },
    { _id: "3", name: "WebSoft", status: "suspended" },
  ]);

  // Count tenants by status
  const total = tenants.length;
  const active = tenants.filter((t) => t.status === "active").length;
  const suspended = tenants.filter((t) => t.status === "suspended").length;
  const trial = tenants.filter((t) => t.status === "trial").length;

  return (
    <div className="dashboard-home">
      <h2>Dashboard Overview</h2>

      <div className="top-cards">
        <div className="card">Total Tenants: {total}</div>
        <div className="card">Active: {active}</div>
        <div className="card">Suspended: {suspended}</div>
        <div className="card">Trial: {trial}</div>
      </div>
    </div>
  );
};

export default DashboardHome;
