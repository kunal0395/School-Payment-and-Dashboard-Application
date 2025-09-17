import React, { useEffect, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Transactions from "./pages/Transactions";
import SchoolTransactions from "./pages/SchoolTransactions";
import StatusCheck from "./pages/StatusCheck";
import CreatePayment from "./pages/CreatePayment";
import Login from "./pages/Login";
import Header from "./components/Header";
import PaymentStatus from "./pages/PaymentStatus";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Navigate } from "react-router-dom";

export default function App() {
  const [dark, setDark] = useState(
    () => localStorage.getItem("theme") === "dark"
  );
  const navigate = useNavigate();
  const username = localStorage.getItem("username");

  useEffect(() => {
    const root = document.documentElement;

    if (dark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    toast.success(dark ? "Dark mode enabled" : "Light mode enabled");
  }, [dark]);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) navigate("/login");
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <ToastContainer
        position="top-right"
        autoClose={1000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={dark ? "dark" : "light"}
      />

      <Header dark={dark} setDark={setDark} />

      <div className="max-w-7xl mx-auto p-4">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              username === "admin" ? (
                <Transactions />
              ) : (
                <Navigate to="/status" />
              )
            }
          />
          <Route
            path="/school"
            element={
              username === "admin" ? (
                <SchoolTransactions />
              ) : (
                <Navigate to="/status" />
              )
            }
          />
          <Route path="/create" element={<CreatePayment />} />
          <Route path="/status" element={<StatusCheck />} />
          <Route path="/login/payment-status" element={<PaymentStatus />} />
        </Routes>
      </div>
    </div>
  );
}
