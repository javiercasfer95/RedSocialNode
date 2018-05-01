module.exports = function(app, swig) {
    app.get("/", function(req, res) {
        res.redirect("/home");
    });

    app.get("/home", function (req, res) {
        var respuesta = null;
        if(req.session.usuario == null) {
            respuesta = swig.renderFile('views/home.html');
            res.send(respuesta);
        }
        else{
            respuesta = swig.renderFile('views/bbienvenido.html', {usuario : req.session.usuario});
            res.send(respuesta);
        }
    });
};