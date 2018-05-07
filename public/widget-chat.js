var mensajes;
var usuarioSesion;
var colega;
function cargarMensajes() {
    $.ajax({
        url: URLbase + "/mensaje/" + idAmigo,
        type: "GET",
        data: {},
        dataType: 'json',
        headers: {
            "token": token
        },
        success: function (respuesta) {
            usuarioSesion = respuesta.usuario;
            colega = respuesta.colega;
            mensajes = reespuesta.mensajes;
            actualizarTabla(mensajes);
        },
        error: function (error) {
            $("#contenedor-principal").load("widget-login.html");
        }
    });
}






function actualizarTabla(mensajes){
    $("#tabla").empty(); // Vaciar la tabla
    for (i = 0; i < mensajes.length; i++) {
        $("#tabla").append(
            "<tr id="+mensajes[i]._id+">"+
            "<td>"+mensajes[i].texto+"</td>" +
            "<td>"+mensajes[i].emisor+"</td>" +
            "<td>"+mensajes[i].fecha.toString()+"</td>" +
            "<td>"+
            "</td>"+
            "</tr>" );

    }
}

cargarMensajes();