const config = require("./config.js");
const os = require("os");

let requests = {};

let authSuccess = 0;
let authFail = 0;

let pizzaPurchases = 0;
let pizzaFailure = 0;
let revenue = 0;

let activeUsers = {};

let latency = 0;
let pizza_latency = 0;

// HTTP Requests
function getRequests() {
  return (req, res, next) => {
    requests[req.method] = (requests[req.method] || 0) + 1;
    next();
  };
}

// Authentication Requests
function authenticationRequests(status) {
  if (status) {
    authSuccess += 1;
  } else {
    authFail += 1;
  }
}

// Pizza ordering Success, Failure, Revenue
function pizzaOrderTracking(order, success) {
  if (!success) {
    pizzaFailure += 1;
    return;
  }
  pizzaPurchases += 1;
  order.items.forEach((item) => {
    revenue += item.price;
  });
}

// Track Active users
function trackActiveUsers() {
  return (req, res, next) => {
    const userId = req.user ? req.user.id : req.sessionID;
    if (userId) {
      activeUsers[userId] = Date.now();
    }
    next();
  };
}

function measureServiceLatency() {
  return (req, res, next) => {
    const startTime = Date.now();
    res.on("finish", () => {
      latency = Date.now() - startTime;
    });
    next();
  };
}

function measurePizzaLatency() {
  return (req, res, next) => {
    const startTime = Date.now();
    res.on("finish", () => {
      pizza_latency = Date.now() - startTime;
    });
    next();
  };
}

function removeInactiveUsers() {
  const now = Date.now();
  const TIMEOUT_THRESHOLD = 100000;
  Object.entries(activeUsers).forEach(([userId, lastActivityTime]) => {
    if (now - lastActivityTime > TIMEOUT_THRESHOLD) {
      delete activeUsers[userId];
    }
  });
}

// CPU Usage
function getCpuUsagePercentage() {
  return parseFloat(((os.loadavg()[0] / os.cpus().length) * 100).toFixed(2));
}

// Memory Usage
function getMemoryUsagePercentage() {
  return parseFloat(((1 - os.freemem() / os.totalmem()) * 100).toFixed(2));
}

function getRequestTotal() {
  return Object.values(requests).reduce((total, count) => total + count, 0);
}

// Metrics Collection Interval
const METRICS_INTERVAL = setInterval(() => {
  Object.entries(requests).forEach(([method, count]) => {
    sendMetricToGrafana(`requests_${method}`, count, "sum", "1", { method });
  });

  sendMetricToGrafana("requests_total", getRequestTotal(), "sum", "1");
  sendMetricToGrafana("service_latency", latency, "gauge", "1");
  sendMetricToGrafana("pizza_latency", pizza_latency, "gauge", "1");
  latency = 0;
  pizza_latency = 0;

  sendMetricToGrafana("pizza_success", pizzaPurchases, "sum", "1");
  sendMetricToGrafana("pizza_failure", pizzaFailure, "sum", "1");
  sendMetricToGrafana("pizza_revenue", revenue, "sum", "1");

  sendMetricToGrafana("auth_success", authSuccess, "sum", "1");
  sendMetricToGrafana("auth_fail", authFail, "sum", "1");

  sendMetricToGrafana("cpu", getCpuUsagePercentage(), "gauge", "%");
  sendMetricToGrafana("memory", getMemoryUsagePercentage(), "gauge", "%");

  sendMetricToGrafana("active_users", Object.keys(activeUsers).length, "sum", "1");

  removeInactiveUsers();
}, 10000);

function stopMetricsCollection() {
  clearInterval(METRICS_INTERVAL);
}

function sendMetricToGrafana(metricName, metricValue, type, unit, attributes = {}) {
  const metric = {
    resourceMetrics: [
      {
        scopeMetrics: [
          {
            metrics: [
              {
                name: metricName,
                unit: unit,
                [type]: {
                  dataPoints: [
                    {
                      asDouble: metricValue,
                      timeUnixNano: Date.now() * 1000000,
                      attributes: Object.entries(attributes).map(([key, value]) => ({
                        key,
                        value: { stringValue: value.toString() },
                      })),
                    },
                  ],
                },
              },
            ],
          },
        ],
      },
    ],
  };

  if (type === "sum") {
    metric.resourceMetrics[0].scopeMetrics[0].metrics[0][type].aggregationTemporality =
      "AGGREGATION_TEMPORALITY_CUMULATIVE";
    metric.resourceMetrics[0].scopeMetrics[0].metrics[0][type].isMonotonic = true;
  }

  fetch(config.metrics.url, {
    method: "POST",
    body: JSON.stringify(metric),
    headers: {
      Authorization: `Bearer ${config.metrics.apiKey}`,
      "Content-Type": "application/json",
    },
  }).catch((error) => console.error("Error pushing metrics:", error));
}

module.exports = {
  getRequests,
  authenticationRequests,
  pizzaOrderTracking,
  trackActiveUsers,
  measureServiceLatency,
  measurePizzaLatency,
  getCpuUsagePercentage,
  getMemoryUsagePercentage,
  getRequestTotal,
  removeInactiveUsers,
  activeUsers,
  stopMetricsCollection,
};
