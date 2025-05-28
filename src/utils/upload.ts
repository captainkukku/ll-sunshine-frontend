/** 真实项目这里改成 Supabase / OSS SDK */
export const uploadToServer = async (blob: Blob): Promise<string> => {
  return URL.createObjectURL(blob);            // mock
};

export const deleteFromServer = async (url: string) => {
  URL.revokeObjectURL(url);                    // mock
};

export const download = (url: string) => {
  const a = document.createElement('a');
  a.href = url;
  a.download = 'compare.jpg';
  a.click();
};
