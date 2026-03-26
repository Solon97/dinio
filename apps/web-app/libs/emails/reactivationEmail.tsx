import { Text } from "@react-email/components";
import BaseEmail from "@/components/email/BaseEmail";
import config from "@/config";
import { extractFirstName } from "@/libs/emails/helpers";
import { renderEmailTemplate } from "@/libs/emails/renderEmailTemplate";
import { sendEmail } from "@/libs/resend";

const SUBJECT = "O que aconteceu?";

const paragraphStyle = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0 0 16px",
};

export interface ReactivationEmailProps {
  firstName?: string | null;
}

export interface ReactivationEmailParams {
  to: string;
  name?: string | null;
}

export function ReactivationEmail({ firstName }: ReactivationEmailProps) {
  const greeting = firstName ? `Oi, ${firstName}, tudo bem?` : "Oi, tudo bem?";

  return (
    <BaseEmail preview="Queria entender o que travou na ativação do seu teste.">
      <Text style={paragraphStyle}>{greeting}</Text>
      <Text style={paragraphStyle}>
        Vi que você passou pelo Dinio mas não chegou a ativar o teste gratuito.
      </Text>
      <Text style={paragraphStyle}>
        Queria entender o que aconteceu — não precisa ser longo, uma linha já
        me ajuda.
      </Text>
      <Text style={paragraphStyle}>
        Foi o preço?
        <br />
        A forma de pagamento?
        <br />
        Alguma dúvida sobre como funciona?
      </Text>
      <Text style={paragraphStyle}>
        Se você me contar o que travou e ainda tiver interesse no Dinio, te dou
        30 dias de teste gratuito para experimentar sem pressa.
      </Text>
      <Text style={paragraphStyle}>
        Lembrando que a cobrança só começaria depois dos 30 dias, e você ainda
        teria mais 7 dias de garantia após a cobrança.
      </Text>
      <Text style={paragraphStyle}>
        Fico no aguardo, e de qualquer forma, obrigado por ter dado uma chance
        para o Dinio :)
      </Text>
    </BaseEmail>
  );
}

export async function sendReactivationEmail({
  to,
  name,
}: ReactivationEmailParams) {
  const firstName = extractFirstName(name);
  const { html, text } = await renderEmailTemplate(
    <ReactivationEmail firstName={firstName} />,
  );

  return sendEmail({
    to,
    subject: SUBJECT,
    text,
    html,
    replyTo: config.resend.replyToAdmin || config.resend.fromAdmin,
  });
}