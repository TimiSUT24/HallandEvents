function normalizeCategories(rawCategory, source){
    const maps = {
        vbg: {
            'Julmusik': ['Jul'],
            'Teater och humor': ['Teater'], 
            'Djur och natur': ['Natur'],
            'Jul': ['Jul'],
            'Kultur, konst och utställningar': ['Konst'],
            'Festival och mässa': ['Nöje'],
            'Loppis och marknader': ['Marknad'],
            'Mat och dryck': ['Mat'],
            'Världsarvet Grimeton': ['Historia'],
            'Guidade visningar': ['Guidad tur'],
            'Barn och familj': ['Barn'],
            'Föreläsning': ['Föreläsning'],
            'Musik och shower': ['Musik'],
            'Parkmusiken': ['Musik'],
            'Sport och motion': ['Sport'],
            'Sommarlov': ['Lov'],
            'Wallstreet konstfestival': ['Konst']
        },
        hstd:{
            'Konst och utställning': ['Konst', 'Utställning'],
            'Skapa och pyssla': ['Barn', 'Spel'],
            'Kultur och historia': ['Historia'],
            'Digitalt och teknik': ['Spel'],
            'Festival och mässa': ['Nöje'],
            'Mat och dryck': ['Mat', 'Restaurang'],
            'Trädgård, mode och inredning': ['Utomhus'],
            'Paket': ['Nöje'],
            'Guidade turer och föreläsningar': ['Guidad tur', 'Föreläsning'],
            'Barn och familj': ['Barn'],
            'Litteratur och film': ['Föreläsning', 'Bio'],
            'Marknad och loppis': ['Marknad'],
            'Musik och konsert': ['Musik'],
            'Natur, friluftsliv och cykel': ['Natur', 'Utomhus'],
            'Spela spel och umgås': ['Spel'],
            'Skollov': ['Lov'],
            'Jul och högtider': ['Jul'],
            'Show och gala': ['Nöje'],
            'Sport och hälsa': ['Sport'],
            'Humor och standup': ['Humor'],
            'Teater och dans': ['Teater', 'Dans'],
            'Workshops och prova på': ['Föreläsning', 'Tävling']
        },
        fbg: {
            'Musik': ['Musik'],
            'Nöje': ['Nöje'],
            'Centrum': ['Centrum'],
            'Barn': ['Barn'],
            'Gratis': ['Gratis'],
            'Utomhus': ['Utomhus'],
            'Teater': ['Teater'],
            'Påsklov': ['Lov'],
            'Sportlov': ['Lov'],
            'Skollov': ['Lov'],
            'Humor': ['Humor'],
            'Mat': ['Mat'],
            'Restaurang': ['Restaurang'],
            'Sport': ['Sport'],
            'Tävling': ['Tävling'],
            'Konst': ['Konst'],
            'Natur': ['Natur'],
            'Ungdom': ['Ungdom'],
            'Marknad': ['Marknad'],
            'Utställning': ['Utställning'],
            'Dans': ['Dans'],
            'Föreläsning': ['Föreläsning'],
            'Guidad tur': ['Guidad tur'],
            'Historia': ['Historia'],
        }
    };
    const sourceMap = maps[source];
    if(!sourceMap) return [rawCategory];
    return sourceMap[rawCategory] || [rawCategory];
}

module.exports = {normalizeCategories};