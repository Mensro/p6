const Sauce = require("../models/Sauce");
const fs = require("fs");

exports.getAllSauces = (req, res, next) => {
  Sauce.find()
    .then((sauces) => res.status(200).json(sauces))
    .catch((error) => res.status(400).json({ error }));
};

exports.getOneSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
    .then((sauce) => res.status(200).json(sauce))
    .catch((error) => res.status(404).json({ error }));
};

exports.createSauce = (req, res, next) => {
  const sauceObject = JSON.parse(req.body.sauce);
  if (sauceObject.userId !== req.userId) {
    return res.status(400).json({ error: new Error("invalid userId") });
  }
  const sauce = new Sauce({
    ...sauceObject,
    imageUrl: `${req.protocol}://${req.get("host")}/images/${
      req.file.filename
    }`,
  });
  sauce
    .save()
    .then(() => res.status(201).json({ message: "Objet enregistré !" }))
    .catch((error) => res.status(400).json({ error }));
};

exports.modifySauce = (req, res, next) => {
  const sauceObject = req.file
    ? {
        ...JSON.parse(req.body.sauce),
        imageUrl: `${req.protocol}://${req.get("host")}/images/${
          req.file.filename
        }`,
      }
    : { ...req.body };
  Sauce.updateOne(
    { _id: req.params.id },
    { ...sauceObject, _id: req.params.id }
  )
    .then(() => res.status(200).json({ message: "Objet modifié !" }))
    .catch((error) => res.status(400).json({ error }));
};

exports.deleteSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
    .then((sauce) => {
      const filename = sauce.imageUrl.split("/images/")[1];
      fs.unlink(`images/${filename}`, () => {
        Sauce.deleteOne({ _id: req.params.id })
          .then(() => res.status(200).json({ message: "Objet supprimé !" }))
          .catch((error) => res.status(400).json({ error }));
      });
    })
    .catch((error) => res.status(500).json({ error }));
};

exports.likeSauces = (req, res, next) => {
  const sauceId = req.params.id;
  const userId = req.body.userId;
  const like = req.body.like;

  Sauce.findOne({ _id: sauceId }).then((sauce) => {
    if (like === 1) {
      Sauce.updateOne(
        { _id: sauceId },
        { $inc: { likes: 1 }, $push: { usersLiked: userId } }
      )
        .then(() => res.status(200).json({ message: "like!" }))
        .catch((error) => res.status(400).json({ error }));
    }

    if (like === -1) {
      Sauce.updateOne(
        { _id: sauceId },
        { $inc: { dislikes: 1 }, $push: { usersDisliked: userId } }
      )
        .then(() => res.status(200).json({ message: "dislike!" }))
        .catch((error) => res.status(400).json({ error }));
    }
    if (like === 0) {
      const previouslyLiked = sauce.usersLiked.indexOf(userId) !== -1;
      const previouslyDisliked = sauce.usersDisliked.indexOf(userId) !== -1;

      if (previouslyLiked) {
        Sauce.updateOne(
          { _id: sauceId },
          {
            $inc: { likes: -1 },
            $pull: { usersLiked: userId },
          }
        )
          .then(() => res.status(200).json({ message: "undo Like!" }))
          .catch((error) => res.status(400).json({ error }));
      }
      if (previouslyDisliked) {
        Sauce.updateOne(
          { _id: sauceId },
          {
            $inc: { dislikes: -1 },
            $pull: { usersDisliked: userId },
          }
        )
          .then(() => res.status(200).json({ message: "undo disLike!" }))
          .catch((error) => res.status(400).json({ error }));
      }
    }
  });
};
