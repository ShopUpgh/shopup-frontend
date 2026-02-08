(function () {
  "use strict";

  function createAuthAdapter({ supabaseWait }) {
    return {
      async signIn(email, password) {
        const supabase = await supabaseWait.waitForSupabase();
        return supabase.auth.signInWithPassword({ email, password });
      },
      async signOut() {
        const supabase = await supabaseWait.waitForSupabase();
        return supabase.auth.signOut();
      },
      async getSession() {
        const supabase = await supabaseWait.waitForSupabase();
        return supabase.auth.getSession();
      },
    };
  }

  window.ShopUpAuthAdapterFactory = { createAuthAdapter };
})();
