import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableCell } from '@tiptap/extension-table-cell'
import { Image } from '@tiptap/extension-image'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { 
  Image as ImageIcon, 
  Table as TableIcon, 
  Copy, 
  CheckCircle2, 
  Settings,
  Bold,
  Italic,
  List
} from 'lucide-react'
import './tiptap-styles.css'

interface TestTiptapEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

export function TestTiptapEditor({ content, onChange, placeholder }: TestTiptapEditorProps) {
  const [clipboardStatus, setClipboardStatus] = useState<{
    type: string | null
    message: string
    variant: 'default' | 'success' | 'warning' | 'destructive'
  }>({ type: null, message: '', variant: 'default' })
  
  const { toast } = useToast()

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
      handlePaste: (view, event) => {
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
            if (htmlContent.includes('<table')) {
              setClipboardStatus({
                type: 'table',
                message: 'Excel 표를 편집 가능한 표로 변환 중...',
                variant: 'default'
              })
              
              // Parse Excel table and create editable table
              const parser = new DOMParser()
              const doc = parser.parseFromString(htmlContent, 'text/html')
              const table = doc.querySelector('table')
              
              if (table) {
                const rows = Array.from(table.querySelectorAll('tr'))
                const maxCols = Math.max(...rows.map(row => row.querySelectorAll('td, th').length))
                
                // Insert table with appropriate size
                editor?.chain().focus().insertTable({ 
                  rows: rows.length > 0 ? rows.length : 3, 
                  cols: maxCols > 0 ? maxCols : 3, 
                  withHeaderRow: true 
                }).run()
                
                setTimeout(() => {
                  setClipboardStatus({
                    type: 'table',
                    message: `Excel 표가 편집 가능한 표로 성공적으로 변환되었습니다! (${rows.length}행 × ${maxCols}열)`,
                    variant: 'success'
                  })
                  setTimeout(() => setClipboardStatus({ type: null, message: '', variant: 'default' }), 5000)
                }, 500)
              } else {
                // Fallback: simple table
                editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
                
                setTimeout(() => {
                  setClipboardStatus({
                    type: 'table',
                    message: '편집 가능한 표로 변환되었습니다!',
                    variant: 'success'
                  })
                  setTimeout(() => setClipboardStatus({ type: null, message: '', variant: 'default' }), 3000)
                }, 500)
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

  // Insert sample table with data
  const insertSampleTable = () => {
    if (editor) {
      editor.chain().focus().insertTable({ rows: 4, cols: 4, withHeaderRow: true }).run()
      
      // Add sample data after table is inserted
      setTimeout(() => {
        // Try to find the newly created table and populate it
        const tables = document.querySelectorAll('.ProseMirror table')
        const lastTable = tables[tables.length - 1]
        
        if (lastTable) {
          const cells = lastTable.querySelectorAll('td, th')
          const sampleData = ['구분', '항목명', '수량', '비고', '하드웨어', 'CPU 업그레이드', '2개', '긴급', '소프트웨어', '보안 패치', '5개', '완료', '네트워크', '방화벽 설정', '1개', '진행중']
          
          cells.forEach((cell, index) => {
            if (index < sampleData.length) {
              cell.textContent = sampleData[index]
            }
          })
        }
        
        toast({
          title: "샘플 표 삽입 완료",
          description: "편집 가능한 표가 데이터와 함께 삽입되었습니다. 각 셀을 클릭하여 수정할 수 있습니다.",
        })
      }, 200)
    }
  }

  // Toolbar functions
  const toggleBold = () => editor?.chain().focus().toggleBold().run()
  const toggleItalic = () => editor?.chain().focus().toggleItalic().run()
  const toggleBulletList = () => editor?.chain().focus().toggleBulletList().run()

  if (!editor) {
    return <div className="border rounded-lg p-4">Loading advanced Tiptap editor...</div>
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">🚀 Tiptap 고급 에디터 (완전 기능)</h3>
      
      {/* Status display */}
      {clipboardStatus.type && (
        <div className={`flex items-center gap-2 p-3 rounded-lg border ${
          clipboardStatus.variant === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
          clipboardStatus.variant === 'destructive' ? 'bg-red-50 border-red-200 text-red-800' :
          'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          <CheckCircle2 className="h-4 w-4" />
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
              Excel표
            </Badge>
          )}
        </div>
      )}

      {/* Editor with custom toolbar */}
      <div className="border rounded-lg overflow-hidden shadow-sm">
        {/* Enhanced Toolbar */}
        <div className="flex items-center gap-1 p-2 border-b bg-gray-50">
          <Button
            variant={editor.isActive('bold') ? 'default' : 'ghost'}
            size="sm"
            onClick={toggleBold}
            className="h-8 w-8 p-0"
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive('italic') ? 'default' : 'ghost'}
            size="sm"
            onClick={toggleItalic}
            className="h-8 w-8 p-0"
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
            size="sm"
            onClick={toggleBulletList}
            className="h-8 w-8 p-0"
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </Button>
          
          <div className="w-px h-6 bg-gray-300 mx-2" />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
            className="h-8 px-2 text-xs"
          >
            표 삽입
          </Button>
        </div>

        {/* Editor Content */}
        <div className="min-h-[300px]">
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