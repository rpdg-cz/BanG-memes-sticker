export interface Position {
  x: number
  y: number
}

export type FontKey = 'system' | 'serif' | 'monospace'

export interface TextSettings {
  text: string
  setText: (text: string) => void
  fontSize: number
  setFontSize: (size: number) => void
  fontKey: FontKey
  setFontKey: (key: FontKey) => void
  rotate: number
  setRotate: (rotate: number) => void
  spaceSize: number
  setSpaceSize: (size: number) => void
  letterSpacing: number
  setLetterSpacing: (spacing: number) => void
  curve: boolean
  setCurve: (curve: boolean) => void
  vertical: boolean
  setVertical: (vertical: boolean) => void
}

export interface StrokeSettings {
  strokeWidth: number
  setStrokeWidth: (width: number) => void
  strokeColor: string
  setStrokeColor: (color: string) => void
}

export interface PositionHook {
  position: Position
  setPosition: (position: Position) => void
  moveX: (delta: number) => void
  moveY: (delta: number) => void
}

export interface ExportHooks {
  downloadPng: () => Promise<void>
  downloadJpg: () => Promise<void>
  copy: () => Promise<void>
}

export interface ImageState {
  imgObj: HTMLImageElement | null
  loaded: boolean
  handleUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  clearImage: () => void
}
