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

let chaosCount = 0;
 
 
 function addChaosCount(){
     chaosCount++;
 }


//HTTP Requests
function getRequests() {
  return (req, res, next) => {
    requests[req.method] = (requests[req.method] || 0) + 1;
    next();
  };
}

//Authentication Requests
function authenticationRequests(status) {
  if (status === true) {
    authSuccess += 1;
  } else {
    authFail += 1;
  }
}

//Pizza ordering Success, Failure, Revenue
function trackPizzaOrder(order, success) {
  if (success == false) {
    pizzaFailure += 1;
    return;
  } else {
    pizzaPurchases += 1;
    for (let i = 0; i < order.items.length; i++) {
      revenue += order.items[i].price;
    }
  }
}

//Track Active users
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
      const endTime = Date.now();
      latency = endTime - startTime;
    });

    next();
  };
}

function measurePizzaLatency() {
  return (req, res, next) => {
    const startTime = Date.now();

    res.on("finish", () => {
      const endTime = Date.now();
      pizza_latency = endTime - startTime;
    });

    next();
  };
}

function removeInactiveUsers() {
  if (Object.keys(activeUsers).length < 1) {
    return;
  }

  const now = Date.now();

  const TIMEOUT_THRESHOLD = 100000;

  for (const [userId, lastActivityTime] of Object.entries(activeUsers)) {
    if (now - lastActivityTime > TIMEOUT_THRESHOLD) {
      delete activeUsers[userId];
      console.log(`Removed inactive user: ${userId}`);
    }
  }
}

//CPU Usage
function getCpuUsagePercentage() {
  const cpuUsage = os.loadavg()[0] / os.cpus().length;
  return cpuUsage.toFixed(2) * 100;
}

//Memory Usage
function getMemoryUsagePercentage() {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const memoryUsage = (usedMemory / totalMemory) * 100;
  return memoryUsage.toFixed(2);
}

function getRequestTotal() {
  let total = 0;
  Object.keys(requests).forEach((method) => {
    total += requests[method];
  });

  return total;
}

setInterval(() => {
  // HTTP requests by method/minute
  Object.keys(requests).forEach((method) => {
    sendMetricToGrafana(`requests_${method}`, requests[method], "sum", "1", {
      method,
    });
  });

  //Send Total HTTP Requests
  sendMetricToGrafana("requests_total", getRequestTotal(), "sum", "1");

  //Latency
  sendMetricToGrafana("service_latency", latency, "gauge", "1");
  sendMetricToGrafana("pizza_latency", pizza_latency, "gauge", "1");
  latency = 0;
  pizza_latency = 0;

  //Pizza
  sendMetricToGrafana("pizza_success", pizzaPurchases, "sum", "1");
  sendMetricToGrafana("pizza_failure", pizzaFailure, "sum", "1");
  sendMetricToGrafana("pizza_revenue", revenue, "sum", "1");

  //Authentication per minute
  sendMetricToGrafana("auth_success", authSuccess, "sum", "1");
  sendMetricToGrafana("auth_fail", authFail, "sum", "1");

  //CPU Usage
  sendMetricToGrafana("cpu", getCpuUsagePercentage(), "gauge", "%");
  // Memory Usage
  sendMetricToGrafana("memory", getMemoryUsagePercentage(), "gauge", "%");

  //Active Users
  sendMetricToGrafana(
    "active_users",
    Object.keys(activeUsers).length,
    "sum",
    "1"
  );

  sendMetricToGrafana("chaosCount", chaosCount, "sum", "1");

  removeInactiveUsers();
}, 10000);

function sendMetricToGrafana(
  metricName,
  metricValue,
  type,
  unit,
  attributes = {}
) {
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
                      attributes: Object.entries(attributes).map(
                        ([key, value]) => ({
                          key,
                          value: { stringValue: value.toString() },
                        })
                      ),
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
    metric.resourceMetrics[0].scopeMetrics[0].metrics[0][
      type
    ].aggregationTemporality = "AGGREGATION_TEMPORALITY_CUMULATIVE";
    metric.resourceMetrics[0].scopeMetrics[0].metrics[0][
      type
    ].isMonotonic = true;
  }

  const body = JSON.stringify(metric);
  fetch(`${config.metrics.url}`, {
    method: "POST",
    body: body,
    headers: {
      Authorization: `Bearer ${config.metrics.apiKey}`,
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      if (!response.ok) {
        response.text().then((text) => {
          console.error(
            `Failed to push metrics data to Grafana: ${text}\n${body}`
          );
        });
      } else {
        console.log(`Pushed ${metricName}`);
      }
    })
    .catch((error) => {
      console.error("Error pushing metrics:", error);
    });
}

module.exports = {
  getRequests,
  authenticationRequests,
  trackPizzaOrder,
  trackActiveUsers,
  measureServiceLatency,
  measurePizzaLatency,
  getCpuUsagePercentage,
  getMemoryUsagePercentage,
  getRequestTotal,
  addChaosCount
};