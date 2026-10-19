import { useEffect, useRef, useState } from "react";
import { getAvatar } from "../api/getAvatar";
import { isLocalChat } from "../components/chat/model";

const MAX_CONCURRENT = 3;

/**
 * Подгружает аватары для списка чатов.
 * Возвращает { [chatId]: url | null }; null = аватара нет или запрос не удался.
 * Для каждого chatId запрос выполняется один раз.
 */
export function useAvatars(
  idInstance: string | undefined,
  apiTokenInstance: string | undefined,
  chatIds: string[]
): Record<string, string | null> {
  const [avatars, setAvatars] = useState<Record<string, string | null>>({});
  const requested = useRef(new Set<string>());

  useEffect(() => {
    if (!idInstance || !apiTokenInstance) return;

    const ids = chatIds.filter(
      (id) => !isLocalChat(id) && !requested.current.has(id)
    );
    if (ids.length === 0) return;

    const controller = new AbortController();
    const pending = new Set(ids);
    ids.forEach((id) => requested.current.add(id));

    let next = 0;
    const worker = async () => {
      while (next < ids.length && !controller.signal.aborted) {
        const id = ids[next++];
        const result = await getAvatar(
          idInstance,
          apiTokenInstance,
          id,
          controller.signal
        );
        if (controller.signal.aborted) return;

        pending.delete(id);
        setAvatars((prev) => ({
          ...prev,
          [id]: result.success ? result.url : null,
        }));
      }
    };

    for (let i = 0; i < MAX_CONCURRENT; i++) {
      void worker();
    }

    return () => {
      controller.abort();
      pending.forEach((id) => requested.current.delete(id));
    };
  }, [idInstance, apiTokenInstance, chatIds]);

  return avatars;
}