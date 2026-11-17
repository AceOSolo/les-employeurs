<?php
/* Copier ce fichier en config.php (même dossier) et le remplir.
   config.php contient le mot de passe de la base : il ne doit JAMAIS
   être ajouté au dépôt Git (il est listé dans .gitignore). */
return [
    // Base MySQL OVH (espace client › Hébergement › Bases de données)
    'db_dsn'      => 'mysql:host=XXXXX.mysql.db;dbname=XXXXX;charset=utf8mb4',
    'db_user'     => 'XXXXX',
    'db_password' => 'XXXXX',

    // Adresse du site (pour le lien « mot de passe oublié »)
    'site_url' => 'https://les-employeurs.fr',

    // Sites autorisés à appeler l'API (CORS)
    'allowed_origins' => ['https://les-employeurs.fr', 'https://www.les-employeurs.fr'],

    // Expéditeur des emails : une adresse du domaine hébergé chez OVH
    'mail_from'     => 'ne-pas-repondre@les-employeurs.fr',
    'mail_reply_to' => 'jean-philippe.barret@logistem.fr',
];
