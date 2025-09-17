import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../api/axios";

const FINAL_STATUSES = ["SUCCESS", "FAILED", "CANCELLED", "ERROR"];

function extractStatusString(payload) {
  if (!payload) return null;
  if (typeof payload === "string") return payload;
  if (typeof payload.status === "string") return payload.status;
  if (payload.status && typeof payload.status === "object") {
    return payload.status.status ?? payload.status.state ?? null;
  }
  if (payload.order && typeof payload.order.status === "string")
    return payload.order.status;
  if (payload?.data && typeof payload.data.status === "string")
    return payload.data.status;
  if (typeof payload.status_code !== "undefined") {
    return Number(payload.status_code) === 200 ? "SUCCESS" : null;
  }
  return null;
}

function tryParsePaymentDetails(maybeString) {
  if (!maybeString) return null;
  if (typeof maybeString === "object") return maybeString;
  try {
    return JSON.parse(maybeString);
  } catch {
    return null;
  }
}

function normalizeStatusAndDetails(payload) {
  const rawStatus = (extractStatusString(payload) ?? "")
    .toString()
    .toUpperCase();
  const statusObj =
    payload?.status && typeof payload.status === "object"
      ? payload.status
      : payload ?? {};
  const parsedPaymentDetails = tryParsePaymentDetails(
    payload?.payment_details ?? payload?.details
  );

  const payment_mode =
    statusObj?.payment_mode ||
    payload?.payment_mode ||
    parsedPaymentDetails?.payment_mode ||
    parsedPaymentDetails?.payment_methods?.payment_mode ||
    null;

  const bank_reference =
    statusObj?.bank_reference ||
    statusObj?.bank_ref ||
    payload?.bank_reference ||
    payload?.bank_ref ||
    parsedPaymentDetails?.bank_ref ||
    parsedPaymentDetails?.bank_reference ||
    "";

  const transaction_amount =
    statusObj?.transaction_amount ??
    payload?.transaction_amount ??
    payload?.amount ??
    parsedPaymentDetails?.amount ??
    payload?.order?.transaction_amount ??
    null;

  const isUserDropped =
    rawStatus === "PENDING" &&
    (!payment_mode || String(payment_mode).toUpperCase() === "NA") &&
    (!bank_reference || String(bank_reference).trim() === "");

  const rawIsErrorOrCancelled =
    rawStatus === "ERROR" || rawStatus === "CANCELLED";

  let finalStatus;
  if (rawStatus === "SUCCESS") {
    finalStatus = "SUCCESS";
  } else if (rawStatus === "PENDING" && !isUserDropped) {
    finalStatus = "PENDING";
  } else if (
    rawIsErrorOrCancelled ||
    isUserDropped ||
    rawStatus === "PENDING"
  ) {
    finalStatus = "FAILED";
  } else {
    finalStatus = "FAILED";
  }

  const details = {
    raw: payload,
    statusObj,
    transaction_amount,
    payment_mode,
    bank_reference,
    payment_time: statusObj?.payment_time ?? payload?.payment_time ?? null,
  };

  if (isUserDropped) {
    details.error_reason =
      "User dropped / cancelled before selecting payment method.";
  } else if (rawIsErrorOrCancelled) {
    details.error_reason = `Gateway returned ${rawStatus}.`;
  } else if (finalStatus === "FAILED" && rawStatus === "PENDING") {
    details.error_reason =
      "Pending without payment method or bank reference — treated as failed.";
  }

  return {
    status: finalStatus,
    details,
  };
}

export default function PaymentStatus() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState("Checking...");
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState(null);
  const [error, setError] = useState(null);

  const customOrderId =
    searchParams.get("custom_order_id") ||
    searchParams.get("customOrderId") ||
    searchParams.get("collect_request_id") ||
    searchParams.get("EdvironCollectRequestId") ||
    null;

  const urlStatus = searchParams.get("status");

  useEffect(() => {
    let mounted = true;
    let intervalId;

    const handleResponse = (payload) => {
      const normalized = normalizeStatusAndDetails(payload);
      if (mounted) {
        setLoading(false);
        setError(null);
        setStatus(normalized.status);
        setDetails(normalized.details);
      }
      return normalized;
    };

    const checkRemoteStatus = async (idToCheck) => {
      if (!idToCheck) {
        setLoading(false);
        setStatus("No custom_order_id found");
        setError("missing id");
        return null;
      }

      try {
        const res = await api.get(`/payments/check-status/${idToCheck}`);
        return handleResponse(res.data);
      } catch (err) {
        try {
          const alt = await api.get(`/transaction-status/${idToCheck}`);
          return handleResponse(alt.data);
        } catch (err2) {
          setLoading(false);
          setStatus("Failed to fetch status");
          setError(err2?.response?.data ?? err2?.message ?? "Unknown error");
          return null;
        }
      }
    };

    const startPolling = async () => {
      if (urlStatus) {
        setStatus(String(urlStatus).toUpperCase());
        setLoading(false);
      }

      if (customOrderId) {
        const normalized = await checkRemoteStatus(customOrderId);
        const currentStatus = normalized?.status ?? urlStatus ?? null;

        if (
          !currentStatus ||
          !FINAL_STATUSES.includes(String(currentStatus).toUpperCase())
        ) {
          intervalId = setInterval(async () => {
            const n = await checkRemoteStatus(customOrderId);
            if (n && FINAL_STATUSES.includes(String(n.status).toUpperCase())) {
              clearInterval(intervalId);
            }
          }, 5000);
        }
      } else {
        setLoading(false);
      }
    };

    startPolling();

    return () => {
      mounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [customOrderId, urlStatus]);

  const renderDetails = () => {
    if (!details) return null;
    return (
      <div className="mt-4 text-left space-y-2">
        <div>
          <strong>Custom Order ID:</strong> {customOrderId ?? "-"}
        </div>
        <div>
          <strong>Transaction amount:</strong>{" "}
          {details.transaction_amount ?? "-"}
        </div>
        <div>
          <strong>Payment mode:</strong> {details.payment_mode ?? "-"}
        </div>
        <div>
          <strong>Bank reference:</strong> {details.bank_reference ?? "-"}
        </div>
        <div>
          <strong>Payment time:</strong>{" "}
          {details.payment_time
            ? new Date(details.payment_time).toLocaleString()
            : "-"}
        </div>

        {details.error_reason && (
          <div className="text-sm text-red-500">⚠ {details.error_reason}</div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="card text-center p-6 shadow-md max-w-2xl w-full">
        <h2 className="text-2xl font-bold mb-3">Payment Status</h2>

        {loading ? (
          <p className="text-gray-500 animate-pulse">
            Checking payment status...
          </p>
        ) : (
          <>
            <p className="text-lg font-medium">{String(status)}</p>

            {details && (
              <>
                {status === "SUCCESS" && (
                  <p className="mt-3 text-green-600">
                    ✅ Payment completed successfully!
                  </p>
                )}
                {status === "PENDING" && (
                  <p className="mt-3 text-yellow-600">
                    ⏳ Payment is still pending.
                  </p>
                )}
                {status === "FAILED" && (
                  <p className="mt-3 text-red-600">
                    ❌ Payment failed or cancelled.
                  </p>
                )}

                {renderDetails()}
              </>
            )}

            {error && (
              <div className="mt-3 text-sm text-red-600">
                <strong>Error:</strong>{" "}
                {typeof error === "string" ? error : JSON.stringify(error)}
              </div>
            )}

            <div className="mt-6 flex justify-center gap-2">
              <button
                onClick={() => navigate("/status")}
                className="px-4 py-2 bg-sky-600 text-white rounded"
              >
                Back to Status
              </button>
              <button
                onClick={async () => {
                  setLoading(true);
                  setError(null);
                  setDetails(null);
                  try {
                    const res = await api.get(
                      `/payments/check-status/${customOrderId}`
                    );
                    const normalized = normalizeStatusAndDetails(res.data);
                    setStatus(normalized.status);
                    setLoading(false);
                    setDetails(normalized.details);
                  } catch (err) {
                    setLoading(false);
                    setError(
                      err?.response?.data ?? err?.message ?? "Unknown error"
                    );
                  }
                }}
                className="px-4 py-2 border rounded"
              >
                Refresh
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
