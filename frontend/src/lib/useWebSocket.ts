"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import api from "./api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const WS_URL = API_URL.replace("https://", "wss://").replace("http://", "ws://");
const POLL_INTERVAL_MS = 8000;
const IS_VERCEL = process.env.NEXT_PUBLIC_VERCEL_URL || process.env.VERCEL;

export function useWebSocket(onEvent?: (event: { type: string; data: any }) => void) {
  const { user } = useAuth();
  const ws = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const reconnectTimeout = useRef<NodeJS.Timeout>();
  const pingIntervalRef = useRef<NodeJS.Timeout>();
  const pollInterval = useRef<NodeJS.Timeout>();
  const lastEventTs = useRef<number>(0);

  const pollEvents = useCallback(async () => {
    if (!user?.tenant_id) return;
    try {
      const res = await api.get(`/events/${user.tenant_id}`, {
        params: { since: lastEventTs.current },
      });
      const { events, server_time } = res.data;
      if (events && events.length > 0 && onEvent) {
        events.forEach((e: any) => onEvent(e));
      }
      if (server_time) lastEventTs.current = server_time;
    } catch {
      // silent
    }
  }, [user?.tenant_id, onEvent]);

  const connect = useCallback(() => {
    if (!user?.tenant_id) return;

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";

    if (IS_VERCEL || typeof WebSocket === "undefined") {
      setConnected(false);
      pollEvents();
      pollInterval.current = setInterval(pollEvents, POLL_INTERVAL_MS);
      return;
    }

    try {
      const socket = new WebSocket(`${WS_URL}/ws/${user.tenant_id}?token=${token || ""}`);

      socket.onopen = () => {
        setConnected(true);
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type !== "pong" && onEvent) {
            onEvent(data);
          }
        } catch {}
      };

      socket.onclose = () => {
        setConnected(false);
        reconnectTimeout.current = setTimeout(connect, 5000);
      };

      socket.onerror = () => {
        socket.close();
      };

      ws.current = socket;

      const pingInterval = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: "ping" }));
        }
      }, 30000);
      pingIntervalRef.current = pingInterval;

      return () => {
        clearInterval(pingInterval);
      };
    } catch {
      setConnected(false);
      pollEvents();
      pollInterval.current = setInterval(pollEvents, POLL_INTERVAL_MS);
    }
  }, [user?.tenant_id, onEvent, pollEvents]);

  useEffect(() => {
    connect();
    return () => {
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (ws.current) ws.current.close();
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      if (pollInterval.current) clearInterval(pollInterval.current);
    };
  }, [connect]);

  const send = useCallback((data: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(data));
    }
  }, []);

  return { connected, send };
}
