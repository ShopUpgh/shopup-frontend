// /js/sentry-error-tracking.js - SAFE helper (NO tracing; avoids BrowserTracing warnings)
(function () {
  "use strict";

  function hasSentry() {
    return typeof window !== "undefined" && typeof window.Sentry !== "undefined";
  }

  function getSentry() {
    return hasSentry() ? window.Sentry : null;
  }

  function safeCaptureException(err, context) {
    const S = getSentry();
    if (!S) return;
    try {
      S.captureException(err instanceof Error ? err : new Error(String(err)), context || {});
    } catch (_) {}
  }

  function safeCaptureMessage(msg, context) {
    const S = getSentry();
    if (!S) return;
    try {
      S.captureMessage(String(msg), context || {});
    } catch (_) {}
  }

  function safeSetTag(key, value) {
    const S = getSentry();
    if (!S) return;
    try {
      S.setTag(String(key), String(value));
    } catch (_) {}
  }

  function safeSetContext(name, data) {
    const S = getSentry();
    if (!S) return;
    try {
      S.setContext(String(name), data || {});
    } catch (_) {}
  }

  function safeAddBreadcrumb(crumb) {
    const S = getSentry();
    if (!S) return;
    try {
      S.addBreadcrumb(crumb);
    } catch (_) {}
  }

  function safeSetUser(user) {
    const S = getSentry();
    if (!S) return;
    try {
      S.setUser(user || null);
    } catch (_) {}
  }

  const SentryTracking = {
    // Payment operations
    async trackPayment(fn, paymentData) {
      safeSetContext("payment", paymentData);
      safeSetTag("transaction_type", "payment");
      try {
        return await fn();
      } catch (error) {
        safeCaptureException(error, {
          tags: {
            error_category: "payment",
            payment_method: paymentData?.paymentMethod,
            amount: paymentData?.amount,
          },
          contexts: { payment: paymentData || {} },
        });
        throw error;
      }
    },

    // Checkout process
    async trackCheckout(step, fn, checkoutData) {
      safeSetContext("checkout", checkoutData);
      safeSetTag("flow", "checkout");
      safeSetTag("checkout_step", step);

      try {
        return await fn();
      } catch (error) {
        safeCaptureException(error, {
          tags: { error_category: "checkout", checkout_step: step },
          contexts: { checkout: checkoutData || {} },
        });
        throw error;
      }
    },

    // Cart operations
    async trackCartOperation(operation, action, itemData) {
      safeAddBreadcrumb({
        category: "cart",
        message: `Cart ${action}`,
        level: "info",
        data: itemData || {},
      });

      try {
        return await operation();
      } catch (error) {
        safeCaptureException(error, {
          tags: { error_category: "cart", action },
          contexts: { cart_item: itemData || {} },
        });
        throw error;
      }
    },

    // Database ops
    async trackDatabaseOperation(fn, table, operation) {
      safeSetTag("db_table", table);
      safeSetTag("db_operation", operation);

      try {
        return await fn();
      } catch (error) {
        safeCaptureException(error, {
          tags: { error_category: "database", table, operation },
        });
        throw error;
      }
    },

    // Authentication
    async trackAuth(fn, method) {
      safeSetTag("auth_method", method);

      try {
        const result = await fn();
        const user = result?.user;
        if (user?.id || user?.email) safeSetUser({ id: user.id, email: user.email });
        return result;
      } catch (error) {
        safeCaptureException(error, {
          tags: { error_category: "authentication", auth_method: method },
        });
        throw error;
      }
    },

    // API calls (no perf timing, just error capture + optional slow warning via message if you pass duration)
    async trackAPICall(fn, endpoint, method = "GET") {
      safeSetTag("endpoint", endpoint);
      safeSetTag("http_method", method);

      try {
        return await fn();
      } catch (error) {
        safeCaptureException(error, {
          tags: { error_category: "api", endpoint, method },
        });
        throw error;
      }
    },

    // Simple breadcrumbs/messages
    trackProductOperation(action, productData) {
      safeAddBreadcrumb({ category: "product", message: `Product ${action}`, level: "info", data: productData || {} });
    },

    trackOrderOperation(action, orderData) {
      safeAddBreadcrumb({ category: "order", message: `Order ${action}`, level: "info", data: orderData || {} });
    },

    trackUserAction(action, data = {}) {
      safeAddBreadcrumb({ category: "user_action", message: String(action), level: "info", data: data || {} });
    },

    trackBusinessMetric(metric, value, metadata = {}) {
      safeCaptureMessage(`Business Metric: ${metric}`, {
        level: "info",
        tags: { metric_type: "business", metric_name: metric, metric_value: String(value) },
        contexts: { business_metric: metadata || {} },
      });
    },
  };

  window.SentryTracking = SentryTracking;
})();
