/**
 * Content script pour restaurer l'onglet Maps dans les résultats de recherche Google
 * Supporte les recherches dynamiques et toutes les variantes de Google
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    // Sélecteurs pour la barre d'onglets Google (mis à jour pour la structure actuelle)
    selectors: {
      tabsContainer: [
        '#hdtb-msb',
        '#hdtb-msb-vis',
        '.hdtb-mitem',
        '[role="navigation"]',
        '.hdtb-sc',
        '#hdtb',
        'div[data-hveid]',
        'div[jscontroller]'
      ],
      tabItem: [
        '.hdtb-mitem',
        'a[data-hveid]',
        'a[jsname]',
        '[role="tab"]',
        'a[href*="/search"]'
      ],
      activeTab: '.hdtb-msel',
      // Sélecteurs alternatifs pour différentes versions de Google
      alternativeContainers: [
        'div[data-ved]',
        '.hdtb-td-o',
        '.hdtb-td-s',
        '#hdtbSum'
      ]
    },
    // Délai pour observer les mutations DOM
    mutationObserverDelay: 300,
    // Intervalle de vérification (fallback)
    checkInterval: 1000,
    // Mode debug (activer pour voir les logs dans la console)
    debug: true
  };

  // Détection de la langue
  const getLanguage = () => {
    const lang = navigator.language || navigator.userLanguage;
    return lang.startsWith('fr') ? 'fr' : 'en';
  };

  const isFrench = getLanguage() === 'fr';
  const MAPS_TAB_TEXT = isFrench ? 'Maps' : 'Maps';
  const MAPS_TAB_ARIA = isFrench ? 'Maps' : 'Maps';

  /**
   * Extrait la requête de recherche depuis l'URL
   */
  function getSearchQuery() {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');
    return query ? decodeURIComponent(query) : '';
  }

  /**
   * Construit l'URL Google Maps avec la requête de recherche
   */
  function buildMapsUrl(query) {
    if (!query) {
      return 'https://www.google.com/maps';
    }
    const encodedQuery = encodeURIComponent(query);
    return `https://www.google.com/maps/search/${encodedQuery}`;
  }

  /**
   * Log de débogage
   */
  function debugLog(...args) {
    if (CONFIG.debug) {
      console.log('[MapsTab Extension]', ...args);
    }
  }

  /**
   * Vérifie si l'onglet Maps existe déjà
   */
  function mapsTabExists() {
    // Essayer tous les sélecteurs possibles
    for (const selector of CONFIG.selectors.tabItem) {
      const existingTabs = document.querySelectorAll(selector);
      for (const tab of existingTabs) {
        const text = tab.textContent.trim().toLowerCase();
        const href = tab.getAttribute('href') || '';
        if (text === 'maps' || text === 'cartes' || href.includes('maps.google.com') || href.includes('/maps')) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Liste des textes d'onglets valides de Google (pour filtrer les vrais onglets)
   */
  const VALID_TAB_TEXTS = [
    'tous', 'all', 'images', 'image', 'actualités', 'news', 'vidéos', 'videos', 
    'vidéos courtes', 'shorts', 'web', 'livres', 'books', 'plus', 'more', 
    'outils', 'tools', 'shopping', 'achats', 'finance', 'vols', 'flights'
  ];
  
  /**
   * Liste des textes à exclure (éléments d'accessibilité, etc.)
   */
  const EXCLUDED_TEXTS = [
    'passer directement au contenu principal',
    'aide sur l\'accessibilité',
    'commentaires sur l\'accessibilité',
    'skip to main content',
    'accessibility help',
    'accessibility feedback'
  ];

  /**
   * Vérifie si un élément est un onglet de navigation valide
   */
  function isValidTab(tab) {
    const text = tab.textContent.trim().toLowerCase();
    const href = tab.getAttribute('href') || '';
    
    // Exclure les éléments d'accessibilité
    if (EXCLUDED_TEXTS.some(excluded => text.includes(excluded))) {
      return false;
    }
    
    // Ignorer notre onglet Maps s'il existe déjà
    if (text === 'maps' || text === 'cartes' || 
        href.includes('maps.google.com') || href.includes('/maps/search')) {
      return false;
    }
    
    // Si l'élément a la classe hdtb-mitem, c'est probablement un onglet valide
    if (tab.classList.contains('hdtb-mitem')) {
      // Vérifier qu'il a un href (c'est un lien)
      if (href) {
        // Accepter si c'est un lien de recherche ou si le texte correspond à un onglet connu
        const isKnownTab = VALID_TAB_TEXTS.some(validText => text === validText || text.startsWith(validText));
        const hasSearchHref = href.includes('/search');
        return isKnownTab || hasSearchHref || text.length > 0; // Accepter si le texte existe
      }
    }
    
    // Fallback: vérifier si le texte correspond à un onglet connu
    const isKnownTab = VALID_TAB_TEXTS.some(validText => text === validText || text.startsWith(validText));
    return isKnownTab;
  }

  /**
   * Trouve tous les onglets existants dans la barre horizontale
   * Cherche les vrais onglets de navigation (Tous, Images, Actualités, etc.)
   */
  function findAllTabs() {
    const allTabs = [];
    const seenTabs = new Set();
    
    // Liste des textes d'onglets de navigation principaux (pas les filtres)
    const navigationTabTexts = [
      'tous', 'all', 'images', 'image', 'actualités', 'news', 'vidéos', 'videos', 
      'vidéos courtes', 'shorts', 'web', 'livres', 'books', 'plus', 'more'
    ];
    
    // Priorité 1: Chercher dans les conteneurs spécifiques de Google
    const specificContainers = ['#hdtb-msb', '#hdtb-msb-vis'];
    
    for (const containerSelector of specificContainers) {
      const container = document.querySelector(containerSelector);
      debugLog('Recherche dans', containerSelector, ':', container ? 'trouvé' : 'non trouvé');
      if (container) {
        // Chercher tous les liens dans ce conteneur
        const links = container.querySelectorAll('a');
        debugLog('  Liens trouvés:', links.length);
        links.forEach(link => {
          if (seenTabs.has(link)) return;
          
          const text = link.textContent.trim().toLowerCase();
          const href = link.getAttribute('href') || '';
          
          // Vérifier si c'est un onglet de navigation principal
          const isNavTab = navigationTabTexts.some(navText => text === navText || text.startsWith(navText));
          
          if (isNavTab && href.includes('/search')) {
            debugLog('  - Onglet navigation trouvé:', link.textContent.trim());
            allTabs.push(link);
            seenTabs.add(link);
          }
        });
        
        if (allTabs.length > 0) {
          debugLog('Onglets trouvés dans', containerSelector, ':', allTabs.length);
          break;
        }
      }
    }
    
    // Priorité 2: Si on n'a rien trouvé, chercher dans toute la page par texte
    if (allTabs.length === 0) {
      debugLog('Recherche par texte dans toute la page...');
      const allLinks = document.querySelectorAll('a');
      debugLog('  Total de liens sur la page:', allLinks.length);
      
      allLinks.forEach(link => {
        if (seenTabs.has(link)) return;
        
        const text = link.textContent.trim().toLowerCase();
        const href = link.getAttribute('href') || '';
        
        // Vérifier si c'est un onglet de navigation principal
        const isNavTab = navigationTabTexts.some(navText => text === navText || text.startsWith(navText));
        
        // Exclure les filtres temporels et autres éléments non pertinents
        const isFilter = text.includes('moins d') || text.includes('moins de') || 
                        text.includes('mot à mot') || text.includes('exact') ||
                        text.includes('passer') || text.includes('aide') || text.includes('commentaire');
        
        if (isNavTab && href.includes('/search') && !isFilter) {
          // Vérifier la position (les onglets sont en haut de page)
          const rect = link.getBoundingClientRect();
          if (rect.top < window.innerHeight * 0.4 && rect.top > 0 && rect.left < window.innerWidth * 0.8) {
            debugLog('  - Onglet navigation trouvé:', link.textContent.trim(), '| Position:', rect.top.toFixed(0));
            allTabs.push(link);
            seenTabs.add(link);
          }
        }
      });
    }
    
    // Priorité 3: Recherche dans #hdtb mais en filtrant mieux
    if (allTabs.length === 0) {
      const hdtb = document.querySelector('#hdtb');
      debugLog('Recherche dans #hdtb:', hdtb ? 'trouvé' : 'non trouvé');
      if (hdtb) {
        const links = hdtb.querySelectorAll('a');
        debugLog('  Liens trouvés dans #hdtb:', links.length);
        links.forEach(link => {
          if (seenTabs.has(link)) return;
          
          const text = link.textContent.trim().toLowerCase();
          const href = link.getAttribute('href') || '';
          
          // Vérifier si c'est un onglet de navigation principal
          const isNavTab = navigationTabTexts.some(navText => text === navText || text.startsWith(navText));
          const isFilter = text.includes('moins d') || text.includes('moins de') || 
                          text.includes('mot à mot') || text.includes('exact');
          
          if (isNavTab && href.includes('/search') && !isFilter) {
            const rect = link.getBoundingClientRect();
            // Les onglets de navigation sont généralement en haut et à gauche
            if (rect.top < window.innerHeight * 0.4 && rect.top > 0 && rect.left < window.innerWidth * 0.7) {
              debugLog('  - Onglet navigation trouvé:', link.textContent.trim());
              allTabs.push(link);
              seenTabs.add(link);
            }
          }
        });
      }
    }
    
    // Trier les onglets par leur position dans le DOM (ordre d'affichage)
    allTabs.sort((a, b) => {
      const position = a.compareDocumentPosition(b);
      if (position & Node.DOCUMENT_POSITION_FOLLOWING) {
        return -1;
      } else if (position & Node.DOCUMENT_POSITION_PRECEDING) {
        return 1;
      }
      return 0;
    });
    
    debugLog('Onglets trouvés (final):', allTabs.length, allTabs.map(t => t.textContent.trim()));
    return allTabs;
  }

  /**
   * Trouve le conteneur des onglets
   * Priorité aux conteneurs spécifiques de Google pour la barre horizontale
   */
  function findTabsContainer() {
    // Priorité 1: Conteneurs spécifiques de Google pour la barre d'onglets horizontale
    const specificContainers = [
      '#hdtb-msb',           // Conteneur principal des onglets
      '#hdtb-msb-vis'        // Conteneur visible des onglets
    ];
    
    for (const selector of specificContainers) {
      const container = document.querySelector(selector);
      if (container) {
        // Vérifier qu'il contient des onglets valides
        const tabs = container.querySelectorAll('a.hdtb-mitem');
        if (tabs.length > 0) {
          // Vérifier qu'au moins un onglet est valide
          const hasValidTabs = Array.from(tabs).some(tab => isValidTab(tab));
          if (hasValidTabs) {
            debugLog('Conteneur trouvé avec sélecteur spécifique:', selector);
            return container;
          }
        }
      }
    }
    
    // Priorité 2: Si on a trouvé des onglets, utiliser leur parent direct
    const tabs = findAllTabs();
    if (tabs.length > 0) {
      // Le parent direct devrait être le conteneur des onglets
      const directParent = tabs[0].parentElement;
      if (directParent) {
        // Vérifier que tous les onglets ont le même parent direct
        const allSameParent = tabs.every(tab => tab.parentElement === directParent);
        if (allSameParent) {
          debugLog('Conteneur trouvé (parent direct commun):', directParent.tagName, directParent.className || directParent.id);
          return directParent;
        }
        
        // Sinon, chercher un parent commun qui contient tous les onglets
        let parent = directParent;
        while (parent && parent !== document.body) {
          const allInParent = tabs.every(tab => parent.contains(tab));
          if (allInParent) {
            // Vérifier que c'est un conteneur d'onglets (a l'ID ou la classe hdtb)
            if (parent.id && parent.id.includes('hdtb')) {
              debugLog('Conteneur trouvé via parent commun (ID):', parent.id);
              return parent;
            }
            if (parent.classList.contains('hdtb') || parent.classList.contains('hdtb-sc')) {
              debugLog('Conteneur trouvé via parent commun (classe):', parent.className);
              return parent;
            }
          }
          parent = parent.parentElement;
        }
        
        // Fallback: retourner le parent direct même si tous les onglets n'ont pas le même parent
        debugLog('Conteneur trouvé (parent direct - fallback):', directParent.tagName);
        return directParent;
      }
    }
    
    // Priorité 3: Recherche dans #hdtb
    const hdtb = document.querySelector('#hdtb');
    if (hdtb) {
      const tabs = hdtb.querySelectorAll('a.hdtb-mitem');
      if (tabs.length > 0) {
        debugLog('Conteneur trouvé (#hdtb)');
        return hdtb;
      }
    }
    
    debugLog('Aucun conteneur trouvé');
    return null;
  }

  /**
   * Crée l'élément onglet Maps en clonant exactement un onglet existant
   * pour hériter toute sa structure et ses styles
   */
  function createMapsTab(referenceTab) {
    const query = getSearchQuery();
    const mapsUrl = buildMapsUrl(query);

    if (!referenceTab) {
      debugLog('Aucun onglet de référence fourni');
      return null;
    }

    // Cloner l'élément <a> de référence COMPLÈTEMENT (avec enfants) pour copier toute la structure
    const mapsTabLink = referenceTab.cloneNode(true);
    
    // Modifier uniquement ce qui est nécessaire pour Maps
    mapsTabLink.href = mapsUrl;
    
    // Mettre à jour le texte - la structure est: <a><div><span>Texte</span></div></a>
    const spanNode = mapsTabLink.querySelector('span.R1QWuf');
    if (spanNode) {
      spanNode.textContent = MAPS_TAB_TEXT;
    } else {
      // Fallback si la structure est différente
      const textNode = mapsTabLink.querySelector('span, div') || mapsTabLink;
      if (textNode) {
        textNode.textContent = MAPS_TAB_TEXT;
      } else {
        mapsTabLink.textContent = MAPS_TAB_TEXT;
      }
    }
    
    // Mettre à jour l'aria-label
    mapsTabLink.setAttribute('aria-label', MAPS_TAB_ARIA);
    if (mapsTabLink.hasAttribute('aria-current')) {
      mapsTabLink.removeAttribute('aria-current');
    }
    if (mapsTabLink.hasAttribute('aria-disabled')) {
      mapsTabLink.removeAttribute('aria-disabled');
    }
    
    // Supprimer les attributs spécifiques qui pourraient causer des problèmes
    mapsTabLink.removeAttribute('data-ved');
    mapsTabLink.removeAttribute('data-hveid');
    mapsTabLink.removeAttribute('jsaction');
    mapsTabLink.removeAttribute('jsname');
    mapsTabLink.removeAttribute('selected');
    
    // Retirer la classe "actif" si elle existe
    mapsTabLink.classList.remove('hdtb-msel');
    mapsTabLink.classList.remove(CONFIG.selectors.activeTab.replace('.', ''));
    
    // S'assurer qu'on garde toutes les classes importantes pour le style
    // Ne pas toucher aux autres classes - elles sont nécessaires pour le style Google
    
    // Nettoyer les styles inline qui pourraient avoir été copiés
    mapsTabLink.style.cssText = '';
    
    // Ajouter une classe pour identifier notre onglet (optionnel, pour le CSS si nécessaire)
    mapsTabLink.classList.add('maps-tab-extension');

    // Créer le conteneur <div role="listitem"> comme les autres onglets
    const listItem = document.createElement('div');
    listItem.setAttribute('role', 'listitem');
    listItem.appendChild(mapsTabLink);

    debugLog('Onglet Maps créé en clonant:', referenceTab.className, '→', mapsTabLink.className);
    return listItem;
  }

  /**
   * Trouve le conteneur horizontal qui contient tous les onglets de navigation
   * La structure est: <div role="list"> contient plusieurs <div role="listitem"> qui contiennent <a>
   */
  function findHorizontalTabsContainer(tabs) {
    if (tabs.length === 0) return null;
    
    // Trouver le parent commun qui contient tous les onglets
    // Les onglets sont dans des <div role="listitem">, donc on cherche le <div role="list">
    let commonParent = tabs[0].parentElement;
    
    // Remonter jusqu'à trouver le conteneur avec role="list"
    while (commonParent && commonParent !== document.body) {
      // Vérifier si c'est le conteneur avec role="list"
      if (commonParent.getAttribute('role') === 'list') {
        debugLog('Conteneur role="list" trouvé:', commonParent.className || commonParent.id || 'sans classe/id');
        return commonParent;
      }
      
      // Vérifier que tous les onglets sont dans ce parent
      const allInParent = tabs.every(tab => {
        let parent = tab.parentElement;
        while (parent && parent !== document.body) {
          if (parent === commonParent) return true;
          parent = parent.parentElement;
        }
        return false;
      });
      
      if (allInParent) {
        // Vérifier que c'est un conteneur horizontal (affiche les éléments en ligne)
        const style = window.getComputedStyle(commonParent);
        const isHorizontal = style.display === 'flex' || 
                            style.display === 'inline-flex' ||
                            commonParent.getAttribute('role') === 'list' ||
                            // Vérifier si les onglets sont alignés horizontalement
                            (tabs.length > 1 && Math.abs(tabs[0].getBoundingClientRect().top - tabs[1].getBoundingClientRect().top) < 5);
        
        if (isHorizontal) {
          debugLog('Conteneur horizontal trouvé:', commonParent.tagName, commonParent.className || commonParent.id || 'sans classe/id');
          return commonParent;
        }
      }
      commonParent = commonParent.parentElement;
    }
    
    // Fallback: retourner le parent direct du premier onglet (qui devrait être le <div role="listitem">)
    // puis son parent (qui devrait être le <div role="list">)
    const firstTabListItem = tabs[0].parentElement;
    if (firstTabListItem && firstTabListItem.getAttribute('role') === 'listitem') {
      const listContainer = firstTabListItem.parentElement;
      if (listContainer) {
        debugLog('Conteneur trouvé via parent du listitem:', listContainer.tagName, listContainer.className || listContainer.id || 'sans classe/id');
        return listContainer;
      }
    }
    
    debugLog('Conteneur horizontal non trouvé, utilisation du parent direct');
    return tabs[0].parentElement;
  }

  /**
   * Insère l'onglet Maps dans la barre d'onglets
   * S'assure que l'insertion se fait dans le même conteneur horizontal que les autres onglets
   */
  function insertMapsTab() {
    // Vérifier si l'onglet existe déjà
    if (mapsTabExists()) {
      debugLog('L\'onglet Maps existe déjà');
      return false;
    }

    const tabs = findAllTabs();
    if (tabs.length === 0) {
      debugLog('Aucun onglet trouvé sur la page');
      return false;
    }

    // Trouver où insérer (après "Images" si possible, sinon après "Tous", sinon après le premier onglet)
    let insertAfter = tabs[0];
    for (let i = 0; i < tabs.length; i++) {
      const tabText = tabs[i].textContent.trim().toLowerCase();
      if (tabText === 'images' || tabText === 'image') {
        insertAfter = tabs[i];
        debugLog('Insertion après "Images"');
        break;
      }
    }
    // Si "Images" n'a pas été trouvé, chercher "Tous"
    if (insertAfter === tabs[0]) {
      for (let i = 0; i < tabs.length; i++) {
        const tabText = tabs[i].textContent.trim().toLowerCase();
        if (tabText === 'tous' || tabText === 'all') {
          insertAfter = tabs[i];
          debugLog('Insertion après "Tous"');
          break;
        }
      }
    }

    // Trouver le conteneur horizontal qui contient tous les onglets
    const container = findHorizontalTabsContainer(tabs);
    if (!container) {
      debugLog('Impossible de trouver le conteneur horizontal');
      return false;
    }

    debugLog('Conteneur trouvé:', container.tagName, container.className || container.id || 'sans classe/id');
    debugLog('  Contient', container.children.length, 'enfants');

    // Créer l'onglet Maps en clonant l'onglet de référence
    const mapsTab = createMapsTab(insertAfter);
    if (!mapsTab) {
      debugLog('Impossible de créer l\'onglet Maps');
      return false;
    }

    try {
      // Trouver le <div role="listitem"> qui contient l'onglet de référence
      let insertAfterListItem = insertAfter.parentElement;
      while (insertAfterListItem && insertAfterListItem.getAttribute('role') !== 'listitem') {
        insertAfterListItem = insertAfterListItem.parentElement;
      }
      
      if (!insertAfterListItem) {
        debugLog('Impossible de trouver le listitem parent');
        return false;
      }
      
      // Insérer le nouveau listitem (qui contient l'onglet Maps) après le listitem de référence
      const nextListItem = insertAfterListItem.nextSibling;
      if (nextListItem) {
        container.insertBefore(mapsTab, nextListItem);
        debugLog('Inséré avec insertBefore après le listitem de référence');
      } else {
        container.appendChild(mapsTab);
        debugLog('Inséré avec appendChild (dernier élément)');
      }
      
      // Vérifier que l'insertion a réussi
      if (mapsTab.parentNode) {
        // Forcer un reflow pour appliquer les styles
        mapsTab.offsetHeight;
        debugLog('✓ Onglet Maps inséré avec succès');
        debugLog('  Position: après', insertAfter.textContent.trim());
        debugLog('  Conteneur final:', mapsTab.parentNode.tagName, mapsTab.parentNode.className || mapsTab.parentNode.id || 'sans classe/id');
        return true;
      } else {
        debugLog('✗ Échec de l\'insertion - l\'onglet n\'a pas de parent');
        return false;
      }
    } catch (e) {
      console.error('[MapsTab Extension] Erreur lors de l\'insertion:', e);
      debugLog('Détails de l\'erreur:', e.message);
      if (e.stack) {
        debugLog('Stack:', e.stack);
      }
      return false;
    }
  }

  /**
   * Fonction principale pour ajouter l'onglet Maps
   */
  function addMapsTab() {
    // Attendre que le DOM soit prêt
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', addMapsTab);
      return;
    }

    // Vérifier qu'on est bien sur une page de recherche
    if (!window.location.pathname.includes('/search')) {
      return;
    }

    insertMapsTab();
  }

  /**
   * Observer les mutations DOM pour gérer les recherches dynamiques
   */
  function setupMutationObserver() {
    const observer = new MutationObserver(function(mutations) {
      let shouldRecheck = false;
      
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Vérifier si des onglets ont été ajoutés
          for (const node of mutation.addedNodes) {
            if (node.nodeType === 1) { // Element node
              if (node.matches && (
                node.matches(CONFIG.selectors.tabItem) ||
                node.querySelector && node.querySelector(CONFIG.selectors.tabItem)
              )) {
                shouldRecheck = true;
                break;
              }
            }
          }
        }
      });

      if (shouldRecheck) {
        // Délai pour éviter les appels trop fréquents
        setTimeout(function() {
          if (!mapsTabExists()) {
            insertMapsTab();
          }
        }, CONFIG.mutationObserverDelay);
      }
    });

    // Observer le body et les conteneurs d'onglets
    const observeTarget = document.body || document.documentElement;
    if (observeTarget) {
      observer.observe(observeTarget, {
        childList: true,
        subtree: true
      });
    }

    return observer;
  }

  /**
   * Fallback: vérification périodique
   */
  function setupPeriodicCheck() {
    setInterval(function() {
      if (!mapsTabExists() && window.location.pathname.includes('/search')) {
        insertMapsTab();
      }
    }, CONFIG.checkInterval);
  }

  /**
   * Gérer les changements d'URL (pour les SPA)
   */
  function setupUrlChangeListener() {
    let currentUrl = window.location.href;
    
    // Observer les changements d'URL
    const checkUrlChange = setInterval(function() {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        // Attendre un peu pour que le DOM se mette à jour
        setTimeout(function() {
          if (window.location.pathname.includes('/search')) {
            insertMapsTab();
          }
        }, 500);
      }
    }, 500);

    // Nettoyer l'intervalle si la page est déchargée
    window.addEventListener('beforeunload', function() {
      clearInterval(checkUrlChange);
    });
  }

  // Initialisation
  function init() {
    debugLog('Initialisation de l\'extension Maps Tab');
    
    // Attendre un peu que le DOM soit complètement chargé
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        setTimeout(init, 500);
      });
      return;
    }

    // Ajouter l'onglet immédiatement avec un petit délai
    setTimeout(function() {
      addMapsTab();
    }, 300);

    // Configurer l'observer pour les mutations DOM
    setupMutationObserver();

    // Configurer la vérification périodique (fallback)
    setupPeriodicCheck();

    // Gérer les changements d'URL
    setupUrlChangeListener();
  }

  // Démarrer l'extension
  init();
})();

