import { signal } from '@preact/signals';

const routes = [
  '',
  '/',
  '/enterprise',
  '/not-found',
] as const;
export type Route = typeof routes[number];

export const route = signal<Route>('');

route.subscribe((newRoute) => {
  location.hash = newRoute;
});

window.addEventListener('hashchange', () => {
  const tmp = window.location.hash.slice(1) as Route;
  if (routes.includes(tmp)) {
    route.value = tmp;
  } else {
    route.value = '/not-found';
  }
});
