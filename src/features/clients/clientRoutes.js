const express = require('express');
const clientController = require('./clientController');
const {
  createClientRules,
  updateClientRules,
  clientIdParamRules,
} = require('./clientValidation');
const { protect } = require('../../middleware/auth');
const authorizePermission = require('../../middleware/authorize');
const validate = require('../../middleware/validate');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(authorizePermission('clients', 'V'), clientController.getAllClients)
  .post(
    authorizePermission('clients', 'E'),
    ...createClientRules,
    validate,
    clientController.createClient
  );

router
  .route('/:id')
  .get(
    authorizePermission('clients', 'V'),
    ...clientIdParamRules,
    validate,
    clientController.getClientById
  )
  .put(
    authorizePermission('clients', 'E'),
    ...updateClientRules,
    validate,
    clientController.updateClient
  )
  .delete(
    authorizePermission('clients', 'E'),
    ...clientIdParamRules,
    validate,
    clientController.deleteClient
  );

module.exports = router;
