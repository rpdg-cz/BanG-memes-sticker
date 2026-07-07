import { useRef, useCallback, useState } from 'react'
import {
  Container,
  Paper,
  Box,
  TextField,
  Slider,
  Typography,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  IconButton,
} from '@mui/material'
import {
  Download as DownloadIcon,
  ContentCopy as CopyIcon,
  Upload as UploadIcon,
  Delete as ClearIcon,
} from '@mui/icons-material'
import Canvas from './components/Canvas'
import { useCanvasDrawing } from './hooks/useCanvasDrawing'
import { useExport } from './hooks/useExport'
import { useImage } from './hooks/useImage'
import { usePosition } from './hooks/usePosition'
import { useStroke } from './hooks/useStroke'
import { useTextSettings } from './hooks/useTextSettings'
import { FontKey } from './types'

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const canvasDrawing = useCanvasDrawing()
  const image = useImage()
  const position = usePosition()
  const stroke = useStroke(4, '#ffffff')
  const textSettings = useTextSettings()
  const exportHooks = useExport(canvasRef)

  const [textColor, setTextColor] = useState('#ffffff')

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      canvasDrawing.draw(
        ctx,
        image.imgObj,
        image.loaded,
        textSettings.text,
        position.position,
        textSettings.rotate,
        {
          fontSize: textSettings.fontSize,
          fontKey: textSettings.fontKey,
          spaceSize: textSettings.spaceSize,
          letterSpacing: textSettings.letterSpacing,
          curve: textSettings.curve,
          vertical: textSettings.vertical,
        },
        { textColor },
        {
          strokeWidth: stroke.strokeWidth,
          strokeColor: stroke.strokeColor,
        }
      )
    },
    [
      canvasDrawing,
      image.imgObj,
      image.loaded,
      textSettings,
      position.position,
      textColor,
      stroke,
    ]
  )

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Typography variant="h5" gutterBottom>
        Image Text Editor
      </Typography>

      <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="flex-start">
          {/* Canvas */}
          <Box sx={{ flexShrink: 0 }}>
            <Canvas
              ref={canvasRef}
              draw={draw}
              style={{
                border: '1px solid #444',
                borderRadius: 4,
                width: 400,
                height: 400,
                display: 'block',
              }}
            />
            {/* Export buttons */}
            <Stack direction="row" spacing={1} mt={1} justifyContent="center">
              <IconButton onClick={exportHooks.downloadPng} title="Download PNG" color="primary">
                <DownloadIcon />
              </IconButton>
              <IconButton onClick={exportHooks.downloadJpg} title="Download JPEG">
                <DownloadIcon />
              </IconButton>
              <IconButton onClick={exportHooks.copy} title="Copy to clipboard">
                <CopyIcon />
              </IconButton>
            </Stack>
          </Box>

          {/* Controls */}
          <Stack spacing={2} sx={{ flex: 1, minWidth: 220 }}>
            {/* Image upload */}
            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadIcon />}
              fullWidth
            >
              {image.loaded ? 'Change Image' : 'Upload Image'}
              <input type="file" accept="image/*" hidden onChange={image.handleUpload} />
            </Button>
            {image.loaded && (
              <Button
                variant="text"
                color="error"
                size="small"
                startIcon={<ClearIcon />}
                onClick={image.clearImage}
              >
                Clear Image
              </Button>
            )}

            {/* Text input */}
            <TextField
              label="Text"
              multiline
              minRows={2}
              maxRows={4}
              value={textSettings.text}
              onChange={(e) => textSettings.setText(e.target.value)}
              fullWidth
              size="small"
            />

            {/* Font size */}
            <Box>
              <Typography variant="caption">Font Size: {textSettings.fontSize}px</Typography>
              <Slider
                value={textSettings.fontSize}
                onChange={(_, v) => textSettings.setFontSize(v as number)}
                min={12}
                max={120}
                size="small"
              />
            </Box>

            {/* Font family */}
            <FormControl size="small">
              <InputLabel>Font</InputLabel>
              <Select
                value={textSettings.fontKey}
                label="Font"
                onChange={(e) => textSettings.setFontKey(e.target.value as FontKey)}
              >
                <MenuItem value="system">System</MenuItem>
                <MenuItem value="serif">Serif</MenuItem>
                <MenuItem value="monospace">Monospace</MenuItem>
              </Select>
            </FormControl>

            {/* Rotation */}
            <Box>
              <Typography variant="caption">Rotation: {textSettings.rotate}</Typography>
              <Slider
                value={textSettings.rotate}
                onChange={(_, v) => textSettings.setRotate(v as number)}
                min={-30}
                max={30}
                size="small"
              />
            </Box>

            {/* Line spacing */}
            <Box>
              <Typography variant="caption">Line Spacing: {textSettings.spaceSize}px</Typography>
              <Slider
                value={textSettings.spaceSize}
                onChange={(_, v) => textSettings.setSpaceSize(v as number)}
                min={20}
                max={150}
                size="small"
              />
            </Box>

            {/* Letter spacing */}
            <Box>
              <Typography variant="caption">Letter Spacing: {textSettings.letterSpacing}px</Typography>
              <Slider
                value={textSettings.letterSpacing}
                onChange={(_, v) => textSettings.setLetterSpacing(v as number)}
                min={0}
                max={30}
                size="small"
              />
            </Box>

            {/* Layout toggles */}
            <ToggleButtonGroup size="small" fullWidth>
              <ToggleButton
                value="horizontal"
                selected={!textSettings.vertical && !textSettings.curve}
                onClick={() => { textSettings.setVertical(false); textSettings.setCurve(false) }}
              >
                Horizontal
              </ToggleButton>
              <ToggleButton
                value="vertical"
                selected={textSettings.vertical}
                onClick={() => { textSettings.setVertical(true); textSettings.setCurve(false) }}
              >
                Vertical
              </ToggleButton>
              <ToggleButton
                value="curve"
                selected={textSettings.curve}
                onClick={() => { textSettings.setCurve(true); textSettings.setVertical(false) }}
              >
                Curved
              </ToggleButton>
            </ToggleButtonGroup>

            {/* Text color */}
            <Box>
              <Typography variant="caption">Text Color</Typography>
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                style={{ width: '100%', height: 36, border: 'none', cursor: 'pointer' }}
              />
            </Box>

            {/* Stroke width */}
            <Box>
              <Typography variant="caption">Stroke: {stroke.strokeWidth}px</Typography>
              <Slider
                value={stroke.strokeWidth}
                onChange={(_, v) => stroke.setStrokeWidth(v as number)}
                min={0}
                max={20}
                size="small"
              />
            </Box>

            {/* Stroke color */}
            <Box>
              <Typography variant="caption">Stroke Color</Typography>
              <input
                type="color"
                value={stroke.strokeColor}
                onChange={(e) => stroke.setStrokeColor(e.target.value)}
                style={{ width: '100%', height: 36, border: 'none', cursor: 'pointer' }}
              />
            </Box>

            {/* Position arrows */}
            <Box>
              <Typography variant="caption" gutterBottom>Position</Typography>
              <Stack direction="row" spacing={1} justifyContent="center">
                <Button size="small" variant="outlined" onClick={() => position.moveX(-10)} sx={{ minWidth: 40 }}>◀</Button>
                <Button size="small" variant="outlined" onClick={() => position.moveY(-10)} sx={{ minWidth: 40 }}>▲</Button>
                <Button size="small" variant="outlined" onClick={() => position.moveY(10)} sx={{ minWidth: 40 }}>▼</Button>
                <Button size="small" variant="outlined" onClick={() => position.moveX(10)} sx={{ minWidth: 40 }}>▶</Button>
              </Stack>
            </Box>
          </Stack>
        </Stack>
      </Paper>
    </Container>
  )
}

export default App
