function createAIAssistantService() {
  return {
    name: 'AI Assistant',
    chat: (message) =>
      Promise.resolve({
        message,
        reply: 'Thanks for reaching out! How can I assist further?',
      }),
  };
}
