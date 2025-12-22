#!/bin/bash
# Script pour créer le package ZIP de l'extension pour le Chrome Web Store

echo "📦 Création du package de l'extension..."

# Nom du package
PACKAGE_NAME="getMapsTabBack"
ZIP_FILE="${PACKAGE_NAME}.zip"

# Vérifier que les icônes PNG existent
if [ ! -f "icons/icon16.png" ] || [ ! -f "icons/icon48.png" ] || [ ! -f "icons/icon128.png" ]; then
    echo "⚠️  Attention: Les fichiers PNG des icônes sont manquants!"
    echo "   Veuillez générer les icônes en utilisant:"
    echo "   - generate-icons.html (dans un navigateur)"
    echo "   - python3 generate_icons.py"
    echo "   - ./convert-svg-to-png.sh"
    echo ""
    read -p "Continuer quand même? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Supprimer l'ancien package s'il existe
if [ -f "$ZIP_FILE" ]; then
    rm "$ZIP_FILE"
    echo "✓ Ancien package supprimé"
fi

# Créer le package ZIP
zip -r "$ZIP_FILE" . \
    -x "*.git*" \
    -x "*.DS_Store" \
    -x "*.swp" \
    -x "*.swo" \
    -x "*~" \
    -x "*.log" \
    -x "*.tmp" \
    -x "*.zip" \
    -x "*.crx" \
    -x "*.pem" \
    -x "generate-icons.html" \
    -x "generate_icons.py" \
    -x "convert-svg-to-png.sh" \
    -x "package.sh" \
    -x "*.svg" \
    -x ".gitignore" \
    -x "README.md" \
    > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Package créé avec succès: $ZIP_FILE"
    echo "📊 Taille du package: $(du -h $ZIP_FILE | cut -f1)"
    echo ""
    echo "📤 Vous pouvez maintenant téléverser ce fichier sur le Chrome Web Store"
else
    echo "❌ Erreur lors de la création du package"
    exit 1
fi

