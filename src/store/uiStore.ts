import { create } from "zustand";

export type ToastVariant = "default" | "success" | "error";

export type ToastMessage = {
  id: string;
  message: string;
  variant: ToastVariant;
};

export type DialogState = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: (() => void) | null;
};

export type HoveredUnit = {
  side: "ally" | "enemy";
  unitId: string;
  anchorX: number;
  anchorY: number;
};

type UIStore = {
  debugOpen: boolean;
  setDebugOpen: (open: boolean) => void;
  letterDrawerOpen: boolean;
  setLetterDrawerOpen: (open: boolean) => void;
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  hoveredUnit: HoveredUnit | null;
  setHoveredUnit: (unit: HoveredUnit | null) => void;
  toasts: ToastMessage[];
  pushToast: (message: string, variant?: ToastVariant) => void;
  dismissToast: (id: string) => void;
  dialog: DialogState;
  openDialog: (input: Omit<DialogState, "open">) => void;
  closeDialog: () => void;
};

let toastCounter = 0;

const emptyDialog: DialogState = {
  open: false,
  title: "",
  description: "",
  confirmLabel: "确认",
  onConfirm: null,
};

export const useUIStore = create<UIStore>((set, get) => ({
  debugOpen: false,
  setDebugOpen: (debugOpen) => set({ debugOpen }),

  letterDrawerOpen: false,
  setLetterDrawerOpen: (letterDrawerOpen) => set({ letterDrawerOpen }),

  settingsOpen: false,
  setSettingsOpen: (settingsOpen) => set({ settingsOpen }),

  hoveredUnit: null,
  setHoveredUnit: (hoveredUnit) => set({ hoveredUnit }),

  toasts: [],
  pushToast: (message, variant = "default") => {
    toastCounter += 1;
    const id = `toast_${toastCounter}`;
    set({ toasts: [...get().toasts, { id, message, variant }] });
    window.setTimeout(() => get().dismissToast(id), 3200);
  },
  dismissToast: (id) =>
    set({ toasts: get().toasts.filter((toast) => toast.id !== id) }),

  dialog: emptyDialog,
  openDialog: (input) => set({ dialog: { ...input, open: true } }),
  closeDialog: () => set({ dialog: emptyDialog }),
}));
