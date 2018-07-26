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


app.get('/providers/address/:address', (req,res) => {
	var address = req.params.address;
	console.log(address);
	var query = "SELECT * FROM providers WHERE provider_address=" + con.escape(address);
	con.query(query, function(err, results) {
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
	var query = "SELECT * FROM providers WHERE provider_title=" + con.escape(title) ;
	con.query(query, function(err, results) {
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
	con.query(query, function(err, results) {
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
	con.query(query, function(err, results) {
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
	var query = "SELECT * FROM providers";
	con.query(query, function(err, results) {
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
	var query = "SELECT * FROM endpoints WHERE provider_address=" + con.escape(address) ;
	con.query(query, function(err, results) {
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
	var query = "SELECT * FROM endpoints WHERE endpoint_name=" + con.escape(name) ;
	con.query(query, function(err, results) {
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
	var query = "SELECT * FROM endpoints WHERE endpoint_id=" + con.escape(id) ;
	con.query(query, function(err, results) {
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
	con.query(query, function(err, results) {
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
	con.query(query, function(err, results) {
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
	con.query(query, function(err, results) {
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
	con.query(query, function(err, results) {
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
	con.query(query, function(err, results) {
		if(!err) {
			res.json({data: results});
		}
		else 
			console.error(err);
	})

})
app.get('/endpoints', async function(req,res) {
	console.log("recieved req");
	var query = "SELECT * FROM endpoints";
	con.query(query, function(err, results) {
		if(!err) {
			res.json({data: results});
		}
		else 
			console.error(err);
	})

})
app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));