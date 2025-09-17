import React, { useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function CreatePayment() {
  const navigate = useNavigate();
  const [amount, setAmount] = useState("1");
  const [studentId, setStudentId] = useState("");
  const [studentName, setStudentName] = useState("Test Student");
  const [studentEmail, setStudentEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!studentId.trim()) {
      toast.error("Student ID is required");
      return;
    }
    if (!studentName.trim()) {
      toast.error("Student name is required");
      return;
    }
    if (!studentEmail.trim() || !/\S+@\S+\.\S+/.test(studentEmail)) {
      toast.error("Valid email is required");
      return;
    }
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/payments/create-payment", {
        amount,
        student_info: {
          id: studentId,
          name: studentName,
          email: studentEmail,
        },
      });

      const collectUrl = res.data.collect_request_url;
      const collectId = res.data.collect_request_id;

      if (!collectUrl) {
        toast.error("No payment URL returned from server");
        return;
      }

      window.location.href = collectUrl;

      navigate(`/payment-status?collectId=${collectId}`);
    } catch (err) {
      console.error("Error creating payment:", err);
      toast.error("Failed to create payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <h2 className="text-lg font-semibold mb-3">Create Payment</h2>

        {/* Student ID */}
        <label className="block mb-1">Student ID</label>
        <input
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          className="w-full px-3 py-2 rounded border mb-3 dark:text-black outline-none"
          placeholder="Enter student ID"
          required
        />

        {/* Student Name */}
        <label className="block mb-1">Student Name</label>
        <input
          value={studentName}
          onChange={(e) => setStudentName(e.target.value)}
          className="w-full px-3 py-2 rounded border mb-3 dark:text-black outline-none"
          placeholder="Enter student name"
          required
        />

        {/* Student Email */}
        <label className="block mb-1">Student Email</label>
        <input
          type="email"
          value={studentEmail}
          onChange={(e) => setStudentEmail(e.target.value)}
          className="w-full px-3 py-2 rounded border mb-3 dark:text-black outline-none"
          placeholder="Enter student email"
          required
        />

        {/* Amount */}
        <label className="block mb-1">Amount (INR)</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full px-3 py-2 rounded border mb-3 dark:text-black outline-none"
          placeholder="Enter amount"
          required
        />

        <div className="flex gap-2">
          <button
            onClick={submit}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            {loading ? "Creating..." : "Create Payment"}
          </button>
        </div>
      </div>
    </div>
  );
}
