let innerWidth = $state(window.innerWidth);
let listenerAttached = false;

const ensureListener = () => {
  if (listenerAttached) return;
  listenerAttached = true;
  window.addEventListener('resize', () => {
    innerWidth = window.innerWidth;
  });
};

export const getIsDesktop = () => {
  ensureListener();
  return innerWidth >= 768;
};
