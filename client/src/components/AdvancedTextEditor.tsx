import { useState, useRef, useEffect } from 'react'
import { CKEditor } from '@ckeditor/ckeditor5-react'
import DecoupledEditor from '@ckeditor/ckeditor5-build-decoupled-document'
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
  Info 
} from 'lucide-react'

interface AdvancedTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

// Enhanced upload adapter for clipboard image handling
class ClipboardImageAdapter {
  loader: any
  
  constructor(loader: any) {
    this.loader = loader
  }

  upload() {
    return this.loader.file.then((file: File) => this.uploadFile(file))
  }

  abort() {
    // Implement abort functionality if needed
  }

  private async uploadFile(file: File): Promise<{ default: string }> {
    try {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          // Convert to base64 for embedding
          const result = reader.result as string
          resolve({
            default: result
          })
        }
        reader.onerror = () => reject(new Error('이미지 처리 실패'))
        reader.readAsDataURL(file)
      })
    } catch (error) {
      throw new Error('이미지 업로드 실패')
    }
  }
}

// Upload adapter plugin
function ClipboardImageAdapterPlugin(editor: any) {
  editor.plugins.get('FileRepository').createUploadAdapter = (loader: any) => {
    return new ClipboardImageAdapter(loader)
  }
}

export function AdvancedTextEditor({ content, onChange, placeholder }: AdvancedTextEditorProps) {
  const [editorInstance, setEditorInstance] = useState<any>(null)
  const [clipboardStatus, setClipboardStatus] = useState<{
    type: string | null
    message: string
    variant: 'default' | 'success' | 'warning' | 'destructive'
  }>({ type: null, message: '', variant: 'default' })
  
  const toolbarRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Enhanced paste handling for Excel tables and images
  const handlePaste = async (event: ClipboardEvent, editor: any) => {
    const items = Array.from(event.clipboardData?.items || [])
    
    // Check for images
    const imageItem = items.find(item => item.type.startsWith('image/'))
    if (imageItem) {
      event.preventDefault()
      const file = imageItem.getAsFile()
      if (file) {
        setClipboardStatus({
          type: 'image',
          message: '이미지 처리 중...',
          variant: 'default'
        })
        
        try {
          const reader = new FileReader()
          reader.onload = () => {
            const base64 = reader.result as string
            const img = `<img src="${base64}" alt="클립보드 이미지" style="max-width: 100%; height: auto; cursor: pointer;" />`
            editor.model.change((writer: any) => {
              const viewFragment = editor.data.processor.toView(img)
              const modelFragment = editor.data.toModel(viewFragment)
              editor.model.insertContent(modelFragment)
            })
            
            setClipboardStatus({
              type: 'image',
              message: '이미지가 성공적으로 붙여넣어졌습니다',
              variant: 'success'
            })
            
            setTimeout(() => setClipboardStatus({ type: null, message: '', variant: 'default' }), 3000)
          }
          reader.readAsDataURL(file)
        } catch (error) {
          setClipboardStatus({
            type: 'image',
            message: '이미지 처리 실패',
            variant: 'destructive'
          })
        }
        return
      }
    }

    // Check for HTML content (Excel tables)
    const htmlItem = items.find(item => item.type === 'text/html')
    if (htmlItem) {
      event.preventDefault()
      
      htmlItem.getAsString((htmlContent) => {
        // Check if it's an Excel table
        if (htmlContent.includes('Excel') || htmlContent.includes('<table') || htmlContent.includes('<td')) {
          setClipboardStatus({
            type: 'table',
            message: '엑셀 표 처리 중...',
            variant: 'default'
          })
          
          try {
            // Clean and convert Excel HTML to proper table
            let cleanedHtml = htmlContent
              .replace(/<o:p\s*\/?>|<\/o:p>/gi, '') // Remove Office namespace tags
              .replace(/<span[^>]*>([^<]*)<\/span>/gi, '$1') // Remove span tags but keep content
              .replace(/style="[^"]*"/gi, '') // Remove inline styles temporarily
              .replace(/<font[^>]*>([^<]*)<\/font>/gi, '$1') // Remove font tags
              .replace(/&nbsp;/gi, ' ') // Replace non-breaking spaces
              .replace(/\s+/g, ' ') // Normalize whitespace
            
            // Convert to proper HTML table with CKEditor5 classes
            cleanedHtml = cleanedHtml.replace(
              /<table[^>]*>/gi, 
              '<figure class="table"><table style="border-collapse: collapse; width: 100%;">'
            )
            cleanedHtml = cleanedHtml.replace(/<\/table>/gi, '</table></figure>')
            cleanedHtml = cleanedHtml.replace(
              /<td[^>]*>/gi, 
              '<td style="border: 1px solid #ccc; padding: 8px; vertical-align: top;">'
            )
            cleanedHtml = cleanedHtml.replace(
              /<th[^>]*>/gi, 
              '<th style="border: 1px solid #ccc; padding: 8px; background-color: #f5f5f5; font-weight: bold;">'
            )
            
            // Insert the table into the editor
            editor.model.change((writer: any) => {
              const viewFragment = editor.data.processor.toView(cleanedHtml)
              const modelFragment = editor.data.toModel(viewFragment)
              editor.model.insertContent(modelFragment)
            })
            
            setClipboardStatus({
              type: 'table',
              message: '엑셀 표가 성공적으로 붙여넣어졌습니다. 셀을 더블클릭하여 편집하세요.',
              variant: 'success'
            })
            
            setTimeout(() => setClipboardStatus({ type: null, message: '', variant: 'default' }), 5000)
          } catch (error) {
            console.error('Table paste error:', error)
            setClipboardStatus({
              type: 'table',
              message: '표 처리 중 오류가 발생했습니다',
              variant: 'destructive'
            })
          }
        } else {
          // Regular HTML content
          editor.model.change((writer: any) => {
            const viewFragment = editor.data.processor.toView(htmlContent)
            const modelFragment = editor.data.toModel(viewFragment)
            editor.model.insertContent(modelFragment)
          })
        }
      })
      return
    }

    // Check for plain text
    const textItem = items.find(item => item.type === 'text/plain')
    if (textItem) {
      textItem.getAsString((textContent) => {
        // Insert as plain text
        editor.model.change((writer: any) => {
          const selection = editor.model.document.selection
          const range = selection.getFirstRange()
          const textNode = writer.createText(textContent)
          editor.model.insertContent(textNode, range.start)
        })
      })
    }
  }

  // Get HTML content for backend transmission
  const getHtmlContent = (): string => {
    if (!editorInstance) return content
    return editorInstance.getData()
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

  // Enhanced editor configuration
  const editorConfiguration = {
    extraPlugins: [ClipboardImageAdapterPlugin],
    toolbar: [
      'heading', '|',
      'bold', 'italic', 'underline', 'strikethrough', '|',
      'fontColor', 'fontBackgroundColor', '|',
      'bulletedList', 'numberedList', '|',
      'outdent', 'indent', '|',
      'alignment', '|',
      'link', 'blockQuote', '|',
      'insertTable', 'imageInsert', '|',
      'horizontalLine', '|',
      'undo', 'redo'
    ],
    placeholder: placeholder || '내용을 입력하세요. Ctrl+V로 이미지나 Excel 표를 붙여넣을 수 있습니다.',
    table: {
      contentToolbar: [
        'tableColumn', 'tableRow', 'mergeTableCells', 
        'tableCellProperties', 'tableProperties'
      ],
      tableProperties: {
        borderColors: [
          { color: 'hsl(0, 0%, 90%)', label: 'Light grey' },
          { color: 'hsl(0, 0%, 60%)', label: 'Grey' },
          { color: 'hsl(0, 0%, 30%)', label: 'Dark grey' }
        ],
        backgroundColors: [
          { color: 'hsl(0, 0%, 100%)', label: 'White' },
          { color: 'hsl(0, 0%, 95%)', label: 'Light grey' },
          { color: 'hsl(240, 100%, 95%)', label: 'Light blue' }
        ]
      },
      tableCellProperties: {
        borderColors: [
          { color: 'hsl(0, 0%, 90%)', label: 'Light grey' },
          { color: 'hsl(0, 0%, 60%)', label: 'Grey' },
          { color: 'hsl(0, 0%, 30%)', label: 'Dark grey' }
        ],
        backgroundColors: [
          { color: 'hsl(0, 0%, 100%)', label: 'White' },
          { color: 'hsl(0, 0%, 95%)', label: 'Light grey' },
          { color: 'hsl(240, 100%, 95%)', label: 'Light blue' }
        ]
      }
    },
    image: {
      toolbar: [
        'imageTextAlternative', '|',
        'imageStyle:alignLeft', 'imageStyle:alignCenter', 'imageStyle:alignRight', '|',
        'imageResize'
      ],
      resizeOptions: [
        {
          name: 'imageResize:original',
          label: '원본 크기',
          value: null
        },
        {
          name: 'imageResize:25',
          label: '25%',
          value: '25'
        },
        {
          name: 'imageResize:50',
          label: '50%',
          value: '50'
        },
        {
          name: 'imageResize:75',
          label: '75%',
          value: '75'
        }
      ]
    },
    fontSize: {
      options: [9, 10, 11, 12, 'default', 14, 16, 18, 20, 22]
    },
    fontColor: {
      colors: [
        { color: 'hsl(0, 0%, 0%)', label: 'Black' },
        { color: 'hsl(0, 0%, 30%)', label: 'Dim grey' },
        { color: 'hsl(0, 0%, 60%)', label: 'Grey' },
        { color: 'hsl(0, 0%, 90%)', label: 'Light grey' },
        { color: 'hsl(0, 0%, 100%)', label: 'White', hasBorder: true },
        { color: 'hsl(0, 75%, 60%)', label: 'Red' },
        { color: 'hsl(30, 75%, 60%)', label: 'Orange' },
        { color: 'hsl(60, 75%, 60%)', label: 'Yellow' },
        { color: 'hsl(90, 75%, 60%)', label: 'Light green' },
        { color: 'hsl(120, 75%, 60%)', label: 'Green' },
        { color: 'hsl(150, 75%, 60%)', label: 'Aquamarine' },
        { color: 'hsl(180, 75%, 60%)', label: 'Turquoise' },
        { color: 'hsl(210, 75%, 60%)', label: 'Light blue' },
        { color: 'hsl(240, 75%, 60%)', label: 'Blue' },
        { color: 'hsl(270, 75%, 60%)', label: 'Purple' }
      ]
    },
    fontBackgroundColor: {
      colors: [
        { color: 'hsl(0, 75%, 60%)', label: 'Red' },
        { color: 'hsl(30, 75%, 60%)', label: 'Orange' },
        { color: 'hsl(60, 75%, 60%)', label: 'Yellow' },
        { color: 'hsl(90, 75%, 60%)', label: 'Light green' },
        { color: 'hsl(120, 75%, 60%)', label: 'Green' },
        { color: 'hsl(150, 75%, 60%)', label: 'Aquamarine' },
        { color: 'hsl(180, 75%, 60%)', label: 'Turquoise' },
        { color: 'hsl(210, 75%, 60%)', label: 'Light blue' },
        { color: 'hsl(240, 75%, 60%)', label: 'Blue' },
        { color: 'hsl(270, 75%, 60%)', label: 'Purple' }
      ]
    }
  }

  // Setup paste event listener
  useEffect(() => {
    if (editorInstance) {
      const editorElement = editorInstance.ui.view.element
      
      const pasteHandler = (event: ClipboardEvent) => {
        handlePaste(event, editorInstance)
      }
      
      editorElement?.addEventListener('paste', pasteHandler)
      
      return () => {
        editorElement?.removeEventListener('paste', pasteHandler)
      }
    }
  }, [editorInstance])

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
              표
            </Badge>
          )}
        </div>
      )}

      {/* Editor */}
      <div className="border rounded-lg overflow-hidden shadow-sm">
        {/* Toolbar container */}
        <div 
          ref={toolbarRef}
          className="border-b bg-gray-50 dark:bg-gray-800 p-2"
        />
        
        {/* Editor container */}
        <div className="min-h-[400px] p-4 bg-white">
          <CKEditor
            editor={DecoupledEditor as any}
            config={editorConfiguration}
            data={content}
            onReady={(editor) => {
              // Mount the toolbar
              if (toolbarRef.current && editor.ui.view.toolbar?.element) {
                toolbarRef.current.appendChild(editor.ui.view.toolbar.element)
              }
              setEditorInstance(editor)
            }}
            onChange={(event, editor) => {
              const data = editor.getData()
              onChange(data)
            }}
            onBlur={(event, editor) => {
              const data = editor.getData()
              onChange(data)
            }}
          />
        </div>
      </div>

      {/* Feature info and test buttons */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Image className="h-4 w-4" />
            <span>Ctrl+V로 이미지 붙여넣기</span>
          </div>
          <div className="flex items-center gap-1">
            <Table className="h-4 w-4" />
            <span>엑셀 표 붙여넣기 지원</span>
          </div>
          <div className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            <span>HTML 형태로 저장</span>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={testHtmlExport}
          className="gap-2"
        >
          <Copy className="h-4 w-4" />
          HTML 내용 확인
        </Button>
      </div>
    </div>
  )
}