function setup(app, handlers) {
  // Users
  app.post('/api/users', handlers.users.createUser);
  app.get('/api/users/:username', handlers.users.getUser);
  app.put('/api/users/:username', handlers.users.updateUser);
  app.del('/api/users/:username', handlers.users.deleteUser);

  // Sellers
  app.post('/api/sellers', handlers.sellers.createSeller);
  app.get('/api/sellers/:sellername', handlers.sellers.getSeller);
  app.put('/api/sellers/:sellername', handlers.sellers.updateSeller);
  app.del('/api/sellers/:sellername', handlers.sellers.deleteSeller);

  // Items
  app.post('/api/sellers/:sellername/items', handlers.sellers.createItem);
  app.get('/api/sellers/:sellername/items/:item', handlers.sellers.getItem);
  app.put('/api/sellers/:sellername/items/:item', handlers.sellers.updateItem);
  app.del('/api/sellers/:sellername/items/:item', handlers.sellers.deleteItem);

  // Activities
  app.post('/api/activities', handlers.activities.createActivity);
  app.get('/api/activities/:sellername', handlers.activities.getActivity);
  app.put('/api/activities/:sellername', handlers.activities.updateActivity);
  app.del('/api/activities/:sellername', handlers.activities.deleteActivity);
}

exports.setup = setup;