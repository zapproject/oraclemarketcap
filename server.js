const express = require("express");

var app = express();

const PORT = 3000 //maybe make this an environment variable later?

app.use(express.static('views'));

var mysql = require('mysql');
var con = mysql.createConnection({
	host: "localhost",
	user: "root",
	password: "",
	database: "oraclemarketcap"
});


app.get('/', (req,res) => { 
	res.send('index.html'); 
});


app.get('/providers/address/:address', (req,res) => {
	var address = req.params.address;
	console.log(address);
	var query = "SELECT * FROM provider WHERE providerAddress='" + address+ "'";
	con.query(query, function(err, results) {
		if(!err) {
			res.render("index", {data: results });
		}
		else 
			console.error(err);
	})
})


//figure out how to differentiate between title and address GETS
app.get('/providers/title/:title', (req,res) => {
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
app.get('/providers/asc', async function(req,res) {
	console.log("recieved req");
	var query = "SELECT * FROM provider WHERE totalZapValue IS NOT NULL ORDER BY totalZapValue asc";
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
	var query = "SELECT * FROM provider WHERE totalZapValue IS NOT NULL ORDER BY totalZapValue desc";
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
	var query = "SELECT * FROM provider ORDER BY timestamp DESC";
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
			console.log(JSON.stringify(results, null, 2));
			res.json({ data: results })
		}
		else 
			console.error(err);
	})

})

app.get('/endpoints/address/:address', (req,res) => {
	var address = req.params.address;
	console.log(address);
	var query = "SELECT * FROM endpoint WHERE providerAddress='" + address + "'";
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
	var query = "SELECT * FROM endpoint WHERE endpointName='" + name + "'";
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
	var query = "SELECT * FROM endpoint WHERE endpointID='" + id + "'";
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
	var query = "SELECT * FROM endpoint WHERE zapValue IS NOT NULL ORDER BY zapValue asc";
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
	var query = "SELECT * FROM endpoint WHERE zapValue IS NOT NULL ORDER BY zapValue desc";
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
	var query = "SELECT * FROM endpoint WHERE dotValue IS NOT NULL ORDER BY dotValue asc";
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
	var query = "SELECT * FROM endpoint WHERE dotValue IS NOT NULL ORDER BY dotValue desc";
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
	var query = "SELECT * FROM endpoint ORDER BY timestamp DESC";
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
	var query = "SELECT * FROM endpoint";
	con.query(query, function(err, results) {
		if(!err) {
			res.json({data: results});
		}
		else 
			console.error(err);
	})

})

app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));