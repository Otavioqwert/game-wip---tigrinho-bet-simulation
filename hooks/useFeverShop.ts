
// This hook is deprecated in favor of the integrated logic within useFebreDoce.ts
// We keep it as a hollow shell or redirect to keep imports from breaking until full refactor.
export const useFeverShop = () => {
    return { purchasePackage: () => {} }; 
};
