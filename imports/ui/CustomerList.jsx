import { useState } from "react";
import { useSubscribe, useFind } from "meteor/react-meteor-data";
import { Link } from "react-router-dom";
import { CustomersCollection } from "../api/customers";
import { CustomerForm } from "./CustomerForm";

export const CustomerList = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const isLoading = useSubscribe("customers");
  const customers = useFind(() =>
    CustomersCollection.find({}, { sort: { createdAt: -1 } })
  );

  const filteredCustomers = customers.filter((customer) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const nameMatch = customer.name?.toLowerCase().includes(term);
    const customerPhones = Array.isArray(customer.phones)
      ? customer.phones
      : (customer.phone ? [customer.phone] : []);
    const phoneMatch = customerPhones.some(p => p?.toLowerCase().includes(term));
    return nameMatch || phoneMatch;
  });

  if (isLoading()) {
    return <div className="loading">Loading customers...</div>;
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

      <div className="search-bar">
        <input
          type="text"
          className="form-input search-input"
          placeholder="Search by name or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredCustomers.length === 0 ? (
        <div className="empty-state card">
          <p>
            {searchTerm.trim()
              ? "No customers match your search."
              : "No customers yet. Add your first customer to get started."}
          </p>
        </div>
      ) : (
        <div className="customer-grid">
          {filteredCustomers.map((customer) => (
            <Link
              key={customer._id}
              to={`/customers/${customer._id}`}
              className="customer-card card"
            >
              <h3 className="customer-name">{customer.name}</h3>
              {customer.description && (
                <p className="customer-description">{customer.description}</p>
              )}
              {(() => {
                const phones = Array.isArray(customer.phones) && customer.phones.length > 0
                  ? customer.phones
                  : (customer.phone ? [customer.phone] : []);
                return phones.length > 0 && (
                  <div className="customer-phones">
                    {phones.map((phone, idx) => (
                      <p key={idx} className="customer-phone">{phone}</p>
                    ))}
                  </div>
                );
              })()}
            </Link>
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
