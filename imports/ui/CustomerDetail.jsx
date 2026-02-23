import { useState } from "react";
import { Meteor } from "meteor/meteor";
import { useSubscribe, useFind } from "meteor/react-meteor-data";
import { NotesCollection } from "../api/notes";
import { NoteForm } from "./NoteForm";
import { NoteItem } from "./NoteItem";
import { isCurrentUserAdmin } from "../api/users";

export const CustomerDetail = ({ customer, onBack, onEdit }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isLoading = useSubscribe("notes.byCustomer", customer._id);
  const notes = useFind(() =>
    NotesCollection.find(
      { customerId: customer._id },
      { sort: { createdAt: -1 } }
    )
  );

  const isAdmin = isCurrentUserAdmin();

  const handleDelete = () => {
    setDeleting(true);
    Meteor.call("customers.remove", customer._id, (err) => {
      setDeleting(false);
      if (err) {
        alert(err.reason || "Failed to delete customer");
      } else {
        onBack();
      }
    });
  };

  return (
    <div className="customer-detail">
      <div className="detail-header">
        <button className="button button-secondary" onClick={onBack}>
          &larr; Back to Customers
        </button>
        <div className="detail-actions">
          <button className="button button-secondary" onClick={onEdit}>
            Edit
          </button>
          {isAdmin && (
            <button
              className="button button-danger"
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete
            </button>
          )}
        </div>
      </div>

      <div className="detail-content card">
        <h2 className="detail-name">{customer.name}</h2>
        {customer.description && (
          <p className="detail-description">{customer.description}</p>
        )}

        <div className="detail-info">
          {(() => {
            const customerPhones = Array.isArray(customer.phones) && customer.phones.length > 0
              ? customer.phones
              : (customer.phone ? [customer.phone] : []);
            return customerPhones.length > 0 && (
              <div className="detail-row">
                <span className="detail-label">{customerPhones.length > 1 ? "Phones:" : "Phone:"}</span>
                <div className="detail-phones">
                  {customerPhones.map((phone, idx) => (
                    <a key={idx} href={`tel:${phone}`} className="detail-value link">
                      {phone}
                    </a>
                  ))}
                </div>
              </div>
            );
          })()}
          {customer.notes && (
            <div className="detail-row">
              <span className="detail-label">Notes:</span>
              <span className="detail-value">{customer.notes}</span>
            </div>
          )}
        </div>

        <div className="detail-audit">
          {customer.createdByName && (
            <span className="audit-info">
              Created by <strong>{customer.createdByName}</strong>
              {customer.createdAt && ` on ${new Date(customer.createdAt).toLocaleDateString()}`}
            </span>
          )}
          {customer.updatedByName && customer.updatedBy !== customer.createdBy && (
            <span className="audit-separator"> · </span>
          )}
          {customer.updatedByName && (customer.updatedBy !== customer.createdBy || customer.updatedAt?.getTime?.() !== customer.createdAt?.getTime?.()) && (
            <span className="audit-info">
              Last updated by <strong>{customer.updatedByName}</strong>
              {customer.updatedAt && ` on ${new Date(customer.updatedAt).toLocaleDateString()}`}
            </span>
          )}
        </div>
      </div>

      <div className="notes-section">
        <h3 className="section-title">Notes</h3>

        <NoteForm customerId={customer._id} />

        {isLoading() ? (
          <div className="loading">Loading notes...</div>
        ) : notes.length === 0 ? (
          <div className="empty-state card">
            <p>No notes yet. Add your first note above.</p>
          </div>
        ) : (
          <div className="notes-list">
            {notes.map((note) => (
              <NoteItem key={note._id} note={note} />
            ))}
          </div>
        )}
      </div>

      {showDeleteConfirm && (
        <div className="modal-overlay modal-overlay--confirm" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal card confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Customer</h3>
            <p>Are you sure you want to delete {customer.name}? This will also delete all associated notes.</p>
            <div className="modal-actions">
              <button
                className="button button-secondary"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="button button-danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
