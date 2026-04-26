"use client";

import { useEffect, useState } from "react";
import { BellOff, BellRing, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type State = "unsupported" | "denied" | "off" | "on" | "loading";

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Std = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64Std);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export function EnableNotificationsButton({
  vapidPublicKey,
}: {
  vapidPublicKey: string;
}) {
  const [state, setState] = useState<State>("loading");

  useEffect(() => {
    (async () => {
      if (
        typeof window === "undefined" ||
        !("serviceWorker" in navigator) ||
        !("PushManager" in window) ||
        !("Notification" in window)
      ) {
        setState("unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        setState("denied");
        return;
      }
      try {
        const reg = await navigator.serviceWorker.getRegistration("/sw.js");
        const sub = await reg?.pushManager.getSubscription();
        setState(sub ? "on" : "off");
      } catch {
        setState("off");
      }
    })();
  }, []);

  const enable = async () => {
    if (!vapidPublicKey) {
      toast.error("VAPID public key não configurada.");
      return;
    }
    setState("loading");
    try {
      let reg = await navigator.serviceWorker.getRegistration("/sw.js");
      if (!reg) {
        reg = await navigator.serviceWorker.register("/sw.js");
      }
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "off");
        toast.error("Permissão negada.");
        return;
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          vapidPublicKey,
        ) as unknown as BufferSource,
      });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      if (!res.ok) throw new Error("falha");
      setState("on");
      toast.success("Avisos ativados.");
    } catch (e) {
      console.error(e);
      setState("off");
      toast.error("Não foi possível ativar avisos.");
    }
  };

  const disable = async () => {
    setState("loading");
    try {
      const reg = await navigator.serviceWorker.getRegistration("/sw.js");
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setState("off");
      toast.success("Avisos desativados.");
    } catch {
      setState("on");
      toast.error("Falha ao desativar.");
    }
  };

  if (state === "unsupported" || state === "denied") {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <BellOff className="size-3.5" />
        {state === "unsupported"
          ? "Avisos não suportados neste navegador"
          : "Permissão de notificação bloqueada"}
      </div>
    );
  }

  const isOn = state === "on";
  const loading = state === "loading";
  return (
    <button
      type="button"
      onClick={isOn ? disable : enable}
      disabled={loading}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors",
        isOn
          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
          : "bg-primary-soft text-primary hover:bg-accent",
      )}
    >
      {loading ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <BellRing className="size-3.5" />
      )}
      {isOn ? "Avisos ativos" : "Ativar avisos"}
    </button>
  );
}
