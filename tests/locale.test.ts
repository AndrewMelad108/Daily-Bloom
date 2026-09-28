import { test } from "node:test";
import assert from "node:assert/strict";
import { translate, TranslationKey } from "../src/locale";
import translations from "../src/translations.json";

test("every Arabic message has a nonempty English translation", () => {
  for (const key of Object.keys(translations) as TranslationKey[]) {
    assert.equal(translate("ar", key), key);
    assert.ok(translate("en", key).trim().length > 0, key);
    assert.ok(!/[\u0600-\u06ff]/.test(translate("en", key)), key);
  }
});
