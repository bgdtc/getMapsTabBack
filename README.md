# 🗺️ Restore Google Maps Tab
https://chromewebstore.google.com/detail/restaurer-longlet-google/dlmdnhjglcjpdeaflkgbbbgbgbcghied?hl=fr

Extension Chrome/Brave qui restaure l'onglet "Maps" dans les résultats de recherche Google, vous permettant d'accéder à Google Maps en un clic directement depuis la page des résultats de recherche.

## 📋 Description

En mars 2024, Google a supprimé l'onglet "Maps" des résultats de recherche dans l'Union européenne suite à l'entrée en vigueur du Digital Markets Act (DMA). Cette extension restaure cette fonctionnalité en ajoutant automatiquement un onglet "Maps" dans la barre d'onglets des résultats de recherche Google.

### Fonctionnalités

- ✅ Restaure l'onglet "Maps" dans les résultats de recherche Google
- ✅ Redirige vers Google Maps avec votre requête de recherche pré-remplie
- ✅ Fonctionne sur toutes les variantes de Google (google.com, google.fr, google.co.uk, etc.)
- ✅ Support des recherches dynamiques (SPA)
- ✅ Interface bilingue (Français/Anglais)
- ✅ Design qui correspond au style Google

## 🚀 Installation

### Option 1 : Installation en mode développeur (pour tester)

1. **Téléchargez ou clonez ce dépôt**
   ```bash
   git clone <url-du-repo>
   cd getMapsTabBack
   ```

2. **Générez les icônes PNG** (si nécessaire)
   
   Vous avez plusieurs options :
   
   **Option A : Utiliser le générateur HTML**
   - Ouvrez `generate-icons.html` dans votre navigateur
   - Cliquez sur "Télécharger toutes les icônes"
   - Placez les fichiers dans le dossier `icons/`
   
   **Option B : Utiliser le script Python**
   ```bash
   pip install Pillow
   python3 generate_icons.py
   ```
   
   **Option C : Utiliser Inkscape ou ImageMagick**
   ```bash
   ./convert-svg-to-png.sh
   ```

3. **Chargez l'extension dans Chrome/Brave**
   - Ouvrez Chrome ou Brave
   - Allez à `chrome://extensions/` (ou `brave://extensions/`)
   - Activez le **Mode développeur** (en haut à droite)
   - Cliquez sur **Charger l'extension non empaquetée**
   - Sélectionnez le dossier `getMapsTabBack`

4. **Testez l'extension**
   - Effectuez une recherche sur Google (par exemple : "restaurants Paris")
   - Vous devriez voir l'onglet "Maps" apparaître dans la barre d'onglets
   - Cliquez dessus pour accéder à Google Maps avec votre recherche

### Option 2 : Installation depuis le Chrome Web Store (à venir)

Une fois l'extension publiée sur le Chrome Web Store, vous pourrez l'installer directement depuis le store.

## 📦 Structure du projet

```
getMapsTabBack/
├── manifest.json              # Configuration de l'extension (Manifest V3)
├── content.js                 # Script principal qui ajoute l'onglet Maps
├── styles.css                 # Styles pour l'onglet Maps
├── README.md                  # Ce fichier
├── LICENSE                    # Licence MIT
├── generate-icons.html        # Générateur d'icônes (navigateur)
├── generate_icons.py          # Script Python pour générer les icônes
├── convert-svg-to-png.sh      # Script shell pour convertir SVG en PNG
├── _locales/                  # Fichiers de traduction
│   ├── en/
│   │   └── messages.json
│   └── fr/
│       └── messages.json
└── icons/                     # Icônes de l'extension
    ├── icon16.svg
    ├── icon48.svg
    ├── icon128.svg
    ├── icon16.png             # À générer
    ├── icon48.png             # À générer
    └── icon128.png            # À générer
```

## 🔧 Développement

### Prérequis

- Chrome ou Brave (dernière version)
- Un éditeur de texte
- (Optionnel) Python 3 avec Pillow pour générer les icônes

### Modification du code

- **`manifest.json`** : Configuration de l'extension, permissions, etc.
- **`content.js`** : Logique principale pour détecter et ajouter l'onglet Maps
- **`styles.css`** : Styles CSS pour l'onglet Maps
- **`_locales/*/messages.json`** : Traductions de l'extension

### Test local

1. Modifiez les fichiers selon vos besoins
2. Rechargez l'extension dans `chrome://extensions/` (bouton de rafraîchissement)
3. Testez sur une page de recherche Google

## 📤 Déploiement sur le Chrome Web Store

### Préparation

1. **Générez les icônes PNG** (voir section Installation)
2. **Créez un package ZIP**
   ```bash
   zip -r getMapsTabBack.zip . -x "*.git*" -x "*.DS_Store" -x "generate-icons.html" -x "generate_icons.py" -x "convert-svg-to-png.sh" -x "*.svg"
   ```
   
   Le ZIP doit contenir :
   - `manifest.json`
   - `content.js`
   - `styles.css`
   - `_locales/` (dossier complet)
   - `icons/icon16.png`, `icons/icon48.png`, `icons/icon128.png`

3. **Préparez les métadonnées**
   - Nom de l'extension
   - Description (FR et EN)
   - Captures d'écran (1280x800 ou 640x400 recommandé)
   - Icône de promotion (440x280)

### Publication

1. **Créez un compte développeur Chrome Web Store**
   - Allez sur [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
   - Payez les frais d'inscription uniques (~5$ USD)

2. **Téléversez l'extension**
   - Cliquez sur "Nouvel élément"
   - Téléversez le fichier ZIP
   - Remplissez les informations :
     - Nom et description
     - Catégorie : Productivité
     - Langues supportées
     - Captures d'écran
     - Politique de confidentialité (si vous collectez des données)

3. **Soumettez pour révision**
   - Google examinera votre extension (généralement 1-3 jours)
   - Vous recevrez un email une fois l'extension approuvée

### Checklist avant publication

- [ ] Toutes les icônes PNG sont présentes
- [ ] Le manifest.json est valide
- [ ] L'extension fonctionne sur différentes variantes de Google
- [ ] Les traductions sont complètes
- [ ] Les captures d'écran sont prêtes
- [ ] La politique de confidentialité est rédigée (si nécessaire)

## 🐛 Dépannage

### L'onglet Maps n'apparaît pas

1. Vérifiez que vous êtes bien sur une page de recherche Google (`/search`)
2. Rechargez la page (F5 ou Cmd+R)
3. Vérifiez la console du navigateur (F12) pour d'éventuelles erreurs
4. Assurez-vous que l'extension est activée dans `chrome://extensions/`

### L'extension ne fonctionne pas sur certaines variantes de Google

L'extension supporte de nombreuses variantes de Google. Si une variante n'est pas supportée :
1. Vérifiez que l'URL est bien dans la liste des `matches` du `manifest.json`
2. Ajoutez la variante manquante si nécessaire

### Les icônes ne s'affichent pas

1. Vérifiez que les fichiers PNG existent dans le dossier `icons/`
2. Vérifiez que les chemins dans `manifest.json` sont corrects
3. Générez les icônes en utilisant `generate-icons.html` ou `generate_icons.py`

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
- Signaler des bugs
- Proposer des améliorations
- Soumettre des pull requests

## 📧 Contact

Pour toute question ou suggestion, ouvrez une issue sur le dépôt du projet.

## 🙏 Remerciements

Cette extension a été créée pour restaurer une fonctionnalité utile supprimée par Google suite aux réglementations européennes. Merci à tous ceux qui contribuent à améliorer l'expérience utilisateur sur le web.

---

**Note** : Cette extension n'est pas affiliée à Google. Elle est développée de manière indépendante pour améliorer l'expérience utilisateur.

