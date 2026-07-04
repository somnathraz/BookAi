export interface WhatsAppBookingPrefill {
  siteName: string;
  visitorName?: string;
  preferredDate?: string;
  preferredTime?: string;
  service?: string;
  notes?: string;
}

export function buildWhatsAppBookingUrl(
  phoneDigits: string,
  prefill: WhatsAppBookingPrefill
): string {
  const digits = phoneDigits.replace(/\D/g, "");
  const lines = [
    `Hi, I'd like to book at ${prefill.siteName}.`,
    prefill.visitorName ? `Name: ${prefill.visitorName}` : null,
    prefill.service ? `Service: ${prefill.service}` : null,
    prefill.preferredDate ? `Preferred date: ${prefill.preferredDate}` : null,
    prefill.preferredTime ? `Preferred time: ${prefill.preferredTime}` : null,
    prefill.notes ? `Notes: ${prefill.notes}` : null,
  ].filter(Boolean);

  const text = encodeURIComponent(lines.join("\n"));
  return `https://wa.me/${digits}?text=${text}`;
}
