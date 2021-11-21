# tw-market-scanner

## Instalace

Vytvořit v prohlížeči novou oblíbenou stránku (klasický bookmark) a jako adresu vložit:

```sh
javascript:(function(){document.body.appendChild(document.createElement('script')).src='https://deprivant.github.io/tw-market-scanner/dist/tw-market-scanner.min.js';})();
```

## Ovládaní

Po nainstalování skriptu se objeví v pravém menu nová ikonka:

![The West Market Scanner Menu Icon](./doc/twsm-menu-image.png)

Klikem na ikonku se zobrazí nastavení. Zde je možné nastavit až 10 předmětů k vyhledávání, podle názvů ( `med` najde med, ale i např. lis na med) a maximální částky za jeden kus (neplést s celkovou částku nabídky na trhu).

![The West Market Scanner Menu Icon](./doc/twsm-setting-image.png)

Po uložení nastavení bude skript každých 10 minut skenovat trh a v případě nalezení podle požadovaného nastavení zobrazí upozornění.

![The West Market Scanner Menu Icon](./doc/twsm-results-image.png)
