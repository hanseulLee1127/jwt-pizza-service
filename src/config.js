   export default {
      jwtSecret: '',
      db: {
        connection: {
          host: 'localhost',
          user: 'root',
          password: '',
          database: 'pizza',
          connectTimeout: 60000,
        },
        listPerPage: 10,
      },
      factory: {
        url: 'https://jwt-pizza-factory.cs329.click',
        apiKey: '',
      },
   };
