module.exports = function (app, swig, gestorBD) {
    var loggerApp = app.get("loggerApp");

    app.get("/amigos/lista", function (req, res) {
        var usuarioSesion = req.session.usuario.email;

        //Criterios para buscar amigos QUERY
        //Yo habia enviado la peticion
        var criterioA = { user1 : usuarioSesion};
        var criterioB = {user2 : usuarioSesion};

        var criterio = { $or : [ criterioA, criterioB ]};

        //Paginacion
        var pg = parseInt(req.query.pg); // Es String !!!
        if (req.query.pg == null) { // Puede no venir el param
            pg = 1;
        }

        //FIN QUERY
        gestorBD.obtenerColegasPg(criterio,pg, function (colegas, total) {
            if (colegas == null) {
                loggerApp.error("Error al obtener los colegas de "+ usuarioSesion)
                //req.session.usuario = null;
                //res.send("No identificado: ");
                res.redirect("/listUsers" + "?mensaje=Error al buscar colegas." + "&tipoMensaje=alert-danger ");
            } else {
                var pgUltima = total / 5;
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
                        loggerApp.error("Error al obtener la informacion de los colegas de "+ usuarioSesion)
                        res.redirect("/listUsers" + "?mensaje=Error al buscar colegas" + "&tipoMensaje=alert-danger ");
                    }else{
                        var respuesta = swig.renderFile('views/listaColegas.html', {
                            usuario: req.session.usuario,
                            colegas: usuarios,
                            pgActual: pg,
                            pgUltima : pgUltima
                        });
                        res.send(respuesta);
                    }

                })


            }

        });
    });
}