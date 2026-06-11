import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import LoginScreen from "./components/LoginScreen";
import ClientDashboard from "./components/ClientDashboard";
import AdminDashboard from "./components/AdminDashboard";

export default function App() {
  const [currentView, setCurrentView] = useState<"login" | "dashboard" >("login");
  const [user, setUser] = useState<any>(null);

  // Auto-restore login state from localStorage on startup
  useEffect(() => {
    const savedUser = localStorage.getItem("rjr_sync_user");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        setCurrentView("dashboard");
      } catch (e) {
        localStorage.removeItem("rjr_sync_user");
      }
    }
  }, []);

  const handleLoginSuccess = (authenticatedUser: any) => {
    setUser(authenticatedUser);
    localStorage.setItem("rjr_sync_user", JSON.stringify(authenticatedUser));
    setCurrentView("dashboard");
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("rjr_sync_user");
    setCurrentView("login");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans">
      <AnimatePresence mode="wait">
        
        {/* VIEW 1: LOGIN OR REGISTRATION ENVIRONMENT */}
        {currentView === "login" && (
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1"
          >
            <LoginScreen
              onLoginSuccess={handleLoginSuccess}
            />
          </motion.div>
        )}

        {/* VIEW 2: DESKTOPS / DASHBOARDS */}
        {currentView === "dashboard" && user && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col"
          >
            {user.isAdmin || user.email?.toLowerCase() === "devrogeriojunior@gmail.com" ? (
              <AdminDashboard user={user} onLogout={handleLogout} />
            ) : (
              <ClientDashboard user={user} onLogout={handleLogout} />
            )}
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
