export const fetcher = async (args: string | [string, any]) => {
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
    (error as any).info = await res.json().catch(() => ({}));
    (error as any).status = res.status;
    throw error;
  }

  return res.json();
};
