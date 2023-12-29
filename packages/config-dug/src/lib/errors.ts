class ConfigDugError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigDugError';
  }
}

export { ConfigDugError };
