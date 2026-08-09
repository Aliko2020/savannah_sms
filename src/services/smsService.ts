const MNOTIFY_API_URL = 'https://api.mnotify.com/api/sms/quick';

export interface SmsResult {
  sent: boolean;
  error?: string;
}

// Guardian phones are stored as locally-dialled Ghanaian numbers ("0501234567"),
// which is exactly the format mNotify's recipient list expects — no
// international prefix conversion needed, just strip any stray formatting.
function normalizeGhanaPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('233')) return `0${digits.slice(3)}`;
  return digits;
}

// mNotify's error shape isn't consistent: an invalid key comes back as a
// top-level { error }, a bad request as { message }, and field validation
// (e.g. a sender ID over 11 characters) as { errors: { field: [msg] } }.
function extractErrorMessage(data: any, status: number): string {
  if (data?.error) return String(data.error);
  if (data?.message) return String(data.message);
  const firstFieldError = data?.errors && Object.values(data.errors)[0];
  if (Array.isArray(firstFieldError) && firstFieldError.length > 0) return String(firstFieldError[0]);
  return `SMS provider returned ${status}.`;
}

// Fire-and-forget by design: a failed or unconfigured SMS provider must never
// fail the payment it's notifying about — the payment is already committed
// by the time this runs, so we only ever report success/failure back, never throw.
export async function sendSms(phone: string, message: string): Promise<SmsResult> {
  const apiKey = process.env.MNOTIFY_API_KEY;
  const senderId = process.env.MNOTIFY_SENDER_ID;

  if (!apiKey || !senderId) {
    console.warn('SMS not sent: MNOTIFY_API_KEY / MNOTIFY_SENDER_ID not configured in .env.');
    return { sent: false, error: 'SMS provider not configured.' };
  }

  try {
    const res = await fetch(`${MNOTIFY_API_URL}?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: [normalizeGhanaPhone(phone)],
        sender: senderId,
        message,
        is_schedule: false,
        schedule_date: '',
      }),
    });

    const data = await res.json().catch(() => null);

    // mNotify returns HTTP 200 even for some logical failures (bad key,
    // rejected sender ID), so status alone isn't enough — it also carries a
    // "status": "success" | "error" field in the body.
    if (!res.ok || data?.status !== 'success') {
      console.error('mNotify SMS send failed:', res.status, data);
      return { sent: false, error: extractErrorMessage(data, res.status) };
    }

    return { sent: true };
  } catch (error) {
    console.error('mNotify SMS send error:', error);
    return { sent: false, error: 'Could not reach SMS provider.' };
  }
}
