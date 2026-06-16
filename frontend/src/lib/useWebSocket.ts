"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useAuth } from "@/lib/auth-context";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const WS_URL = API_URL.replace("https://", "wss://").replace("http://", "ws://");

export function useWebSocket(onEvent?: (event: { type: string; data: any }) => void) {
  const { user } = useAuth();
  const ws = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const reconnectTimeout = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    if (!user?.tenant_id) return;

    try {
      const socket = new WebSocket(`${WS_URL}/ws/${user.tenant_id}`);

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

      return () => {
        clearInterval(pingInterval);
      };
    } catch {}
  }, [user?.tenant_id, onEvent]);

  useEffect(() => {
    connect();
    return () => {
      if (ws.current) ws.current.close();
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
    };
  }, [connect]);

  const send = useCallback((data: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(data));
    }
  }, []);

  return { connected, send };
}
