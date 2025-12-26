function createStorageService() {
  const isStorageAvailable = typeof window !== 'undefined' && !!window.localStorage;

  const getItem = (key, fallback = null) => {
    if (!isStorageAvailable) return fallback;
    const value = window.localStorage.getItem(key);
    if (value === null) return fallback;
    try {
      return JSON.parse(value);
    } catch (e) {
      console.warn(`StorageService: failed to parse stored value for key "${key}", returning fallback value`, e);
      return fallback;
    }
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
