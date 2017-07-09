process.env.DEBUG = 'swagger:middleware';

var express = require('express');
var middleware = require('swagger-express-middleware');
var path = require('path');
var app = express();

var MemoryDataStore = middleware.MemoryDataStore;
var Resource = middleware.Resource;

middleware(path.join(__dirname, 'api-docs.json'), app, function(err, middleware) {
  var myDB = new MemoryDataStore();
  var users = [
    {id: '1', name: 'Fan', phone: '18600000001'},
    {id: '2', name: 'Wenwen', phone: '18600000000'},
  ];

  var pets = [
    {id: '1', name: 'Petty', price: 150.0, speciesId: '1', imageUrls: 'http://loremflickr.com/200/200?random=1'},
    {id: '2', name: 'Kitty', price: 120.0, speciesId: '1', imageUrls: 'http://loremflickr.com/200/200?random=2'},
    {id: '3', name: 'Puppy', price: 140.0, speciesId: '2', imageUrls: 'http://loremflickr.com/200/200?random=3'},
  ];

  var species = [
    {id: '1', categoryId: '1', name: 'Cat'},
    {id: '2', categoryId: '1', name: 'Dog'},
    {id: '3', categoryId: '2', name: 'Fish'},
  ];

  myDB.save(
    new Resource('/app/info', {name: 'Pet Store'}),
    new Resource('/pets/1', pets[0]),
    new Resource('/pets/2', pets[1]),
    new Resource('/pets/3', pets[2]),
    new Resource('/species/1', species[0]),
    new Resource('/species/2', species[1])
  );

  app.post('/pets/buy', function(req, res, next) {
    var now = new Date();
    var newOrder = {
      "id": now.getTime(),
      "message": "A mock order",
      "orderStatus": "CREATED",
      "orderTime": now.toGMTString(),
      "status": "OK"
    };

    myDB.save(new Resource('/orders/'+req.headers['user-id'], now.getTime(), newOrder), function(err, order) {
      if (order){
        res.body = order.data;
      }
    });
    next();
  });

  app.get('/orders/detail', function(req, res, next) {
    myDB.get('/orders/'+req.headers['user-id']+'/'+req.query.id, function(err, order) {
      if (order){
        res.body = order.data;
      }
    });
    next();
  });

  app.get('/orders/list', function(req, res, next) {
    myDB.getCollection('/orders/'+req.headers['user-id'], function(err, orders) {
      if (orders){
        res.body = orders
              .map(function(p){return p.data;});
      }
    });
    next();
  });

  app.get('/pets/detail', function(req, res, next) {
    myDB.get('/pets/'+req.query.petId, function(err, pet) {
      if (pet){
        res.body = pet.data;
      }
    });
    next();
  });

  app.get('/pets/list', function(req, res, next) {
    myDB.getCollection('/pets', function(err, pets) {
      if (pets){
        res.body = pets
              .map(function(p){return p.data;})
              .filter(function(p){return p.speciesId == req.query.speciesId;});
      }
    });
    next();
  });

  app.get('/pets/species/list', function(req, res, next) {
    myDB.getCollection('/species', function(err, species) {
      if (species){
        res.body = species
              .map(function(p){return p.data;})
              .filter(function(p){return p.categoryId == req.query.categoryId;});
      }
    });
    next();
  });

  app.use(
    middleware.metadata(),
    middleware.CORS(),
    middleware.files(),
    middleware.parseRequest(),
    middleware.validateRequest(),
    middleware.mock(myDB)
  );

  app.listen(8000, function() {
    console.log('The Swagger Pet Store is now running at http://localhost:8000');
  });
});
