import { useState, useRef, useEffect, useCallback } from 'react'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { 
  Image, 
  Table, 
  FileText, 
  Copy, 
  CheckCircle2, 
  AlertCircle,
  Info,
  Settings
} from 'lucide-react'

interface QuillAdvancedEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

export function QuillAdvancedEditor({ content, onChange, placeholder }: QuillAdvancedEditorProps) {
  const [editorInstance, setEditorInstance] = useState<any>(null)
  const [clipboardStatus, setClipboardStatus] = useState<{
    type: string | null
    message: string
    variant: 'default' | 'success' | 'warning' | 'destructive'
  }>({ type: null, message: '', variant: 'default' })
  
  const quillRef = useRef<ReactQuill>(null)
  const { toast } = useToast()

  // Enhanced modules configuration
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'font': [] }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['blockquote', 'code-block'],
      ['link', 'image', 'video'],
      ['clean']
    ],
    history: {
      delay: 2000,
      maxStack: 500,
      userOnly: true
    }
  }

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image', 'video',
    'color', 'background',
    'align', 'code-block'
  ]

  // Handle paste events for better Excel support
  const handlePaste = useCallback((event: ClipboardEvent) => {
    const items = Array.from(event.clipboardData?.items || [])
    
    // Check for images first
    const imageItem = items.find(item => item.type.startsWith('image/'))
    if (imageItem) {
      event.preventDefault()
      const file = imageItem.getAsFile()
      if (file && editorInstance) {
        const reader = new FileReader()
        reader.onload = () => {
          const base64 = reader.result as string
          const range = editorInstance.getSelection(true)
          editorInstance.insertEmbed(range.index, 'image', base64, 'user')
          editorInstance.setSelection(range.index + 1, 0)
          
          setClipboardStatus({
            type: 'image',
            message: '이미지가 성공적으로 붙여넣어졌습니다.',
            variant: 'success'
          })
          setTimeout(() => setClipboardStatus({ type: null, message: '', variant: 'default' }), 3000)
        }
        reader.readAsDataURL(file)
      }
      return
    }
    
    // Check for HTML content (Excel tables)
    const htmlItem = items.find(item => item.type === 'text/html')
    if (htmlItem) {
      htmlItem.getAsString((htmlContent) => {
        if (htmlContent.includes('<table') || htmlContent.includes('Excel')) {
          setClipboardStatus({
            type: 'table',
            message: '엑셀 표 처리 중... 서식을 보존합니다.',
            variant: 'default'
          })
          
          // Clean and insert the table HTML
          let cleanedHtml = htmlContent
            .replace(/<o:p\s*\/?>|<\/o:p>/gi, '')
            .replace(/mso-[^;]+;?/gi, '') // Remove Microsoft Office specific styles
            .replace(/class="[^"]*"/gi, '') // Remove class attributes that might conflict
          
          // Add basic table styling
          cleanedHtml = cleanedHtml.replace(/<table[^>]*>/gi, '<table style="border-collapse: collapse; width: 100%; margin: 10px 0;">')
          cleanedHtml = cleanedHtml.replace(/<td([^>]*)>/gi, '<td$1 style="border: 1px solid #ccc; padding: 8px; vertical-align: top;">')
          cleanedHtml = cleanedHtml.replace(/<th([^>]*)>/gi, '<th$1 style="border: 1px solid #ccc; padding: 8px; background-color: #f5f5f5; font-weight: bold;">')
          
          if (editorInstance) {
            const range = editorInstance.getSelection(true)
            editorInstance.clipboard.dangerouslyPasteHTML(range.index, cleanedHtml, 'user')
          }
          
          setTimeout(() => {
            setClipboardStatus({
              type: 'table',
              message: '엑셀 표가 성공적으로 붙여넣어졌습니다. 서식이 보존되었습니다.',
              variant: 'success'
            })
            setTimeout(() => setClipboardStatus({ type: null, message: '', variant: 'default' }), 5000)
          }, 500)
        }
      })
    }
  }, [editorInstance])

  // Setup editor and paste handlers
  useEffect(() => {
    if (quillRef.current) {
      const quill = quillRef.current.getEditor()
      setEditorInstance(quill)
      
      // Add paste event listener
      const editorElement = quill.root
      editorElement.addEventListener('paste', handlePaste)
      
      // Note: Table functionality will be handled through sample insertion and clipboard paste
      
      return () => {
        editorElement.removeEventListener('paste', handlePaste)
      }
    }
  }, [handlePaste])

  // Get HTML content for backend transmission
  const getHtmlContent = (): string => {
    if (!editorInstance) return content
    return editorInstance.root.innerHTML
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

  // Insert sample table for testing
  const insertSampleTable = () => {
    if (editorInstance) {
      const range = editorInstance.getSelection(true)
      const sampleTable = `
        <table style="border-collapse: collapse; width: 100%; margin: 10px 0;">
          <tbody>
            <tr>
              <th style="border: 1px solid #000; padding: 8px; background-color: #e6f3ff; font-weight: bold; text-align: center;">구분</th>
              <th style="border: 1px solid #000; padding: 8px; background-color: #e6f3ff; font-weight: bold; text-align: center;">항목명</th>
              <th style="border: 1px solid #000; padding: 8px; background-color: #e6f3ff; font-weight: bold; text-align: center;">수량</th>
              <th style="border: 1px solid #000; padding: 8px; background-color: #e6f3ff; font-weight: bold; text-align: center;">비고</th>
            </tr>
            <tr>
              <td style="border: 1px solid #000; padding: 8px; text-align: center; background-color: #fff2e6;">하드웨어</td>
              <td style="border: 1px solid #000; padding: 8px;">서버 CPU 업그레이드</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: right; font-weight: bold;">2개</td>
              <td style="border: 1px solid #000; padding: 8px; color: #d63384;">긴급</td>
            </tr>
            <tr>
              <td style="border: 1px solid #000; padding: 8px; text-align: center; background-color: #e6f9f0;">소프트웨어</td>
              <td style="border: 1px solid #000; padding: 8px;">보안 패치 적용</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: right; font-weight: bold;">5개</td>
              <td style="border: 1px solid #000; padding: 8px; color: #198754;">완료</td>
            </tr>
          </tbody>
        </table>
      `
      
      editorInstance.clipboard.dangerouslyPasteHTML(range.index, sampleTable, 'user')
      editorInstance.setSelection(range.index + 1, 0)
      
      toast({
        title: "샘플 표 삽입 완료",
        description: "서식이 포함된 표가 삽입되었습니다.",
      })
    }
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
              <Image className="h-3 w-3 mr-1" />
              이미지
            </Badge>
          )}
          {clipboardStatus.type === 'table' && (
            <Badge variant="outline" className="ml-2">
              <Table className="h-3 w-3 mr-1" />
              엑셀표
            </Badge>
          )}
        </div>
      )}

      {/* Editor */}
      <div className="border rounded-lg overflow-hidden shadow-sm">
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={content}
          onChange={onChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder || '내용을 입력하세요. Ctrl+V로 이미지나 Excel 표를 붙여넣을 수 있습니다.'}
          style={{ height: '300px', marginBottom: '42px' }}
        />
      </div>

      {/* Feature info and test buttons */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Image className="h-4 w-4" />
            <span>클립보드 이미지 붙여넣기</span>
          </div>
          <div className="flex items-center gap-1">
            <Table className="h-3 w-3" />
            <span className="text-green-600 font-medium">Excel 표 서식 보존</span>
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