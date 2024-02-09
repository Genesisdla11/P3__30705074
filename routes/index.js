require ('dotenv').config();
var express = require('express');
var router = express.Router();
var axios = require ('axios');
var nodemailer = require ('nodemailer');


const productosModel = require ('../models/admin');
const { Axios } = require('axios');


router.get('/login', function(req, res, next) {
   if (req.session.isAdmin) {
    res.redirect('/home');
  } else if (req.session.isUsuario) {
    res.redirect('/');
  } else {
    res.render('index', { title: 'Login' });
  }
});

//Funcion Correo
const transporter = nodemailer.createTransport({ 
  service: 'gmail', 
  auth: { 
    user: process.env.correo, 
    pass: process.env.clave_correo
  } });



//failclave quitar si causa problemas
router.get('/index', function(req, res, next) {
  res.render('index', { title: 'Login' });
});


router.get('/detallesprd', function(req, res, next) {
  res.render('detallesprd', { title: 'detallesprd' });
});


//Inicio de sesion usuarios

router.get('/loginclientes', function(req, res, next) {
  if (req.session.isAdmin) {
    res.redirect('/');
  } else if (req.session.isUsuario) {
    res.redirect('/');
  } else {
    res.render('loginclientes', { title: 'Login Clientes' });
  }
});

//logeo de inicio de sesion cliente

router.post('/login2', function(req, res, next){
  const {email, password} =req.body;
  let concat, concat2;
  productosModel
  .iniciosesionclientes(email)
  .then(datos=>{
    concat = datos[0].password;
    concat2 = datos[0].id
    console.log(concat2);
    if (password == concat){
      req.session.email = email;
      req.session.isAdmin = true;
      req.session.username = concat2;
      res.redirect('/');
    }else{
      res.send('esto no funciona')
    }
  })
  .catch(err=>{
    console.error(err.message);
    return res.status(500).send('Error en el inicio de sesion')
  })
});


//Registros clientes
router.get('/registerclientes', function(req, res, next){
  if (req.session.isAdmin) {
    res.redirect('/home');
  } else if (req.session.isUsuario) {
    res.redirect('/');
  } else {
    res.render('registerclientes', {title: 'Registro Clientes'})
  }
});

//Registro de clientes
router.post('/register', function(req, res, next){
  const {email, password1, password2, preg_seg, resp_seg} = req.body;
  if (password1 != password2){
    res.redirect('/passwordfail')
  } else{
  productosModel
    .registroclientes(email, password1, preg_seg, resp_seg)
    .then(idClienteRegistrado=>{
      const mailOptions = { 
        from: process.env.email, 
        to: email, 
        subject: `Bienvenido a MomentSun`, 
        text: `Un placer!!\n 
        Tu registro se completo de manera exitosa!!\n\n
        Nos complace que formes parte de nuestra plataforma, culaquier problema este es nuestro correo de contacto.\n 
        MomentSun ©2024 M&C. All rights reserved` 
      };

      transporter.sendMail(mailOptions, function(error, info){ 
        if (error) { console.log(error); 
        } else { 
          console.log('Correo electrónico de Bienvenida enviado: ' + info.response); 
        }});
      res.redirect('/loginclientes');
    })
    .catch(err=>{
      console.error(err.message);
      return res.status(500).send('Error en el registro')
    })}
});

//Pagina recuperar contraseña
router.get('/recuperar', function(req, res, next){
  res.render('recuperar', {title: 'Recuperar Contraseña'})
});


//Responder pregunta de Seguridad
router.post('/resclave', function(req, res, next){
  const {email, pregunta, respuesta} = req.body;
  productosModel
    .recuperarclave(email, pregunta, respuesta)
    .then(datos=>{
      req.session.ResId = datos.id;
      const mailOptions = { 
        from: process.env.correo, 
        to: datos.email, 
        subject: `Restablecer Contraseña`, 
        text: `Un gusto, le indicamos para reestablecer su contraseña.\n
        Haz clic en el siguiente enlace para continuar: ${process.env.base_url}/rest-clave/${datos.id}\n\n
        Si no ha sido usted el ha solicitado el reestablecimiento solo ignore el correo.\n\n 
        MomentSun ©2024 M&C. All rights reserved` 
      };

      transporter.sendMail(mailOptions, function(error, info){ 
        if (error) { console.log(error); 
        } else { 
          console.log('Correo electrónico de recuperacion de contraseña enviado: ' + info.response); 
      }});
      res.send('Dirijase al correo para recuperar su contraseña')
   
    })
    .catch(err=>{
      console.error(err.message);
      return res.status(500).send('Pregunta y respuesta no coincidente')
    })
});

//Pagina restablecer contraseña
router.get('/rest-clave/:id', function(req, res, next){
  const id= req.params.id;
  if (req.session.isAdmin){
    res.redirect('/Catalogo');
  }else if (req.session.ResId == id){
    productosModel
    .obtenerIdcliente(id)
    .then(datos=>{
      req.session.ResId = null;
      res.render('claverec', {datos: datos});
     
    })
    .catch(err=>{
      console.error(err.message);
      return res.status(500).send('No se encuentra ese cliente');
    })
  } else{
    res.redirect('/');
  }
});

//Restablecer Contraseña
router.post('/updateclave/:id', function(req, res, next){
  const cliente_id= req.params.id;
  console.log(cliente_id);
  const {password1, password2} = req.body;
  if (password1 != password2){
    res.redirect('/passwordfail');
  } else{
    productosModel
    .restablecerclave(password1, cliente_id)
    .then(()=>{
      res.send('Contraseña recuperada de manera exitosa');
    })
    .catch(err=>{
      console.error(err.message);
      return res.status(500).send('Error restableciendo contraseña')
    })
  }
});



//Pagina detalles productos
router.get('/detallesprd/:id', function(req, res, next){
  const id = req.params.id
  productosModel
    .obtenerPorId(id)
    .then(datos=>{
      res.render('detallesprd', {datos: datos});
    })
    .catch(err=>{
      console.error(err.message);
      return res.status(500).send('No se encuentra el producto')
    })
});

//Pagina formulario de compra 
router.get('/pedidoprd/:id', function(req, res, next){
  if(req.session.isAdmin){
    const id = req.params.id;
    productosModel
      .obtenerPorId(id)
      .then(datos=>{
        res.render('pedidoprd', {datos: datos});
      })
      .catch(err=>{
        console.error(err.message);
        return res.status(500).send('No se encuentra el producto')
      })
  } else{
    res.redirect('/loginclientes');
  }
})

//Pago productos API 
router.post('/payments', async (req, res, next)=>{
  var monto, moneda;
  const {producto_id, descripcion, nombre, numero_tarjeta, cvv, mes_ven, year_ven, moneda_id, cantidad, referencia, precio} = req.body;
  const ip_cliente = req.ip || req.socket.remoteAddress;
  const cliente_id = req.session.username;
  const email = req.session.email;
  if (moneda_id == 1) {
    moneda= 'USD';
    monto = cantidad * precio;
  }else{
    if (moneda_id == 2) {
      moneda= 'EUR';
      monto = (cantidad * precio) * 0.91;
    } else {
      if (moneda_id == 3) {
        moneda= 'VES';
        monto = (cantidad * precio) * 35.94; 
      }
    }
  }
  const payments ={
    "amount": monto,
    "card-number": numero_tarjeta,
    "cvv": cvv,
    "expiration-month": mes_ven,
    "expiration-year": year_ven,
    "full-name": nombre,
    "currency": moneda,
    "description": descripcion,
    "reference": referencia
  }
  try{
    const response = await axios.post ('https://fakepayment.onrender.com/payments', payments, {headers:{ Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiSm9obiBEb2UiLCJkYXRlIjoiMjAyNC0wMS0xM1QxNTowMTo1OS44MDVaIiwiaWF0IjoxNzA1MTU4MTE5fQ._x8JH1nHImbUda86hj5QGa97DST9Mz8v3g8ZEOtLPzU'}});
    const data = JSON.parse(JSON.stringify(response.data));
      const transaccion_id = data.data.transaction_id;
      const total_pagado = data.data.amount;
      const fecha = data.data.date;
      const referencia = data.data.reference;
      const descripcion = data.data.description;
      const message = data.message;
      console.log(message);
      productosModel
      .facturas(cantidad, total_pagado, fecha, ip_cliente, transaccion_id, descripcion, referencia, moneda_id, cliente_id, producto_id)
      .then(id =>{
        const mailOptions = { 
          from: process.env.correo, 
          to: email, 
          subject: `¡Compra realizada correctamente!`, 
          text: `¡Hola, ${nombre}!\n\n ¡Gracias por realizar tu pedido en MomentSun! Aqui puedes encontrar los detalles de tu compra:\n\nN° Transacción: ${transaccion_id}\nProducto: ${descripcion}\nCantidad: ${cantidad}\nTotal Pagado: ${total_pagado}${moneda}\n\n¡Gracias por preferirnos!.\n\nMomentSun ©2024 M&C. All rights reserved` 
        };

          transporter.sendMail(mailOptions, function(error, info){ 
            if (error) { console.log(error); 
            } else { 
              console.log('Correo electrónico de compra enviado: ' + info.response); 
            }});
        res.render('pagosucces', {title: 'Compra Exitosa'});
      })
  } catch (err) {
    res.render('pagofails');
  }
});


//Pagina de Productos comprados por Cliente para su calificacion
router.get('/productos-comprados', function(req, res, next){
  if (req.session.isAdmin) {
    const cliente_id = req.session.username;
    console.log(cliente_id);
    productosModel
    .obtenercomprasPorCliente(cliente_id)
    .then(datos=>{
      res.render('prdcomprados', {datos: datos});
    })
    .catch(err=>{
      console.error(err.message);
      return res.status(500).send('Error buscando archivos')
    })
  } else{
    res.redirect('/loginclientes');
  }
})

//Pagina para calificar un producto
router.get('/calificar/:id', function(req, res, next){
  if (req.session.isAdmin){
    const id = req.params.id;
    productosModel
    .obtenerprdconimgPorId(id)
    .then(producto=>{
      res.render('calificaciones', {producto:producto})
    })
    .catch(err=>{
      console.error(err.message);
      return res.status(500).send('Error buscando productos')
    })
  }else{
    res.redirect('/loginclientes');
  }
});

//Califar producto
router.post('/calificacion', function(req, res, next){
  const {producto_id, puntos}= req.body;
  const cliente_id = req.session.username;
  productosModel
  .calificarprd(puntos, cliente_id, producto_id)
  .then(idProductoCalificado=>{
    res.render('calificacionsuccess');
  })
  .catch(err=>{
    console.error(err.message);
    return res.status(500).send('Error calificando productos')
  })
});



//Filtrado por promedio de calificacion
router.post('/filtroprm', function(req, res, next){
  const {promedio} = req.body;
  productosModel
  .filtradoprm(promedio)
  .then(datos=>{
    res.render('Catalogo', {datos: datos});
  })
  .catch(err=>{
    console.error(err.message);
    return res.status(500).send('Error buscando archivos')
  })
});

//hasta aqui



//Pagina principal compras
router.get('/', function(req, res, next){
  productosModel
    .obteneradmin()
    .then(datos=>{
      res.render('Catalogo', {datos: datos});
    }) 
    .catch(err=>{
      console.error(err.message);
      return res.status(500).send('Error cargando archivos')
    })
});

//Busqueda nombre productos
router.post('/search', function(req, res, next){
  const {nombre} = req.body;
  productosModel
    .obtenerprdPorNombre(nombre)
    .then(datos=>{
      res.render('Catalogo', {datos: datos});
    })
    .catch(err=>{
      console.error(err.message);
      return res.status(500).send('Error buscando archivos')
    })
});

//Busqueda descripcion productos
router.post('/searchdescrp', function(req, res, next){
  const {descripcion} = req.body;
  productosModel
    .obtenerprdPorDescripcion(descripcion)
    .then(datos=>{
      res.render('Catalogo', {datos: datos});
    })
    .catch(err=>{
      console.error(err.message);
      return res.status(500).send('Error buscando archivos')
    })
});

//Filtrado de productos por categoria
router.post('/filtroctg', function(req, res, next){
  const {categoria} = req.body;  
  console.log(req.body);
  productosModel
    .filtradoctg(categoria)
    .then(datos=>{
      res.render('Catalogo', {datos: datos});
    })
    .catch(err=>{
      console.error(err.message);
      return res.status(500).send('Error buscando archivos')
    })
});

//Filtrado de productos por marcas
router.post('/filtromarca', function(req, res, next){
  const {marca} = req.body;
  console.log(req.body); 
  productosModel
    .filtradomarca(marca)
    .then(datos=>{
      res.render('Catalogo', {datos: datos});
    })
    .catch(err=>{
      console.error(err.message);
      return res.status(500).send('Error buscando archivos')
    })
});

//Filtrado de productos por Material
router.post('/filtromtl', function(req, res, next){
  const {material} = req.body;  
  console.log(req.body);
  productosModel
    .filtradomtl(material)
    .then(datos=>{
      res.render('Catalogo', {datos: datos});
    })
    .catch(err=>{
      console.error(err.message);
      return res.status(500).send('Error buscando archivos')
    })
});







//login a la pagina del administrador
router.post('/login', function(req, res, next){
  const {user, password} = req.body;
  if ((process.env.USER == user) && (process.env.PASSWORD == password)) {
    req.session.isAdmin = true;
    res.redirect('/home');
  } else{
    res.render('loginfail', {title: 'Login Fail'});
  }
});

//Get principal page
router.get('/home', function(req, res, next){
  if (req.session.isAdmin) {
    res.render('admin');
  } else {
    res.redirect('/login');
  }

});

//Get productos page
router.get('/productos', function(req, res, next){
  if (req.session.isAdmin) {
    productosModel
    .obtenerprd()
    .then(productos =>{
      res.render('productos', {productos: productos});
    })
    .catch(err =>{
      return res.status(500).send("Error buscando producto");
    })
  } else {
    res.redirect('/login');
  }
 
});


//Get categorias page
router.get('/categorias', function(req, res, next){
  if (req.session.isAdmin) {
    productosModel
    .obtenerctg()
    .then(categorias =>{
      res.render('categorias', {categorias: categorias});
    })
    .catch(err =>{
      return res.status(500).send("Error buscando categorias");
    })
  } else {
    res.redirect('/login');
  }
 
});

//Get imagenes page
router.get('/imagenes', function(req, res, next){
  if (req.session.isAdmin) {
    productosModel
  .obtenerimg()
  .then(imagenes =>{
    res.render('imagenes', {imagenes: imagenes});
  })
  .catch(err =>{
    return res.status(500).send("Error buscando imagenes");
  })
  } else {
    res.redirect('/login');
  }
  
});

//Get productos page agg
router.get('/prdagg', function(req, res, next){
  if (req.session.isAdmin) {
    productosModel
    .obtenerctg()
    .then(categorias=>{
      res.render('aggprd', {categorias: categorias});
    })
    .catch(err =>{
      return res.status(500).send("Error a cargar la pagina");
    })
  } else {
    res.redirect('/login');
  }
 
});

//Get categorias page agg
router.get('/ctgagg', function(req, res, next){
  if (req.session.isAdmin) {
    res.render('aggctg');
  } else {
    res.redirect('/login');
  }
 
});

//Get imagenes page agg
router.get('/imgagg', function(req, res, next){
  if (req.session.isAdmin) {
    productosModel
    .obtenerprd()
    .then(productos=>{
      res.render('aggimg', {productos: productos});
    })
    .catch(err =>{
      return res.status(500).send("Error a cargar la pagina");
    })
  } else {
    res.redirect('/login');
  }
 
});

//agregar categoria
router.post('/aggctg', function(req, res, next){
  const {nombre} = req.body;
  console.log(nombre);
  productosModel
  .insertarctg(nombre)
  .then(idCategoriaInsertado =>{
    res.redirect('/categorias');
  })
  .catch(err =>{
    console.error(err.message);
    return res.status(500).send("Error insertando producto");
  });
})

//agregar producto
router.post('/aggprd', function(req, res, next){
  const {nombre, precio, codigo, descripcion, marca, material, categoria_id} = req.body;
  productosModel
  .insertarprd(nombre, precio, codigo, descripcion, marca, material, categoria_id)
  .then(idProductoInsertado =>{
    res.redirect('/productos');
  })
  .catch(err =>{
    console.error(err.message);
    return res.status(500).send("Error insertando producto");
  })
});

//agregar imagenes
router.post('/aggimg', function(req, res, next){
  const {url, destacado, producto_id} = req.body;
  productosModel
  .insertarimg(url, destacado, producto_id)
  .then(idImagenInsertada=>{
    res.redirect('/imagenes');
  })
  .catch(err=>{
    console.error(err.message);
    return res.status(500).send('Error insertando imagen');
  })
});

//Get productos page edit
router.get('/prdedit/:id', function(req,res,next){
  if (req.session.isAdmin) {
    const id=req.params.id;
    productosModel
    .obtenerprdPorId(id)
    .then(productos=>{
      res.render('editprd', {productos: productos});
    })
    .catch(err=>{
      console.error(err.message);
      return res.status(500).send('Error buscando el producto')
    })
  } else {
    res.redirect('/login');
  }

});

//Get categorias page edit
router.get('/ctgedit/:id', function(req,res,next){
  if (req.session.isAdmin) {
    const id=req.params.id;
    productosModel
    .obtenerctgPorId(id)
    .then(categorias=>{
      res.render('editctg', {categorias: categorias});
    })
    .catch(err=>{
      console.error(err.message);
      return res.status(500).send('Error buscando la categoria')
    })
  } else {
    res.redirect('/login');
  }

});

//Get imagenes page edit
router.get('/imgedit/:id', function(req,res,next){
  if (req.session.isAdmin) {
    const id=req.params.id;
    productosModel
    .obtenerimgPorId(id)
    .then(imagenes=>{
      res.render('editimg', {imagenes: imagenes});
    })
    .catch(err=>{
      console.error(err.message);
      return res.status(500).send('Error buscando la imagen')
    })
  } else {
    res.redirect('/login');
  }
 
});

//Update productos page
router.post('/updateprd/:id', function(req, res, nexte){
  const id= req.params.id;
  const {nombre, precio, codigo, descripcion, marca, material} = req.body;
  productosModel
  .actualizarprd(nombre, precio, codigo, descripcion, marca, material, id)
  .then(()=>{
    res.redirect('/productos');
  })
  .catch(err =>{
    console.error(err.message);
    res.status(500).send('Error actualizando el producto');
  })
});

//Update categorias page
router.post ('/updatectg/:id', function(req, res, next){
  const id = req.params.id;
  const {nombre} = req.body;
  productosModel
  .actualizarctg(nombre, id)
  .then(()=>{
    res.redirect('/categorias');
  })
  .catch(err =>{
    console.error(err.message);
    res.status(500).send('Error actualizando la categoria');
  })
});

//Update imagenes page
router.post('/updateimg/:id', function(req, res, next){
  const id = req.params.id;
  const {url, destacado} = req.body;
  productosModel
  .actualzarimg(url, destacado, id)
  .then(()=>{
    res.redirect('/imagenes');
  })
  .catch(err =>{
    console.error(err.message);
    res.status(500).send('Error actualizando la imagen');
  })
});

//Get productos page delete
router.get('/prddelete/:id', function(req,res,next){
  if (req.session.isAdmin) {
    const id=req.params.id;
    productosModel
    .obtenerprdPorId(id)
    .then(productos=>{
      res.render('deleteprd', {productos: productos});
    })
    .catch(err=>{
      console.error(err.message);
      return res.status(500).send('Error buscando el producto')
    })
  } else {
    res.redirect('/login')
  }

});

//Get categorias page delete
router.get('/ctgdelete/:id', function(req,res,next){
  if (req.session.isAdmin) {
    const id=req.params.id;
    productosModel
    .obtenerctgPorId(id)
    .then(categorias=>{
      res.render('deletectg', {categorias: categorias});
    })
    .catch(err=>{
      console.error(err.message);
      return res.status(500).send('Error buscando la categoria')
    })
  } else {
    res.redirect('/login')
  }

});

//Get imagenes page delete
router.get('/imgdelete/:id', function(req,res,next){
  if (req.session.isAdmin) {
    const id=req.params.id;
    productosModel
    .obtenerimgPorId(id)
    .then(imagenes=>{
      res.render('deleteimg', {imagenes: imagenes});
    })
    .catch(err=>{
      console.error(err.message);
      return res.status(500).send('Error buscando la imagen')
    })
  } else {
    res.redirect('/login')
  }

});



//Vista tabla de compras
router.get('/tablacompras', function(req, res, next){
  if (req.session.isAdmin){
    productosModel
    .obtenerfacturas()
    .then(facturas=>{
      res.render('tablacompras', {facturas: facturas})
    })
    .catch(err=>{
      console.error(err.message);
      return res.status(500).send('Error cargando las facturas')
    })
  } else{
    res.redirect('/tablacompras')
  }
});

//Vista tabla de clientes
router.get('/tablaclientes', function(req, res, next){
  if (req.session.isAdmin){
    productosModel
    .obtenerclientes()
    .then(clientes=>{
      res.render('tablaclientes', {clientes: clientes})
    })
    .catch(err=>{
      console.error(err.message);
      return res.status(500).send('Error cargando los clientes')
    })
  } else{
    res.redirect('/home');
  }
});

//Cerrar sesion
router.get('/logout', function (req, res, next){
  req.session.destroy();
  res.redirect('/');
})

router.get('/*', function(req, res, next) {
  res.render('error', { title: 'Error 404'});
});

module.exports = router;