# Flow Count

Meditasyon, nefes çalışması ve genel takip için sade, dikkat dağıtmayan bir mobil sayaç uygulaması (iOS ve Android). Ekranın herhangi bir yerine dokunmak sayıyı bir artırır.

React Native + [Expo](https://expo.dev) (SDK 58) ve TypeScript ile yazılır.

## Gereksinimler

- Node.js 22.13+ (ya da 24.3+)
- iOS için Xcode
- Android için Android Studio

## Çalıştırma

```bash
npm install
npm run ios
```

`npm run ios` yerel iOS projesini üretir, derler ve simülatörde ya da bağlı cihazda açar; geliştirme sunucusu da başlar ve koddaki değişiklikler uygulamaya anında yansır. Android için `npm run android` kullanılır. Bu komut Java ister; sistemde Java yoksa Android Studio'nun Java'sı gösterilebilir:

```bash
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
```

`ios/` ve `android/` klasörleri depoya girmez: her derlemede `app.json`'dan yeniden üretilir (Continuous Native Generation). Yerel ayarlar bu klasörlerde değil, `app.json` ve Expo eklentileriyle yapılır.

| Komut               | Açıklama                                                              |
| ------------------- | --------------------------------------------------------------------- |
| `npm run ios`       | iOS geliştirme derlemesi; simülatörde ya da cihazda çalıştırır        |
| `npm run android`   | Aynısını Android için yapar                                           |
| `npm start`         | Yalnızca geliştirme sunucusunu başlatır (yüklü geliştirme derlemesi için) |
| `npm run typecheck` | TypeScript denetimi                                                   |
| `npm run lint`      | Oxlint                                                                |

Geliştirme sunucusu olmadan çalışan bir derleme için: `npx expo run:ios --configuration Release` ya da `npx expo run:android --variant release`.

## Kullanım

- **Dokunma:** Ekranın herhangi bir yerine dokun.
- **Dokunsal geri bildirim:** Her sayımda hafif bir tık; iOS'ta Taptic Engine'in en hafif darbesi, Android'de sistemin tuş basma geri bildirimi.
- **Erişilebilirlik:** Sayma yüzeyi VoiceOver ve TalkBack için "Sayacı artır" adlı tek bir düğmedir; odaklanınca güncel sayı okunur, her yeni değer duyurulur. Harici klavyede Tab ile odaklanıp Enter ya da Boşluk ile sayılır; Android'de kenarda bir odak çerçevesi, iOS'ta Tam Klavye Erişimi'nin kendi çerçevesi görünür.

## Proje yapısı

| Yol                                 | İçerik                                                                    |
| ----------------------------------- | ------------------------------------------------------------------------- |
| `src/App.tsx`                       | Sayaç durumu ve dokunsal geri bildirim                                    |
| `src/components/CounterSurface.tsx` | Tam ekran sayma yüzeyi, sayı ve ipucu                                     |
| `src/lib/`                          | Dokunsal geri bildirim ve "Hareketi Azalt" yardımcıları                    |
| `src/theme.ts`                      | Renkler                                                                   |
| `app.json`                          | Uygulama adı, kimliği (`com.deeprionlabs.flowcount`), açılış ekranı, yönler |

## Yol haritası

- [x] Step 1: Ana ekran, dokunarak sayma, dokunsal geri bildirim, erişilebilirlik
- [ ] Step 2: Dokunulan noktada parçacıklar, parıltı ve ölçek animasyonu
- [ ] Step 3: Gizli ayarlar paneli, hedef, tur sayacı, artırma/azaltma, sıfırlama
- [ ] Step 4: Cyberpunk, Zen ve Minimal temaları
