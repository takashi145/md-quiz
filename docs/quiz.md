---
title: JavaScript基礎クイズ
---

## `typeof null` の結果は？
- [ ] `"null"`
- [ ] `"undefined"`
- [x] `"object"`

## 以下のコードの出力は？

```js
console.log(1 + "2");
```

- [ ] `3`
- [x] `"12"`
- [ ] エラー

## JavaScript で配列かどうかを正しく判定する方法は？
- [ ] `typeof arr === "array"`
- [x] `Array.isArray(arr)`
- [ ] `arr instanceof Object`

## 以下のコードを実行したとき、`x` の値は？

```js
const x = [1, 2, 3].find(n => n > 1);
```

- [ ] `[2, 3]`
- [x] `2`
- [ ] `undefined`

## `Promise.all` の動作として正しいのは？

引数に渡した Promise のいずれかが reject されたとき：

- [ ] 他の Promise の完了を待ってから reject する
- [x] 即座に reject する
- [ ] reject を無視して残りの Promise を処理する
