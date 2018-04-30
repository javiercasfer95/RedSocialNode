module.exports = function (app, swig, gestorBD) {
     app.get("/home", function (req, res) {

                    var respuesta = swig.renderFile('views/home.html');

                    res.send(respuesta);



        });



    function paso1ModificarPortada(files, id, callback) {
        if (files.portada != null) {
            var imagen = files.portada;
            imagen.mv('public/portadas/' + id + '.png', function (err) {
                if (err) {
                    callback(null); // ERROR
                } else {
                    paso2ModificarAudio(files, id, callback); // SIGUIENTE
                }
            });
        } else {
            paso2ModificarAudio(files, id, callback); // SIGUIENTE
        }
    }

    function paso2ModificarAudio(files, id, callback) {
        if (files.audio != null) {
            var audio = files.audio;
            audio.mv('public/audios/' + id + '.mp3', function (err) {
                if (err) {
                    callback(null); // ERROR
                } else {
                    callback(true); // FIN
                }
            });
        } else {
            callback(true); // FIN
        }
    }
};