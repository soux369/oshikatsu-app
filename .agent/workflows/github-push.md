---
description: ローカルプロジェクトをGitHubにアップロードする方法
---

以下の手順で、ローカルにあるプロジェクトをGitHubにアップロード（プッシュ）できます。

### 1. GitHubで新しいレポジトリを作成する
1. [GitHub](https://github.com/new) にアクセスします。
2. **Repository name** に `oshikatsu-app` と入力します。
3. **Public**（公開）か **Private**（非公開）を選択します（GitHub Actionsを使う場合はどちらでもOKです）。
4. **Create repository** ボタンを押します。

### 2. ローカルでGitを初期化してプッシュする
ターミナル（PowerShellなど）を開き、プロジェクトのディレクトリで以下のコマンドを順番に実行してください。

```powershell
# 1. Gitの初期化
git init

# 2. 全ファイルをステージング
git add .

# 3. 最初のコミット
git commit -m "Initial commit"

# 4. メインブランチに切り替え
git branch -M main

# 5. リモートレポジトリの登録（<username>を自分のGitHubユーザー名に書き換えてください）
git remote add origin https://github.com/<username>/oshikatsu-app.git

# 6. GitHubにアップロード
git push -u origin main
```

### 3. 次に行うこと
アップロードが完了したら、前のメッセージでお伝えした「APIキーの登録」と「URLの設定」を行ってください。
