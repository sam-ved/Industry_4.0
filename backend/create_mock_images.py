import os
from PIL import Image, ImageDraw, ImageFont

def create_placeholder(filename, text, bg_color):
    img = Image.new('RGB', (800, 600), color=bg_color)
    d = ImageDraw.Draw(img)
    # Just draw text in the middle
    d.text((400, 300), text, fill=(255,255,255), anchor="mm")
    
    # Save the image
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    img.save(filename)

def main():
    demo_dir = os.path.join("..", "frontend", "public", "demo")
    create_placeholder(os.path.join(demo_dir, "compliant.jpg"), "Compliant Worker\n(Helmet + Vest)", (34, 139, 34))
    create_placeholder(os.path.join(demo_dir, "helmet_missing.jpg"), "Non-Compliant Worker\n(Helmet Missing)", (178, 34, 34))
    create_placeholder(os.path.join(demo_dir, "vest_missing.jpg"), "Non-Compliant Worker\n(Vest Missing)", (178, 34, 34))
    create_placeholder(os.path.join(demo_dir, "multiple_missing.jpg"), "Non-Compliant Worker\n(Multiple Missing)", (178, 34, 34))
    print("Created demo images.")

if __name__ == "__main__":
    main()
