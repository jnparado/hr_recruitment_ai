"use client";

import { useEffect, useState } from "react";
import type { DbJob } from "@/lib/types";

const emptyForm = {
  title: "",
  department: "Engineering",
  location: "Remote",
  type: "Full-time",
  description: "",
  requirements: "",
};

export default function JobManagementPage() {
  const [jobs, setJobs] = useState<DbJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/dashboard/jobs");
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed to load jobs.");
      setJobs(d.jobs ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load jobs.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/dashboard/jobs", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingId ? { id: editingId, ...form } : form),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Save failed.");
      setForm(emptyForm);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(id: string, status: "open" | "closed" | "archived") {
    setBusy(true);
    try {
      const r = await fetch("/api/dashboard/jobs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Update failed.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setBusy(false);
    }
  }

  function startEdit(job: DbJob) {
    setEditingId(job.id);
    setForm({
      title: job.title,
      department: job.department,
      location: job.location,
      type: job.type,
      description: job.description,
      requirements: job.requirements,
    });
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Job Management</h1>
      <p className="mt-1 text-sm text-slate-600">
        Create, edit, close, or archive roles shown on the Career Website.
      </p>

      {error && (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          {error}
        </div>
      )}

      <form
        onSubmit={save}
        className="mt-6 space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <h2 className="font-semibold text-slate-900">
          {editingId ? "Edit job" : "Create job"}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            required
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="rounded-xl border border-slate-300 p-2.5 text-sm"
          />
          <input
            placeholder="Department"
            value={form.department}
            onChange={(e) => setForm({ ...form, department: e.target.value })}
            className="rounded-xl border border-slate-300 p-2.5 text-sm"
          />
          <input
            placeholder="Location"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            className="rounded-xl border border-slate-300 p-2.5 text-sm"
          />
          <input
            placeholder="Type"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="rounded-xl border border-slate-300 p-2.5 text-sm"
          />
        </div>
        <textarea
          required
          rows={3}
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full rounded-xl border border-slate-300 p-2.5 text-sm"
        />
        <textarea
          rows={2}
          placeholder="Requirements"
          value={form.requirements}
          onChange={(e) => setForm({ ...form, requirements: e.target.value })}
          className="w-full rounded-xl border border-slate-300 p-2.5 text-sm"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:bg-slate-300"
          >
            {busy ? "Saving…" : editingId ? "Update job" : "Create job"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
              }}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {loading && <p className="mt-6 text-sm text-slate-500">Loading jobs…</p>}

      <div className="mt-6 space-y-3">
        {jobs.map((job) => {
          const status = job.status || (job.active ? "open" : "closed");
          return (
            <article
              key={job.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-slate-900">{job.title}</h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {job.department} · {job.location} · {job.type} ·{" "}
                    <span className="capitalize">{status}</span>
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(job)}
                    className="text-xs font-semibold text-indigo-700 hover:underline"
                  >
                    Edit
                  </button>
                  {status !== "open" && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void setStatus(job.id, "open")}
                      className="text-xs font-semibold text-emerald-700 hover:underline"
                    >
                      Reopen
                    </button>
                  )}
                  {status === "open" && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void setStatus(job.id, "closed")}
                      className="text-xs font-semibold text-amber-700 hover:underline"
                    >
                      Close
                    </button>
                  )}
                  {status !== "archived" && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void setStatus(job.id, "archived")}
                      className="text-xs font-semibold text-slate-500 hover:underline"
                    >
                      Archive
                    </button>
                  )}
                </div>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-slate-600">{job.description}</p>
            </article>
          );
        })}
      </div>
    </div>
  );
}
