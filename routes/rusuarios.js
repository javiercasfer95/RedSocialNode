module.exports = function (app, swig, gestorBD) {
    var loggerApp = app.get("loggerApp");
    app.get("/usuarios", function (req, res) {
        res.send("ver usuarios")
    });

    app.get("/registrarse", function (req, res) {
        var respuesta = swig.renderFile('views/signup.html', {});
        res.send(respuesta);
    });
    app.post('/registrarse', function (req, res) {
        var email = req.body.email;
        var nombre = req.body.nombre;
        var apellidos = req.body.apellidos;
        var password = req.body.password;
        var repitepassword = req.body.repitepassword;

        //Comprobaciones de registro
        if(nombre == "")
            res.redirect("/registrarse" + "?mensaje=El nombre no puede estar vacio" + "&tipoMensaje=alert-danger");
        else if(apellidos == "")
            res.redirect("/registrarse" + "?mensaje=Los apellidos no puedens estar vacio" + "&tipoMensaje=alert-danger");
        else if(password == "")
            res.redirect("/registrarse" + "?mensaje=La contraseña no puede estar vacia" + "&tipoMensaje=alert-danger");
        else if(password != repitepassword)
            res.redirect("/registrarse" + "?mensaje=Las contraseñas no coinciden" + "&tipoMensaje=alert-danger");
        else {

            //Fin comprobaciones

            //Comprobar que el email no existe en el sistema
            var criterio = {}; //Obtendria todos los usuarios
            var existeMail = false;
            gestorBD.obtenerUsuarios(criterio, function (usuarios) {
                for (i = 0; i < usuarios.length; i++) {
                    if (usuarios[i].email == email) {
                        existeMail = true;
                        break
                    }
                }
                if(existeMail) {
                    loggerApp.info("Error al crear usuario. Ya existe un usuario con ese email.");

                    res.redirect("/registrarse" + "?mensaje=Ya existe un usuario con ese email" + "&tipoMensaje=alert-danger");
                }else{
                    var pass = req.body.password.toString();
                    var seguro = app.get("crypto").createHmac('sha256', app.get('clave')).update(pass).digest('hex');

                    var usuario = {
                        nombre: req.body.nombre,
                        apellidos: req.body.apellidos,
                        email: req.body.email,
                        password: seguro,
                        role: "ROLE_USER"
                    }
                    //Para hacer un admin a la guarra
                    if (usuario.email == "admin@correo.es") {
                        usuario.role = "ROLE_ADMIN"
                    }

                    gestorBD.insertarUsuario(usuario, function (id) {
                        if (id == null) {
                            loggerApp.info("Error al crear usuario.");

                            //res.send("Error al insertar ");
                            res.redirect("/registrarse?mensaje=Error al registrar usuario")
                        } else {
                            //res.send('Usuario Insertado ' + id);
                            //res.redirect("/home");
                            // res.redirect("/listUsers?mensaje=Nuevo usuario registrado");
                            res.redirect("/identificarse?mensaje=Nuevo usuario registrado");
                        }
                    });
                }
            });
        }
    });
    app.get("/identificarse", function (req, res) {
        var respuesta = swig.renderFile('views/bidentificacion.html', {});
        res.send(respuesta);
    });


    app.post("/identificarse", function (req, res) {
        //console.log("User name:" + req.body.email);
        //console.log("User passwrod: " + req.body.password);
        var seguro = app.get("crypto").createHmac('sha256', app.get('clave')).update(req.body.password.toString()).digest('hex');

        var criterio = {email: req.body.email, password: seguro};

           // console.log=("Criterio de busqueda: "+ criterio.email);

        gestorBD.obtenerUsuarios(criterio, function (usuarios) {
            if (usuarios == null || usuarios.length == 0) {
                loggerApp.info("Error al identificarse.");
                req.session.usuario = null;
                //res.send("No identificado: ");
                res.redirect("/identificarse" + "?mensaje=Email o password incorrecto" + "&tipoMensaje=alert-danger ");
            } else {
                req.session.usuario = usuarios[0];
                //res.send("identificado");
                loggerApp.info("Usuario: "+criterio.email+" identificado.");
                //Mejoramos la respuesta de la identificacion
                res.redirect("/listUsers" + "?mensaje=Bienvenido" + "&tipoMensaje=alert-success");
            }
        });
    });
    app.get('/desconectarse', function (req, res) {
        req.session.usuario = null;
        //res.send("Usuario desconectado");
        res.redirect("/");
    });

    //Listar todos los usuarios de la aplicacion
    app.get("/listUsers", function (req, res) {
        //var seguro = app.get("crypto").createHmac('sha256', app.get('clave')).update(req.body.password).digest('hex');
        //console.log("Paso por aqui");
        var criterio = {};

        //Busqueda de usuarios
        if (req.query.busqueda != null) {
            var critA = {"nombre": {$regex: ".*" + req.query.busqueda + ".*"}};
            var critB = {"email": {$regex: ".*" + req.query.busqueda + ".*"}};
            criterio = {$or : [critA, critB]};
        }

        //Paginacion
        var pg = parseInt(req.query.pg); // Es String !!!
        if (req.query.pg == null) { // Puede no venir el param
            pg = 1;
        }


        gestorBD.obtenerUsuariosPg(criterio, pg, function (usuarios, total) {
            if (usuarios == null || usuarios.length == 0) {
                loggerApp.info("Error al listar usuarios.");
                //req.session.usuario = null;
                //res.send("No identificado: ");
                //res.redirect("/identificarse" + "?mensaje=Email o password incorrecto" + "&tipoMensaje=alert-danger ");
            } else {
                var pgUltima = total / 5;
                var usuarioSesion = req.session.usuario;
                var respuesta = swig.renderFile('views/list.html', {
                    usuario: usuarioSesion,
                    usuarios: usuarios,
                    pgActual: pg,
                    pgUltima : pgUltima
                });
                res.send(respuesta);
            }

        });
    });




    //Listar todos los mensajes
    app.get("/chat", function (req, res) {
        var criterio = {};

        //Busqueda de usuarios
        if (req.query.busqueda != null) {
            criterio = {"nombre": {$regex: ".*" + req.query.busqueda + ".*"}};
        }

        gestorBD.obtenerMensajes(criterio, function (mensajes) {
            if (mensajes == null || mensajes.length == 0) {
                //req.session.usuario = null;
                var respuesta = swig.renderFile('views/chat.html', {
                    usuario: usuarioSesion,
                    mensajes: mensajes,
                });
                res.send(respuesta);
            } else {
                var usuarioSesion = req.session.usuario;
                var respuesta = swig.renderFile('views/chat.html', {
                    usuario: usuarioSesion,
                    mensajes: mensajes,
                                });
                res.send(respuesta);
            }
        });
    });



    app.get('/chat/:emisor', function (req, res) {

        var usuarioSesion = req.session.usuario.email;
        var emisor = req.params.emisor;

        if (usuarioSesion == emisor)
            res.redirect("/chat" + "?mensaje=No te intentes aceptar una peticion a ti mismo, colega." + "&tipoMensaje=alert-danger");

        var criterio = {emisor: emisor, destino: usuarioSesion};

        gestorBD.obtenerMensajes(criterio, function (mensajes) {
            if (mensajes == null) {
                loggerApp.info("Error al listar mensajes de"+emisor+".");

                res.redirect("/chat" + "?mensaje=Error al buscar los mensajes de" + emisor + "." + "&tipoMensaje=alert-danger");
            }else{
                var respuesta = swig.renderFile('views/chat.html', {
                    usuario: usuarioSesion,
                    mensajes: mensajes,
                });
                res.send(respuesta);
            }

        });
    });





};