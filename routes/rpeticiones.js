module.exports = function (app, swig, gestorBD) {



    //Listar todas las peticiones recibidas y no aceptadas
    app.get("/peticion/recibidas", function (req, res) {
        var usuarioSesion = req.session.usuario.email;
        var criterio = {receptor: usuarioSesion};


        gestorBD.obtenerPeticiones(criterio, function (peticiones) {
            if (peticiones == null) {
                //req.session.usuario = null;
                //res.send("No identificado: ");
                res.redirect("/listUsers" + "?mensaje=Error al buscar peticiones recibidas" + "&tipoMensaje=alert-danger ");
            } else {
                var respuesta = swig.renderFile('views/peticionesRecibidas.html', {
                    usuario: req.session.usuario,
                    peticiones: peticiones
                });
                res.send(respuesta);
            }

        });
    });

    //Listar todas las peticiones recibidas y no aceptadas
    app.get("/peticion/enviadas", function (req, res) {
        var usuarioSesion = req.session.usuario.email;
        var criterio = {emisor: usuarioSesion};


        gestorBD.obtenerPeticiones(criterio, function (peticiones) {
            if (peticiones == null) {
                //req.session.usuario = null;
                //res.send("No identificado: ");
                //res.redirect("/identificarse" + "?mensaje=Email o password incorrecto" + "&tipoMensaje=alert-danger ");
            } else {

                var respuesta = swig.renderFile('views/peticionesEnviadas.html', {
                    usuario: req.session.usuario,
                    peticiones: peticiones
                });
                res.send(respuesta);
            }

        });
    });


    app.get('/peticion/enviar/:receptor', function (req, res) {

        var usuarioSesion = req.session.usuario.email;
        var receptor = req.params.receptor;
        //Fin comprobaciones
        if (usuarioSesion == receptor)
            res.redirect("/listUsers" + "?mensaje=No te intentes enviar una peticion a ti mismo, colega." + "&tipoMensaje=alert-danger");
        else {
            //Comprobar que el email no existe en el sistema
            //var criterio = {emisor : usuarioSesion, receptor : receptor};
            //Quiero saber si existe una peticion entre ambos usuarios
            //var criterio = {$or : [{"emisor" : emisor,  "receptor" : usuarioSesion}, {"emisor" : usuarioSesion, "receptor" : emisor}]};
            var criterioA = {emisor: receptor, receptor: usuarioSesion}
            var criterioB = {emisor: usuarioSesion, receptor: receptor}
            var criterio = {$or: [criterioA, criterioB]};


            gestorBD.obtenerPeticiones(criterio, function (peticiones) {
                if (peticiones.length > 0)
                    res.redirect("/listUsers" + "?mensaje=Ya hay enviado una petición de amistad entre " + receptor + " y tu!" + "&tipoMensaje=alert-danger");
                else {
                    var peticion = {
                        emisor: usuarioSesion,
                        receptor: receptor,
                        aceptada: false
                    }
                    gestorBD.enviarPeticion(peticion, function (id) {
                        if (id == null) {
                            //res.send("Error al insertar ");
                            res.redirect("/listUsers?mensaje=Error al enviar la peticion")
                        } else {
                            var colega = {
                                user1: req.session.usuari,
                                user2: receptor
                            }

                            res.redirect("/listUsers?mensaje=Peticion enviada a " + receptor);
                        }
                    });
                }
            });
        }
    });

app.get('/peticion/aceptar/:emisor', function (req, res) {

    var usuarioSesion = req.session.usuario.email;
    var emisor = req.params.emisor;
    //Fin comprobaciones
    if (usuarioSesion == emisor)
        res.redirect("/peticion/recibidas" + "?mensaje=No te intentes aceptar una peticion a ti mismo, colega." + "&tipoMensaje=alert-danger");

    //Obtener todas las peticiones entre dos personas.
    // var criterio = {$or: [{emisor : emisor, receptor : usuarioSesion}, {emisor : usuarioSesion, receptor : emisor}]};
    var criterio = {emisor: emisor, receptor: usuarioSesion};

    gestorBD.obtenerPeticiones(criterio, function (peticiones) {
        /* for (i = 0; i < peticiones.length; i++) {
             if (peticiones[i].receptor == receptor) {
                 res.redirect("/listUsers" + "?mensaje=Ya se habia enviado una petición de amistad a este usuario." + "&tipoMensaje=alert-danger");
                 break
             }
         }*/
        if (peticiones == null) {
            res.redirect("/peticion/recibidas" + "?mensaje=Error al buscar la peticion de " + emisor + "." + "&tipoMensaje=alert-danger");
        }

        if (peticiones.length == 0)
            res.redirect("/peticion/recibidas" + "?mensaje=No se ha encontrado la peticion de " + emisor + "." + "&tipoMensaje=alert-danger");
        else {
            var peticion = peticiones[0];
            peticion.aceptada = true;
            gestorBD.modificarPeticion(criterio, peticion, function (id) {
                if (id == null) {
                    //res.send("Error al insertar ");
                    res.redirect("/peticion/recibidas?mensaje=Error al aceptar la peticion")
                } else {
                    var colega = {
                        user1: usuarioSesion,
                        user2: emisor
                    }
                    gestorBD.insertarCoelga(colega, function (id) {
                        if (id == null) {
                            res.redirect("/listUsers?mensaje=Error al añadir al colega&tipoMensaje=alert-danger");
                        } else {
                            res.redirect("/listUsers?mensaje=Ya tienes un colega nuvo, es " + emisor);
                        }
                    });
                    //res.redirect("/peticion/recibidas?mensaje=Peticion aceptada");
                }
            });
        }
    });
});
}