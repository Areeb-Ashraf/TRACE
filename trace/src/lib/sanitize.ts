const sanitize = (input: string): string => {
  // A basic sanitizer that strips out HTML tags.
  // For more robust protection, a library like DOMPurify is recommended.
  return input.replace(/<[^>]*>?/gm, '');
};

export default sanitize; 