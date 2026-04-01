"use client";

import { useState } from "react";

interface FormData {
  guestName: string;
  guestRoom: string;
  issueDescription: string;
  resolutionTaken: string;
  compensation: string;
}

const initialForm: FormData = {
  guestName: "",
  guestRoom: "",
  issueDescription: "",
  resolutionTaken: "",
  compensation: "",
};

export default function Home() {
  const [form, setForm] = useState<FormData>(initialForm);
  const [generatedEmail, setGeneratedEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setGeneratedEmail("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/generate-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setGeneratedEmail(data.email);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setForm(initialForm);
    setGeneratedEmail("");
    setError("");
  };

  const isFormValid =
    form.guestName.trim() &&
    form.issueDescription.trim() &&
    form.resolutionTaken.trim() &&
    form.compensation.trim();

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-stone-900 text-white py-6 px-6 shadow-md">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <div className="text-2xl">🏨</div>
          <div>
            <h1 className="text-xl font-semibold tracking-wide">
              Guest Recovery Email Generator
            </h1>
            <p className="text-stone-400 text-sm mt-0.5">
              Front Desk Staff Tool — Compose empathetic guest correspondence
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Panel */}
          <div>
            <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
              <h2 className="text-lg font-semibold text-stone-800 mb-5">
                Incident Details
              </h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Guest Name */}
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">
                    Guest Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="guestName"
                    value={form.guestName}
                    onChange={handleChange}
                    placeholder="e.g. Sarah Johnson"
                    className="w-full border border-stone-300 rounded-lg px-3.5 py-2.5 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent text-sm"
                    required
                  />
                </div>

                {/* Room Number (optional) */}
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">
                    Room Number{" "}
                    <span className="text-stone-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    name="guestRoom"
                    value={form.guestRoom}
                    onChange={handleChange}
                    placeholder="e.g. 412"
                    className="w-full border border-stone-300 rounded-lg px-3.5 py-2.5 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent text-sm"
                  />
                </div>

                {/* Issue Description */}
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">
                    What Happened <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="issueDescription"
                    value={form.issueDescription}
                    onChange={handleChange}
                    placeholder="Describe the issue the guest experienced (e.g. HVAC was not working upon check-in, resulting in an uncomfortably warm room overnight)."
                    rows={4}
                    className="w-full border border-stone-300 rounded-lg px-3.5 py-2.5 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent text-sm resize-none"
                    required
                  />
                </div>

                {/* Resolution */}
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">
                    How We Resolved It <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="resolutionTaken"
                    value={form.resolutionTaken}
                    onChange={handleChange}
                    placeholder="Describe the steps taken to fix the issue (e.g. Engineering was dispatched and repaired the unit by 9 AM; the guest was offered a room change the previous evening)."
                    rows={4}
                    className="w-full border border-stone-300 rounded-lg px-3.5 py-2.5 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent text-sm resize-none"
                    required
                  />
                </div>

                {/* Compensation */}
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">
                    Compensation / Goodwill Gesture{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="compensation"
                    value={form.compensation}
                    onChange={handleChange}
                    placeholder="Describe the compensation offered (e.g. We would like to comp one night of the stay and offer a complimentary upgrade on their next visit)."
                    rows={3}
                    className="w-full border border-stone-300 rounded-lg px-3.5 py-2.5 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent text-sm resize-none"
                    required
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                    {error}
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={isLoading || !isFormValid}
                    className="flex-1 bg-stone-800 hover:bg-stone-700 disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg
                          className="animate-spin h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                        Composing email…
                      </span>
                    ) : (
                      "Generate Email"
                    )}
                  </button>
                  {(generatedEmail || Object.values(form).some(Boolean)) && (
                    <button
                      type="button"
                      onClick={handleReset}
                      className="px-4 py-2.5 border border-stone-300 text-stone-600 hover:bg-stone-100 rounded-lg transition-colors text-sm font-medium"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Output Panel */}
          <div>
            <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 h-full">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-stone-800">
                  Generated Email
                </h2>
                {generatedEmail && (
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800 border border-stone-200 hover:border-stone-400 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    {copied ? (
                      <>
                        <svg
                          className="w-4 h-4 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="text-green-700">Copied!</span>
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                        Copy
                      </>
                    )}
                  </button>
                )}
              </div>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-64 text-stone-400">
                  <svg
                    className="animate-spin h-8 w-8 mb-3"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  <p className="text-sm">Crafting your message…</p>
                </div>
              ) : generatedEmail ? (
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-5">
                  <pre className="whitespace-pre-wrap font-sans text-sm text-stone-700 leading-relaxed">
                    {generatedEmail}
                  </pre>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-stone-300 text-center">
                  <svg
                    className="w-12 h-12 mb-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-sm">
                    Fill in the details on the left
                    <br />
                    and click <span className="font-medium">Generate Email</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-stone-400 text-xs mt-8">
          Powered by Claude AI · For internal use by Guest Relations staff only
        </p>
      </main>
    </div>
  );
}
