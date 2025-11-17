# Extension Icons

Place your icon files here with the following sizes:

- `icon16.png` - 16x16 pixels (toolbar)
- `icon32.png` - 32x32 pixels (retina toolbar)
- `icon48.png` - 48x48 pixels (extension management)
- `icon128.png` - 128x128 pixels (Chrome Web Store, installation)

## Design Recommendations

- **Color scheme**: Use brand colors (blue #2563eb)
- **Icon style**: Simple, recognizable bookmark or book symbol
- **Background**: Solid color or transparent
- **Format**: PNG with transparency

## Tools for Creating Icons

- **Online**: [Favicon.io](https://favicon.io/), [Real Favicon Generator](https://realfavicongenerator.net/)
- **Desktop**: Figma, Adobe Illustrator, Sketch
- **Command Line**: ImageMagick for resizing

## Example using ImageMagick

```bash
# Create all sizes from a source image
convert source.png -resize 16x16 icon16.png
convert source.png -resize 32x32 icon32.png
convert source.png -resize 48x48 icon48.png
convert source.png -resize 128x128 icon128.png
```
