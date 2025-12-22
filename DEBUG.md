# Guide de débogage - Extension Maps Tab

## Problème : L'onglet Maps n'apparaît pas

### Étapes de débogage

1. **Vérifier que l'extension est chargée**
   - Allez à `chrome://extensions/` (ou `brave://extensions/`)
   - Vérifiez que l'extension est activée
   - Vérifiez qu'il n'y a pas d'erreurs (icône d'alerte rouge)

2. **Ouvrir la console de débogage**
   - Sur une page de recherche Google, appuyez sur `F12` ou `Cmd+Option+I` (Mac)
   - Allez dans l'onglet "Console"
   - Rechargez la page (F5)

3. **Vérifier les logs**
   - Avec le mode debug activé, vous devriez voir des messages commençant par `[MapsTab Extension]`
   - Si vous voyez "Aucun onglet trouvé" ou "Conteneur d'onglets non trouvé", cela signifie que les sélecteurs ne trouvent pas les éléments

4. **Inspecter manuellement la structure**
   - Dans la console, tapez :
   ```javascript
   // Trouver tous les onglets possibles
   document.querySelectorAll('a[href*="/search"]');
   document.querySelectorAll('.hdtb-mitem');
   document.querySelectorAll('[role="tab"]');
   ```
   - Regardez quels sélecteurs retournent des résultats

5. **Tester manuellement l'insertion**
   - Dans la console, essayez de trouver le conteneur :
   ```javascript
   // Trouver le conteneur des onglets
   document.querySelector('#hdtb-msb');
   document.querySelector('#hdtb-msb-vis');
   ```
   - Si un de ces sélecteurs fonctionne, notez-le

## Solutions courantes

### Si aucun onglet n'est trouvé

La structure de Google a peut-être changé. Essayez de :
1. Désactiver puis réactiver l'extension
2. Recharger complètement la page (Ctrl+Shift+R ou Cmd+Shift+R)
3. Vider le cache du navigateur

### Si le conteneur n'est pas trouvé

Les sélecteurs peuvent ne pas correspondre à votre version de Google. Dans ce cas :
1. Inspectez manuellement la page (clic droit > Inspecter)
2. Trouvez la barre d'onglets dans l'inspecteur
3. Notez les classes et IDs utilisés
4. Modifiez les sélecteurs dans `content.js` si nécessaire

### Activer le mode debug

Le mode debug est déjà activé par défaut dans la version actuelle. Si vous voulez le désactiver, modifiez dans `content.js` :
```javascript
debug: false
```

## Signaler un problème

Si l'extension ne fonctionne toujours pas après ces étapes :
1. Notez votre version de Chrome/Brave
2. Notez votre version de Google (google.com, google.fr, etc.)
3. Copiez les messages de la console
4. Ouvrez une issue avec ces informations

