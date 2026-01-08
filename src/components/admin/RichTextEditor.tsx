import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { 
  Bold, 
  Italic, 
  Strikethrough, 
  List, 
  ListOrdered, 
  Quote, 
  Undo, 
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
  Heading1,
  Heading2,
  Heading3,
  Code,
  Minus,
  Pilcrow
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useCallback, useEffect } from 'react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ content, onChange, placeholder = "Start writing..." }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose dark:prose-invert max-w-none min-h-[300px] p-4 focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Update content when it changes externally
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter URL:', previousUrl);

    if (url === null) return;

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const addImage = useCallback(() => {
    if (!editor) return;
    
    const url = window.prompt('Enter image URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="border border-input rounded-lg overflow-hidden bg-background">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/30">
        {/* Text formatting */}
        <Toggle
          size="sm"
          pressed={editor.isActive('bold')}
          onPressedChange={() => editor.chain().focus().toggleBold().run()}
          aria-label="Bold"
        >
          <Bold className="w-4 h-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('italic')}
          onPressedChange={() => editor.chain().focus().toggleItalic().run()}
          aria-label="Italic"
        >
          <Italic className="w-4 h-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('strike')}
          onPressedChange={() => editor.chain().focus().toggleStrike().run()}
          aria-label="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('code')}
          onPressedChange={() => editor.chain().focus().toggleCode().run()}
          aria-label="Code"
        >
          <Code className="w-4 h-4" />
        </Toggle>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Headings */}
        <Toggle
          size="sm"
          pressed={editor.isActive('heading', { level: 1 })}
          onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          aria-label="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('heading', { level: 2 })}
          onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          aria-label="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('heading', { level: 3 })}
          onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          aria-label="Heading 3"
        >
          <Heading3 className="w-4 h-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('paragraph')}
          onPressedChange={() => editor.chain().focus().setParagraph().run()}
          aria-label="Paragraph"
        >
          <Pilcrow className="w-4 h-4" />
        </Toggle>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Lists */}
        <Toggle
          size="sm"
          pressed={editor.isActive('bulletList')}
          onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
          aria-label="Bullet List"
        >
          <List className="w-4 h-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('orderedList')}
          onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
          aria-label="Ordered List"
        >
          <ListOrdered className="w-4 h-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('blockquote')}
          onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
          aria-label="Blockquote"
        >
          <Quote className="w-4 h-4" />
        </Toggle>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Insert */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={setLink}
          className={cn("h-8 px-2", editor.isActive('link') && "bg-muted")}
        >
          <LinkIcon className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={addImage}
          className="h-8 px-2"
        >
          <ImageIcon className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="h-8 px-2"
        >
          <Minus className="w-4 h-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Undo/Redo */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="h-8 px-2"
        >
          <Undo className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="h-8 px-2"
        >
          <Redo className="w-4 h-4" />
        </Button>
      </div>

      {/* Editor content */}
      <EditorContent editor={editor} />

      {/* Character count */}
      <div className="flex justify-end px-3 py-2 border-t text-xs text-muted-foreground bg-muted/30">
        {editor.storage.characterCount?.characters?.() || editor.getText().length} characters
      </div>
    </div>
  );
}
