import { useState, useCallback } from 'react'
import { ImageState } from '../types'

export function useImage(): ImageState {
  const [imgObj, setImgObj] = useState<HTMLImageElement | null>(null)
  const [loaded, setLoaded] = useState(false)

  const handleUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        setImgObj(img)
        setLoaded(true)
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }, [])

  const clearImage = useCallback((): void => {
    setImgObj(null)
    setLoaded(false)
  }, [])

  return {
    imgObj,
    loaded,
    handleUpload,
    clearImage,
  }
}
