const FONNTE_URL = "https://api.fonnte.com/send";

function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "").replace(/^0/, "62");
}

export async function sendWhatsApp(phone: string, message: string): Promise<boolean> {
  const token = process.env.FONNTE_TOKEN;
  if (!token) return false;

  try {
    const res = await fetch(FONNTE_URL, {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        target: normalizePhone(phone),
        message,
        countryCode: "62",
      }),
      signal: AbortSignal.timeout(6000),
    });
    const json = (await res.json()) as { status: boolean };
    return json.status === true;
  } catch {
    return false;
  }
}
