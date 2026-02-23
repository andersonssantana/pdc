import { useEffect } from "react";
import { Meteor } from "meteor/meteor";
import { useTracker } from "meteor/react-meteor-data";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { Header } from "./Header.jsx";
import { LoginForm } from "./LoginForm.jsx";
import { CustomerList } from "./CustomerList.jsx";
import { CustomerDetail } from "./CustomerDetail.jsx";
import { AdminPanel } from "./AdminPanel.jsx";
import { isCurrentUserAdmin } from "../api/users";

export const App = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { user, isLoggingIn, isAdmin } = useTracker(() => {
    return {
      user: Meteor.user(),
      isLoggingIn: Meteor.loggingIn(),
      isAdmin: isCurrentUserAdmin()
    };
  });

  useEffect(() => {
    if (location.pathname === "/admin" && !isAdmin && user) {
      navigate("/customers", { replace: true });
    }
  }, [user?._id, isAdmin, location.pathname, navigate]);

  if (isLoggingIn) {
    return (
      <div className="page">
        <div className="loading-fullscreen">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page">
        <LoginForm />
      </div>
    );
  }

  return (
    <div className="page">
      <Header isAdmin={isAdmin} />
      <main className="main container">
        <Routes>
          <Route path="/" element={<Navigate to="/customers" replace />} />
          <Route path="/customers" element={<CustomerList />} />
          <Route path="/customers/:id" element={<CustomerDetail />} />
          <Route path="/admin" element={
            isAdmin ? <AdminPanel /> : <Navigate to="/customers" replace />
          } />
          <Route path="*" element={<Navigate to="/customers" replace />} />
        </Routes>
      </main>
    </div>
  );
};
