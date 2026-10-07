import { useState, useEffect } from "react";

const WarehouseForm = ({ initialData = {}, onSubmit, onCancel }) => {
  const [form, setForm] = useState({
    name: initialData.name || "",
    code: initialData.code || "",
    locationType: initialData.locationType || "store",
    address: initialData.address || "",
    city: initialData.city || "",
    country: initialData.country || "",
    postalCode: initialData.postalCode || "",
    contactPerson: initialData.contactPerson || "",
    phone: initialData.phone || "",
    email: initialData.email || "",
    description: initialData.description || "",
    status: initialData.status || "active",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setForm({
        name: initialData.name || "",
        code: initialData.code || "",
        locationType: initialData.locationType || "store",
        address: initialData.address || "",
        city: initialData.city || "",
        country: initialData.country || "",
        postalCode: initialData.postalCode || "",
        contactPerson: initialData.contactPerson || "",
        phone: initialData.phone || "",
        email: initialData.email || "",
        description: initialData.description || "",
        status: initialData.status || "active",
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };
  const validate = () => {
    const newErrors = {};
  
    // 🔹 Name validation
    const name = form.name.trim();
    if (!name) {
      newErrors.name = "Warehouse name is required";
    } else if (name.length < 5) {
      newErrors.name = "Minimum 5 characters required";
    } else if (name.length > 20) {
      newErrors.name = "Maximum 20 characters allowed";
    } else if (!/^[a-zA-Z][a-zA-Z0-9\s\-]*$/.test(name)) {
      newErrors.name = "Invalid name format";
    }
  
    // 🔹 Code validation (important - unique identifier)
    const code = form.code.trim().toUpperCase();
    if (!code) {
      newErrors.code = "Warehouse code is required";
    } else if (code.length < 3 || code.length > 10) {
      newErrors.code = "Code must be 3–10 characters";
    } else if (!/^[A-Z0-9\-]+$/.test(code)) {
      newErrors.code = "Use uppercase letters, numbers, hyphen only (e.g. WH-01)";
    }
  
    // 🔹 Address
    const address = form.address.trim();
    if (!address) {
      newErrors.address = "Address is required";
    } else if (address.length < 10) {
      newErrors.address = "Address too short";
    } else if (address.length > 150) {
      newErrors.address = "Address too long";
    }
  
    // 🔹 City
    const city = form.city.trim();
    if (!city) {
      newErrors.city = "City is required";
    } else if (!/^[a-zA-Z\s]+$/.test(city)) {
      newErrors.city = "Only letters allowed";
    }
  
    // 🔹 Country
    const country = form.country.trim();
    if (!country) {
      newErrors.country = "Country is required";
    } else if (!/^[a-zA-Z\s]+$/.test(country)) {
      newErrors.country = "Only letters allowed";
    }
  
    // 🔹 Postal Code
    const postal = form.postalCode.trim();
    if (!postal) {
      newErrors.postalCode = "Postal code is required";
    } else if (!/^[0-9]{4,10}$/.test(postal)) {
      newErrors.postalCode = "Invalid postal code";
    }
  
    // 🔹 Contact Person
    const person = form.contactPerson.trim();
    if (!person) {
      newErrors.contactPerson = "Contact person is required";
    } else if (person.length < 3) {
      newErrors.contactPerson = "Too short";
    } else if (!/^[a-zA-Z\s]+$/.test(person)) {
      newErrors.contactPerson = "Only letters allowed";
    }
  
   // 🔹 Phone 
const phone = form.phone.trim();

if (!phone) {
  newErrors.phone = "Phone is required";
} 
// allow +, numbers, spaces, hyphens
else if (!/^[+]?[\d\s\-]{7,15}$/.test(phone)) {
  newErrors.phone = "Enter valid phone number";
}
    // 🔹 Email
    const email = form.email.trim();
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Invalid email format";
    }

  
    // 🔹 Description (optional)
    if (form.description && form.description.length > 200) {
      newErrors.description = "Max 200 characters";
    }
  
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit && onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <InputField label="Location Name *" name="name" value={form.name} onChange={handleChange} error={errors.name} />
        <InputField label="Location Code *" name="code" value={form.code} onChange={handleChange} error={errors.code} />

        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-900 mb-2">Location type *</label>
          <select
            name="locationType"
            value={form.locationType}
            onChange={handleChange}
            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:border-indigo-600"
          >
            <option value="store">Store (selling / POS location)</option>
            <option value="warehouse">Warehouse (bulk storage)</option>
          </select>
          <p className="text-xs text-slate-500 mt-1 mb-0">
            Chhoti shops sirf Store banayein. Bari businesses Warehouse + Store Transfer use kar sakti hain.
          </p>
        </div>

        <InputField label="Address *" name="address" value={form.address} onChange={handleChange} error={errors.address} className="md:col-span-2" />
        <InputField label="City *" name="city" value={form.city} onChange={handleChange} error={errors.city} />
        <InputField label="Country *" name="country" value={form.country} onChange={handleChange} error={errors.country} />
        <InputField label="Postal Code *" name="postalCode" value={form.postalCode} onChange={handleChange} error={errors.postalCode} />
        <InputField label="Contact Person *" name="contactPerson" value={form.contactPerson} onChange={handleChange} error={errors.contactPerson} />
        <InputField label="Phone *" name="phone" value={form.phone} onChange={handleChange} error={errors.phone} />
        <InputField label="Email *" name="email" value={form.email} onChange={handleChange} error={errors.email} type="email" />

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-900 mb-2">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:border-indigo-600"
            rows={3}
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-900 mb-2">Status</label>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:border-indigo-600"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-6 border-t border-slate-200">
        <button type="button" onClick={onCancel} className="bg-white border border-slate-200 px-4 py-2 rounded-lg">Cancel</button>
        <button type="submit" className="btn-primary">
          {initialData._id ? "Update Location" : "Add Location"}
        </button>
      </div>
    </form>
  );
};

// Reusable InputField
const InputField = ({ label, name, value, onChange, error, className = "", type = "text" }) => (
  <div className={`mb-6 ${className}`}>
    <label className="block text-sm font-medium text-slate-900 mb-2">{label}</label>
    <input
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      className={`w-full px-3.5 py-2.5 border rounded-lg ${error ? "border-red-500" : "border-slate-200 focus:border-indigo-600"}`}
    />
    {error && <span className="text-red-500 text-xs">{error}</span>}
  </div>
);

export default WarehouseForm;