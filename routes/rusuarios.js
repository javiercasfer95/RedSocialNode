module.exports = function (app, swig, gestorBD) {
    app.get("/usuarios", function (req, res) {
        res.send("ver usuarios")
    });

    app.get("/registrarse", function (req, res) {
        var respuesta = swig.renderFile('views/signup.html', {});
        res.send(respuesta);
    });
    app.post('/registrarse', function (req, res) {
        var email = req.body.email;
        //Comprobar que el email no existe en el sistema
        gestorBD.obtenerUsuarios(criterio, function (usuarios) {
            if (usuarios == null || usuarios.length == 0) {

            } else {
                for(i=0; i < usuarios.length; i++) {
                    if (usuarios[i].email == email) {
                        res.redirect("/registrarse" + "?mensaje=Ya existe un usuario con ese email" + "&tipoMensaje=alert-danger");
                        break
                    }
                }
            }

        });

        var seguro = app.get("crypto").createHmac('sha256', app.get('clave')).update(req.body.password).digest('hex');

        var usuario = {
            nombre: req.body.nombre,
            apellidos: req.body.apellidos,
            email: req.body.email,
            password: seguro
        }
        gestorBD.insertarUsuario(usuario, function (id) {
            if (id == null) {
                //res.send("Error al insertar ");
                res.redirect("/registrarse?mensaje=Error al registrar usuario")
            } else {
                //res.send('Usuario Insertado ' + id);
                //res.redirect("/tienda");
                res.redirect("/listUsers?mensaje=Nuevo usuario registrado");
            }
        });
    });
    app.get("/identificarse", function (req, res) {
        var respuesta = swig.renderFile('views/bidentificacion.html', {});
        res.send(respuesta);
    });
    app.post("/identificarse", function (req, res) {
        var seguro = app.get("crypto").createHmac('sha256', app.get('clave')).update(req.body.password).digest('hex');

        var criterio = {email: req.body.email, password: seguro}

        gestorBD.obtenerUsuarios(criterio, function (usuarios) {
            if (usuarios == null || usuarios.length == 0) {
                req.session.usuario = null;
                //res.send("No identificado: ");
                res.redirect("/identificarse" + "?mensaje=Email o password incorrecto" + "&tipoMensaje=alert-danger ");
            } else {
                req.session.usuario = usuarios[0].email;
                //res.send("identificado");

                //Mejoramos la respuesta de la identificacion
                res.redirect("/tienda" + "?mensaje=Bienvenido"+ "&tipoMensaje=alert-success");

            }

        });
    });
    app.get('/desconectarse', function (req, res) {
        req.session.usuario = null;
        res.send("Usuario desconectado");
    });

    //Listar todos los usuarios de la aplicacion
    app.get("/listUsers", function (req, res) {
        //var seguro = app.get("crypto").createHmac('sha256', app.get('clave')).update(req.body.password).digest('hex');
       // var criterio = {email: req.body.email, password: seguro}

        gestorBD.obtenerUsuarios(criterio, function (usuarios) {
            if (usuarios == null || usuarios.length == 0) {
                //req.session.usuario = null;
                //res.send("No identificado: ");
                //res.redirect("/identificarse" + "?mensaje=Email o password incorrecto" + "&tipoMensaje=alert-danger ");
            } else {

                var usuarioSesion = req.session.usuario;

                var respuesta = swig.renderFile('views/list.html', {usuario: usuarioSesion, usuarios : usuarios});
                res.send(respuesta);

            }

        });
    });
};