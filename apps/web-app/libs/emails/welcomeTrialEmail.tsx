import {
  Button,
  Hr,
  Link,
  Section,
  Text,
} from "@react-email/components";
import BaseEmail from "@/components/email/BaseEmail";
import config from "@/config";
import { extractFirstName } from "@/libs/emails/helpers";
import { renderEmailTemplate } from "@/libs/emails/renderEmailTemplate";
import { sendEmail } from "@/libs/resend";

const SUBJECT = "Seu período de teste começou — comece agora 🚀";
const CTA_URL = "https://app.dinio.com.br";
const INSTAGRAM_URL = "https://instagram.com/diniobr";

const paragraphStyle = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0 0 16px",
};

const buttonSectionStyle = {
  margin: "24px 0",
};

const buttonStyle = {
  backgroundColor: "#0d9488",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "700",
  padding: "12px 24px",
  textDecoration: "none",
};

const dividerStyle = {
  borderColor: "#e5e7eb",
  margin: "24px 0",
};

const linkStyle = {
  color: "#0d9488",
  textDecoration: "none",
};

export interface WelcomeTrialEmailProps {
  firstName?: string | null;
}

export interface WelcomeTrialEmailParams {
  to: string;
  name?: string | null;
}

export function WelcomeTrialEmail({ firstName }: WelcomeTrialEmailProps) {
  const greeting = firstName ? `Olá, ${firstName} —` : "Olá —";

  return (
    <BaseEmail preview="Seu acesso ao Dinio está ativo.">
      <Text style={paragraphStyle}>{greeting}</Text>
      <Text style={paragraphStyle}>Seu acesso ao Dinio está ativo.</Text>
      <Text style={paragraphStyle}>
        O Dinio faz uma coisa: calcula quanto você pode gastar por dia sem
        comprometer o fim do mês. Sem categorias, sem planilhas, sem culpa. Só
        um número claro que recalibra automaticamente conforme o mês passa.
      </Text>
      <Text style={paragraphStyle}>
        Para isso funcionar, você precisa configurar sua renda, seus gastos
        fixos e quanto quer guardar. Leva menos de 2 minutos.
      </Text>
      <Section style={buttonSectionStyle}>
        <Button href={CTA_URL} style={buttonStyle}>
          Configurar agora
        </Button>
      </Section>
      <Hr style={dividerStyle} />
      <Text style={paragraphStyle}>
        <strong>Algumas coisas que vale saber:</strong>
      </Text>
      <Text style={paragraphStyle}>
        💡 O seu teto diário é recalculado automaticamente. Você não precisa
        fazer nada além de registrar os gastos quando acontecem. Pode registrar diariamente, pelo app ou pelo whatsapp, como preferir.
        <br />
        📉 Se o mês apertar, o Dinio ajusta o teto. Se sobrar, também.
        <br />
        ⏳ O seu período de teste dura 14 dias.
      </Text>
      <Hr style={dividerStyle} />
      <Text style={paragraphStyle}>
        Se tiver qualquer dúvida, pode responder este e-mail ou me mandar um
        direct no Instagram. Respondo pessoalmente.
        <br />
        E se quiser acompanhar dicas e novidades do Dinio, pode seguir a gente lá também.
        <br />
        📷 <Link href={INSTAGRAM_URL} style={linkStyle}>@diniobr</Link>
      </Text>
      <Hr style={dividerStyle} />
      <Text style={paragraphStyle}>Bom período de teste. 🙌</Text>
    </BaseEmail>
  );
}

export async function sendWelcomeTrialEmail({
  to,
  name,
}: WelcomeTrialEmailParams) {
  const firstName = extractFirstName(name);
  const { html, text } = await renderEmailTemplate(
    <WelcomeTrialEmail firstName={firstName} />,
  );

  return sendEmail({
    to,
    subject: SUBJECT,
    text,
    html,
    replyTo: config.resend.replyToAdmin || config.resend.fromAdmin,
  });
}