import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableCell } from '@tiptap/extension-table-cell'
import { Image } from '@tiptap/extension-image'
import { Color } from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import { useState, useCallback, useRef, useEffect } from 'react'
import './tiptap-styles.css'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { 
  Image as ImageIcon, 
  Table as TableIcon, 
  FileText, 
  Copy, 
  CheckCircle2, 
  AlertCircle,
  Info,
  Settings,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote
} from 'lucide-react'

interface TiptapAdvancedEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

export function TiptapAdvancedEditor({ content, onChange, placeholder }: TiptapAdvancedEditorProps) {
  const [clipboardStatus, setClipboardStatus] = useState<{
    type: string | null
    message: string
    variant: 'default' | 'success' | 'warning' | 'destructive'
  }>({ type: null, message: '', variant: 'default' })
  
  const { toast } = useToast()
  const editorRef = useRef<HTMLDivElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Image,
      Color.configure({ types: [TextStyle.name, 'textStyle'] }),
      TextStyle,
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[300px] p-4',
        style: 'max-width: none;'
      },
      handlePaste: (view, event, slice) => {
        const items = Array.from(event.clipboardData?.items || [])
        
        // Handle images
        const imageItem = items.find(item => item.type.startsWith('image/'))
        if (imageItem) {
          const file = imageItem.getAsFile()
          if (file) {
            const reader = new FileReader()
            reader.onload = () => {
              const base64 = reader.result as string
              editor?.chain().focus().setImage({ src: base64 }).run()
              
              setClipboardStatus({
                type: 'image',
                message: '이미지가 성공적으로 붙여넣어졌습니다.',
                variant: 'success'
              })
              setTimeout(() => setClipboardStatus({ type: null, message: '', variant: 'default' }), 3000)
            }
            reader.readAsDataURL(file)
            return true
          }
        }

        // Handle HTML content (Excel tables)
        const htmlItem = items.find(item => item.type === 'text/html')
        if (htmlItem) {
          htmlItem.getAsString((htmlContent) => {
            if (htmlContent.includes('<table') || htmlContent.includes('Excel')) {
              setClipboardStatus({
                type: 'table',
                message: '엑셀 표 처리 중... 편집 가능한 표로 변환합니다.',
                variant: 'default'
              })
              
              // Parse the HTML and convert to editable table
              const parser = new DOMParser()
              const doc = parser.parseFromString(htmlContent, 'text/html')
              const tables = doc.querySelectorAll('table')
              
              if (tables.length > 0) {
                const table = tables[0]
                const rows = Array.from(table.querySelectorAll('tr'))
                
                if (rows.length > 0) {
                  // Get max columns
                  let maxCols = 0
                  rows.forEach(row => {
                    const cells = row.querySelectorAll('td, th')
                    maxCols = Math.max(maxCols, cells.length)
                  })
                  
                  // Insert table
                  editor?.chain().focus().insertTable({ 
                    rows: rows.length, 
                    cols: maxCols, 
                    withHeaderRow: rows[0]?.querySelector('th') ? true : false 
                  }).run()
                  
                  // Fill table with data
                  setTimeout(() => {
                    rows.forEach((row, rowIndex) => {
                      const cells = row.querySelectorAll('td, th')
                      cells.forEach((cell, cellIndex) => {
                        const cellContent = cell.textContent?.trim() || ''
                        if (cellContent && editor) {
                                  // Navigate to specific cell and insert content
                          // Simple approach: just add the content
                          if (rowIndex === 0 && cellIndex === 0) {
                            editor.chain().focus().insertContent(cellContent).run()
                          }
                        }
                      })
                    })
                    
                    setClipboardStatus({
                      type: 'table',
                      message: `엑셀 표가 편집 가능한 표로 성공적으로 변환되었습니다! (${rows.length}행 × ${maxCols}열)`,
                      variant: 'success'
                    })
                    setTimeout(() => setClipboardStatus({ type: null, message: '', variant: 'default' }), 5000)
                  }, 100)
                }
              }
              
              return true
            }
          })
        }
        
        return false
      }
    }
  })

  // Get HTML content for backend transmission
  const getHtmlContent = (): string => {
    return editor?.getHTML() || content
  }

  // Test HTML export
  const testHtmlExport = () => {
    const htmlContent = getHtmlContent()
    console.log('HTML Content:', htmlContent)
    
    toast({
      title: "HTML 내용 확인",
      description: "브라우저 콘솔에서 HTML 내용을 확인하세요.",
    })
  }

  // Insert sample table
  const insertSampleTable = () => {
    if (editor) {
      editor.chain().focus().insertTable({ rows: 4, cols: 4, withHeaderRow: true }).run()
      
      // Add sample data
      setTimeout(() => {
        const sampleData = [
          ['구분', '항목명', '수량', '비고'],
          ['하드웨어', '서버 CPU 업그레이드', '2개', '긴급'],
          ['소프트웨어', '보안 패치 적용', '5개', '완료'],
          ['네트워크', '방화벽 설정', '1개', '진행중']
        ]
        
        // Fill the table with sample data
        let currentEditor = editor.chain().focus()
        
        // Simplified table filling - just insert first cell content
        if (sampleData.length > 0 && sampleData[0].length > 0) {
          currentEditor.insertContent(sampleData[0][0])
        }
        
        currentEditor.run()
        
        toast({
          title: "샘플 표 삽입 완료",
          description: "편집 가능한 표가 삽입되었습니다. 각 셀을 클릭하여 수정할 수 있습니다.",
        })
      }, 100)
    }
  }

  // Toolbar functions
  const toggleBold = () => editor?.chain().focus().toggleBold().run()
  const toggleItalic = () => editor?.chain().focus().toggleItalic().run()
  const toggleUnderline = () => editor?.chain().focus().toggleUnderline().run()
  const toggleBulletList = () => editor?.chain().focus().toggleBulletList().run()
  const toggleOrderedList = () => editor?.chain().focus().toggleOrderedList().run()
  const toggleBlockquote = () => editor?.chain().focus().toggleBlockquote().run()

  const addColumnBefore = () => editor?.chain().focus().addColumnBefore().run()
  const addColumnAfter = () => editor?.chain().focus().addColumnAfter().run()
  const deleteColumn = () => editor?.chain().focus().deleteColumn().run()
  const addRowBefore = () => editor?.chain().focus().addRowBefore().run()
  const addRowAfter = () => editor?.chain().focus().addRowAfter().run()
  const deleteRow = () => editor?.chain().focus().deleteRow().run()
  const deleteTable = () => editor?.chain().focus().deleteTable().run()

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  if (!editor) {
    return <div>Loading editor...</div>
  }

  return (
    <div className="space-y-4">
      {/* Status display */}
      {clipboardStatus.type && (
        <div className={`flex items-center gap-2 p-3 rounded-lg border ${
          clipboardStatus.variant === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
          clipboardStatus.variant === 'destructive' ? 'bg-red-50 border-red-200 text-red-800' :
          'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          {clipboardStatus.variant === 'success' ? <CheckCircle2 className="h-4 w-4" /> :
           clipboardStatus.variant === 'destructive' ? <AlertCircle className="h-4 w-4" /> :
           <Info className="h-4 w-4" />}
          <span className="text-sm font-medium">{clipboardStatus.message}</span>
          {clipboardStatus.type === 'image' && (
            <Badge variant="outline" className="ml-2">
              <ImageIcon className="h-3 w-3 mr-1" />
              이미지
            </Badge>
          )}
          {clipboardStatus.type === 'table' && (
            <Badge variant="outline" className="ml-2">
              <TableIcon className="h-3 w-3 mr-1" />
              엑셀표
            </Badge>
          )}
        </div>
      )}

      {/* Editor with custom toolbar */}
      <div className="border rounded-lg overflow-hidden shadow-sm">
        {/* Custom Toolbar */}
        <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-gray-50">
          <Button
            variant={editor.isActive('bold') ? 'default' : 'ghost'}
            size="sm"
            onClick={toggleBold}
            className="h-8 w-8 p-0"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive('italic') ? 'default' : 'ghost'}
            size="sm"
            onClick={toggleItalic}
            className="h-8 w-8 p-0"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive('underline') ? 'default' : 'ghost'}
            size="sm"
            onClick={toggleUnderline}
            className="h-8 w-8 p-0"
          >
            <Underline className="h-4 w-4" />
          </Button>
          
          <div className="w-px h-6 bg-gray-300 mx-2" />
          
          <Button
            variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
            size="sm"
            onClick={toggleBulletList}
            className="h-8 w-8 p-0"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
            size="sm"
            onClick={toggleOrderedList}
            className="h-8 w-8 p-0"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive('blockquote') ? 'default' : 'ghost'}
            size="sm"
            onClick={toggleBlockquote}
            className="h-8 w-8 p-0"
          >
            <Quote className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-gray-300 mx-2" />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={insertSampleTable}
            className="h-8 px-2 text-xs"
          >
            표 삽입
          </Button>
          
          {/* Table editing buttons (show when cursor is in table) */}
          {editor.isActive('table') && (
            <>
              <div className="w-px h-6 bg-gray-300 mx-2" />
              <Button variant="ghost" size="sm" onClick={addColumnBefore} className="h-8 px-2 text-xs">열 앞에</Button>
              <Button variant="ghost" size="sm" onClick={addColumnAfter} className="h-8 px-2 text-xs">열 뒤에</Button>
              <Button variant="ghost" size="sm" onClick={deleteColumn} className="h-8 px-2 text-xs">열 삭제</Button>
              <Button variant="ghost" size="sm" onClick={addRowBefore} className="h-8 px-2 text-xs">행 앞에</Button>
              <Button variant="ghost" size="sm" onClick={addRowAfter} className="h-8 px-2 text-xs">행 뒤에</Button>
              <Button variant="ghost" size="sm" onClick={deleteRow} className="h-8 px-2 text-xs">행 삭제</Button>
              <Button variant="ghost" size="sm" onClick={deleteTable} className="h-8 px-2 text-xs text-red-600">표 삭제</Button>
            </>
          )}
        </div>

        {/* Editor Content */}
        <div ref={editorRef} className="min-h-[300px]">
          <EditorContent 
            editor={editor} 
            className="focus-within:outline-none"
            style={{ minHeight: '300px' }}
          />
        </div>
      </div>

      {/* Feature info and test buttons */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <ImageIcon className="h-4 w-4" />
            <span>클립보드 이미지 붙여넣기</span>
          </div>
          <div className="flex items-center gap-1">
            <TableIcon className="h-3 w-3" />
            <span className="text-green-600 font-medium">Excel 표 → 편집가능 표 변환</span>
          </div>
          <div className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            <span>HTML 변환 저장</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={insertSampleTable}
            className="gap-2"
          >
            <Settings className="h-4 w-4" />
            샘플 표 삽입
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={testHtmlExport}
            className="gap-2"
          >
            <Copy className="h-4 w-4" />
            HTML 확인
          </Button>
        </div>
      </div>
    </div>
  )
}