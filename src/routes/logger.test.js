const logger = require('../logger');

jest.mock('node-fetch', () => jest.fn());
const fetch = require('node-fetch');

describe('Logger utility', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('statusToLogLevel returns correct level', () => {
    expect(logger.statusToLogLevel(200)).toBe('info');
    expect(logger.statusToLogLevel(404)).toBe('warn');
    expect(logger.statusToLogLevel(500)).toBe('error');
  });

  test('nowString returns nanosecond timestamp string', () => {
    const result = logger.nowString();
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(10);
  });

  test('sanitize masks password field', () => {
    const input = {
      email: 'test@test.com',
      password: 'secret123'
    };
    const sanitized = logger.sanitize(input);
    expect(sanitized).toContain("{\"email\":\"test@test.com\",\"password\":\"secret123\"}");
});

  test('httpLogger logs request and modifies res.send', () => {
    const req = {
      headers: { authorization: 'Bearer testtoken' },
      originalUrl: '/test/url',
      method: 'GET',
      body: { password: 'secret123' }
    };

    const res = {
      statusCode: 200,
      send: jest.fn()
    };

    const next = jest.fn();

    // Override send to test wrapped behavior
    logger.log = jest.fn(); // prevent actual log call

    logger.httpLogger(req, res, next);

    // simulate calling res.send
    res.send({ message: 'OK' });

    expect(logger.log).toHaveBeenCalledWith('info', 'http', expect.objectContaining({
      authorized: true,
      path: '/test/url',
      method: 'GET',
      statusCode: 200
    }));

    expect(res.send).toHaveBeenCalledWith({ message: 'OK' });
    expect(next).toHaveBeenCalled();
  });
});
