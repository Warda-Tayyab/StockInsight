import { useState } from "react";
import axios from "axios";
import "../CSS/TenantCreate.css";

const TenantCreate = () => {
  const [tenant, setTenant] = useState({
    name: "",
    slug: "",
    ownerEmail: "",
    ownerFirstName: "",
    ownerLastName: "",
    primaryContact: {
      name: "",
      email: "",
      phone: "",
      timezone: ""
    },
    business: {
      industryVerticals: [],
      useCases: []
    },
    setPasswordNow: true,
    password: ""
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("token"); // from login

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.includes("primaryContact.")) {
      const key = name.split(".")[1];
      setTenant({
        ...tenant,
        primaryContact: { ...tenant.primaryContact, [key]: value }
      });
    } else if (name.includes("business.")) {
      const key = name.split(".")[1];
      setTenant({
        ...tenant,
        business: { ...tenant.business, [key]: value.split(",") }
      });
    } else {
      setTenant({ ...tenant, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await axios.post(
        "http://localhost:5000/api/admin/tenants",
        tenant,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setMessage("Tenant created successfully!");
      setTenant({
        name: "",
        slug: "",
        ownerEmail: "",
        ownerFirstName: "",
        ownerLastName: "",
        primaryContact: { name: "", email: "", phone: "", timezone: "" },
        business: { industryVerticals: [], useCases: [] },
        setPasswordNow: true,
        password: ""
      });
    } catch (err) {
      setMessage(err.response?.data?.message || "Error creating tenant");
    }

    setLoading(false);
  };

  return (
    <div className="tenant-create-wrapper">
      <h2>Create Tenant</h2>
      {message && <p>{message}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Company Name</label>
          <input
            name="name"
            value={tenant.name}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Slug</label>
          <input
            name="slug"
            value={tenant.slug}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Owner Email</label>
          <input
            name="ownerEmail"
            value={tenant.ownerEmail}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Owner First Name</label>
          <input
            name="ownerFirstName"
            value={tenant.ownerFirstName}
            onChange={handleChange}
          />
        </div>

        <div>
          <label>Owner Last Name</label>
          <input
            name="ownerLastName"
            value={tenant.ownerLastName}
            onChange={handleChange}
          />
        </div>

        <h4>Primary Contact</h4>
        <div>
          <label>Name</label>
          <input
            name="primaryContact.name"
            value={tenant.primaryContact.name}
            onChange={handleChange}
          />
        </div>
        <div>
          <label>Email</label>
          <input
            name="primaryContact.email"
            value={tenant.primaryContact.email}
            onChange={handleChange}
          />
        </div>
        <div>
          <label>Phone</label>
          <input
            name="primaryContact.phone"
            value={tenant.primaryContact.phone}
            onChange={handleChange}
          />
        </div>
        <div>
          <label>Timezone</label>
          <input
            name="primaryContact.timezone"
            value={tenant.primaryContact.timezone}
            onChange={handleChange}
          />
        </div>

        <h4>Business</h4>
        <div>
          <label>Industry Verticals (comma separated)</label>
          <input
            name="business.industryVerticals"
            value={tenant.business.industryVerticals.join(",")}
            onChange={handleChange}
          />
        </div>
        <div>
          <label>Use Cases (comma separated)</label>
          <input
            name="business.useCases"
            value={tenant.business.useCases.join(",")}
            onChange={handleChange}
          />
        </div>

        <div>
          <label>Password</label>
          <input
            name="password"
            type="text"
            value={tenant.password}
            onChange={handleChange}
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Tenant"}
        </button>
      </form>
    </div>
  );
};

export default TenantCreate;
