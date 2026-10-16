export type InstanceState =
  | "notAuthorized"
  | "authorized"
  | "blocked"
  | "sleepMode"
  | "starting"
  | "yellowCard"
  | "suspended";

export type StateResult =
  | { success: true; state: InstanceState }
  | { success: false; error: string };

export async function getStateInstance(
  idInstance: string,
  apiTokenInstance: string,
  signal?: AbortSignal
): Promise<StateResult> {
  const url = `/api-green/waInstance${idInstance}/getStateInstance/${apiTokenInstance}`;

  try {
    const response = await fetch(url, { signal });

    if (!response.ok) {
      throw new Error(`Ошибка при запросе к Green-API: ${response.statusText}`);
    }

    const data: { stateInstance: InstanceState } = await response.json();
    return { success: true, state: data.stateInstance };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Ошибка сети",
    };
  }
}