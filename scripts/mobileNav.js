const HEADER_SELECTOR = '.site-header';
const TOGGLE_SELECTOR = '.site-header__toggle';
const NAV_SELECTOR = '.site-nav';
const ENHANCED_CLASS = 'site-header--enhanced';
const OPEN_CLASS = 'site-header--open';
const DESKTOP_MEDIA_QUERY = '(min-width: 768px)';
const ESCAPE_KEY = 'Escape';

// collapses the navigation behind the menu button on small screens once JavaScript is available
export const initMobileNav = () => {
  const header = document.querySelector(HEADER_SELECTOR);
  const toggle = header?.querySelector(TOGGLE_SELECTOR);
  const nav = header?.querySelector(NAV_SELECTOR);
  const hasMenu = Boolean(header && toggle && nav);
  if (!hasMenu) return;

  const desktopQuery = window.matchMedia(DESKTOP_MEDIA_QUERY);

  const setOpen = (isOpen) => {
    header.classList.toggle(OPEN_CLASS, isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));
  };

  const close = () => setOpen(false);

  toggle.addEventListener('click', () => {
    const isOpen = header.classList.contains(OPEN_CLASS);
    setOpen(!isOpen);
  });

  nav.addEventListener('click', (event) => {
    const isLink = Boolean(event.target.closest('a'));
    if (isLink) {
      close();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === ESCAPE_KEY) {
      close();
    }
  });

  desktopQuery.addEventListener('change', (event) => {
    if (event.matches) {
      close();
    }
  });

  header.classList.add(ENHANCED_CLASS);
  close();
};
