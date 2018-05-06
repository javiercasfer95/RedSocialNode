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
        var nombre = req.body.nombre;
        var apellidos = req.body.apellidos;
        var password = req.body.password;
        var repitepassword = req.body.repitepassword;

        //Comprobaciones de registro
        if(nombre == "")
            res.redirect("/registrarse" + "?mensaje=El nombre no puede estar vacio" + "&tipoMensaje=alert-danger");
        if(apellidos == "")
            res.redirect("/registrarse" + "?mensaje=Los apellidos no puedens estar vacio" + "&tipoMensaje=alert-danger");
        if(password == "")
            res.redirect("/registrarse" + "?mensaje=La contraseña no puede estar vacia" + "&tipoMensaje=alert-danger");
        if(password != repitepassword)
            res.redirect("/registrarse" + "?mensaje=Las contraseñas no coinciden" + "&tipoMensaje=alert-danger");


        //Fin comprobaciones

        //Comprobar que el email no existe en el sistema
        var criterio = {}; //Obtendria todos los usuarios
        gestorBD.obtenerUsuarios(criterio, function (usuarios) {
                for (i = 0; i < usuarios.length; i++) {
                    if (usuarios[i].email == email) {
                        res.redirect("/registrarse" + "?mensaje=Ya existe un usuario con ese email" + "&tipoMensaje=alert-danger");
                        break
                    }
                }
                var pass = req.body.password.toString();
                var seguro = app.get("crypto").createHmac('sha256', app.get('clave')).update(pass).digest('hex');

                var usuario = {
                    nombre: req.body.nombre,
                    apellidos: req.body.apellidos,
                    email: req.body.email,
                    password: seguro,
                    role : "ROLE_USER"
                }
                //Para hacer un admin a la guarra
                if(usuario.email == "admin@correo.es"){
                    usuario.role = "ROLE_ADMIN"
                }

                gestorBD.insertarUsuario(usuario, function (id) {
                    if (id == null) {
                        //res.send("Error al insertar ");
                        res.redirect("/registrarse?mensaje=Error al registrar usuario")
                    } else {
                        //res.send('Usuario Insertado ' + id);
                        //res.redirect("/home");
                        // res.redirect("/listUsers?mensaje=Nuevo usuario registrado");
                        res.redirect("/identificarse?mensaje=Nuevo usuario registrado");
                    }
                });
        });
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
                req.session.usuario = null;
                //res.send("No identificado: ");
                res.redirect("/identificarse" + "?mensaje=Email o password incorrecto" + "&tipoMensaje=alert-danger ");
            } else {
                req.session.usuario = usuarios[0];
                //res.send("identificado");

                //Mejoramos la respuesta de la identificacion
                res.redirect("/home" + "?mensaje=Bienvenido" + "&tipoMensaje=alert-success");
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
            criterio = {"nombre": {$regex: ".*" + req.query.busqueda + ".*"}};
        }

        //Paginacion
        var pg = parseInt(req.query.pg); // Es String !!!
        if (req.query.pg == null) { // Puede no venir el param
            pg = 1;
        }


        gestorBD.obtenerUsuariosPg(criterio, pg, function (usuarios, total) {
            if (usuarios == null || usuarios.length == 0) {
                //req.session.usuario = null;
                //res.send("No identificado: ");
                //res.redirect("/identificarse" + "?mensaje=Email o password incorrecto" + "&tipoMensaje=alert-danger ");
            } else {
                var pgUltima = total / 4;
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
};