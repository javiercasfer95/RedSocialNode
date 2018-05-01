// Módulos
var express = require('express');
var app = express();
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

// routerUsuarioSession
var routerUsuarioSession = express.Router();
routerUsuarioSession.use(function (req, res, next) {
    //console.log("routerUsuarioSession")
    if (req.session.usuario) {
        // dejamos correr la petición
        next();
    } else {
        console.log("va a : " + req.session.destino)
        res.redirect("/identificarse");
    }
});

//Aplicar routerUsuarioSession
app.use("/listUsers", routerUsuarioSession);
app.use("/peticion*", routerUsuarioSession);
app.use("/canciones/agregar", routerUsuarioSession);
app.use("/publicaciones", routerUsuarioSession);
app.use("/cancion/comprar", routerUsuarioSession);
app.use("/compras", routerUsuarioSession);



//routerUsuarioAutor
var routerUsuarioAutor = express.Router();
routerUsuarioAutor.use(function (req, res, next) {
    console.log("routerUsuarioAutor");
    var path = require('path');
    var id = path.basename(req.originalUrl);   // Cuidado porque req.params no funciona   // en el router si los params van en la URL
    gestorBD.obtenerCanciones({_id: mongo.ObjectID(id)}, function (canciones) {
        console.log(canciones[0]);
        if (canciones[0].autor == req.session.usuario) {
            next();
        } else {
            res.redirect("/home");
        }
    })
});
//Aplicar routerUsuarioAutor
app.use("/cancion/modificar", routerUsuarioAutor);
app.use("/cancion/eliminar", routerUsuarioAutor);


//routerAudios
var routerAudios = express.Router();
routerAudios.use(function (req, res, next) {
    console.log("routerAudios");
    var path = require('path');
    var idCancion = path.basename(req.originalUrl, '.mp3');
    gestorBD.obtenerCanciones({_id: mongo.ObjectID(idCancion)}, function (canciones) {
        if (canciones[0].autor == req.session.usuario) {
            next();
        } else {
            //res.redirect("/home");
            var criterio = {
                usuario: req.session.usuario,
                cancionId: mongo.ObjectID(idCancion)
            };
            gestorBD.obtenerCompras(criterio, function (compras) {
                if (compras != null && compras.length > 0) {
                    next();
                } else {
                    res.redirect("/home");
                }
            });
        }
    })

});
//Aplicar routerAudios
app.use("/audios/", routerAudios);
app.use(express.static('public'));

//FIN ROUTERS


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
require("./routes/rcanciones.js")(app, swig, gestorBD); // (app, param1, param2, etc.)


//Ruta por defecto de la aplicacion
app.get('/', function (req, res) {
    res.redirect('/home');
});

app.use(function (err, req, res, next) {
    console.log("Error producido: " + err); //we log the error in our db
    if (!res.headersSent) {
        //console.log("Error producido: " + err.toString());
        res.status(400);
        res.send("Recurso no disponible");
    }
});

//lanzar el servidor
app.listen(app.get('port'), function () {
    console.log("Servidor activo");
});
/*
https.createServer({
    key: fs.readFileSync('certificates/alice.key'),
    cert: fs.readFileSync('certificates/alice.crt')
}, app).listen(app.get('port'), function () {
    console.log("Servidor activo");
});
*/
