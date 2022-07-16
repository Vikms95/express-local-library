var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var compression = require('compression')
var helmet = require('helmet')

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var catalogRouter = require('./routes/catalog')

var app = express();

// Use mongoose
let mongoose = require('mongoose')
let newURI = 'mongodb+srv://vikms:ustdedt8@cluster0.fsmwlf3.mongodb.net/local_library?retryWrites=true&w=majority'
let oldURI = 'mongodb://vikms:ustdedt8@ac-q9epukt-shard-00-00.fsmwlf3.mongodb.net:27017,ac-q9epukt-shard-00-01.fsmwlf3.mongodb.net:27017,ac-q9epukt-shard-00-02.fsmwlf3.mongodb.net:27017/local_library?ssl=true&replicaSet=atlas-xoq9uz-shard-0&authSource=admin&retryWrites=true&w=majority'

mongoose.connect(
  process.env.MONGODB_URI || oldURI,
  { useNewUrlParser: true, useUnifiedTopology: true },
  function (err, res) {
      try {
          console.log('Connected to Database');
      } catch (err) {
          throw err;
      }
  });
  
let db = mongoose.connection

db.on('error', console.error.bind(console, 'MongoDB connection error: '))

let Schema = mongoose.Schema

let SomeModelSchema = new Schema({
  a_string: String,
  a_date: Date
})

let SomeModel = mongoose.model('SomeModel', SomeModelSchema)

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(helmet())
app.use(compression())
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/catalog', catalogRouter)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
