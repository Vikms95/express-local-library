var BookInstance = require('../models/bookinstance');
var Book = require('../models/book')
const{body, validationResult} = require('express-validator');
const book = require('../models/book');
const async = require('async')

// Display list of all BookInstances.
exports.bookinstance_list = function(req, res, next) {
    BookInstance.find()
      .populate('book')
      .exec(function(err, list_bookinstances){
        if(err) return next(err)
        res.render('bookinstance_list', {title: 'Book Instance List', bookinstance_list: list_bookinstances})
      })
};

// Display detail page for a specific BookInstance.
    // Display detail page for a specific BookInstance.
exports.bookinstance_detail = function(req, res, next) {

  BookInstance.findById(req.params.id)
  .populate('book')
  .exec(function (err, bookinstance) {
    if (err) { return next(err); }
    if (bookinstance==null) { // No results.
        var err = new Error('Book copy not found');
        err.status = 404;
        return next(err);
      }
    // Successful, so render.
    res.render('bookinstance_detail', { title: 'Copy: ' + bookinstance.book.title, bookinstance:  bookinstance});
  })

};


// Display BookInstance create form on GET.
exports.bookinstance_create_get = function(req, res, next) {
    Book.find({}, 'title')
    .exec(function(err, books) {
      if(err) return next(err)
      res.render('bookinstance_form', {title:'Create BookInstance', book_list: books})
    })
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
  body('book', 'Book must be specified').trim().isLength({ min: 1 }).escape(),
  body('imprint', 'Imprint must be specified').trim().isLength({ min: 1 }).escape(),
  body('status').escape(),
  body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601().toDate(),

  (req, res, next) => {
    const errors = validationResult(req)
    var bookinstance = new BookInstance(
      {
        book:req.body.book,
        imprint: req.body.imprint,
        status: req.body.status,
        due_back: req.body.due_back
      }
    )

    if(!errors.isEmpty()){
      Book
        .find({}, 'title')
        .exec(function(err, books) {
          if(err) return next(err)
          res.render('bookinstance_form',
            {
              title: 'Create BookInstance',
              book_list: book,
              selected_book: bookinstance.book_id,
              errors: errors.array(),
              bookinstance:bookinstance
            })
        })
        return

    }else{
      bookinstance.save(function(err) {
        if(err) return next(err)
        res.redirect(bookinstance.url)
      })
    }
  }
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = function(req, res, next) {
  BookInstance
    .findById(req.params.id)
    .populate('book')
    .exec(function(err, bookinstance) {
      if(err) return next(err)
      res.render('bookinstance_delete', {title: 'BookInstance delete', bookinstance: bookinstance})
    })
  };
  
  // Handle BookInstance delete on POST.
  exports.bookinstance_delete_post = function(req, res, next) {
    // We do not need to retrieve any info because it does not rely on anything
    BookInstance
    .findByIdAndDelete(req.params.id, function(err){
      if(err) return next(err)
    })
    res.redirect('/catalog/bookinstances')
  };
  
  // Display BookInstance update form on GET.
  exports.bookinstance_update_get = function(req, res, next) {
    
    async.parallel({
      books: function(callback){
        Book.find({}, 'title')
            .exec(callback)
      },

      bookinstance: function(callback){
        BookInstance
        .findById(req.params.id)
        .populate('book')
        .exec(callback)
      }
    }, function(err, results){
      if(err) return next(err)
      res.render('bookinstance_form', {title: 'Update instance', bookinstance: results.bookinstance, book_list: results.books})
    })
};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
  body('book', 'Book must be specified').trim().isLength({ min: 1 }).escape(),
  body('imprint', 'Imprint must be specified').trim().isLength({ min: 4 }).escape(),
  body('status').escape(),
  body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601().toDate(),

  (req,res,next) =>{
    const errors = validationResult(req)
    // Create new bookinstance object with the values of req.body.*
    let bookinstance = new BookInstance({
      book: req.body.book,
      imprint:req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back_yyyy_mm_dd,
      _id: req.params.id
    })
    // If errors is not empty, rerender the form with the errors noted below
    if(!errors.isEmpty()){
      console.log('before async');
      
      async.parallel({
        books: function(callback){
          Book.find({}, 'title')
              .exec(callback)
        },
  
        bookinstance: function(callback){
          BookInstance
          .findById(req.params.id)
          .populate('book')
          .exec(callback)
        }
        }, function(err, results){
          console.log('inside  callback');
          if(err) return next(err)
            res.render('bookinstance_form', {title: 'Update instance', bookinstance: results.bookinstance, book_list: results.books, errors: errors.array()})
            }
      )
    }else{
      BookInstance
        .findByIdAndUpdate(req.params.id, bookinstance, {}, function(err, bookinstance){
          if(err) return next(err)
          res.redirect(bookinstance.url)
        })
    }
  }


]
    
