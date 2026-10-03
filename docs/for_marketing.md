無理な宣伝をせず自然と広めるための仕組み作り

## 1. SEO関連事項
- [ ] sitemap.xml, robots.txtコード対応済み。反映確認のみ（渚）
- [ ] GA4導入済み。コンバージョン設定などいつかする（渚）
 
## 2. シェアしやすくする 
※ ボタンが増えてUIがくちゃくちゃにならないように配慮
- [ ] ⭐︎ ブログパーツ化。
    - CodePenのようなミニマルな仕組みをプレビュー機能込みでiframe？で作って攻略サイトなどでの利用を促進する
- [x] ⭐︎ LoadStoneに貼り付けやすいHTMLコードのコピー機能。→ 詳細ページ（公開中のみ）に「Lodestone用にコピー」。タイトルのリンク行＋`[hb]` で畳んだ説明文と構文ハイライト付き本文＋末尾にサイトへのリンク（形は下の sample）（`src/lib/share/lodestone.ts`）
    - [x] 使えるタグの調査
    - 実機で確認済み：`[` `<` `>` `&lt;` はそのまま表示される。`[hb]` の中はダークテーマでも背景が明るいため、色は明るい背景用に固定している。文字数は 10000 まで（改行は 1 文字）。未確認：`[hb]` のタイトル指定
- [ ] X(Twitter)で共有したくなる仕組み（共有ボタンで十分かもしれないので優先度低）

## 3. マクロ関連ナレッジ記事公開
主にSEO目的で渚が書く。ネタは豊富だが飽きる可能性はあるので低優先度だし目立たなくていい。
- [ ] mdから展開する程度の簡易的なCMSの仕組み
- [ ] SEOキーワード調査とか（渚）
- [ ] そもそもどのくらいの流入が見込めそうかの調査／収益化するかの検討（渚）

## 4. マクロ付随情報強化（主に製作マクロ）
他のサイトから引っ張りやすいデータをJSONで取り出せるAPIかなんかを用意しておくとerionesみたいなサイトと連携できるかも（重いし最低優先度）
マクロ例）https://macro.eocl.me/macros/tmvecmtx
- [ ] 前提適正レベルの保持（例：Lv.50まで／Lv.90以上）
- [ ] 必要ステータスの保持（例：作業精度・加工精度・CP）
- [ ] 前提条件の保持（例：食事なし、薬なし、HQ素材なし）
- [ ] 可能性のあるマクロ実行結果の保持：（例：HQ率78%）
- [ ] 戦闘マクロでも同じような需要がありそうかの調査（渚）

## 5. Claude からの提案（未検討・渚さんの取捨選択待ち）
どれも「ボタンを増やさない」前提。共有まわりは、詳細ページの共有ボタン（`ShareMacroButton`）を小さなメニューにして、URL／X／埋め込み／Lodestone をそこに畳む案。
- [ ] 共有 URL（`/?m=`）を Discord などに貼ったときのカード。公開マクロは `opengraph-image` があるが、エディタの共有 URL は静的な画像のはず。FF14 の相談は Discord が主戦場なので効きやすい。ただし `?m=` を読むとトップが動的描画になる。サーバーでの検証と同じ解析入口を通す必要あり。
- [ ] 雛形から始める（食事・薬の通知、レイドの挨拶、製作マクロなど）。初見の人が空のエディタで固まらない。公開マクロの「アレンジ」導線がすでにあるので、人気・定番の公開マクロへの入口でもよい。
- [x] タグ別の一覧ページ（`/macros/tag/…`）。実装済み：公開マクロが 2 件以上のタグだけ index・sitemap に載せる（薄いページを増やさないため。基準は `lib/published-macros/tags.ts`）。コマンド別は未着手。検索で入った人の着地点になり、ロングテールの SEO にも効く。いまはタグが検索クエリ（`?q=#タグ`）なので、検索エンジンには 1 ページに見えている。
- [ ] 新着公開マクロの RSS／Atom。攻略サイトの運営者や、Discord の RSS 連携で購読できる。実装は軽い。
- [ ] 詳細ページの構造化データ（JSON-LD）。マクロ名・説明・作者・更新日を検索結果に出しやすくする。効果は検索側しだいで保証なし。

----------------
LoadStoneで使えるタグ :
[size=10]small[/size]
[size=12]middle[/size]
[size=18]large[/size]
[size=32]extra large[/size]
[color=#FF6699]color[/color]
[b]strong[/b]
[i]italic[/i]
[u]underline[/u]
[s]strike[/s]
[left]left[/left]
[center]center[/center]
[right]right[/right]
[url=https://macro.eocl.me/]link[/url]
[hb]accordion[/hb]

### sample
```
[size=14][b][url=http://localhost:3000/macros/tmvecmtx]Lv91~95耐久40(CP489)[/url][/b][/size]　[size=10]FF14マクロヘルパーで開きます[/size]
[hb][color=#505063]15行マクロです。ピーコック装備マテリアなしでも〇
確信始まりですが最終確認入れてるので一発でできることなないです。[/color]
[color=#1d4ed8]/ac[/color] 確信 [color=#be185d]<wait.3>[/color]
[color=#1d4ed8]/ac[/color] マニピュレーション [color=#be185d]<wait.2>[/color]
[color=#1d4ed8]/ac[/color] ヴェネレーション [color=#be185d]<wait.2>[/color]
[color=#1d4ed8]/ac[/color] 最終確認 [color=#be185d]<wait.2>[/color]
[color=#1d4ed8]/ac[/color] 長期倹約 [color=#be185d]<wait.2>[/color]
[color=#1d4ed8]/ac[/color] 下地作業 [color=#be185d]<wait.3>[/color]
[color=#1d4ed8]/ac[/color] イノベーション [color=#be185d]<wait.2>[/color]
[color=#1d4ed8]/ac[/color] 下地加工 [color=#be185d]<wait.3>[/color]
[color=#1d4ed8]/ac[/color] 下地加工 [color=#be185d]<wait.3>[/color]
[color=#1d4ed8]/ac[/color] 下地加工 [color=#be185d]<wait.3>[/color]
[color=#1d4ed8]/ac[/color] 下地加工 [color=#be185d]<wait.3>[/color]
[color=#1d4ed8]/ac[/color] イノベーション [color=#be185d]<wait.2>[/color]
[color=#1d4ed8]/ac[/color] グレートストライド [color=#be185d]<wait.2>[/color]
[color=#1d4ed8]/ac[/color] ビエルゴの祝福 [color=#be185d]<wait.3>[/color]
[color=#1d4ed8]/ac[/color] 作業 [color=#be185d]<wait.3>[/color]
[/hb][right][url=http://localhost:3000/]« FF14マクロヘルパーで作成[/url][/right]
```
### sample code (変数名は適当です)
```
[size=14][b][url={SITE_URL}/macros/tmvecmtx]{macro_title}[/url][/b][/size]　[size=10]{BRAND_NAME}で開きます[/size]
[hb]{description}
{macrobody}
[/hb][right][url=http://localhost:3000/]« {BRAND_NAME}で作成[/url][/right]
```
