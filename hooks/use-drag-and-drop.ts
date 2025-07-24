"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import type { DragEvent } from "react"

interface DragAndDropOptions {
  accept?: string[]
  maxFiles?: number
  maxSize?: number // in bytes
  onFilesAdded?: (files: File[]) => void
  onError?: (error: string) => void
}

interface DragAndDropState {
  isDragOver: boolean
  isDragActive: boolean
  files: File[]
  error: string | null
}

export function useDragAndDrop(options: DragAndDropOptions = {}) {
  const {
    accept = ['image/*', 'application/pdf', 'text/*', '.doc', '.docx', '.txt'],
    maxFiles = 5,
    maxSize = 10 * 1024 * 1024, // 10MB
    onFilesAdded,
    onError
  } = options

  const [state, setState] = useState<DragAndDropState>({
    isDragOver: false,
    isDragActive: false,
    files: [],
    error: null
  })

  const dragCounterRef = useRef(0)
  const dropZoneRef = useRef<HTMLElement | null>(null)

  // Validate file type
  const isValidFileType = useCallback((file: File): boolean => {
    return accept.some(acceptedType => {
      if (acceptedType.startsWith('.')) {
        return file.name.toLowerCase().endsWith(acceptedType.toLowerCase())
      }
      if (acceptedType.includes('/*')) {
        const [type] = acceptedType.split('/')
        return file.type.startsWith(type)
      }
      return file.type === acceptedType
    })
  }, [accept])

  // Validate file size
  const isValidFileSize = useCallback((file: File): boolean => {
    return file.size <= maxSize
  }, [maxSize])

  // Process dropped files
  const processFiles = useCallback((fileList: FileList | File[]) => {
    const files = Array.from(fileList)
    const validFiles: File[] = []
    const errors: string[] = []

    // Check file count
    if (files.length > maxFiles) {
      errors.push(`Máximo ${maxFiles} archivos permitidos`)
      return
    }

    // Validate each file
    files.forEach(file => {
      if (!isValidFileType(file)) {
        errors.push(`Tipo de archivo no soportado: ${file.name}`)
        return
      }

      if (!isValidFileSize(file)) {
        errors.push(`Archivo muy grande: ${file.name} (máximo ${Math.round(maxSize / 1024 / 1024)}MB)`)
        return
      }

      validFiles.push(file)
    })

    if (errors.length > 0) {
      const errorMessage = errors.join(', ')
      setState(prev => ({ ...prev, error: errorMessage }))
      onError?.(errorMessage)
      return
    }

    setState(prev => ({ 
      ...prev, 
      files: [...prev.files, ...validFiles].slice(0, maxFiles),
      error: null 
    }))
    
    onFilesAdded?.(validFiles)
  }, [maxFiles, isValidFileType, isValidFileSize, maxSize, onFilesAdded, onError])

  // Handle drag enter
  const handleDragEnter = useCallback((e: DragEvent<HTMLElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    dragCounterRef.current++
    
    if (e.dataTransfer?.items) {
      const hasFiles = Array.from(e.dataTransfer.items).some(
        item => item.kind === 'file'
      )
      
      if (hasFiles) {
        setState(prev => ({ 
          ...prev, 
          isDragOver: true, 
          isDragActive: true,
          error: null 
        }))
      }
    }
  }, [])

  // Handle drag over
  const handleDragOver = useCallback((e: DragEvent<HTMLElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy'
    }
  }, [])

  // Handle drag leave
  const handleDragLeave = useCallback((e: DragEvent<HTMLElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    dragCounterRef.current--
    
    if (dragCounterRef.current === 0) {
      setState(prev => ({ 
        ...prev, 
        isDragOver: false, 
        isDragActive: false 
      }))
    }
  }, [])

  // Handle drop
  const handleDrop = useCallback((e: DragEvent<HTMLElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    dragCounterRef.current = 0
    
    setState(prev => ({ 
      ...prev, 
      isDragOver: false, 
      isDragActive: false 
    }))
    
    if (e.dataTransfer?.files) {
      processFiles(e.dataTransfer.files)
    }
  }, [processFiles])

  // Native event handlers for DOM listeners
  const nativeHandleDragEnter = useCallback((e: Event) => {
    handleDragEnter(e as any)
  }, [handleDragEnter])
  
  const nativeHandleDragOver = useCallback((e: Event) => {
    handleDragOver(e as any)
  }, [handleDragOver])
  
  const nativeHandleDragLeave = useCallback((e: Event) => {
    handleDragLeave(e as any)
  }, [handleDragLeave])
  
  const nativeHandleDrop = useCallback((e: Event) => {
    handleDrop(e as any)
  }, [handleDrop])

  // Set up event listeners
  useEffect(() => {
    const element = dropZoneRef.current || document.body
    
    element.addEventListener('dragenter', nativeHandleDragEnter)
    element.addEventListener('dragover', nativeHandleDragOver)
    element.addEventListener('dragleave', nativeHandleDragLeave)
    element.addEventListener('drop', nativeHandleDrop)
    
    return () => {
      element.removeEventListener('dragenter', nativeHandleDragEnter)
      element.removeEventListener('dragover', nativeHandleDragOver)
      element.removeEventListener('dragleave', nativeHandleDragLeave)
      element.removeEventListener('drop', nativeHandleDrop)
    }
  }, [nativeHandleDragEnter, nativeHandleDragOver, nativeHandleDragLeave, nativeHandleDrop])

  // Remove file
  const removeFile = useCallback((index: number) => {
    setState(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }))
  }, [])

  // Clear all files
  const clearFiles = useCallback(() => {
    setState(prev => ({
      ...prev,
      files: [],
      error: null
    }))
  }, [])

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  // Set drop zone ref
  const setDropZoneRef = useCallback((element: HTMLElement | null) => {
    dropZoneRef.current = element
  }, [])

  return {
    ...state,
    removeFile,
    clearFiles,
    clearError,
    setDropZoneRef,
    processFiles,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop
  }
}