/**
 * GSAP Animation System for zds.es
 * Initializes ScrollTrigger-based animations for all [data-animate] elements.
 * GSAP is now 100% free (Webflow acquired GreenSock).
 */

let gsapLoaded = false;

export async function initAnimations() {
  // Signal to CSS that GSAP has loaded — cancels the CSS fallback animation
  document.body.classList.add('gsap-active');

  // Respect reduced motion preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // Just reveal all elements without animation
    document.querySelectorAll('[data-animate]').forEach((el) => {
      (el as HTMLElement).style.opacity = '1';
      (el as HTMLElement).style.transform = 'none';
      (el as HTMLElement).style.clipPath = 'none';
    });
    return;
  }

  // Dynamically import GSAP (only loads when needed)
  const { gsap } = await import('gsap');
  const { ScrollTrigger } = await import('gsap/ScrollTrigger');

  gsap.registerPlugin(ScrollTrigger);
  gsapLoaded = true;

  // ── Animate all [data-animate] elements ──
  const animElements = document.querySelectorAll('[data-animate]');

  animElements.forEach((el) => {
    const type = el.getAttribute('data-animate');
    const delay = parseFloat(el.getAttribute('data-delay') || '0');
    const duration = parseFloat(el.getAttribute('data-duration') || '0.8');
    const stagger = el.getAttribute('data-stagger');

    const defaults = {
      opacity: 1,
      duration,
      delay,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        once: true,
      },
    };

    switch (type) {
      case 'fade-up':
        gsap.to(el, { ...defaults, y: 0 });
        break;
      case 'fade-down':
        gsap.to(el, { ...defaults, y: 0 });
        break;
      case 'fade-left':
        gsap.to(el, { ...defaults, x: 0 });
        break;
      case 'fade-right':
        gsap.to(el, { ...defaults, x: 0 });
        break;
      case 'scale-in':
        gsap.to(el, { ...defaults, scale: 1 });
        break;
      case 'reveal':
        gsap.to(el, { ...defaults, clipPath: 'inset(0 0% 0 0)', duration: 1.2 });
        break;
      default:
        gsap.to(el, { ...defaults });
    }
  });

  // ── Stagger groups: parent with [data-stagger] ──
  document.querySelectorAll('[data-stagger]').forEach((parent) => {
    const children = parent.querySelectorAll('[data-animate]');
    if (children.length === 0) return;

    const staggerVal = parseFloat(parent.getAttribute('data-stagger') || '0.1');

    children.forEach((child, i) => {
      const currentDelay = parseFloat((child as HTMLElement).getAttribute('data-delay') || '0');
      (child as HTMLElement).setAttribute('data-delay', String(currentDelay + i * staggerVal));
    });
  });

  // ── Counter animation for [data-count-to] ──
  document.querySelectorAll('[data-count-to]').forEach((el) => {
    const target = parseFloat(el.getAttribute('data-count-to') || '0');
    const suffix = el.getAttribute('data-count-suffix') || '';
    const prefix = el.getAttribute('data-count-prefix') || '';

    gsap.from(el, {
      textContent: 0,
      duration: 2,
      ease: 'power2.out',
      snap: { textContent: 1 },
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        once: true,
      },
      onUpdate: function () {
        const val = Math.round(parseFloat((el as HTMLElement).textContent || '0'));
        (el as HTMLElement).textContent = `${prefix}${val}${suffix}`;
      },
    });

    (el as HTMLElement).textContent = `${prefix}${target}${suffix}`;
  });

  // ── Nav scroll behavior ──
  const nav = document.querySelector('.glass-nav');
  if (nav) {
    ScrollTrigger.create({
      start: 'top -80',
      onUpdate: (self) => {
        if (self.direction === 1) {
          nav.classList.add('scrolled');
        } else {
          nav.classList.remove('scrolled');
        }
      },
    });
  }
}
