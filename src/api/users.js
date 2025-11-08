export async function fetchUsers(query = "") {
  const base = import.meta.env?.VITE_API_URL || "http://localhost:8000";
  const url = new URL("/users", base);
  if (query) url.searchParams.set("q", query);

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function createUser(payload) {
  const base = import.meta.env?.VITE_API_URL || "http://localhost:8000";
  const url = new URL("/users", base);

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const msg = `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return res.json();
}

export async function deleteUser(id) {
  const base = import.meta.env?.VITE_API_URL || "http://localhost:8000";
  const url = new URL(`/users/${encodeURIComponent(id)}`, base);

  const res = await fetch(url.toString(), {
    method: "DELETE",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  if (res.status === 204) return {};
  try {
    return await res.json();
  } catch {
    return {};
  }
}

export async function updateUser(id, payload) {
  const base = import.meta.env?.VITE_API_URL || "http://localhost:8000";
  const url = new URL(`/users/${encodeURIComponent(id)}`, base);

  const res = await fetch(url.toString(), {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
