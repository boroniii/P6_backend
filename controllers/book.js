const { error } = require('console');
const Book = require('../models/book');
const fs = require('fs');


exports.getBooks = (req, res, next) => {
    Book.find()
        .then(
            (books) => {
                res.status(200).json(books);
            }
        )
        .catch(
            (error) => {
                res.status(400).json({
                    error: error
                });
            }
        );
};

exports.getOneBook = (req, res, next) => {
    Book.findOne({
        _id: req.params.id
        })
        .then(
            (book) => {
                res.status(200).json(book);
            }
        )
        .catch(
            (error) => {
                res.status(404).json({
                    error: error
                });
            }
        );
};

exports.getBestrating = (req, res, next) => {
    Book.find()
        .sort({averageRating: -1})
        .limit(3)
        .then(
            res.status(200).json
        )
        .catch(
            (error) => {
                res.status(500).json({error});
            }
        );
};

exports.createBook = (req, res, next) => {
    const bookObject = JSON.parse(req.body.book);
    delete bookObject._id;
    delete bookObject._userId;

    const book = new Book({
        ...bookObject,
        userId: req.auth.userId,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    });

    book.save()
        .then(()=>{res.status(201).json({message: 'Livre enregisté !'})})
        .catch(error => {res.status(400).json({error})});
};

exports.modifyBook = (req, res, next) => {
    const bookObject = req.file ? {
        ...JSON.parse(req.body.book),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : {
        ...req.body
    };

    delete bookObject._userId;
    Book.findOne({_id: req.params.id})
        .then(book => {
            if(book.userId != req.auth.userId) {
                res.status(401).json({message: 'Non-autorisé'});
            } else {
                Book.updateOne({ _id: req.params.id}, {...bookObject, _id: req.params.id})
                    .then(() => res.status(200).json({message: 'Livre modifié !'}))
                    .catch(error => res.status(401).json({error}));

            }
        })
        .catch(error => {
            res.status(400).json({error});
        });
};

exports.deleteBook = (req, res, next) => {
    Book.findOne({_id: req.params.id})
        .then(book => {
            if(book.userId != req.auth.userId){
                res.status(401).json({message: 'non autorisé !'});
            } else {
                const filename = book.imageUrl.split('/images/')[1];
                fs.unlink(`images/${filename}`, () => {
                    Book.deleteOne({_id: req.params.id})
                        .then(() => {res.status(200).json({message: 'Livre supprimé !'})})
                        .catch(error => res.status(400).json({error}));
                })
            }
        })
        .catch(error => {
            res.status(500).json({error})
        });
};

exports.rateBook = (req, res, next) => {
    // POST 
    // /api/books/:id/rating 
    // Requis { userId: String,
    //          rating: Number }
    //     Single book Définit la note pour le user ID fourni.
    //     La note doit être comprise entre 0 et 5.
    //     L'ID de l'utilisateur et la note doivent être ajoutés au
    //     tableau "rating" afin de ne pas laisser un utilisateur
    //     noter deux fois le même livre.
    //     Il n’est pas possible de modifier une note.
    //     La note moyenne "averageRating" doit être tenue à
    //     jour, et le livre renvoyé en réponse de la requête.
   
    Book.findOne({_id: req.params.id})
        .then(
            book => {
                if(book.ratings.includes(req.auth.userId)){
                    res.status(403).json({message: 'Vous avez deja noté ce livre'});
                }else{
                    book.ratings.push(
                        {
                            userId: req.auth.userId,
                            grade: req.body.rating
                        }
                    );
                    let sum = 0;
                    book.ratings.forEach(
                        element => {
                            sum += element.grade;
                    });
                    let avg = sum / book.ratings.length;
                    book.averageRating = avg;
                    book.save()
                        .then(() => res.status(200).json(book))
                        .catch(error => res.status(500).json({error}));
                }
            }
        )
        .catch(error => res.status(404).json({error}));
};

// Book.findOne({_id: req.params.id})
//         .then(book =>
//             {
//                 if(book.ratings.includes(req.auth.userId)){
//                     res.status(403).json({message: 'Vous avez deja noté ce livre'});
//                 }else{
//                     Book.updateOne(
//                             {_id: req.params.id},
//                             [
//                                 {$push:
//                                     {
//                                         ratings:
//                                         {
//                                             userId: req.auth.userId,
//                                             grade: req.body.rating
//                                         }
//                                     }
//                                 }
//                                 ,
//                                 {$set:
//                                     {
//                                         averageRating: {$avg: ratings.grade}
//                                     }
//                                 }
//                             ]
//                         )
//                         .then(() =>
//                             {
//                             Book.findOne({_id: req.params.id})
//                                 .then(book => res.status(200).json(book))
//                                 .catch(error => res.status(500).json({error}));
//                             }
//                         )
//                         .catch(error => res.status(500).json({error}));
//                 }
//             }
//         )
//         .catch(error => res.status(400).json({error}));
// }