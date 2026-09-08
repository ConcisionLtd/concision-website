const REVEAL_SELECTOR = '[data-reveal]';
const VISIBLE_CLASS = 'is-visible';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const OBSERVER_OPTIONS = { rootMargin: '0px 0px -10% 0px', threshold: 0 };

const reveal = (element) => element.classList.add(VISIBLE_CLASS);

const isInViewport = (element) => element.getBoundingClientRect().top < window.innerHeight;

// fades marked elements in as they scroll into view; anything already on screen shows at once
export const initRevealOnScroll = () => {
  const elements = [...document.querySelectorAll(REVEAL_SELECTOR)];
  if (elements.length === 0) return;

  const prefersReducedMotion = window.matchMedia(REDUCED_MOTION_QUERY).matches;
  const canObserve = 'IntersectionObserver' in window;
  if (prefersReducedMotion || !canObserve) {
    elements.forEach(reveal);
    return;
  }

  const observer = new IntersectionObserver((entries, activeObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      reveal(entry.target);
      activeObserver.unobserve(entry.target);
    });
  }, OBSERVER_OPTIONS);

  elements.forEach((element) => {
    const elementIsInViewport = isInViewport(element);
    if (elementIsInViewport) {
      reveal(element);
    } else {
      observer.observe(element);
    }
  });
};
