import { useState } from "react";
import { useSubscribe, useFind } from "meteor/react-meteor-data";
import { CustomersCollection } from "../api/customers";
import { CustomerForm } from "./CustomerForm";
import { CustomerDetail } from "./CustomerDetail";

export const CustomerList = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const isLoading = useSubscribe("customers");
  const customers = useFind(() =>
    CustomersCollection.find({}, { sort: { createdAt: -1 } })
  );

  if (isLoading()) {
    return <div className="loading">Loading customers...</div>;
  }

  if (selectedCustomer) {
    return (
      <CustomerDetail
        customer={selectedCustomer}
        onBack={() => setSelectedCustomer(null)}
        onEdit={() => {
          setEditingCustomer(selectedCustomer);
          setShowForm(true);
          setSelectedCustomer(null);
        }}
      />
    );
  }

  return (
    <div className="customer-list-container">
      <div className="customer-list-header">
        <h2 className="section-title">Customers</h2>
        <button
          className="button"
          onClick={() => {
            setEditingCustomer(null);
            setShowForm(true);
          }}
        >
          Add Customer
        </button>
      </div>

      {customers.length === 0 ? (
        <div className="empty-state card">
          <p>No customers yet. Add your first customer to get started.</p>
        </div>
      ) : (
        <div className="customer-grid">
          {customers.map((customer) => (
            <div
              key={customer._id}
              className="customer-card card"
              onClick={() => setSelectedCustomer(customer)}
            >
              <h3 className="customer-name">{customer.name}</h3>
              {customer.company && (
                <p className="customer-company">{customer.company}</p>
              )}
              {customer.email && (
                <p className="customer-detail">{customer.email}</p>
              )}
              {customer.phone && (
                <p className="customer-detail">{customer.phone}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <CustomerForm
          customer={editingCustomer}
          onClose={() => {
            setShowForm(false);
            setEditingCustomer(null);
          }}
        />
      )}
    </div>
  );
};
