const metrics = require("../metrics.js");

test("cpu_usage", async () => {
    let answer = metrics.getCpuUsagePercentage();
    expect(typeof answer).toBe("number");
    expect(answer).toBeGreaterThanOrEqual(0);
    expect(Number(answer)).toBeGreaterThanOrEqual(0);
    expect(Number(answer)).toBeLessThanOrEqual(100);
});


test("memory_usage returns a string percentage", () => {
    const answer = metrics.getMemoryUsagePercentage();
    expect(typeof answer).toBe("string");
    expect(Number(answer)).toBeGreaterThanOrEqual(0);
    expect(Number(answer)).toBeLessThanOrEqual(100);
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

  test("trackPizzaOrder increments success and revenue", () => {
    const order = {
      items: [
        { price: 10 },
        { price: 15 }
      ]
    };
    metrics.trackPizzaOrder(order, true);
    metrics.trackPizzaOrder(order, false);
  });

  test("trackActiveUsers adds user to activeUsers", () => {
    const req = { user: { id: "testUser" } };
    const res = {};
    const next = jest.fn();

    const middleware = metrics.trackActiveUsers();
    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test("measureServiceLatency calculates latency", () => {
    const req = {};
    const res = { on: (event, cb) => cb() };
    const next = jest.fn();

    const middleware = metrics.measureServiceLatency();
    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test("measurePizzaLatency calculates latency", () => {
    const req = {};
    const res = { on: (event, cb) => cb() };
    const next = jest.fn();

    const middleware = metrics.measurePizzaLatency();
    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });
  