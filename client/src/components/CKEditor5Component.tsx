import { useState, useRef } from 'react'
import { CKEditor } from '@ckeditor/ckeditor5-react'
import DecoupledEditor from '@ckeditor/ckeditor5-build-decoupled-document'

interface CKEditor5ComponentProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

// Custom upload adapter for image handling
class CustomUploadAdapter {
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
      // Convert file to base64 for now (later can be replaced with actual upload)
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          resolve({
            default: reader.result as string
          })
        }
        reader.onerror = () => reject(new Error('Image upload failed'))
        reader.readAsDataURL(file)
      })
    } catch (error) {
      throw new Error('Image upload failed')
    }
  }
}

// Upload adapter plugin
function CustomUploadAdapterPlugin(editor: any) {
  editor.plugins.get('FileRepository').createUploadAdapter = (loader: any) => {
    return new CustomUploadAdapter(loader)
  }
}

export function CKEditor5Component({ content, onChange, placeholder }: CKEditor5ComponentProps) {
  const [editorInstance, setEditorInstance] = useState<any>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)

  // Basic content processing (CKEditor5 has built-in sanitization)
  const processContent = (html: string): string => {
    return html // CKEditor5 handles sanitization internally
  }

  const editorConfiguration = {
    extraPlugins: [CustomUploadAdapterPlugin],
    toolbar: [
      'heading', '|',
      'bold', 'italic', 'underline', '|',
      'bulletedList', 'numberedList', '|',
      'outdent', 'indent', '|',
      'blockQuote', 'link', '|',
      'insertTable', 'imageInsert', '|',
      'undo', 'redo'
    ],
    placeholder: placeholder || '내용을 입력하세요...',
    table: {
      contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells']
    }
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Toolbar container */}
      <div 
        ref={toolbarRef}
        className="border-b bg-gray-50 dark:bg-gray-800 p-2"
      />
      
      {/* Editor container */}
      <div className="min-h-[400px] p-4">
        <CKEditor
          editor={DecoupledEditor}
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
            const processedData = processContent(data)
            onChange(processedData)
          }}
          onBlur={(event, editor) => {
            const data = editor.getData()
            onChange(data)
          }}
        />
      </div>
    </div>
  )
}