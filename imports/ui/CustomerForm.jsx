import { useState } from "react";
import { Meteor } from "meteor/meteor";

export const CustomerForm = ({ customer, onClose }) => {
  const [name, setName] = useState(customer?.name || "");
  const [email, setEmail] = useState(customer?.email || "");
  const [phone, setPhone] = useState(customer?.phone || "");
  const [company, setCompany] = useState(customer?.company || "");
  const [address, setAddress] = useState(customer?.address || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isEditing = !!customer;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const customerData = { name, email, phone, company, address };
    const method = isEditing ? "customers.update" : "customers.insert";
    const args = isEditing ? [customer._id, customerData] : [customerData];

    Meteor.call(method, ...args, (err) => {
      setLoading(false);
      if (err) {
        setError(err.reason || "Failed to save customer");
      } else {
        onClose();
      }
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {isEditing ? "Edit Customer" : "Add Customer"}
          </h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="name" className="form-label">Name *</label>
            <input
              type="text"
              id="name"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Customer name"
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              type="email"
              id="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="customer@example.com"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone" className="form-label">Phone</label>
            <input
              type="tel"
              id="phone"
              className="form-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="company" className="form-label">Company</label>
            <input
              type="text"
              id="company"
              className="form-input"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Company name"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="address" className="form-label">Address</label>
            <textarea
              id="address"
              className="form-input form-textarea"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street address, city, state"
              disabled={loading}
              rows={3}
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="button button-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button type="submit" className="button" disabled={loading}>
              {loading ? "Saving..." : (isEditing ? "Update" : "Add Customer")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
