export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = reader.result as string;
      // Extract only the base64 part (remove data:image/png;base64,)
      const pureBase64 = base64String.split(',')[1];
      resolve(pureBase64);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const getBase64WithPrefix = (pureBase64: string, mimeType: string): string => {
  return `data:${mimeType};base64,${pureBase64}`;
};
