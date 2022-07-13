var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

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

// Use mongoose
let mongoose = require('mongoose')
let mongoDB = 'mongodb+srv://vikms:ustdedt8@cluster0.fsmwlf3.mongodb.net/local_library?retryWrites=true&w=majority'

mongoose.connect(mongoDB, {useNewUrlParser: true, useUnifiedTopology: true})
let db = mongoose.connection

db.on('error', console.error.bind(console, 'MongoDB connection error: '))

let Schema = mongoose.Schema

let SomeModelSchema = new Schema({
  a_string: String,
  a_date: Date
})

let SomeModel = mongoose.model('SomeModel', SomeModelSchema)

module.exports = app;
