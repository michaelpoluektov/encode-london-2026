const bootstrapRenderer = async (): Promise<void> => {
  await import("./renderer-app");
};

void bootstrapRenderer();
