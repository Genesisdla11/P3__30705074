const sqlite3 = require ('sqlite3').verbose();
const path = require ('path');


//Conection Data Base
const db_name = path.join(__dirname, '../db', 'base.db');
const db = new sqlite3.Database(db_name, err =>{
    if (err) { 
        console.error(err.message);
    }else {
        console.log('Conexion exitosa la base de datos');
    }
});

db.serialize(() =>{
const sql_create="CREATE TABLE IF NOT EXISTS categorias ( id INTEGER PRIMARY KEY  AUTOINCREMENT, nombre varchar (25) NOT NULL);";
db.run(sql_create, err =>{
  if (err) {
    console.error (err.message);
  } else {
    console.log("Tabla de categorias anexada correctamente");
  }
})
const sql_create2="CREATE TABLE IF NOT EXISTS productos ( id INTEGER PRIMARY KEY AUTOINCREMENT, nombre varchar (25) NOT NULL, precio double NOT NULL, codigo int NOT NULL UNIQUE, descripcion varchar (60) NULL DEFAULT 'Sin descripcion', marca varchar (25) NOT NULL, material varchar(60) NOT NULL, categoria_id int, FOREIGN KEY (categoria_id) REFERENCES categorias (id));";
db.run(sql_create2, err =>{

  if (err) {
    console.error (err.message);
  } else {
    console.log("Tabla de productos anexada correctamente");
  }
})
const sql_create3="CREATE TABLE IF NOT EXISTS imagenes ( id INTEGER PRIMARY KEY AUTOINCREMENT, url varchar (200) NOT NULL, destacado VARCHAR (20) NOT NULL, producto_id INT, FOREIGN KEY (producto_id) REFERENCES productos (id));";
db.run(sql_create3, err =>{
  if (err) {
    console.error (err.message);
  } else {
    console.log("Tabla de imagenes anexada correctamente");
  }
});
})

module.exports = db;