function createAuthService() {
  let currentUser = null;

  const login = (userId) => {
    if (!userId || typeof userId !== 'string') {
      return Promise.reject(new Error('Invalid userId'));
    }
    currentUser = { id: userId };
    return Promise.resolve(currentUser);
  };

  const logout = () => {
    currentUser = null;
    return Promise.resolve(true);
  };

  const getCurrentUser = () => currentUser;

  return {
    login,
    logout,
    getCurrentUser,
  };
}
