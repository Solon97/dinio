import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
} from "@react-email/components";
import type { ReactNode } from "react";
import { EmailSignature } from "@/components/email/EmailSignature";

interface BaseEmailProps {
  children: ReactNode;
  preview: string;
}

const bodyStyle = {
  backgroundColor: "#f8fafc",
  fontFamily: "Arial, sans-serif",
  margin: "0",
  padding: "24px 0",
};

const containerStyle = {
  backgroundColor: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "12px",
  margin: "0 auto",
  maxWidth: "600px",
  padding: "32px",
};

const dividerStyle = {
  borderColor: "#e5e7eb",
  margin: "24px 0",
};

export default function BaseEmail({ children, preview }: BaseEmailProps) {
  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Section>{children}</Section>
          <Hr style={dividerStyle} />
          <EmailSignature />
        </Container>
      </Body>
    </Html>
  );
}