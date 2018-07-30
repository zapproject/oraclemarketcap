oraclemarketcap


How to Initialize Database
On mysql

CREATE DATABASE oraclemarketcap
USE oraclemarketcap

CREATE TABLE endpoints(endpoint_id int unsigned AUTO_INCREMENT primary key,
provider_address VARCHAR(50) NOT NULL,
endpoint_name VARCHAR(50) NOT NULL,
zap_value int,
dot_value int,
timestamp timestamp,
constants VARCHAR(100) NOT NULL,
parts VARCHAR(100) NOT NULL,
dividers VARCHAR(100) NOT NULL);

CREATE TABLE providers(
provider_address VARCHAR(50) PRIMARY KEY UNIQUE,
provider_title VARCHAR(50) NOT NULL,
total_zap_value int,
timestamp timestamp); 