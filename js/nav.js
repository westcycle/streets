/**
 * Navigation: smooth scrolling and map size fix
 */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (a.getAttribute('href') === '#map') {
        setTimeout(() => map.invalidateSize(), 400);
      }
    }
  });
});
