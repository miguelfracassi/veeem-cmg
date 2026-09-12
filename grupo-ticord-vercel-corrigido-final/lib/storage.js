import { get, put } from "@vercel/blob";

const PATH = "ticord/envios.json";

export async function readSubmissions() {
  try {
    const result = await get(PATH, {
      access: "private",
      useCache: false,
    });

    if (!result) return [];
    const text = await new Response(result.stream).text();
    const data = JSON.parse(text);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    // A Blob que ainda não existe deve começar vazia.
    if (error?.code === "blob_not_found" || error?.status === 404) {
      return [];
    }
    throw error;
  }
}

export async function writeSubmissions(submissions) {
  await put(PATH, JSON.stringify(submissions, null, 2), {
    access: "private",
    allowOverwrite: true,
    contentType: "application/json; charset=utf-8",
  });
}

export function getAdminPassword() {
  return process.env.ADMIN_SENHA || "";
}
