// Interface copy only. City rule text never lives here: it is quoted from src/data/.
// Spanish interface text was translated with AI assistance and has not yet been reviewed by a native speaker.

export type Locale = 'en' | 'es'

export interface UiStrings {
  appName: string
  cityChip: string
  skipToContent: string
  heroLead: string
  heroRotatingItems: string[]
  heroSub: string
  searchLabel: string
  searchPlaceholders: string[]
  typeaheadLabel: string
  typeaheadCount: (count: number) => string
  quickPicksLabel: string
  quickPicks: string[]
  resultRegionLabel: string
  answerLabel: string
  quoteIntro: string
  sourceLine: (title: string, date: string) => string
  sourceShort: string
  opensInNewTab: string
  textOmitted: string
  tipsLabel: string
  howToLabel: string
  haulerLabel: string
  haulerNote: string
  noExactTitle: (query: string) => string
  didYouMean: string
  suggestionsNote: string
  emptyQueryTitle: string
  noRuleTitle: string
  noRuleBody: (query: string) => string
  contactTitle: string
  contactEmail: string
  contactPhone: string
  copyGapReport: string
  copied: string
  explainTitle: string
  explainTyped: string
  explainNormalized: string
  explainDropped: string
  explainMatch: string
  explainExact: (term: string) => string
  explainNoExact: string
  explainThreshold: string
  explainCandidates: string
  explainTerm: string
  explainScore: string
  browseTitle: string
  browseIntro: string
  ruleCount: (count: number) => string
  numbersTitle: string
  statRules: string
  statTerms: string
  statSources: string
  statNetwork: string
  moreLabel: string
  howItWorksTitle: string
  howItWorksSteps: Array<{ title: string; body: string }>
  sourcesTitle: (count: number) => string
  fetchedOn: (date: string) => string
  savedCopy: string
  accessTitle: string
  accessPoints: string[]
  languageLabel: string
  translationNote: string
  englishOnlyNote: string
  footerNote: string
  sourceCode: string
}

export const strings: Record<Locale, UiStrings> = {
  en: {
    appName: 'Bin It Right',
    cityChip: 'Long Beach, City-serviced carts',
    skipToContent: 'Skip to the search',
    heroLead: 'Where does this go?',
    heroRotatingItems: ['pizza box', 'AA batteries', 'glass jar', 'plastic bag', 'coffee grounds', 'old couch'],
    heroSub:
      "Type what you're throwing away. You get the City of Long Beach's own rule, quoted word for word, with a link to the page it came from.",
    searchLabel: 'What are you throwing away?',
    searchPlaceholders: [
      'Try: greasy pizza box',
      'Try: AA batteries',
      'Try: empty glass jar',
      'Try: plastic grocery bag',
      'Try: coffee grounds',
      'Try: old couch',
    ],
    typeaheadLabel: 'Matching items',
    typeaheadCount: (count) => `${count} matching ${count === 1 ? 'item' : 'items'}`,
    quickPicksLabel: 'Common items',
    quickPicks: ['Pizza box', 'Battery', 'Plastic bag', 'Coffee grounds', 'Paint', 'Aluminum foil'],
    resultRegionLabel: 'Answer',
    answerLabel: 'Goes to',
    quoteIntro: "The City's rule, word for word",
    sourceLine: (title, date) => `City of Long Beach, ${title}, saved ${date}`,
    sourceShort: 'Source',
    opensInNewTab: '(opens in a new tab)',
    textOmitted: 'Some of the City text is left out here.',
    tipsLabel: 'City tips',
    howToLabel: 'How to do it',
    haulerLabel: 'Who collects your carts',
    haulerNote: 'These rules are for City-serviced accounts. If a private hauler collects your carts, ask them.',
    noExactTitle: (query) => `No exact match for "${query}"`,
    didYouMean: 'Did you mean one of these?',
    suggestionsNote: 'Pick the item you meant to see its rule. Close matches are never shown as answers on their own.',
    emptyQueryTitle: 'Type an item to search',
    noRuleTitle: 'No official rule found',
    noRuleBody: (query) =>
      `The City of Long Beach has not published a sorting rule for "${query}" in the pages this app uses, so it will not guess. Ask the City directly.`,
    contactTitle: 'Ask the City',
    contactEmail: 'Email',
    contactPhone: 'Call',
    copyGapReport: 'Copy a gap report',
    copied: 'Copied',
    explainTitle: 'Why this answer',
    explainTyped: 'You typed',
    explainNormalized: 'Searched for',
    explainDropped: 'Words ignored',
    explainMatch: 'Match',
    explainExact: (term) => `Exact match with the listed term "${term}"`,
    explainNoExact: 'No listed term matched exactly',
    explainThreshold: 'Suggestion threshold',
    explainCandidates: 'Closest listed terms',
    explainTerm: 'Listed term',
    explainScore: 'Similarity',
    browseTitle: 'Browse every official rule',
    browseIntro: 'Grouped by where it goes. Tap an item to see the full rule and its source.',
    ruleCount: (count) => `${count} ${count === 1 ? 'rule' : 'rules'}`,
    numbersTitle: 'What is inside',
    statRules: 'Official rules',
    statTerms: 'Words and phrases it understands',
    statSources: 'City pages saved and hashed',
    statNetwork: 'Network calls per search',
    moreLabel: 'More about Bin It Right',
    howItWorksTitle: 'How this works',
    howItWorksSteps: [
      {
        title: 'Only official sources',
        body: 'Every rule was copied from a City of Long Beach page or flyer. Each page is saved with its address, the date it was fetched and a SHA-256 hash.',
      },
      {
        title: 'Checked word for word',
        body: 'An automated test fails the build if any rule has no source, or if any quote does not appear exactly in the saved page.',
      },
      {
        title: 'Plain, predictable matching',
        body: 'Your words are lowercased, accents and filler words are removed, and plurals are made singular. Then they are compared with a written list of item names.',
      },
      {
        title: 'Close is not the same as right',
        body: 'A near match is shown as "Did you mean", never as an answer. If nothing is close, the app says no official rule was found and points you to the City.',
      },
      {
        title: 'Private and offline',
        body: 'No accounts, no tracking, no AI model at runtime. After the first visit the app works without a connection.',
      },
    ],
    sourcesTitle: (count) => `Sources (${count} City pages)`,
    fetchedOn: (date) => `saved ${date}`,
    savedCopy: 'Saved copy',
    accessTitle: 'Accessibility',
    accessPoints: [
      'Every button is at least 48 by 48 pixels.',
      'Colour is never the only signal: each destination has a name and an icon.',
      'Answers are announced to screen readers, and focus moves to the answer.',
      'Animations stop when your device asks for reduced motion.',
      "Spanish mode shows the City's own Spanish wording where the City publishes it.",
    ],
    languageLabel: 'Language',
    translationNote:
      "Quotes in Spanish are the City's own published wording. Where the City publishes only English, the English rule is shown. Spanish interface text was translated with AI assistance.",
    englishOnlyNote: 'The City publishes this rule in English only, so it is shown in English.',
    footerNote:
      "Bin It Right is an independent student project, not a City of Long Beach service. Every answer quotes the City's published sorting rules word for word.",
    sourceCode: 'Source code and data on GitHub',
  },
  es: {
    appName: 'Bin It Right',
    cityChip: 'Long Beach, contenedores con servicio de la Ciudad',
    skipToContent: 'Ir a la búsqueda',
    heroLead: '¿Dónde va esto?',
    heroRotatingItems: ['caja de pizza', 'pilas AA', 'frasco de vidrio', 'bolsa de plástico', 'borra de café', 'sillón viejo'],
    heroSub:
      'Escribe lo que vas a tirar. Verás la regla de la Ciudad de Long Beach citada palabra por palabra, con un enlace a la página de donde viene.',
    searchLabel: '¿Qué vas a tirar?',
    searchPlaceholders: [
      'Prueba: caja de pizza',
      'Prueba: pilas AA',
      'Prueba: frasco de vidrio',
      'Prueba: bolsa de plástico',
      'Prueba: borra de café',
      'Prueba: sillón viejo',
    ],
    typeaheadLabel: 'Artículos que coinciden',
    typeaheadCount: (count) => `${count} ${count === 1 ? 'artículo coincide' : 'artículos coinciden'}`,
    quickPicksLabel: 'Artículos comunes',
    quickPicks: ['Caja de pizza', 'Pila', 'Bolsa de plástico', 'Borra de café', 'Pintura', 'Colchón'],
    resultRegionLabel: 'Respuesta',
    answerLabel: 'Va en',
    quoteIntro: 'La regla de la Ciudad, palabra por palabra',
    sourceLine: (title, date) => `Ciudad de Long Beach, ${title}, guardada el ${date}`,
    sourceShort: 'Fuente',
    opensInNewTab: '(se abre en una pestaña nueva)',
    textOmitted: 'Aquí se omite parte del texto de la Ciudad.',
    tipsLabel: 'Consejos de la Ciudad',
    howToLabel: 'Cómo hacerlo',
    haulerLabel: 'Quién recoge tus contenedores',
    haulerNote:
      'Estas reglas son para cuentas con servicio de la Ciudad. Si un recolector privado recoge tus contenedores, pregúntale a él.',
    noExactTitle: (query) => `No hay una coincidencia exacta para "${query}"`,
    didYouMean: '¿Quisiste decir alguno de estos?',
    suggestionsNote:
      'Elige el artículo que buscabas para ver su regla. Una coincidencia parecida nunca se muestra como respuesta por sí sola.',
    emptyQueryTitle: 'Escribe un artículo para buscar',
    noRuleTitle: 'No se encontró una regla oficial',
    noRuleBody: (query) =>
      `La Ciudad de Long Beach no ha publicado una regla de separación para "${query}" en las páginas que usa esta app, así que no va a adivinar. Pregúntale directamente a la Ciudad.`,
    contactTitle: 'Pregúntale a la Ciudad',
    contactEmail: 'Correo',
    contactPhone: 'Llamar',
    copyGapReport: 'Copiar reporte de regla faltante',
    copied: 'Copiado',
    explainTitle: 'Por qué esta respuesta',
    explainTyped: 'Escribiste',
    explainNormalized: 'Se buscó',
    explainDropped: 'Palabras ignoradas',
    explainMatch: 'Coincidencia',
    explainExact: (term) => `Coincidencia exacta con el término "${term}"`,
    explainNoExact: 'Ningún término coincidió exactamente',
    explainThreshold: 'Umbral para sugerencias',
    explainCandidates: 'Términos más cercanos',
    explainTerm: 'Término',
    explainScore: 'Similitud',
    browseTitle: 'Explorar todas las reglas oficiales',
    browseIntro: 'Agrupadas según dónde van. Toca un artículo para ver la regla completa y su fuente.',
    ruleCount: (count) => `${count} ${count === 1 ? 'regla' : 'reglas'}`,
    numbersTitle: 'Qué contiene',
    statRules: 'Reglas oficiales',
    statTerms: 'Palabras y frases que entiende',
    statSources: 'Páginas de la Ciudad guardadas',
    statNetwork: 'Llamadas de red por búsqueda',
    moreLabel: 'Más sobre Bin It Right',
    howItWorksTitle: 'Cómo funciona',
    howItWorksSteps: [
      {
        title: 'Solo fuentes oficiales',
        body: 'Cada regla viene de una página o folleto de la Ciudad de Long Beach. Cada página se guarda con su dirección, la fecha en que se consultó y un hash SHA-256.',
      },
      {
        title: 'Revisado palabra por palabra',
        body: 'Una prueba automática detiene la compilación si una regla no tiene fuente o si una cita no aparece exactamente en la página guardada.',
      },
      {
        title: 'Búsqueda simple y predecible',
        body: 'Tus palabras se pasan a minúsculas, se quitan acentos y palabras de relleno, y los plurales se vuelven singulares. Luego se comparan con una lista escrita de nombres de artículos.',
      },
      {
        title: 'Parecido no es lo mismo que correcto',
        body: 'Una coincidencia parecida aparece como "¿Quisiste decir?", nunca como respuesta. Si nada se parece, la app dice que no hay una regla oficial y te dirige a la Ciudad.',
      },
      {
        title: 'Privado y sin conexión',
        body: 'Sin cuentas, sin rastreo y sin modelos de IA al usarla. Después de la primera visita funciona sin conexión.',
      },
    ],
    sourcesTitle: (count) => `Fuentes (${count} páginas de la Ciudad)`,
    fetchedOn: (date) => `guardada el ${date}`,
    savedCopy: 'Copia guardada',
    accessTitle: 'Accesibilidad',
    accessPoints: [
      'Cada botón mide al menos 48 por 48 píxeles.',
      'El color nunca es la única señal: cada destino tiene nombre e ícono.',
      'Las respuestas se anuncian a los lectores de pantalla y el foco pasa a la respuesta.',
      'Las animaciones se detienen si tu dispositivo pide menos movimiento.',
      'El modo en español muestra el texto en español de la Ciudad cuando la Ciudad lo publica.',
    ],
    languageLabel: 'Idioma',
    translationNote:
      'Las citas en español son el texto publicado por la Ciudad. Cuando la Ciudad publica solo en inglés, se muestra la regla en inglés. El texto de la interfaz en español se tradujo con ayuda de IA.',
    englishOnlyNote: 'La Ciudad publica esta regla solo en inglés, por eso se muestra en inglés.',
    footerNote:
      'Bin It Right es un proyecto estudiantil independiente, no un servicio de la Ciudad de Long Beach. Cada respuesta cita palabra por palabra las reglas de separación publicadas por la Ciudad.',
    sourceCode: 'Código y datos en GitHub',
  },
}
