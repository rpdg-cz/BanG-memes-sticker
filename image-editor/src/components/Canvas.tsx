import { forwardRef, useRef, useEffect, useImperativeHandle, memo } from 'react'

interface CanvasProps extends React.HTMLAttributes<HTMLCanvasElement> {
  draw: (ctx: CanvasRenderingContext2D) => void
}

const Canvas = memo(
  forwardRef<HTMLCanvasElement, CanvasProps>(({ draw, ...rest }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const rafIdRef = useRef<number | null>(null)
    const pendingDrawRef = useRef<(() => void) | null>(null)

    useImperativeHandle(ref, () => canvasRef.current as HTMLCanvasElement)

    useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas) return

      const context = canvas.getContext('2d')
      if (!context) return

      pendingDrawRef.current = () => draw(context)

      if (rafIdRef.current === null) {
        rafIdRef.current = requestAnimationFrame(() => {
          if (pendingDrawRef.current) {
            pendingDrawRef.current()
            pendingDrawRef.current = null
          }
          rafIdRef.current = null
        })
      }

      return () => {
        if (rafIdRef.current !== null) {
          cancelAnimationFrame(rafIdRef.current)
          rafIdRef.current = null
        }
      }
    }, [draw])

    return <canvas ref={canvasRef} {...rest} />
  })
)

Canvas.displayName = 'Canvas'

export default Canvas
