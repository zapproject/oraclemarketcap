oraclemarketcap


How to Initialize Database
On mysql

CREATE DATABASE oraclemarketcap
USE oraclemarketcap

CREATE TABLE endpoint(endpointID int unsigned AUTO_INCREMENT primary key,
providerAddress VARCHAR(50) NOT NULL,
endpointName VARCHAR(50) NOT NULL,
zapValue int,
dotValue int,
timestamp timestamp,
constant VARCHAR(100) NOT NULL,
part VARCHAR(100) NOT NULL,
divider VARCHAR(100) NOT NULL); 

CREATE TABLE provider(
providerAddress VARCHAR(50) PRIMARY KEY UNIQUE,
providerTitle VARCHAR(50) NOT NULL,
totalZapValue int,
timestamp timestamp);

ALTER TABLE endpoint ADD CONSTRAINT FOREIGN KEY (providerAddress) REFERENCES provider (providerAddress) ON DELETE CASCADE ON UPDATE CASCADE;