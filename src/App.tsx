import { FormEvent, useMemo, useState, useEffect } from "react";

type ConferenceEntry = {
  id: number;
  conferenceName: string;
  conferenceDate: string;
  status: string;
  isRegistered?: boolean;
  presentationDate?: string;
  presentationTime?: string;
  publicationDate: string;
  expectedPublicationMonth: string;
  conferenceCategory: string;
  papersSubmitted: number | "";
};

type ConferenceForm = Omit<ConferenceEntry, "id">;

const emptyForm: ConferenceForm = {
  conferenceName: "",
  conferenceDate: "",
  status: "Accepted",
  isRegistered: false,
  presentationDate: "",
  presentationTime: "",
  publicationDate: "",
  expectedPublicationMonth: "",
  conferenceCategory: "IEEE",
  papersSubmitted: "",
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

  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => {
      if (!a.conferenceDate) return 1;
      if (!b.conferenceDate) return -1;
      return new Date(a.conferenceDate).getTime() - new Date(b.conferenceDate).getTime();
    });
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
    const sumPapers = (condition: (entry: ConferenceEntry) => boolean) =>
      entries
        .filter(condition)
        .reduce((sum, entry) => sum + (Number(entry.papersSubmitted) || 0), 0);

    const ieee = sumPapers((entry) => entry.conferenceCategory === "IEEE");
    const springers = sumPapers((entry) => entry.conferenceCategory === "Springers");
    const crc = sumPapers((entry) => entry.conferenceCategory === "CRC");
    const other = sumPapers(
      (entry) => !["IEEE", "Springers", "CRC"].includes(entry.conferenceCategory)
    );

    return {
      total: sumPapers(() => true),
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

  const statusClassName = (status: string, publicationDate: string) => {
    if (status === "Presented") {
      if (publicationDate) {
        return "bg-green-900 text-white ring-1 ring-green-700";
      }
      return "bg-green-500 text-white ring-1 ring-green-400";
    }

    return "bg-amber-100 text-black ring-1 ring-amber-200";
  };

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white sm:px-8 font-['Comic_Sans_MS',_Comic_Sans,_cursive]">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-2xl border border-white/20 bg-black p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Publication Tracker</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Conference Publication Dashboard</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-300">
            Add your conference papers, track acceptance and presentations, and monitor category-wise publication counts.
          </p>
        </header>

        <section className="grid gap-4 rounded-2xl border border-white/20 bg-black p-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-400">Total Papers Submitted</p>
            <p className="mt-1 text-3xl font-semibold text-white">{counts.total}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-400">IEEE Submitted</p>
            <p className="mt-1 text-2xl font-semibold text-cyan-300">{counts.ieee}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-400">Springers Submitted</p>
            <p className="mt-1 text-2xl font-semibold text-violet-300">{counts.springers}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-400">CRC Submitted</p>
            <p className="mt-1 text-2xl font-semibold text-fuchsia-300">{counts.crc}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-400">Other Submitted</p>
            <p className="mt-1 text-2xl font-semibold text-gray-200">{counts.other}</p>
          </div>
        </section>

        <section className="rounded-2xl border border-white/20 bg-black p-4 shadow-sm sm:p-6">
          <form onSubmit={submitEntry} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-1">
              <span className="text-sm font-medium text-gray-200">Conference Name</span>
              <input
                required
                value={form.conferenceName}
                onChange={(event) => setForm((previous) => ({ ...previous, conferenceName: event.target.value }))}
                className="w-full rounded-md border border-white/30 bg-black px-3 py-2 text-white outline-none transition focus:border-cyan-400"
                placeholder="e.g. ICML 2027"
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-gray-200">Conference Date</span>
              <input
                required
                type="date"
                value={form.conferenceDate}
                onChange={(event) => setForm((previous) => ({ ...previous, conferenceDate: event.target.value }))}
                className="w-full rounded-md border border-white/30 bg-black px-3 py-2 text-white outline-none transition focus:border-cyan-400"
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-gray-200">Status</span>
              <select
                value={form.status}
                onChange={(event) => setForm((previous) => ({ ...previous, status: event.target.value }))}
                className="w-full rounded-md border border-white/30 bg-black px-3 py-2 text-white outline-none transition focus:border-cyan-400"
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>

            {form.status === "Accepted" && (
              <label className="space-y-1 flex flex-col justify-end pb-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.isRegistered || false}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        isRegistered: event.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-white/30 bg-black text-cyan-400"
                  />
                  <span className="text-sm font-medium text-gray-200">Registered</span>
                </div>
              </label>
            )}

            {form.status === "Accepted" && form.isRegistered && (
              <>
                <label className="space-y-1">
                  <span className="text-sm font-medium text-gray-200">Presentation Date</span>
                  <input
                    type="date"
                    value={form.presentationDate || ""}
                    onChange={(event) => setForm((previous) => ({ ...previous, presentationDate: event.target.value }))}
                    className="w-full rounded-md border border-white/30 bg-black px-3 py-2 text-white outline-none transition focus:border-cyan-400"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-sm font-medium text-gray-200">Presentation Time</span>
                  <input
                    type="time"
                    value={form.presentationTime || ""}
                    onChange={(event) => setForm((previous) => ({ ...previous, presentationTime: event.target.value }))}
                    className="w-full rounded-md border border-white/30 bg-black px-3 py-2 text-white outline-none transition focus:border-cyan-400"
                  />
                </label>
              </>
            )}

            <label className="space-y-1">
              <span className="text-sm font-medium text-gray-200">Papers Submitted</span>
              <input
                type="number"
                min="0"
                value={form.papersSubmitted}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    papersSubmitted: event.target.value ? Number(event.target.value) : "",
                  }))
                }
                className="w-full rounded-md border border-white/30 bg-black px-3 py-2 text-white outline-none transition focus:border-cyan-400"
                placeholder="e.g. 1"
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-gray-200">Publication Date</span>
              <input
                type="date"
                value={form.publicationDate}
                onChange={(event) => setForm((previous) => ({ ...previous, publicationDate: event.target.value }))}
                className="w-full rounded-md border border-white/30 bg-black px-3 py-2 text-white outline-none transition focus:border-cyan-400"
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-gray-200">Expected Publication Month</span>
              <input
                type="month"
                value={form.expectedPublicationMonth}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    expectedPublicationMonth: event.target.value,
                  }))
                }
                className="w-full rounded-md border border-white/30 bg-black px-3 py-2 text-white outline-none transition focus:border-cyan-400"
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-gray-200">Conference Category</span>
              <select
                value={form.conferenceCategory}
                onChange={(event) => setForm((previous) => ({ ...previous, conferenceCategory: event.target.value }))}
                className="w-full rounded-md border border-white/30 bg-black px-3 py-2 text-white outline-none transition focus:border-cyan-400"
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
                className="w-full rounded-md bg-cyan-700 hover:bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition"
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
                  className="w-full rounded-md border border-white/60 bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="overflow-x-auto rounded-2xl border border-white/20 bg-black shadow-sm">
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-white/10 text-left text-white">
              <tr>
                <th className="px-4 py-3 font-semibold">Serial Number</th>
                <th className="px-4 py-3 font-semibold">Conference Name</th>
                <th className="px-4 py-3 font-semibold">Conference Date</th>
                <th className="px-4 py-3 font-semibold">Papers Submitted</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Publication Date</th>
                <th className="px-4 py-3 font-semibold">Expected Publication Month</th>
                <th className="px-4 py-3 font-semibold">Conference Category</th>
                <th className="px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedEntries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-gray-400">
                    No records yet. Add your first conference entry using the form above.
                  </td>
                </tr>
              ) : (
                sortedEntries.map((entry, index) => (
                  <tr 
                    key={entry.id} 
                    className={`border-t border-white/20 text-gray-200 ${entry.status === 'Accepted' ? 'bg-amber-900/40 border-l-4 border-l-amber-500' : ''}`}
                  >
                    <td className="px-4 py-3 font-medium text-white">{index + 1}</td>
                    <td className="px-4 py-3">{entry.conferenceName}</td>
                    <td className="px-4 py-3">{entry.conferenceDate || "-"}</td>
                    <td className="px-4 py-3">{entry.papersSubmitted || "-"}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1 items-start">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClassName(entry.status, entry.publicationDate)}`}>
                            {entry.status}
                          </span>
                          {entry.status === "Accepted" && (
                            <div 
                              className={`h-2.5 w-2.5 rounded-full ring-1 ring-white/50 ${entry.isRegistered ? 'bg-green-500' : 'bg-red-500'}`} 
                              title={entry.isRegistered ? "Registered" : "Not Registered"} 
                            />
                          )}
                        </div>
                        {entry.status === "Accepted" && entry.isRegistered && (entry.presentationDate || entry.presentationTime) && (
                          <div className="text-[10px] text-gray-400 pl-1 whitespace-nowrap">
                            {entry.presentationDate && <span>{entry.presentationDate}</span>}
                            {entry.presentationDate && entry.presentationTime && <span> at </span>}
                            {entry.presentationTime && <span>{entry.presentationTime}</span>}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">{entry.publicationDate || "-"}</td>
                    <td className="px-4 py-3">{formatMonth(entry.expectedPublicationMonth)}</td>
                    <td className="px-4 py-3">{entry.conferenceCategory}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => editEntry(entry)}
                          className="rounded-md border border-cyan-500/60 px-3 py-1.5 text-xs font-medium text-cyan-200 transition hover:bg-cyan-500/20"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => removeEntry(entry.id)}
                          className="rounded-md border border-red-500/60 px-3 py-1.5 text-xs font-medium text-red-200 transition hover:bg-red-500/20"
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
