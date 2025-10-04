const API_BASE = "http://localhost:5000"; // Flask backend

export async function fetchNEOs() {
  try {
    const res = await fetch(`${API_BASE}/neo`);
    if (!res.ok) throw new Error("Failed to fetch NEOs");
    return await res.json();
  } catch (err) {
    console.error(err);
    return [];
  }
}
