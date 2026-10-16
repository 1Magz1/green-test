import { useEffect } from "react";
import { getStateInstance } from "../api/getStateInstance";

const POLL_INTERVAL_MS = 3000;

export function useAuthPolling(
  credentials: { idInstance: string; apiTokenInstance: string } | null,
  onAuthorized: () => void
) {
  useEffect(() => {
    if (!credentials) return;

    const controller = new AbortController();
    let timerId: ReturnType<typeof setTimeout>;

    const poll = async () => {
      const result = await getStateInstance(
        credentials.idInstance,
        credentials.apiTokenInstance,
        controller.signal
      );

      if (controller.signal.aborted) return;

      if (result.success && result.state === "authorized") {
        onAuthorized();
        return;
      }

      timerId = setTimeout(poll, POLL_INTERVAL_MS);
    };

    poll();

    return () => {
      controller.abort();
      clearTimeout(timerId);
    };
  }, [credentials, onAuthorized]);
}