oraclemarketcap


How to Initialize Database
On mysql

CREATE DATABASE oraclemarketcap
USE oraclemarketcap

CREATE TABLE endpoints(endpoint_id int unsigned AUTO_INCREMENT primary key,
provider_address VARCHAR(50) NOT NULL,
endpoint_name VARCHAR(50) NOT NULL,
zap_value int NOT NULL DEFAULT 0,
dot_value int NOT NULL DEFAULT 0,
timestamp timestamp NOT NULL,
constants VARCHAR(100) NOT NULL,
parts VARCHAR(100) NOT NULL,
dividers VARCHAR(100) NOT NULL);

CREATE TABLE providers(
provider_address VARCHAR(50) PRIMARY KEY UNIQUE,
provider_title VARCHAR(50) NOT NULL,
total_zap_value int NOT NULL DEFAULT 0,
timestamp timestamp NOT NULL); 

functionality in Handlerv2.js. run using
node Handlerv2.js
in open terminal to listen for events.

server routing in server.js. run
node server.js
in open terminal and open localhost:3000 on internet browser to see database information.