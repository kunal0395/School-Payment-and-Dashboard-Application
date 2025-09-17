import React, { useEffect, useState, useMemo } from "react";
import api from "../api/axios";
import TransactionTable from "../components/TransactionTable";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-datepicker/dist/react-datepicker.css";
import DatePicker from "react-datepicker";

function MultiSelectDropdown({ options, value, onChange, label }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <label className="block text-sm font-medium mb-1 dark:text-gray-200">
        {label}
      </label>
      <div
        className="w-full px-3 py-2 border rounded-md text-sm dark:text-white bg-white dark:bg-gray-700 cursor-pointer outline-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        {value.length === 0 ? "Select options..." : `${value.length} selected`}
        <span className="float-right">▼</span>
      </div>
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border rounded-md shadow-lg max-h-48 overflow-y-auto">
          {options.map((option) => (
            <label
              key={option.value}
              className="flex items-center px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200"
            >
              <input
                type="checkbox"
                className="mr-2 accent-sky-600"
                checked={value.includes(option.value)}
                onChange={(e) => {
                  e.stopPropagation();
                  onChange(
                    value.includes(option.value)
                      ? value.filter((val) => val !== option.value)
                      : [...value, option.value]
                  );
                }}
              />
              {option.label}
            </label>
          ))}
        </div>
      )}
      {isOpen && (
        <div className="fixed inset-0 z-5" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
}

export default function Transactions() {
  const [originalData, setOriginalData] = useState([]);
  const [schoolOptions, setSchoolOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const limit = 20;

  const [status, setStatus] = useState([]);
  const [schoolIds, setSchoolIds] = useState([]);
  const [date, setDate] = useState(null);
  const [ascDesc, setAscDesc] = useState("desc");
  const [search, setSearch] = useState("");

  const [displayData, setDisplayData] = useState([]);

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Initialize filter state from URL
  useEffect(() => {
    setStatus(searchParams.getAll("status"));
    setSchoolIds(searchParams.getAll("school"));
    setDate(
      searchParams.get("date") ? new Date(searchParams.get("date")) : null
    );
    setAscDesc(searchParams.get("order") || "desc");
    setSearch(searchParams.get("q") || "");
  }, [searchParams]);

  // Update URL when filters change
  useEffect(() => {
    const params = {};
    if (status.length) params.status = status;
    if (schoolIds.length) params.school = schoolIds;
    if (date) params.date = date.toISOString().slice(0, 10);
    if (ascDesc !== "desc") params.order = ascDesc;
    if (search.trim()) params.q = search;

    setSearchParams(params, { replace: true });
  }, [status, schoolIds, date, ascDesc, search, setSearchParams]);

  // Load all data initially
  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      try {
        const res = await api.get("/transactions", {
          params: { page: 1, limit: 100 },
        });
        const data = res.data.data || [];
        setOriginalData(data);

        // Extract unique school options
        const schools = Array.from(
          new Map(
            data.map((t) => {
              const id =
                typeof t.school_id === "object"
                  ? t.school_id._id || t.school_id.id
                  : t.school_id;
              const label =
                typeof t.school_id === "object"
                  ? t.school_id.name
                  : t.school_id;
              return [id, { value: id, label }];
            })
          ).values()
        );
        setSchoolOptions(schools);
      } catch (err) {
        toast.error("Failed to load transactions");
      } finally {
        setLoading(false);
      }
    };
    loadAllData();
  }, []);

  const filteredData = useMemo(() => {
    let filtered = [...originalData];

    if (status.length > 0) {
      filtered = filtered.filter((item) =>
        status.includes(item.status?.toLowerCase())
      );
    }

    if (schoolIds.length > 0) {
      filtered = filtered.filter((item) => {
        const id =
          typeof item.school_id === "object"
            ? item.school_id._id || item.school_id.id
            : item.school_id;
        return schoolIds.includes(id);
      });
    }

    if (date) {
      const selected = date.toISOString().slice(0, 10);
      filtered = filtered.filter(
        (item) =>
          item.payment_time &&
          new Date(item.payment_time).toISOString().slice(0, 10) === selected
      );
    }

    if (search.trim()) {
      filtered = filtered.filter((item) =>
        Object.values(item)
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase())
      );
    }

    filtered.sort((a, b) => {
      const aTime = new Date(a.payment_time).getTime() || 0;
      const bTime = new Date(b.payment_time).getTime() || 0;
      return ascDesc === "asc" ? aTime - bTime : bTime - aTime;
    });

    if (status.includes("pending") && status.length > 1) {
      const pending = filtered.filter(
        (t) => t.status?.toLowerCase() === "pending"
      );
      const others = filtered.filter(
        (t) => t.status?.toLowerCase() !== "pending"
      );
      filtered = [...others, ...pending];
    }

    return filtered;
  }, [originalData, status, schoolIds, date, search, ascDesc]);

  useEffect(() => {
    setPage(1);
    setDisplayData(filteredData.slice(0, limit));
  }, [filteredData]);

  const filteredHasMore = displayData.length < filteredData.length;

  const handleNext = () => {
    const nextPage = page + 1;
    const start = (nextPage - 1) * limit;
    const end = start + limit;
    setDisplayData((prev) => [...prev, ...filteredData.slice(start, end)]);
    setPage(nextPage);
  };

  const handleClearFilters = () => {
    setStatus([]);
    setSchoolIds([]);
    setDate(null);
    setSearch("");
    setAscDesc("desc");
    navigate({ pathname: "/", search: "" }, { replace: true });
  };

  const handleApplyFilters = () => {
    setPage(1);
    setDisplayData(filteredData.slice(0, limit));
  };

  const onRowClick = (row) => {
    navigator.clipboard?.writeText(row.custom_order_id);
    toast.success("Copied custom_order_id to clipboard");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6 p-4 rounded-lg bg-white dark:bg-gray-800 shadow-md">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            Filter
          </h2>
          <button
            className="px-3 py-1 text-sm bg-gray-500 hover:bg-gray-600 text-white rounded-md"
            onClick={handleClearFilters}
          >
            Clear All
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          <MultiSelectDropdown
            label="Status"
            options={[
              { label: "Success", value: "success" },
              { label: "Pending", value: "pending" },
              { label: "Failed", value: "failed" },
            ]}
            value={status}
            onChange={setStatus}
          />
          <MultiSelectDropdown
            label="School"
            options={schoolOptions}
            value={schoolIds}
            onChange={setSchoolIds}
          />
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-200">
              Date
            </label>
            <DatePicker
              selected={date}
              onChange={setDate}
              placeholderText="YYYY-MM-DD"
              dateFormat="yyyy-MM-dd"
              isClearable
              className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-200">
              Sort Order
            </label>
            <select
              className="w-full px-3 py-2 border rounded-md text-sm dark:text-white bg-white dark:bg-gray-700 outline-none"
              value={ascDesc}
              onChange={(e) => setAscDesc(e.target.value)}
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              className="w-full px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-md"
              onClick={handleApplyFilters}
              disabled={loading}
            >
              {loading ? "Loading..." : "Apply"}
            </button>
          </div>
        </div>
        <div className="mt-4">
          <input
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm dark:text-white bg-white dark:bg-gray-700 outline-none"
          />
        </div>
      </div>

      {/* Info */}
      <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        Showing {displayData.length} of {filteredData.length} transactions
      </div>

      {/* Table */}
      {displayData.length === 0 && !loading ? (
        <div className="p-6 bg-white dark:bg-gray-800 shadow rounded-md text-center text-gray-500">
          No transactions found
        </div>
      ) : (
        <TransactionTable data={displayData} onRowClick={onRowClick} />
      )}

      {/* Load More */}
      <div className="flex justify-end mt-4">
        {filteredHasMore && (
          <button
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-md"
            onClick={handleNext}
          >
            Load More
          </button>
        )}
      </div>
    </div>
  );
}
