import { useState } from 'react'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'

interface SimpleQuillEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

export function SimpleQuillEditor({ content, onChange, placeholder }: SimpleQuillEditorProps) {
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['blockquote', 'code-block'],
      ['link', 'image'],
      ['clean']
    ]
  }

  const formats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'blockquote', 'code-block',
    'link', 'image', 'color', 'background'
  ]

  return (
    <div className="border rounded-lg overflow-hidden shadow-sm">
      <ReactQuill
        theme="snow"
        value={content}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder || '내용을 입력하세요.'}
        style={{ height: '300px', marginBottom: '42px' }}
      />
    </div>
  )
}