export default {
  jwtSecret: '090fdsfajd09avja90dfsa890fdjsiovioczd',
  db: {
    connection: {
      host: 'localhost',
      user: 'root',
      password: 'monkeypie',
      database: 'pizza',
      connectTimeout: 60000,
    },
    listPerPage: 10,
  },
  factory: {
    url: 'http://localhost:3000',
  },
};
