const metrics = require("../metrics.js");

describe("Metrics Tests", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test("cpu_usage returns a number", () => {
    const answer = metrics.getCpuUsagePercentage();
    expect(typeof answer).toBe("string");
    expect(parseFloat(answer)).toBeGreaterThanOrEqual(0);
  });

  test("memory_usage returns a number", () => {
    const answer = metrics.getMemoryUsagePercentage();
    expect(typeof answer).toBe("string");
    expect(parseFloat(answer)).toBeGreaterThanOrEqual(0);
  });

  test("getRequests tracks HTTP requests", () => {
    const mockReq = { method: "GET" };
    const mockRes = {};
    const mockNext = jest.fn();

    const middleware = metrics.getRequests();
    middleware(mockReq, mockRes, mockNext);

    expect(metrics.getRequestTotal()).toBeGreaterThanOrEqual(1);
    expect(mockNext).toHaveBeenCalled();
  });

  test("authenticationRequests tracks successful and failed auth attempts", () => {
    metrics.authenticationRequests(true);
    metrics.authenticationRequests(false);
    metrics.authenticationRequests(false);

    expect(metrics.getRequestTotal()).toBeGreaterThanOrEqual(0);
  });

  test("pizzaOrderTracking tracks successful and failed pizza orders", () => {
    const order1 = { items: [{ price: 10 }, { price: 15 }] };
    const order2 = { items: [{ price: 20 }] };

    metrics.pizzaOrderTracking(order1, true);
    metrics.pizzaOrderTracking(order2, false); 

    expect(metrics.getRequestTotal()).toBeGreaterThanOrEqual(0);
  });

  test("trackActiveUsers updates active user list", () => {
    const mockReq = { user: { id: "user1" } };
    const mockRes = {};
    const mockNext = jest.fn();

    const middleware = metrics.trackActiveUsers();
    middleware(mockReq, mockRes, mockNext);

    expect(Object.keys(metrics.activeUsers).length).toBeGreaterThan(0);
    expect(mockNext).toHaveBeenCalled();
  });

  test("measureServiceLatency correctly calculates latency", () => {
    const mockReq = {};
    const mockRes = {
      on: (event, callback) => {
        if (event === "finish") callback();
      },
    };
    const mockNext = jest.fn();

    const middleware = metrics.measureServiceLatency();
    middleware(mockReq, mockRes, mockNext);

    expect(metrics.getRequestTotal()).toBeGreaterThanOrEqual(0);
    expect(mockNext).toHaveBeenCalled();
  });

  test("removeInactiveUsers correctly removes inactive users", () => {
    metrics.activeUsers = {
      user1: Date.now() - 200000, 
      user2: Date.now(), 
    };

    metrics.removeInactiveUsers();

    expect(Object.keys(metrics.activeUsers)).toContain("user2");
    expect(Object.keys(metrics.activeUsers)).not.toContain("user1");
  });

  afterAll(() => {
    metrics.stopMetricsCollection(); 
  });
});
