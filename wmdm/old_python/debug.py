from psiturk.experiment import app

host = "0.0.0.0"
port = 5000
print("Serving on ", "http://" + host + ":" + str(port))
app.config['TEMPLATES_AUTO_RELOAD'] = True
app.jinja_env.auto_reload = True
app.run(debug=True, host=host, port=port)