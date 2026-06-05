import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  getDoc,
  getDocs,
  deleteDoc,
  addDoc,
  query,
  orderBy
} from "firebase/firestore";
import { db } from "./firebase";
import { SchoolSettings, ClassData, MonthlyEvent, Notice } from "../types";

// Detect if running in Google Apps Script environment
const isGAS = typeof window !== 'undefined' && (window as any).google && (window as any).google.script;

export const storage = {
  // SETTINGS
  async getSettings(): Promise<SchoolSettings | null> {
    if (isGAS) {
      return new Promise((resolve) => {
        (window as any).google.script.run
          .withSuccessHandler((data: any) => resolve(data.settings))
          .getFullData();
      });
    } else {
      const snap = await getDoc(doc(db, "settings", "config"));
      return snap.exists() ? (snap.data() as SchoolSettings) : null;
    }
  },

  async saveSettings(settings: SchoolSettings) {
    if (isGAS) {
      return new Promise((resolve) => {
        (window as any).google.script.run
          .withSuccessHandler(resolve)
          .saveSettings(settings);
      });
    } else {
      await setDoc(doc(db, "settings", "config"), settings);
    }
  },

  // CLASSES
  async getClasses(): Promise<ClassData[]> {
    if (isGAS) {
      return new Promise((resolve) => {
        (window as any).google.script.run
          .withSuccessHandler((data: any) => resolve(data.classes))
          .getFullData();
      });
    } else {
      const snap = await getDocs(collection(db, "classes"));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as ClassData));
    }
  },

  async updateClass(cls: ClassData) {
    if (isGAS) {
      const classes = await this.getClasses();
      const index = classes.findIndex(c => c.id === cls.id);
      if (index !== -1) {
        classes[index] = cls;
      } else {
        classes.push(cls);
      }
      return new Promise((resolve) => {
        (window as any).google.script.run
          .withSuccessHandler(resolve)
          .saveClasses(classes);
      });
    } else {
      await setDoc(doc(db, "classes", cls.id), cls);
    }
  },

  async deleteClass(id: string) {
    if (isGAS) {
      const classes = await this.getClasses();
      const filtered = classes.filter(c => c.id !== id);
      return new Promise((resolve) => {
        (window as any).google.script.run
          .withSuccessHandler(resolve)
          .saveClasses(filtered);
      });
    } else {
      await deleteDoc(doc(db, "classes", id));
    }
  },

  async saveClasses(classes: ClassData[]) {
    if (isGAS) {
      return new Promise((resolve) => {
        (window as any).google.script.run
          .withSuccessHandler(resolve)
          .saveClasses(classes);
      });
    } else {
      // Caller should handle batching for Firebase
    }
  },

  // EVENTS
  async getEvents(): Promise<MonthlyEvent[]> {
    if (isGAS) {
      return new Promise((resolve) => {
        (window as any).google.script.run
          .withSuccessHandler((data: any) => resolve(data.events))
          .getFullData();
      });
    } else {
      const snap = await getDocs(collection(db, "events"));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as MonthlyEvent));
    }
  },

  async updateEvent(event: MonthlyEvent) {
    if (isGAS) {
      const events = await this.getEvents();
      const index = events.findIndex(e => e.id === event.id);
      if (index !== -1) {
        events[index] = event;
      } else {
        events.push(event);
      }
      return new Promise((resolve) => {
        (window as any).google.script.run
          .withSuccessHandler(resolve)
          .saveEvents(events);
      });
    } else {
      await setDoc(doc(db, "events", event.id), event);
    }
  },

  async saveEvents(events: MonthlyEvent[]) {
    if (isGAS) {
      return new Promise((resolve) => {
        (window as any).google.script.run
          .withSuccessHandler(resolve)
          .saveEvents(events);
      });
    } else {
      // Caller should handle batching for Firebase
    }
  },

  // NOTICES
  async getNotices(): Promise<Notice[]> {
    if (isGAS) {
      return new Promise((resolve) => {
        (window as any).google.script.run
          .withSuccessHandler((data: any) => resolve(data.notices))
          .getFullData();
      });
    } else {
      const q = query(collection(db, "notices"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as Notice));
    }
  },

  async addNotice(notice: Notice) {
    if (isGAS) {
      const notices = await this.getNotices();
      notices.unshift(notice);
      return new Promise((resolve) => {
        (window as any).google.script.run
          .withSuccessHandler(resolve)
          .saveNotices(notices);
      });
    } else {
      await addDoc(collection(db, "notices"), notice);
    }
  },

  async deleteNotice(id: string) {
    if (isGAS) {
      const notices = await this.getNotices();
      const filtered = notices.filter(n => n.id !== id);
      return new Promise((resolve) => {
        (window as any).google.script.run
          .withSuccessHandler(resolve)
          .saveNotices(filtered);
      });
    } else {
      await deleteDoc(doc(db, "notices", id));
    }
  },

  // Real-time listener bridge (simplified for GAS)
  onDataUpdate(callback: (data: { settings: SchoolSettings | null, classes: ClassData[], events: MonthlyEvent[], notices: Notice[] }) => void) {
    if (isGAS) {
      // Polling for GAS
      const poll = async () => {
        (window as any).google.script.run
          .withSuccessHandler((data: any) => {
            callback(data);
          })
          .getFullData();
      };
      poll();
      const interval = setInterval(poll, 30000); // 30 seconds
      return () => clearInterval(interval);
    } else {
      let settings: SchoolSettings | null = null;
      let classes: ClassData[] = [];
      let events: MonthlyEvent[] = [];
      let notices: Notice[] = [];
      let timeout: any = null;

      const emit = () => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => {
          callback({ settings, classes, events, notices });
        }, 50); // Debounce to prevent rapid initial updates
      };

      const unsubSettings = onSnapshot(doc(db, "settings", "config"), (snapshot) => {
        settings = snapshot.exists() ? (snapshot.data() as SchoolSettings) : null;
        emit();
      });

      const unsubClasses = onSnapshot(collection(db, "classes"), (snapshot) => {
        classes = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ClassData));
        emit();
      });

      const unsubEvents = onSnapshot(collection(db, "events"), (snapshot) => {
        events = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as MonthlyEvent));
        emit();
      });

      const unsubNotices = onSnapshot(query(collection(db, "notices"), orderBy("createdAt", "desc")), (snapshot) => {
        notices = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Notice));
        emit();
      });

      return () => {
        if (timeout) clearTimeout(timeout);
        unsubSettings();
        unsubClasses();
        unsubEvents();
        unsubNotices();
      };
    }
  }
};
