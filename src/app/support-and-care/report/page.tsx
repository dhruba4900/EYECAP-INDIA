"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const issueOptions = [
  "Product problem",
  "Order problem",
  "Delivery problem",
  "Warranty issue",
  "Payment issue",
  "Account issue",
  "Other",
] as const;

type TicketFormState = {
  issueType: string;
  subject: string;
  description: string;
  productTrackingNumber: string;
  serialNumber: string;
  orderNumber: string;
  attachmentNotes: string;
};

const MAX_ATTACHMENTS = 5;

export default function SupportReportPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [form, setForm] = useState<TicketFormState>({
    issueType: issueOptions[0],
    subject: "",
    description: "",
    productTrackingNumber: "",
    serialNumber: "",
    orderNumber: "",
    attachmentNotes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<string | null>(null);

  if (loading) {
    return (
      <main className="min-h-screen bg-eyecap-dark px-4 py-16 text-white">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-eyecap-border bg-eyecap-surface/80 p-6 text-sm text-eyecap-muted">
          Checking your account...
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-eyecap-dark px-4 py-16 text-white">
        <div className="mx-auto max-w-2xl rounded-[2rem] border border-eyecap-border bg-eyecap-surface/80 p-8 text-center">
          <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-eyecap-cyan">
            ACCOUNT REQUIRED
          </p>
          <h1 className="mt-4 text-3xl font-semibold">Sign in to report an issue</h1>
          <p className="mt-3 text-sm leading-7 text-eyecap-muted">
            Your support ticket must be linked to your authenticated EYECAP account.
          </p>

          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/auth/login?redirect=/support-and-care/report"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-white px-6 text-sm font-semibold text-black transition hover:bg-eyecap-cyan"
            >
              Sign in
            </Link>

            <Link
              href="/support-and-care"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-eyecap-border px-6 text-sm font-semibold text-white transition hover:border-white"
            >
              Back to support
            </Link>
          </div>
        </div>
      </main>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.subject.trim() || !form.description.trim()) {
      setError("Please provide a subject and a detailed description.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append("issueType", form.issueType);
      formData.append("subject", form.subject);
      formData.append("description", form.description);
      formData.append("productTrackingNumber", form.productTrackingNumber);
      formData.append("serialNumber", form.serialNumber);
      formData.append("orderNumber", form.orderNumber);
      formData.append("attachmentNotes", form.attachmentNotes);

      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch("/api/support/tickets", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to submit your support request.");
      }

      setSuccess(data.ticket.ticketNumber);
      setForm({
        issueType: issueOptions[0],
        subject: "",
        description: "",
        productTrackingNumber: "",
        serialNumber: "",
        orderNumber: "",
        attachmentNotes: "",
      });
      setSelectedFiles([]);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to submit your support request."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-eyecap-dark px-4 py-12 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/support-and-care")}
            className="inline-flex items-center gap-2 rounded-full border border-eyecap-border px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-eyecap-muted transition hover:border-eyecap-cyan hover:text-eyecap-cyan"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Support
          </button>
        </div>

        <section className="rounded-[2rem] border border-eyecap-border bg-eyecap-surface/80 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-8">
          <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-eyecap-cyan">
            REPORT AN ISSUE
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            Tell us what needs attention
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-eyecap-muted">
            Share the details of your product, order, delivery, warranty, or account issue so the EYECAP team can review it.
          </p>

          {error && (
            <div
              role="alert"
              className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300"
            >
              {error}
            </div>
          )}

          {success && (
            <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>Ticket created successfully. Reference: {success}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-eyecap-light">Issue type</span>
                <select
                  value={form.issueType}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, issueType: event.target.value }))
                  }
                  className="min-h-12 w-full rounded-2xl border border-eyecap-border bg-eyecap-dark px-4 text-sm text-eyecap-light outline-none transition focus:border-eyecap-cyan focus:ring-2 focus:ring-eyecap-cyan/20"
                >
                  {issueOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-eyecap-light">Subject</span>
                <input
                  value={form.subject}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, subject: event.target.value }))
                  }
                  placeholder="Brief summary of the issue"
                  className="min-h-12 w-full rounded-2xl border border-eyecap-border bg-eyecap-dark px-4 text-sm text-eyecap-light outline-none transition placeholder:text-eyecap-muted focus:border-eyecap-cyan focus:ring-2 focus:ring-eyecap-cyan/20"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-eyecap-light">Description</span>
              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
                rows={6}
                placeholder="Describe the issue with as much detail as possible."
                className="w-full rounded-2xl border border-eyecap-border bg-eyecap-dark px-4 py-3 text-sm text-eyecap-light outline-none transition placeholder:text-eyecap-muted focus:border-eyecap-cyan focus:ring-2 focus:ring-eyecap-cyan/20"
              />
            </label>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-eyecap-light">
                  Product tracking number
                </span>
                <input
                  value={form.productTrackingNumber}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, productTrackingNumber: event.target.value }))
                  }
                  placeholder="Enter product tracking number or serial number"
                  className="min-h-12 w-full rounded-2xl border border-eyecap-border bg-eyecap-dark px-4 text-sm text-eyecap-light outline-none transition placeholder:text-eyecap-muted focus:border-eyecap-cyan focus:ring-2 focus:ring-eyecap-cyan/20"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-eyecap-light">Serial number</span>
                <input
                  value={form.serialNumber}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, serialNumber: event.target.value }))
                  }
                  placeholder="Optional"
                  className="min-h-12 w-full rounded-2xl border border-eyecap-border bg-eyecap-dark px-4 text-sm text-eyecap-light outline-none transition placeholder:text-eyecap-muted focus:border-eyecap-cyan focus:ring-2 focus:ring-eyecap-cyan/20"
                />
              </label>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-eyecap-light">Order number</span>
                <input
                  value={form.orderNumber}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, orderNumber: event.target.value }))
                  }
                  placeholder="Optional"
                  className="min-h-12 w-full rounded-2xl border border-eyecap-border bg-eyecap-dark px-4 text-sm text-eyecap-light outline-none transition placeholder:text-eyecap-muted focus:border-eyecap-cyan focus:ring-2 focus:ring-eyecap-cyan/20"
                />
              </label>

              <div className="block">
                <span className="mb-2 block text-sm font-medium text-eyecap-light">
                  Attachments
                </span>
                <label className="flex min-h-12 cursor-pointer items-center justify-center rounded-2xl border border-dashed border-eyecap-border bg-eyecap-dark px-4 text-center text-sm text-eyecap-muted transition hover:border-eyecap-cyan hover:text-eyecap-cyan">
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*,.pdf,.doc,.docx"
                    onChange={(event) => {
                      const incomingFiles = Array.from(event.target.files ?? []);
                      setSelectedFiles((current) => [...current, ...incomingFiles].slice(0, 5));
                      event.target.value = "";
                    }}
                    className="hidden"
                  />
                  Upload photos, videos or files
                </label>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-eyecap-light">
                  Evidence notes
                </span>
                <textarea
                  value={form.attachmentNotes}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, attachmentNotes: event.target.value }))
                  }
                  rows={4}
                  placeholder="Add photo references, screenshots, invoice details, documents, or links that help explain the product issue."
                  className="w-full rounded-2xl border border-eyecap-border bg-eyecap-dark px-4 py-3 text-sm text-eyecap-light outline-none transition placeholder:text-eyecap-muted focus:border-eyecap-cyan focus:ring-2 focus:ring-eyecap-cyan/20"
                />
              </label>

              {selectedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="inline-flex items-center gap-2 rounded-full border border-eyecap-border bg-eyecap-surface px-3 py-1.5 text-xs text-eyecap-light"
                    >
                      <span className="max-w-[180px] truncate">{file.name}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedFiles((current) => current.filter((item) => item !== file))
                        }
                        className="text-eyecap-muted transition hover:text-white"
                        aria-label={`Remove ${file.name}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Link
                href="/support-and-care"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-eyecap-border px-6 text-sm font-semibold text-white transition hover:border-white"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-6 text-sm font-semibold text-black transition hover:bg-eyecap-cyan disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit support request"
                )}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
