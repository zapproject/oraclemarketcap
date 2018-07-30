const express = require("express");
const util = require('util');
var app = express();

const PORT = 3000 //maybe make this an environment variable later?

app.use(express.static('public'));

var mysql = require('mysql');
var pool = mysql.createPool({
	host: "localhost",
	user: "root",
	password: "",
	database: "oraclemarketcap"
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
	})

})

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
	})
})


//figure out how to differentiate between title and address GETS
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
	})
})
app.get('/providers/asc', async function(req,res) {
	console.log("recieved req");
	var query = "SELECT * FROM providers WHERE total_zap_value IS NOT NULL ORDER BY total_zap_value asc";
	pool.query(query,function(err, results) {
		if(!err) {
			res.json({data: results});
		}
		else 
			console.error(err);
	})

})
app.get('/providers/desc', async function(req,res) {
	console.log("recieved req");
	var query = "SELECT * FROM providers WHERE total_zap_value IS NOT NULL ORDER BY total_zap_value desc";
	pool.query(query, function(err, results) {
		if(!err) {
			res.json({data: results});
		}
		else 
			console.error(err);
	})

})
app.get('/providers/lastupdated', async function(req,res) {
	console.log("recieved req");
	var query = "SELECT * FROM providers ORDER BY timestamp DESC";
	pool.query(query, function(err, results) {
		if(!err) {
			res.json({data: results});
		}
		else 
			console.error(err);
	})

})

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
	})

})

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
	})
})
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
	})
})
app.get('/endpoints/endpoint/:id', (req,res) => {
	var id = req.params.id;
	console.log(id);
	var query = "SELECT * FROM endpoints WHERE endpoint_id=?";
	pool.query(query, id, function(err, results) {
		if(!err) {
			res.json({data: results});
		}
		else 
			console.error(err);
	})
})
app.get('/endpoints/zapasc', async function(req,res) {
	console.log("recieved req");
	var query = "SELECT * FROM endpoints WHERE zap_value IS NOT NULL ORDER BY zap_value asc";
	pool.query(query, function(err, results) {
		if(!err) {
			res.json({data: results});
		}
		else 
			console.error(err);
	})

})
app.get('/endpoints/zapdesc', async function(req,res) {
	console.log("recieved req");
	var query = "SELECT * FROM endpoints WHERE zap_value IS NOT NULL ORDER BY zap_value desc";
	pool.query(query, function(err, results) {
		if(!err) {
			res.json({data: results});
		}
		else 
			console.error(err);
	})

})
app.get('/endpoints/dotasc', async function(req,res) {
	console.log("recieved req");
	var query = "SELECT * FROM endpoints WHERE dot_value IS NOT NULL ORDER BY dot_value asc";
	pool.query(query, function(err, results) {
		if(!err) {
			res.json({data: results});
		}
		else 
			console.error(err);
	})

})
app.get('/endpoints/dotdesc', async function(req,res) {
	console.log("recieved req");
	var query = "SELECT * FROM endpoints WHERE dot_value IS NOT NULL ORDER BY dot_value desc";
	pool.query(query, function(err, results) {
		if(!err) {
			res.json({data: results});
		}
		else 
			console.error(err);
	})

})
app.get('/endpoints/lastupdated', async function(req,res) {
	console.log("recieved req");
	var query = "SELECT * FROM endpoints ORDER BY timestamp DESC";
	pool.query(query, function(err, results) {
		if(!err) {
			res.json({data: results});
		}
		else 
			console.error(err);
	})

})

app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));