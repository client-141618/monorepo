import DOMPurify from "dompurify"

export function sanitizeRichHtml(html: string) {
  return DOMPurify.sanitize(html, {
    FORBID_TAGS: [
      "script",
      "style",
      "iframe",
      "object",
      "embed",
      "form",
      "input",
      "button",
    ],
    FORBID_ATTR: ["style", "onerror", "onload", "onclick"],
  })
}
