#!/usr/bin/env python3
"""
Script pour générer les icônes de l'extension Chrome Maps Tab
Génère des icônes PNG aux tailles 16x16, 48x48, et 128x128
"""

try:
    from PIL import Image, ImageDraw
    import os
except ImportError:
    print("Erreur: PIL (Pillow) n'est pas installé.")
    print("Installez-le avec: pip install Pillow")
    exit(1)

def create_icon(size):
    """Crée une icône de carte à la taille spécifiée"""
    # Créer une image avec fond transparent
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Couleurs Google Maps (bleu)
    blue_start = (66, 133, 244)  # #4285f4
    blue_end = (26, 115, 232)    # #1a73e8
    
    # Dessiner un fond avec dégradé (simplifié en rectangle bleu)
    draw.rectangle([0, 0, size, size], fill=blue_start)
    
    # Dessiner un marqueur de carte (pin)
    center_x = size // 2
    center_y = size // 2
    pin_radius = int(size * 0.15)
    pin_height = int(size * 0.4)
    
    # Corps du pin (cercle)
    circle_y = center_y - int(pin_height * 0.1)
    draw.ellipse(
        [center_x - pin_radius, circle_y - pin_radius,
         center_x + pin_radius, circle_y + pin_radius],
        fill='white'
    )
    
    # Pointe du pin (triangle)
    triangle_points = [
        (center_x, circle_y + pin_radius),  # Point du bas
        (center_x - int(pin_radius * 0.5), circle_y),  # Point gauche
        (center_x + int(pin_radius * 0.5), circle_y)   # Point droit
    ]
    draw.polygon(triangle_points, fill='white')
    
    return img

def main():
    """Génère toutes les icônes nécessaires"""
    sizes = [16, 48, 128]
    icons_dir = 'icons'
    
    # Créer le dossier icons s'il n'existe pas
    os.makedirs(icons_dir, exist_ok=True)
    
    print("Génération des icônes...")
    for size in sizes:
        icon = create_icon(size)
        filename = f'{icons_dir}/icon{size}.png'
        icon.save(filename, 'PNG')
        print(f"✓ Créé: {filename} ({size}x{size})")
    
    print("\nToutes les icônes ont été générées avec succès!")

if __name__ == '__main__':
    main()

