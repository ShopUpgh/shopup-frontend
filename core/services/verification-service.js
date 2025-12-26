function createVerificationService() {
  return {
    name: 'Verification',
    verifySeller: (userId) =>
      Promise.resolve({
        userId,
        status: 'verified',
        badge: 'gold',
      }),
  };
}
