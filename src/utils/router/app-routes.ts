type RouteType = 'public' | 'private';

const PRIVATE_ROUTES: string[] = [
  '/perfil',
  '/favoritos'
];

export const checkIsPrivateRoute = (asPath: string): boolean => {
  return PRIVATE_ROUTES.includes(asPath);
};

export const getRouteType = (asPath: string): RouteType => {
  return checkIsPrivateRoute(asPath) ? 'private' : 'public';
};

