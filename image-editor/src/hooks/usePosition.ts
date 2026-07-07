import { useState, useCallback } from 'react'
import { Position, PositionHook } from '../types'

export function usePosition(initialX: number = 256, initialY: number = 430): PositionHook {
  const [position, setPosition] = useState<Position>({ x: initialX, y: initialY })

  const moveX = useCallback((delta: number): void => {
    setPosition((prev) => ({ ...prev, x: prev.x + delta }))
  }, [])

  const moveY = useCallback((delta: number): void => {
    setPosition((prev) => ({ ...prev, y: prev.y + delta }))
  }, [])

  return { position, setPosition, moveX, moveY }
}
