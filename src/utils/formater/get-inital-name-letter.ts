export const getInitialNameLetters = (name: string) => {
  const nameParts = name.trim().split(" ");
  
  if (nameParts.length > 1) {
    return nameParts[0][0].toUpperCase() + nameParts[1][0].toUpperCase();
  }
  
  return nameParts[0].substring(0, 2).toUpperCase();
};
