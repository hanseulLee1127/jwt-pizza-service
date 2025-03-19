const metrics = require("../metrics.js");

test("cpu_usage", async () => {
    let answer = metrics.getCpuUsagePercentage();
    expect(typeof answer).toBe("number");
    expect(answer).toBeGreaterThanOrEqual(0);
});

test("memory_usage", async () => {
    let answer = metrics.getMemoryUsagePercentage();
    expect(typeof answer).toBe("number");
    expect(answer).toBeGreaterThanOrEqual(0);
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
