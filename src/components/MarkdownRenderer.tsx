import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Lightweight and secure Markdown renderer supporting:
 * - **bold**
 * - *italic*
 * - [links](url)
 * - - bullet lists
 * - Paragraphs and line breaks
 */
export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  if (!content) return null;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: string[] = [];

  const parseInline = (text: string): React.ReactNode[] => {
    // Regex matches **bold**, *italic*, [text](url)
    const tokens = text.split(/(\*\*.*?\*\*|\*.*?\*|\[.*?\]\(.*?\))/g);

    return tokens.map((token, idx) => {
      if (token.startsWith('**') && token.endsWith('**') && token.length >= 4) {
        return <strong key={idx} className="font-semibold text-slate-900">{token.slice(2, -2)}</strong>;
      }
      if (token.startsWith('*') && token.endsWith('*') && token.length >= 2) {
        return <em key={idx} className="italic font-editorial">{token.slice(1, -1)}</em>;
      }
      const linkMatch = token.match(/^\[(.*?)\]\((.*?)\)$/);
      if (linkMatch) {
        return (
          <a
            key={idx}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-600 hover:text-orange-700 underline underline-offset-2"
          >
            {linkMatch[1]}
          </a>
        );
      }
      return token;
    });
  };

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="list-disc list-inside space-y-1 my-1.5 pl-1">
          {currentList.map((item, i) => (
            <li key={i}>{parseInline(item)}</li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      currentList.push(trimmed.slice(2));
    } else {
      flushList();
      if (trimmed === '') {
        elements.push(<div key={`br-${idx}`} className="h-1.5" />);
      } else {
        elements.push(
          <p key={`p-${idx}`} className="leading-relaxed">
            {parseInline(line)}
          </p>
        );
      }
    }
  });

  flushList();

  return <div className={`space-y-1 ${className}`}>{elements}</div>;
}
