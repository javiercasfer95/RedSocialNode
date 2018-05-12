module.exports = function (app, gestorBD) {


    app.post("/api/autenticar", function(req, res) {
        var seguro = app.get("crypto").createHmac('sha256', app.get('clave')).update(req.body.password).digest('hex');

        var criterio = {
            email : req.body.email,
            password : seguro
        }
        gestorBD.obtenerUsuarios(criterio, function(usuarios) {
            if (usuarios == null || usuarios.length == 0) {
                loggerApp.error("Error al obtener datos de usuarios para comprobar autenticacion")
                res.status(401);
                res.json({
                    autenticado : false
                })
            } else {
                var token = app.get('jwt').sign(
                    {usuario: criterio.email , tiempo: Date.now()/1000},
                    "secreto");
                loggerApp.info("Usuario "+ criterio.email +" autenticado correctamente.")
                res.status(200);
                res.json({
                    autenticado: true,
                    token : token
                });
            }
        });
    });

    app.get("/api/desconectar", function(req, res) {

        var token = app.get('jwt').sign(
            {usuario: null , tiempo: 0},
            "secreto");
        loggerApp.info("Desconectado correctamente.")
                res.status(200);
                res.json({
                    autenticado: false,
                    token : token
                });
    });

    app.get("/api/amigos", function(req, res) {
        var usuarioSesion = res.usuario;

        var criterioA = { user1 : usuarioSesion};
        var criterioB = {user2 : usuarioSesion};

        var criterio = { $or : [ criterioA, criterioB ]};

        gestorBD.obtenerColegas(criterio, function (colegas) {
            if (colegas == null) {
                //req.session.usuario = null;
                //res.send("No identificado: ");
                loggerApp.error("Error al obtener la informacion de los amigos")
                res.status(401);
                res.json({
                    error : "Error al buscar colegas en la base de datos."
                })
            } else {
                var listaCorreoUsuarios = [];
                var it = 0;
                for(i = 0; i < colegas.length; i++){
                    if(colegas[i].user1 == usuarioSesion){
                        listaCorreoUsuarios[i] = colegas[i].user2;
                    }else{
                        listaCorreoUsuarios[i] = colegas[i].user1;
                    }
                }
                criterio = { email : {$in : listaCorreoUsuarios}};

                gestorBD.obtenerUsuarios(criterio, function (usuarios) {
                    if(usuarios == null){
                        loggerApp.error("Error al obtener los datos de los usuarios amigos")
                        res.satatus(401)
                        res.json({
                            error : "Error al encontrar los usuarios que son tus amigos."
                        })
                    }else{
                        loggerApp.info("El usuario "+usuarioSesion+" ha obtenido su lista de amigos.")
                        res.status(200);
                        res.send(JSON.stringify(usuarios));
                    }
                })
            }
        });
    });

    app.post("/api/mensaje", function(req, res) {
        var destino = req.body.destino;
        var emisor = res.usuario;
        var texto = req.body.texto;
        var leido = false;
        var criterioA = {
            user1: emisor,
            user2: destino
        }
        var criterioB = {
            user1: destino,
            user2: emisor
        }
        var criterio = { $or : [ criterioA, criterioB ]};
        //Priemero es ver si son amigos
        gestorBD.obtenerColegas(criterio, function (colegas) {
            if (colegas == null) {
                loggerApp.error("No se han encontrado amigos de "+emisor)
                res.status(401);
                res.json({
                    error : "Error al buscar colegas en la base de datos."
                })
            }else if(colegas.length == 0){
                loggerApp.error("El usuario "+emisor+" no tiene amigos con los que chatear.")
                res.status(401);
                res.json({ error : "No se puede enviar el mensaje ya que no sois amigos."})
            } else {
                var date = new Date();
                var mensaje = {
                    emisor : emisor,
                    destino : destino,
                    texto : texto,
                    leido : false,
                    fecha : date
                }
                gestorBD.insertarMensaje(mensaje, function (id) {
                    if(id == null){
                        res.status(401)
                        res.json({
                            error : "Error al enviar el mensaje."
                        })
                    }else{
                        res.status(200);
                        //res.send(JSON.stringify(usuarios));
                        res.json({
                            text : "Se ha creado el mensaje",
                            _id : id
                        })
                    }
                })
            }
        });
    });

    app.put("/api/mensaje/:id", function(req, res) {
        var idmensaje = req.params.id;
        var emisor = res.usuario;

        var criterio = { "_id" : gestorBD.mongo.ObjectID(idmensaje)  };

        var mensaje = {
            leido : true
        }

        //Priemero es ver si son amigos
        gestorBD.modificarMensaje(criterio, mensaje, function (id) {
            if (id == null) {
                //res.send("Error al insertar ");
                loggerApp.error("No se puede modificar el mensaje.")
                res.status(401);
                res.json({
                    error : "Error al marcar como leido el mensaje."
                })
            } else {
                loggerApp.info("El mensaje "+ idmensaje + " se ha marcado como leido.")
                res.status(200)
                res.json({
                    msn : "Mensaje marcado como leido."
                })
            }
        });
    });

    app.get("/api/mensaje/:colega", function(req, res) {
        var usuarioSesion = res.usuario;
        var colega = req.params.colega;

        var criterioA = {
            emisor: usuarioSesion,
            destino: colega
        }
        var criterioB = {
            emisor: colega,
            destino: usuarioSesion
        }

        var criterio = { $or : [ criterioA, criterioB ]};

        gestorBD.obtenerMensajes(criterio, function (mensajes) {
            if (mensajes == null) {
                loggerApp.error("No se ha podido obtener los mensajes entre "+usuarioSesion+" y "+colega)
                //req.session.usuario = null;
                //res.send("No identificado: ");
                res.status(401);
                res.json({
                    error : "Error al buscar mensajes en la base de datos."
                })
            } else {
                res.status(200);
                var tmp = {
                    usuario : usuarioSesion,
                    colega : colega,
                    mensajes : mensajes
                }
                res.send(JSON.stringify(tmp));

            }
        });
    });


}