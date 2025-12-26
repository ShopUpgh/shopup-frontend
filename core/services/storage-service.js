function createStorageService() {
  const isStorageAvailable = typeof window !== 'undefined' && !!window.localStorage;

  const getItem = (key, fallback = null) => {
    if (!isStorageAvailable) return fallback;
    const value = window.localStorage.getItem(key);
    return value !== null ? JSON.parse(value) : fallback;
  };

  const setItem = (key, value) => {
    if (!isStorageAvailable) return;
    window.localStorage.setItem(key, JSON.stringify(value));
  };

  return {
    getItem,
    setItem,
  };
}
