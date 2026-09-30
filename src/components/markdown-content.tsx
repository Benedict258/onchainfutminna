import { cn } from "@/lib/utils";

interface MarkdownContentProps {
  content: string;
  className?: string;
}

function parseMarkdown(content: string) {
  const lines = content.split("\n");
  const elements: Array<{
    type: string;
    text?: string;
    items?: string[];
    language?: string;
    lines?: string[];
    href?: string;
  }> = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("```")) {
      const language = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push({ type: "code", language, lines: codeLines });
      i++;
      continue;
    }

    if (line.startsWith("# ")) {
      elements.push({ type: "h2", text: line.slice(2).trim() });
      i++;
      continue;
    }

    if (line.startsWith("## ")) {
      elements.push({ type: "h3", text: line.slice(3).trim() });
      i++;
      continue;
    }

    if (line.startsWith("### ")) {
      elements.push({ type: "h4", text: line.slice(4).trim() });
      i++;
      continue;
    }

    if (line.match(/^[-*]\s/)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^[-*]\s/)) {
        items.push(lines[i].replace(/^[-*]\s/, "").trim());
        i++;
      }
      elements.push({ type: "list", items });
      continue;
    }

    if (line.match(/^\d+\.\s/)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^\d+\.\s/)) {
        items.push(lines[i].replace(/^\d+\.\s/, "").trim());
        i++;
      }
      elements.push({ type: "orderedList", items });
      continue;
    }

    if (line.trim() === "") {
      i++;
      continue;
    }

    const paragraphLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].startsWith("#") &&
      !lines[i].match(/^[-*\d]\.?\s/) &&
      !lines[i].startsWith("```")
    ) {
      paragraphLines.push(lines[i]);
      i++;
    }
    if (paragraphLines.length > 0) {
      elements.push({ type: "paragraph", text: paragraphLines.join("\n") });
    }
  }

  return elements;
}

function renderInlineMarkdown(
  text: string,
): (string | { type: string; content: string; href?: string })[] {
  const result: (string | { type: string; content: string; href?: string })[] = [];
  const regex = /(\*\*(.+?)\*\*|\[(.+?)\]\((.+?)\)|`(.+?)`|\*(.+?)\*)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      result.push(text.slice(lastIndex, match.index));
    }

    if (match[2] !== undefined) {
      result.push({ type: "bold", content: match[2] });
    } else if (match[3] !== undefined && match[4] !== undefined) {
      result.push({ type: "link", content: match[3], href: match[4] });
    } else if (match[5] !== undefined) {
      result.push({ type: "code", content: match[5] });
    } else if (match[6] !== undefined) {
      result.push({ type: "italic", content: match[6] });
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    result.push(text.slice(lastIndex));
  }

  return result;
}

function InlineContent({ parts }: { parts: ReturnType<typeof renderInlineMarkdown> }) {
  return (
    <>
      {parts.map((part, i) => {
        if (typeof part === "string") return <span key={i}>{part}</span>;
        if (part.type === "bold")
          return (
            <strong key={i} className="font-semibold text-primary">
              {part.content}
            </strong>
          );
        if (part.type === "italic")
          return (
            <em key={i} className="italic text-muted-foreground">
              {part.content}
            </em>
          );
        if (part.type === "code")
          return (
            <code
              key={i}
              className="px-1 py-0.5 rounded bg-surface-high text-primary text-sm font-mono"
            >
              {part.content}
            </code>
          );
        if (part.type === "link")
          return (
            <a
              key={i}
              href={part.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
            >
              {part.content}
            </a>
          );
        return null;
      })}
    </>
  );
}

export function MarkdownContent({ content, className }: MarkdownContentProps) {
  if (!content) {
    return <p className="text-muted-foreground italic">No content available.</p>;
  }

  const elements = parseMarkdown(content);

  return (
    <div className={cn("space-y-5 text-body-md leading-relaxed", className)}>
      {elements.map((el, i) => {
        switch (el.type) {
          case "h2":
            return (
              <h2 key={i} className="text-headline-md text-foreground mt-8 mb-3 first:mt-0">
                {el.text}
              </h2>
            );
          case "h3":
            return (
              <h3 key={i} className="text-headline-sm text-foreground mt-6 mb-2">
                {el.text}
              </h3>
            );
          case "h4":
            return (
              <h4 key={i} className="text-label-lg font-semibold text-foreground mt-4 mb-1">
                {el.text}
              </h4>
            );
          case "paragraph":
            return (
              <p key={i} className="text-muted-foreground">
                <InlineContent parts={renderInlineMarkdown(el.text || "")} />
              </p>
            );
          case "list":
            return (
              <ul
                key={i}
                className="list-disc pl-6 space-y-1.5 text-muted-foreground marker:text-primary/60"
              >
                {(el.items || []).map((item, j) => (
                  <li key={j} className="pl-1">
                    <InlineContent parts={renderInlineMarkdown(item)} />
                  </li>
                ))}
              </ul>
            );
          case "orderedList":
            return (
              <ol
                key={i}
                className="list-decimal pl-6 space-y-1.5 text-muted-foreground marker:text-primary/60"
              >
                {(el.items || []).map((item, j) => (
                  <li key={j} className="pl-1">
                    <InlineContent parts={renderInlineMarkdown(item)} />
                  </li>
                ))}
              </ol>
            );
          case "code":
            return (
              <pre
                key={i}
                className="overflow-x-auto rounded-lg border border-border bg-surface-low p-4 text-sm font-mono text-muted-foreground"
              >
                {(el.lines || []).map((codeLine, j) => (
                  <div key={j}>{codeLine || " "}</div>
                ))}
              </pre>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
