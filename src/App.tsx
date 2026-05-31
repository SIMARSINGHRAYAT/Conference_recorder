import { FormEvent, useMemo, useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Bell,
  Download,
  X,
  Search,
  Check,
  Plus,
  ArrowLeft,
  Link2,
} from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type ConferenceEntry = {
  id: number;
  conferenceName: string;
  conferenceDate: string;
  status: string;
  isRegistered?: boolean;
  isRegisteteal?: boolean;
  presentationDate?: string;
  presentationTime?: string;
  publicationDate: string;
  expectedPublicationMonth: string;
  conferenceCategory: string;
  papersSubmitted: number | "";
  notified?: boolean;
};

type ConferenceForm = Omit<ConferenceEntry, "id">;

type ConferenceLink = {
  id: number;
  entryId?: number;
  label: string;
  url: string;
  kind: "conference" | "article";
};

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

const statuses = ["Accepted", "Presented", "Published"];
const defaultCategories = ["IEEE", "Springers", "CRC"];

type View = "welcome" | "dashboard" | "add-future";

const normalizeConferenceEntry = (entry: any): ConferenceEntry => ({
  ...entry,
  status: entry.status || "Accepted",
  isRegistered: Boolean(entry.isRegistered ?? entry.isRegisteteal ?? false),
});

const normalizeConferenceLink = (link: any): ConferenceLink => ({
  id: link.id,
  entryId: link.entryId,
  label: link.label || "Untitled link",
  url: link.url || "",
  kind: link.kind === "conference" ? "conference" : "article",
});

export default function App() {
  const [currentView, setCurrentView] = useState<View>("welcome");

  const [form, setForm] = useState<ConferenceForm>(emptyForm);
  const [entries, setEntries] = useState<ConferenceEntry[]>(() => {
    const saved = localStorage.getItem("conference_entries_SIMAR");
    return saved ? JSON.parse(saved).map(normalizeConferenceEntry) : [];
  });
  const [editingId, setEditingId] = useState<number | null>(null);

  const [futureConfs, setFutureConfs] = useState<FutureConference[]>(() => {
    const saved = localStorage.getItem("future_conferences_SIMAR");
    return saved ? JSON.parse(saved) : [];
  });
  const [futureForm, setFutureForm] = useState({
    conferenceName: "",
    submissionDeadline: "",
    notes: "",
  });

  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [inAppNotifications, setInAppNotifications] = useState<any[]>(() => {
    const saved = localStorage.getItem("app_notifications_SIMAR");
    return saved ? JSON.parse(saved) : [];
  });

  const [notifyForm, setNotifyForm] = useState({
    conferenceId: "",
    message: "",
    notifyDate: "",
    notifyTime: "",
  });

  const [collectionLinks, setCollectionLinks] = useState<ConferenceLink[]>(() => {
    const saved = localStorage.getItem("collection_links_SIMAR");
    return saved ? JSON.parse(saved).map(normalizeConferenceLink) : [];
  });
  const [categoryOptions, setCategoryOptions] = useState<string[]>(() => {
    const saved = localStorage.getItem("conference_categories_SIMAR");
    return saved ? JSON.parse(saved) : defaultCategories;
  });
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryInput, setCategoryInput] = useState("");
  const [activeLinkEntry, setActiveLinkEntry] = useState<ConferenceEntry | null>(null);
  const [linkConferenceUrl, setLinkConferenceUrl] = useState("");
  const [linkArticleUrls, setLinkArticleUrls] = useState<string[]>([]);

  const [currentUser, setCurrentUser] = useState<string>("SIMAR");
  const [usernameInput, setUsernameInput] = useState<string>("SIMAR");
  const [assignUsernameInput, setAssignUsernameInput] = useState<string>("");
  const [isDataLoaded, setIsDataLoaded] = useState(true);

  useEffect(() => {
    // Initialize SIMAR data on first load if it doesn't exist
    if (!localStorage.getItem("conference_entries_SIMAR")) {
      const initialData = [
        {
          id: 1,
          conferenceName: "ICCS-2025",
          conferenceDate: "2025-09-25",
          status: "Presented",
          publicationDate: "",
          expectedPublicationMonth: "",
          conferenceCategory: "CRC",
          papersSubmitted: 2,
        },
        {
          id: 2,
          conferenceName: "ICDPN-2025",
          conferenceDate: "2025-10-31",
          status: "Presented",
          publicationDate: "",
          expectedPublicationMonth: "",
          conferenceCategory: "Springers",
          papersSubmitted: 1,
        },
        {
          id: 3,
          conferenceName: "SMART-2025",
          conferenceDate: "2025-11-14",
          status: "Published",
          publicationDate: "2026-02-23",
          expectedPublicationMonth: "2026-02",
          conferenceCategory: "IEEE",
          papersSubmitted: 2,
        },
        {
          id: 4,
          conferenceName: "ICCCA-2025",
          conferenceDate: "2025-11-28",
          status: "Published",
          publicationDate: "2026-01-19",
          expectedPublicationMonth: "2026-01",
          conferenceCategory: "IEEE",
          papersSubmitted: 2,
        },
        {
          id: 5,
          conferenceName: "ICTCON-2025",
          conferenceDate: "2025-12-02",
          status: "Presented",
          publicationDate: "",
          expectedPublicationMonth: "",
          conferenceCategory: "Springers",
          papersSubmitted: 2,
        },
        {
          id: 6,
          conferenceName: "ICSCAI-2025",
          conferenceDate: "2025-12-12",
          status: "Presented",
          publicationDate: "",
          expectedPublicationMonth: "",
          conferenceCategory: "Springers",
          papersSubmitted: 1,
        },
        {
          id: 7,
          conferenceName: "MVAI-2026",
          conferenceDate: "2025-12-20",
          status: "Presented",
          publicationDate: "",
          expectedPublicationMonth: "",
          conferenceCategory: "Springers",
          papersSubmitted: 2,
        },
        {
          id: 8,
          conferenceName: "ICADS-2026",
          conferenceDate: "2026-02-12",
          status: "Presented",
          publicationDate: "",
          expectedPublicationMonth: "",
          conferenceCategory: "IEEE",
          papersSubmitted: 2,
        },
        {
          id: 9,
          conferenceName: "ICSSCC-2026",
          conferenceDate: "2026-03-13",
          status: "Presented",
          publicationDate: "",
          expectedPublicationMonth: "",
          conferenceCategory: "Springers",
          papersSubmitted: 1,
        },
        {
          id: 10,
          conferenceName: "COMSIA-2026",
          conferenceDate: "2026-03-20",
          status: "Presented",
          publicationDate: "",
          expectedPublicationMonth: "",
          conferenceCategory: "Springers",
          papersSubmitted: 1,
        },
        {
          id: 11,
          conferenceName: "WCCST-2026",
          conferenceDate: "2026-03-26",
          status: "Published",
          publicationDate: "2026-05-06",
          expectedPublicationMonth: "2026-05",
          conferenceCategory: "IEEE",
          papersSubmitted: 1,
        },
        {
          id: 12,
          conferenceName: "AITECMI-2026",
          conferenceDate: "2026-04-09",
          status: "Presented",
          publicationDate: "",
          expectedPublicationMonth: "",
          conferenceCategory: "IEEE",
          papersSubmitted: 4,
        },
        {
          id: 13,
          conferenceName: "ICISESSC-2026",
          conferenceDate: "2026-04-18",
          status: "Presented",
          publicationDate: "",
          expectedPublicationMonth: "",
          conferenceCategory: "IEEE",
          papersSubmitted: 1,
        },
        {
          id: 14,
          conferenceName: "DICCT-2026",
          conferenceDate: "2026-04-24",
          status: "Presented",
          publicationDate: "",
          expectedPublicationMonth: "",
          conferenceCategory: "IEEE",
          papersSubmitted: 1,
        },
        {
          id: 15,
          conferenceName: "AICCONS-2026",
          conferenceDate: "2026-04-28",
          status: "Presented",
          publicationDate: "",
          expectedPublicationMonth: "",
          conferenceCategory: "Springers",
          papersSubmitted: 1,
        },
        {
          id: 16,
          conferenceName: "ICPCSN-2026",
          conferenceDate: "2026-05-06",
          status: "Presented",
          publicationDate: "",
          expectedPublicationMonth: "",
          conferenceCategory: "IEEE",
          papersSubmitted: 2,
        },
        {
          id: 17,
          conferenceName: "ICDCA-2026",
          conferenceDate: "2026-06-05",
          status: "Accepted",
          publicationDate: "",
          expectedPublicationMonth: "",
          conferenceCategory: "IEEE",
          papersSubmitted: 1,
        },
        {
          id: 18,
          conferenceName: "WAMS-2026",
          conferenceDate: "2026-06-10",
          status: "Accepted",
          publicationDate: "",
          expectedPublicationMonth: "",
          conferenceCategory: "IEEE",
          papersSubmitted: 2,
        },
        {
          id: 19,
          conferenceName: "ICDAM",
          conferenceDate: "2026-06-12",
          status: "Accepted",
          publicationDate: "",
          expectedPublicationMonth: "",
          conferenceCategory: "Springers",
          papersSubmitted: 3,
        },
        {
          id: 20,
          conferenceName: "ICIVC-2026",
          conferenceDate: "2026-06-12",
          status: "Accepted",
          publicationDate: "",
          expectedPublicationMonth: "",
          conferenceCategory: "Springers",
          papersSubmitted: 1,
        },
        {
          id: 21,
          conferenceName: "NETCRYPT-2026",
          conferenceDate: "2026-08-08",
          status: "Accepted",
          publicationDate: "",
          expectedPublicationMonth: "",
          conferenceCategory: "IEEE",
          papersSubmitted: 3,
        },
        {
          id: 22,
          conferenceName: "ICDPN-2026",
          conferenceDate: "2026-09-25",
          status: "Accepted",
          publicationDate: "",
          expectedPublicationMonth: "",
          conferenceCategory: "Springers",
          papersSubmitted: 1,
        },
      ];
      localStorage.setItem("conference_entries_SIMAR", JSON.stringify(initialData));
      localStorage.setItem("future_conferences_SIMAR", JSON.stringify([]));
      localStorage.setItem("app_notifications_SIMAR", JSON.stringify([]));
      localStorage.setItem("collection_links_SIMAR", JSON.stringify([]));
    }
    handleStart();
  }, []);

  useEffect(() => {
    const merged = Array.from(
      new Set([...defaultCategories, ...categoryOptions, ...entries.map((entry) => entry.conferenceCategory)]),
    ).filter(Boolean);
    const normalized = merged.length > 0 ? merged : defaultCategories;
    const current = Array.from(new Set(categoryOptions));

    if (
      normalized.length !== current.length ||
      normalized.some((category, index) => category !== current[index])
    ) {
      setCategoryOptions(normalized);
    }
  }, [entries]);

  useEffect(() => {
    localStorage.setItem("conference_categories_SIMAR", JSON.stringify(categoryOptions));
  }, [categoryOptions]);

  const getUserKey = (base: string) =>
    currentUser ? `${base}_${currentUser}` : base;

  const handleAssignUsername = () => {
    const active = assignUsernameInput.trim();
    if (!active) return;
    setCurrentUser(active);
    toast.success(`Data assigned to profile: ${active}`);
  };

  const handleStart = () => {
    const active = usernameInput.trim() || "SIMAR";
    setCurrentUser(active);
    const suffix = `_${active}`;

    const e = localStorage.getItem(`conference_entries${suffix}`);
    setEntries(e ? JSON.parse(e).map(normalizeConferenceEntry) : []);

    const f = localStorage.getItem(`future_conferences${suffix}`);
    setFutureConfs(f ? JSON.parse(f) : []);

    const n = localStorage.getItem(`app_notifications${suffix}`);
    setInAppNotifications(n ? JSON.parse(n) : []);

    const c = localStorage.getItem(`collection_links${suffix}`);
    setCollectionLinks(c ? JSON.parse(c).map(normalizeConferenceLink) : []);

    setIsDataLoaded(true);
    setCurrentView("dashboard");
  };

  const handleLoadSampleData = () => {
    if (localStorage.getItem("conference_entries_SIMAR")) {
      toast.info("Existing data is already stored. Sample data was not loaded.");
      return;
    }

    const sampleData = [
      {
        id: 1,
        conferenceName: "ICCS-2025",
        conferenceDate: "2025-09-25",
        status: "Presented",
        publicationDate: "",
        expectedPublicationMonth: "",
        conferenceCategory: "CRC",
        papersSubmitted: 2,
      },
      {
        id: 2,
        conferenceName: "ICDPN-2025",
        conferenceDate: "2025-10-31",
        status: "Presented",
        publicationDate: "",
        expectedPublicationMonth: "",
        conferenceCategory: "Springers",
        papersSubmitted: 1,
      },
      {
        id: 3,
        conferenceName: "SMART-2025",
        conferenceDate: "2025-11-14",
        status: "Published",
        publicationDate: "2026-02-23",
        expectedPublicationMonth: "2026-02",
        conferenceCategory: "IEEE",
        papersSubmitted: 2,
      },
      {
        id: 4,
        conferenceName: "ICCCA-2025",
        conferenceDate: "2025-11-28",
        status: "Published",
        publicationDate: "2026-01-19",
        expectedPublicationMonth: "2026-01",
        conferenceCategory: "IEEE",
        papersSubmitted: 2,
      },
      {
        id: 5,
        conferenceName: "ICTCON-2025",
        conferenceDate: "2025-12-02",
        status: "Presented",
        publicationDate: "",
        expectedPublicationMonth: "",
        conferenceCategory: "Springers",
        papersSubmitted: 2,
      },
      {
        id: 6,
        conferenceName: "ICSCAI-2025",
        conferenceDate: "2025-12-12",
        status: "Presented",
        publicationDate: "",
        expectedPublicationMonth: "",
        conferenceCategory: "Springers",
        papersSubmitted: 1,
      },
      {
        id: 7,
        conferenceName: "MVAI-2026",
        conferenceDate: "2025-12-20",
        status: "Presented",
        publicationDate: "",
        expectedPublicationMonth: "",
        conferenceCategory: "Springers",
        papersSubmitted: 2,
      },
      {
        id: 8,
        conferenceName: "ICADS-2026",
        conferenceDate: "2026-02-12",
        status: "Presented",
        publicationDate: "",
        expectedPublicationMonth: "",
        conferenceCategory: "IEEE",
        papersSubmitted: 2,
      },
      {
        id: 9,
        conferenceName: "ICSSCC-2026",
        conferenceDate: "2026-03-13",
        status: "Presented",
        publicationDate: "",
        expectedPublicationMonth: "",
        conferenceCategory: "Springers",
        papersSubmitted: 1,
      },
      {
        id: 10,
        conferenceName: "COMSIA-2026",
        conferenceDate: "2026-03-20",
        status: "Presented",
        publicationDate: "",
        expectedPublicationMonth: "",
        conferenceCategory: "Springers",
        papersSubmitted: 1,
      },
      {
        id: 11,
        conferenceName: "WCCST-2026",
        conferenceDate: "2026-03-26",
        status: "Published",
        publicationDate: "2026-05-06",
        expectedPublicationMonth: "2026-05",
        conferenceCategory: "IEEE",
        papersSubmitted: 1,
      },
      {
        id: 12,
        conferenceName: "AITECMI-2026",
        conferenceDate: "2026-04-09",
        status: "Presented",
        publicationDate: "",
        expectedPublicationMonth: "",
        conferenceCategory: "IEEE",
        papersSubmitted: 4,
      },
      {
        id: 13,
        conferenceName: "ICISESSC-2026",
        conferenceDate: "2026-04-18",
        status: "Presented",
        publicationDate: "",
        expectedPublicationMonth: "",
        conferenceCategory: "IEEE",
        papersSubmitted: 1,
      },
      {
        id: 14,
        conferenceName: "DICCT-2026",
        conferenceDate: "2026-04-24",
        status: "Presented",
        publicationDate: "",
        expectedPublicationMonth: "",
        conferenceCategory: "IEEE",
        papersSubmitted: 1,
      },
      {
        id: 15,
        conferenceName: "AICCONS-2026",
        conferenceDate: "2026-04-28",
        status: "Presented",
        publicationDate: "",
        expectedPublicationMonth: "",
        conferenceCategory: "Springers",
        papersSubmitted: 1,
      },
      {
        id: 16,
        conferenceName: "ICPCSN-2026",
        conferenceDate: "2026-05-06",
        status: "Presented",
        publicationDate: "",
        expectedPublicationMonth: "",
        conferenceCategory: "IEEE",
        papersSubmitted: 2,
      },
      {
        id: 17,
        conferenceName: "ICDCA-2026",
        conferenceDate: "2026-06-05",
        status: "Accepted",
        publicationDate: "",
        expectedPublicationMonth: "",
        conferenceCategory: "IEEE",
        papersSubmitted: 1,
      },
      {
        id: 18,
        conferenceName: "WAMS-2026",
        conferenceDate: "2026-06-10",
        status: "Accepted",
        publicationDate: "",
        expectedPublicationMonth: "",
        conferenceCategory: "IEEE",
        papersSubmitted: 2,
      },
      {
        id: 19,
        conferenceName: "ICDAM",
        conferenceDate: "2026-06-12",
        status: "Accepted",
        publicationDate: "",
        expectedPublicationMonth: "",
        conferenceCategory: "Springers",
        papersSubmitted: 3,
      },
      {
        id: 20,
        conferenceName: "ICIVC-2026",
        conferenceDate: "2026-06-12",
        status: "Accepted",
        publicationDate: "",
        expectedPublicationMonth: "",
        conferenceCategory: "Springers",
        papersSubmitted: 1,
      },
      {
        id: 21,
        conferenceName: "NETCRYPT-2026",
        conferenceDate: "2026-08-08",
        status: "Accepted",
        publicationDate: "",
        expectedPublicationMonth: "",
        conferenceCategory: "IEEE",
        papersSubmitted: 3,
      },
      {
        id: 22,
        conferenceName: "ICDPN-2026",
        conferenceDate: "2026-09-25",
        status: "Accepted",
        publicationDate: "",
        expectedPublicationMonth: "",
        conferenceCategory: "Springers",
        papersSubmitted: 1,
      },
    ];

    localStorage.setItem("conference_entries_SIMAR", JSON.stringify(sampleData));
    localStorage.setItem("future_conferences_SIMAR", JSON.stringify([]));
    localStorage.setItem("app_notifications_SIMAR", JSON.stringify([]));
    localStorage.setItem("collection_links_SIMAR", JSON.stringify([]));

    setUsernameInput("SIMAR");
    toast.success("Sample data loaded for SIMAR! Click 'Get Started' to view.");
  };

  useEffect(() => {
    if (!isDataLoaded) return;
    localStorage.setItem(
      getUserKey("conference_entries"),
      JSON.stringify(entries),
    );
  }, [entries, currentUser, isDataLoaded]);

  useEffect(() => {
    if (!isDataLoaded) return;
    localStorage.setItem(
      getUserKey("future_conferences"),
      JSON.stringify(futureConfs),
    );
  }, [futureConfs, currentUser, isDataLoaded]);

  useEffect(() => {
    if (!isDataLoaded) return;
    localStorage.setItem(
      getUserKey("app_notifications"),
      JSON.stringify(inAppNotifications),
    );
  }, [inAppNotifications, currentUser, isDataLoaded]);

  useEffect(() => {
    if (!isDataLoaded) return;
    localStorage.setItem(
      getUserKey("collection_links"),
      JSON.stringify(collectionLinks),
    );
  }, [collectionLinks, currentUser, isDataLoaded]);

  useEffect(() => {
    // In-app notification checker every minute
    const checkReminders = setInterval(() => {
      const now = new Date();
      let updated = false;

      const updatedNotifs = inAppNotifications.map((notif) => {
        if (notif.isNotified) return notif;

        const notifyDateTime = new Date(
          `${notif.notifyDate}T${notif.notifyTime}`,
        );
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

          if (
            "Notification" in window &&
            window.Notification.permission === "granted"
          ) {
            new window.Notification("Conference Tracker Reminder", {
              body: notif.message,
            });
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
    if (
      !notifyForm.conferenceId ||
      !notifyForm.notifyDate ||
      !notifyForm.notifyTime
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    // Request browser notification permission
    if (
      "Notification" in window &&
      window.Notification.permission !== "denied" &&
      window.Notification.permission !== "granted"
    ) {
      window.Notification.requestPermission();
    }

    const conf = entries.find(
      (e) => e.id.toString() === notifyForm.conferenceId,
    );

    setInAppNotifications((prev) => [
      ...prev,
      {
        id: Date.now(),
        conferenceName: conf ? conf.conferenceName : "Unknown",
        message: notifyForm.message,
        notifyDate: notifyForm.notifyDate,
        notifyTime: notifyForm.notifyTime,
        isNotified: false,
      },
    ]);

    setNotifyForm({
      conferenceId: "",
      message: "",
      notifyDate: "",
      notifyTime: "",
    });
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
      return (
        new Date(a.conferenceDate).getTime() -
        new Date(b.conferenceDate).getTime()
      );
    });
  }, [entries]);

  const submitEntry = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (editingId !== null) {
      setEntries((previous) =>
        previous.map((entry) =>
          entry.id === editingId ? { ...form, id: editingId } : entry,
        ),
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
    setForm({
      ...formData,
      isRegistered: Boolean(entry.isRegistered ?? entry.isRegisteteal ?? false),
    });
  };

  const removeEntry = (id: number) => {
    setEntries((previous) => previous.filter((entry) => entry.id !== id));
  };

  const counts = useMemo(() => {
    const sumPapers = (condition: (entry: ConferenceEntry) => boolean) =>
      entries
        .filter(condition)
        .reduce((sum, entry) => sum + (Number(entry.papersSubmitted) || 0), 0);

    const categoryTotals = categoryOptions.reduce(
      (accumulator, category) => {
        accumulator[category] = sumPapers(
          (entry) => entry.conferenceCategory === category,
        );
        return accumulator;
      },
      {} as Record<string, number>,
    );

    return {
      total: sumPapers(() => true),
      categories: categoryTotals,
      other: sumPapers(
        (entry) => !categoryOptions.includes(entry.conferenceCategory),
      ),
    };
  }, [entries, categoryOptions]);

  const formatMonth = (value: string) => {
    if (!value) return "-";
    const [year, month] = value.split("-");
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    });
  };

  const statusClassName = (
    status: string,
    publicationDate: string,
    isRegistered: boolean,
  ) => {
    if (status === "Published" || publicationDate)
      return "bg-sky-100 text-sky-800 ring-1 ring-sky-200";
    if (status === "Presented")
      return "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200";
    if (status === "Accepted" && isRegistered)
      return "bg-amber-100 text-amber-800 ring-1 ring-amber-200";
    if (status === "Accepted")
      return "bg-rose-100 text-rose-800 ring-1 ring-rose-200";
    return "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Conference Publication Dashboard", 14, 22);

    const tableColumn = [
      "S.No",
      "Conference",
      "Conf Date",
      "Papers",
      "Status",
      "Pub Date",
      "Expected Mon",
      "Category",
    ];
    const tableRows = sortedEntries.map((entry, index) => [
      index + 1,
      entry.conferenceName,
      entry.conferenceDate || "-",
      entry.papersSubmitted || "-",
      entry.publicationDate ? "Published" : entry.status,
      entry.publicationDate || "-",
      formatMonth(entry.expectedPublicationMonth),
      entry.conferenceCategory,
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 30,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [0, 188, 212] },
    });

    doc.save("conference-data.pdf");
  };

  const openLinkEditor = (entry: ConferenceEntry) => {
    const conferenceLink = collectionLinks.find(
      (link) => link.entryId === entry.id && link.kind === "conference",
    );
    const articleLinks = collectionLinks.filter(
      (link) => link.entryId === entry.id && link.kind === "article",
    );
    const paperCount = Math.max(1, Number(entry.papersSubmitted) || 1);
    const articleUrls = Array.from({ length: paperCount }, (_, index) => articleLinks[index]?.url || "");

    setActiveLinkEntry(entry);
    setLinkConferenceUrl(conferenceLink?.url || "");
    setLinkArticleUrls(articleUrls);
  };

  const saveLinkEditor = () => {
    if (!activeLinkEntry) return;

    const nextLinks = collectionLinks.filter(
      (link) => link.entryId !== activeLinkEntry.id,
    );

    if (linkConferenceUrl.trim()) {
      nextLinks.push({
        id: Date.now(),
        entryId: activeLinkEntry.id,
        label: `${activeLinkEntry.conferenceName} conference link`,
        url: linkConferenceUrl.trim(),
        kind: "conference",
      });
    }

    linkArticleUrls
      .map((url) => url.trim())
      .filter(Boolean)
      .forEach((url, index) => {
        nextLinks.push({
          id: Date.now() + index + 1,
          entryId: activeLinkEntry.id,
          label: `${activeLinkEntry.conferenceName} article link ${index + 1}`,
          url,
          kind: "article",
        });
      });

    setCollectionLinks(nextLinks);
    setActiveLinkEntry(null);
    setLinkConferenceUrl("");
    setLinkArticleUrls([]);
    toast.success("Links saved for this conference.");
  };

  const openCategoryEditor = () => {
    setCategoryInput("");
    setShowCategoryModal(true);
  };

  const saveCategoryType = () => {
    const trimmed = categoryInput.trim();
    if (!trimmed) return;

    setCategoryOptions((previous) =>
      previous.includes(trimmed) ? previous : [...previous, trimmed],
    );
    setCategoryInput("");
    setShowCategoryModal(false);
    toast.success(`${trimmed} added as a conference type.`);
  };

  if (currentView === "welcome") {
    return (
      <main className="conference-light animate-bg flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-950 via-teal-900 to-teal-900 px-4 font-sans relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <div className="relative z-10 text-center space-y-6 bg-black/40 p-12 rounded-3xl backdrop-blur-md border border-teal-500/20 shadow-2xl">
          <h1 className="text-5xl sm:text-7xl font-extrabold text-white tracking-wider">
            Welcome to{" "}
            <span className="text-teal-400 bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-teal-300">
              Tracker
            </span>
          </h1>
          <p className="text-gray-300 text-lg sm:text-xl max-w-lg mx-auto leading-relaxed font-light">
            Record your publications, manage presentations, and monitor your
            scholar citations seamlessly through our professional dashboard.
          </p>

          <div className="mt-8 mx-auto max-w-sm space-y-4">
            <input
              type="text"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              placeholder="Enter Username"
              className="w-full rounded-md border border-white/30 bg-black/50 px-4 py-3 text-center text-white outline-none transition focus:border-teal-400 text-lg placeholder:text-gray-500"
            />
            <button
              onClick={handleStart}
              className="w-full rounded-full bg-teal-600 px-10 py-4 text-lg font-bold text-white shadow-[0_0_20px_rgba(20,184,166,0.4)] transition-all hover:scale-105 hover:bg-teal-500 cursor-pointer border border-teal-400 text-center uppercase tracking-widest"
            >
              Get Started
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (currentView === "add-future") {
    return (
      <main className="conference-light animate-bg min-h-screen bg-gradient-to-br from-teal-950 to-teal-900 px-4 py-8 text-white sm:px-8 font-sans">
        <ToastContainer />
        <div className="mx-auto max-w-4xl space-y-6">
          <header className="flex items-center gap-4">
            <button
              onClick={() => setCurrentView("dashboard")}
              className="flex items-center gap-2 text-teal-400 hover:text-teal-300 transition"
            >
              <ArrowLeft size={20} />
              Back to Dashboard
            </button>
          </header>

          <div className="rounded-2xl border border-white/20 bg-gray-900/60 backdrop-blur-md shadow-xl p-6 sm:p-8">
            <h2 className="text-2xl font-bold mb-6 text-teal-100">
              Add Conference for Further Submission
            </h2>
            <form onSubmit={submitFutureEntry} className="space-y-4">
              <label className="block space-y-1">
                <span className="text-sm font-medium text-gray-200">
                  Conference Name
                </span>
                <input
                  required
                  value={futureForm.conferenceName}
                  onChange={(e) =>
                    setFutureForm((prev) => ({
                      ...prev,
                      conferenceName: e.target.value,
                    }))
                  }
                  className="w-full rounded-md border border-white/30 bg-black px-3 py-2 text-white outline-none transition focus:border-teal-400"
                  placeholder="e.g. CVPR 2028"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-sm font-medium text-gray-200">
                  Submission Deadline
                </span>
                <input
                  required
                  type="date"
                  value={futureForm.submissionDeadline}
                  onChange={(e) =>
                    setFutureForm((prev) => ({
                      ...prev,
                      submissionDeadline: e.target.value,
                    }))
                  }
                  className="w-full rounded-md border border-white/30 bg-black px-3 py-2 text-white outline-none transition focus:border-teal-400"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-sm font-medium text-gray-200">
                  Notes / Remarks
                </span>
                <textarea
                  value={futureForm.notes}
                  onChange={(e) =>
                    setFutureForm((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  className="w-full rounded-md border border-white/30 bg-black px-3 py-2 text-white outline-none transition focus:border-teal-400"
                  placeholder="Additional details about the tracks, requirements, etc."
                  rows={3}
                />
              </label>

              <button
                type="submit"
                className="w-full sm:w-auto rounded-md bg-teal-700 hover:bg-teal-600 px-6 py-2 text-sm font-semibold text-white transition"
              >
                Save Timeline
              </button>
            </form>
          </div>

          <div className="mt-8 rounded-2xl border border-white/20 bg-black/40 shadow-sm overflow-hidden backdrop-blur-sm">
            <div className="px-6 py-4 bg-white/5 border-b border-white/10">
              <h3 className="font-semibold text-lg text-teal-100">
                Upcoming Submissions
              </h3>
            </div>
            {futureConfs.length === 0 ? (
              <div className="p-6 text-center text-gray-400">
                No upcoming conferences planned.
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {futureConfs.map((conf) => (
                  <div
                    key={conf.id}
                    className="p-6 flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center"
                  >
                    <div>
                      <h4 className="font-bold text-lg text-white">
                        {conf.conferenceName}
                      </h4>
                      <p className="text-sm text-teal-300">
                        Deadline: {conf.submissionDeadline}
                      </p>
                      {conf.notes && (
                        <p className="text-sm text-gray-400 mt-2">
                          {conf.notes}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => removeFutureEntry(conf.id)}
                      className="text-teal-400 hover:text-teal-300 text-sm font-medium transition cursor-pointer"
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
    <main className="conference-light animate-bg relative min-h-screen bg-gradient-to-br from-teal-950 to-teal-900 px-4 py-8 text-white sm:px-8 font-sans">
      <ToastContainer />
      {showNotifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/20 bg-gray-900/60 backdrop-blur-md p-6 shadow-xl relative">
            <button
              onClick={() => setShowNotifyModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-semibold text-white mb-4">
              Notification Settings
            </h3>
            <p className="text-sm text-gray-300 mb-6 flex flex-col gap-2">
              <span>Set an in-app reminder for a specific conference.</span>
            </p>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              <label className="block space-y-1">
                <span className="text-sm font-medium text-gray-200">
                  Conference Name
                </span>
                <select
                  value={notifyForm.conferenceId}
                  onChange={(e) =>
                    setNotifyForm({
                      ...notifyForm,
                      conferenceId: e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-white/30 bg-black px-3 py-2 text-white outline-none transition focus:border-teal-400"
                >
                  <option value="" disabled>
                    Select a conference
                  </option>
                  {entries.map((conf) => (
                    <option key={conf.id} value={conf.id}>
                      {conf.conferenceName}
                    </option>
                  ))}
                  {entries.length === 0 && (
                    <option value="" disabled>
                      No conferences available
                    </option>
                  )}
                </select>
              </label>

              <label className="block space-y-1">
                <span className="text-sm font-medium text-gray-200">
                  Custom Message
                </span>
                <textarea
                  value={notifyForm.message}
                  onChange={(e) =>
                    setNotifyForm({ ...notifyForm, message: e.target.value })
                  }
                  placeholder="e.g., Prepare slides for presentation"
                  className="w-full rounded-md border border-white/30 bg-black px-3 py-2 text-white outline-none transition focus:border-teal-400"
                  rows={2}
                />
              </label>

              <label className="block space-y-1">
                <span className="text-sm font-medium text-gray-200">
                  Notify Date
                </span>
                <input
                  type="date"
                  value={notifyForm.notifyDate}
                  onChange={(e) =>
                    setNotifyForm({ ...notifyForm, notifyDate: e.target.value })
                  }
                  className="w-full rounded-md border border-white/30 bg-black px-3 py-2 text-white outline-none transition focus:border-teal-400"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-sm font-medium text-gray-200">
                  Notify Time
                </span>
                <input
                  type="time"
                  value={notifyForm.notifyTime}
                  onChange={(e) =>
                    setNotifyForm({ ...notifyForm, notifyTime: e.target.value })
                  }
                  className="w-full rounded-md border border-white/30 bg-black px-3 py-2 text-white outline-none transition focus:border-teal-400"
                />
              </label>

              <button
                onClick={saveNotificationSettings}
                className="w-full mt-4 rounded-md bg-teal-700 hover:bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {activeLinkEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-white/20 bg-gray-900/70 backdrop-blur-md p-6 shadow-2xl relative">
            <button
              onClick={() => {
                setActiveLinkEntry(null);
                setLinkConferenceUrl("");
                  setLinkArticleUrls([]);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-200">
              Link
            </p>
            <h3 className="mt-2 text-xl font-semibold text-white">
              {activeLinkEntry.conferenceName}
            </h3>
            <p className="mt-2 text-sm text-gray-300">
              Add a conference website link and an article website link for this record.
            </p>

            <div className="mt-5 space-y-4">
              <label className="block space-y-1">
                <span className="text-sm font-medium text-gray-200">
                  Conference website link
                </span>
                <input
                  value={linkConferenceUrl}
                  onChange={(event) => setLinkConferenceUrl(event.target.value)}
                  placeholder="https://conference.example.com"
                  className="w-full rounded-md border border-white/30 bg-black px-3 py-2 text-white outline-none transition focus:border-teal-400"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-sm font-medium text-gray-200">
                  Article website link
                </span>
                <div className="space-y-2">
                  {linkArticleUrls.map((url, index) => (
                    <input
                      key={`${activeLinkEntry.id}-${index}`}
                      value={url}
                      onChange={(event) =>
                        setLinkArticleUrls((previous) =>
                          previous.map((current, currentIndex) =>
                            currentIndex === index ? event.target.value : current,
                          ),
                        )
                      }
                      placeholder={`Article link ${index + 1}`}
                      className="w-full rounded-md border border-white/30 bg-black px-3 py-2 text-white outline-none transition focus:border-teal-400"
                    />
                  ))}
                </div>
              </label>

              <button
                onClick={saveLinkEditor}
                className="w-full rounded-md bg-teal-700 hover:bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition"
              >
                Save Link
              </button>
            </div>
          </div>
        </div>
      )}

      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl border border-white/20 bg-gray-900/70 backdrop-blur-md p-6 shadow-2xl relative">
            <button
              onClick={() => setShowCategoryModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-200">
              Edit
            </p>
            <h3 className="mt-2 text-xl font-semibold text-white">
              Add conference type
            </h3>
            <p className="mt-2 text-sm text-gray-300">
              Type a new conference category and save it to the paper summary.
            </p>

            <div className="mt-5 space-y-4">
              <label className="block space-y-1">
                <span className="text-sm font-medium text-gray-200">
                  Conference type
                </span>
                <input
                  value={categoryInput}
                  onChange={(event) => setCategoryInput(event.target.value)}
                  placeholder="e.g. Scopus"
                  className="w-full rounded-md border border-white/30 bg-black px-3 py-2 text-white outline-none transition focus:border-teal-400"
                />
              </label>

              <button
                onClick={saveCategoryType}
                className="w-full rounded-md bg-teal-700 hover:bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl flex flex-col md:flex-row gap-8 items-start">
        {/* Left Sidebar Actions */}
        <div className="w-full md:w-64 shrink-0 flex flex-col gap-4">
          <div className="rounded-2xl border border-white/20 bg-black/40 backdrop-blur-sm p-4 space-y-3">
            <button
              onClick={() => setShowNotifyModal(true)}
              className="w-full flex justify-between items-center rounded-md border border-teal-500/60 bg-teal-500/10 px-4 py-3 text-sm font-medium text-teal-300 transition hover:bg-teal-500/20"
            >
              <span className="flex gap-2 items-center">
                <Bell size={16} /> Notify
              </span>
            </button>

            <button
              onClick={generatePDF}
              className="w-full flex justify-between items-center rounded-md border border-white/20 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              <span className="flex gap-2 items-center">
                <Download size={16} /> Export PDF
              </span>
            </button>

            <button
              onClick={() => setCurrentView("add-future")}
              className="w-full flex justify-between items-center rounded-md border border-white/20 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              <span className="flex gap-2 items-center">
                <Plus size={16} /> Add Conference for Further
              </span>
            </button>

          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-6 w-full max-w-full overflow-hidden">
          <header className="rounded-2xl border border-white/20 bg-black/40 backdrop-blur-sm p-6 flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-300">
                Publication Tracker
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl truncate">
                Conference Dashboard
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-gray-300">
                Add your conference papers, track acceptance and presentations,
                and monitor category-wise publication counts.
              </p>
            </div>
            {currentUser ? (
              <div className="flex flex-col items-end text-sm">
                <span className="text-gray-400">Logged in as</span>
                <span className="font-semibold text-teal-300 px-3 py-1 bg-teal-900/30 rounded-full border border-teal-500/30 mt-1">
                  {currentUser}
                </span>
                <button
                  onClick={() => {
                    setIsDataLoaded(false);
                    setCurrentView("welcome");
                  }}
                  className="text-xs text-teal-400 hover:text-teal-300 mt-2"
                >
                  Switch User
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-end text-sm text-right">
                <span className="text-teal-400 font-semibold mb-1">
                  Unassigned Default Profile
                </span>
                <span className="text-gray-400 text-xs mb-2 max-w-[200px]">
                  Secure your legacy data by assigning a username.
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={assignUsernameInput}
                    onChange={(e) => setAssignUsernameInput(e.target.value)}
                    placeholder="Enter new username"
                    className="rounded-md border border-white/30 bg-black/50 px-2 py-1 text-white outline-none focus:border-teal-400 text-xs"
                  />
                  <button
                    onClick={handleAssignUsername}
                    disabled={!assignUsernameInput.trim()}
                    className="rounded-md bg-teal-600 px-3 py-1 text-xs font-semibold text-white hover:bg-teal-500 transition disabled:opacity-50"
                  >
                    Assign
                  </button>
                </div>
                <button
                  onClick={() => {
                    setIsDataLoaded(false);
                    setCurrentView("welcome");
                  }}
                  className="text-xs text-teal-400 hover:text-teal-300 mt-3"
                >
                  Switch User
                </button>
              </div>
            )}
          </header>

          <section className="grid gap-4 rounded-2xl border border-white/20 bg-black/40 backdrop-blur-sm p-4 grid-cols-2 lg:grid-cols-5">
            <div>
              <p className="text-[10px] sm:text-xs uppercase tracking-wider text-gray-400 truncate">
                Total Papers
              </p>
              <p className="mt-1 text-2xl sm:text-3xl font-semibold text-white">
                {counts.total}
              </p>
            </div>
            {categoryOptions.map((category) => (
              <div key={category}>
                <p className="text-[10px] sm:text-xs uppercase tracking-wider text-gray-400 truncate">
                  {category}
                </p>
                <p className="mt-1 text-xl sm:text-2xl font-semibold text-teal-300">
                  {counts.categories[category] || 0}
                </p>
              </div>
            ))}
            <div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] sm:text-xs uppercase tracking-wider text-gray-400 truncate">
                  Other
                </p>
                <button
                  type="button"
                  onClick={openCategoryEditor}
                  className="text-[10px] font-semibold uppercase tracking-wider text-teal-400 hover:text-teal-300"
                >
                  Edit
                </button>
              </div>
              <p className="mt-1 text-xl sm:text-2xl font-semibold text-gray-200">
                {counts.other}
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-white/20 bg-black/40 backdrop-blur-sm p-4 shadow-sm sm:p-6">
            <form
              onSubmit={submitEntry}
              className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
            >
              <label className="space-y-1">
                <span className="text-sm font-medium text-gray-200">
                  Conference Name
                </span>
                <input
                  required
                  value={form.conferenceName}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      conferenceName: event.target.value,
                    }))
                  }
                  className="w-full rounded-md border border-white/30 bg-black px-3 py-2 text-white outline-none transition focus:border-teal-400"
                  placeholder="e.g. ICML 2027"
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium text-gray-200">
                  Conference Date
                </span>
                <input
                  required
                  type="date"
                  value={form.conferenceDate}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      conferenceDate: event.target.value,
                    }))
                  }
                  className="w-full rounded-md border border-white/30 bg-black px-3 py-2 text-white outline-none transition focus:border-teal-400"
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium text-gray-200">
                  Status
                </span>
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      status: event.target.value,
                    }))
                  }
                  className="w-full rounded-md border border-white/30 bg-black px-3 py-2 text-white outline-none transition focus:border-teal-400"
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
                      className="h-4 w-4 rounded border-white/30 bg-black text-teal-400 accent-teal-600"
                    />
                    <span className="text-sm font-medium text-gray-200">
                      Registered
                    </span>
                  </div>
                </label>
              )}

              {form.status === "Accepted" && form.isRegistered && (
                <>
                  <label className="space-y-1">
                    <span className="text-sm font-medium text-gray-200">
                      Presentation Date
                    </span>
                    <input
                      type="date"
                      value={form.presentationDate || ""}
                      onChange={(event) =>
                        setForm((previous) => ({
                          ...previous,
                          presentationDate: event.target.value,
                        }))
                      }
                      className="w-full rounded-md border border-white/30 bg-black px-3 py-2 text-white outline-none transition focus:border-teal-400"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-sm font-medium text-gray-200">
                      Presentation Time
                    </span>
                    <input
                      type="time"
                      value={form.presentationTime || ""}
                      onChange={(event) =>
                        setForm((previous) => ({
                          ...previous,
                          presentationTime: event.target.value,
                        }))
                      }
                      className="w-full rounded-md border border-white/30 bg-black px-3 py-2 text-white outline-none transition focus:border-teal-400"
                    />
                  </label>
                </>
              )}

              <label className="space-y-1">
                <span className="text-sm font-medium text-gray-200">
                  Papers Submitted
                </span>
                <input
                  type="number"
                  min="0"
                  value={form.papersSubmitted}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      papersSubmitted: event.target.value
                        ? Number(event.target.value)
                        : "",
                    }))
                  }
                  className="w-full rounded-md border border-white/30 bg-black px-3 py-2 text-white outline-none transition focus:border-teal-400"
                  placeholder="e.g. 1"
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium text-gray-200">
                  Publication Date
                </span>
                <input
                  type="date"
                  value={form.publicationDate}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      publicationDate: event.target.value,
                    }))
                  }
                  className="w-full rounded-md border border-white/30 bg-black px-3 py-2 text-white outline-none transition focus:border-teal-400"
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium text-gray-200">
                  Expected Publication Month
                </span>
                <input
                  type="month"
                  value={form.expectedPublicationMonth}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      expectedPublicationMonth: event.target.value,
                    }))
                  }
                  className="w-full rounded-md border border-white/30 bg-black px-3 py-2 text-white outline-none transition focus:border-teal-400"
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium text-gray-200">
                  Conference Category
                </span>
                <select
                  value={form.conferenceCategory}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      conferenceCategory: event.target.value,
                    }))
                  }
                  className="w-full rounded-md border border-white/30 bg-black px-3 py-2 text-white outline-none transition focus:border-teal-400"
                >
                  {categoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex items-end gap-2 xl:col-span-2">
                <button
                  type="submit"
                  className="w-full rounded-md bg-teal-700 hover:bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition cursor-pointer"
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

          <section className="overflow-x-auto rounded-2xl border border-white/20 bg-black/40 backdrop-blur-sm shadow-sm">
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
                    <td
                      colSpan={8}
                      className="px-4 py-10 text-center text-gray-400"
                    >
                      No records yet. Add your first conference entry.
                    </td>
                  </tr>
                ) : (
                  sortedEntries.map((entry, index) => (
                    <tr
                      key={entry.id}
                      className={`border-t border-white/20 text-slate-800 ${entry.status === "Accepted" && (entry.isRegistered ?? entry.isRegisteteal) ? "bg-amber-50/80 border-l-4 border-l-amber-300" : entry.status === "Accepted" ? "bg-rose-50/80 border-l-4 border-l-rose-300" : entry.status === "Presented" ? "bg-emerald-50/80 border-l-4 border-l-emerald-300" : entry.status === "Published" ? "bg-sky-50/80 border-l-4 border-l-sky-300" : ""}`}
                    >
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3 min-w-[150px]">
                        {entry.conferenceName}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {entry.conferenceDate || "-"}
                      </td>
                      <td className="px-4 py-3">
                        {entry.papersSubmitted || "-"}
                      </td>
                      <td className="px-4 py-3 min-w-[120px]">
                        <div className="flex flex-col gap-1 items-start">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClassName(entry.status, entry.publicationDate, Boolean(entry.isRegistered ?? entry.isRegisteteal))}`}
                            >
                              {entry.publicationDate
                                ? "Published"
                                : entry.status}
                            </span>
                            {entry.status === "Accepted" && (
                              <div
                                className={`h-2.5 w-2.5 rounded-full ring-1 ring-white/50 shrink-0 ${entry.isRegistered ?? entry.isRegisteteal ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.55)]" : "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.55)]"}`}
                                title={entry.isRegistered ?? entry.isRegisteteal ? "Registered" : "Not registered"}
                              />
                            )}
                          </div>
                          {entry.status === "Accepted" &&
                            (entry.isRegistered ?? entry.isRegisteteal) &&
                            (entry.presentationDate || entry.presentationTime) && (
                              <div className="text-[10px] text-gray-400 pl-1 whitespace-nowrap overflow-hidden text-ellipsis w-full">
                                {entry.presentationDate && (
                                  <span>{entry.presentationDate}</span>
                                )}
                                {entry.presentationDate &&
                                  entry.presentationTime && <span> at </span>}
                                {entry.presentationTime && (
                                  <span>{entry.presentationTime}</span>
                                )}
                              </div>
                            )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {entry.publicationDate || "-"}
                      </td>
                      <td className="px-4 py-3">{entry.conferenceCategory}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => openLinkEditor(entry)}
                            className="rounded-md border border-teal-500/60 px-3 py-1.5 text-xs font-medium text-teal-200 transition hover:bg-teal-500/20 cursor-pointer"
                          >
                            <span className="flex items-center gap-1">
                              <Link2 size={12} /> Link
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => editEntry(entry)}
                            className="rounded-md border border-teal-500/60 px-3 py-1.5 text-xs font-medium text-teal-200 transition hover:bg-teal-500/20 cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => removeEntry(entry.id)}
                            className="rounded-md border border-teal-500/60 px-3 py-1.5 text-xs font-medium text-teal-200 transition hover:bg-teal-500/20 cursor-pointer"
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
