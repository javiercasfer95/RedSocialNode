// Módulos
var express = require('express');
var app = express();

var log4js = require('log4js');
log4js.configure({
    appenders: {
        out: { type: 'stdout' },
        app: { type: 'file', filename: 'redsocialnatorLog.log' }
    },
    categories: {
        default: { appenders: [ 'out', 'app' ], level: 'debug' }
    }
});

//var loggerOut = log4js.getLogger('out');
var loggerApp = log4js.getLogger('app');

/*
Como usar el logger
logger.trace('Entering cheese testing');
logger.debug('Got cheese.');
logger.info('Cheese is Gouda.');
logger.warn('Cheese is quite smelly.');
logger.error('Cheese is too ripe!');
logger.fatal('Cheese was breeding ground for listeria.');
*/

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "POST, GET, DELETE, UPDATE, PUT");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, token");
    // Debemos especificar todas las headers que se aceptan. Content-Type , token
    next();
});

var jwt = require('jsonwebtoken');
app.set('jwt',jwt);
/*
var fs = require('fs');
var https = require('https');
*/

var expressSession = require('express-session');
app.use(expressSession({secret: 'abcdefg', resave: true, saveUninitialized: true}));

var crypto = require('crypto');
var mongo = require('mongodb');
var swig = require('swig');
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

var gestorBD = require("./modules/gestorBD.js");
gestorBD.init(app, mongo);

var fileUpload = require('express-fileupload');
app.use(fileUpload());

//ROUTERS
// routerUsuarioToken
var routerUsuarioToken = express.Router();
routerUsuarioToken.use(function(req, res, next) {
    // obtener el token, puede ser un parámetro GET , POST o HEADER
    var token = req.body.token || req.query.token || req.headers['token'];

    var caducidadSeg = 600; // 10min * 60
    if (token != null) {
        // verificar el token
        jwt.verify(token, 'secreto', function(err, infoToken) {
            if (err || (Date.now()/1000 - infoToken.tiempo) > caducidadSeg ){
                res.status(403); // Forbidden
                res.json({
                    acceso : false,
                    error: 'Token invalido o caducado'
                });
                // También podríamos comprobar que intoToken.usuario existe
                return;

            } else {
                // dejamos correr la petición
                res.usuario = infoToken.usuario;
                next();
            }
        });

    } else {
        res.status(403); // Forbidden
        res.json({
            acceso : false,
            mensaje: 'No hay Token'
        });
    }
});
// Aplicar routerUsuarioToken
app.use('/api/amigos*', routerUsuarioToken);
app.use('/api/mensaje*', routerUsuarioToken);



// routerUsuarioSession
var routerUsuarioSession = express.Router();
routerUsuarioSession.use(function (req, res, next) {
    //console.log("routerUsuarioSession")
    if (req.session.usuario) {
        // dejamos correr la petición
        next();
    } else {
        //console.log("va a : " + req.session.destino)
        res.redirect("/identificarse");
    }
});

//Aplicar routerUsuarioSession
app.use("/listUsers", routerUsuarioSession);
app.use("/peticion*", routerUsuarioSession);
app.use("/amigo*", routerUsuarioSession);
app.use("/admin*", routerUsuarioSession);

//FIN ROUTERS

app.use(express.static('public'));
//FIN MODULOS


//Variables
app.set('port', 8081);
app.set('db', 'mongodb://admin:sdi2018@ds055742.mlab.com:55742/redsocialnatornode');
app.set('clave', 'abcdefg');
app.set('crypto', crypto);

//Rutas/controladores por lógica
require("./routes/rhome.js")(app, swig); // (app, param1, param2, etc.)
require("./routes/rusuarios.js")(app, swig, gestorBD); // (app, param1, param2, etc.)
require("./routes/rpeticiones.js")(app, swig, gestorBD); // (app, param1, param2, etc.)
require("./routes/rcolegas.js")(app, swig, gestorBD); // (app, param1, param2, etc.)
require("./routes/radmin.js")(app, swig, gestorBD); // (app, param1, param2, etc.)
require("./routes/rapiredsocial.js")(app, gestorBD); // (app, param1, param2, etc.)


//Ruta por defecto de la aplicacion
app.get('/', function (req, res) {
    res.redirect('/home');
});

app.use( function (err, req, res, next ) {
    //console.log("Error producido: " + err); //we log the error in our db
    loggerApp.error("Error producido: " + err);
    if (! res.headersSent) {
        res.status(400);
        res.send("Recurso no disponible");
    }
});

//lanzar el servidor
app.listen(app.get('port'), function () {
    console.log("Servidor activo");
    loggerApp.info("Servidor iniciado.")
});
/*
https.createServer({
    key: fs.readFileSync('certificates/alice.key'),
    cert: fs.readFileSync('certificates/alice.crt')
}, app).listen(app.get('port'), function () {
    console.log("Servidor activo");
});
*/
