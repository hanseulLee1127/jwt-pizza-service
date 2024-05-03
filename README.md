# jwt-pizza-service

Backend service for making JWT pizzas. This service tracks users and franchises. All order requests are passed to the JWT Pizza Factory where the pizzas are made.

JWTs are used for authentication objects.

## Endpoints

### Register

```sh
curl -X POST -c cookies.txt localhost:3000/api/auth -d '{"name":"bud jones", "email":"cow@cow.com", "password":"a"}' -H 'Content-Type: application/json'
```

### Login

```sh
curl -v -X PUT -c cookies.txt localhost:3000/api/auth -d '{"name":"bud jones", "email":"cow@cow.com", "password":"a"}' -H 'Content-Type: application/json'
```

### Menu

```sh
curl localhost:3000/pizza/menu
```

### Order

```sh
curl -b cookies.txt -X GET localhost:3000/api/pizza

curl -b cookies.txt -X POST localhost:3000/api/order -H 'Content-Type: application/json' -d '{ "diner": 1, "orders":[{"franchiseId": 1, "storeId":1, "date": "2024-03-10T00:00:00Z", "items":[{ "menuId": 1, "description": "Veggie", "price": 0.05 }] }]}'
```

## Development notes

Install the required packages.

```sh
npm install express cookie-parser jsonwebtoken mysql2
```

Nodemon is assumed to be installed globally so that you can have hot reloading when debugging.

```sh
npm -g install nodemon
```
