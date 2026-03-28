export const fetcher = async (args: string | [string, { getIdToken: () => Promise<string> } | null]) => {
  const url = typeof args === "string" ? args : args[0];
  const user = typeof args === "string" ? null : args[1];

  const headers: HeadersInit = {};

  if (user && typeof user.getIdToken === "function") {
    const token = await user.getIdToken();
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, { headers });

  if (!res.ok) {
    const error = new Error("An error occurred while fetching the data.");
    (error as Error & { info?: unknown; status?: number }).info = await res.json().catch(() => ({}));
    (error as Error & { info?: unknown; status?: number }).status = res.status;
    throw error;
  }

  return res.json();
};
