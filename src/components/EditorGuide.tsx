import styles from './EditorGuide.module.scss'

// エディタの使い方（ページ下部のアコーディオン）。非エンジニア向けに、キー操作とこのエディタ特有の挙動、文字色の凡例を説明する。
// 色は MacroWorkbench と同じ表（styles/_mixins.scss の $highlight-tones）から作る。
const COLOR_LEGEND: { kind: string; sample: string; meaning: string }[] = [
  { kind: 'command-known', sample: '/p', meaning: '対応しているコマンド' },
  { kind: 'command-known-emote', sample: '/smile', meaning: 'エモート（表情・動作）のコマンド' },
  { kind: 'command-unknown', sample: '/pp', meaning: '辞書にないコマンド。打ち間違いかもしれません（黄色の波線つき）' },
  { kind: 'arg-string', sample: '"アクション名"', meaning: '引用符で囲んだ文字列（アクション名など）' },
  { kind: 'arg-number', sample: '3', meaning: '数字' },
  { kind: 'arg-placeholder', sample: '<t>', meaning: '代名詞（ターゲットや自分など、対象をあらわす記号）' },
  { kind: 'arg-placeholder-wait', sample: '<wait.3>', meaning: '待ち・効果音の指定（<wait.3>、<se.1> など）' },
  { kind: 'arg-placeholder-invalid', sample: '<xx>', meaning: '存在しない代名詞（波線つき）' },
  { kind: 'fullwidth-space', sample: '　', meaning: '全角スペース。見つけやすいよう赤い背景で示します' },
]

export function EditorGuide() {
  return (
    <details className={styles.guide}>
      <summary className={styles.summary}>エディタの使い方</summary>
      <div className={styles.body}>
        <section>
          <h2 className={styles.heading}>書きはじめ</h2>
          <ul className={styles.list}>
            <li>マクロは「/」から書きはじめます。最初の行には、あらかじめ「/」が入っています。</li>
            <li>Enter で次の行へ進むと、新しい行にも「/」が自動で入ります。</li>
            <li>「/」だけの行でもう一度 Enter を押すと、「/」が消えて空の行になります。</li>
            <li>15 行・1 行 180 文字（半角換算）をこえる入力はできません。</li>
          </ul>
        </section>

        <section>
          <h2 className={styles.heading}>コマンドの候補（サジェスト）</h2>
          <ul className={styles.list}>
            <li>「/」のあとに文字を打つと、当てはまるコマンドの候補が右側に出ます。短縮名でも探せます。</li>
            <li>↑ ↓ で候補を選び、Tab か Enter で決定します。候補を閉じたいときは Esc です。</li>
            <li>候補をクリックすると説明と引数の書き方が開きます。ダブルクリックで、その候補を挿入します。</li>
            <li>右側の検索欄からも、コマンドを名前・短縮名・説明で探せます。</li>
          </ul>
        </section>

        <section>
          <h2 className={styles.heading}>代名詞の補完</h2>
          <ul className={styles.list}>
            <li>&lt;t&gt; や &lt;me&gt; のような代名詞は、「&lt;」を打たずに t・me と入力しても候補が出ます。</li>
            <li>Tab か Enter で決定すると、&lt;t&gt; の形に展開されます。</li>
            <li>&lt;pos&gt;（いる場所と座標）は、チャットなどどのコマンドでも使えます。po まで打つと候補が出ます。</li>
          </ul>
        </section>

        <section>
          <h2 className={styles.heading}>Tab とキーボード操作</h2>
          <ul className={styles.list}>
            <li>エディタの中の Tab は、候補の決定に使います。そのため、そのままでは次のボタンへ移れません。</li>
            <li>候補が出ていないときに Esc を押してから Tab を押すと、エディタの外へ移れます。</li>
            <li>ショートカット：Ctrl+Alt+C でマクロテキストをコピー、Ctrl+Alt+S で共有URLをコピー、Ctrl+Alt+P で動作プレビュー（Mac は Ctrl と Option を同時に押します）。</li>
          </ul>
        </section>

        <section>
          <h2 className={styles.heading}>動作プレビュー</h2>
          <ul className={styles.list}>
            <li>マクロを実行したときのチャットログを、ゲーム画面に近い形で見られます。</li>
            <li>あくまで簡易的なプレビューです。ゲーム内で同じ結果になることは保証しません。再現できない行には警告マークが付きます。</li>
          </ul>
        </section>

        <section>
          <h2 className={styles.heading}>エディタの文字色</h2>
          <ul className={styles.legend}>
            {COLOR_LEGEND.map((item) => (
              <li key={item.kind} className={styles.legendItem}>
                <code className={styles.sample} data-kind={item.kind}>{item.sample}</code>
                <span>{item.meaning}</span>
              </li>
            ))}
          </ul>
          <p className={styles.note}>
            行の文字数や行数が上限をこえたときは、その行全体に波線が付きます。カーソルのある行の問題は、エディタの下に文章でも表示されます。
          </p>
        </section>
      </div>
    </details>
  )
}
