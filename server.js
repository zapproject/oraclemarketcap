const express = require("express");
const util = require('util');
const config = require("./config/config.json");
const dbHandler =require("./DBHandler.js");
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
	res.status(200); 
});

//=========================================================//
//	Error Handler     									   //
//=========================================================//
// Sample usage:
//
// app.get('/test_error_handler', (req, res) => {
//	 handleError(req, res, "test_error_1");
// })


function handleError(req, res, err) {
	switch(req.method) {
		case "GET":
			res.status(404);
			break;
	}
	console.error(err);
	res.json({'error': err});
}

//=========================================================//
//	Providers API										   //
//=========================================================//

app.get('/providers', async function(req,res) {
	console.log("recieved req");
	try{
		results = await dbHandler.getProviders();
		console.log(results);
		res.json({data: results});
	}
	catch(err){
		handleError(req, res, err);
	}

});

app.get('/providers/address/:address', async (req,res) => {
	var address = req.params.address;
	try{
		results = await dbHandler.getProvidersByAddress(address)
		res.json({data: results});
	}
	catch(err){
		handleError(req, res, err);
	}
});

app.get('/providers/title/:title', async (req,res) => {
	var title = req.params.title;
	try{
		results = await dbHandler.getProvidersByTitle(title)
		res.json({data: results});
	}
	catch(err){
		handleError(req, res, err);
	}
});

app.get('/providers/asc', async function(req,res) {
	console.log("recieved req");
	try{
		results = await dbHandler.getProvidersByZap(true)
		res.json({data: results});
	}
	catch(err){
		handleError(req, res, err);
	}
});
app.get('/providers/desc', async function(req,res) {
	console.log("recieved req");
	try{
		results = await dbHandler.getProvidersByZap(false)
		res.json({data: results});
	}
	catch(err){
		handleError(req, res, err);
	}
});
app.get('/providers/lastupdated', async function(req,res) {
	console.log("recieved req");
	try{
		results = await dbHandler.getProvidersLastUpdated()
		res.json({data: results});
	}
	catch(err){
		handleError(req, res, err);
	}
});

//=========================================================//
//	Endpoints API										   //
//=========================================================//
app.get('/endpoints', async function(req,res) {
	console.log("recieved req");
	try{
		results = await dbHandler.getEndpoints()
		res.json({data: results});
	}
	catch(err){
		handleError(req, res, err);
	}
});

app.get('/endpoints/address/:address', async (req,res) => {
	var address = req.params.address;
	try{
		results = await dbHandler.getEndpointsByAddress(address)
		res.json({data: results});
	}
	catch(err){
		handleError(req, res, err);
	}
});

app.get('/endpoints/name/:name', async(req,res) => {
	var name = req.params.name;
	try{
		results = await dbHandler.getEndpointsByName(name)
		res.json({data: results});
	}
	catch(err){
		handleError(req, res, err);
	}
});

app.get('/endpoints/title/:title', async(req,res) => {
	var title = req.params.title;
	try{
		results = await dbHandler.getEndpointsByProviderTitle(title)
		res.json({data: results});
	}
	catch(err){
		handleError(req, res, err);
	}
});

app.get('/endpoints/zapasc', async function(req,res) {
	console.log("recieved req");
	try{
		results = await dbHandler.getEndpointsByZapValue(true)
		res.json({data: results});
	}
	catch(err){
		handleError(req, res, err);
	}
});
app.get('/endpoints/zapdesc', async function(req,res) {
	console.log("recieved req");
	try{
		results = await dbHandler.getEndpointsByZapValue(false)
		res.json({data: results});
	}
	catch(err){
		handleError(req, res, err);
	}
});
app.get('/endpoints/dotasc', async function(req,res) {
	console.log("recieved req");
	try{
		results = await dbHandler.getEndpointsByDotValue(true)
		res.json({data: results});
	}
	catch(err){
		handleError(req, res, err);
	}
});
app.get('/endpoints/dotdesc', async function(req,res) {
	console.log("recieved req");
	try{
		results = await dbHandler.getEndpointsByDotValue(false)
		res.json({data: results});
	}
	catch(err){
		handleError(req, res, err);
	}
});
app.get('/endpoints/numdotasc', async function(req,res) {
	console.log("recieved req");
	try{
		results = await dbHandler.getEndpointsByDotIssued(true)
		res.json({data: results});
	}
	catch(err){
		handleError(req, res, err);
	}
});
app.get('/endpoints/numdotdesc', async function(req,res) {
	console.log("recieved req");
	try{
		results = await dbHandler.getEndpointsByDotIssued(false)
		res.json({data: results});
	}
	catch(err){
		handleError(req, res, err);
	}
});
app.get('/endpoints/lastupdated', async function(req,res) {
	console.log("recieved req");
	try{
		results = await dbHandler.getEndpoints()
		res.json({data: results});
	}
	catch(err){
		handleError(req, res, err);
	}
});

app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));