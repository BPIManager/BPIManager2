export async function authFetch(
  url: string,
  method: string,
  fbUser: { getIdToken: () => Promise<string> } | null,
  body?: unknown,
): Promise<Response> {
  const token = fbUser ? await fbUser.getIdToken() : null;
  return fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

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
