const metrics = require("../metrics.js")


test("cpu_usage", async () => {
    let answer = metrics.getCpuUsagePercentage();

    expect(typeof answer).toBe("number");
})

test("memory_usage", async () => {
    let answer = metrics.getMemoryUsagePercentage();

    expect(typeof answer).toBe("string");
})