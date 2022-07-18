var Genre = require('../models/genre');
var Book = require('../models/book')
var async = require('async')
const {body, validationResult} = require('express-validator')

// Display list of all Genre.
exports.genre_list = function(req, res) {
    Genre.find()
      .sort([['name','ascending']])
      .exec(function(err, list_genres){
        if(err) return next(err)
        res.render('genre_list', {title:'Genre list', genre_list: list_genres})
      })
};

// Display detail page for a specific Genre.
// Display detail page for a specific Genre.
exports.genre_detail = function(req, res, next) {

  async.parallel({
      genre: function(callback) {
          Genre.findById(req.params.id)
            .exec(callback);
      },

      genre_books: function(callback) {
          Book.find({ 'genre': req.params.id })
            .exec(callback);
      },

  }, function(err, results) {
      if (err) { return next(err); }
      if (results.genre==null) { // No results.
          var err = new Error('Genre not found');
          err.status = 404;
          return next(err);
      }
      // Successful, so render
      res.render('genre_detail', { title: 'Genre Detail', genre: results.genre, genre_books: results.genre_books } );
  });

};


// Display Genre create form on GET.
exports.genre_create_get = function(req, res) {
    // Renders genre_form template view and passes *title as a variable
    res.render('genre_form', {title: 'Create genre'})
};

// Handle Genre create on POST.
exports.genre_create_post = [
  // Validate and sanitize the 'name' field within the form
    body('name', 'Genre name required').trim().isLength({min: 1}).escape(),
    (req, res, next) => {

      // Get any errors from the body method that will
      // be triggered if the daisy-chained validator methods are not met
      // ** In this case, it will trigger if the length of the input
      // ** is lower than 1 
      const errors = validationResult(req)
      var genre = new Genre(
        {name: req.body.name}
      )
      // Check if there are errors and re-render the form with the values
      // again in case there were
      if(!errors.isEmpty()) {
        res.render('genre_form', {title: 'Create Genre', genre: genre, errors: errors.array()})
      }else{
        Genre.findOne({ 'name': req.body.name})
          .exec( function( err, found_genre) {
            if(err) return next(err)
            // Genre already exists, so redirect to its details page
            if(found_genre) {
              res.redirect(found_genre.url)
            // Genre does not exists, so create and redirect to its details page 
            }else{
              genre.save(function(err) {
                if(err) return next(err)
                res.redirect(genre.url)
              })
            }
          })
      }
    }
];

// Display Genre delete form on GET.
exports.genre_delete_get = function(req, res, next) {
  // Find all the books and the genres
    async.parallel({
      genre: function(callback){
        Genre.findById(req.params.id).exec(callback)
      },
      genre_books: function(callback) {
        Book.find({'genre': req.params.id}).exec(callback)
      }
}, function(err, results){
  if(err) return next(err)
  res.render('genre_delete', {title: 'Delete Genre', genre: results.genre, genre_books: results.genre_books})
}) 
// If genre has books associated, render them on the page and do not show the delete button
// Otherwise, show the delete button
};

// Handle Genre delete on POST.
exports.genre_delete_post = function(req, res, next) {
  async.parallel({
    genre: function(callback){
      Genre.findById(req.params.id).exec(callback)
    },
    genre_books: function(callback) {
      Book.find({'genre': req.params.id}).exec(callback)
    }
  }, function(err, results){
    if(err) return next(err)
    if(results.genre_books.length > 0){
      res.render('genre_delete', {title: 'Delete Genre', genre: results.genre, genre_books: results.genre_books})
    }else{
      Genre.findByIdAndRemove(req.body.genreid, function(err){
        if(err) return next(err)
        res.redirect('/catalog/genres')
      })
    }
  }
  )
};

// Display Genre update form on GET.
exports.genre_update_get = function(req, res) {
    res.send('NOT IMPLEMENTED: Genre update GET');
};

// Handle Genre update on POST.
exports.genre_update_post = function(req, res) {
    res.send('NOT IMPLEMENTED: Genre update POST');
};
