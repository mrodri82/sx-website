/**
 * Klaro! Cookie Consent Configuration for ZDS
 * https://github.com/klaro-org/klaro-js
 *
 * DSGVO/RGPD compliant, open-source, self-hosted.
 * Languages: ES (default), EN, DE
 */
window.klaroConfig = {
  version: 1,
  elementID: 'klaro',
  styling: {
    theme: ['dark', 'bottom', 'wide'],
  },
  noAutoLoad: false,
  htmlTexts: true,
  embedded: false,
  groupByPurpose: true,
  storageMethod: 'cookie',
  cookieName: 'zds-klaro',
  cookieExpiresAfterDays: 365,
  default: false,
  mustConsent: false,
  acceptAll: true,
  hideDeclineAll: false,
  hideLearnMore: false,
  noticeAsModal: false,

  translations: {
    zz: {
      privacyPolicyUrl: '/privacidad',
    },
    es: {
      consentModal: {
        title: 'Cookies y privacidad',
        description: 'Hola! Utilizamos cookies para mejorar tu experiencia, analizar el tráfico y mostrar contenido relevante. Puedes aceptar todas, rechazar las opcionales o personalizar tu consentimiento. Más información en nuestra <a href="/privacidad">política de privacidad</a>.',
      },
      consentNotice: {
        changeDescription: 'Hemos actualizado nuestras políticas, por favor revísalas.',
        description: 'Utilizamos cookies para mejorar tu experiencia y analizar el tráfico. {purposes} Puedes aceptar todas o gestionar tu consentimiento.',
        learnMore: 'Gestionar cookies',
      },
      purposes: {
        essential: {
          title: 'Esenciales',
          description: 'Cookies necesarias para el funcionamiento básico del sitio. No pueden desactivarse.',
        },
        analytics: {
          title: 'Analíticas',
          description: 'Nos ayudan a entender cómo los visitantes usan el sitio para mejorarlo.',
        },
        marketing: {
          title: 'Marketing',
          description: 'Utilizadas para mostrar publicidad relevante y medir su efectividad.',
        },
      },
      purposeItem: {
        service: 'servicio',
        services: 'servicios',
      },
      ok: 'Aceptar todas',
      acceptAll: 'Aceptar todas',
      acceptSelected: 'Aceptar selección',
      decline: 'Rechazar',
      close: 'Cerrar',
      save: 'Guardar',
      poweredBy: 'Con Klaro!',
      service: {
        disableAll: {
          title: 'Activar o desactivar todos los servicios',
          description: 'Usa este botón para activar o desactivar todos los servicios de una vez.',
        },
        optOut: {
          title: '(opt-out)',
          description: 'Este servicio está activo por defecto (opt-out).',
        },
        required: {
          title: '(obligatorio)',
          description: 'Este servicio es esencial y no puede desactivarse.',
        },
        purposes: 'Propósitos',
        purpose: 'Propósito',
      },
      googleAnalytics: {
        description: 'Análisis de tráfico web y comportamiento de usuarios (GA4).',
      },
      googleTagManager: {
        description: 'Gestor de etiquetas de Google para cargar herramientas de analítica y marketing.',
      },
      metaPixel: {
        description: 'Píxel de Meta (Facebook) para medir la efectividad de las campañas publicitarias.',
      },
    },
    en: {
      consentModal: {
        title: 'Cookies & Privacy',
        description: 'Hi! We use cookies to improve your experience, analyze traffic, and show relevant content. You can accept all, reject optional ones, or customize your consent. More info in our <a href="/en/privacidad">privacy policy</a>.',
      },
      consentNotice: {
        description: 'We use cookies to improve your experience and analyze traffic. {purposes}',
        learnMore: 'Manage cookies',
      },
      purposes: {
        essential: { title: 'Essential', description: 'Cookies necessary for basic site functionality. Cannot be disabled.' },
        analytics: { title: 'Analytics', description: 'Help us understand how visitors use the site to improve it.' },
        marketing: { title: 'Marketing', description: 'Used to show relevant advertising and measure effectiveness.' },
      },
      ok: 'Accept all',
      acceptAll: 'Accept all',
      acceptSelected: 'Accept selected',
      decline: 'Decline',
      close: 'Close',
      save: 'Save',
      service: {
        required: { title: '(required)', description: 'This service is essential and cannot be disabled.' },
        purposes: 'Purposes',
        purpose: 'Purpose',
      },
    },
    de: {
      consentModal: {
        title: 'Cookies & Datenschutz',
        description: 'Hallo! Wir verwenden Cookies, um deine Erfahrung zu verbessern, den Traffic zu analysieren und relevante Inhalte zu zeigen. Du kannst alle akzeptieren, optionale ablehnen oder deine Einwilligung anpassen. Mehr Infos in unserer <a href="/de/privacidad">Datenschutzerklärung</a>.',
      },
      consentNotice: {
        description: 'Wir verwenden Cookies, um deine Erfahrung zu verbessern und den Traffic zu analysieren. {purposes}',
        learnMore: 'Cookies verwalten',
      },
      purposes: {
        essential: { title: 'Essenziell', description: 'Cookies, die für die Grundfunktionen der Seite notwendig sind. Können nicht deaktiviert werden.' },
        analytics: { title: 'Analyse', description: 'Helfen uns zu verstehen, wie Besucher die Seite nutzen.' },
        marketing: { title: 'Marketing', description: 'Zur Anzeige relevanter Werbung und zur Messung ihrer Effektivität.' },
      },
      ok: 'Alle akzeptieren',
      acceptAll: 'Alle akzeptieren',
      acceptSelected: 'Auswahl akzeptieren',
      decline: 'Ablehnen',
      close: 'Schließen',
      save: 'Speichern',
      service: {
        required: { title: '(erforderlich)', description: 'Dieser Dienst ist essenziell und kann nicht deaktiviert werden.' },
        purposes: 'Zwecke',
        purpose: 'Zweck',
      },
    },
  },

  // ACTIVE SERVICES — only real services the site actually loads.
  services: [
    {
      name: 'essential',
      title: 'Esenciales',
      purposes: ['essential'],
      required: true,
      default: true,
      cookies: [
        ['zds-klaro', '/', 'zds.es'],
        ['nova_session', '/', 'zds.es'],
        ['nova_token', '/', 'zds.es'],
      ],
      description: 'Cookies técnicas necesarias: guardado de consentimiento (zds-klaro), sesión de administración (nova_session, nova_token — solo en /admin/).',
    },
    // Google Tag Manager — GTM-PMS6J42 (loads Google Analytics Universal/GA4)
    {
      name: 'googleTagManager',
      title: 'Google Tag Manager',
      purposes: ['analytics'],
      cookies: [
        [/^_ga/, '/', 'zds.es'],
        ['_gid', '/', 'zds.es'],
        ['_gat', '/', 'zds.es'],
        ['_gcl_au', '/', 'zds.es'],
      ],
      description: 'Carga Google Analytics para medir tráfico y comportamiento de usuarios. Los datos son anónimos y se usan para mejorar el sitio.',
      onAccept: `
        gtag('consent', 'update', {
          'analytics_storage': 'granted',
          'ad_storage': 'denied',
          'ad_user_data': 'denied',
          'ad_personalization': 'denied'
        });
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','GTM-PMS6J42');
      `,
      onDecline: `
        gtag('consent', 'update', { 'analytics_storage': 'denied' });
      `,
    },
  ],
};
