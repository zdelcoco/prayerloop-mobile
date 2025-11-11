#!/usr/bin/env python3
"""
Generate splash screen images for prayerloop app
Creates a gradient background with centered text
"""

from PIL import Image, ImageDraw, ImageFont
import os

# Configuration
WIDTH = 1284
HEIGHT = 2778
TEXT = "prayerloop"
FONT_SIZE = 140

# Gradient colors (green to white)
START_COLOR = (144, 197, 144)  # #90c590
END_COLOR = (255, 255, 255)    # #ffffff

# Text color
TEXT_COLOR = (0, 0, 0)  # black

# Font path
FONT_PATH = "assets/fonts/InstrumentSans-SemiBold-BF645daa0fdb37c.ttf"

def interpolate_color(color1, color2, factor):
    """Interpolate between two RGB colors"""
    return tuple(
        int(color1[i] + (color2[i] - color1[i]) * factor)
        for i in range(3)
    )

def create_gradient_image(width, height):
    """Create an image with a vertical gradient from green to white"""
    image = Image.new('RGB', (width, height))
    draw = ImageDraw.Draw(image)

    # Draw gradient line by line
    for y in range(height):
        factor = y / height
        color = interpolate_color(START_COLOR, END_COLOR, factor)
        draw.line([(0, y), (width, y)], fill=color)

    return image

def add_text_to_image(image, text, font_size):
    """Add centered text to the image"""
    draw = ImageDraw.Draw(image)

    # Use the specified font
    try:
        if os.path.exists(FONT_PATH):
            font = ImageFont.truetype(FONT_PATH, font_size)
            print(f"Using font: {FONT_PATH}")
        else:
            print(f"Warning: Font file not found at {FONT_PATH}, using default")
            font = ImageFont.load_default()
    except Exception as e:
        print(f"Error loading font: {e}, using default")
        font = ImageFont.load_default()

    # Get text bounding box
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]

    # Calculate centered position
    x = (image.width - text_width) / 2
    y = (image.height - text_height) / 2

    # Draw text
    draw.text((x, y), text, font=font, fill=TEXT_COLOR)

    return image

def main():
    import sys

    print("Generating splash screen images...")

    # Create the gradient image
    print(f"Creating {WIDTH}x{HEIGHT} gradient background...")
    image = create_gradient_image(WIDTH, HEIGHT)

    # Add text
    print(f"Adding '{TEXT}' text...")
    image = add_text_to_image(image, TEXT, FONT_SIZE)

    # Check if preview mode
    preview_mode = "--preview" in sys.argv

    if preview_mode:
        # Save a preview image and open it
        preview_path = "splash-preview.png"
        print(f"\n📸 Saving preview to {preview_path}...")
        image.save(preview_path, "PNG")
        print("✅ Preview saved!")

        # Try to open the preview
        try:
            if sys.platform == "darwin":  # macOS
                os.system(f"open {preview_path}")
            elif sys.platform == "win32":  # Windows
                os.system(f"start {preview_path}")
            else:  # Linux
                os.system(f"xdg-open {preview_path}")
            print(f"Opening preview in default image viewer...")
        except Exception as e:
            print(f"Could not open preview automatically: {e}")
            print(f"Please open {preview_path} manually to review")

        print("\nIf you're happy with the preview, run without --preview flag to generate the actual splash screen files")
        return

    # Define output paths
    base_path = "ios/prayerloop/Images.xcassets/SplashScreenLogo.imageset"
    output_files = [
        os.path.join(base_path, "image.png"),
        os.path.join(base_path, "image@2x.png"),
        os.path.join(base_path, "image@3x.png"),
    ]

    # Ensure directory exists
    os.makedirs(base_path, exist_ok=True)

    # Save the same image to all three files
    for output_file in output_files:
        print(f"Saving {output_file}...")
        image.save(output_file, "PNG")

    print("\n✅ Splash screen images generated successfully!")
    print(f"\nGenerated files:")
    for f in output_files:
        print(f"  - {f}")

    print("\nNext steps:")
    print("1. Review the generated images")
    print("2. Run: npx expo prebuild --platform ios --clean")
    print("3. Open in Xcode and run on simulator")
    print("\nTip: Use --preview flag to generate and view a preview before building")

if __name__ == "__main__":
    main()
