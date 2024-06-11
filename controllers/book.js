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
            (book) => {
                res.status(200).json(book);
            }
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
                if(req.file){
                    //si on avait un file dans la requete, on recupère l'url de l'image stocké dans la BD et on la supprime
                    const filename = book.imageUrl.split('/images/')[1];
                    fs.unlink(`images/${filename}`,
                        (err => {
                            if(err){
                                console.log("erreur lors de la suppression de l'image précedente :", err);
                            }else{
                                console.log("l'image précedente a bien été supprimé");
                            }
                        })
                    )
                }
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
                    book.averageRating = avg.toFixed(1);
                    book.save()
                        .then(() => res.status(200).json(book))
                        .catch(error => res.status(500).json({error}));
                }
            }
        )
        .catch(error => res.status(404).json({error}));
};