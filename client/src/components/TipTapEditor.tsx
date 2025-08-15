import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableHeader from '@tiptap/extension-table-header'
import TableCell from '@tiptap/extension-table-cell'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import { Button } from '@/components/ui/button'
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Link2, 
  Image as ImageIcon,
  Table as TableIcon,
  Plus,
  Minus,
  Palette,
  Highlighter
} from 'lucide-react'
import { useCallback, useEffect } from 'react'

interface TipTapEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  className?: string
}

export default function TipTapEditor({ content, onChange, placeholder, className }: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable the default link extension from StarterKit to avoid conflicts
        link: false,
      }),
      Table.configure({
        resizable: true,
        allowTableNodeSelection: true,
        cellMinWidth: 100,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline',
        },
      }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: `prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[300px] p-4 border border-input rounded-md ${className || ''}`,
        contenteditable: 'true',
        spellcheck: 'false',
      },
      handlePaste: (view, event, slice) => {
        const clipboardData = event.clipboardData
        if (!clipboardData) return false

        // Handle image paste
        const items = Array.from(clipboardData.items)
        const imageItem = items.find(item => item.type.startsWith('image/'))
        
        if (imageItem) {
          event.preventDefault()
          const file = imageItem.getAsFile()
          if (file) {
            const reader = new FileReader()
            reader.onload = () => {
              const base64 = reader.result as string
              editor?.chain().focus().setImage({ src: base64 }).run()
            }
            reader.readAsDataURL(file)
          }
          return true
        }

        // Handle Excel table paste (tab-separated values)
        const textData = clipboardData.getData('text/plain')
        if (textData && textData.includes('\t')) {
          event.preventDefault()
          
          const lines = textData.split('\n').filter(line => line.trim())
          if (lines.length > 1 && lines.some(line => line.includes('\t'))) {
            const tableData = lines.map(line => line.split('\t').map(cell => cell.trim()))
            const rows = tableData.length
            const cols = Math.max(...tableData.map(row => row.length))

            // Insert table with proper structure
            editor?.chain()
              .focus()
              .insertTable({ rows, cols, withHeaderRow: true })
              .run()

            // Fill table with data using HTML insertion method for better reliability
            setTimeout(() => {
              if (editor) {
                // Create HTML table with the data
                let tableHTML = '<table><tbody>'
                
                tableData.forEach((rowData, rowIndex) => {
                  const isHeader = rowIndex === 0
                  tableHTML += '<tr>'
                  
                  for (let colIndex = 0; colIndex < cols; colIndex++) {
                    const cellData = rowData[colIndex] || ''
                    const tag = isHeader ? 'th' : 'td'
                    tableHTML += `<${tag}>${cellData}</${tag}>`
                  }
                  
                  tableHTML += '</tr>'
                })
                
                tableHTML += '</tbody></table>'
                
                // Replace the empty table with populated one
                const { state } = editor
                const { selection } = state
                
                // Find the table node
                let tablePos = -1
                state.doc.descendants((node, pos) => {
                  if (node.type.name === 'table') {
                    tablePos = pos
                    return false
                  }
                })
                
                if (tablePos >= 0) {
                  // Delete the empty table and insert the populated one
                  editor.chain()
                    .deleteTable()
                    .insertContent(tableHTML)
                    .run()
                }
              }
            }, 100)
          }
          return true
        }

        return false // Let TipTap handle other paste events
      },
    },
  })

  // Update editor content when prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  const addImage = useCallback(() => {
    const url = window.prompt('이미지 URL을 입력하세요:')
    if (url) {
      editor?.chain().focus().setImage({ src: url }).run()
    }
  }, [editor])

  const setLink = useCallback(() => {
    const previousUrl = editor?.getAttributes('link').href
    const url = window.prompt('링크 URL을 입력하세요:', previousUrl)

    if (url === null) {
      return
    }

    if (url === '') {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  if (!editor) {
    return null
  }

  return (
    <div className="border border-input rounded-md">
      {/* Toolbar */}
      <div className="border-b border-input p-2 flex flex-wrap gap-1 bg-muted/50">
        {/* Text formatting */}
        <Button
          type="button"
          variant={editor.isActive('bold') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant={editor.isActive('italic') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant={editor.isActive('underline') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <Underline className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Lists */}
        <Button
          type="button"
          variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Link and Image */}
        <Button
          type="button"
          variant={editor.isActive('link') ? 'default' : 'ghost'}
          size="sm"
          onClick={setLink}
        >
          <Link2 className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={addImage}
        >
          <ImageIcon className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Table controls */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          title="표 삽입 (3x3)"
        >
          <TableIcon className="h-4 w-4" />
        </Button>

        {editor.isActive('table') && (
          <>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().addRowBefore().run()}
              title="위에 행 추가"
            >
              <Plus className="h-4 w-4" />
            </Button>
            
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().deleteRow().run()}
              title="행 삭제"
            >
              <Minus className="h-4 w-4" />
            </Button>
            
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().addColumnAfter().run()}
              title="오른쪽에 열 추가"
            >
              <Plus className="h-4 w-4 rotate-90" />
            </Button>
            
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().deleteColumn().run()}
              title="열 삭제"
            >
              <Minus className="h-4 w-4 rotate-90" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().deleteTable().run()}
              title="표 삭제"
            >
              <TableIcon className="h-4 w-4 text-red-600" />
            </Button>
          </>
        )}

        <div className="w-px h-6 bg-border mx-1" />

        {/* Text color and highlight */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            const color = window.prompt('텍스트 색상 (hex):', '#000000')
            if (color) {
              editor.chain().focus().setColor(color).run()
            }
          }}
          title="텍스트 색상"
        >
          <Palette className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant={editor.isActive('highlight') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleHighlight({ color: '#ffff00' }).run()}
          title="하이라이트"
        >
          <Highlighter className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor */}
      <EditorContent 
        editor={editor} 
        className="min-h-[300px]"
        placeholder={placeholder}
      />
    </div>
  )
}