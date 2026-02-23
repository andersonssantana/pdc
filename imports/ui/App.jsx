import { useState, useEffect } from "react";
import { Meteor } from "meteor/meteor";
import { useTracker } from "meteor/react-meteor-data";
import { Header } from "./Header.jsx";
import { LoginForm } from "./LoginForm.jsx";
import { CustomerList } from "./CustomerList.jsx";
import { AdminPanel } from "./AdminPanel.jsx";
import { isCurrentUserAdmin } from "../api/users";

export const App = () => {
  const [currentView, setCurrentView] = useState("customers");

  const { user, isLoggingIn, isAdmin } = useTracker(() => {
    return {
      user: Meteor.user(),
      isLoggingIn: Meteor.loggingIn(),
      isAdmin: isCurrentUserAdmin()
    };
  });

  // Reset to customers view when user changes or non-admin tries to access admin view
  useEffect(() => {
    if (currentView === "admin" && !isAdmin) {
      setCurrentView("customers");
    }
  }, [user?._id, isAdmin, currentView]);

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
      <Header
        currentView={currentView}
        onNavigate={setCurrentView}
        isAdmin={isAdmin}
      />
      <main className="main container">
        {currentView === "customers" && <CustomerList />}
        {currentView === "admin" && isAdmin && <AdminPanel />}
      </main>
    </div>
  );
};
