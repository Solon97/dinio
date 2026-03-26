import { render, toPlainText } from "@react-email/render";
import type { ReactElement } from "react";

export async function renderEmailTemplate(template: ReactElement) {
  const html = await render(template);

  return {
    html,
    text: toPlainText(html),
  };
}