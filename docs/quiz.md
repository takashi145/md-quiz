---
title: JavaScript 基礎クイズ
---

## 次のコードの出力は何ですか？

```js
console.log(typeof null);
```

- [ ] `"null"`
- [ ] `"undefined"`
- [x] `"object"`

## 次のコードの出力は何ですか？

```js
console.log(0.1 + 0.2 === 0.3);
```

- [x] `false`
- [ ] `true`
- [ ] エラーになる

## `==` と `===` の違いとして正しいのは？

- [ ] `===` は値のみを比較する
- [ ] `==` は型変換を行わない
- [x] `===` は型と値の両方を比較する

## 次のコードを実行すると `x` の値はいくつですか？

```js
const x = "5" - 2;
```

- [ ] `"52"`
- [x] `3`
- [ ] `NaN`

## 配列かどうかを判定する正しい方法はどれですか？

- [ ] `typeof arr === "array"`
- [x] `Array.isArray(arr)`
- [ ] `arr.constructor === "Array"`

## `let` と `const` の違いとして正しいのは？

- [x] `const` は再代入できないが、オブジェクトのプロパティは変更できる
- [ ] `const` は値も参照も一切変更できない
- [ ] `let` はブロックスコープを持たない

## 次のコードの出力は何ですか？

```js
console.log(1 + "2" + 3);
```

- [ ] `6`
- [x] `"123"`
- [ ] `"33"`

## `Array.prototype.find` の戻り値として正しいのは？

条件に一致する要素がない場合：

- [ ] `null`
- [ ] `[]`
- [x] `undefined`

## `typeof undefined === typeof null` の評価結果は [[false]] である。

## 空欄を埋めてください。

配列の長さを取得するには arr.[[length]] を、最後の要素を取得するには arr[arr.length - [[1]]] を使います。

## `Promise.all` の動作として正しいのは？

- [ ] 渡した Promise を順番に実行する
- [x] すべての Promise が fulfilled になったとき解決される
- [ ] いずれかが fulfilled になった時点で解決される
