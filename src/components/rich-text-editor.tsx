import { useCallback, useEffect, useRef } from "react";
import { Bold, Italic, Link2, List, ListOrdered } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  className?: string;
  placeholder?: string;
};

function exec(command: string, value?: string) {
  document.execCommand(command, false, value);
}

export function RichTextEditor({ value, onChange, className, placeholder }: RichTextEditorProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || "";
    }
  }, [value]);

  const handleInput = useCallback(() => {
    onChange(ref.current?.innerHTML ?? "");
  }, [onChange]);

  function addLink() {
    const url = window.prompt("Link URL");
    if (url) exec("createLink", url);
    handleInput();
  }

  return (
    <div className={cn("overflow-hidden rounded-xl border border-border bg-background", className)}>
      <div className="flex flex-wrap gap-1 border-b border-border bg-secondary/40 p-2">
        <Button type="button" size="icon" variant="ghost" className="h-8 w-8" aria-label="Bold" onClick={() => { exec("bold"); handleInput(); }}>
          <Bold className="h-4 w-4" />
        </Button>
        <Button type="button" size="icon" variant="ghost" className="h-8 w-8" aria-label="Italic" onClick={() => { exec("italic"); handleInput(); }}>
          <Italic className="h-4 w-4" />
        </Button>
        <Button type="button" size="icon" variant="ghost" className="h-8 w-8" aria-label="Bulleted list" onClick={() => { exec("insertUnorderedList"); handleInput(); }}>
          <List className="h-4 w-4" />
        </Button>
        <Button type="button" size="icon" variant="ghost" className="h-8 w-8" aria-label="Numbered list" onClick={() => { exec("insertOrderedList"); handleInput(); }}>
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button type="button" size="icon" variant="ghost" className="h-8 w-8" aria-label="Insert link" onClick={addLink}>
          <Link2 className="h-4 w-4" />
        </Button>
      </div>
      <div
        ref={ref}
        contentEditable
        role="textbox"
        aria-multiline="true"
        aria-label={placeholder ?? "Rich text editor"}
        data-placeholder={placeholder}
        className="min-h-[180px] px-3 py-3 text-sm leading-relaxed outline-none [&_a]:text-primary [&_a]:underline [&_li]:ml-4 [&_ol]:list-decimal [&_ul]:list-disc empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)]"
        onInput={handleInput}
        suppressContentEditableWarning
      />
    </div>
  );
}

export function RichTextContent({ html, className }: { html: string; className?: string }) {
  if (!html) return null;
  return (
    <div
      className={cn(
        "prose prose-sm max-w-none text-foreground/85 [&_a]:text-primary [&_a]:underline [&_li]:ml-4 [&_ol]:list-decimal [&_ul]:list-disc",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
