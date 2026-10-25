# Flow Count

Meditasyon, nefes çalışması ve genel takip için sade, dikkat dağıtmayan bir mobil sayaç uygulaması (iOS ve Android). Ekranın herhangi bir yerine dokunmak sayıyı bir artırır.

Arayüz React + TypeScript + Vite + Tailwind CSS ile yazılır; [Capacitor](https://capacitorjs.com) ile yerel iOS ve Android uygulamasına paketlenir.

## Gereksinimler

- Node.js 20.19+ veya 22.12+
- iOS için Xcode
- Android için Android Studio

## Çalıştırma

```bash
npm install
npm run ios
```

`npm run ios` arayüzü derler, `ios/` projesine aktarır ve uygulamanın hangi simülatörde ya da cihazda açılacağını sorar. Android için `npm run android` kullanılır. Bu komut Java ister; sistemde Java yoksa Android Studio'nun Java'sı gösterilebilir:

```bash
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
```

Projeyi Xcode ya da Android Studio'da açmak için `npx cap open ios` veya `npx cap open android`. Gerçek bir iPhone'a yüklemek için Xcode'da **Signing & Capabilities** altından geliştirici ekibi seçilmelidir.

| Komut             | Açıklama                                                         |
| ----------------- | ---------------------------------------------------------------- |
| `npm run ios`     | Derler, iOS projesine aktarır, simülatörde ya da cihazda çalıştırır |
| `npm run android` | Aynısını Android için yapar                                      |
| `npm run build`   | Tür denetimi ve arayüz derlemesi (`dist/`)                       |
| `npm run lint`    | Oxlint                                                           |

Arayüzdeki değişiklikler yerel projelere `npm run build && npx cap sync` ile (ya da doğrudan `npm run ios` / `npm run android` ile) aktarılır.

## Kullanım

- **Dokunma:** Ekranın herhangi bir yerine dokun.
- **Dokunsal geri bildirim:** Her sayımda hafif bir titreşim; iOS'ta Taptic Engine'in en hafif darbesi, Android'de kısa ve düşük şiddetli bir titreşim.
- **Erişilebilirlik:** Sayma yüzeyi VoiceOver ve TalkBack için "Sayacı artır" adlı tek bir düğmedir; yeni değer otomatik okunur. Harici klavyede Boşluk veya Enter ile sayılır, odaklanınca ekran kenarında bir çerçeve görünür; basılı tutulan tuş yalnızca bir kez sayar.

## Proje yapısı

| Yol                   | İçerik                                                           |
| --------------------- | ---------------------------------------------------------------- |
| `src/`                | Uygulama arayüzü (React)                                         |
| `ios/`, `android/`    | Capacitor'ın yerel iOS ve Android projeleri                      |
| `capacitor.config.ts` | Uygulama kimliği (`com.deeprionlabs.flowcount`), adı, yerel ayarlar |

## Yol haritası

- [x] Step 1: Ana ekran, dokunarak sayma, dokunsal geri bildirim, erişilebilirlik
- [ ] Step 2: Dokunulan noktada parçacıklar, parıltı ve ölçek animasyonu
- [ ] Step 3: Gizli ayarlar paneli, hedef, tur sayacı, artırma/azaltma, sıfırlama
- [ ] Step 4: Cyberpunk, Zen ve Minimal temaları
