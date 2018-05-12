module.exports = function (app, swig, gestorBD) {
    var loggerApp = app.get("loggerApp");

    var nombres = ["Juan", "Pepita", "Mario", "Link", "Zelda", "Pikachu", "Ash", "Samus", "Snoop" ];

    var apellidos = ["Francisco", "Gonzalez", "Dogg", "Castro", "Valles", "Alonso", "Rodriguez", "Fernandez",
        "Álvarez" ];

    var correos = ["@gmail.com", "@hotmail.es", "@uniovi.es", "@live.com"];

    function crearUsuariosRandom(){
        var numUsers = 40;
        var usersList = [];
        var itNames;
        var itCorreos = 0;
        var pass;
        var seguro;
        var usuario;
        pass = "123456";
        seguro = app.get("crypto").createHmac('sha256', app.get('clave')).update(pass).digest('hex');
        for(i = 0; i < numUsers; i++){
            itNames = Math.floor(Math.random() * 9); //Entre 0 y 8
            itCorreos = Math.floor(Math.random() * 4); //Entre 0 y 3 para los correos
            usuario = {
                nombre: nombres[itNames],
                apellidos: apellidos[itNames],
                email: nombres[itNames]+apellidos[itNames]+correos[itCorreos],
                password: seguro,
                role : "ROLE_USER"
            }
            if(i==0){
                usersList[i] = usuario;
            }
            else if(!contains(usersList, usuario)){
                usersList[i] = usuario;
            }
        }
        //Usuarios obligatorios por defecto
        //Admin
        usuario = {
            nombre: "Admin",
            apellidos: "RedSocialnator",
            email: "admin@correo.es",
            password: seguro,
            role : "ROLE_ADMIN"
        }
        usersList[i] = usuario; //Aqui i = 10, porque ha salido del bucle

        usuario = {
            nombre: "Javier",
            apellidos: "Castro",
            email: "javier@correo.es",
            password: seguro,
            role : "ROLE_USER"
        }
        usersList[i+1] = usuario; //Aqui i = 10

        usuario = {
            nombre: "Joni",
            apellidos: "Valles",
            email: "joni@correo.es",
            password: seguro,
            role : "ROLE_USER"
        }
        usersList[i+2] = usuario; //Aqui i = 10

        return usersList;
    }

    function contains(list, obj) {
        for (i = 0; i < list.length; i++) {
            if (list[i] === obj) {
                return true;
            }
        }
        return false;
    }

    function crearUsuariosDefecto() {
        var itCorreos = 0;
        var pass;
        var seguro;
        var usuario;
        var usersList = [];
        pass = "123456";
        seguro = app.get("crypto").createHmac('sha256', app.get('clave')).update(pass).digest('hex');

        for(i = 0; i < 9; i++){
            usuario = {
                nombre: nombres[i],
                apellidos: apellidos[i],
                email: nombres[i]+apellidos[i]+correos[itCorreos],
                password: seguro,
                role : "ROLE_USER"
            }
            if(!contains(usersList, usuario)){
                usersList[i] = usuario;
            }
            itCorreos++;
            if(itCorreos == correos.length){
                itCorreos = 0;
            }
        }

        //Usuarios obligatorios por defecto
        //Admin
        usuario = {
            nombre: "Admin",
            apellidos: "RedSocialnator",
            email: "admin@correo.es",
            password: seguro,
            role : "ROLE_ADMIN"
        }
        usersList[i] = usuario; //Aqui i = 10, porque ha salido del bucle

        usuario = {
            nombre: "Javier",
            apellidos: "Castro",
            email: "javier@correo.es",
            password: seguro,
            role : "ROLE_USER"
        }
        usersList[i+1] = usuario; //Aqui i = 10

        usuario = {
            nombre: "Joni",
            apellidos: "Valles",
            email: "joni@correo.es",
            password: seguro,
            role : "ROLE_USER"
        }
        usersList[i+2] = usuario; //Aqui i = 10
        usuario = {
            nombre: "Noelia",
            apellidos: "Perez",
            email: "noelia@correo.es",
            password: seguro,
            role : "ROLE_USER"
        }
        usersList[i+3] = usuario; //Aqui i = 10
        usuario = {
            nombre: "Pepita",
            apellidos: "Pelaez",
            email: "pepita@correo.es",
            password: seguro,
            role : "ROLE_USER"
        }
        usersList[i+4] = usuario; //Aqui i = 10

        usuario = {
            nombre: "Ash",
            apellidos: "Ketchup ",
            email: "ash@correo.es",
            password: seguro,
            role : "ROLE_USER"
        }
        usersList[i+5] = usuario; //Aqui i = 10

        usuario = {
            nombre: "Palkia",
            apellidos: "Dialga",
            email: "pokemon@correo.es",
            password: seguro,
            role : "ROLE_USER"
        }
        usersList[i+6] = usuario; //Aqui i = 10

        return usersList;
    }



    app.get("/admin/dropDatabase", function (req, res) {
        var usuarioSesion = req.session.usuario;
        if(usuarioSesion.role != "ROLE_ADMIN"){
            loggerApp.error("No eres un usuario administrador, " + usuarioSesion.email);
            res.redirect("/identificarse?mensaje=No tienes privilegios, listillo." + "&tipoMensaje=alert-danger");
        }
        else{

            gestorBD.restoreDatabase(function(result){
                if(result == null){
                    loggerApp.error("Error al borrar todo el contenido en la base de datos.")
                    res.redirect("/identificarse?mensaje=No se ha podido riniciar la base de datos." + "&tipoMensaje=alert-danger");
                }
                else{
                    var usersList = crearUsuariosDefecto();
                    gestorBD.insertarManyUsuarios(usersList, function (id) {
                        if (id == null) {
                            //res.send("Error al insertar ");
                            loggerApp.info("Se ha reiniciado la base de datos a valores por defecto.")
                            res.redirect("/registrarse?mensaje=Error al reiniciar");
                        } else {
                            //res.send('Usuario Insertado ' + id);
                            //res.redirect("/home");
                            // res.redirect("/listUsers?mensaje=Nuevo usuario registrado");
                            loggerApp.error("No se ha podido insertar los valores por defecto en la base de datos. Por favor, crea el usuario con correo admin@correo.es y pass 123456 para reintentar.")
                            res.redirect("/desconectarse?mensaje=Se ha reiniciado la base de datos.");
                        }
                    });
                }
            });

        }

    });

    app.get("/admin/restoreDatabase", function (req, res) {
        var usuarioSesion = req.session.usuario;
        if(usuarioSesion.role != "ROLE_ADMIN"){
            loggerApp.error("No eres un usuario administrador, " + usuarioSesion.email);
            res.redirect("/identificarse?mensaje=No tienes privilegios, listillo." + "&tipoMensaje=alert-danger");
        }
        else{

            gestorBD.restoreDatabase(function(result){
                if(result == null){
                    loggerApp.error("Error al borrar todo el contenido en la base de datos.")
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
                            loggerApp.info("Se ha reiniciado la base de datos a valores por defecto.")
                            res.redirect("/registrarse?mensaje=Error al registrar usuario")
                        } else {
                            //res.send('Usuario Insertado ' + id);
                            //res.redirect("/home");
                            // res.redirect("/listUsers?mensaje=Nuevo usuario registrado");
                            loggerApp.error("No se ha podido insertar los valores por defecto en la base de datos. Por favor, crea el usuario con correo admin@correo.es y pass 123456 para reintentar.")
                            res.redirect("/identificarse?mensaje=Se ha reiniciado la base de datos.");
                        }
                    });
                }
            });

        }

    });
}