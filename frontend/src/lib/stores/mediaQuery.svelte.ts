const query = window.matchMedia('(min-width: 768px)');
let isDesktop = $state(query.matches);

query.addEventListener('change', (e) => {
  isDesktop = e.matches;
});

export const getIsDesktop = () => isDesktop;
