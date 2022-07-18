var Book = require('../models/book');
var Author = require('../models/author');
var Genre = require('../models/genre');
var BookInstance = require('../models/bookinstance');

const { body, validationResult} = require('express-validator')
var async = require('async');

exports.index = function(req, res) {

    async.parallel({
        book_count: function(callback) {
            Book.countDocuments({}, callback); // Pass an empty object as match condition to find all documents of this collection
        },
        book_instance_count: function(callback) {
            BookInstance.countDocuments({}, callback);
        },
        book_instance_available_count: function(callback) {
            BookInstance.countDocuments({status:'Available'}, callback);
        },
        author_count: function(callback) {
            Author.countDocuments({}, callback);
        },
        genre_count: function(callback) {
            Genre.countDocuments({}, callback);
        }
    }, function(err, results) {
        res.render('index', { title: 'Local Library Home', error: err, data: results });
    });
};



// Display list of all books.
exports.book_list = function(req, res, next) {
  Book.find({}, 'title author')
    .sort({title: 1})
    .populate('author')
    .exec(function (err, list_books){
      if(err){ return next(err)}
      res.render('book_list', {title: 'Book List', book_list: list_books})
    })
};

// Display detail page for a specific book.
exports.book_detail = function(req, res, next) {

  async.parallel({
      book: function(callback) {

          Book.findById(req.params.id)
            .populate('author')
            .populate('genre')
            .exec(callback);
      },
      book_instance: function(callback) {

        BookInstance.find({ 'book': req.params.id })
        .exec(callback);
      },
  }, function(err, results) {
      if (err) { return next(err); }
      if (results.book==null) { // No results.
          var err = new Error('Book not found');
          err.status = 404;
          return next(err);
      }
      // Successful, so render.
      res.render('book_detail', { title: results.book.title, book: results.book, book_instances: results.book_instance } );
  });

};



// Display book create form on GET.
exports.book_create_get = function(req, res, next) {
    // Get all authors and genres and pass them over the book_form template
    async.parallel({
      authors: function(callback){
        Author.find(callback)
      },
      genres: function(callback){
        Genre.find(callback)
      }, 
    },
    function(err, results){
      if(err) return next(err)
      res.render('book_form', {title: 'Create Book', authors: results.authors, genres: results.genres})
    })
};

// Handle book create on POST.
exports.book_create_post = [
    (req, res, next) => {
      if(!(Array.isArray(req.body.genre))){
        if(typeof req.body.genre === 'undefined'){
          req.body.genre = []
        }
        else{
          req.body.genre = [req.body.genre]
        }
      }
      next()
    },

    body('title', 'Title must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('author', 'Author must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('summary', 'Summary must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('isbn', 'ISBN must not be empty').trim().isLength({ min: 1 }).escape(),
    body('genre.*').escape(),

    (req,res,next) => {
      const errors = validationResult(req)
      var book = new Book(
        {
          title: req.body.title,
          author: req.body.author,
          summary: req.body.summary,
          isbn: req.body.isbn,
          genre: req.body.genre
        })

        if(!errors.isEmpty){

          async.parallel({
            authors: function(callback){
              Author.find(callback)
            },
            genres: function(callback) {
              Genre.find(callback)
            },
          }, function(err, results){
            if(err) return next(err)
            for(let i = 0; i < results.genre.length; i++){
              if(book.genre.indexOf(results.genres[i]._id) > -1){
                results.genres[i].checked='true'
              }
            }
            res.render('book_form', {title: 'Create Book', authors: results.authors, genres: results.genres, book:book, errors:errors.array()})
          })
          return
        }else{
          book.save(function(err) {
            if(err) return next(err)
            res.redirect(book.url)
          })
        }
    }
];

// Display book delete form on GET.
exports.book_delete_get = function(req, res, next) {
  // Get all the data to check if the book has any dependant info
  // 1. Get the book itself from the database
  // 2. Get all the instances from the book
  async.parallel({
    // Find the book in the database by querying its id from the url params
    book: function(callback){
      Book.findById(req.params.id).exec(callback)
    },
    // Find all the book instances from the book 
    // by querying its "book" property from the BookInstance Schema which stores the book it belongs to
    bookinstances: function(callback){
      BookInstance.find({'book': req.params.id}).exec(callback)
    }
  }, 
  // Async executes a callback right after the data is found, so we declare it
  // with its 'first error param' and the results from the query
  function(err, results){
    if(err) return next(err)
    if(results.book==null){
      res.redirect('/catalog/books')
    }
    res.render('book_delete', {title: 'Delete book', book: results.book, bookinstances_list:results.bookinstances})
  }
  )
};

// Handle book delete on POST.
exports.book_delete_post = function(req, res) {
  // If the book has pending bookinstances, do not delete the book and return to the books GET route and show to delete the pending instances
  // If the book has no pending bookinstances, delete the book and return to the books GET route
  async.parallel({
    book: function(callback){
      Book.findById(req.params.id).exec(callback)
    },
    bookinstances: function(callback){
      BookInstance.find({'book': req.params.id}).exec(callback)
    }
  }, function(err, results){
    if(err) return next(err)
    if(results.bookinstances.length > 0){
      res.render('book_delete', {title: 'Delete book', book: results.book, bookinstances_list:results.bookinstances})
    }else{
      Book.findByIdAndRemove(req.body.bookid, function(err){
        if(err) return next(err)
        res.redirect('/catalog/books')
      })
    }
  })// callback here  
  
};

// Display book update form on GET.
exports.book_update_get = function(req, res, next) {
  // Get book, authors and genres for form.
  async.parallel({
      book: function(callback) {
          Book.findById(req.params.id).populate('author').populate('genre').exec(callback);
      },
      authors: function(callback) {
          Author.find(callback);
      },
      genres: function(callback) {
          Genre.find(callback);
      },
      }, function(err, results) {
          if (err) { return next(err); }
          if (results.book==null) { // No results.
              var err = new Error('Book not found');
              err.status = 404;
              return next(err);
          }
          // Success.
          // Mark our selected genres as checked.
          for (var all_g_iter = 0; all_g_iter < results.genres.length; all_g_iter++) {
              for (var book_g_iter = 0; book_g_iter < results.book.genre.length; book_g_iter++) {
                  if (results.genres[all_g_iter]._id.toString()===results.book.genre[book_g_iter]._id.toString()) {
                      results.genres[all_g_iter].checked='true';
                  }
              }
          }
          res.render('book_form', { title: 'Update Book', authors: results.authors, genres: results.genres, book: results.book });
      });

};


// Handle book update on POST.
exports.book_update_post = [
  (req, res ,next) => {
    if(!(Array.isArray(req.body.genre))) {
      if(typeof req.body.genre ==='undefined')
        req.body.genre = []
      else
        req.body.genre= [req.body.genre]
    }
    next()
  },

  body('title', 'Title must not be empty.').trim().isLength({ min: 1 }).escape(),
  body('author', 'Author must not be empty.').trim().isLength({ min: 1 }).escape(),
  body('summary', 'Summary must not be empty.').trim().isLength({ min: 1 }).escape(),
  body('isbn', 'ISBN must not be empty').trim().isLength({ min: 1 }).escape(),
  body('genre.*').escape(),

  (req, res, next) => {
    const errors = validationResult(req)
    var book = new Book(
      {
        title: req.body.title,
        author: req.body.author,
        summary: req.body.summary,
        isbn: req.body.isbn,
        genre: (typeof req.body.genre==='undefined' ? [] : req.body.genre),
        _id: req.params.id
      }
    )

    if(!errors.isEmpty()){
      async.parallel({
        authors: function(callback) {
          Author.find(callback)
        },
        genres: function(callback){
          Genre.find(callback)
        },
      }, function(err, results) {
            if(err) return next(err)
            for(let i = 0; i < results.genres.length; i++){
              if(book.genre.indexOf(results.genres[i]._id) > -1) {
                results.genres[i].checked = 'true'
              }
            }
              res.render('book_form', {title: 'Update book', authors: results.authors, genres: results.genres, book: book, errors: errors.array()})
        }
      )
      return
    }else{
      Book.findByIdAndUpdate(req.params.id, book, {}, function(err, thebook) {
        if(err) return next(err)
        res.redirect(thebook.url)
      })
    }
  }
]
  
