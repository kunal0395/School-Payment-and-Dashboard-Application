import React, { useState } from "react";
import api from "../api/axios";
import TransactionTable from "../components/TransactionTable";
import { toast } from "react-toastify";

export default function SchoolTransactions() {
  const [schoolId, setSchoolId] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const limit = 20;

  const fetchBySchool = async (reset = false) => {
    if (!schoolId) return toast.error("Enter school id");
    setLoading(true);
    try {
      const res = await api.get(`/transactions/school/${schoolId}`, {
        params: { page, limit },
      });
      const transactions = res.data.data || [];

      if (reset) setData(transactions);
      else setData((prev) => [...prev, ...transactions]);

      setHasMore(transactions.length === limit); // if less than limit, no more pages
      if (transactions.length === 0 && reset)
        toast.info("No transactions found for this school");
      else if (reset) toast.success("Data fetched successfully!");
    } catch (err) {
      toast.error("Not found or error");
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    setPage((prev) => prev + 1);
    fetchBySchool(false);
  };

  const handleFetch = () => {
    setPage(1);
    fetchBySchool(true);
  };

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <input
          value={schoolId}
          onChange={(e) => setSchoolId(e.target.value)}
          placeholder="Enter school id"
          className="px-3 py-2 rounded border w-full dark:text-black outline-none"
        />
        <button
          onClick={handleFetch}
          className="px-3 py-2 bg-blue-600 text-white rounded"
        >
          Fetch
        </button>
      </div>

      {loading && <div className="card p-3">Loading...</div>}

      {data.length > 0 && <TransactionTable data={data} />}

      {hasMore && !loading && (
        <div className="flex justify-end mt-2">
          <button
            onClick={handleNext}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-md"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
}
