module.exports = function (app, swig, gestorBD) {

    //Listar todas las peticiones recibidas y no aceptadas
    app.get("/peticion/recibidas", function (req, res) {
        var usuarioSesion = req.session.usuario;
        var criterio = { receptor :  usuarioSesion};



        gestorBD.obtenerPeticiones(criterio, function (peticiones) {
            if (peticiones == null) {
                //req.session.usuario = null;
                //res.send("No identificado: ");
                res.redirect("/listUsers" + "?mensaje=Error al buscar peticiones recibidas" + "&tipoMensaje=alert-danger ");
            } else {

                var respuesta = swig.renderFile('views/peticionesRecibidas.html', {usuario: usuarioSesion, peticiones: peticiones});
                res.send(respuesta);
            }

        });
    });

    //Listar todas las peticiones recibidas y no aceptadas
    app.get("/peticion/enviadas", function (req, res) {
        var usuarioSesion = req.session.usuario;
        var criterio = { emisor :  usuarioSesion};


        gestorBD.obtenerPeticiones(criterio, function (peticiones) {
            if (peticiones == null || peticiones.length == 0) {
                //req.session.usuario = null;
                //res.send("No identificado: ");
                //res.redirect("/identificarse" + "?mensaje=Email o password incorrecto" + "&tipoMensaje=alert-danger ");
            } else {

                var respuesta = swig.renderFile('views/peticionesEnviadas.html', {usuario: usuarioSesion, peticiones: peticiones});
                res.send(respuesta);
            }

        });
    });



    app.get('/peticion/enviar/:receptor', function (req, res) {

        var usuarioSesion = req.session.usuario;
        var receptor = req.params.receptor;
        //Fin comprobaciones
        if(usuarioSesion == receptor)
            res.redirect("/listUsers" + "?mensaje=No te intentes enviar una peticion a ti mismo, colega." + "&tipoMensaje=alert-danger");
        //Comprobar que el email no existe en el sistema
        var criterio = {emisor : usuarioSesion, receptor : receptor}; //Obtendria todos los usuarios

        gestorBD.obtenerPeticiones(criterio, function (peticiones) {
           /* for (i = 0; i < peticiones.length; i++) {
                if (peticiones[i].receptor == receptor) {
                    res.redirect("/listUsers" + "?mensaje=Ya se habia enviado una petición de amistad a este usuario." + "&tipoMensaje=alert-danger");
                    break
                }
            }*/
           if(peticiones.length > 0)
               res.redirect("/listUsers" + "?mensaje=Ya se habia enviado una petición de amistad a "+ receptor +"!" + "&tipoMensaje=alert-danger");
           else {

               var peticion = {
                   emisor: usuarioSesion,
                   receptor: receptor,
                   aceptada: false
               }
               gestorBD.enviarPeticion(peticion, function (id) {
                   if (id == null) {
                       //res.send("Error al insertar ");
                       res.redirect("/registrarse?mensaje=Error al enviar la peticion")
                   } else {
                       res.redirect("/listUsers?mensaje=Peticion enviada");
                   }
               });
           }
        });
    });

    app.get('/peticion/aceptar/:emisor', function (req, res) {

        var usuarioSesion = req.session.usuario;
        var emisor = req.params.emisor;
        //Fin comprobaciones
        if(usuarioSesion == emisor)
            res.redirect("/peticion/recibidas" + "?mensaje=No te intentes aceptar una peticion a ti mismo, colega." + "&tipoMensaje=alert-danger");

        //Comprobar que el email no existe en el sistema
        var criterio = {emisor : emisor, receptor : usuarioSesion}; //Obtendria todos los usuarios

        gestorBD.obtenerPeticiones(criterio, function (peticiones) {
            /* for (i = 0; i < peticiones.length; i++) {
                 if (peticiones[i].receptor == receptor) {
                     res.redirect("/listUsers" + "?mensaje=Ya se habia enviado una petición de amistad a este usuario." + "&tipoMensaje=alert-danger");
                     break
                 }
             }*/
            if(peticiones == null){
                res.redirect("/peticion/recibidas" + "?mensaje=Error al buscar la peticion de "+ emisor +"." + "&tipoMensaje=alert-danger");
            }

            if(peticiones.length == 0)
                res.redirect("/peticion/recibidas" + "?mensaje=No se ha encontrado la peticion de "+ emisor +"." + "&tipoMensaje=alert-danger");
            else {
                var peticion = peticiones[0];
                peticion.aceptada = true;
                gestorBD.modificarPeticion(criterio, peticion, function (id) {
                    if (id == null) {
                        //res.send("Error al insertar ");
                        res.redirect("/peticion/recibidas?mensaje=Error al aceptar la peticion")
                    } else {
                        res.redirect("/peticion/recibidas?mensaje=Peticion aceptada");
                    }
                });
            }
        });
    });
}