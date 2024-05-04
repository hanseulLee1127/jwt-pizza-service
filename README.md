# jwt-pizza-service

Backend service for making JWT pizzas. This service tracks users and franchises and orders pizzas. All order requests are passed to the JWT Pizza Factory where the pizzas are made.

JWTs are used for authentication objects.

## Endpoints

You can get the documentation for all endpoints by making the following request.

```sh
curl localhost:3000/api
```

## Development notes

Install the required packages.

```sh
npm install express cookie-parser jsonwebtoken mysql2 bcrypt
```

Nodemon is assumed to be installed globally so that you can have hot reloading when debugging.

```sh
npm -g install nodemon
```

## Known bugs

1. You can register a user with the same email multiple times
1. MySQL connections never get closed

## Known security vulnerabilities

1. Inject on order description
1. Escalation on add user with a given role
1. Doesn't delete cookie on logout
1. Reveals config `server: Express`
1. If you use the same name for creating a franchise it will leak the SQL error
1. Returns code stack with error
1. Docs page has the demo data user's email and password
