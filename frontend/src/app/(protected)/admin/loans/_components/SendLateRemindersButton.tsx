"use client";

import { useState, useEffect } from "react";
import { Mail, AlertCircle, CheckCircle2, Loader2, Send } from "lucide-react";
import { sendLateItemReminders, sendTestEmail } from "@/lib/api";
import { fetchUsers } from "@/lib/api_client/auth";
import type { AuthUser } from "@/lib/api_client/types";

interface SendRemindersResult {
  status: string;
  message?: string;
  total_users_checked?: number;
  emails_sent?: number;
  users_with_overdue?: Array<{
    user_id: number;
    user_name: string;
    user_email: string;
    overdue_count: number;
  }>;
  errors?: string[];
}

interface TestEmailResult {
  status: string;
  message: string;
  user_id?: number;
  user_name?: string;
  user_email?: string;
  item_name?: string;
  days_overdue?: number;
}

export function SendLateRemindersButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SendRemindersResult | TestEmailResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  // Test email dialog
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [testItemName, setTestItemName] = useState("Test Item");
  const [testDaysOverdue, setTestDaysOverdue] = useState(5);

  useEffect(() => {
    // Load users for test email dialog
    if (showTestDialog) {
      fetchUsers()
        .then(setUsers)
        .catch((err) => {
          console.error("Failed to load users:", err);
          setError("Failed to load users");
        });
    }
  }, [showTestDialog]);

  const handleSendReminders = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await sendLateItemReminders();
      setResult(response);
      setShowResult(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reminders");
    } finally {
      setLoading(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!selectedUserId) {
      setError("Please select a user");
      return;
    }

    setTestLoading(true);
    setError(null);

    try {
      const response = await sendTestEmail(
        Number(selectedUserId),
        testItemName,
        testDaysOverdue
      );
      setResult(response);
      setShowResult(true);
      setShowTestDialog(false);
      setSelectedUserId("");
      setTestItemName("Test Item");
      setTestDaysOverdue(5);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send test email");
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={handleSendReminders}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Mail size={16} />
              Send Late Item Reminders
            </>
          )}
        </button>

        <button
          onClick={() => setShowTestDialog(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-700 transition-colors"
        >
          <Send size={16} />
          Send Test Email
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 flex gap-3">
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {showResult && result && (
        <div className="p-4 bg-blue-50 text-blue-900 rounded-xl border border-blue-100 space-y-3">
          <div className="flex gap-3 items-start">
            {result.status === "disabled" ? (
              <AlertCircle size={20} className="shrink-0 mt-0.5 text-orange-600" />
            ) : result.status === "error" ? (
              <AlertCircle size={20} className="shrink-0 mt-0.5 text-red-600" />
            ) : (
              <CheckCircle2 size={20} className="shrink-0 mt-0.5 text-green-600" />
            )}
            <div>
              <p className="font-bold">
                {result.status === "disabled"
                  ? "Email Service Disabled"
                  : result.status === "error"
                  ? "Error"
                  : "Success"}
              </p>
              {result.message && (
                <p className="text-sm">{result.message}</p>
              )}
            </div>
          </div>

          {"total_users_checked" in result && (
            <div className="text-sm space-y-1 ml-8">
              <p>
                <span className="font-semibold">Users checked:</span>{" "}
                {result.total_users_checked}
              </p>
              <p>
                <span className="font-semibold">Emails sent:</span>{" "}
                {result.emails_sent || 0}
              </p>
            </div>
          )}

          {"user_name" in result && (
            <div className="text-sm space-y-1 ml-8">
              <p>
                <span className="font-semibold">User:</span> {result.user_name}
              </p>
              <p>
                <span className="font-semibold">Email:</span> {result.user_email}
              </p>
              <p>
                <span className="font-semibold">Test Item:</span> {result.item_name}
              </p>
              <p>
                <span className="font-semibold">Days Overdue:</span>{" "}
                {result.days_overdue}
              </p>
            </div>
          )}

          {"users_with_overdue" in result && result.users_with_overdue && result.users_with_overdue.length > 0 && (
            <div className="ml-8 text-sm">
              <p className="font-semibold mb-2">Users with overdue items:</p>
              <ul className="space-y-1 list-disc list-inside">
                {result.users_with_overdue.map((user) => (
                  <li key={user.user_id} className="text-sm">
                    {user.user_name} - {user.overdue_count} item(s) overdue
                  </li>
                ))}
              </ul>
            </div>
          )}

          {"errors" in result && result.errors && result.errors.length > 0 && (
            <div className="ml-8 text-sm">
              <p className="font-semibold mb-2 text-red-600">Errors:</p>
              <ul className="space-y-1 list-disc list-inside text-red-600">
                {result.errors.map((err, idx) => (
                  <li key={idx} className="text-sm">
                    {err}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={() => setShowResult(false)}
            className="mt-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Test Email Dialog */}
      {showTestDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full space-y-4">
            <div>
              <h3 className="text-lg font-bold">Send Test Email</h3>
              <p className="text-sm text-gray-600 mt-1">
                Send a test email reminder to any user
              </p>
            </div>

            <div className="space-y-3">
              {/* User Selection */}
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Select User
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">-- Choose a user --</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Item Name */}
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Item Name
                </label>
                <input
                  type="text"
                  value={testItemName}
                  onChange={(e) => setTestItemName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., Laptop, Camera, etc."
                />
              </div>

              {/* Days Overdue */}
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Days Overdue
                </label>
                <input
                  type="number"
                  min="1"
                  value={testDaysOverdue}
                  onChange={(e) => setTestDaysOverdue(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Days"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setShowTestDialog(false)}
                disabled={testLoading}
                className="px-4 py-2 rounded-lg font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendTestEmail}
                disabled={testLoading || !selectedUserId}
                className="px-4 py-2 rounded-lg font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed inline-flex items-center gap-2 transition-colors"
              >
                {testLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Send Test Email
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500 px-1">
        💡 Dev tools: Send email notifications to users with overdue items (14+ days
        overdue) or send test emails to any user
      </p>
    </div>
  );
}
