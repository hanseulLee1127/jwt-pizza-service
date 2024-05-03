# jwt-pizza-service

Backend service for making JWT pizzas. This service tracks users and franchises. All order requests are passed to the JWT Pizza Factory where the pizzas are made.

JWTs are used for authentication objects.

## Endpoints

### Register

```sh
curl -X POST -c cookies.txt localhost:3000/api/auth -d '{"name":"pizza diner", "email":"d@jwt.com", "password":"a"}' -H 'Content-Type: application/json'
```

### Login

```sh
curl -X PUT -c cookies.txt localhost:3000/api/auth -d '{"email":"d@jwt.com", "password":"a"}' -H 'Content-Type: application/json'
```

### Menu

```sh
curl localhost:3000/pizza/menu
```

### Order

```sh
curl -b cookies.txt -X GET localhost:3000/api/pizza/order

curl -b cookies.txt -X POST localhost:3000/api/pizza/order -H 'Content-Type: application/json' -d '{"franchiseId": 1, "storeId":1, "items":[{ "menuId": 1, "description": "Veggie", "price": 0.05 }]}'
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
