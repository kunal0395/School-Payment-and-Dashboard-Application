import React, { memo } from "react";

function TransactionTable({ data = [], onRowClick }) {
  return (
    <div className="overflow-x-auto card">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left border-b">
            <th className="py-2 px-3">Collect ID</th>
            <th className="py-2 px-3">School ID</th>
            <th className="py-2 px-3">Gateway</th>

            <th className="py-2 px-3">Order Amount</th>
            <th className="py-2 px-3">Transaction Amount</th>
            <th className="py-2 px-3">Status</th>

            <th className="py-2 px-3">Custom Order ID</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={row.custom_order_id || row.collect_id}
              className="table-row-hover cursor-pointer"
              onClick={() => onRowClick?.(row)}
            >
              <td className="py-2 px-3">{row.collect_id}</td>
              <td className="py-2 px-3">{row.school_id}</td>
              <td className="py-2 px-3">{row.payment_mode ?? "-"}</td>

              <td className="py-2 px-3">{row.order_amount}</td>
              <td className="py-2 px-3">{row.transaction_amount ?? "-"}</td>
              <td
                className={`py-2 px-3 font-semibold ${
                  row.status === "SUCCESS"
                    ? "text-green-600"
                    : row.status === "FAILED"
                    ? "text-red-600"
                    : "text-yellow-600"
                }`}
              >
                {row.status ?? "PENDING"}
              </td>
              <td className="py-2 px-3 break-words max-w-xs">
                {row.custom_order_id}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default memo(TransactionTable);
