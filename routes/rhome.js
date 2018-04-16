module.exports = function(app, swig) {
    app.get("/", function(req, res) {
        res.send("/canciones");
    });
};