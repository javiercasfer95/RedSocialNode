module.exports = function (app, swig, gestorBD) {
    app.get("/admin/dropDatabase", function (req, res) {
        var usuarioSesion = req.session.usuario;
        if(usuarioSesion.role != "ROLE_ADMIN"){
            res.redirect("/identificarse?mensaje=No tienes privilegios, listillo." + "&tipoMensaje=alert-danger");
        }
        else{

            gestorBD.restoreDatabase(function(result){
                if(result == null){
                    res.redirect("/identificarse?mensaje=No se ha podido riniciar la base de datos." + "&tipoMensaje=alert-danger");
                }
                else{
                    var seguro = app.get("crypto").createHmac('sha256', app.get('clave')).update("123456").digest('hex');
                    var adminuser = {
                        nombre: "Admin",
                        apellidos: "admin",
                        email: "admin@correo.es",
                        password: seguro,
                        role : "ROLE_ADMIN"
                    }
                    gestorBD.insertarUsuario(adminuser, function (id) {
                        if (id == null) {
                            //res.send("Error al insertar ");
                            res.redirect("/registrarse?mensaje=Error al registrar usuario")
                        } else {
                            //res.send('Usuario Insertado ' + id);
                            //res.redirect("/home");
                            // res.redirect("/listUsers?mensaje=Nuevo usuario registrado");
                            res.redirect("/identificarse?mensaje=Se ha reiniciado la base de datos.");
                        }
                    });
                }
            });

        }

    });
}