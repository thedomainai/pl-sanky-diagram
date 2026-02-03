# 決算短信 P/L Sankey Analyzer

決算短信PDFを解析し、損益計算書（P/L）データを抽出 → Sankey Diagram用テーブル生成 → Excel出力 → Sankey Diagram可視化を行います。

## 引数

$ARGUMENTS に決算短信PDFのファイルパスが指定されている場合はそれを使用。
未指定の場合はユーザーにPDFパスを質問してください。

## 実行手順

### Step 0: 環境確認とサーバー起動

1. kessan-analyzerプロジェクトの存在確認:
```bash
ls ~/workspace/obsidian_vault/kessan-analyzer/package.json
```

2. 依存パッケージのインストール確認:
```bash
cd ~/workspace/obsidian_vault/kessan-analyzer && npm ls @anthropic-ai/sdk 2>/dev/null || npm install
```

3. 空きポートを探してdevサーバー起動（バックグラウンド）:
```bash
for port in 3000 3001 3002 3003 3004 3005; do
  lsof -i :$port -t 2>/dev/null || { echo "FREE:$port"; break; }
done
```
```bash
PORT=<空きポート> npm run dev &
```

4. サーバーの起動完了を待機（数秒）

### Step 1: PDFからP/Lデータ抽出

指定されたPDFファイルをAPIに送信:

```bash
curl -s -X POST http://localhost:<port>/api/extract-pl \
  -F "pdf=@<PDFパス>" \
  | jq .
```

**エラー処理:**
- セグメント情報が見つからない場合 → ユーザーに通知し、PDFの内容を確認するか別のPDFを指定するよう案内
- APIエラー → エラーメッセージを表示

### Step 2: セグメント情報確認

抽出結果から `segments` を表示:

```
セグメント別売上高:
| セグメント | 前期 | 当期 |
|-----------|------|------|
| xxx | xxx百万円 | xxx百万円 |
```

セグメントが空の場合は「セグメント情報が見つかりませんでした」とエラーを返す。

### Step 3: Sankey Table生成

抽出したP/LデータをSankey Diagram用テーブルに変換。以下の処理を実施:

1. **単位換算**: 百万円 → 億円（÷100）
2. **前期/当期の列を保持**
3. **加算要素の調整**:
   - 経常利益 = 営業利益 - 営業外費用 + 営業外収益
     → 営業利益→経常利益 フローから営業外収益分を差し引き
   - 税引前利益 = 経常利益 - 特別損失 + 特別利益
     → 経常利益→税引前利益 フローから特別利益分を差し引き

結果をテーブル形式で表示:

```
| Source | Target | Amount This Year | Amount Last Year |
|--------|--------|-----------------|-----------------|
```

### Step 4: Excel出力

P/LデータをExcelに出力:

```bash
curl -s -X POST http://localhost:<port>/api/export-excel \
  -H "Content-Type: application/json" \
  -d '{"plData": <抽出データ>}' \
  -o "<会社名>_<期間>_PL.xlsx"
```

出力先をユーザーに通知。

### Step 5: Sankey Diagram表示

ブラウザでSankey Diagramを確認するようユーザーに案内:

```
Sankey Diagramは以下のURLで確認できます:
http://localhost:<port>

PDFをアップロードするか、すでに抽出済みのデータが表示されています。
```

### Step 6: 結果サマリー

以下の情報を表示:

```
✓ 決算短信分析完了

会社名: xxx
対象期間: xxx
連結/単体: xxx

■ セグメント数: x件
■ P/L項目: 13科目（前期・当期）
■ Sankey Table: x行
■ Excel出力: <ファイルパス>
■ Sankey Diagram: http://localhost:<port>
```

## 注意事項

- ANTHROPIC_API_KEY が `.env.local` に設定されていること
- PDFは20MB以下であること
- セグメント情報が含まれない決算短信はエラーになります
