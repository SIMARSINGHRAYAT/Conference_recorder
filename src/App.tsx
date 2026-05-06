import { FormEvent, useMemo, useState, useEffect } from "react";

type ConferenceEntry = {
  id: number;
  conferenceName: string;
  conferenceDate: string;
  status: string;
  publicationDate: string;
  expectedPublicationMonth: string;
  conferenceCategory: string;
};

type ConferenceForm = Omit<ConferenceEntry, "id">;

const emptyForm: ConferenceForm = {
  conferenceName: "",
  conferenceDate: "",
  status: "Accepted",
  publicationDate: "",
  expectedPublicationMonth: "",
  conferenceCategory: "IEEE",
};

const statuses = ["Accepted", "Presented"];
const categories = ["IEEE", "Springers", "CRC"];

export default function App() {
  const [form, setForm] = useState<ConferenceForm>(emptyForm);
  const [entries, setEntries] = useState<ConferenceEntry[]>(() => {
    const saved = localStorage.getItem("conference_entries");
    return saved ? JSON.parse(saved) : [];
  });
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    localStorage.setItem("conference_entries", JSON.stringify(entries));
  }, [entries]);

  const nextId = useMemo(() => {
    if (entries.length === 0) {
      return 1;
    }

    return Math.max(...entries.map((entry) => entry.id)) + 1;
  }, [entries]);

  const submitEntry = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (editingId !== null) {
      setEntries((previous) =>
        previous.map((entry) => (entry.id === editingId ? { ...form, id: editingId } : entry))
      );
      setEditingId(null);
    } else {
      setEntries((previous) => [
        ...previous,
        {
          id: nextId,
          ...form,
        },
      ]);
    }

    setForm(emptyForm);
  };

  const editEntry = (entry: ConferenceEntry) => {
    setEditingId(entry.id);
    const { id, ...formData } = entry;
    setForm(formData);
  };

  const removeEntry = (id: number) => {
    setEntries((previous) => previous.filter((entry) => entry.id !== id));
  };

  const counts = useMemo(() => {
    const ieee = entries.filter((entry) => entry.conferenceCategory === "IEEE").length;
    const springers = entries.filter((entry) => entry.conferenceCategory === "Springers").length;
    const crc = entries.filter((entry) => entry.conferenceCategory === "CRC").length;
    const other = entries.length - ieee - springers - crc;

    return {
      total: entries.length,
      ieee,
      springers,
      crc,
      other,
    };
  }, [entries]);

  const formatMonth = (value: string) => {
    if (!value) {
      return "-";
    }

    const [year, month] = value.split("-");
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  };

  const statusClassName = (status: string) => {
    if (status === "Presented") {
      return "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200";
    }

    return "bg-amber-100 text-amber-800 ring-1 ring-amber-200";
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 backdrop-blur-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Publication Tracker</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Conference Publication Dashboard</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">
            Add your conference papers, track acceptance and presentations, and monitor category-wise publication counts.
          </p>
        </header>

        <section className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400">Total Papers</p>
            <p className="mt-1 text-3xl font-semibold text-white">{counts.total}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400">IEEE</p>
            <p className="mt-1 text-2xl font-semibold text-cyan-300">{counts.ieee}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400">Springers</p>
            <p className="mt-1 text-2xl font-semibold text-violet-300">{counts.springers}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400">CRC</p>
            <p className="mt-1 text-2xl font-semibold text-fuchsia-300">{counts.crc}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400">Other</p>
            <p className="mt-1 text-2xl font-semibold text-slate-200">{counts.other}</p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-sm sm:p-6">
          <form onSubmit={submitEntry} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-200">Conference Name</span>
              <input
                required
                value={form.conferenceName}
                onChange={(event) => setForm((previous) => ({ ...previous, conferenceName: event.target.value }))}
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none transition focus:border-cyan-400"
                placeholder="e.g. ICML 2027"
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-200">Conference Date</span>
              <input
                required
                type="date"
                value={form.conferenceDate}
                onChange={(event) => setForm((previous) => ({ ...previous, conferenceDate: event.target.value }))}
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none transition focus:border-cyan-400"
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-200">Status</span>
              <select
                value={form.status}
                onChange={(event) => setForm((previous) => ({ ...previous, status: event.target.value }))}
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none transition focus:border-cyan-400"
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-200">Publication Date</span>
              <input
                type="date"
                value={form.publicationDate}
                onChange={(event) => setForm((previous) => ({ ...previous, publicationDate: event.target.value }))}
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none transition focus:border-cyan-400"
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-200">Expected Publication Month</span>
              <input
                type="month"
                value={form.expectedPublicationMonth}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    expectedPublicationMonth: event.target.value,
                  }))
                }
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none transition focus:border-cyan-400"
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-200">Conference Category</span>
              <select
                value={form.conferenceCategory}
                onChange={(event) => setForm((previous) => ({ ...previous, conferenceCategory: event.target.value }))}
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none transition focus:border-cyan-400"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="w-full rounded-md bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
              >
                {editingId !== null ? "Update Entry" : "Add Entry"}
              </button>
              {editingId !== null && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setForm(emptyForm);
                  }}
                  className="w-full rounded-md border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-700"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/70 shadow-sm">
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-slate-800/70 text-left text-slate-100">
              <tr>
                <th className="px-4 py-3 font-semibold">Serial Number</th>
                <th className="px-4 py-3 font-semibold">Conference Name</th>
                <th className="px-4 py-3 font-semibold">Conference Date</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Publication Date</th>
                <th className="px-4 py-3 font-semibold">Expected Publication Month</th>
                <th className="px-4 py-3 font-semibold">Conference Category</th>
                <th className="px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-slate-400">
                    No records yet. Add your first conference entry using the form above.
                  </td>
                </tr>
              ) : (
                entries.map((entry, index) => (
                  <tr key={entry.id} className="border-t border-slate-800 text-slate-200">
                    <td className="px-4 py-3 font-medium text-white">{index + 1}</td>
                    <td className="px-4 py-3">{entry.conferenceName}</td>
                    <td className="px-4 py-3">{entry.conferenceDate || "-"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClassName(entry.status)}`}>
                        {entry.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">{entry.publicationDate || "-"}</td>
                    <td className="px-4 py-3">{formatMonth(entry.expectedPublicationMonth)}</td>
                    <td className="px-4 py-3">{entry.conferenceCategory}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => editEntry(entry)}
                          className="rounded-md border border-cyan-500/60 px-3 py-1.5 text-xs font-medium text-cyan-200 transition hover:bg-cyan-500/10"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => removeEntry(entry.id)}
                          className="rounded-md border border-rose-500/60 px-3 py-1.5 text-xs font-medium text-rose-200 transition hover:bg-rose-500/10"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}
