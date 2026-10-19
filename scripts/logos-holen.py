#!/usr/bin/env python3
"""Einmalig: Quellen-Icons nach public/logos laden und src/data/medien-logos.json schreiben.
Neue Quelle: unten in QUELLEN ergänzen (key: Domain), Medium in MEDIEN auf key abbilden, Skript neu laufen lassen."""
import json, urllib.request, os, sys
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
QUELLEN={
"nzz":"nzz.ch","srf":"srf.ch","rts":"rts.ch","rsi":"rsi.ch","20min":"20min.ch","3fach":"3fach.ch",
"az":"aargauerzeitung.ch","tagesanzeiger":"tagesanzeiger.ch","bajour":"bajour.ch","beobachter":"beobachter.ch",
"blick":"blick.ch","bzbasel":"bzbasel.ch","riehener":"riehener-zeitung.ch","3sat":"3sat.de",
"demokratie":"demokratie.ch","rabe":"rabe.ch","fazetten":"fazetten.ch","kleinreport":"kleinreport.ch",
"lecourrier":"lecourrier.ch","letemps":"letemps.ch","luzernerzeitung":"luzernerzeitung.ch","ccc":"ccc.de",
"medienwoche":"medienwoche.ch","moneta":"moneta.ch","nerdfunk":"nerdfunk.ch","spotify":"spotify.com",
"persoenlich":"persoenlich.com","publiceye":"publiceye.ch","republik":"republik.ch","schweizermonat":"schweizermonat.ch",
"socialmediagipfel":"socialmediagipfel.ch","tagblatt":"tagblatt.ch","tdg":"tdg.ch","telebasel":"telebasel.ch",
"philanthropist":"thephilanthropist.ch","teletop":"toponline.ch","tsri":"tsri.ch","watson":"watson.ch","woz":"woz.ch",
"zeit":"zeit.de","swissinfo":"swissinfo.ch","radio24":"radio24.ch","radiomunot":"radiomunot.ch","apropos":"tagesanzeiger.ch",
}
# Medium (exakt) -> key; sonst Prefix-Regeln; sonst Domain
MEDIEN={"20 Minuten":"20min","Radio 3FACH":"3fach","Aargauer Zeitung":"az","CH Media":"az","Tages-Anzeiger Apropos":"tagesanzeiger",
"Bajour":"bajour","Bajour (Video-Podcast)":"bajour","Beobachter":"beobachter","Blick":"blick","bz Basel":"bzbasel",
"Das Magazin":"tagesanzeiger","Riehener Zeitung":"riehener","3sat Kulturzeit":"3sat","Stiftung für direkte Demokratie / demokratie.ch":"demokratie",
"Radio RaBe":"rabe","Fazetten":"fazetten","Klein Report":"kleinreport","Le Courrier":"lecourrier","Le Temps":"letemps",
"Luzerner Zeitung":"luzernerzeitung","Winterkongress Digitale Gesellschaft":"ccc","Medienwoche":"medienwoche","moneta":"moneta",
"Nerdfunk / Radio Stadtfilter":"nerdfunk","Digital Sensemaker (Podcast)":"spotify","Digitalsalat (Podcast, dezentrum)":"spotify",
"Rendez-vous am Chuchitisch (Podcast)":"spotify","persoenlich.com":"persoenlich","Public Eye Magazin":"publiceye","Republik":"republik",
"Schweizer Monat":"schweizermonat","Social Media Gipfel Zürich":"socialmediagipfel","St. Galler Tagblatt":"tagblatt",
"Tribune de Genève":"tdg","Telebasel":"telebasel","Telebasel punkt6 thema":"telebasel","The Philanthropist":"philanthropist",
"Tele TOP":"teletop","Tsüri":"tsri","Watson":"watson","watson":"watson","WOZ":"woz","DIE ZEIT":"zeit","SWI swissinfo":"swissinfo",
"Radio 24":"radio24","Radio Munot":"radiomunot","Tages-Anzeiger":"tagesanzeiger","NZZ":"nzz","NZZ am Sonntag":"nzz",
"RTS":"rts","RTS 19h30":"rts","RSI Info":"rsi"}
if "--json-only" not in sys.argv:
    for k,dom in QUELLEN.items():
        p=f"{ROOT}/public/logos/{k}.png"
        if os.path.exists(p): continue
        try:
            req=urllib.request.Request(f"https://www.google.com/s2/favicons?domain={dom}&sz=64",headers={"User-Agent":"Mozilla/5.0"})
            open(p,"wb").write(urllib.request.urlopen(req,timeout=20).read()); print("ok",k)
        except Exception as e: print("FEHLT",k,e)
json.dump({"quellen":sorted(QUELLEN),"medien":MEDIEN,"praefix":{"SRF":"srf","SF ":"srf","RTS":"rts"}},open(f"{ROOT}/src/data/medien-logos.json","w"),ensure_ascii=False,indent=1)
