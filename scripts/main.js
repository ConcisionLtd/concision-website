import { initMobileNav } from './mobileNav.js';
import { initRevealOnScroll } from './revealOnScroll.js';

const JS_ENABLED_CLASS = 'js';

document.documentElement.classList.add(JS_ENABLED_CLASS);
initMobileNav();
initRevealOnScroll();
