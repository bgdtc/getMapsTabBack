#!/bin/bash
# Script pour convertir les icônes SVG en PNG
# Nécessite Inkscape ou ImageMagick

echo "Conversion des icônes SVG en PNG..."

# Vérifier si Inkscape est disponible
if command -v inkscape &> /dev/null; then
    echo "Utilisation d'Inkscape..."
    inkscape icons/icon16.svg --export-filename=icons/icon16.png --export-width=16 --export-height=16
    inkscape icons/icon48.svg --export-filename=icons/icon48.png --export-width=48 --export-height=48
    inkscape icons/icon128.svg --export-filename=icons/icon128.png --export-width=128 --export-height=128
    echo "✓ Conversion terminée avec Inkscape"
# Vérifier si ImageMagick est disponible
elif command -v convert &> /dev/null; then
    echo "Utilisation d'ImageMagick..."
    convert icons/icon16.svg -resize 16x16 icons/icon16.png
    convert icons/icon48.svg -resize 48x48 icons/icon48.png
    convert icons/icon128.svg -resize 128x128 icons/icon128.png
    echo "✓ Conversion terminée avec ImageMagick"
else
    echo "Erreur: Inkscape ou ImageMagick n'est pas installé."
    echo "Installez l'un d'eux ou utilisez generate-icons.html dans un navigateur."
    exit 1
fi

