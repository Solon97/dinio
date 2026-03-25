import { Link, Section, Text } from "@react-email/components";

const INSTAGRAM_URL = "https://instagram.com/diniobr";
const WEBSITE_URL = "https://dinio.com.br";

const sectionStyle = {
  marginTop: "0",
};

const nameStyle = {
  color: "#111827",
  fontSize: "14px",
  fontWeight: "700",
  lineHeight: "20px",
  margin: "0 0 4px",
};

const detailStyle = {
  color: "#4b5563",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "0 0 4px",
};

const linkStyle = {
  color: "#0d9488",
  textDecoration: "none",
};

export function EmailSignature() {
  return (
    <Section style={sectionStyle}>
      <Text style={nameStyle}>Solon Barbosa</Text>
      <Text style={detailStyle}>Fundador | Dinio</Text>
      <Text style={detailStyle}>
        ✉️ <Link href="mailto:solon@dinio.com.br" style={linkStyle}>solon@dinio.com.br</Link>
      </Text>
      <Text style={detailStyle}>
        🌐 <Link href={WEBSITE_URL} style={linkStyle}>dinio.com.br</Link>
      </Text>
      <Text style={detailStyle}>
        📷 <Link href={INSTAGRAM_URL} style={linkStyle}>@diniobr</Link>
      </Text>
    </Section>
  );
}