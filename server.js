const express = require("express");
const util = require('util');
const config = require("./config/config.json");

var app = express();

const PORT = config.port;
const DB = config.db;


app.use(express.static('public'));

var mysql = require('mysql');
var pool = mysql.createPool({
	host: DB.host,
	user: DB.user,
	password: DB.password,
	database: DB.dbName
});


pool.query('SELECT 1 + 1 AS solution', (error, results, fields) => {
        		if (error) throw error;
        		console.log('Database connection successfully established; Fetching data.');
        	});
        	
// shorthand for getConnection, query, releaseConnection
pool.query = util.promisify(pool.query);

app.get('/', (req,res) => { 
	res.send("index.html"); 
});

//=========================================================//
//	Providers API										   //
//=========================================================//

app.get('/providers', async function(req,res) {
	console.log("recieved req");
	var query = "SELECT * FROM providers";
	pool.query(query, function(err, results) {
		if(!err) {
			res.json({data: results});
		}
		else 
			console.error(err);
	});

});

app.get('/providers/address/:address', (req,res) => {
	var address = req.params.address;
	console.log(address);

	var query = "SELECT * FROM providers WHERE provider_address=?";
	pool.query(query, address, function(err, results) {
		if(!err) {
			res.json({data: results});
		}
		else 
			console.error(err);
	});
});

app.get('/providers/title/:title', (req,res) => {
	var title = req.params.title;
	console.log(title);
	var query = "SELECT * FROM providers WHERE provider_title=?";
	pool.query(query, title, function(err, results) {
		if(!err) {
			res.json({data: results});
		}
		else 
			console.error(err);
	});
});
app.get('/providers/asc', async function(req,res) {
	console.log("recieved req");
	var query = "SELECT * FROM providers WHERE total_zap_value ORDER BY total_zap_value asc";
	pool.query(query,function(err, results) {
		if(!err) {
			res.json({data: results});
		}
		else 
			console.error(err);
	});

});
app.get('/providers/desc', async function(req,res) {
	console.log("recieved req");
	var query = "SELECT * FROM providers WHERE total_zap_value ORDER BY total_zap_value desc";
	pool.query(query, function(err, results) {
		if(!err) {
			res.json({data: results});
		}
		else 
			console.error(err);
	});

});
app.get('/providers/lastupdated', async function(req,res) {
	console.log("recieved req");
	var query = "SELECT * FROM providers ORDER BY timestamp DESC";
	pool.query(query, function(err, results) {
		if(!err) {
			res.json({data: results});
		}
		else 
			console.error(err);
	});

});

//=========================================================//
//	Endpoints API										   //
//=========================================================//
app.get('/endpoints', async function(req,res) {
	console.log("recieved req");
	var query = "SELECT * FROM endpoints";
	pool.query(query, function(err, results) {
		if(!err) {
			res.json({data: results});
		}
		else 
			console.error(err);
	});

});

app.get('/endpoints/address/:address', (req,res) => {
	var address = req.params.address;
	console.log(address);
	var query = "SELECT * FROM endpoints WHERE provider_address=?";
	pool.query(query, address, function(err, results) {
		if(!err) {
			res.json({data: results});
		}
		else 
			console.error(err);
	});
});
app.get('/endpoints/name/:name', (req,res) => {
	var name = req.params.name;
	console.log(name);
	var query = "SELECT * FROM endpoints WHERE endpoint_name=?";
	pool.query(query, name, function(err, results) {
		if(!err) {
			res.json({data: results});
		}
		else 
			console.error(err);
	});
});

app.get('/endpoints/zapasc', async function(req,res) {
	console.log("recieved req");
	var query = "SELECT * FROM endpoints WHERE zap_value ORDER BY zap_value asc";
	pool.query(query, function(err, results) {
		if(!err) {
			res.json({data: results});
		}
		else 
			console.error(err);
	});

});
app.get('/endpoints/zapdesc', async function(req,res) {
	console.log("recieved req");
	var query = "SELECT * FROM endpoints WHERE zap_value ORDER BY zap_value desc";
	pool.query(query, function(err, results) {
		if(!err) {
			res.json({data: results});
		}
		else 
			console.error(err);
	});

});
app.get('/endpoints/dotasc', async function(req,res) {
	console.log("recieved req");
	var query = "SELECT * FROM endpoints WHERE dot_value ORDER BY dot_value asc";
	pool.query(query, function(err, results) {
		if(!err) {
			res.json({data: results});
		}
		else 
			console.error(err);
	});

});
app.get('/endpoints/dotdesc', async function(req,res) {
	console.log("recieved req");
	var query = "SELECT * FROM endpoints WHERE dot_value ORDER BY dot_value desc";
	pool.query(query, function(err, results) {
		if(!err) {
			res.json({data: results});
		}
		else 
			console.error(err);
	});

});
app.get('/endpoints/numdotasc', async function(req,res) {
	console.log("recieved req");
	var query = "SELECT * FROM endpoints WHERE dot_issued ORDER BY dot_issued asc";
	pool.query(query, function(err, results) {
		if(!err) {
			res.json({data: results});
		}
		else 
			console.error(err);
	});

});
app.get('/endpoints/numdotdesc', async function(req,res) {
	console.log("recieved req");
	var query = "SELECT * FROM endpoints WHERE dot_issued ORDER BY dot_issued desc";
	pool.query(query, function(err, results) {
		if(!err) {
			res.json({data: results});
		}
		else 
			console.error(err);
	});

});
app.get('/endpoints/lastupdated', async function(req,res) {
	console.log("recieved req");
	var query = "SELECT * FROM endpoints ORDER BY timestamp DESC";
	pool.query(query, function(err, results) {
		if(!err) {
			res.json({data: results});
		}
		else 
			console.error(err);
	});

});

app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));