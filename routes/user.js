const { body } = require('express-validator');
const router = require('express').Router();

const isAuth = require('../middlewares/verify-token');

const userController = require('../controllers/user');


router.get('/profile', isAuth, userController.getUserProfile);

router.get('/user-activity', isAuth, userController.userActivity);

router.put('/settings/', [body('username').trim().notEmpty(), body('email').trim().isEmail().notEmpty()], isAuth, userController.updateProfile);

router.put('/settings/password', [body('password').trim().isLength({min : 6}).notEmpty()], isAuth, userController.updatePassword);

router.post('/post', [body('title').trim().isLength({min : 7}).notEmpty(), body('info').trim().notEmpty(), 
body('description').trim().isLength({max : 255}).notEmpty()], isAuth, userController.createPost);

router.put('/post/:id', [body('title').trim().isLength({min : 7}).notEmpty(), body('info').trim().notEmpty(), 
body('description').trim().isLength({max : 255}).notEmpty()], isAuth, userController.editPost);

router.delete('/post/:id', isAuth, userController.deletePost);


module.exports = router;