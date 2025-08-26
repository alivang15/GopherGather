export const sanitizeInput = (input: string): string => {
  if (typeof window === 'undefined') {
    return input;
  }
  const div = document.createElement('div');
  div.innerHTML = input;
  return div.textContent || '';
};
