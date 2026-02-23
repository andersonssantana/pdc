import { useState } from "react";
import { Meteor } from "meteor/meteor";

export const CustomerForm = ({ customer, onClose }) => {
  const [name, setName] = useState(customer?.name || "");
  const [phone, setPhone] = useState(customer?.phone || "");
  const [description, setDescription] = useState(customer?.description || "");
  const [notes, setNotes] = useState(customer?.notes || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isEditing = !!customer;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const customerData = { name, phone, description, notes };
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
            <label htmlFor="phone" className="form-label">Phone</label>
            <input
              type="tel"
              id="phone"
              className="form-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone number"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description" className="form-label">Description</label>
            <input
              type="text"
              id="description"
              className="form-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="notes" className="form-label">Additional Notes</label>
            <textarea
              id="notes"
              className="form-input form-textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes..."
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
