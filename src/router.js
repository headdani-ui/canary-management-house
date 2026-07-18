// ============================================================
// ROUTER — Hash-based SPA Router
// ============================================================

const routes = {};
let currentRoute = null;

export function registerRoute(path, handler) {
  routes[path] = handler;
}

export function navigate(path) {
  window.location.hash = path;
}

export function getCurrentRoute() {
  return currentRoute;
}

export function getRouteParams() {
  const hash = window.location.hash.slice(1) || '/';
  const parts = hash.split('/').filter(Boolean);
  return parts;
}

export function initRouter(defaultRoute = '/dashboard') {
  function handleRoute() {
    const hash = window.location.hash.slice(1) || defaultRoute;
    const parts = hash.split('/').filter(Boolean);
    const basePath = '/' + (parts[0] || defaultRoute.slice(1));

    currentRoute = basePath;

    const handler = routes[basePath];
    if (handler) {
      handler(parts.slice(1));
    } else if (routes[defaultRoute]) {
      navigate(defaultRoute);
    }
  }

  window.addEventListener('hashchange', handleRoute);
  handleRoute();
}
