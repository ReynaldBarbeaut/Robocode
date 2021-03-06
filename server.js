var express = require('express');
var bodyParser = require('body-parser');

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var chat = require('./myChat');


/*Timothée Guy Reynald Barbeaut
*/


/*
 *  Structure de l'API du chat
 *  POST    /chat/:user                            -->     création de l'utilisateur :user
 *  PUT    /info/:idGame/:blueRobot/:redRobot/:tabFlag/:tabBoard -> envoit des informations de la partie
 *  DELETE  /chat/:user/:key                       -->     suppression d'un utilisateur
 *  GET     /chat/:user/:key/:since                -->     récupération des messages pour l'utilisateur :user depuis :since
 *  PUT     /tab/:idGame/:color/:tab                 -->     add the deck if the blue or red player to the game
 *  PUT     /join/:user/:key/:gameCreator/         -->     récupération des informations sur une partie créée par :gameCreator
 *  PUT     /invite/:user/:key/:to/:idGame         -->     création d'une game et invitation à un autre joueur
 *  PUT     /chat/:user/:key                       -->     post d'un message de l'utilisateur :user sur le forum général
 *  PUT     /chat/:user/:key/:to                   -->     post d'un message privé de l'utilisateur :user pour l'utilisateur :to
 */



/**
 *  Création d'un nouvel utilisateur
 *  Réponses possibles :
 *      utilisateur invalide        --> 401 + message
 *      utilisateur déjà utilisé    --> 409 + message
 *      utilisateur OK et ajouté    --> 200 + {user, key}
 */
app.post('/chat/:user', function(req, res) {
    var user = req.params.user;
    console.log("[server] Reçu POST /chat/" + user);
    var key = chat.createUser(user);
    switch (key) {
        case -1:    //  401 --> unauthorized
            res.status(403).end("Le nom d'utilisateur est invalide.");
            break;
        case -2:    //  409 --> conflict
            res.status(409).end("Le nom d'utilisateur existe déjà.");
            break;
        default:    //  200 --> OK
            res.status(200).json({user: user, key: key});
    }
});




/**
 *  Envoi d'informations pour une partie
 *  Réponses possibles :
 *      utilisateur invalide        --> 401 + message
 *      utilisateur déjà utilisé    --> 409 + message
 *      utilisateur OK et ajouté    --> 200 + {user, key}
 */
app.put('/info/:idGame/:blueRobot/:redRobot/:tabFlag/:tabBoard', function(req, res) {
    var user = req.params.user;
    var idGame = req.params.idGame;
    var blueRobot = req.params.blueRobot;
    var redRobot = req.params.redRobot;
    var tabFlag = req.params.tabFlag;
    var tabBoard = req.params.tabBoard;
    console.log("Envoit des informations de la partie au serveur.")
    var mess = chat.sendInit(idGame, blueRobot, redRobot, tabFlag, tabBoard);
    if (mess == null) {
        res.status(401).end("Partie inexistante");
    }
    else {
        res.status(200).json(mess);
    }
});




/**
 *  Suppression d'un utilisateur existant
 *  Pas de réponse. Opération silencieuse.
 */
app.delete('/chat/:user/:key', function(req, res) {
    var user = req.params.user;
    var key = req.params.key;
    console.log("[server] Reçu DELETE /chat/" + user + "/" + key);
    chat.deleteUser(user, key);
    res.status(200).end();
});


/**
 *  Récupération d'un message (voir fichier myChat.js pour le format des messages)
 *  Réponses :
 *      utilisateur incorrect   --> 401 + message
 *      succès                  --> 200 + objet { general: [...], user: [...], users: [...] }
 */
app.get('/chat/:user/:key/:since', function(req, res) {
    var user = req.params.user;
    var key = req.params.key;
    var since = req.params.since;
    // console.log("Reçu demande de " + user + "(key : " + key + ") depuis " + since);
    var mess = chat.getMessages(user, key, since);
    if (mess == null) {
        res.status(401).end("Utilisateur incorrect");
    }
    else {
        res.status(200).json(mess);
    }
});


/**
 *  Récupération d'un message (voir fichier myChat.js pour le format des messages)
 *  Réponses :
 *      utilisateur incorrect   --> 401 + message
 *      succès                  --> 200 + objet { general: [...], user: [...], users: [...] }
 */
app.get('/game/:user/:key/:idGame', function(req, res) {
    var user = req.params.user;
    var key = req.params.key;
    var idGame = req.params.idGame;
    // console.log("Reçu demande de " + user + "(key : " + key + ") depuis " + since);
    console.log(idGame);
    var game = chat.getGameInformation(user, key, idGame);
    if (game == null) {
        res.status(401).end("Utilisateur incorrect");
    }
    else {
        res.status(200).json(game);
    }
});


/**
 *  Récupération d'un message (voir fichier myChat.js pour le format des messages)
 *  Réponses :
 *      utilisateur incorrect   --> 401 + message
 *      succès                  --> 200 + objet { general: [...], user: [...], users: [...] }
 */
app.put('/join/:user/:key/:gameCreator', function(req, res) {
    var user = req.params.user;
    var key = req.params.key;
    var to = req.params.gameCreator;
    var mess = req.body.message;
    console.log("Reçu acceptation de "+user+" pour la partie de "+to+" Message: "+mess);
    var p = chat.joinGame(user, key, to);
    var r = chat.postMessage(user, key, to, mess);
    if (p == null || r == null) {
        res.status(401).end("Utilisateur incorrect");
    }
    else {
        res.status(200).json(p);
    }
});


 /**
  *  Ajout d'un deck d'un des joueurs à la partie
  *  Réponses :
  *      partie inexistante      --> 401 + message
  *      succès                  --> 200 + objet { general: [...], user: [...], users: [...] }
  */
 app.put('/tab/:idGame/:color/:tab', function(req, res) {
     var id = req.params.idGame;
     var color = req.params.color;
     var deck = req.params.tab;
     console.log("Reçu deck du joueur "+color+" pour la partie "+id+" Deck: "+deck);
     var p = chat.addDeck(id, color, deck);
     if (p == null) {
         res.status(401).end("Utilisateur incorrect");
     }
     else {
         res.status(200).json(p);
     }
 });

/**
 *  Envoi d'un message à destination d'un utilisateur
 *  Réponses :
 *      utilisateur incorrect   --> 401 + message
 *      succès                  --> 200
 */
app.put('/chat/:from/:key/:to', function(req, res) {
    var from = req.params.from;
    var key = req.params.key;
    var to = req.params.to;
    var mess = req.body.message;
    console.log("Reçu message de " + from + "(key : " + key + ") pour " + to + " : " + mess);
    var r = chat.postMessage(from, key, to, mess);
    if (r == 0) {
        res.status(200).end();
    }
    else {
        res.status(401).end("Utilisateur incorrect");
    }
});

/**
 *  Envoi d'une invitation à un utilisateur + création d'une partie
 *  Réponses :
 *      utilisateur incorrect   --> 401 + message
 *      succès                  --> 200
 */
app.put('/invite/:user/:key/:to/:idGame', function(req, res) {
    var from = req.params.user;
    var key = req.params.key;
    var to = req.params.to;
    var id = req.params.idGame;
    var mess = req.body.message;
    console.log("[server] Reçu création de partie de " + from + " id de la partie:" + id + " Invitation à : " +to+ "Message: "+mess);
    var p = chat.createGame(from, id, to);
    var r = chat.postMessage(from, key, to, mess);
    if (r == 0 || p == 0) {
        res.status(200).end();
    }
    else {
        res.status(401).end("Utilisateur incorrect");
    }
});




/**
 *  Création d'un message à destination de tous
 *  Réponses :
 *      utilisateur incorrect   --> 401 + message
 *      succès                  --> 200
 */
app.put('/chat/:from/:key', function(req, res) {
    var from = req.params.from;
    var key = req.params.key;
    var mess = req.body.message;
    console.log("Reçu message de " + from + "(key : " + key + ") : " + mess);
    var r = chat.postMessage(from, key, null, mess);
    if (r == 0) {
        res.status(200).end();
    }
    else {
        res.status(401).end("Utilisateur incorrect");
    }
});




// redirection automatique vers le répertoire "public" pour les autres requêtes
app.use(express.static('public'));

// démarrage du serveur sur le port 8080
app.listen(8080);

console.log("C'est parti ! En attente de connexion...");
