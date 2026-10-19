/**
 * Удаляет обработанное уведомление из очереди (иначе оно придёт снова).
 * Возвращает true, если сервер подтвердил удаление.
 */
export async function deleteNotification(
  idInstance: string,
  apiTokenInstance: string,
  receiptId: number
): Promise<boolean> {
  const url = `/api-green/waInstance${idInstance}/deleteNotification/${apiTokenInstance}/${receiptId}`;

  try {
    const response = await fetch(url, { method: "DELETE" });
    if (!response.ok) return false;

    const data: { result?: unknown } | null = await response.json().catch(() => null);
    return data?.result === true;
  } catch {
    return false;
  }
}
