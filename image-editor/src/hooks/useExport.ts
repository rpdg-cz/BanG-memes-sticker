import { useCallback, RefObject } from 'react'
import { ExportHooks } from '../types'

export function useExport(canvasRef: RefObject<HTMLCanvasElement>): ExportHooks {
  const downloadPng = useCallback(async (): Promise<void> => {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = 'image.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
  }, [canvasRef])

  const downloadJpg = useCallback(async (): Promise<void> => {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = 'image.jpg'
    link.href = canvas.toDataURL('image/jpeg', 0.95)
    link.click()
  }, [canvasRef])

  const copy = useCallback(async (): Promise<void> => {
    const canvas = canvasRef.current
    if (!canvas) return
    const blob = await new Promise<Blob>((resolve) =>
      canvas.toBlob((b) => resolve(b!), 'image/png')
    )
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob }),
    ])
  }, [canvasRef])

  return {
    downloadPng,
    downloadJpg,
    copy,
  }
}
