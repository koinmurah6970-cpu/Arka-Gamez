import { Resend } from "resend";
import { STORE_NAME } from "./constants";
import { formatPrice } from "./format";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM ?? "onboarding@resend.dev";

// ── shared styles ────────────────────────────────────────────────────────────

const BASE_HTML = (content: string) => `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${STORE_NAME}</title>
</head>
<body style="margin:0;padding:0;background:#0b0f19;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e2e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0b0f19;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <!-- header -->
        <tr><td style="padding-bottom:24px;">
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="background:#0b0f19;border:1px solid #1e2a3a;border-radius:10px;width:36px;height:36px;text-align:center;vertical-align:middle;font-size:18px;font-weight:900;font-style:italic;color:#fff;">L</td>
              <td style="padding-left:10px;font-size:18px;font-weight:800;color:#f1f5f9;">Link <span style="color:#64748b;font-weight:400;">Yu</span></td>
            </tr>
          </table>
        </td></tr>

        <!-- card -->
        <tr><td style="background:#111827;border:1px solid #1e2a3a;border-radius:16px;padding:32px;">
          ${content}
        </td></tr>

        <!-- footer -->
        <tr><td style="padding-top:20px;text-align:center;font-size:12px;color:#475569;">
          © ${new Date().getFullYear()} ${STORE_NAME} · Jual &amp; instalasi game PC/Laptop
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
`;

// ── templates ────────────────────────────────────────────────────────────────

function orderConfirmationHtml(
  name: string,
  orderNumber: string,
  items: { name: string; price: number }[],
  total: number
): string {
  const rows = items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 0;font-size:14px;color:#cbd5e1;border-bottom:1px solid #1e2a3a;">${item.name}</td>
        <td style="padding:8px 0;font-size:14px;color:#cbd5e1;border-bottom:1px solid #1e2a3a;text-align:right;white-space:nowrap;">${formatPrice(item.price)}</td>
      </tr>`
    )
    .join("");

  return BASE_HTML(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#f1f5f9;">Pesanan Diterima! 🎮</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#94a3b8;">Hei <strong style="color:#f1f5f9;">${name}</strong>, pesanan kamu sudah masuk ya.</p>

    <div style="background:#0b0f19;border:1px solid #1e2a3a;border-radius:12px;padding:20px;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.06em;">Nomor Pesanan</p>
      <p style="margin:0;font-size:20px;font-weight:800;color:#6366f1;letter-spacing:.04em;">${orderNumber}</p>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      ${rows}
      <tr>
        <td style="padding-top:12px;font-size:14px;font-weight:700;color:#f1f5f9;">Total</td>
        <td style="padding-top:12px;font-size:16px;font-weight:800;color:#6366f1;text-align:right;">${formatPrice(total)}</td>
      </tr>
    </table>

    <p style="margin:24px 0 0;font-size:13px;color:#64748b;line-height:1.6;">
      Tim kami akan segera memproses pesanan kamu. Ada pertanyaan? Balas email ini atau hubungi admin via WhatsApp.
    </p>
  `);
}

const STATUS_CONTENT: Partial<
  Record<string, (name: string, orderNumber: string) => string>
> = {
  confirmed: (name, orderNumber) =>
    BASE_HTML(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#f1f5f9;">Pesanan Dikonfirmasi ✅</h1>
      <p style="margin:0 0 24px;font-size:15px;color:#94a3b8;">Hei <strong style="color:#f1f5f9;">${name}</strong>, pesanan kamu sudah kami konfirmasi!</p>
      <div style="background:#0b0f19;border:1px solid #1e2a3a;border-radius:12px;padding:20px;">
        <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.06em;">Nomor Pesanan</p>
        <p style="margin:0;font-size:20px;font-weight:800;color:#6366f1;">${orderNumber}</p>
      </div>
      <p style="margin:24px 0 0;font-size:13px;color:#64748b;line-height:1.6;">Tim kami sedang menyiapkan game kamu. Mohon tunggu sebentar ya!</p>
    `),
  processing: (name, orderNumber) =>
    BASE_HTML(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#f1f5f9;">Sedang Diproses 🔧</h1>
      <p style="margin:0 0 24px;font-size:15px;color:#94a3b8;">Hei <strong style="color:#f1f5f9;">${name}</strong>, pesanan kamu sedang diproses!</p>
      <div style="background:#0b0f19;border:1px solid #1e2a3a;border-radius:12px;padding:20px;">
        <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.06em;">Nomor Pesanan</p>
        <p style="margin:0;font-size:20px;font-weight:800;color:#6366f1;">${orderNumber}</p>
      </div>
      <p style="margin:24px 0 0;font-size:13px;color:#64748b;line-height:1.6;">Game kamu akan segera siap. Terima kasih sudah sabar!</p>
    `),
  completed: (name, orderNumber) =>
    BASE_HTML(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#f1f5f9;">Pesanan Selesai 🎉</h1>
      <p style="margin:0 0 24px;font-size:15px;color:#94a3b8;">Hei <strong style="color:#f1f5f9;">${name}</strong>, game kamu sudah siap!</p>
      <div style="background:#0b0f19;border:1px solid #1e2a3a;border-radius:12px;padding:20px;">
        <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.06em;">Nomor Pesanan</p>
        <p style="margin:0;font-size:20px;font-weight:800;color:#6366f1;">${orderNumber}</p>
      </div>
      <p style="margin:24px 0 0;font-size:13px;color:#64748b;line-height:1.6;">Terima kasih sudah belanja di <strong style="color:#f1f5f9;">${STORE_NAME}</strong>. Selamat main! 🕹️</p>
    `),
  cancelled: (name, orderNumber) =>
    BASE_HTML(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#f1f5f9;">Pesanan Dibatalkan</h1>
      <p style="margin:0 0 24px;font-size:15px;color:#94a3b8;">Hei <strong style="color:#f1f5f9;">${name}</strong>, pesanan kamu telah dibatalkan.</p>
      <div style="background:#0b0f19;border:1px solid #1e2a3a;border-radius:12px;padding:20px;">
        <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.06em;">Nomor Pesanan</p>
        <p style="margin:0;font-size:20px;font-weight:800;color:#6366f1;">${orderNumber}</p>
      </div>
      <p style="margin:24px 0 0;font-size:13px;color:#64748b;line-height:1.6;">Hubungi admin jika ada pertanyaan atau ingin melakukan pemesanan ulang.</p>
    `),
};

// ── public API ────────────────────────────────────────────────────────────────

export async function sendOrderConfirmation(
  to: string,
  name: string,
  orderNumber: string,
  items: { name: string; price: number }[],
  total: number
): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) return false;
  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to,
      subject: `Pesanan ${orderNumber} diterima — ${STORE_NAME}`,
      html: orderConfirmationHtml(name, orderNumber, items, total),
    });
    return !error;
  } catch {
    return false;
  }
}

export async function sendOrderStatusEmail(
  to: string,
  name: string,
  orderNumber: string,
  status: string
): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) return false;
  const buildHtml = STATUS_CONTENT[status];
  if (!buildHtml) return false;
  try {
    const statusLabels: Record<string, string> = {
      confirmed: "dikonfirmasi",
      processing: "diproses",
      completed: "selesai",
      cancelled: "dibatalkan",
    };
    const { error } = await resend.emails.send({
      from: FROM,
      to,
      subject: `Pesanan ${orderNumber} ${statusLabels[status] ?? status} — ${STORE_NAME}`,
      html: buildHtml(name, orderNumber),
    });
    return !error;
  } catch {
    return false;
  }
}
