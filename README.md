### oraclemarketcCREATE TABLE endpoints(
provider_address VARCHAR(50) NOT NULL,
endpoint_name VARCHAR(50) NOT NULL,
zap_value int NOT NULL DEFAULT 0,
dot_value int NOT NULL DEFAULT 0,
dot_issued int NOT NULL DEFAULT 0, 
timestamp timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
constants VARCHAR(100) NOT NULL,
parts VARCHAR(100) NOT NULL,
dividers VARCHAR(100) NOT NULL,
primary key(provider_address, endpoint_name));ap


## How to Initialize mySQL Database 

`CREATE DATABASE oraclemarketcap`
`USE oraclemarketcap`

```
CREATE TABLE endpoints(
provider_address VARCHAR(50) NOT NULL,
endpoint_name VARCHAR(50) NOT NULL,
zap_value bigint UNSIGNED NOT NULL DEFAULT 0,
dot_value bigint UNSIGNED NOT NULL DEFAULT 0,
dot_issued bigint UNSIGNED NOT NULL DEFAULT 0, 
timestamp timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
constants TEXT NOT NULL,
parts TEXT NOT NULL,
dividers TEXT NOT NULL,
primary key(provider_address, endpoint_name));

CREATE TABLE providers(
provider_address VARCHAR(50) PRIMARY KEY UNIQUE,
provider_title VARCHAR(50) NOT NULL,
total_zap_value bigint NOT NULL DEFAULT 0,
timestamp timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP); 
```

## Functionality

functionality in Handlerv2.js. run using

`node Handlerv2.js`

in open terminal to listen for events.

server routing in server.js. run

`node server.js`

in open terminal and open localhost:3000 on internet browser to see database information.

Note: To populate table with past endpoint data (to initialize db or to recover from downtime) you need Registry's ABI in a folder called "contracts" in the root directory. 
