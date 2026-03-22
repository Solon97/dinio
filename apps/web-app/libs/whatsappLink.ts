const DEFAULT_WHATSAPP_BIND_MESSAGE = "Olá, quero vincular meu WhatsApp ao Dinio";

export function getWhatsappBindLink(
  botPhone = process.env.NEXT_PUBLIC_WHATSAPP_BOT_PHONE,
): string | null {
  if (!botPhone) return null;

  return `https://wa.me/${botPhone}?text=${encodeURIComponent(DEFAULT_WHATSAPP_BIND_MESSAGE)}`;
}
