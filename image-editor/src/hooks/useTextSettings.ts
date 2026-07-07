import { useState } from 'react'
import { TextSettings, FontKey } from '../types'

export function useTextSettings(): TextSettings {
  const [text, setText] = useState<string>('')
  const [fontSize, setFontSize] = useState<number>(48)
  const [fontKey, setFontKey] = useState<FontKey>('system')
  const [rotate, setRotate] = useState<number>(0)
  const [spaceSize, setSpaceSize] = useState<number>(60)
  const [letterSpacing, setLetterSpacing] = useState<number>(0)
  const [curve, setCurve] = useState<boolean>(false)
  const [vertical, setVertical] = useState<boolean>(false)

  return {
    text,
    setText,
    fontSize,
    setFontSize,
    fontKey,
    setFontKey,
    rotate,
    setRotate,
    spaceSize,
    setSpaceSize,
    letterSpacing,
    setLetterSpacing,
    curve,
    setCurve,
    vertical,
    setVertical,
  }
}
