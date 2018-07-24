const express = require("express");
var app = express();

const PORT = 3000 //maybe make this an environment variable later?

app.use(express.static('public'));

var mysql = require('mysql');
var con = mysql.createConnection({
	host: "localhost",
	user: "root",
	password: "",
	database: "oraclemarketcap"
});


app.get('/', (req,res) => { 
	res.send("hello!"); 
});


app.get('/providers/:address', (req,res) => {
	var address = req.params.address;
	console.log(address);
	var query = "SELECT * FROM provider WHERE providerAddress='" + address+ "'";
	con.query(query, function(err, results) {
		if(!err) {
			res.json({data: results});
		}
		else 
			console.error(err);
	})
})


//figure out how to differentiate between title and address GETS
app.get('/providers/:title', (req,res) => {
	var title = req.params.title;
	console.log(title);
	var query = "SELECT * FROM provider WHERE providerTitle='" + title + "'";
	con.query(query, function(err, results) {
		if(!err) {
			res.json({data: results});
		}
		else 
			console.error(err);
	})
})

app.get('/providers', async function(req,res) {
	console.log("recieved req");
	var query = "SELECT * FROM provider";
	con.query(query, function(err, results) {
		if(!err) {
			res.json({data: results});
		}
		else 
			console.error(err);
	})

})

app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));