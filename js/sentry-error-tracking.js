// sentry-error-tracking.js - SAFE helper (never crashes if Sentry/tracing not available)
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

  // Tracing is optional. Loader script may not provide startTransaction.
  function safeStartTransaction(name, op) {
    const S = getSentry();
    if (!S) return null;

    try {
      if (typeof S.startTransaction === "function") {
        return S.startTransaction({ name: name || "Transaction", op: op || "custom" });
      }
    } catch (_) {}

    return null;
  }

  function safeFinishTransaction(tx, status) {
    if (!tx) return;
    try {
      if (status && typeof tx.setStatus === "function") tx.setStatus(status);
      if (typeof tx.finish === "function") tx.finish();
    } catch (_) {}
  }

  // Some SDKs support setMeasurement; loader script often doesn't.
  function safeSetMeasurement(tx, key, value, unit) {
    if (!tx) return;
    try {
      if (typeof tx.setMeasurement === "function") {
        tx.setMeasurement(key, value, unit);
      }
    } catch (_) {}
  }

  const SentryTracking = {
    // Track payment operations
    async trackPayment(paymentFunction, paymentData) {
      const tx = safeStartTransaction("Process Payment", "payment");
      safeSetContext("payment", paymentData);
      safeSetTag("transaction_type", "payment");

      try {
        const result = await paymentFunction();
        safeFinishTransaction(tx, "ok");
        return result;
      } catch (error) {
        safeFinishTransaction(tx, "internal_error");
        safeCaptureException(error, {
          tags: {
            error_category: "payment",
            payment_method: paymentData?.paymentMethod,
            amount: paymentData?.amount,
          },
          contexts: { payment: paymentData || {} },
        });
        throw error;
      } finally {
        // finish already handled
      }
    },

    // Track checkout process
    async trackCheckout(step, checkoutFunction, checkoutData) {
      const tx = safeStartTransaction(`Checkout: ${step}`, "checkout");
      safeSetContext("checkout", checkoutData);
      safeSetTag("flow", "checkout");
      safeSetTag("checkout_step", step);

      try {
        const result = await checkoutFunction();
        safeFinishTransaction(tx, "ok");
        return result;
      } catch (error) {
        safeFinishTransaction(tx, "internal_error");
        safeCaptureException(error, {
          tags: { error_category: "checkout", checkout_step: step },
          contexts: { checkout: checkoutData || {} },
        });
        throw error;
      }
    },

    // Track cart operations
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
          tags: { error_category: "cart", action: action },
          contexts: { cart_item: itemData || {} },
        });
        throw error;
      }
    },

    // Track database operations
    async trackDatabaseOperation(dbFunction, table, operation) {
      const tx = safeStartTransaction(`${operation} ${table}`, "db.query");
      safeSetTag("db_table", table);
      safeSetTag("db_operation", operation);

      try {
        const result = await dbFunction();
        safeFinishTransaction(tx, "ok");
        return result;
      } catch (error) {
        safeFinishTransaction(tx, "internal_error");
        safeCaptureException(error, {
          tags: { error_category: "database", table: table, operation: operation },
        });
        throw error;
      }
    },

    // Track authentication
    async trackAuth(authFunction, method) {
      const tx = safeStartTransaction(`Authentication: ${method}`, "auth");
      safeSetTag("auth_method", method);

      try {
        const result = await authFunction();
        safeFinishTransaction(tx, "ok");

        const user = result?.user;
        if (user?.id || user?.email) {
          safeSetUser({ id: user.id, email: user.email });
        }

        return result;
      } catch (error) {
        safeFinishTransaction(tx, "unauthenticated");
        safeCaptureException(error, {
          tags: { error_category: "authentication", auth_method: method },
        });
        throw error;
      }
    },

    // Track API calls
    async trackAPICall(apiFunction, endpoint, method = "GET") {
      const tx = safeStartTransaction(`${method} ${endpoint}`, "http.client");
      const startTime = performance.now();

      try {
        const result = await apiFunction();
        const duration = performance.now() - startTime;

        safeFinishTransaction(tx, "ok");
        safeSetMeasurement(tx, "api_call_duration", duration, "millisecond");

        if (duration > 2000) {
          safeCaptureMessage(`Slow API call: ${endpoint}`, {
            level: "warning",
            tags: {
              performance_issue: "true",
              endpoint: endpoint,
              duration: Math.round(duration),
            },
          });
        }

        return result;
      } catch (error) {
        safeFinishTransaction(tx, "internal_error");
        safeCaptureException(error, {
          tags: { error_category: "api", endpoint: endpoint, method: method },
        });
        throw error;
      }
    },

    // Track product operations
    trackProductOperation(action, productData) {
      safeAddBreadcrumb({
        category: "product",
        message: `Product ${action}`,
        level: "info",
        data: productData || {},
      });
    },

    // Track order operations
    trackOrderOperation(action, orderData) {
      safeAddBreadcrumb({
        category: "order",
        message: `Order ${action}`,
        level: "info",
        data: orderData || {},
      });
    },

    // Track performance metrics
    trackPerformance(metricName, value, thresholds = {}) {
      // Measurement API may not exist on loader; capture message if too slow.
      if (thresholds?.warning && value > thresholds.warning) {
        safeCaptureMessage(`Performance issue: ${metricName}`, {
          level: value > (thresholds.critical || Infinity) ? "error" : "warning",
          tags: {
            performance_issue: "true",
            metric_name: metricName,
            metric_value: value,
          },
        });
      }
    },

    // Track user actions
    trackUserAction(action, data = {}) {
      safeAddBreadcrumb({
        category: "user_action",
        message: String(action),
        level: "info",
        data: data || {},
      });
    },

    // Track business metrics
    trackBusinessMetric(metric, value, metadata = {}) {
      safeCaptureMessage(`Business Metric: ${metric}`, {
        level: "info",
        tags: {
          metric_type: "business",
          metric_name: metric,
          metric_value: String(value),
        },
        contexts: { business_metric: metadata || {} },
      });
    },
  };

  // Expose globally
  window.SentryTracking = SentryTracking;
})();
