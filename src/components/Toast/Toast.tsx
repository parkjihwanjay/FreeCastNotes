import { useEffect, useState } from "react";
import { useAppStore } from "../../stores/appStore";

export default function Toast() {
  const { toast, clearToast } = useAppStore();
  // Key forces re-mount on new toast so animation restarts
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (!toast) return;
    setKey((k) => k + 1);
    const timer = setTimeout(clearToast, 2000);
    return () => clearTimeout(timer);
  }, [toast, clearToast]);

  if (!toast) return null;

  return (
    <div className="pointer-events-none absolute left-0 right-0 top-14 z-[60] flex justify-center">
      <div
        key={key}
        className="animate-toast pointer-events-auto rounded-lg border border-white/10 bg-[#3A3A3C] px-4 py-2 text-sm text-[#E5E5E7] shadow-lg"
      >
        {toast}
      </div>
    </div>
  );
}
