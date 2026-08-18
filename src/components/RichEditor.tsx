import React, { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { TableKit } from '@tiptap/extension-table'
import { common, createLowlight } from 'lowlight'
import EditorToolbar from './EditorToolbar'
import { toEditorHtml } from '../utils/editorContent'

const lowlight = createLowlight(common)

interface RichEditorProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
}

const RichEditor: React.FC<RichEditorProps> = ({ content, onChange, placeholder }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'editor-image',
        },
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
      TableKit,
    ],
    // Normalize Markdown → HTML so TipTap never receives raw Markdown.
    // Raw Markdown would be treated as plain text and escaped into a <p>,
    // mangling the article (see issue: imported MD shows as source code).
    content: toEditorHtml(content ?? ''),
    editorProps: {
      attributes: {
        class: 'tiptap-editor-content',
        'data-placeholder': placeholder || '开始写作...',
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML())
    },
  })

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(toEditorHtml(content))
    }
  }, [content]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="tiptap-editor-wrapper">
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}

export default RichEditor