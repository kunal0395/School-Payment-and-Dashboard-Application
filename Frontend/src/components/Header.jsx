import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function Header({ dark, setDark }) {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem("access_token");
  const username = localStorage.getItem("username");

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("username");
    navigate("/login");
    toast.success("Logged out successfully");
  };

  return (
    <header className="text-gray-600 body-font">
      <div className="container mx-auto flex flex-wrap p-5 flex-col md:flex-row items-center">
        <Link
          to="/"
          className={`flex title-font font-medium items-center mb-4 md:mb-0 ${
            dark ? "text-white" : "text-gray-900"
          }`}
        >
          <span className="ml-3 text-xl">School Payments Dashboard</span>
        </Link>

        <nav className="md:ml-auto md:mr-auto flex flex-wrap items-center text-base justify-center">
          {username === "admin" && (
            <>
              <Link to="/" className="text-sky-600 mr-5 dark:text-sky-300">
                Transactions
              </Link>
              <Link
                to="/school"
                className="text-sky-600 mr-5 dark:text-sky-300"
              >
                School Txns
              </Link>
            </>
          )}
          <Link to="/create" className="text-sky-600 mr-5 dark:text-sky-300">
            Create Payment
          </Link>
          <Link to="/status" className="text-sky-600 mr-5 dark:text-sky-300">
            Status Check
          </Link>
        </nav>

        <div className="flex gap-3">
          <button
            className="inline-flex items-center border-0 py-1 px-3 text-base mt-4 md:mt-0"
            aria-label="Toggle theme"
            onClick={() => setDark(!dark)}
          >
            {dark ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-yellow-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364l-1.414 1.414M6.05 17.95l-1.414 1.414M17.95 17.95l-1.414-1.414M6.05 6.05L4.636 7.464M12 8a4 4 0 100 8 4 4 0 000-8z"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-800"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M17.293 13.293a8 8 0 01-10.586-10.586 8 8 0 1010.586 10.586z" />
              </svg>
            )}
          </button>

          <button
            className="inline-flex items-center bg-gray-100 border-0 py-1 px-3 focus:outline-none hover:bg-gray-200 rounded text-base mt-4 md:mt-0"
            aria-label={isLoggedIn ? "Log out" : "Log in"}
            onClick={() => {
              if (isLoggedIn) {
                logout();
              } else {
                navigate("/login");
              }
            }}
          >
            {isLoggedIn ? "Logout" : "Login"}
          </button>
        </div>
      </div>
    </header>
  );
}
