# tw-market-scanner

## Instalace

Vytvořit v prohlížeči novou oblíbenou stránku (klasický bookmark) a jako adresu vložit:

```sh
javascript:(function(){document.body.appendChild(document.createElement('script')).src='https://deprivant.github.io/tw-market-scanner/dist/tw-market-scanner.min.js';})();
```

## Ovládaní

Po nainstalování skriptu se objeví v pravém menu nová ikonka:

![The West Market Scanner Menu Icon](https://github.com/Deprivant/tw-market-scanner/blob/main/docs/twms-menu-image.png?raw=true)

V případě vypnutí skriptu (v nastavení) ikonka zešedne:

![The West Market Scanner Menu Icon Stop Scanning](https://github.com/Deprivant/tw-market-scanner/blob/main/docs/twms-menu-off-image.png?raw=true)

### Nastavení

Klikem na ikonku se zobrazí nastavení. Zde je možné nastavit až 10 předmětů k vyhledávání, podle názvu ( `med` najde med, ale i např. lis na med) a maximální částky za jeden kus (neplést s celkovou částkou nabídky na trhu).

V případě potřeby lze pravidelné skenování v nastavení vypnout. Lze také vypnout/zapnout zvukové upozornění. Pokud skript nalezne požadované předměty, při zobrazení výsledků krátce zapípá.

![The West Market Scanner Menu Icon](https://github.com/Deprivant/tw-market-scanner/blob/main/docs/twms-setting-image.png?raw=true)

### Oznámení o nalezení předmětu na trhu

Po uložení nastavení bude skript každých 10 minut skenovat trh a v případě nalezení požadovaného předmětu zobrazí upozornění. Klikem na vyhledaný název předmětu budete přesměrovaní přímo na trh (funguje jen, pokud máte domovské město).

![The West Market Scanner Menu Icon](https://github.com/Deprivant/tw-market-scanner/blob/main/docs/twms-results-image.png?raw=true)

Skript umí rozlišit svět, ve kterém hrajete a pro každý má své nastavení.
