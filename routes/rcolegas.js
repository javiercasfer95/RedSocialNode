module.exports = function (app, swig, gestorBD) {
    app.get("/amigos/lista", function (req, res) {
        var usuarioSesion = req.session.usuario.email;

        //Criterios para buscar amigos QUERY
        //Yo habia enviado la peticion
        var criterioA = { user1 : usuarioSesion};
        var criterioB = {user2 : usuarioSesion};

        var criterio = { $or : [ criterioA, criterioB ]};


        //FIN QUERY
        gestorBD.obtenerColegas(criterio, function (colegas) {
            if (colegas == null) {
                //req.session.usuario = null;
                //res.send("No identificado: ");
                res.redirect("/listUsers" + "?mensaje=Error al buscar colegas." + "&tipoMensaje=alert-danger ");
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
                        res.redirect("/listUsers" + "?mensaje=Error al buscar colegas" + "&tipoMensaje=alert-danger ");
                    }else{
                        var respuesta = swig.renderFile('views/listaColegas.html', {usuario: req.session.usuario, colegas: usuarios});
                        res.send(respuesta);
                    }

                })


            }

        });
    });
}