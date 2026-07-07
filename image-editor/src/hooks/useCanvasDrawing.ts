import { useCallback } from 'react'
import { Position, FontKey } from '../types'

const FONT_STACKS: Record<FontKey, string> = {
  system:
    "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  serif:
    "Georgia, 'Times New Roman', serif",
  monospace:
    "'Courier New', Courier, monospace",
}

interface DrawTextSettings {
  fontSize: number
  fontKey: FontKey
  spaceSize: number
  letterSpacing: number
  curve: boolean
  vertical: boolean
}

interface DrawColors {
  textColor: string
}

interface DrawStroke {
  strokeWidth: number
  strokeColor: string
}

const CANVAS_WIDTH = 512
const CANVAS_HEIGHT = 512

export function useCanvasDrawing() {
  const drawText = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      text: string,
      position: Position,
      rotate: number,
      textSettings: DrawTextSettings,
      colors: DrawColors,
      stroke: DrawStroke,
      angle: number
    ): void => {
      const { fontSize, fontKey, spaceSize, letterSpacing, curve, vertical } = textSettings
      const { textColor } = colors
      const { strokeWidth, strokeColor } = stroke

      ctx.font = `bold ${fontSize}px ${FONT_STACKS[fontKey]}`
      ctx.lineWidth = strokeWidth
      ctx.save()

      ctx.translate(position.x, position.y)
      ctx.rotate(rotate / 10)
      ctx.textAlign = 'center'
      ctx.strokeStyle = strokeColor
      ctx.fillStyle = textColor
      const lines = text.split('\n')

      if (curve) {
        for (const line of lines) {
          for (let i = 0; i < line.length; i++) {
            ctx.rotate(angle / line.length / 2.5)
            ctx.save()
            ctx.translate(0, -1 * fontSize * 3.5)
            ctx.strokeText(line[i], 0, 0)
            ctx.fillText(line[i], 0, 0)
            ctx.restore()
          }
        }
      } else if (vertical) {
        const letterStep = fontSize + letterSpacing
        const lineStep = fontSize + spaceSize - 40
        let xOffset = 0
        for (const line of lines) {
          let yOffset = 0
          for (let i = 0; i < line.length; i++) {
            ctx.strokeText(line[i], xOffset, yOffset)
            ctx.fillText(line[i], xOffset, yOffset)
            yOffset += letterStep
          }
          xOffset += lineStep
        }
      } else {
        if (letterSpacing === 0) {
          for (let i = 0, k = 0; i < lines.length; i++) {
            ctx.strokeText(lines[i], 0, k)
            ctx.fillText(lines[i], 0, k)
            k += spaceSize
          }
        } else {
          ctx.textAlign = 'left'
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i]
            const lineY = i * spaceSize
            const metrics = ctx.measureText(line)
            let charX = -metrics.width / 2
            for (let j = 0; j < line.length; j++) {
              ctx.strokeText(line[j], charX, lineY)
              ctx.fillText(line[j], charX, lineY)
              const charMetrics = ctx.measureText(line[j])
              charX += charMetrics.width + letterSpacing
            }
          }
          ctx.textAlign = 'center'
        }
      }
      ctx.restore()
    },
    []
  )

  const draw = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      imgObj: HTMLImageElement | null,
      loaded: boolean,
      text: string,
      position: Position,
      rotate: number,
      textSettings: DrawTextSettings,
      colors: DrawColors,
      stroke: DrawStroke
    ): void => {
      const w = CANVAS_WIDTH
      const h = CANVAS_HEIGHT
      if (ctx.canvas.width !== w) ctx.canvas.width = w
      if (ctx.canvas.height !== h) ctx.canvas.height = h

      // White background
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, w, h)

      if (loaded && imgObj) {
        const img = imgObj

        const hRatio = w / img.width
        const vRatio = h / img.height
        const ratio = Math.min(hRatio, vRatio)
        const centerShift_x = (w - img.width * ratio) / 2
        const centerShift_y = (h - img.height * ratio) / 2

        ctx.drawImage(
          img,
          0,
          0,
          img.width,
          img.height,
          centerShift_x,
          centerShift_y,
          img.width * ratio,
          img.height * ratio
        )
      }

      // Draw text on top
      if (text && text.trim()) {
        const angle = (Math.PI * text.length) / 7
        drawText(ctx, text, position, rotate, textSettings, colors, stroke, angle)
      }
    },
    [drawText]
  )

  return {
    draw,
    drawText,
  }
}
