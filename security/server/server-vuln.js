var express = require('express');
var bodyParser = require('body-parser');
var validator = require('validator');
var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const { Client } = require('pg');
const client = new Client({
	connectionString: process.env.DATABASE_URL || "postgres://dev:dev@localhost:5432/notuber",
	ssl: {
		rejectUnauthorized: false
	}
});
client.connect();

app.post('/rides', function(request, response) {
	response.header("Access-Control-Allow-Origin", "*");
	response.header("Access-Control-Allow-Headers", "X-Requested-With");

	var username = request.body.username;
	var lat = request.body.lat;
	var lng = request.body.lng;
	if (username != undefined && lat != undefined && lng != undefined && validator.isFloat(lat) && validator.isFloat(lng)) {
		lat = parseFloat(lat);
		lng = parseFloat(lng);
		client.query('INSERT INTO passengers (username, lat, lng) VALUES ($1, $2, $3)', [username, lat, lng], (error, result) => {
			if (!error) {
				client.query('SELECT * FROM vehicles WHERE created_on > NOW() - INTERVAL \'1\' HOUR ORDER BY created_on DESC', (error, result) => {
					if (!error) {
						response.send(result.rows);
					}
				});
			}
		});
	}
	else {
		response.send('{"error":"Whoops, something is wrong with your data!"}');
	}
});

app.post('/update', function(request, response) {
	response.header("Access-Control-Allow-Origin", "*");
	response.header("Access-Control-Allow-Headers", "X-Requested-With");

	var username = request.body.username;
	var lat = request.body.lat;
	var lng = request.body.lng;
	if (username != undefined && lat != undefined && lng != undefined && validator.isFloat(lat) && validator.isFloat(lng)) {
		lat = parseFloat(lat);
		lng = parseFloat(lng);
		client.query('INSERT INTO vehicles(username, lat, lng) VALUES ($1, $2, $3)', [username, lat, lng], (error, result) => {
			response.send('{"status":"Success"}');
		});
	}
	else {
		response.send('{"error":"Access denied"}');
	}
});

app.get('/passenger.json', function(request, response) {
	var usernameEntry = request.query.username;
	if (usernameEntry == undefined || usernameEntry == null) {
		response.send("[]");
	}
	else {
		theQuery = "SELECT * FROM passengers WHERE username = '" + usernameEntry + "'";
		client.query(theQuery, (error, result) => {
			if (!error) {
				response.send(result.rows);
			}
		});
	}
});

app.get('/vehicle.json', function(request, response) {
	var usernameEntry = request.query.username;
	if (usernameEntry == undefined || usernameEntry == null) {
		response.send("[]");
	}
	else {
		theQuery = "SELECT * FROM vehicles WHERE username = '" + usernameEntry + "'";
		client.query(theQuery, (error, result) => {
			if (!error) {
				response.send(result.rows);
			}
		});
	}
});

app.get('/', function(request, response) {
	response.set('Content-Type', 'text/html');
	var indexPage = '';
	client.query('SELECT * FROM passengers ORDER BY created_on DESC', (error, result) => {
		if (!error) {
			indexPage += "<!DOCTYPE HTML><html><head><title>Not Uber</title></head><body><h1>Not Uber</h1><ul>";
			if (result.rows.length == 0) {
				indexPage += "<li>No passengers</li>";
			}
			else {
				for (var count = 0; count < result.rows.length; count++) {
					indexPage += "<li>" + result.rows[count].username + " requested a vehicle at " + result.rows[count].lat + ", " + result.rows[count].lng + " on " + result.rows[count].created_on + "</li>";
				}
			}
			indexPage += "</ul></body></html>"
			response.send(indexPage);
		} else {
			response.send('<!DOCTYPE HTML><html><head><title>Not Uber</title></head><body><h1>Not Uber</h1><p>Whoops, something went terribly wrong!</p></body></html>');
		}
	});
});

app.listen(process.env.PORT || 3000);