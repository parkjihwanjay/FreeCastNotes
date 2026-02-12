import { useEffect } from "react";
import { useAppStore } from "../../stores/appStore";

export default function Toast() {
  const { toast, clearToast } = useAppStore();

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(clearToast, 2000);
    return () => clearTimeout(timer);
  }, [toast, clearToast]);

  if (!toast) return null;

  return (
    <div className="pointer-events-none absolute left-0 right-0 top-14 z-[60] flex justify-center">
      <div className="pointer-events-auto rounded-lg border border-white/10 bg-[#3A3A3C] px-4 py-2 text-sm text-[#E5E5E7] shadow-lg animate-in">
        {toast}
      </div>
    </div>
  );
}
