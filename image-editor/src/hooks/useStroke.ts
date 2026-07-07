import { useState } from 'react'
import { StrokeSettings } from '../types'

export function useStroke(
  initialWidth: number = 4,
  initialColor: string = '#ffffff'
): StrokeSettings {
  const [strokeWidth, setStrokeWidth] = useState<number>(initialWidth)
  const [strokeColor, setStrokeColor] = useState<string>(initialColor)

  return { strokeWidth, setStrokeWidth, strokeColor, setStrokeColor }
}
