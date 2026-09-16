#!/usr/bin/env python3
"""Reproducibly cut the supplied police-academy environment sprite sheets."""
from __future__ import annotations
import argparse
import base64
import io
from pathlib import Path

EXPECTED_SIZE = (1536, 1024)
SHEETS = {
 "locations": {
  "locations/police-academy":(8,11,505,435), "locations/interrogation-room":(519,11,1017,435),
  "locations/office":(1030,11,1528,435), "locations/evidence-room":(8,448,505,823),
  "locations/parking-lot":(519,448,1017,823), "locations/hallway":(1030,448,1528,823),
  "rooms/police-academy":(10,14,503,381), "rooms/interrogation-room":(522,14,1014,381),
  "rooms/office":(1033,14,1525,381), "rooms/evidence-room":(10,451,503,771),
  "rooms/parking-lot":(522,451,1014,771), "rooms/hallway":(1033,451,1525,771),
 },
 "location-atlas": {
  "icons/location-token-academy":(14,15,65,66), "icons/location-token-interrogation":(300,15,351,66),
  "icons/location-token-office":(552,15,603,66), "icons/location-token-evidence":(814,15,865,66),
  "icons/location-token-parking":(1045,15,1096,66), "icons/location-token-hallway":(1295,15,1346,66),
  "locations/police-academy-wide":(10,357,247,476), "locations/interrogation-room-wide":(258,357,513,476),
  "locations/office-wide":(524,357,762,476), "locations/evidence-room-wide":(774,357,1014,476),
  "locations/parking-lot-wide":(1026,357,1280,476), "locations/hallway-wide":(1292,357,1526,476),
  "ui/paper-panel":(18,669,137,838), "ui/evidence-board":(813,667,939,764),
  "props/security-camera":(859,779,910,830), "props/archive-box":(487,781,537,832),
  "props/evidence-bag":(707,782,759,832), "props/desk-lamp":(738,781,802,832),
  "props/filing-cabinet":(1461,674,1515,846), "props/plant":(1442,665,1486,757),
  "icons/academy-crest":(96,948,172,1006), "icons/security-camera":(180,948,257,1006),
  "icons/archive":(569,948,643,1006), "icons/vehicle":(1103,948,1183,1006), "icons/door":(1315,948,1394,1006),
 }
}

def locate(root:Path, stem:str)->Path:
 for ext in ('.png','.jpg','.jpeg','.webp'):
  p=root/(stem+ext)
  if p.exists(): return p
 raise FileNotFoundError(f'Missing {stem} sheet in {root}')

def main()->None:
 ap=argparse.ArgumentParser(); ap.add_argument('--source',type=Path,default=Path('source-assets')); ap.add_argument('--output',type=Path,default=Path('assets')); a=ap.parse_args()
 for sheet, cuts in SHEETS.items():
  im=Image.open(locate(a.source,sheet)).convert('RGB')
  if im.size != EXPECTED_SIZE: raise ValueError(f'{sheet} is {im.size}; expected {EXPECTED_SIZE}')
  for name,box in cuts.items():
   out=a.output/(name+'.svg'); out.parent.mkdir(parents=True,exist_ok=True)
   crop=im.crop(box); buffer=io.BytesIO(); crop.save(buffer,'PNG',optimize=True)
   encoded=base64.b64encode(buffer.getvalue()).decode('ascii')
   svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {crop.width} {crop.height}" width="{crop.width}" height="{crop.height}"><image width="{crop.width}" height="{crop.height}" href="data:image/png;base64,{encoded}"/></svg>\n'
   out.write_text(svg,encoding='ascii')
   print(f'{out} <- {box}')
if __name__=='__main__': main()
