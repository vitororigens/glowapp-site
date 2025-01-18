export const checkIsPrivateRoute = (asPath: string) => {
    const privates = 
        asPath === '/perfil' ||
        asPath === '/favoritos'

    return privates
};

