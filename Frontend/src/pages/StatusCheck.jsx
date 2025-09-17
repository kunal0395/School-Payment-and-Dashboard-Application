import React, { useState } from "react";
import api from "../api/axios";
import { toast } from "react-toastify";

export default function StatusCheck({ onRowClick }) {
  const [id, setId] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const check = async () => {
    if (!id) return toast.error("Enter custom_order_id");
    setLoading(true);
    try {
      const res = await api.get(`/transaction-status/${id}`);
      setResult(res.data);
      toast.success("Data fetched successfully!");
    } catch (err) {
      toast.error("Not found or error");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const tableRow = result
    ? {
        custom_order_id: result.order.custom_order_id,
        collect_id: result.order.collect_request_id,
        school_id: result.order.school_id,
        order_amount: result.status?.order_amount ?? result.order.amount,
        transaction_amount: result.status?.transaction_amount ?? "-",
        status: result.status?.status ?? "pending",
        payment_mode: result.status?.payment_mode ?? "pending",
        payment_time: result.status?.payment_time ?? null,
      }
    : null;

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <input
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder="Enter custom_order_id"
          className="px-3 py-2 rounded border w-full dark:text-black outline-none"
        />
        <button
          onClick={check}
          className="px-3 py-2 bg-blue-600 text-white rounded"
        >
          Check
        </button>
      </div>

      {loading && <div className="card p-3">Loading...</div>}

      {result && (
        <div className="card p-3">
          <div className="overflow-x-auto card mt-4">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 px-3">Custom Order ID</th>
                  <th className="py-2 px-3">Collect ID</th>
                  <th className="py-2 px-3">School ID</th>
                  <th className="py-2 px-3">Order Amount</th>
                  <th className="py-2 px-3">Transaction Amount</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Gateway</th>
                  <th className="py-2 px-3">Payment Time</th>
                </tr>
              </thead>
              <tbody>
                {tableRow && (
                  <tr
                    className="table-row-hover cursor-pointer"
                    onClick={() => onRowClick?.(tableRow)}
                  >
                    <td className="py-2 px-3 break-words max-w-xs">
                      {tableRow.custom_order_id}
                    </td>
                    <td className="py-2 px-3">{tableRow.collect_id}</td>
                    <td className="py-2 px-3">{tableRow.school_id}</td>
                    <td className="py-2 px-3">{tableRow.order_amount}</td>
                    <td className="py-2 px-3">{tableRow.transaction_amount}</td>
                    <td
                      className={`py-2 px-3 font-semibold ${
                        tableRow.status === "SUCCESS"
                          ? "text-green-600"
                          : tableRow.status === "FAILED"
                          ? "text-red-600"
                          : "text-yellow-600"
                      }`}
                    >
                      {tableRow.status ?? "PENDING"}
                    </td>
                    <td className="py-2 px-3">{tableRow.payment_mode}</td>
                    <td className="py-2 px-3">
                      {tableRow.payment_time
                        ? new Date(tableRow.payment_time).toLocaleString()
                        : "-"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
