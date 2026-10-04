import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

	// C#ファイルで補完候補を表示する
	const provider = vscode.languages.registerCompletionItemProvider(
		{ language: 'plaintext' },

		{
			provideCompletionItems(
				document: vscode.TextDocument,
				position: vscode.Position
			) 
			{

				//表示予定
				const candidates = 
				[
					'MyFunction',
					'MyCharacter',
					'MyTest'
				];

				// 候補をVS Code用の形式に変換
				return candidates.map(name => {

					const item = new vscode.CompletionItem(
						name,
						vscode.CompletionItemKind.Function
					);

					// 候補の説明
					item.detail = 'My CSharp Helper';

					return item;
				});
			}
		}
	);

	// 拡張機能終了時に補完機能も解除する
	context.subscriptions.push(provider);

	console.log('My CSharp Helper is now active!');
}

export function deactivate() {}