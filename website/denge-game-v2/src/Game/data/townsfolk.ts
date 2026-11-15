/**
 * Townsfolk — background residents who stroll along the sidewalks so the
 * town feels lived in. They are not quest NPCs: walking up and pressing E
 * makes them stop, turn and say one short line about the town's water.
 *
 * Sheets are 4 frames (front, right, back, left) like the story NPCs.
 */
import { TextureKeys, type TextureKey } from './assets';

export interface Townsperson {
  id: string;
  name: string;
  texture: TextureKey;
  /** Waypoints walked in a loop (world px, feet position). */
  path: readonly (readonly [number, number])[];
  /** Pixels per second. */
  speed: number;
  /** Seconds to idle at each waypoint. */
  pause: number;
  lines: readonly string[];
}

export const TOWNSFOLK: readonly Townsperson[] = [
  {
    id: 'mother-avenue',
    name: 'Selin Hanım',
    texture: TextureKeys.TOWNS_MOTHER,
    path: [[1560, 893], [2190, 893]],
    speed: 42,
    pause: 2.5,
    lines: [
      'Bulaşığı akan suyun altında değil, leğende yıkıyorum artık.',
      'Pazardan dönüyorum. Bu sıcakta çeşmeler bile yorgun görünüyor!',
      'Çocuklara dişlerini fırçalarken musluğu kapatmayı öğrettim.',
    ],
  },
  {
    id: 'boy-playground',
    name: 'Can',
    texture: TextureKeys.TOWNS_BOY,
    path: [[230, 1690], [500, 1690], [500, 1730], [230, 1730]],
    speed: 55,
    pause: 1.2,
    lines: [
      'Kaydıraktan on kere kaydım! Sen de gel!',
      'Öğretmenimiz suyun döngüsünü anlattı, yağmur bulut olup geri geliyormuş.',
      'Parkın çimleri yine sulanmış, ama yol da ıslak olmuş…',
    ],
  },
  {
    id: 'man-civic',
    name: 'Ahmet Bey',
    texture: TextureKeys.TOWNS_MAN,
    path: [[920, 1700], [1480, 1700]],
    speed: 38,
    pause: 3,
    lines: [
      'Gazete yazıyor: barajın seviyesi geçen yıldan düşükmüş.',
      'Belediyenin su planını merak ediyorum, toplantıya katılacağım.',
      'Benim bahçem için damla sulama düşünüyorum, sence değer mi?',
    ],
  },
  {
    id: 'teen-north',
    name: 'Zeynep',
    texture: TextureKeys.TOWNS_TEEN,
    path: [[1420, 772], [2210, 772]],
    speed: 48,
    pause: 2,
    lines: [
      'Okulda su tasarrufu kulübü kurduk, sen de katılır mısın?',
      'Duşta şarkı bitince çıkıyorum, tam 4 dakika!',
      'Barajın yanındaki meydan çok güzel olmuş, orada buluşuyoruz.',
    ],
  },
  {
    id: 'granny-dam',
    name: 'Nermin Teyze',
    texture: TextureKeys.TOWNS_GRANNY,
    path: [[990, 600], [1180, 600], [1180, 640], [990, 640]],
    speed: 26,
    pause: 4,
    lines: [
      'Gençliğimde baraj ağzına kadar doluydu evladım.',
      'Çiçeklerimi sabah erkenden suluyorum, güneş suyu kapmasın diye.',
      'Şelalenin sesini dinlemeye geliyorum her gün.',
    ],
  },
  {
    id: 'man-farm',
    name: 'Hasan Amca',
    texture: TextureKeys.TOWNS_MAN,
    path: [[160, 1000], [160, 1420]],
    speed: 34,
    pause: 2.5,
    lines: [
      'Tarlalar susuz kalırsa ekmeğimiz de azalır.',
      'Rıza’nın damla sulama denemesini merakla bekliyorum.',
    ],
  },
  {
    id: 'mother-south',
    name: 'Ayşe Hanım',
    texture: TextureKeys.TOWNS_MOTHER,
    path: [[1700, 1592], [2200, 1592]],
    speed: 40,
    pause: 2.5,
    lines: [
      'Çamaşır makinesini tam dolmadan çalıştırmıyorum artık.',
      'Mahallede bir boru patlamış diyorlar, Nuri Usta bakacakmış.',
    ],
  },
];

export const TOWNSFOLK_TALK_RADIUS = 70;
