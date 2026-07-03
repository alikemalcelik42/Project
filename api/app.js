var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

if (process.env.NODE_ENV !== 'production')
  require('dotenv').config();

const Response = require('./lib/Response');
const CustomError = require('./lib/Error');
const { HTTP_CODES } = require('./config/Enum');

var indexRouter = require('./routes/index');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(new CustomError(HTTP_CODES.NOT_FOUND, "Not Found", "The requested resource was not found"));
});

// error handler — API olduğumuz için her zaman projenin standart JSON formatını dönüyoruz
app.use(function(err, req, res, next) {
  let errorResponse = Response.errorResponse(err);
  res.status(errorResponse.code || 500).json(errorResponse);
});

module.exports = app;