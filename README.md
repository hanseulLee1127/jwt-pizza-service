# jwt-pizza-service

Backend service for making JWT pizzas. This service tracks users and franchises. All order requests are passed to the JWT Pizza Factory where the pizzas are made.

## Endpoints

### Register

```sh
curl -X POST -c cookies.txt localhost:3000/auth -d '{"email":"cow@cow.com", "password":"a"}' -H 'Content-Type: application/json'
```

### Login

```sh
curl -v -X PUT -c cookies.txt localhost:3000/auth -d '{"email":"cow@cow.com", "password":"a"}' -H 'Content-Type: application/json'
```

### Menu

```sh
curl localhost:3000/menu
```

### Order

```sh
curl -b cookies.txt -X POST localhost:3000/order -d '{"order":["pep", "cheese"]}' -H 'Content-Type: application/json'
```

## Development notes

```
npm install express cookie-parser jsonwebtoken
```

Using JWT for authentication objects.
