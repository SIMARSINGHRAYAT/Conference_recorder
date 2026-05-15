import { FormEvent, useMemo, useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Bell, Download, X, Search, Check, Plus, ArrowLeft } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
  notified?: boolean;
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

type FutureConference = {
  id: number;
  conferenceName: string;
  submissionDeadline: string;
  notes: string;
};

const statuses = ["Accepted", "Presented"];
const categories = ["IEEE", "Springers", "CRC"];

type View = "welcome" | "dashboard" | "add-future";

export default function App() {
  const [currentView, setCurrentView] = useState<View>("welcome");

  const [form, setForm] = useState<ConferenceForm>(emptyForm);
  const [entries, setEntries] = useState<ConferenceEntry[]>(() => {
    const saved = localStorage.getItem("conference_entries");
    return saved ? JSON.parse(saved) : [];
  });
  const [editingId, setEditingId] = useState<number | null>(null);

  const [futureConfs, setFutureConfs] = useState<FutureConference[]>(() => {
    const saved = localStorage.getItem("future_conferences");
    return saved ? JSON.parse(saved) : [];
  });
  const [futureForm, setFutureForm] = useState({ conferenceName: "", submissionDeadline: "", notes: "" });

  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [inAppNotifications, setInAppNotifications] = useState<any[]>(() => {
    const saved = localStorage.getItem("app_notifications");
    return saved ? JSON.parse(saved) : [];
  });
  
  const [notifyForm, setNotifyForm] = useState({
    conferenceId: "",
    message: "",
    notifyDate: "",
    notifyTime: ""
  });

  const [scholarInput, setScholarInput] = useState("");
  const [isFetchingScholar, setIsFetchingScholar] = useState(false);
  const [fetchedScholar, setFetchedScholar] = useState<{name: string, citations: string, hIndex: string, i10Index: string, id: string} | null>(null);
  const [scholarSubmitted, setScholarSubmitted] = useState<{name: string, citations: string, hIndex: string, i10Index: string, id: string} | null>(() => {
    const saved = localStorage.getItem("scholar_data");
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    localStorage.setItem("app_notifications", JSON.stringify(inAppNotifications));
  }, [inAppNotifications]);

  useEffect(() => {
    localStorage.setItem("scholar_data", JSON.stringify(scholarSubmitted));
  }, [scholarSubmitted]);

  useEffect(() => {
    // In-app notification checker every minute
    const checkReminders = setInterval(() => {
      const now = new Date();
      let updated = false;

      const updatedNotifs = inAppNotifications.map(notif => {
        if (notif.isNotified) return notif;

        const notifyDateTime = new Date(`${notif.notifyDate}T${notif.notifyTime}`);
        if (isNaN(notifyDateTime.getTime())) return notif;

        if (now >= notifyDateTime) {
          toast.info(`Reminder: ${notif.message}`, {
            position: "top-right",
            autoClose: 10000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: "dark",
          });
          
          if ("Notification" in window && window.Notification.permission === "granted") {
            new window.Notification("Conference Tracker Reminder", { body: notif.message });
          }

          updated = true;
          return { ...notif, isNotified: true };
        }
        return notif;
      });

      if (updated) {
        setInAppNotifications(updatedNotifs);
      }
    }, 30000);

    return () => clearInterval(checkReminders);
  }, [inAppNotifications]);

  const saveNotificationSettings = () => {
    if (!notifyForm.conferenceId || !notifyForm.notifyDate || !notifyForm.notifyTime) {
      toast.error("Please fill all required fields");
      return;
    }
    
    // Request browser notification permission
    if ("Notification" in window && window.Notification.permission !== "denied" && window.Notification.permission !== "granted") {
      window.Notification.requestPermission();
    }

    const conf = entries.find(e => e.id.toString() === notifyForm.conferenceId);
    
    setInAppNotifications(prev => [...prev, {
      id: Date.now(),
      conferenceName: conf ? conf.conferenceName : "Unknown",
      message: notifyForm.message,
      notifyDate: notifyForm.notifyDate,
      notifyTime: notifyForm.notifyTime,
      isNotified: false
    }]);

    setNotifyForm({ conferenceId: "", message: "", notifyDate: "", notifyTime: "" });
    setShowNotifyModal(false);
    toast.success("Notification scheduled successfully!");
  };

  const nextId = useMemo(() => {
    if (entries.length === 0) return 1;
    return Math.max(...entries.map((entry) => entry.id)) + 1;
  }, [entries]);

  const nextFutureId = useMemo(() => {
    if (futureConfs.length === 0) return 1;
    return Math.max(...futureConfs.map((c) => c.id)) + 1;
  }, [futureConfs]);

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
      setEntries((previous) => [...previous, { id: nextId, ...form }]);
    }
    setForm(emptyForm);
  };

  const submitFutureEntry = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFutureConfs((prev) => [...prev, { id: nextFutureId, ...futureForm }]);
    setFutureForm({ conferenceName: "", submissionDeadline: "", notes: "" });
  };

  const removeFutureEntry = (id: number) => {
    setFutureConfs((prev) => prev.filter((c) => c.id !== id));
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

    return {
      total: sumPapers(() => true),
      ieee: sumPapers((entry) => entry.conferenceCategory === "IEEE"),
      springers: sumPapers((entry) => entry.conferenceCategory === "Springers"),
      crc: sumPapers((entry) => entry.conferenceCategory === "CRC"),
      other: sumPapers((entry) => !["IEEE", "Springers", "CRC"].includes(entry.conferenceCategory)),
    };
  }, [entries]);

  const formatMonth = (value: string) => {
    if (!value) return "-";
    const [year, month] = value.split("-");
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  };

  const statusClassName = (status: string, publicationDate: string) => {
    if (publicationDate) return "bg-blue-600 text-white ring-1 ring-blue-500";
    if (status === "Presented") return "bg-green-500 text-white ring-1 ring-green-400";
    return "bg-amber-100 text-black ring-1 ring-amber-200";
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Conference Publication Dashboard", 14, 22);
    
    const tableColumn = ["S.No", "Conference", "Conf Date", "Papers", "Status", "Pub Date", "Expected Mon", "Category"];
    const tableRows = sortedEntries.map((entry, index) => [
      index + 1,
      entry.conferenceName,
      entry.conferenceDate || "-",
      entry.papersSubmitted || "-",
      entry.publicationDate ? "Published" : entry.status,
      entry.publicationDate || "-",
      formatMonth(entry.expectedPublicationMonth),
      entry.conferenceCategory
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 30,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [0, 188, 212] }
    });

    doc.save("conference-data.pdf");
  };

  const handleFetchScholar = async () => {
    if (!scholarInput.trim()) return;
    setIsFetchingScholar(true);
    try {
      const targetUrl = `https://scholar.google.com/citations?user=${scholarInput}&hl=en`;
      const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`);
      const data = await response.json();
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(data.contents, "text/html");
      
      const name = doc.querySelector("#gsc_prf_in")?.textContent || "Unknown Name";
      const tds = doc.querySelectorAll("#gsc_rsb_st td.gsc_rsb_std");
      
      const citations = tds[0]?.textContent || "0";
      const hIndex = tds[2]?.textContent || "0";
      const i10Index = tds[4]?.textContent || "0";

      setFetchedScholar({ 
        id: scholarInput, 
        name,
        citations,
        hIndex,
        i10Index
      });
      toast.success("Scholar data fetched successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch Google Scholar data.");
    } finally {
      setIsFetchingScholar(false);
    }
  };

  const handleSubmitScholar = () => {
    if (fetchedScholar) {
      setScholarSubmitted(fetchedScholar);
      setFetchedScholar(null);
      setScholarInput("");
    }
  };

  if (currentView === "welcome") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-900 to-black px-4 font-sans relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <div className="relative z-10 text-center space-y-6 bg-black/40 p-12 rounded-3xl backdrop-blur-md border border-purple-500/20 shadow-2xl">
          <h1 className="text-5xl sm:text-7xl font-extrabold text-white tracking-wider">
            Welcome to <span className="text-purple-400 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-300">Tracker</span>
          </h1>
          <p className="text-gray-300 text-lg sm:text-xl max-w-lg mx-auto leading-relaxed font-light">
            Record your publications, manage presentations, and monitor your scholar citations seamlessly through our professional dashboard.
          </p>
          <button 
            onClick={() => setCurrentView("dashboard")}
            className="mt-10 rounded-full bg-purple-600 px-10 py-4 text-lg font-bold text-white shadow-[0_0_20px_rgba(147,51,234,0.4)] transition-all hover:scale-105 hover:bg-purple-500 cursor-pointer border border-purple-400 text-center inline-block uppercase tracking-widest"
          >
            Get Started
          </button>
        </div>
      </main>
    );
  }

  if (currentView === "add-future") {
    return (
      <main className="min-h-screen bg-black px-4 py-8 text-white sm:px-8 font-sans">
        <ToastContainer />
        <div className="mx-auto max-w-4xl space-y-6">
          <header className="flex items-center gap-4">
            <button 
              onClick={() => setCurrentView("dashboard")}
              className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition"
            >
              <ArrowLeft size={20} />
              Back to Dashboard
            </button>
          </header>
          
          <div className="rounded-2xl border border-white/20 bg-gray-900 shadow-xl p-6 sm:p-8">
            <h2 className="text-2xl font-bold mb-6 text-purple-100">Add Conference for Further Submission</h2>
            <form onSubmit={submitFutureEntry} className="space-y-4">
              <label className="block space-y-1">
                <span className="text-sm font-medium text-gray-200">Conference Name</span>
                <input
                  required
                  value={futureForm.conferenceName}
                  onChange={(e) => setFutureForm(prev => ({...prev, conferenceName: e.target.value}))}
                  className="w-full rounded-md border border-white/30 bg-black px-3 py-2 text-white outline-none transition focus:border-purple-400"
                  placeholder="e.g. CVPR 2028"
                />
              </label>
              
              <label className="block space-y-1">
                <span className="text-sm font-medium text-gray-200">Submission Deadline</span>
                <input
                  required
                  type="date"
                  value={futureForm.submissionDeadline}
                  onChange={(e) => setFutureForm(prev => ({...prev, submissionDeadline: e.target.value}))}
                  className="w-full rounded-md border border-white/30 bg-black px-3 py-2 text-white outline-none transition focus:border-purple-400"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-sm font-medium text-gray-200">Notes / Remarks</span>
                <textarea
                  value={futureForm.notes}
                  onChange={(e) => setFutureForm(prev => ({...prev, notes: e.target.value}))}
                  className="w-full rounded-md border border-white/30 bg-black px-3 py-2 text-white outline-none transition focus:border-purple-400"
                  placeholder="Additional details about the tracks, requirements, etc."
                  rows={3}
                />
              </label>

              <button
                type="submit"
                className="w-full sm:w-auto rounded-md bg-purple-700 hover:bg-purple-600 px-6 py-2 text-sm font-semibold text-white transition"
              >
                Save Timeline
              </button>
            </form>
          </div>

          <div className="mt-8 rounded-2xl border border-white/20 bg-black shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-white/5 border-b border-white/10">
              <h3 className="font-semibold text-lg text-purple-100">Upcoming Submissions</h3>
            </div>
            {futureConfs.length === 0 ? (
              <div className="p-6 text-center text-gray-400">No upcoming conferences planned.</div>
            ) : (
              <div className="divide-y divide-white/10">
                {futureConfs.map(conf => (
                  <div key={conf.id} className="p-6 flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
                    <div>
                      <h4 className="font-bold text-lg text-white">{conf.conferenceName}</h4>
                      <p className="text-sm text-purple-300">Deadline: {conf.submissionDeadline}</p>
                      {conf.notes && <p className="text-sm text-gray-400 mt-2">{conf.notes}</p>}
                    </div>
                    <button
                      onClick={() => removeFutureEntry(conf.id)}
                      className="text-red-400 hover:text-red-300 text-sm font-medium transition cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-black px-4 py-8 text-white sm:px-8 font-sans">
      <ToastContainer />
      {showNotifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/20 bg-gray-900 p-6 shadow-xl relative">
            <button 
              onClick={() => setShowNotifyModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-semibold text-white mb-4">Notification Settings</h3>
            <p className="text-sm text-gray-300 mb-6 flex flex-col gap-2">
              <span>Set an in-app reminder for a specific conference.</span>
            </p>
            
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              <label className="block space-y-1">
                <span className="text-sm font-medium text-gray-200">Conference Name</span>
                <select
                  value={notifyForm.conferenceId}
                  onChange={(e) => setNotifyForm({...notifyForm, conferenceId: e.target.value})}
                  className="w-full rounded-md border border-white/30 bg-black px-3 py-2 text-white outline-none transition focus:border-purple-400"
                >
                  <option value="" disabled>Select a conference</option>
                  {entries.map(conf => (
                    <option key={conf.id} value={conf.id}>{conf.conferenceName}</option>
                  ))}
                  {entries.length === 0 && <option value="" disabled>No conferences available</option>}
                </select>
              </label>

              <label className="block space-y-1">
                <span className="text-sm font-medium text-gray-200">Custom Message</span>
                <textarea
                  value={notifyForm.message}
                  onChange={(e) => setNotifyForm({...notifyForm, message: e.target.value})}
                  placeholder="e.g., Prepare slides for presentation"
                  className="w-full rounded-md border border-white/30 bg-black px-3 py-2 text-white outline-none transition focus:border-purple-400"
                  rows={2}
                />
              </label>

              <label className="block space-y-1">
                <span className="text-sm font-medium text-gray-200">Notify Date</span>
                <input
                  type="date"
                  value={notifyForm.notifyDate}
                  onChange={(e) => setNotifyForm({...notifyForm, notifyDate: e.target.value})}
                  className="w-full rounded-md border border-white/30 bg-black px-3 py-2 text-white outline-none transition focus:border-purple-400"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-sm font-medium text-gray-200">Notify Time</span>
                <input
                  type="time"
                  value={notifyForm.notifyTime}
                  onChange={(e) => setNotifyForm({...notifyForm, notifyTime: e.target.value})}
                  className="w-full rounded-md border border-white/30 bg-black px-3 py-2 text-white outline-none transition focus:border-purple-400"
                />
              </label>

              <button
                onClick={saveNotificationSettings}
                className="w-full mt-4 rounded-md bg-purple-700 hover:bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl flex flex-col md:flex-row gap-8 items-start">
        
        {/* Left Sidebar Actions */}
        <div className="w-full md:w-64 shrink-0 flex flex-col gap-4">
          <div className="rounded-2xl border border-white/20 bg-black p-4 space-y-3">
            <button
              onClick={() => setShowNotifyModal(true)}
              className="w-full flex justify-between items-center rounded-md border border-purple-500/60 bg-purple-500/10 px-4 py-3 text-sm font-medium text-purple-300 transition hover:bg-purple-500/20"
            >
              <span className="flex gap-2 items-center"><Bell size={16} /> Notify</span>
            </button>
            
            <button
              onClick={generatePDF}
              className="w-full flex justify-between items-center rounded-md border border-white/20 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              <span className="flex gap-2 items-center"><Download size={16} /> Export PDF</span>
            </button>

            <button
              onClick={() => setCurrentView("add-future")}
              className="w-full flex justify-between items-center rounded-md border border-white/20 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              <span className="flex gap-2 items-center"><Plus size={16} /> Add Conference for Further</span>
            </button>
          </div>
          
          <div className="rounded-2xl border border-white/20 bg-black p-4 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-purple-300">Overall Scholar Add</h3>
            <p className="text-xs text-gray-400">Link your Google Scholar profile ID to fetch real-time citations.</p>
            
            <div className="flex flex-col gap-2">
              <input
                value={scholarInput}
                onChange={(e) => setScholarInput(e.target.value)}
                placeholder="Scholar ID (e.g. X6loXjAAAAAJ)"
                className="w-full rounded-md border border-white/30 bg-black px-3 py-2 text-white outline-none transition focus:border-purple-400"
              />
              <button
                onClick={handleFetchScholar}
                disabled={!scholarInput || isFetchingScholar}
                className="w-full flex justify-center items-center gap-2 rounded-md bg-purple-700 hover:bg-purple-600 disabled:opacity-50 px-4 py-2 text-sm font-semibold text-white transition cursor-pointer"
              >
                <Search size={14} /> {isFetchingScholar ? "Fetching..." : "Fetch"}
              </button>
            </div>

            {fetchedScholar && !scholarSubmitted && (
              <div className="mt-3 p-3 border border-white/20 rounded-md bg-gray-900 border-l-4 border-l-purple-500">
                <p className="text-sm font-semibold text-white truncate">{fetchedScholar.name}</p>
                <p className="text-xs text-gray-300 mb-2">ID Found: {fetchedScholar.id}</p>
                <button
                  onClick={handleSubmitScholar}
                  className="w-full flex justify-center items-center gap-2 rounded-md bg-purple-600 hover:bg-purple-500 px-4 py-2 text-sm font-semibold text-white transition cursor-pointer"
                >
                  <Check size={14} /> Link Account
                </button>
              </div>
            )}

            {scholarSubmitted && (
              <div className="mt-4 p-4 rounded-xl border border-purple-500/30 bg-purple-500/10 text-center flex flex-col gap-2">
                <div className="flex justify-between items-center bg-black/50 p-2 rounded-md border border-white/10">
                  <span className="text-xs text-gray-400">Name</span>
                  <span className="text-sm font-semibold truncate text-white max-w-[120px]">{scholarSubmitted.name}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-1">
                   <div className="bg-black/50 p-2 rounded-md border border-white/10">
                     <p className="text-[10px] uppercase tracking-wider text-purple-400">Citations</p>
                     <p className="text-xl font-bold text-white">{scholarSubmitted.citations}</p>
                   </div>
                   <div className="bg-black/50 p-2 rounded-md border border-white/10">
                     <p className="text-[10px] uppercase tracking-wider text-purple-400">h-index</p>
                     <p className="text-xl font-bold text-white">{scholarSubmitted.hIndex}</p>
                   </div>
                   <div className="bg-black/50 p-2 rounded-md border border-white/10 col-span-2">
                     <p className="text-[10px] uppercase tracking-wider text-purple-400">i10-index</p>
                     <p className="text-xl font-bold text-white">{scholarSubmitted.i10Index}</p>
                   </div>
                </div>
                <button 
                  onClick={() => setScholarSubmitted(null)} 
                  className="text-xs text-red-400 hover:text-red-300 mt-2 transition"
                >
                  Unlink Account
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-6 w-full max-w-full overflow-hidden">
          <header className="rounded-2xl border border-white/20 bg-black p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-300">Publication Tracker</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl truncate">Conference Dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-300">
              Add your conference papers, track acceptance and presentations, and monitor category-wise publication counts.
            </p>
          </header>

          <section className="grid gap-4 rounded-2xl border border-white/20 bg-black p-4 grid-cols-2 lg:grid-cols-5">
            <div>
              <p className="text-[10px] sm:text-xs uppercase tracking-wider text-gray-400 truncate">Total Papers</p>
              <p className="mt-1 text-2xl sm:text-3xl font-semibold text-white">{counts.total}</p>
            </div>
            <div>
              <p className="text-[10px] sm:text-xs uppercase tracking-wider text-gray-400 truncate">IEEE</p>
              <p className="mt-1 text-xl sm:text-2xl font-semibold text-purple-300">{counts.ieee}</p>
            </div>
            <div>
              <p className="text-[10px] sm:text-xs uppercase tracking-wider text-gray-400 truncate">Springers</p>
              <p className="mt-1 text-xl sm:text-2xl font-semibold text-violet-300">{counts.springers}</p>
            </div>
            <div>
              <p className="text-[10px] sm:text-xs uppercase tracking-wider text-gray-400 truncate">CRC</p>
              <p className="mt-1 text-xl sm:text-2xl font-semibold text-fuchsia-300">{counts.crc}</p>
            </div>
            <div>
              <p className="text-[10px] sm:text-xs uppercase tracking-wider text-gray-400 truncate">Other</p>
              <p className="mt-1 text-xl sm:text-2xl font-semibold text-gray-200">{counts.other}</p>
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
                  className="w-full rounded-md border border-white/30 bg-black px-3 py-2 text-white outline-none transition focus:border-purple-400"
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
                  className="w-full rounded-md border border-white/30 bg-black px-3 py-2 text-white outline-none transition focus:border-purple-400"
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium text-gray-200">Status</span>
                <select
                  value={form.status}
                  onChange={(event) => setForm((previous) => ({ ...previous, status: event.target.value }))}
                  className="w-full rounded-md border border-white/30 bg-black px-3 py-2 text-white outline-none transition focus:border-purple-400"
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
                      className="h-4 w-4 rounded border-white/30 bg-black text-purple-400 accent-purple-600"
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
                      className="w-full rounded-md border border-white/30 bg-black px-3 py-2 text-white outline-none transition focus:border-purple-400"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-sm font-medium text-gray-200">Presentation Time</span>
                    <input
                      type="time"
                      value={form.presentationTime || ""}
                      onChange={(event) => setForm((previous) => ({ ...previous, presentationTime: event.target.value }))}
                      className="w-full rounded-md border border-white/30 bg-black px-3 py-2 text-white outline-none transition focus:border-purple-400"
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
                  className="w-full rounded-md border border-white/30 bg-black px-3 py-2 text-white outline-none transition focus:border-purple-400"
                  placeholder="e.g. 1"
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium text-gray-200">Publication Date</span>
                <input
                  type="date"
                  value={form.publicationDate}
                  onChange={(event) => setForm((previous) => ({ ...previous, publicationDate: event.target.value }))}
                  className="w-full rounded-md border border-white/30 bg-black px-3 py-2 text-white outline-none transition focus:border-purple-400"
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
                  className="w-full rounded-md border border-white/30 bg-black px-3 py-2 text-white outline-none transition focus:border-purple-400"
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium text-gray-200">Conference Category</span>
                <select
                  value={form.conferenceCategory}
                  onChange={(event) => setForm((previous) => ({ ...previous, conferenceCategory: event.target.value }))}
                  className="w-full rounded-md border border-white/30 bg-black px-3 py-2 text-white outline-none transition focus:border-purple-400"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex items-end gap-2 xl:col-span-2">
                <button
                  type="submit"
                  className="w-full rounded-md bg-purple-700 hover:bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition cursor-pointer"
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
                    className="w-full rounded-md border border-white/60 bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20 cursor-pointer"
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
                  <th className="px-4 py-3 font-semibold">S.No</th>
                  <th className="px-4 py-3 font-semibold">Conference Name</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Papers</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Pub Date</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {sortedEntries.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-gray-400">
                      No records yet. Add your first conference entry.
                    </td>
                  </tr>
                ) : (
                  sortedEntries.map((entry, index) => (
                    <tr 
                      key={entry.id} 
                      className={`border-t border-white/20 text-gray-200 ${entry.status === 'Accepted' ? 'bg-amber-900/40 border-l-4 border-l-amber-500' : ''}`}
                    >
                      <td className="px-4 py-3 font-medium text-white">{index + 1}</td>
                      <td className="px-4 py-3 min-w-[150px]">{entry.conferenceName}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{entry.conferenceDate || "-"}</td>
                      <td className="px-4 py-3">{entry.papersSubmitted || "-"}</td>
                      <td className="px-4 py-3 min-w-[120px]">
                        <div className="flex flex-col gap-1 items-start">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClassName(entry.status, entry.publicationDate)}`}>
                              {entry.publicationDate ? "Published" : entry.status}
                            </span>
                            {entry.status === "Accepted" && (
                              <div 
                                className={`h-2.5 w-2.5 rounded-full ring-1 ring-white/50 shrink-0 ${entry.isRegistered ? 'bg-green-500' : 'bg-red-500'}`} 
                                title={entry.isRegistered ? "Registered" : "Not Registered"} 
                              />
                            )}
                          </div>
                          {entry.status === "Accepted" && entry.isRegistered && (entry.presentationDate || entry.presentationTime) && (
                            <div className="text-[10px] text-gray-400 pl-1 whitespace-nowrap overflow-hidden text-ellipsis w-full">
                              {entry.presentationDate && <span>{entry.presentationDate}</span>}
                              {entry.presentationDate && entry.presentationTime && <span> at </span>}
                              {entry.presentationTime && <span>{entry.presentationTime}</span>}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{entry.publicationDate || "-"}</td>
                      <td className="px-4 py-3">{entry.conferenceCategory}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => editEntry(entry)}
                          className="rounded-md border border-purple-500/60 px-3 py-1.5 text-xs font-medium text-purple-200 transition hover:bg-purple-500/20 cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => removeEntry(entry.id)}
                            className="rounded-md border border-red-500/60 px-3 py-1.5 text-xs font-medium text-red-200 transition hover:bg-red-500/20 cursor-pointer"
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
      </div>
    </main>
  );
}
