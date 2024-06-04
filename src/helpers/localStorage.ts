const localStorage = () => {
  const getItem = (key: string) => {
    return window.localStorage.getItem(key);
  };

  const setItem = (key: string, value: any) => {
    window.localStorage.setItem(key, value);
  };

  const removeItem = (key: string) => {
    window.localStorage.removeItem(key);
  };

  const clear = () => {
    window.localStorage.clear();
  };

  return {
    getItem,
    setItem,
    removeItem,
    clear,
  };
};

export default localStorage;
