<?php

// Messages returned by the device API (/api/v1). Always French: the apps show them to the user as-is.
return [
    'invalid_credentials' => 'Identifiant ou code PIN incorrect.',
    'validation_failed' => 'Les informations saisies sont invalides.',
    'unauthenticated' => 'Session expirée. Reconnectez-vous.',
    'forbidden' => "Vous n'avez pas accès à cette action.",
    'not_found' => 'Élément introuvable.',
    'too_many_requests' => 'Trop de tentatives. Réessayez dans :seconds s.',
    'invalid_cursor' => 'Synchronisation à reprendre depuis le début.',
    'username_required' => 'Saisissez votre identifiant.',
    'pin_required' => 'Saisissez votre code PIN.',
    'pin_format' => 'Le code PIN doit contenir de 4 à 8 chiffres.',
    'device_name_required' => "Le nom de l'appareil est requis.",
];
