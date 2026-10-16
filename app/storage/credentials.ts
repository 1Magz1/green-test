export interface Credentials {
  idInstance: string;
  apiTokenInstance: string;
}

const STORAGE_KEY = "green-api-credentials";

export function saveCredentials(credentials: Credentials): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(credentials));
    console.log("[saveCredentials] saved:", sessionStorage.getItem(STORAGE_KEY));
  } catch (error) {
    console.error("Не удалось сохранить данные в sessionStorage:", error);
  }
}

export function loadCredentials(): Credentials | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (
      typeof parsed?.idInstance === "string" &&
      typeof parsed?.apiTokenInstance === "string"
    ) {
      return parsed as Credentials;
    }
    return null;
  } catch (error) {
    console.error("Не удалось прочитать данные из sessionStorage:", error);
    return null;
  }
}

export function clearCredentials(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Не удалось очистить sessionStorage:", error);
  }
}