const metrics = require("../metrics.js");

test("cpu_usage", async () => {
    let answer = metrics.getCpuUsagePercentage();
    expect(typeof answer).toBe("number");
});

test("memory_usage", async () => {
    let answer = metrics.getMemoryUsagePercentage();
    expect(typeof answer).toBe("string");
});

// 모든 테스트 종료 후 실행
afterAll(() => {
    metrics.stopMetricsCollection();
});
